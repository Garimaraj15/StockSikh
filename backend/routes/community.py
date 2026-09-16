import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.database import get_db
from models.community import ProQuery
from models.user import User

router = APIRouter(
    prefix="/community",
    tags=["Pro Helpers & Community"]
)

PRO_TRADERS = [
    {
        "id": 101,
        "name": "Amit Singhal, CFA",
        "avatar": "AS",
        "specialization": "Large Cap & Swing Momentum",
        "experience": "8+ Years in NSE Markets",
        "accuracy_rating": "86% Win Rate",
        "badge": "⭐ Verified Pro Trader",
        "bio": "Specializes in 20-day breakout setups and institutional volume analysis across Nifty 50."
    },
    {
        "id": 102,
        "name": "Pooja Verma",
        "avatar": "PV",
        "specialization": "Price Action & RSI Reversals",
        "experience": "5+ Years Full-Time Trader",
        "accuracy_rating": "82% Win Rate",
        "badge": "🏆 Top Technical Mentor",
        "bio": "Mentoring beginners on risk-to-reward management and RSI divergence setups."
    },
    {
        "id": 103,
        "name": "Karan Malhotra",
        "avatar": "KM",
        "specialization": "Banking & IT Sector Valuation",
        "experience": "6+ Years Equity Research",
        "accuracy_rating": "89% Win Rate",
        "badge": "💎 Fundamental Pro",
        "bio": "Focuses on undervalued Indian blue-chip stocks with strong quarterly ROCE."
    }
]

class AskQueryRequest(BaseModel):
    learner_id: int
    learner_name: str
    title: str
    query_text: str
    stock_symbol: Optional[str] = "GENERAL"

class ReplyQueryRequest(BaseModel):
    query_id: int
    pro_name: str
    pro_badge: str
    reply_text: str

@router.get("/pros")
def get_pro_helpers():
    """Returns directory of verified Pro Traders for mentorship."""
    return {"pros": PRO_TRADERS}

@router.get("/queries")
def get_queries(
    stock_symbol: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns community trading questions and solutions."""
    query = db.query(ProQuery)
    if stock_symbol and stock_symbol != "ALL":
        query = query.filter(ProQuery.stock_symbol == stock_symbol.upper())

    records = query.order_by(ProQuery.created_at.desc()).limit(30).all()

    # Default starter seed queries if table is empty
    if not records:
        return {
            "queries": [
                {
                    "id": 1,
                    "learner_name": "Rohan M.",
                    "stock_symbol": "RELIANCE.NS",
                    "title": "Should I enter Reliance at current ₹1257 price?",
                    "query_text": "I noticed RSI is around 36 and price is below MA20. Is this a good time to average or wait for a trend reversal?",
                    "status": "RESOLVED",
                    "replies": [
                        {
                            "pro_name": "Amit Singhal, CFA",
                            "pro_badge": "⭐ Verified Pro",
                            "reply_text": "Wait for price to cross above ₹1300 with volume before fresh entry. RSI below 40 shows oversold conditions, but confirmation is key."
                        }
                    ],
                    "created_at": "Today, 11:30 AM"
                },
                {
                    "id": 2,
                    "learner_name": "Ananya K.",
                    "stock_symbol": "TCS.NS",
                    "title": "Is TCS suitable for long-term paper trading portfolio?",
                    "query_text": "Looking to allocate 20% of my virtual money in IT sector. Is TCS valuation reasonable right now?",
                    "status": "RESOLVED",
                    "replies": [
                        {
                            "pro_name": "Karan Malhotra",
                            "pro_badge": "💎 Fundamental Pro",
                            "reply_text": "Yes! TCS has consistent 35%+ ROCE and high cash flows. Steady blue-chip anchor for paper portfolios."
                        }
                    ],
                    "created_at": "Yesterday, 4:15 PM"
                }
            ]
        }

    results = []
    for r in records:
        try:
            reps = json.loads(r.replies)
        except Exception:
            reps = []
        results.append({
            "id": r.id,
            "learner_name": r.learner_name,
            "stock_symbol": r.stock_symbol,
            "title": r.title,
            "query_text": r.query_text,
            "status": r.status,
            "replies": reps,
            "created_at": str(r.created_at.strftime("%b %d, %H:%M")) if r.created_at else "Recently"
        })

    return {"queries": results}

@router.post("/ask")
def post_learner_query(
    req: AskQueryRequest,
    db: Session = Depends(get_db)
):
    if not req.title.strip() or not req.query_text.strip():
        raise HTTPException(status_code=400, detail="Title and question text are required")

    new_q = ProQuery(
        learner_id=req.learner_id,
        learner_name=req.learner_name,
        stock_symbol=req.stock_symbol.upper() if req.stock_symbol else "GENERAL",
        title=req.title,
        query_text=req.query_text,
        status="OPEN",
        replies="[]"
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    return {
        "success": True,
        "message": "Query posted successfully to the Pro Helpers Board!",
        "id": new_q.id
    }

@router.post("/reply")
def reply_to_query(
    req: ReplyQueryRequest,
    db: Session = Depends(get_db)
):
    q = db.query(ProQuery).filter(ProQuery.id == req.query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    try:
        reps = json.loads(q.replies)
    except Exception:
        reps = []

    reps.append({
        "pro_name": req.pro_name,
        "pro_badge": req.pro_badge,
        "reply_text": req.reply_text
    })

    q.replies = json.dumps(reps)
    q.status = "RESOLVED"
    db.commit()

    return {
        "success": True,
        "message": "Answer published!",
        "replies": reps
    }
