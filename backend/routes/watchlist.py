from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
import yfinance as yf

from database.database import get_db
from models.watchlist import Watchlist, PriceAlert
from models.user import User
from routes.auth import get_current_user
from routes.stocks import calculate_technical_signals

router = APIRouter(
    prefix="/watchlist",
    tags=["Watchlist"]
)

class CreateAlertRequest(BaseModel):
    symbol: str
    target_price: float
    condition: Optional[str] = "ABOVE"


@router.get("/test")
def test():
    return {"message": "Watchlist API Working"}

@router.get("")
@router.get("/")
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id)
        .all()
    )

    return {
        "watchlist": [
            {
                "id": item.id,
                "user_id": item.user_id,
                "symbol": item.symbol
            }
            for item in items
        ]
    }

@router.get("/all")
@router.get("/all/")
def get_all_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": item.id,
            "user_id": item.user_id,
            "symbol": item.symbol
        }
        for item in items
    ]

@router.get("/details")
@router.get("/details/")
def get_watchlist_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id)
        .all()
    )

    result = []

    for item in items:
        try:
            ticker = yf.Ticker(item.symbol)
            data = ticker.history(period="1mo")

            if data.empty:
                continue

            curr_price, ma20, ma50, rsi, signal = calculate_technical_signals(data)

            prev_price = (
                round(float(data["Close"].iloc[-2]), 2)
                if len(data) >= 2
                else curr_price
            )

            change = round(curr_price - prev_price, 2)

            change_percent = (
                round((change / prev_price) * 100, 2)
                if prev_price > 0
                else 0.0
            )

            result.append({
                "id": item.id,
                "symbol": item.symbol,
                "name": item.symbol.replace(".NS", "").replace(".BO", ""),
                "price": curr_price,
                "change": change,
                "change_percent": change_percent,
                "signal": signal,
                "rsi": rsi,
                "ma20": ma20
            })

        except Exception as e:
            print(
                f"Error loading watchlist details for {item.symbol}: {e}"
            )

    return result

@router.post("/add")
def add_watchlist(
    symbol: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    symbol = symbol.strip().upper()

    existing = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == current_user.id,
            Watchlist.symbol == symbol
        )
        .first()
    )

    if existing:
        return {
            "message": "Stock already in watchlist",
            "symbol": symbol
        }

    item = Watchlist(
        user_id=current_user.id,
        symbol=symbol
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return {
        "message": "Added Successfully",
        "id": item.id,
        "symbol": symbol
    }

@router.delete("/remove")
def remove_watchlist(
    symbol: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    symbol = symbol.strip().upper()

    item = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == current_user.id,
            Watchlist.symbol == symbol
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Stock not found in your watchlist"
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Removed Successfully",
        "symbol": symbol
    }

@router.delete("/{symbol}")
def remove_watchlist_by_symbol(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_symbol = symbol.strip().upper()

    item = (
        db.query(Watchlist)
        .filter(
            Watchlist.symbol == clean_symbol,
            Watchlist.user_id == current_user.id
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Stock not found in your watchlist"
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Removed Successfully",
        "symbol": clean_symbol
    }


# ─── Price Alerts (Authenticated User) ───────────────────────────────────────

@router.get("/alerts")
def get_user_price_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == current_user.id)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )
    return {
        "alerts": [
            {
                "id": a.id,
                "symbol": a.symbol,
                "target_price": a.target_price,
                "condition": a.condition,
                "is_triggered": a.is_triggered,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in alerts
        ]
    }


@router.post("/alert")
def create_price_alert(
    req: CreateAlertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    symbol = req.symbol.strip().upper()
    if req.target_price <= 0:
        raise HTTPException(status_code=400, detail="Target price must be greater than 0")

    cond = req.condition.upper() if req.condition else "ABOVE"
    if cond not in ["ABOVE", "BELOW"]:
        cond = "ABOVE"

    # Check for duplicate active alert
    existing = (
        db.query(PriceAlert)
        .filter(
            PriceAlert.user_id == current_user.id,
            PriceAlert.symbol == symbol,
            PriceAlert.condition == cond,
            PriceAlert.is_triggered == False
        )
        .first()
    )
    if existing:
        existing.target_price = req.target_price
        db.commit()
        return {
            "message": f"Updated price alert for {symbol} to ₹{req.target_price:,.2f}",
            "alert": {
                "id": existing.id,
                "symbol": existing.symbol,
                "target_price": existing.target_price,
                "condition": existing.condition
            }
        }

    alert = PriceAlert(
        user_id=current_user.id,
        symbol=symbol,
        target_price=req.target_price,
        condition=cond,
        is_triggered=False
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return {
        "message": f"Price alert set for {symbol} when price goes {cond.lower()} ₹{req.target_price:,.2f}",
        "alert": {
            "id": alert.id,
            "symbol": alert.symbol,
            "target_price": alert.target_price,
            "condition": alert.condition
        }
    }


@router.delete("/alert/{alert_id}")
def delete_price_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = (
        db.query(PriceAlert)
        .filter(PriceAlert.id == alert_id, PriceAlert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Price alert deleted successfully"}

