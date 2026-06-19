
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import yfinance as yf

from database.database import get_db
from models.watchlist import Watchlist

router = APIRouter(
    prefix="/watchlist",
    tags=["Watchlist"]
)

# Test Route
@router.get("/test")
def test():
    return {
        "message": "Watchlist API Working"
    }


# Get User Watchlist
@router.get("/")
def get_watchlist(
    user_id: int,
    db: Session = Depends(get_db)
):
    items = db.query(Watchlist).filter(
        Watchlist.user_id == user_id
    ).all()

    return items


# Alternate Route
@router.get("/all")
def get_all_watchlist(
    user_id: int,
    db: Session = Depends(get_db)
):
    items = db.query(Watchlist).filter(
        Watchlist.user_id == user_id
    ).all()

    return items


# Watchlist With Live Prices + Signals
@router.get("/details")
def get_watchlist_details(
    user_id: int,
    db: Session = Depends(get_db)
):
    items = db.query(Watchlist).filter(
        Watchlist.user_id == user_id
    ).all()

    result = []

    for item in items:
        try:
            ticker = yf.Ticker(item.symbol)

            data = ticker.history(period="3mo")

            if len(data) == 0:
                continue

            price = round(
                float(data["Close"].iloc[-1]),
                2
            )

            signal = "HOLD"

            if len(data) >= 20:
                ma20 = float(
                    data["Close"]
                    .rolling(20)
                    .mean()
                    .iloc[-1]
                )

                if price > ma20:
                    signal = "BUY"
                elif price < ma20:
                    signal = "SELL"

            result.append({
                "symbol": item.symbol,
                "price": price,
                "signal": signal
            })

        except Exception as e:
            print(e)

    return result


# Add Stock To Watchlist
@router.post("/add")
def add_watchlist(
    user_id: int,
    symbol: str,
    db: Session = Depends(get_db)
):
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == user_id,
        Watchlist.symbol == symbol
    ).first()

    if existing:
        return {
            "message": "Stock already in watchlist"
        }

    item = Watchlist(
        user_id=user_id,
        symbol=symbol
    )

    db.add(item)
    db.commit()

    return {
        "message": "Added Successfully"
    }


# Remove Stock From Watchlist
@router.delete("/remove")
def remove_watchlist(
    user_id: int,
    symbol: str,
    db: Session = Depends(get_db)
):
    item = db.query(Watchlist).filter(
        Watchlist.user_id == user_id,
        Watchlist.symbol == symbol
    ).first()

    if not item:
        return {
            "message": "Stock not found"
        }

    db.delete(item)
    db.commit()

    return {
        "message": "Removed Successfully"
    }
