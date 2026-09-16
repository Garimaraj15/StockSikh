import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.database import get_db
from models.wallet import UserWallet
from models.user import User

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

class ClaimTaskRequest(BaseModel):
    user_id: int
    task_id: str
    phone: str = None
    dob: str = None

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
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(user_id, db)
    try:
        claimed = json.loads(wallet.claimed_tasks)
    except Exception:
        claimed = ["signup_bonus"]

    # Annotate tasks with is_claimed
    task_list = []
    for t in AVAILABLE_TASKS:
        t_copy = dict(t)
        t_copy["is_claimed"] = t["id"] in claimed
        task_list.append(t_copy)

    return {
        "user_id": wallet.user_id,
        "virtual_cash": round(wallet.virtual_cash, 2),
        "reward_points": wallet.reward_points,
        "claimed_tasks": claimed,
        "tasks": task_list
    }

@router.post("/claim-task")
def claim_task_reward(
    req: ClaimTaskRequest,
    db: Session = Depends(get_db)
):
    wallet = get_or_create_wallet(req.user_id, db)
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

    # Update user details if provided
    user = db.query(User).filter(User.id == req.user_id).first()
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
