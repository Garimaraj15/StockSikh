from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import yfinance as yf

from database.database import get_db
from models.watchlist import Watchlist
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
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    item_list = [{"id": item.id, "user_id": item.user_id, "symbol": item.symbol} for item in items]
    return {"watchlist": item_list}

@router.get("/all")
def get_all_watchlist(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    return [{"id": item.id, "user_id": item.user_id, "symbol": item.symbol} for item in items]

@router.get("/details")
def get_watchlist_details(
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    items = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    result = []

    for item in items:
        try:
            ticker = yf.Ticker(item.symbol)
            data = ticker.history(period="1mo")
            if data.empty or len(data) == 0:
                continue

            curr_price, ma20, ma50, rsi, signal = calculate_technical_signals(data)
            prev_price = round(float(data["Close"].iloc[-2]), 2) if len(data) >= 2 else curr_price
            change = round(curr_price - prev_price, 2)
            change_percent = round((change / prev_price) * 100, 2) if prev_price > 0 else 0.0

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
            print(f"Error loading watchlist details for {item.symbol}: {e}")
            result.append({
                "id": item.id,
                "symbol": item.symbol,
                "name": item.symbol.replace(".NS", ""),
                "price": 0.0,
                "change": 0.0,
                "change_percent": 0.0,
                "signal": "HOLD",
                "rsi": 50.0,
                "ma20": 0.0
            })

    return result

@router.post("/add")
def add_watchlist(
    user_id: int = Query(...),
    symbol: str = Query(...),
    db: Session = Depends(get_db)
):
    symbol = symbol.strip().upper()
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == user_id,
        Watchlist.symbol == symbol
    ).first()

    if existing:
        return {"message": "Stock already in watchlist", "symbol": symbol}

    item = Watchlist(user_id=user_id, symbol=symbol)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Added Successfully", "id": item.id, "symbol": symbol}

@router.delete("/remove")
def remove_watchlist(
    user_id: int = Query(...),
    symbol: str = Query(...),
    db: Session = Depends(get_db)
):
    symbol = symbol.strip().upper()
    item = db.query(Watchlist).filter(
        Watchlist.user_id == user_id,
        Watchlist.symbol == symbol
    ).first()

    if not item:
        return {"message": "Stock not found in watchlist"}

    db.delete(item)
    db.commit()
    return {"message": "Removed Successfully", "symbol": symbol}

@router.delete("/{symbol}")
def remove_watchlist_by_symbol(
    symbol: str,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    clean_symbol = symbol.strip().upper()
    query = db.query(Watchlist).filter(Watchlist.symbol == clean_symbol)
    if user_id is not None:
        query = query.filter(Watchlist.user_id == user_id)
    
    item = query.first()
    if not item:
        return {"message": "Stock not found in watchlist"}

    db.delete(item)
    db.commit()
    return {"message": "Removed Successfully", "symbol": clean_symbol}
