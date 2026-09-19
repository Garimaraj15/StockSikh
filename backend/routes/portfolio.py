import json
import math
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
import yfinance as yf

logger = logging.getLogger(__name__)

from utils.email_service import send_notification_email

from database.database import get_db
from models.portfolio import Holding
from models.transaction import Transaction
from models.wallet import UserWallet
from models.user import User
from models.notification import Notification
from routes.auth import get_current_user
from routes.wallet import AVAILABLE_TASKS, get_or_create_wallet, get_wallet_balance
from models.snapshot import PortfolioSnapshot

router = APIRouter(
    prefix="/portfolio",
    tags=["Paper Trading & Portfolio"]
)

class TradeRequest(BaseModel):
    symbol: str
    quantity: int

def fetch_live_stock_quote(symbol: str) -> dict:
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d")

        if hist.empty or "Close" not in hist:
            raise ValueError("No market data available")

        # Clean Close series: remove NaN and non-finite values
        clean_closes = hist["Close"].dropna()
        valid_closes = [
            float(v) for v in clean_closes
            if math.isfinite(float(v))
        ]

        if not valid_closes:
            raise ValueError("No valid finite closing prices available")

        current = round(valid_closes[-1], 2)

        if len(valid_closes) >= 2:
            prev = round(valid_closes[-2], 2)
            day_change = round(current - prev, 2)
            day_pct = (
                round((day_change / prev) * 100, 2)
                if prev > 0 and math.isfinite(day_change / prev)
                else 0.0
            )
        else:
            day_change = 0.0
            day_pct = 0.0

        if not (math.isfinite(current) and math.isfinite(day_change) and math.isfinite(day_pct)):
            raise ValueError("Computed non-finite quote values")

        return {
            "price": current,
            "day_change": day_change,
            "day_change_percent": day_pct
        }

    except Exception as e:
        print(f"Error fetching live quote for {symbol}: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Live market data unavailable for {symbol}"
        )

def fetch_live_stock_price(symbol: str) -> float:
    return fetch_live_stock_quote(symbol)["price"]


def get_claimed_capital(wallet: UserWallet) -> tuple[float, float]:
    try:
        claimed_tasks = json.loads(wallet.claimed_tasks or "[]")
    except (TypeError, ValueError):
        claimed_tasks = []

    claimed_cash = round(sum(
        task["reward_cash"]
        for task in AVAILABLE_TASKS
        if task["id"] in claimed_tasks
    ), 2)
    starting_capital = next(
        (task["reward_cash"] for task in AVAILABLE_TASKS if task["id"] == "signup_bonus"),
        0.0
    )
    return starting_capital, claimed_cash


def record_portfolio_snapshot(
    user_id: int,
    snapshot_date,
    portfolio_value: float,
    holdings: list[dict],
    db: Session,
):
    portfolio_snapshot = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.user_id == user_id,
        PortfolioSnapshot.snapshot_date == snapshot_date,
        PortfolioSnapshot.symbol.is_(None),
    ).first()
    if not portfolio_snapshot:
        portfolio_snapshot = PortfolioSnapshot(
            user_id=user_id,
            snapshot_date=snapshot_date,
            portfolio_value=portfolio_value,
            position_value=0.0,
            invested_value=0.0,
        )
        db.add(portfolio_snapshot)
    else:
        portfolio_snapshot.portfolio_value = portfolio_value

    for holding in holdings:
        position_snapshot = db.query(PortfolioSnapshot).filter(
            PortfolioSnapshot.user_id == user_id,
            PortfolioSnapshot.snapshot_date == snapshot_date,
            PortfolioSnapshot.symbol == holding["symbol"],
        ).first()
        if not position_snapshot:
            position_snapshot = PortfolioSnapshot(
                user_id=user_id,
                snapshot_date=snapshot_date,
                symbol=holding["symbol"],
            )
            db.add(position_snapshot)
        position_snapshot.portfolio_value = portfolio_value
        position_snapshot.position_value = holding["current_value"]
        position_snapshot.invested_value = holding["total_invested"]

    db.commit()


def get_historical_price_series(symbols: list[str], start_date, end_date) -> dict[str, dict]:
    prices = {}
    for symbol in symbols:
        try:
            history = yf.Ticker(symbol).history(
                start=start_date.isoformat(),
                end=(end_date + timedelta(days=1)).isoformat(),
            )
            symbol_prices = {}
            for index, row in history.iterrows():
                close = row.get("Close")
                if close is not None:
                    symbol_prices[index.date()] = round(float(close), 2)
            if symbol_prices:
                prices[symbol] = symbol_prices
        except Exception as exc:
            print(f"Error fetching history for {symbol}: {exc}")
    return prices


