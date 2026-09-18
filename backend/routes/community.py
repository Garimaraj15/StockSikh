import json
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import or_, and_, func as sql_func, desc
from sqlalchemy.orm import Session
from pydantic import BaseModel
import yfinance as yf
from jose import jwt, JWTError

from utils.email_service import send_notification_email

from database.database import get_db, Base, engine
from models.community import ProQuery, DirectMessage, CommunityQueryVote
from models.notification import Notification
from models.portfolio import Holding
from models.transaction import Transaction
from models.user import User
from models.wallet import UserWallet
from routes.auth import get_current_user, security, SECRET_KEY, ALGORITHM
from routes.gamification import LEVELS
from routes.portfolio import fetch_live_stock_quote

# Ensure community tables exist
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass

router = APIRouter(
    prefix="/community",
    tags=["Pro Helpers & Community"]
)


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Extracts authenticated user from JWT if token is provided, otherwise returns None."""
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id:
            return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None
    return None


# ---------------------------------------------------------------------------
# Helper — current week boundaries (Monday → Sunday)
# ---------------------------------------------------------------------------
def current_week_start() -> date:
    today = date.today()
    return today - timedelta(days=today.weekday())


# ---------------------------------------------------------------------------
# Helper — trader tier derived from the same XP/LEVELS used by Quest & XP page
# ---------------------------------------------------------------------------
def trader_tier(db: Session, user_id: int) -> str:
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).first()
    xp = wallet.reward_points if wallet else 0
    matched = max(
        (level for level in LEVELS if xp >= level["minimum_xp"]),
        key=lambda level: level["minimum_xp"]
    )
    return matched["name"]


# ---------------------------------------------------------------------------
# Helper — weekly portfolio performance (absolute ₹ change)
# ---------------------------------------------------------------------------
def weekly_performance(db: Session, user_id: int) -> Optional[float]:
    week_start = current_week_start()

    wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).first()
    if wallet is None:
        return None

    all_transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.timestamp.asc())
        .all()
    )
    if not all_transactions:
        return None

    week_transactions = [
        t for t in all_transactions
        if t.timestamp and t.timestamp.date() >= week_start
    ]
    if not week_transactions:
        return None

    buys_this_week = sum(
        t.total_amount for t in week_transactions if t.trade_type == "BUY"
    )
    sells_this_week = sum(
        t.total_amount for t in week_transactions if t.trade_type == "SELL"
    )
    start_cash = wallet.virtual_cash + buys_this_week - sells_this_week

    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    holding_map = {h.symbol: h for h in holdings}

    end_value = 0.0
    for holding in holdings:
        if holding.quantity <= 0:
            continue
        try:
            end_value += holding.quantity * fetch_live_stock_quote(holding.symbol)["price"]
        except Exception:
            end_value += holding.quantity * holding.avg_buy_price

    pre_week_quantities: dict = {}
    for t in all_transactions:
        if t.timestamp and t.timestamp.date() >= week_start:
            continue
        sym = t.symbol
        delta = t.quantity if t.trade_type == "BUY" else -t.quantity
        pre_week_quantities[sym] = pre_week_quantities.get(sym, 0) + delta

    start_value = 0.0
    for symbol, qty in pre_week_quantities.items():
        if qty <= 0:
            continue
        priced = False
        try:
            hist = yf.Ticker(symbol).history(
                start=week_start.isoformat(),
                end=(week_start + timedelta(days=3)).isoformat()
            )
            if not hist.empty:
                start_value += qty * float(hist["Close"].iloc[0])
                priced = True
        except Exception:
            pass

        if not priced:
            h = holding_map.get(symbol)
            if h:
                start_value += qty * h.avg_buy_price

    weekly_pnl = round(
        (wallet.virtual_cash + end_value) - (start_cash + start_value), 2
    )
    return weekly_pnl


# ---------------------------------------------------------------------------
# Helper — real win rate from closed (SELL) trades only
# ---------------------------------------------------------------------------
def trader_win_rate(db: Session, user_id: int) -> Optional[float]:
    closed = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.trade_type == "SELL")
        .all()
    )
    if not closed:
        return None
    wins = sum(1 for t in closed if (t.realized_pnl or 0) > 0)
    return round((wins / len(closed)) * 100, 2)


# ---------------------------------------------------------------------------
# GET /community/leaderboard — Weekly Trader Leaderboard (real DB data)
# ---------------------------------------------------------------------------
@router.get("/leaderboard")
def get_weekly_leaderboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    week_start = current_week_start()
    week_end = week_start + timedelta(days=6)

    users = db.query(User).order_by(User.id.asc()).all()
    rows = []
    for user in users:
        pnl = weekly_performance(db, user.id)
        if pnl is None:
            continue
        rows.append({
            "user_id": user.id,
            "name": user.name,
            "tier": trader_tier(db, user.id),
            "weekly_pnl": pnl,
            "win_rate": trader_win_rate(db, user.id),
            "is_current_user": user.id == current_user.id,
        })

    rows.sort(key=lambda row: row["weekly_pnl"], reverse=True)
    for index, row in enumerate(rows, 1):
        row["rank"] = index

    def fmt_date(d):
        return d.strftime("%d %b").lstrip("0")

    return {
        "week_start": fmt_date(week_start),
        "week_end": fmt_date(week_end),
        "traders": rows,
    }


# ---------------------------------------------------------------------------
# GET /community/traders/{user_id}/portfolio — Safe public portfolio inspection
# ---------------------------------------------------------------------------
@router.get("/traders/{user_id}/portfolio")
def inspect_public_portfolio(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trader = db.query(User).filter(User.id == user_id).first()
    if not trader:
        raise HTTPException(status_code=404, detail="Trader not found")

    holdings = (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.quantity > 0)
        .all()
    )

    public_holdings = []
    for holding in holdings:
        try:
            quote = fetch_live_stock_quote(holding.symbol)
            current_value = round(holding.quantity * quote["price"], 2)
        except Exception:
            continue
        public_holdings.append({
            "symbol": holding.symbol,
            "quantity": holding.quantity,
            "current_value": current_value,
            "overall_pnl": round(current_value - holding.total_invested, 2),
        })

    return {
        "name": trader.name,
        "tier": trader_tier(db, trader.id),
        "weekly_pnl": weekly_performance(db, trader.id),
        "win_rate": trader_win_rate(db, trader.id),
        "holdings": public_holdings,
    }


# ---------------------------------------------------------------------------
# GET /community/pros — Real Pro Learners ordered by performance
# ---------------------------------------------------------------------------
@router.get("/pros")
def get_pro_helpers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns registered users with role='pro' from the database.
    - Ordered by:
      1. Real win rate DESC (for users with closed trades)
      2. Real weekly P&L DESC
      3. User ID ASC
    - Only exposes safe public fields: id, name, role, bio, specialization, win_rate, weekly_pnl.
    - Never fabricates stats: win_rate is None if no closed trades exist.
    """
    pro_users = (
        db.query(User)
        .filter(
            or_(
                User.role == "pro",
                User.role == "pro_learner",
                User.role == "pro learner",
                User.role == "Pro Learner",
                User.role == "Pro"
            )
        )
        .all()
    )

    def pro_sort_key(u: User):
        wr = trader_win_rate(db, u.id)
        pnl = weekly_performance(db, u.id)
        # 0 if has real win rate, else 1; then negative win rate; then negative pnl; then id
        return (
            0 if wr is not None else 1,
            -(wr if wr is not None else 0),
            0 if pnl is not None else 1,
            -(pnl if pnl is not None else 0),
            u.id
        )

    sorted_pros = sorted(pro_users, key=pro_sort_key)

    return {
        "pros": [
            {
                "id": u.id,
                "name": u.name,
                "role": "pro",
                "display_role": "Pro Learner",
                "bio": u.bio or None,
                "specialization": u.specialization or None,
                "win_rate": trader_win_rate(db, u.id),
                "weekly_pnl": weekly_performance(db, u.id),
                "is_current_user": u.id == current_user.id,
            }
            for u in sorted_pros
        ]
    }


