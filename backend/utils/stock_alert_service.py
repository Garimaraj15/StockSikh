"""
stock_alert_service.py — Real Price Alert Monitoring for StockSikh

Monitors ONLY stocks owned by users (Holding.quantity > 0) during NSE
market hours. Creates persistent PRICE_ALERT notifications when a stock's
intraday move reaches ±PRICE_ALERT_THRESHOLD_PERCENT.

Design constraints:
- No new yfinance calls: reuses fetch_live_stock_quote() from portfolio.py
- No external schedulers (no Celery, Redis, APScheduler)
- One monitoring loop for all users; one yfinance call per unique symbol
- event_fingerprint deduplication: one alert per user + symbol + IST date
- Email sent via existing send_notification_email() — failure never crashes loop
- IST market-hours guard: 09:15–15:30 Mon–Fri only
- SessionLocal() for DB (not request-scoped Depends)
"""

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import time as dt_time
from datetime import datetime

import pytz

from database.database import SessionLocal
from models.portfolio import Holding
from models.notification import Notification
from models.user import User
from routes.portfolio import fetch_live_stock_quote
from utils.email_service import send_notification_email

logger = logging.getLogger(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────

PRICE_ALERT_THRESHOLD_PERCENT = 3.0   # ±3.0 % intraday move triggers alert
MONITORING_INTERVAL_SECONDS   = 300   # 5 minutes between cycles

IST = pytz.timezone("Asia/Kolkata")
MARKET_OPEN  = dt_time(9, 15)
MARKET_CLOSE = dt_time(15, 30)

# Thread pool for running blocking email calls from async context
_email_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="price_alert_email")


# ─── Market-hours helper ──────────────────────────────────────────────────────

def is_nse_market_open() -> bool:
    """Return True if current IST time is within NSE trading hours (Mon–Fri, 09:15–15:30)."""
    now = datetime.now(IST)
    if now.weekday() >= 5:          # Saturday=5, Sunday=6
        return False
    current_time = now.time()
    return MARKET_OPEN <= current_time <= MARKET_CLOSE


def get_ist_trading_date() -> str:
    """Return the current IST calendar date as YYYY-MM-DD (used in fingerprint)."""
    return datetime.now(IST).strftime("%Y-%m-%d")


# ─── Core one-cycle function (directly testable) ──────────────────────────────

def check_price_alerts_once() -> None:
    """
    Run one complete price-alert monitoring cycle synchronously.

    Steps:
    1. Open a DB session.
    2. Collect all unique symbols across all users with active holdings.
    3. Fetch each unique symbol ONCE from fetch_live_stock_quote().
    4. For every user holding that symbol, evaluate threshold.
    5. Create Notification + send email if threshold crossed and not already notified today.
    6. Close DB session.

    Call this directly in tests. The async loop calls it via executor.
    """
    db = SessionLocal()
    try:
        trading_date = get_ist_trading_date()

        # ── Step 1: load all active holdings ──────────────────────────────────
        # Query all users who have at least one active holding
        holdings = (
            db.query(Holding)
            .filter(Holding.quantity > 0)
            .all()
        )

        if not holdings:
            logger.info("Price alert cycle: no active holdings found, skipping.")
            return

        # ── Step 2: group holdings by symbol → collect unique symbols ─────────
        # symbol → list of (user_id, holding)
        symbol_to_holdings: dict[str, list[Holding]] = {}
        for h in holdings:
            symbol_to_holdings.setdefault(h.symbol, []).append(h)

        unique_symbols = list(symbol_to_holdings.keys())
        logger.info(
            f"Price alert cycle: {len(unique_symbols)} unique symbol(s) "
            f"across {len(holdings)} holding(s)."
        )

        # ── Step 3: fetch each unique symbol ONCE ─────────────────────────────
        symbol_quotes: dict[str, dict] = {}
        for symbol in unique_symbols:
            try:
                quote = fetch_live_stock_quote(symbol)
                symbol_quotes[symbol] = quote
                logger.debug(
                    f"Quote OK: {symbol} → {quote['day_change_percent']:.2f}%"
                )
            except Exception as e:
                # One symbol failure must NOT stop others
                logger.warning(f"Quote failed for {symbol}: {type(e).__name__}: {e}")
                continue  # skip this symbol entirely this cycle

        # ── Step 4 & 5: evaluate threshold, create notifications ──────────────
        for symbol, symbol_holdings in symbol_to_holdings.items():
            quote = symbol_quotes.get(symbol)
            if quote is None:
                # fetch failed for this symbol — already logged above
                continue

            day_pct = quote["day_change_percent"]

            if abs(day_pct) < PRICE_ALERT_THRESHOLD_PERCENT:
                # Below threshold — informational skip, no log spam
                continue

            # Format direction-aware message
            sign    = "+" if day_pct >= 0 else ""
            day_str = f"{sign}{day_pct:.2f}%"

            for holding in symbol_holdings:
                user_id = holding.user_id

                try:
                    _create_price_alert_for_user(
                        db=db,
                        user_id=user_id,
                        symbol=symbol,
                        day_str=day_str,
                        trading_date=trading_date,
                    )
                except Exception as e:
                    # One user failure must NOT stop other users
                    logger.error(
                        f"Failed to create price alert for user {user_id} / "
                        f"{symbol}: {type(e).__name__}: {e}"
                    )
                    continue

    except Exception as e:
        logger.error(f"Price alert cycle top-level error: {type(e).__name__}: {e}")
    finally:
        db.close()


