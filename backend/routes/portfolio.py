import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import yfinance as yf

from database.database import get_db
from models.portfolio import Holding
from models.transaction import Transaction
from models.wallet import UserWallet
from routes.wallet import get_or_create_wallet

router = APIRouter(
    prefix="/portfolio",
    tags=["Paper Trading & Portfolio"]
)

class TradeRequest(BaseModel):
    user_id: int
    symbol: str
    quantity: int

def fetch_live_stock_quote(symbol: str) -> dict:
    """Fetches real-time price and day change from Yahoo Finance with fallback."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d")
        if not hist.empty and len(hist) >= 1:
            current = round(float(hist["Close"].iloc[-1]), 2)
            prev = round(float(hist["Close"].iloc[-2]), 2) if len(hist) >= 2 else current
            day_change = round(current - prev, 2)
            day_pct = round((day_change / prev) * 100, 2) if prev > 0 else 0.0
            return {
                "price": current,
                "day_change": day_change,
                "day_change_percent": day_pct
            }
    except Exception as e:
        print(f"Error fetching live quote for {symbol}: {e}")

    FALLBACKS = {
        "RELIANCE.NS": {"price": 1257.50, "day_change": 29.50, "day_change_percent": 2.40},
        "TCS.NS": {"price": 2200.80, "day_change": -12.40, "day_change_percent": -0.56},
        "INFY.NS": {"price": 1890.30, "day_change": 18.20, "day_change_percent": 0.97},
        "HDFCBANK.NS": {"price": 1650.00, "day_change": 14.30, "day_change_percent": 0.87},
        "ICICIBANK.NS": {"price": 1210.80, "day_change": 8.50, "day_change_percent": 0.71},
        "SBIN.NS": {"price": 815.40, "day_change": -3.20, "day_change_percent": -0.39},
        "ITC.NS": {"price": 465.20, "day_change": 1.80, "day_change_percent": 0.39},
        "HINDUNILVR.NS": {"price": 2380.00, "day_change": -15.00, "day_change_percent": -0.63},
        "BHARTIARTL.NS": {"price": 1640.00, "day_change": 22.00, "day_change_percent": 1.36},
        "LT.NS": {"price": 3650.00, "day_change": 35.00, "day_change_percent": 0.97}
    }
    return FALLBACKS.get(symbol, {"price": 1000.0, "day_change": 0.0, "day_change_percent": 0.0})

def fetch_live_stock_price(symbol: str) -> float:
    return fetch_live_stock_quote(symbol)["price"]

@router.post("/buy")
def buy_stock(
    req: TradeRequest,
    db: Session = Depends(get_db)
):
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    clean_symbol = req.symbol.strip().upper()
    current_price = fetch_live_stock_price(clean_symbol)
    total_cost = round(req.quantity * current_price, 2)

    wallet = get_or_create_wallet(req.user_id, db)

    if wallet.virtual_cash < total_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient virtual cash! Required: ₹{total_cost:,.2f}, Available: ₹{wallet.virtual_cash:,.2f}"
        )

    # Deduct cash
    wallet.virtual_cash = round(wallet.virtual_cash - total_cost, 2)

    # Auto-claim first trade reward if eligible
    try:
        claimed = json.loads(wallet.claimed_tasks)
    except Exception:
        claimed = []
    if "first_trade" not in claimed:
        wallet.virtual_cash += 1000.0
        wallet.reward_points += 250
        claimed.append("first_trade")
        wallet.claimed_tasks = json.dumps(claimed)

    # Update or create holding
    holding = db.query(Holding).filter(
        Holding.user_id == req.user_id,
        Holding.symbol == clean_symbol
    ).first()

    company_name = clean_symbol.replace(".NS", "").replace(".BO", "")

    if holding:
        new_qty = holding.quantity + req.quantity
        new_invested = round(holding.total_invested + total_cost, 2)
        new_avg_price = round(new_invested / new_qty, 2)

        holding.quantity = new_qty
        holding.total_invested = new_invested
        holding.avg_buy_price = new_avg_price
    else:
        holding = Holding(
            user_id=req.user_id,
            symbol=clean_symbol,
            company_name=company_name,
            quantity=req.quantity,
            avg_buy_price=current_price,
            total_invested=total_cost
        )
        db.add(holding)

    # Log transaction
    txn = Transaction(
        user_id=req.user_id,
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
    db: Session = Depends(get_db)
):
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    clean_symbol = req.symbol.strip().upper()
    holding = db.query(Holding).filter(
        Holding.user_id == req.user_id,
        Holding.symbol == clean_symbol
    ).first()

    if not holding or holding.quantity < req.quantity:
        available_qty = holding.quantity if holding else 0
        raise HTTPException(
            status_code=400,
            detail=f"You only have {available_qty} shares of {clean_symbol} available to sell."
        )

    current_price = fetch_live_stock_price(clean_symbol)
    total_proceeds = round(req.quantity * current_price, 2)
    cost_basis = round(req.quantity * holding.avg_buy_price, 2)
    realized_pnl = round(total_proceeds - cost_basis, 2)

    wallet = get_or_create_wallet(req.user_id, db)
    wallet.virtual_cash = round(wallet.virtual_cash + total_proceeds, 2)

    # Update holding
    if holding.quantity == req.quantity:
        db.delete(holding)
    else:
        holding.quantity -= req.quantity
        holding.total_invested = round(holding.total_invested - cost_basis, 2)

    # Log transaction
    txn = Transaction(
        user_id=req.user_id,
        symbol=clean_symbol,
        company_name=holding.company_name or clean_symbol,
        trade_type="SELL",
        quantity=req.quantity,
        price_per_share=current_price,
        total_amount=total_proceeds,
        realized_pnl=realized_pnl
    )
    db.add(txn)

    db.commit()
    db.refresh(wallet)

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
def get_user_holdings(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    results = []

    for h in holdings:
        quote = fetch_live_stock_quote(h.symbol)
        live_price = quote["price"]
        day_change = quote["day_change"]
        day_change_percent = quote["day_change_percent"]

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
def get_portfolio_summary(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(user_id, db)
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()

    total_invested = 0.0
    total_current_value = 0.0
    total_day_pnl = 0.0

    for h in holdings:
        quote = fetch_live_stock_quote(h.symbol)
        live_price = quote["price"]
        day_change = quote["day_change"]

        total_invested += h.total_invested
        total_current_value += (h.quantity * live_price)
        total_day_pnl += (h.quantity * day_change)

    total_invested = round(total_invested, 2)
    total_current_value = round(total_current_value, 2)
    total_day_pnl = round(total_day_pnl, 2)

    total_unrealized_pnl = round(total_current_value - total_invested, 2)
    overall_pnl_percent = round((total_unrealized_pnl / total_invested) * 100, 2) if total_invested > 0 else 0.0

    prev_day_value = total_current_value - total_day_pnl
    day_pnl_percent = round((total_day_pnl / prev_day_value) * 100, 2) if prev_day_value > 0 else 0.0

    net_worth = round(wallet.virtual_cash + total_current_value, 2)

    return {
        "user_id": user_id,
        "net_worth": net_worth,
        "cash_balance": wallet.virtual_cash,
        "reward_points": wallet.reward_points,
        "total_invested": total_invested,
        "current_holdings_value": total_current_value,
        "unrealized_pnl": total_unrealized_pnl,
        "pnl_percent": overall_pnl_percent,
        "day_pnl": total_day_pnl,
        "day_pnl_percent": day_pnl_percent,
        "is_profit": total_unrealized_pnl >= 0,
        "is_day_profit": total_day_pnl >= 0,
        "holdings_count": len(holdings)
    }

@router.get("/transactions")
def get_user_transactions(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    txns = db.query(Transaction).filter(
        Transaction.user_id == user_id
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
