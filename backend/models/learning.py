from sqlalchemy import Column, Integer, String, Date, Text, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from database.database import Base


class LearningProgress(Base):
    __tablename__ = "learning_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_date", name="uq_learning_user_date"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lesson_date = Column(Date, nullable=False, index=True)
    lesson_id = Column(String(80), nullable=False)
    answers_json = Column(Text, nullable=False, default="{}")
    xp_earned = Column(Integer, nullable=False, default=0)
    completion_bonus_awarded = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
