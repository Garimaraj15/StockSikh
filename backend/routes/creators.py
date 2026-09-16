from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter(
    prefix="/creators",
    tags=["Global Helpers & Creators"]
)

CREATORS_DATABASE = [
    {
        "id": 1,
        "name": "CA Rachana Ranade",
        "platform": "YouTube",
        "language": "Hindi",
        "language_code": "hi",
        "subscribers": "4.8M+",
        "category": "Stock Market Basics & Fundamental Analysis",
        "featured_video_title": "Stock Market for Beginners - Complete Zero to Hero Guide",
        "video_embed_id": "Xn7KWR9EOGQ",
        "youtube_url": "https://www.youtube.com/@CARachanaRanade",
        "instagram_url": "https://www.instagram.com/carachanaranade",
        "description": "Simplifies complex accounting, balance sheets, and stock investing concepts for Indian beginners in pure Hindi."
    },
    {
        "id": 2,
        "name": "Pranjal Kamra (Finology)",
        "platform": "YouTube",
        "language": "Hindi",
        "language_code": "hi",
        "subscribers": "6.2M+",
        "category": "Value Investing & Long Term Compounding",
        "featured_video_title": "How to Pick Winning Multibagger Stocks in India",
        "video_embed_id": "4W2e1sA2_kU",
        "youtube_url": "https://www.youtube.com/@pranjalkamra",
        "instagram_url": "https://www.instagram.com/myfinology",
        "description": "Explains Warren Buffett principles, company moat analysis, and how to stay disciplined in Indian stock markets."
    },
    {
        "id": 3,
        "name": "Akshat Shrivastava",
        "platform": "YouTube",
        "language": "English",
        "language_code": "en",
        "subscribers": "2.2M+",
        "category": "Macroeconomics & Business Models",
        "featured_video_title": "Understanding Macroeconomic Trends & Indian Equities",
        "video_embed_id": "b-h_vySmHyo",
        "youtube_url": "https://www.youtube.com/@AkshatZayn",
        "instagram_url": "https://www.instagram.com/akshat.world",
        "description": "Deep-dives into Indian macroeconomic cycles, global liquidity, and business fundamentals in English & Hinglish."
    },
    {
        "id": 4,
        "name": "Asset Yogi",
        "platform": "YouTube",
        "language": "Hindi",
        "language_code": "hi",
        "subscribers": "4.1M+",
        "category": "Personal Finance & Index Investing",
        "featured_video_title": "Nifty 50 vs Direct Stocks: Which is Better for Beginners?",
        "video_embed_id": "4q1s6z7pL6Y",
        "youtube_url": "https://www.youtube.com/@AssetYogi",
        "instagram_url": "https://www.instagram.com/assetyogi",
        "description": "Step-by-step guides on index funds, demat accounts, and tax-saving investing strategies."
    },
    {
        "id": 5,
        "name": "FinnovationZ by Prasad",
        "platform": "YouTube",
        "language": "Marathi",
        "language_code": "mr",
        "subscribers": "2.4M+",
        "category": "Marathi Stock Market Learning",
        "featured_video_title": "शेअर मार्केट म्हणजे काय? (What is Share Market in Marathi)",
        "video_embed_id": "dQw4w9WgXcQ",
        "youtube_url": "https://www.youtube.com/@FinnovationZMarathi",
        "instagram_url": "https://www.instagram.com/finnovationz",
        "description": "Stock market education specifically crafted for Marathi speaking investors across Maharashtra."
    },
    {
        "id": 6,
        "name": "Stock Market Telugu (Naveen)",
        "platform": "YouTube",
        "language": "Telugu",
        "language_code": "te",
        "subscribers": "1.5M+",
        "category": "Telugu Technical & Price Action",
        "featured_video_title": "స్టాక్ మార్కెట్ బేసిక్స్ (Stock Market Basics in Telugu)",
        "video_embed_id": "e_bL_Z9T123",
        "youtube_url": "https://www.youtube.com/@DayTraderTelugu",
        "instagram_url": "https://www.instagram.com",
        "description": "Telugu language candlestick charts, moving average setups, and swing trading education."
    },
    {
        "id": 7,
        "name": "Tamil Share Market (Arivu)",
        "platform": "YouTube",
        "language": "Tamil",
        "language_code": "ta",
        "subscribers": "1.2M+",
        "category": "Tamil Stock Mentorship",
        "featured_video_title": "பங்குச் சந்தை அடிப்படைகள் (Stock Market in Tamil)",
        "video_embed_id": "aBcDeFgHiJk",
        "youtube_url": "https://www.youtube.com",
        "instagram_url": "https://www.instagram.com",
        "description": "Simple Tamil tutorials explaining RSI, support & resistance, and demat operations."
    },
    {
        "id": 8,
        "name": "Share Market Bengali (Bangla)",
        "platform": "YouTube",
        "language": "Bengali",
        "language_code": "bn",
        "subscribers": "850K+",
        "category": "Bengali Share Market Gyan",
        "featured_video_title": "শেয়ার বাজার কি এবং কীভাবে শুরু করবেন (Share Market in Bengali)",
        "video_embed_id": "bNgL_123456",
        "youtube_url": "https://www.youtube.com",
        "instagram_url": "https://www.instagram.com",
        "description": "Step-by-step Bengali tutorials for novice traders in West Bengal and beyond."
    }
]

LANGUAGES = [
    {"label": "All Languages", "code": "ALL"},
    {"label": "Hindi", "code": "hi"},
    {"label": "English / Hinglish", "code": "en"},
    {"label": "Marathi", "code": "mr"},
    {"label": "Telugu", "code": "te"},
    {"label": "Tamil", "code": "ta"},
    {"label": "Bengali", "code": "bn"},
]

@router.get("/")
def get_creators(
    language: Optional[str] = Query("ALL", description="Language code filter")
):
    """Returns curated creators filtered by language."""
    if not language or language == "ALL":
        filtered = CREATORS_DATABASE
    else:
        filtered = [c for c in CREATORS_DATABASE if c["language_code"] == language.lower()]

    return {
        "creators": filtered,
        "languages": LANGUAGES,
        "total": len(filtered)
    }
