import yfinance as yf
from fastapi import APIRouter
import pandas as pd

router = APIRouter(
    prefix="/stocks",
    tags=["Stocks"]
)

PRESET_STOCKS = [
    ("RELIANCE.NS", "Reliance Industries"),
    ("TCS.NS", "Tata Consultancy Services"),
    ("INFY.NS", "Infosys"),
    ("HDFCBANK.NS", "HDFC Bank"),
    ("ICICIBANK.NS", "ICICI Bank"),
    ("SBIN.NS", "State Bank of India"),
]

@router.get("/{symbol}/chart")
def stock_chart(
    symbol: str,
    period: str = "6mo"
):
    ticker = yf.Ticker(symbol)

    df = ticker.history(period=period)

    return {
        "chart": [
            {
                "date": str(index.date()),
                "close": round(float(row["Close"]), 2)
            }
            for index, row in df.iterrows()
        ]
    }

@router.get("/preset")
def get_preset_stocks():
    stocks = []

    for symbol, name in PRESET_STOCKS:
        try:
            ticker = yf.Ticker(symbol)

            info = ticker.history(period="2d")

            if len(info) == 0:
                continue

            current_price = round(
                float(info["Close"].iloc[-1]),
                2
            )
            ma50 = round(
                float(df["Close"].rolling(50).mean().iloc[-1]),
                2
            )

            info = ticker.info

            previous_price = round(
                float(info["Close"].iloc[-2]),
                2
            )

            change = round(
                current_price - previous_price,
                2
            )

            change_percent = round(
                (change / previous_price) * 100,
                2
            )

            stocks.append({
                "symbol": symbol,
                "name": name,
                "price": current_price,
                "change": change,
                "change_percent": change_percent
            })

        except Exception as e:
            print(e)

    return {
        "stocks": stocks
    }
INDIAN_STOCKS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services"},
    {"symbol": "INFY.NS", "name": "Infosys"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank"},
    {"symbol": "SBIN.NS", "name": "State Bank of India"},
]

@router.get("/top-picks")
def top_picks():

    return {
        "stocks": [
            {
                "symbol": "RELIANCE.NS",
                "signal": "BUY"
            },
            {
                "symbol": "ICICIBANK.NS",
                "signal": "BUY"
            },
            {
                "symbol": "INFY.NS",
                "signal": "BUY"
            }
        ]
    }

@router.get("/news")
def market_news():

    ticker = yf.Ticker("^NSEI")

    news_items = []

    try:

        for item in ticker.news[:5]:

            content = item.get("content", {})

            news_items.append({
                "title": content.get("title"),
                "publisher": content.get("provider", {}).get("displayName"),
                "link": content.get("clickThroughUrl", {}).get("url")
            })

    except Exception as e:
        print(e)

    return {
        "news": news_items
    }
    

@router.get("/search")
def search_stock(q: str = ""):
    q = q.lower()

    results = [
        stock
        for stock in INDIAN_STOCKS
        if q in stock["symbol"].lower()
        or q in stock["name"].lower()
    ]

    return {
        "results": results[:10]
    }

@router.get("/{symbol}")
def stock_details(symbol: str):

    ticker = yf.Ticker(symbol)

    df = ticker.history(period="6mo")

    if df.empty:
        return {
            "error": "Stock not found"
        }

    current_price = round(
        float(df["Close"].iloc[-1]),
        2
    )

    ma50 = round(
        float(df["Close"].rolling(50).mean().iloc[-1]),
        2
    )

    info = ticker.info

    # 20 Day Moving Average
    ma20 = round(
        float(df["Close"].rolling(20).mean().iloc[-1]),
        2
    )

    # RSI Calculation
    delta = df["Close"].diff()

    gain = delta.where(
        delta > 0,
        0
    )

    loss = -delta.where(
        delta < 0,
        0
    )

    avg_gain = gain.rolling(14).mean()

    avg_loss = loss.rolling(14).mean()

    rs = avg_gain / avg_loss

    rsi = round(
        float(
            100 - (
                100 / (1 + rs.iloc[-1])
            )
        ),
        2
    )

    signal = "HOLD"

    if current_price > ma20 and rsi < 70:
        signal = "BUY"

    elif current_price < ma20 and rsi > 30:
        signal = "SELL"

    return {
    "symbol": symbol,
    "price": current_price,
    "ma20": ma20,
    "ma50": ma50,
    "rsi": rsi,
    "signal": signal,

    "market_cap": info.get("marketCap"),
    "pe_ratio": info.get("trailingPE"),
    "sector": info.get("sector"),
    "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
    "fifty_two_week_low": info.get("fiftyTwoWeekLow"),

    "chart": [
    {
        "date": str(index.date()),
        "close": round(float(row["Close"]), 2),
        "ma20": round(
            float(df["Close"].rolling(20).mean().loc[index]),
            2
        ) if pd.notna(
            df["Close"].rolling(20).mean().loc[index]
        ) else None,

        "ma50": round(
            float(df["Close"].rolling(50).mean().loc[index]),
            2
        ) if pd.notna(
            df["Close"].rolling(50).mean().loc[index]
        ) else None
    }
    for index, row in df.iterrows()
]
    }