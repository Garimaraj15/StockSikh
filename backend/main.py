from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, Base
from models.user import User
from models.watchlist import Watchlist
from models.wallet import UserWallet
from models.portfolio import Holding
from models.transaction import Transaction
from models.community import ProQuery

from routes.auth import router as auth_router
from routes.stocks import router as stocks_router
from routes.watchlist import router as watchlist_router
from routes.chatbot import router as chatbot_router
from routes.wallet import router as wallet_router
from routes.portfolio import router as portfolio_router
from routes.community import router as community_router
from routes.creators import router as creators_router

# Ensure all database tables are created safely
try:
    Base.metadata.create_all(bind=engine)
    print("StockSikh database tables initialized successfully.")
except Exception as e:
    print(f"Warning: Could not create tables on engine: {e}")

app = FastAPI(
    title="StockSikh AI Platform API",
    description="Data Science & AI-powered Indian Stock Learning and Simulation Platform",
    version="2.5.0"
)

# Robust CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All Subsystems
app.include_router(auth_router)
app.include_router(stocks_router)
app.include_router(watchlist_router)
app.include_router(wallet_router)
app.include_router(portfolio_router)
app.include_router(community_router)
app.include_router(creators_router)
app.include_router(chatbot_router)

@app.get("/")
def home():
    return {
        "status": "online",
        "platform": "StockSikh AI - Indian Stock Market Paper Trading & Data Science Lab",
        "modules": [
            "Real-Time NSE Stocks & Indices Ribbon",
            "Gamified Virtual Wallet & Rewards Center",
            "Real-Time Live Buy / Sell Paper Trading",
            "NLP Financial News Sentiment Analysis (VADER)",
            "Multi-Factor AI Composite Stock Health Score (0-100)",
            "Pro Helpers Directory & Query Solver Board",
            "Global Creators Hub (Multi-Language YouTube/Insta Filter)",
            "Flying Animated Vidya AI Assistant"
        ]
    }