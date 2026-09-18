from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import yfinance as yf

from database.database import get_db
from models.watchlist import Watchlist
from models.user import User
from routes.auth import get_current_user
from routes.stocks import calculate_technical_signals

router = APIRouter(
    prefix="/watchlist",
    tags=["Watchlist"]
)

@router.get("/test")
def test():
    return {"message": "Watchlist API Working"}

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
