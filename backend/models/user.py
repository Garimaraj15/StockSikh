from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from sqlalchemy.sql import func
from database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="learner")  # "learner" or "pro"
    phone = Column(String(20), nullable=True)
    dob = Column(String(20), nullable=True)
    points = Column(Integer, default=500)
    bio = Column(Text, nullable=True)
    specialization = Column(String(100), nullable=True)  # e.g. "Swing Trading", "Fundamental Analysis"
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )