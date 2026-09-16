from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from database.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String(30), nullable=False)
    company_name = Column(String(100), nullable=True)
    trade_type = Column(String(10), nullable=False)  # "BUY" or "SELL"
    quantity = Column(Integer, nullable=False)
    price_per_share = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    realized_pnl = Column(Float, default=0.0)  # Calculated when selling
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
