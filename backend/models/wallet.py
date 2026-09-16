from sqlalchemy import Column, Integer, Float, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from database.database import Base

class UserWallet(Base):
    __tablename__ = "user_wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    virtual_cash = Column(Float, default=10000.0)  # Initial bonus ₹10,000
    reward_points = Column(Integer, default=500)
    claimed_tasks = Column(Text, default="[]")  # JSON string of claimed task IDs
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
