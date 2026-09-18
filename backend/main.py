import asyncio
import logging
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, Base
from models.user import User
from models.watchlist import Watchlist
from models.wallet import UserWallet
from models.portfolio import Holding
from models.transaction import Transaction
from models.snapshot import PortfolioSnapshot
from models.learning import LearningProgress
from models.community import ProQuery, Clan, ClanMembership, DirectMessage
from models.notification import Notification

from routes.auth import router as auth_router
from routes.stocks import router as stocks_router
from routes.watchlist import router as watchlist_router
from routes.chatbot import router as chatbot_router
from routes.wallet import router as wallet_router
from routes.portfolio import router as portfolio_router
from routes.community import router as community_router
from routes.creators import router as creators_router
from routes.notifications import router as notifications_router
from routes.gamification import router as gamification_router
from routes.multi_asset import router as multi_asset_router

from utils.stock_alert_service import run_price_alerts
from utils.news_alert_service import run_news_alerts

logger = logging.getLogger(__name__)

# Ensure all database tables are created safely
try:
    Base.metadata.create_all(bind=engine)
    print("StockSikh database tables initialized successfully.")
except Exception as e:
    print(f"Warning: Could not create tables on engine: {e}")


# ─── Lifespan: start/stop background alert monitoring ─────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    On startup  → creates price-alert and news-alert monitoring asyncio tasks.
    On shutdown → cancels them cleanly.
    """
    price_alert_task = asyncio.create_task(run_price_alerts())
    news_alert_task = asyncio.create_task(run_news_alerts())
    logger.info("StockSikh price-alert and news-alert monitoring tasks started.")
    try:
        yield
    finally:
        price_alert_task.cancel()
        news_alert_task.cancel()
        for task in [price_alert_task, news_alert_task]:
            try:
                await task
            except asyncio.CancelledError:
                pass
        logger.info("StockSikh background monitoring tasks stopped cleanly.")


app = FastAPI(
    title="StockSikh AI Platform API",
    description="Data Science & AI-powered Indian Stock Learning and Simulation Platform",
    version="2.5.0",
    lifespan=lifespan,
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

@app.middleware("http")
async def normalize_path_slashes(request: Request, call_next):
    raw_path = request.scope.get("path", "")
    if "//" in raw_path:
        request.scope["path"] = re.sub(r"/+", "/", raw_path)
    return await call_next(request)

# Register All Subsystems
app.include_router(auth_router)
app.include_router(stocks_router)
app.include_router(watchlist_router)
app.include_router(wallet_router)
app.include_router(portfolio_router)
app.include_router(community_router)
app.include_router(creators_router)
app.include_router(chatbot_router)
app.include_router(notifications_router)
app.include_router(gamification_router)
app.include_router(multi_asset_router)

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