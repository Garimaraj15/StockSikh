from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime
from datetime import datetime
from database.database import Base

class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String(30))

class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String(30), nullable=False)
    target_price = Column(Float, nullable=False)
    condition = Column(String(10), default="ABOVE")  # "ABOVE" or "BELOW"
    is_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)