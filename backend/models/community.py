from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from database.database import Base

class ProQuery(Base):
    __tablename__ = "pro_queries"

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learner_name = Column(String(100), nullable=False)
    stock_symbol = Column(String(30), nullable=True)
    title = Column(String(255), nullable=False)
    query_text = Column(Text, nullable=False)
    status = Column(String(20), default="OPEN")  # "OPEN" or "RESOLVED"
    replies = Column(Text, default="[]")  # JSON string array of replies
    created_at = Column(DateTime(timezone=True), server_default=func.now())
