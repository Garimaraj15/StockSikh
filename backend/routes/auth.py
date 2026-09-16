import json
import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database.database import get_db
from models.user import User
from models.wallet import UserWallet
from utils.security import verify_password, create_access_token, hash_password

load_dotenv()

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("JWT_SECRET", "stocksikh-super-secret-jwt-key-2025-groww-inspired")
ALGORITHM = "HS256"

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "learner"  # "learner" or "pro"
    phone: Optional[str] = None
    dob: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
def signup(
    user: UserSignup,
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role or "learner",
        phone=user.phone,
        dob=user.dob,
        points=500
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically create user wallet with ₹10,000 starter bonus
    starter_wallet = UserWallet(
        user_id=new_user.id,
        virtual_cash=10000.0,
        reward_points=500,
        claimed_tasks=json.dumps(["signup_bonus"])
    )
    db.add(starter_wallet)
    db.commit()

    token = create_access_token({
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role
    })

    return {
        "message": "User created successfully with ₹10,000 starter bonus!",
        "token": token,
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "phone": new_user.phone,
            "dob": new_user.dob,
            "points": new_user.points
        }
    }

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if not existing_user or not verify_password(user.password, existing_user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "user_id": existing_user.id,
        "email": existing_user.email,
        "role": existing_user.role
    })

    return {
        "token": token,
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
            "role": existing_user.role,
            "phone": existing_user.phone,
            "dob": existing_user.dob,
            "points": existing_user.points
        }
    }

@router.get("/me")
def get_me(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "dob": user.dob,
        "points": user.points
    }