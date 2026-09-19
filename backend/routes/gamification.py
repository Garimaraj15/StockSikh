import json
import math
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import yfinance as yf
from database.database import get_db
from models.learning import LearningProgress
from models.portfolio import Holding
from models.wallet import UserWallet
from routes.auth import get_current_user
from routes.wallet import (
    ClaimTaskRequest,
    XP_MILESTONE_CASH,
    XP_MILESTONE_ID,
    XP_MILESTONE_THRESHOLD,
    claim_task_reward,
    get_wallet_balance,
)
from routes.stocks import INDIAN_STOCKS, clean_float

router = APIRouter(prefix="/gamification", tags=["Gamification"])


class LessonAnswerRequest(BaseModel):
    lesson_id: str
    concept_index: int
    answer_index: int


def get_market_context():
    context = {}
    for key, symbol, label in (("nifty", "^NSEI", "NIFTY 50"), ("stock", "RELIANCE.NS", "Reliance Industries")):
        try:
            history = yf.Ticker(symbol).history(period="2d")
            if not history.empty and "Close" in history:
                closes = [float(v) for v in history["Close"].dropna() if math.isfinite(float(v))]
                if closes:
                    current = clean_float(closes[-1])
                    previous = clean_float(closes[-2]) if len(closes) > 1 else None
                    context[key] = {"label": label, "current": current, "previous": previous}
        except Exception:
            continue
    return context


def serialize_lesson(lesson: dict, progress: LearningProgress | None, market_context: dict):
    answers = json.loads(progress.answers_json) if progress else {}
    terms = []
    for index, term in enumerate(lesson["terms"]):
        public_term = {key: value for key, value in term.items() if key != "quiz"}
        quiz = term["quiz"]
        public_term["quiz"] = {
            "question": quiz["question"],
            "options": quiz["options"],
            "xp_reward": quiz["xp_reward"],
            "answered": str(index) in answers,
            "correct": answers.get(str(index), {}).get("correct") if str(index) in answers else None,
        }
        context = market_context.get(term.get("context_key"))
        if context:
            if context["previous"] is not None:
                change = round(context["current"] - context["previous"], 2)
                public_term["market_context"] = f"Based on current market data: {context['label']} is ₹{context['current']:,.2f}; its previous close was ₹{context['previous']:,.2f}, a change of {'+' if change >= 0 else ''}₹{change:,.2f}."
            else:
                public_term["market_context"] = f"Based on current market data: {context['label']} is ₹{context['current']:,.2f}."
        else:
            public_term["market_context"] = None
        terms.append(public_term)
    return {key: value for key, value in lesson.items() if key != "terms"} | {
        "terms": terms,
        "progress": {
            "answered": len(answers),
            "correct": sum(1 for item in answers.values() if item.get("correct")),
            "xp_earned": progress.xp_earned if progress else 0,
            "completed": bool(progress and progress.completed_at),
        },
    }


@router.get("/daily-lesson")
def get_today_learning_lesson(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lesson = get_daily_lesson()
    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.lesson_date == date.today(),
    ).first()
    return serialize_lesson(lesson, progress, get_market_context())


@router.post("/daily-lesson/answer")
def answer_daily_lesson(
    request: LessonAnswerRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lesson = get_daily_lesson()
    if request.lesson_id != lesson["lesson_id"]:
        raise HTTPException(status_code=400, detail="This lesson is no longer active.")
    if request.concept_index not in range(4) or request.answer_index not in range(4):
        raise HTTPException(status_code=400, detail="Invalid lesson answer.")

    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.lesson_date == date.today(),
    ).first()
    if not progress:
        progress = LearningProgress(user_id=current_user.id, lesson_date=date.today(), lesson_id=lesson["lesson_id"])
        db.add(progress)
        db.flush()

    answers = json.loads(progress.answers_json or "{}")
    answer_key = str(request.concept_index)
    if answer_key in answers:
        return {"already_answered": True, "answer": answers[answer_key], "xp_earned": progress.xp_earned, "lesson_complete": bool(progress.completed_at)}

    quiz = lesson["terms"][request.concept_index]["quiz"]
    is_correct = request.answer_index == quiz["correct_answer"]
    earned = quiz["xp_reward"] if is_correct else 0
    answers[answer_key] = {"answer_index": request.answer_index, "correct": is_correct}
    progress.answers_json = json.dumps(answers)
    progress.xp_earned += earned
    wallet = db.query(UserWallet).filter(UserWallet.user_id == current_user.id).first()
    if wallet and earned:
        wallet.reward_points += earned

    completion_bonus = 0
    if len(answers) == 4 and not progress.completion_bonus_awarded:
        progress.completion_bonus_awarded = True
        progress.completed_at = datetime.utcnow()
        completion_bonus = 40
        progress.xp_earned += completion_bonus
        if wallet:
            wallet.reward_points += completion_bonus

    db.commit()
    return {
        "already_answered": False,
        "correct": is_correct,
        "correct_answer": quiz["correct_answer"],
        "explanation": quiz["explanation"],
        "xp_awarded": earned,
        "completion_bonus": completion_bonus,
        "xp_earned": progress.xp_earned,
        "lesson_complete": bool(progress.completed_at),
    }