def price_on_or_before(price_series: dict, target_date):
    available_dates = [date for date in price_series if date <= target_date]
    return price_series[max(available_dates)] if available_dates else None


def build_transaction_history(current_user: User, wallet: UserWallet, transactions: list[Transaction], symbol: Optional[str] = None):
    dated_transactions = [transaction for transaction in transactions if transaction.timestamp]
    if not dated_transactions:
        return []

    today = datetime.utcnow().date()
    symbols = sorted({transaction.symbol for transaction in dated_transactions})
    if symbol:
        symbols = [symbol] if symbol in symbols else []
    start_date = min(transaction.timestamp.date() for transaction in dated_transactions)
    prices = get_historical_price_series(symbols, start_date, today)
    if not prices:
        return []
    market_dates = {
        date
        for symbol_prices in prices.values()
        for date in symbol_prices
    }
    dates = sorted(market_dates | {today})

    history = []
    for target_date in dates:
        positions = {}
        for transaction in dated_transactions:
            if transaction.timestamp.date() > target_date or transaction.symbol not in symbols:
                continue
            position = positions.setdefault(transaction.symbol, {"quantity": 0, "cost": 0.0})
            if transaction.trade_type == "BUY":
                position["quantity"] += transaction.quantity
                position["cost"] += transaction.total_amount
            elif transaction.trade_type == "SELL" and position["quantity"] > 0:
                average_cost = position["cost"] / position["quantity"]
                position["quantity"] -= transaction.quantity
                position["cost"] -= min(position["cost"], average_cost * transaction.quantity)

        values = {}
        for held_symbol, position in positions.items():
            price = price_on_or_before(prices.get(held_symbol, {}), target_date)
            if target_date == today:
                try:
                    price = fetch_live_stock_quote(held_symbol)["price"]
                except HTTPException:
                    pass
            if price is not None and position["quantity"] > 0:
                values[held_symbol] = {
                    "position_value": round(position["quantity"] * price, 2),
                    "invested_value": round(position["cost"], 2),
                }

        if symbol:
            if symbol in values:
                history.append({
                    "date": target_date.isoformat(),
                    "portfolio_value": values[symbol]["position_value"],
                    "position_value": values[symbol]["position_value"],
                    "invested_value": values[symbol]["invested_value"],
                })
            continue

        if not values:
            continue
        buys_after_date = sum(
            transaction.total_amount
            for transaction in dated_transactions
            if transaction.timestamp.date() > target_date and transaction.trade_type == "BUY"
        )
        sells_after_date = sum(
            transaction.total_amount
            for transaction in dated_transactions
            if transaction.timestamp.date() > target_date and transaction.trade_type == "SELL"
        )
        cash_on_date = wallet.virtual_cash + buys_after_date - sells_after_date
        history.append({
            "date": target_date.isoformat(),
            "portfolio_value": round(cash_on_date + sum(item["position_value"] for item in values.values()), 2),
        })

    if symbol:
        previous_value = None
        for point in history:
            point["daily_change"] = round(point["position_value"] - previous_value, 2) if previous_value is not None else 0.0
            point["overall_pnl"] = round(point["position_value"] - point["invested_value"], 2)
            previous_value = point["position_value"]

    return history