# ---------------------------------------------------------------------------
# Community Queries & Persistent Upvoting
# ---------------------------------------------------------------------------
class AskQueryRequest(BaseModel):
    title: str
    query_text: str
    stock_symbol: Optional[str] = "GENERAL"


class ReplyQueryRequest(BaseModel):
    query_id: int
    reply_text: str


@router.get("/queries")
def get_queries(
    stock_symbol: Optional[str] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns community trading questions ordered server-side by:
    1. Upvote count DESC
    2. Creation date DESC
    Supports pagination via offset & limit.
    """
    query = db.query(ProQuery)
    if stock_symbol and stock_symbol != "ALL":
        query = query.filter(ProQuery.stock_symbol == stock_symbol.upper())

    total_count = query.count()
    records = query.all()

    if not records:
        return {
            "queries": [],
            "total": 0,
            "has_more": False,
            "offset": offset,
            "limit": limit
        }

    # Fetch vote counts for all queries in one query
    vote_counts = dict(
        db.query(
            CommunityQueryVote.query_id,
            sql_func.count(CommunityQueryVote.id)
        )
        .group_by(CommunityQueryVote.query_id)
        .all()
    )

    # Check which queries the current user has upvoted
    user_upvoted_query_ids = set()
    if current_user:
        user_votes = (
            db.query(CommunityQueryVote.query_id)
            .filter(CommunityQueryVote.user_id == current_user.id)
            .all()
        )
        user_upvoted_query_ids = set(r[0] for r in user_votes)

    results = []
    for r in records:
        try:
            reps = json.loads(r.replies) if r.replies else []
        except Exception:
            reps = []

        upvote_cnt = vote_counts.get(r.id, 0)
        has_voted = r.id in user_upvoted_query_ids

        results.append({
            "id": r.id,
            "learner_id": r.learner_id,
            "learner_name": r.learner_name,
            "stock_symbol": r.stock_symbol,
            "title": r.title,
            "query_text": r.query_text,
            "status": r.status,
            "replies": reps,
            "reply_count": len(reps),
            "upvotes": upvote_cnt,
            "has_upvoted": has_voted,
            "created_at_dt": r.created_at,
            "created_at": str(r.created_at.strftime("%b %d, %H:%M")) if r.created_at else "Recently"
        })

    # Server-side sort: 1. Upvotes DESC, 2. Created at DESC
    results.sort(
        key=lambda q: (
            -(q["upvotes"] or 0),
            q["created_at_dt"].timestamp() if q.get("created_at_dt") else 0
        )
    )

    # Clean internal dt before response
    for item in results:
        item.pop("created_at_dt", None)

    paginated_results = results[offset : offset + limit]

    return {
        "queries": paginated_results,
        "total": total_count,
        "has_more": (offset + len(paginated_results)) < total_count,
        "offset": offset,
        "limit": limit
    }


@router.post("/queries/{query_id}/upvote")
def toggle_query_upvote(
    query_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggles an upvote on a community question.
    - If user already upvoted: removes vote.
    - If user hasn't upvoted: adds vote.
    - Enforces uniqueness via database constraint and transaction.
    """
    target_query = db.query(ProQuery).filter(ProQuery.id == query_id).first()
    if not target_query:
        raise HTTPException(status_code=404, detail="Question not found")

    existing_vote = (
        db.query(CommunityQueryVote)
        .filter(
            CommunityQueryVote.query_id == query_id,
            CommunityQueryVote.user_id == current_user.id
        )
        .first()
    )

    if existing_vote:
        db.delete(existing_vote)
        db.commit()
        has_upvoted = False
    else:
        new_vote = CommunityQueryVote(
            query_id=query_id,
            user_id=current_user.id
        )
        db.add(new_vote)
        db.commit()
        has_upvoted = True

    total_upvotes = (
        db.query(CommunityQueryVote)
        .filter(CommunityQueryVote.query_id == query_id)
        .count()
    )

    return {
        "query_id": query_id,
        "upvotes": total_upvotes,
        "has_upvoted": has_upvoted
    }


@router.delete("/queries/{query_id}/upvote")
def remove_query_upvote(
    query_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Explicitly removes an upvote from a community question."""
    target_query = db.query(ProQuery).filter(ProQuery.id == query_id).first()
    if not target_query:
        raise HTTPException(status_code=404, detail="Question not found")

    existing_vote = (
        db.query(CommunityQueryVote)
        .filter(
            CommunityQueryVote.query_id == query_id,
            CommunityQueryVote.user_id == current_user.id
        )
        .first()
    )

    if existing_vote:
        db.delete(existing_vote)
        db.commit()

    total_upvotes = (
        db.query(CommunityQueryVote)
        .filter(CommunityQueryVote.query_id == query_id)
        .count()
    )

    return {
        "query_id": query_id,
        "upvotes": total_upvotes,
        "has_upvoted": False
    }


@router.post("/ask")
def post_learner_query(
    req: AskQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Posts a community question. Learner identity is derived from JWT — never from request body.
    """
    clean_title = (req.title or "").strip()
    clean_query = (req.query_text or "").strip()
    raw_stock = (req.stock_symbol or "GENERAL").strip()

    if not clean_title:
        raise HTTPException(status_code=400, detail="Question title is required.")
    if len(clean_title) > 255:
        raise HTTPException(status_code=400, detail="Question title exceeds 255 characters.")

    if not clean_query:
        raise HTTPException(status_code=400, detail="Question description is required.")
    if len(clean_query) > 5000:
        raise HTTPException(status_code=400, detail="Question description exceeds maximum allowed length.")

    clean_stock = raw_stock.upper() if raw_stock else "GENERAL"
    if len(clean_stock) > 50:
        clean_stock = clean_stock[:50]

    new_q = ProQuery(
        learner_id=current_user.id,
        learner_name=current_user.name,
        stock_symbol=clean_stock,
        title=clean_title,
        query_text=clean_query,
        status="OPEN",
        replies="[]"
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    return {
        "success": True,
        "message": "Question posted to the Community!",
        "id": new_q.id
    }


@router.post("/reply")
def reply_to_query(
    req: ReplyQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Posts a reply to a community question. Replier identity derived from JWT.
    """
    q = db.query(ProQuery).filter(ProQuery.id == req.query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    if not req.reply_text.strip():
        raise HTTPException(status_code=400, detail="Reply text cannot be empty.")

    try:
        reps = json.loads(q.replies)
    except Exception:
        reps = []

    reps.append({
        "replier_id": current_user.id,
        "replier_name": current_user.name,
        "replier_role": current_user.role,
        "reply_text": req.reply_text.strip()
    })

    q.replies = json.dumps(reps)
    q.status = "RESOLVED"
    db.commit()

    return {
        "success": True,
        "message": "Reply posted!",
        "replies": reps
    }


# ---------------------------------------------------------------------------
# Direct Messaging API (Real 1-on-1 Persistent Messaging)
# ---------------------------------------------------------------------------
class SendMessageRequest(BaseModel):
    receiver_id: int
    message_text: str


@router.post("/messages/send")
def send_direct_message(
    req: SendMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot message yourself.")

    clean_text = req.message_text.strip() if req.message_text else ""
    if not clean_text:
        raise HTTPException(status_code=400, detail="Message text cannot be empty.")

    if len(clean_text) > 2000:
        raise HTTPException(status_code=400, detail="Message text exceeds maximum allowed length of 2000 characters.")

    receiver = db.query(User).filter(User.id == req.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found.")

    new_msg = DirectMessage(
        sender_id=current_user.id,
        receiver_id=req.receiver_id,
        message_text=clean_text,
        is_read=False
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    try:
        sender_display_name = (getattr(current_user, "name", "") or "").strip() or "A trader"
        fingerprint = f"dm_{new_msg.id}"
        existing_notif = db.query(Notification).filter(
            Notification.user_id == req.receiver_id,
            Notification.event_fingerprint == fingerprint
        ).first()

        if not existing_notif:
            notif = Notification(
                user_id=req.receiver_id,
                type="DIRECT_MESSAGE",
                title=f"{sender_display_name} sent you a message",
                message=f"{sender_display_name} sent you a message.",
                is_read=False,
                action_url=f"/community?user={current_user.id}",
                related_entity_type="direct_message",
                related_entity_id=new_msg.id,
                event_fingerprint=fingerprint
            )
            db.add(notif)
            db.commit()

            if receiver.email and receiver.email.strip():
                background_tasks.add_task(
                    send_notification_email,
                    recipient_email=receiver.email.strip(),
                    subject="StockSikh: You have a new message",
                    title=f"{sender_display_name} sent you a message",
                    message=f"{sender_display_name} sent you a direct message on StockSikh.",
                    notification_type="DIRECT_MESSAGE",
                    action_url=f"/community?user={current_user.id}"
                )
    except Exception as notif_err:
        print(f"Warning: Failed to create DM notification or queue email: {notif_err}")

    return {
        "id": new_msg.id,
        "sender_id": new_msg.sender_id,
        "receiver_id": new_msg.receiver_id,
        "message_text": new_msg.message_text,
        "is_read": new_msg.is_read,
        "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None
    }


@router.get("/messages/{other_user_id}")
def get_message_thread(
    other_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot open conversation with yourself.")

    other_user = db.query(User).filter(User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="Trader not found.")

    db.query(DirectMessage).filter(
        DirectMessage.sender_id == other_user_id,
        DirectMessage.receiver_id == current_user.id,
        DirectMessage.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()

    messages = db.query(DirectMessage).filter(
        or_(
            and_(DirectMessage.sender_id == current_user.id, DirectMessage.receiver_id == other_user_id),
            and_(DirectMessage.sender_id == other_user_id, DirectMessage.receiver_id == current_user.id)
        )
    ).order_by(DirectMessage.created_at.asc()).all()

    return {
        "other_user": {
            "id": other_user.id,
            "name": other_user.name
        },
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "receiver_id": m.receiver_id,
                "message_text": m.message_text,
                "is_read": m.is_read,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ]
    }


@router.get("/conversations")
def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sent_to = db.query(DirectMessage.receiver_id).filter(DirectMessage.sender_id == current_user.id).distinct().all()
    received_from = db.query(DirectMessage.sender_id).filter(DirectMessage.receiver_id == current_user.id).distinct().all()
    partner_ids = set([r[0] for r in sent_to] + [r[0] for r in received_from])

    conversations = []
    for pid in partner_ids:
        partner = db.query(User).filter(User.id == pid).first()
        if not partner:
            continue

        latest_msg = db.query(DirectMessage).filter(
            or_(
                and_(DirectMessage.sender_id == current_user.id, DirectMessage.receiver_id == pid),
                and_(DirectMessage.sender_id == pid, DirectMessage.receiver_id == current_user.id)
            )
        ).order_by(DirectMessage.created_at.desc()).first()

        unread_count = db.query(DirectMessage).filter(
            DirectMessage.sender_id == pid,
            DirectMessage.receiver_id == current_user.id,
            DirectMessage.is_read == False
        ).count()

        conversations.append({
            "other_user_id": partner.id,
            "other_user_name": partner.name,
            "last_message": latest_msg.message_text if latest_msg else "",
            "last_message_at": latest_msg.created_at.isoformat() if (latest_msg and latest_msg.created_at) else None,
            "unread_count": unread_count
        })

    conversations.sort(
        key=lambda c: c["last_message_at"] or "",
        reverse=True
    )

    return {"conversations": conversations}