def _create_price_alert_for_user(
    db,
    user_id: int,
    symbol: str,
    day_str: str,
    trading_date: str,
) -> None:
    """
    Create a PRICE_ALERT Notification for one user + symbol (if not already created today).
    Send an email to User.email in a background thread.

    All errors from this function bubble up to check_price_alerts_once()
    which catches per-user.
    """
    fingerprint = f"price_alert_{user_id}_{symbol}_{trading_date}"

    # ── Deduplication ─────────────────────────────────────────────────────────
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.event_fingerprint == fingerprint,
        )
        .first()
    )
    if existing:
        return  # already notified today — no duplicate

    # ── Notification title ───────────────────────────────────────────────────
    title = f"{symbol} price alert"

    # ── Notification message (informational only) ─────────────────────────────
    message = f"{symbol} moved {day_str} today."

    # ── Action URL: portfolio page (confirmed existing route) ─────────────────
    action_url = "/portfolio"

    # ── Fetch user email from DB (never from request body) ───────────────────
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"Price alert: user_id {user_id} not found in DB — skipping.")
        return

    # ── Create Notification ───────────────────────────────────────────────────
    notif = Notification(
        user_id=user_id,
        type="PRICE_ALERT",
        title=title,
        message=message,
        is_read=False,
        action_url=action_url,
        related_entity_type="stock",
        related_entity_id=None,
        event_fingerprint=fingerprint,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    logger.info(
        f"PRICE_ALERT created: user={user_id} symbol={symbol} "
        f"day_change={day_str} date={trading_date}"
    )

    # ── Send email (in thread — never blocks the event loop or monitoring) ────
    if user.email:
        try:
            _email_executor.submit(
                send_notification_email,
                user.email,                                    # recipient — DB-derived only
                f"Price Alert: {symbol} moved {day_str}",     # subject
                title,                                         # email title
                message,                                       # email body
                "PRICE_ALERT",                                 # type for badge colour
                action_url,                                    # CTA link
            )
        except Exception as e:
            # Email failure MUST NOT prevent monitoring from continuing
            logger.error(
                f"Price alert email dispatch failed for user {user_id}: "
                f"{type(e).__name__}: {e}"
            )
    else:
        logger.info(f"Price alert: user {user_id} has no registered email — skipping email.")


# ─── Async monitoring loop (called from FastAPI lifespan) ─────────────────────

async def run_price_alerts() -> None:
    """
    Persistent async monitoring loop.

    - Runs inside the FastAPI Uvicorn process via asyncio.create_task().
    - Checks market hours before every cycle.
    - Runs check_price_alerts_once() in a thread (blocking DB + HTTP calls).
    - Sleeps MONITORING_INTERVAL_SECONDS between cycles.
    - Handles CancelledError cleanly on shutdown.
    - Never crashes on unexpected error — logs and continues.
    """
    logger.info("Price alert monitoring loop started.")

    loop = asyncio.get_event_loop()

    while True:
        try:
            if not is_nse_market_open():
                logger.debug("NSE market closed — price alert cycle skipped.")
                await asyncio.sleep(MONITORING_INTERVAL_SECONDS)
                continue

            logger.info("NSE market open — running price alert cycle.")

            # Run blocking DB + yfinance work in thread pool (non-blocking to event loop)
            await loop.run_in_executor(None, check_price_alerts_once)

        except asyncio.CancelledError:
            logger.info("Price alert monitoring loop cancelled (server shutdown).")
            raise   # re-raise so asyncio cancellation propagates cleanly

        except Exception as e:
            # Top-level guard: unexpected error must not kill the loop
            logger.error(
                f"Unexpected error in price alert loop: {type(e).__name__}: {e}"
            )

        await asyncio.sleep(MONITORING_INTERVAL_SECONDS)
