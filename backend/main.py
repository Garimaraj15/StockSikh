from fastapi import FastAPI
from routes.chatbot import router as chatbot_router
from database.database import engine
from models.user import User
from database.database import Base
from routes.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from routes.stocks import router as stocks_router
from routes.watchlist import router as watchlist_router

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(stocks_router)
app.include_router(watchlist_router)
app.include_router(chatbot_router)
@app.get("/")
def home():
    return {
        "message": "StockSikh Backend Running",
        "database": "MySQL Connected"
    }