import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.database import get_db
from models.wallet import UserWallet
from models.user import User
from models.transaction import Transaction

router = APIRouter(
    prefix="/wallet",
    tags=["Wallet & Rewards"]
)

AVAILABLE_TASKS = [
    {
        "id": "signup_bonus",
        "title": "Welcome Starter Bonus",
        "reward_cash": 10000.0,
        "reward_points": 500,
        "description": "Auto-credited when you join StockSikh.",
        "auto_claimed": True
    },
    {
        "id": "phone_bonus",
        "title": "Verify Mobile Number",
        "reward_cash": 500.0,
        "reward_points": 100,
        "description": "Add your phone number to secure your paper trading account.",
        "auto_claimed": False
    },
    {
        "id": "dob_bonus",
        "title": "Set Birthday & Investor Profile",
        "reward_cash": 500.0,
        "reward_points": 100,
        "description": "Unlock age-appropriate risk-weighted portfolio simulations.",
        "auto_claimed": False
    },
    {
        "id": "first_trade",
        "title": "Execute Your First Paper Trade",
        "reward_cash": 1000.0,
        "reward_points": 250,
        "description": "Buy any Indian stock using virtual cash to claim this bonus.",
        "auto_claimed": False
    },
    {
        "id": "streak_bonus",
        "title": "Weekly 7-Day Market Streak",
        "reward_cash": 1500.0,
        "reward_points": 300,
        "description": "Track Indian stocks for 7 consecutive days to claim reward.",
        "auto_claimed": False
    }
]

XP_MILESTONE_ID = "xp_milestone_1000_cash"
XP_MILESTONE_THRESHOLD = 1000
XP_MILESTONE_CASH = 1000.0

from typing import Optional
from routes.auth import get_current_user

class ClaimTaskRequest(BaseModel):
    task_id: str
    phone: Optional[str] = None
    dob: Optional[str] = None


def ensure_xp_milestone(wallet: UserWallet, db: Session) -> bool:
    """Credit the 1,000 XP paper-cash milestone once for this wallet."""
    try:
        claimed = json.loads(wallet.claimed_tasks or "[]")
    except (TypeError, ValueError):
        claimed = []

    if wallet.reward_points < XP_MILESTONE_THRESHOLD or XP_MILESTONE_ID in claimed:
        return False

    wallet.virtual_cash = round(wallet.virtual_cash + XP_MILESTONE_CASH, 2)
    claimed.append(XP_MILESTONE_ID)
    wallet.claimed_tasks = json.dumps(claimed)
    db.commit()
    db.refresh(wallet)
    return True


def sync_wallet_xp(wallet: UserWallet, db: Session, claimed: list[str]) -> bool:
    """Reconcile legacy wallet XP with claimed rewards and persisted lesson XP."""
    claimed_reward_xp = sum(
        task["reward_points"]
        for task in AVAILABLE_TASKS
        if task["id"] in claimed
    )
    try:
        from models.learning import LearningProgress
        learning_xp = sum(
            progress.xp_earned
            for progress in db.query(LearningProgress).filter(
                LearningProgress.user_id == wallet.user_id,
            ).all()
        )
    except Exception:
        learning_xp = 0

    auditable_xp = claimed_reward_xp + learning_xp
    canonical_xp = max(wallet.reward_points or 0, auditable_xp)
    if canonical_xp == wallet.reward_points:
        return False

    wallet.reward_points = canonical_xp
    db.commit()
    db.refresh(wallet)
    return True

def get_or_create_wallet(user_id: int, db: Session) -> UserWallet:
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user_id).first()
    if not wallet:
        wallet = UserWallet(
            user_id=user_id,
            virtual_cash=10000.0,
            reward_points=500,
            claimed_tasks=json.dumps(["signup_bonus"])
        )
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

