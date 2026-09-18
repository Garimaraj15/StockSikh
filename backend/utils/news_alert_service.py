"""
news_alert_service.py — Real Stock News Alerts for StockSikh

Monitors real stock news for user-relevant stocks (owned holdings with quantity > 0
UNION watchlist items). Fetches real news via yfinance, deduplicates by article ID
per user, persists NEWS_ALERT notifications, and dispatches email notifications.

Design constraints:
- Real yfinance news only: yf.Ticker(symbol).news
- Unique symbol collection across all users before fetching (rate limit protection)
- Inspects up to 3 recent articles per symbol
- Deduplication via event_fingerprint: f"news_alert_{user_id}_{symbol}_{article_id}"
- Safe error isolation at symbol, user, and article levels
- Non-blocking background monitoring integrated with FastAPI lifespan
"""

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional, Set

import yfinance as yf

from database.database import SessionLocal
from models.portfolio import Holding
from models.watchlist import Watchlist
from models.notification import Notification
from models.user import User
from utils.email_service import send_notification_email

logger = logging.getLogger(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────

MONITORING_INTERVAL_SECONDS = 900   # 15 minutes between cycles
RECENT_NEWS_LIMIT = 3               # Inspect top 3 recent articles per symbol

# Thread pool for running blocking email calls from async context
_email_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="news_alert_email")


# ─── Article Parser Helper ───────────────────────────────────────────────────

def extract_article_data(item: dict) -> Optional[dict]:
    """
    Safely extract article id, title, provider, and url from a yfinance news item.
    Supports both modern v0.2+ nested 'content' structure and legacy flat structure.
    Returns None if the item is invalid or missing an ID/title.
    """
    if not isinstance(item, dict):
        return None

    content = item.get("content", {}) if isinstance(item.get("content"), dict) else {}

    # 1. Article Unique Identifier
    article_id = content.get("id") or item.get("id") or item.get("uuid")
    if not article_id:
        return None
    article_id_str = str(article_id).strip()
    if not article_id_str:
        return None

    # 2. Title
    title = content.get("title") or item.get("title")
    if not title or not str(title).strip():
        return None
    title_str = str(title).strip()

    # 3. Provider / Publisher
    provider = None
    if isinstance(content.get("provider"), dict):
        provider = content["provider"].get("displayName")
    if not provider and item.get("publisher"):
        provider = str(item.get("publisher")).strip()

    # 4. Click-Through / Canonical URL
    url = None
    if isinstance(content.get("clickThroughUrl"), dict):
        url = content["clickThroughUrl"].get("url")
    if not url and isinstance(content.get("canonicalUrl"), dict):
        url = content["canonicalUrl"].get("url")
    if not url and item.get("link"):
        url = str(item.get("link")).strip()

    return {
        "id": article_id_str,
        "title": title_str,
        "provider": provider,
        "url": url if url and str(url).strip() else None
    }


# ─── Core One-Cycle Monitoring Function ──────────────────────────────────────