@router.post("/buy")
def buy_stock(
    req: TradeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    clean_symbol = req.symbol.strip().upper()
    current_price = fetch_live_stock_price(clean_symbol)
    total_cost = round(req.quantity * current_price, 2)

    wallet = get_or_create_wallet(current_user.id, db)

    if wallet.virtual_cash < total_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient virtual cash! Required: ₹{total_cost:,.2f}, Available: ₹{wallet.virtual_cash:,.2f}"
        )

    company_name = clean_symbol.replace(".NS", "").replace(".BO", "")

    try:
        # Deduct cash
        wallet.virtual_cash = round(wallet.virtual_cash - total_cost, 2)

        # Update or create holding
        holding = db.query(Holding).filter(
            Holding.user_id == current_user.id,
            Holding.symbol == clean_symbol
        ).first()

        if holding:
            new_qty = holding.quantity + req.quantity
            new_invested = round(holding.total_invested + total_cost, 2)
            new_avg_price = round(new_invested / new_qty, 2)

            holding.quantity = new_qty
            holding.total_invested = new_invested
            holding.avg_buy_price = new_avg_price
        else:
            holding = Holding(
                user_id=current_user.id,
                symbol=clean_symbol,
                company_name=company_name,
                quantity=req.quantity,
                avg_buy_price=current_price,
                total_invested=total_cost
            )
            db.add(holding)

        # Log transaction
        txn = Transaction(
            user_id=current_user.id,
            symbol=clean_symbol,
            company_name=company_name,
            trade_type="BUY",
            quantity=req.quantity,
            price_per_share=current_price,
            total_amount=total_cost,
            realized_pnl=0.0
        )
        db.add(txn)

        db.commit()
        db.refresh(wallet)
        db.refresh(holding)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"BUY trade execution failed for user {current_user.id} ({clean_symbol}): {e}")
        raise HTTPException(
            status_code=500,
            detail="Trade execution failed; state rolled back."
        )

    # Safely generate real database notification for BUY trade
    try:
        fingerprint = f"txn_{txn.id}"
        existing_notif = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.event_fingerprint == fingerprint
        ).first()

        if not existing_notif:
            notif = Notification(
                user_id=current_user.id,
                type="TRADE_BUY",
                title="Paper BUY executed",
                message=f"Successfully bought {req.quantity} shares of {clean_symbol} at ₹{current_price:,.2f}.",
                is_read=False,
                action_url="/portfolio",
                related_entity_type="transaction",
                related_entity_id=txn.id,
                event_fingerprint=fingerprint
            )
            db.add(notif)
            db.commit()

            # Queue background email alert directly to trader's registered email
            if current_user.email and current_user.email.strip():
                background_tasks.add_task(
                    send_notification_email,
                    recipient_email=current_user.email.strip(),
                    subject="StockSikh: Paper BUY executed",
                    title="Paper BUY executed",
                    message=f"Successfully bought {req.quantity} shares of {clean_symbol} at ₹{current_price:,.2f}.",
                    notification_type="TRADE_BUY",
                    action_url="/portfolio"
                )
    except Exception as notif_err:
        print(f"Warning: Failed to create BUY trade notification or queue email: {notif_err}")

    return {
        "success": True,
        "message": f"Successfully purchased {req.quantity} shares of {clean_symbol} at ₹{current_price:,.2f}.",
        "symbol": clean_symbol,
        "quantity": req.quantity,
        "price": current_price,
        "total_cost": total_cost,
        "remaining_cash": wallet.virtual_cash,
        "holding": {
            "quantity": holding.quantity,
            "avg_buy_price": holding.avg_buy_price,
            "total_invested": holding.total_invested
        }
    }

@router.post("/sell")
def sell_stock(
    req: TradeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    clean_symbol = req.symbol.strip().upper()

    holding = db.query(Holding).filter(
        Holding.user_id == current_user.id,
        Holding.symbol == clean_symbol
    ).first()

    if not holding or holding.quantity < req.quantity:
        available_qty = holding.quantity if holding else 0
        raise HTTPException(
            status_code=400,
            detail=f"You only have {available_qty} shares of {clean_symbol} available to sell."
        )

    # Save company name before any potential delete
    company_name = holding.company_name or clean_symbol.replace(".NS", "").replace(".BO", "")

    current_price = fetch_live_stock_price(clean_symbol)
    total_proceeds = round(req.quantity * current_price, 2)
    cost_basis = round(req.quantity * holding.avg_buy_price, 2)
    realized_pnl = round(total_proceeds - cost_basis, 2)

    wallet = get_or_create_wallet(current_user.id, db)

    try:
        wallet.virtual_cash = round(wallet.virtual_cash + total_proceeds, 2)

        # Update holding
        if holding.quantity == req.quantity:
            db.delete(holding)
        else:
            holding.quantity -= req.quantity
            holding.total_invested = round(holding.total_invested - cost_basis, 2)

        # Log transaction
        txn = Transaction(
            user_id=current_user.id,
            symbol=clean_symbol,
            company_name=company_name,
            trade_type="SELL",
            quantity=req.quantity,
            price_per_share=current_price,
            total_amount=total_proceeds,
            realized_pnl=realized_pnl
        )
        db.add(txn)

        db.commit()
        db.refresh(wallet)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"SELL trade execution failed for user {current_user.id} ({clean_symbol}): {e}")
        raise HTTPException(
            status_code=500,
            detail="Trade execution failed; state rolled back."
        )

    # Safely generate real database notification for SELL trade & queue background email
    try:
        fingerprint = f"txn_{txn.id}"
        existing_notif = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.event_fingerprint == fingerprint
        ).first()

        if not existing_notif:
            if realized_pnl > 0:
                pnl_str = f"Realized P&L: +₹{realized_pnl:,.2f}"
            elif realized_pnl < 0:
                pnl_str = f"Realized P&L: -₹{abs(realized_pnl):,.2f}"
            else:
                pnl_str = "Realized P&L: ₹0.00"

            notif = Notification(
                user_id=current_user.id,
                type="TRADE_SELL",
                title="Paper SELL executed",
                message=f"Successfully sold {req.quantity} shares of {clean_symbol}. {pnl_str}.",
                is_read=False,
                action_url="/portfolio",
                related_entity_type="transaction",
                related_entity_id=txn.id,
                event_fingerprint=fingerprint
            )
            db.add(notif)
            db.commit()

            # Queue background email alert directly to trader's registered email
            if current_user.email and current_user.email.strip():
                background_tasks.add_task(
                    send_notification_email,
                    recipient_email=current_user.email.strip(),
                    subject="StockSikh: Paper SELL executed",
                    title="Paper SELL executed",
                    message=f"Successfully sold {req.quantity} shares of {clean_symbol}. {pnl_str}.",
                    notification_type="TRADE_SELL",
                    action_url="/portfolio"
                )
    except Exception as notif_err:
        print(f"Warning: Failed to create SELL trade notification or queue email: {notif_err}")

    pnl_sign = "+" if realized_pnl >= 0 else ""
    return {
        "success": True,
        "message": f"Successfully sold {req.quantity} shares of {clean_symbol} at ₹{current_price:,.2f} (Realized P&L: {pnl_sign}₹{realized_pnl:,.2f}).",
        "symbol": clean_symbol,
        "quantity": req.quantity,
        "sell_price": current_price,
        "proceeds": total_proceeds,
        "realized_pnl": realized_pnl,
        "new_balance": wallet.virtual_cash
    }