LEVELS = [
    {"level": 1, "name": "Market Starter", "minimum_xp": 0, "next_unlock": "Reading Stock Movements Learning Track"},
    {"level": 2, "name": "Market Explorer", "minimum_xp": 200, "next_unlock": "Fundamental Analysis Learning Track"},
    {"level": 3, "name": "Market Learner", "minimum_xp": 500, "next_unlock": "Technical Analysis Learning Track"},
    {"level": 4, "name": "Smart Trader", "minimum_xp": 1000, "next_unlock": "Options Basics Learning Track"},
]


def get_learning_badges(current_user, db):
    completed_lessons = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.completed_at.isnot(None),
    ).all()
    holdings = db.query(Holding).filter(Holding.user_id == current_user.id, Holding.quantity > 0).all()
    sector_map = {stock["symbol"]: stock.get("sector") for stock in INDIAN_STOCKS}
    sectors = {sector_map.get(holding.symbol) for holding in holdings if sector_map.get(holding.symbol)}
    perfect_quiz = any(
        sum(1 for answer in json.loads(progress.answers_json or "{}").values() if answer.get("correct")) == 4
        for progress in completed_lessons
    )
    risk_complete = any(progress.lesson_id in {"curriculum-day-9", "curriculum-day-10"} for progress in completed_lessons)
    badges = [
        {"id": "first_learner", "name": "First Learner", "icon": "🌱", "description": "Complete your first daily lesson.", "earned": bool(completed_lessons)},
        {"id": "perfect_quiz", "name": "Perfect Quiz", "icon": "🎯", "description": "Answer all four daily mini quizzes correctly.", "earned": perfect_quiz},
        {"id": "risk_aware", "name": "Risk Aware", "icon": "🛡️", "description": "Complete the Risk Management learning track.", "earned": risk_complete},
        {"id": "diversified_investor", "name": "Diversified Investor", "icon": "📊", "description": "Hold stocks from at least two known sectors.", "earned": len(sectors) >= 2},
        {"id": "learning_streak", "name": "Learning Streak", "icon": "🔥", "description": "Complete lessons on seven consecutive days.", "earned": False},
    ]
    return badges


def get_learning_streak(current_user, db):
    completed_dates = {
        progress.lesson_date
        for progress in db.query(LearningProgress).filter(
            LearningProgress.user_id == current_user.id,
            LearningProgress.completed_at.isnot(None),
        ).all()
    }
    streak = 0
    current_date = date.today()
    while current_date in completed_dates:
        streak += 1
        current_date -= timedelta(days=1)
    return streak

@router.get("/status")
def get_gamification_status(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wallet_data = get_wallet_balance(current_user, db)
    learning_progress = db.query(LearningProgress).filter(LearningProgress.user_id == current_user.id).all()
    total_xp = wallet_data["reward_points"]
    current_level = max(
        (level for level in LEVELS if total_xp >= level["minimum_xp"]),
        key=lambda level: level["minimum_xp"],
    )
    next_level = next((level for level in LEVELS if level["minimum_xp"] > total_xp), None)
    tier_name = current_level["name"]
    tier_level = current_level["level"]
    next_xp = next_level["minimum_xp"] if next_level else current_level["minimum_xp"]
    next_unlock = next_level["next_unlock"] if next_level else "All current learning tracks available"
    streak = get_learning_streak(current_user, db)

    return {
        "username": getattr(current_user, "username", "Trader") if current_user else "Trader",
        "total_xp": total_xp,
        "tier_name": tier_name,
        "tier_level": tier_level,
        "tier_badge": "📚",
        "current_level_progress": total_xp,
        "next_level_xp": next_xp,
        "next_unlock": next_unlock,
        "xp_milestone": {
            "threshold": XP_MILESTONE_THRESHOLD,
            "reward_cash": XP_MILESTONE_CASH,
            "current_xp": total_xp,
            "remaining_xp": max(0, XP_MILESTONE_THRESHOLD - total_xp),
            "claimed": XP_MILESTONE_ID in wallet_data["claimed_tasks"],
        },
        "login_streak_days": streak or None,
        "quests": [
            {
                "id": task["id"],
                "title": task["title"],
                "description": task["description"],
                "xp_reward": task["reward_points"],
                "paper_cash_reward": task["reward_cash"],
                "progress": 1 if task["is_completed"] else 0,
                "target": 1,
                "completed": task["is_completed"],
                "claimed": task["is_claimed"],
                "can_claim": task["can_claim"],
                "category": "REWARDS"
            }
            for task in wallet_data["tasks"]
        ],
        "badges": get_learning_badges(current_user, db)
    }

@router.post("/claim-quest/{quest_id}")
def claim_quest_reward(
    quest_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return claim_task_reward(ClaimTaskRequest(task_id=quest_id), current_user, db)