def check_news_alerts_once() -> None:
    """
    Run one complete news monitoring cycle synchronously.

    Steps:
    1. Open DB session.
    2. Query all active holdings (quantity > 0) and watchlist items.
    3. Build symbol -> set of interested user IDs.
    4. Fetch yfinance news ONCE per unique symbol.
    5. For each valid recent article, create a NEWS_ALERT for interested users if not already notified.
    6. Close DB session.
    """
    db = SessionLocal()
    try:
        # ── Step 1: Collect user-symbol relationships ─────────────────────────
        holdings = db.query(Holding).filter(Holding.quantity > 0).all()
        watchlists = db.query(Watchlist).all()

        symbol_to_users: Dict[str, Set[int]] = {}

        for h in holdings:
            if h.symbol and h.symbol.strip():
                clean_sym = h.symbol.strip().upper()
                symbol_to_users.setdefault(clean_sym, set()).add(h.user_id)

        for w in watchlists:
            if w.symbol and w.symbol.strip():
                clean_sym = w.symbol.strip().upper()
                symbol_to_users.setdefault(clean_sym, set()).add(w.user_id)

        unique_symbols = list(symbol_to_users.keys())

        if not unique_symbols:
            logger.info("News alert cycle: no active holdings or watchlists found, skipping.")
            return

        logger.info(
            f"News alert cycle: monitoring {len(unique_symbols)} unique symbol(s) "
            f"across {len(holdings)} active holding(s) and {len(watchlists)} watchlist item(s)."
        )

        # ── Step 2: Fetch and process news per unique symbol ───────────────────
        for symbol in unique_symbols:
            interested_user_ids = symbol_to_users.get(symbol, set())
            if not interested_user_ids:
                continue

            try:
                ticker = yf.Ticker(symbol)
                raw_news = ticker.news or []
            except Exception as e:
                logger.warning(f"Failed to fetch news for {symbol}: {type(e).__name__}: {e}")
                continue  # One symbol failure must NOT abort other symbols

            recent_articles = raw_news[:RECENT_NEWS_LIMIT]

            for raw_item in recent_articles:
                try:
                    article = extract_article_data(raw_item)
                    if not article:
                        # Malformed or invalid article item — skip safely
                        continue

                    for user_id in interested_user_ids:
                        try:
                            _create_news_alert_for_user(
                                db=db,
                                user_id=user_id,
                                symbol=symbol,
                                article=article,
                            )
                        except Exception as user_err:
                            logger.error(
                                f"Failed to process news alert for user {user_id} / "
                                f"{symbol} / article {article['id']}: {type(user_err).__name__}: {user_err}"
                            )
                            continue

                except Exception as article_err:
                    logger.error(
                        f"Error processing article for {symbol}: {type(article_err).__name__}: {article_err}"
                    )
                    continue

    except Exception as top_err:
        logger.error(f"News alert cycle top-level error: {type(top_err).__name__}: {top_err}")
    finally:
        db.close()


def _create_news_alert_for_user(
    db,
    user_id: int,
    symbol: str,
    article: dict,
) -> None:
    """
    Create a NEWS_ALERT Notification for a single user + symbol + article if not already notified.
    Dispatches notification email in a background worker thread.
    """
    article_id = article["id"]
    fingerprint = f"news_alert_{user_id}_{symbol}_{article_id}"

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
        return  # Already notified — skip duplicate

    # ── Title & Message formatting ────────────────────────────────────────────
    title = f"{symbol} — New market news"

    if article.get("provider"):
        message = f"{article['title']} — {article['provider']}"
    else:
        message = article["title"]

    # ── Action URL ────────────────────────────────────────────────────────────
    if article.get("url"):
        action_url = article["url"]
    else:
        action_url = f"/stock/{symbol}"

    # ── Fetch user for registered email ───────────────────────────────────────
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"News alert: user_id {user_id} not found in DB — skipping.")
        return

    # ── Create Notification ───────────────────────────────────────────────────
    notif = Notification(
        user_id=user_id,
        type="NEWS_ALERT",
        title=title,
        message=message,
        is_read=False,
        action_url=action_url,
        related_entity_type="stock_news",
        related_entity_id=None,
        event_fingerprint=fingerprint,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    logger.info(
        f"NEWS_ALERT created: user={user_id} symbol={symbol} "
        f"article_id={article_id}"
    )

    # ── Dispatch Email (Asynchronous thread) ──────────────────────────────────
    if user.email and str(user.email).strip():
        try:
            _email_executor.submit(
                send_notification_email,
                user.email.strip(),                     # recipient — DB-derived only
                f"Market News: {symbol}",               # subject
                title,                                  # title
                message,                                # body
                "NEWS_ALERT",                           # notification_type
                action_url,                             # action_url
            )
        except Exception as email_err:
            logger.error(
                f"News alert email dispatch failed for user {user_id}: "
                f"{type(email_err).__name__}: {email_err}"
            )
    else:
        logger.debug(f"News alert: user {user_id} has no registered email — skipping email.")


# ─── Async Monitoring Loop ───────────────────────────────────────────────────

async def run_news_alerts() -> None:
    """
    Persistent async background news monitoring loop.
    Runs inside the FastAPI lifespan context.
    Executes check_news_alerts_once() every MONITORING_INTERVAL_SECONDS (15 mins).
    """
    logger.info("News alert monitoring loop started.")
    loop = asyncio.get_event_loop()

    while True:
        try:
            logger.info("Running background stock news alert cycle.")
            await loop.run_in_executor(None, check_news_alerts_once)
        except asyncio.CancelledError:
            logger.info("News alert monitoring loop cancelled (server shutdown).")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in news alert loop: {type(e).__name__}: {e}")

        await asyncio.sleep(MONITORING_INTERVAL_SECONDS)
