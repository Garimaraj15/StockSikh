import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import bcrypt
from jose import jwt

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "stocksikh-super-secret-jwt-key-2025-groww-inspired")
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    # bcrypt standard 72-byte truncation
    pw_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)