@router.get("/balance")
def get_wallet_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(current_user.id, db)
    user = current_user
    try:
        claimed = json.loads(wallet.claimed_tasks)
    except Exception:
        claimed = ["signup_bonus"]

    # Auto-credit profile bonuses if user already provided them during signup
    has_updated = False
    if user and user.phone and "phone_bonus" not in claimed:
        wallet.virtual_cash += 500.0
        wallet.reward_points += 100
        claimed.append("phone_bonus")
        has_updated = True

    if user and user.dob and "dob_bonus" not in claimed:
        wallet.virtual_cash += 500.0
        wallet.reward_points += 100
        claimed.append("dob_bonus")
        has_updated = True

    if has_updated:
        wallet.claimed_tasks = json.dumps(claimed)
        db.commit()
        db.refresh(wallet)

    sync_wallet_xp(wallet, db, claimed)
    if ensure_xp_milestone(wallet, db) and XP_MILESTONE_ID not in claimed:
        claimed.append(XP_MILESTONE_ID)

    # Annotate tasks with is_claimed
    task_list = []
    for t in AVAILABLE_TASKS:
        t_copy = dict(t)
        t_copy["is_claimed"] = t["id"] in claimed
        if t["id"] in {"signup_bonus", "phone_bonus", "dob_bonus"}:
            t_copy["is_completed"] = True
        elif t["id"] == "first_trade":
            t_copy["is_completed"] = db.query(Transaction).filter(
                Transaction.user_id == current_user.id,
                Transaction.trade_type == "BUY",
            ).first() is not None
        else:
            # No persistent streak tracker exists yet, so do not invent progress.
            t_copy["is_completed"] = False
        t_copy["can_claim"] = t_copy["is_completed"] and not t_copy["is_claimed"]
        task_list.append(t_copy)

    return {
        "user_id": wallet.user_id,
        "virtual_cash": round(wallet.virtual_cash, 2),
        "reward_points": wallet.reward_points,
        "claimed_tasks": claimed,
        "xp_milestone": {
            "threshold": XP_MILESTONE_THRESHOLD,
            "reward_cash": XP_MILESTONE_CASH,
            "claimed": XP_MILESTONE_ID in claimed,
        },
        "tasks": task_list
    }

@router.post("/claim-task")
def claim_task_reward(
    req: ClaimTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(current_user.id, db)
    try:
        claimed = json.loads(wallet.claimed_tasks)
    except Exception:
        claimed = []

    if req.task_id in claimed:
        return {
            "success": False,
            "message": "This reward has already been claimed!",
            "virtual_cash": wallet.virtual_cash,
            "reward_points": wallet.reward_points
        }

    # Find task details
    matched_task = next((t for t in AVAILABLE_TASKS if t["id"] == req.task_id), None)
    if not matched_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if req.task_id == "first_trade":
        has_trade = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.trade_type == "BUY",
        ).first() is not None
        if not has_trade:
            raise HTTPException(status_code=400, detail="Complete your first paper trade before claiming this reward.")
    if req.task_id == "streak_bonus":
        raise HTTPException(status_code=400, detail="A seven-day market streak is not available yet.")

    # Update user details if provided
    user = db.query(User).filter(User.id == current_user.id).first()
    if user:
        if req.phone:
            user.phone = req.phone
        if req.dob:
            user.dob = req.dob
        db.commit()

    # Credit rewards
    wallet.virtual_cash += matched_task["reward_cash"]
    wallet.reward_points += matched_task["reward_points"]
    claimed.append(req.task_id)
    wallet.claimed_tasks = json.dumps(claimed)

    db.commit()
    db.refresh(wallet)

    return {
        "success": True,
        "message": f"🎉 Congratulations! ₹{matched_task['reward_cash']:.0f} virtual cash credited to your wallet!",
        "reward_cash_added": matched_task["reward_cash"],
        "reward_points_added": matched_task["reward_points"],
        "virtual_cash": round(wallet.virtual_cash, 2),
        "reward_points": wallet.reward_points,
        "claimed_tasks": claimed
    }