@router.get("/holdings")
@router.get("/holdings/")
def get_user_holdings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    holdings = db.query(Holding).filter(Holding.user_id == current_user.id).all()
    results = []

    for h in holdings:
        try:
            quote = fetch_live_stock_quote(h.symbol)
            live_price = quote["price"]
            day_change = quote["day_change"]
            day_change_percent = quote["day_change_percent"]
        except Exception:
            live_price = h.avg_buy_price
            day_change = 0.0
            day_change_percent = 0.0

        current_val = round(h.quantity * live_price, 2)
        pnl = round(current_val - h.total_invested, 2)
        pnl_pct = round((pnl / h.total_invested) * 100, 2) if h.total_invested > 0 else 0.0

        day_pnl = round(h.quantity * day_change, 2)

        results.append({
            "id": h.id,
            "symbol": h.symbol,
            "company_name": h.company_name or h.symbol.replace(".NS", ""),
            "quantity": h.quantity,
            "avg_buy_price": h.avg_buy_price,
            "total_invested": h.total_invested,
            "current_price": live_price,
            "day_change": day_change,
            "day_change_percent": day_change_percent,
            "day_pnl": day_pnl,
            "current_value": current_val,
            "unrealized_pnl": pnl,
            "pnl_percent": pnl_pct,
            "is_profit": pnl >= 0
        })

    return {"holdings": results}

