from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from database.database import Base

class Holding(Base):
    __tablename__ = "holdings"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "symbol",
            name="uix_user_holding_symbol"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String(30), nullable=False)
    company_name = Column(String(100), nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    avg_buy_price = Column(Float, default=0.0, nullable=False)
    total_invested = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
