from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from database.database import Base


class Notification(Base):
    """Persistent user-specific notification for real events.

    Belongs strictly to a registered user (user_id).
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # "DIRECT_MESSAGE", "TRADE_BUY", "TRADE_SELL", "PRICE_ALERT", "REWARD", "INFO"
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    action_url = Column(String(255), nullable=True)
    related_entity_type = Column(String(50), nullable=True)  # "direct_message", "transaction", "stock", "quest"
    related_entity_id = Column(Integer, nullable=True)
    event_fingerprint = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