@router.get("/summary")
@router.get("/summary/")
def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Keep profile rewards synchronized before deriving contributed capital.
    get_wallet_balance(current_user, db)
    wallet = get_or_create_wallet(current_user.id, db)
    holdings = db.query(Holding).filter(Holding.user_id == current_user.id).all()

    total_invested = 0.0
    total_current_value = 0.0
    total_day_pnl = 0.0
    snapshot_holdings = []

    for h in holdings:
        try:
            quote = fetch_live_stock_quote(h.symbol)
            price = quote.get("price")
            if price is None or not math.isfinite(price):
                raise ValueError("Non-finite live price")
            live_price = float(price)

            raw_day_change = quote.get("day_change", 0.0)
            day_change = float(raw_day_change) if raw_day_change is not None and math.isfinite(raw_day_change) else 0.0
        except Exception:
            live_price = h.avg_buy_price if (h.avg_buy_price is not None and math.isfinite(h.avg_buy_price)) else 0.0
            day_change = 0.0

        inv = h.total_invested if (h.total_invested is not None and math.isfinite(h.total_invested)) else 0.0
        total_invested += inv
        current_value = round(h.quantity * live_price, 2)
        total_current_value += current_value
        total_day_pnl += (h.quantity * day_change)
        snapshot_holdings.append({
            "symbol": h.symbol,
            "current_value": current_value,
            "total_invested": inv,
        })

    total_invested = round(total_invested, 2)
    total_current_value = round(total_current_value, 2)
    total_day_pnl = round(total_day_pnl, 2)

    # Unrealized P&L
    total_unrealized_pnl = round(total_current_value - total_invested, 2)

    # Realized P&L from SELL transactions
    sell_txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.trade_type == "SELL"
    ).all()
    total_realized_pnl = round(sum((t.realized_pnl or 0.0) for t in sell_txns if math.isfinite(t.realized_pnl or 0.0)), 2)

    prev_day_value = total_current_value - total_day_pnl
    day_pnl_percent = round((total_day_pnl / prev_day_value) * 100, 2) if (prev_day_value > 0 and math.isfinite(total_day_pnl / prev_day_value)) else 0.0

    virtual_cash = wallet.virtual_cash if (wallet.virtual_cash is not None and math.isfinite(wallet.virtual_cash)) else 0.0
    net_worth = round(virtual_cash + total_current_value, 2)
    starting_capital, capital_contributed = get_claimed_capital(wallet)
    total_pnl = round(net_worth - capital_contributed, 2)
    total_pnl_percent = round((total_pnl / capital_contributed) * 100, 2) if (capital_contributed > 0 and math.isfinite(total_pnl / capital_contributed)) else 0.0

    if math.isfinite(net_worth):
        record_portfolio_snapshot(
            current_user.id,
            datetime.utcnow().date(),
            net_worth,
            snapshot_holdings,
            db,
        )

    return {
        "user_id": current_user.id,
        "net_worth": net_worth,
        "cash_balance": virtual_cash,
        "starting_capital": starting_capital,
        "capital_contributed": capital_contributed,
        "reward_points": wallet.reward_points,
        "total_invested": total_invested,
        "current_holdings_value": total_current_value,
        "unrealized_pnl": total_unrealized_pnl,
        "realized_pnl": total_realized_pnl,
        "total_pnl": total_pnl,
        "pnl_percent": total_pnl_percent,
        "day_pnl": total_day_pnl,
        "day_pnl_percent": day_pnl_percent,
        "is_profit": total_pnl >= 0,
        "is_unrealized_profit": total_unrealized_pnl >= 0,
        "is_realized_profit": total_realized_pnl >= 0,
        "is_day_profit": total_day_pnl >= 0,
        "holdings_count": len(holdings)
    }


@router.get("/history")
@router.get("/history/")
def get_portfolio_history(
    symbol: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.user_id == current_user.id,
    )
    if symbol:
        snapshots = query.filter(PortfolioSnapshot.symbol == symbol.strip().upper()).order_by(PortfolioSnapshot.snapshot_date.asc()).all()
        history = [
            {
                "date": snapshot.snapshot_date.isoformat(),
                "portfolio_value": snapshot.portfolio_value,
                "position_value": snapshot.position_value,
                "invested_value": snapshot.invested_value,
            }
            for snapshot in snapshots
        ]
        transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.timestamp.asc()).all()
        if len(history) < 2 or transactions:
            wallet = get_or_create_wallet(current_user.id, db)
            history = build_transaction_history(current_user, wallet, transactions, symbol.strip().upper())
        return {
            "symbol": symbol.strip().upper(),
            "history": history,
        }

    snapshots = query.filter(PortfolioSnapshot.symbol.is_(None)).order_by(PortfolioSnapshot.snapshot_date.asc()).all()
    history = [
        {
            "date": snapshot.snapshot_date.isoformat(),
            "portfolio_value": snapshot.portfolio_value,
        }
        for snapshot in snapshots
    ]
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.timestamp.asc()).all()
    if len(history) < 2 or transactions:
        wallet = get_or_create_wallet(current_user.id, db)
        history = build_transaction_history(current_user, wallet, transactions)
    previous_value = None
    for point in history:
        current_value = point["portfolio_value"]
        point["daily_change"] = round(current_value - previous_value, 2) if previous_value is not None else 0.0
        point["daily_change_percent"] = round((point["daily_change"] / previous_value) * 100, 2) if previous_value else 0.0
        previous_value = current_value
    return {
        "history": history,
    }

@router.get("/transactions")
@router.get("/transactions/")
def get_user_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txns = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.timestamp.desc()).limit(30).all()

    return {
        "transactions": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "company_name": t.company_name,
                "trade_type": t.trade_type,
                "quantity": t.quantity,
                "price_per_share": t.price_per_share,
                "total_amount": t.total_amount,
                "realized_pnl": t.realized_pnl,
                "timestamp": str(t.timestamp)
            }
            for t in txns
        ]
    }
