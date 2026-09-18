from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, UniqueConstraint
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


class CommunityQueryVote(Base):
    """Tracks persistent upvotes on community questions by registered users.
    Enforces exactly one vote per user per question.
    """
    __tablename__ = "community_query_votes"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("pro_queries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("query_id", "user_id", name="uq_query_user_vote"),
    )


class Clan(Base):
    """A real community clan that registered users can join.

    Clan names are created by users, never hardcoded. The leaderboard
    shows the clan a trader currently belongs to, or "No Clan".
    """
    __tablename__ = "clans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClanMembership(Base):
    """Tracks which user belongs to which clan.

    A user can belong to at most one clan at a time. The unique
    constraint on user_id prevents double membership.
    """
    __tablename__ = "clan_memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    clan_id = Column(Integer, ForeignKey("clans.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())


class DirectMessage(Base):
    """Real 1-on-1 direct message between two registered StockSikh traders.

    Persisted permanently in the database.
    """
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message_text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
