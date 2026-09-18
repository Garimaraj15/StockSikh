from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from database.database import Base


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    symbol = Column(String(30), nullable=True, index=True)
    portfolio_value = Column(Float, nullable=False)
    position_value = Column(Float, nullable=False, default=0.0)
    invested_value = Column(Float, nullable=False, default=0.0)