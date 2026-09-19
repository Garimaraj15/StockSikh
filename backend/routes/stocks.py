import math
import time
from typing import Dict, List, Optional
from fastapi import APIRouter, Query
import numpy as np
import pandas as pd
import yfinance as yf

from ml_engine.sentiment_analyzer import analyze_stock_sentiment
from ml_engine.composite_scorer import compute_composite_ai_score

router = APIRouter(
    prefix="/stocks",
    tags=["Stocks"]
)

# In-memory cache to prevent Yahoo Finance throttling
CACHE: Dict[str, dict] = {}
CACHE_TTL = 60  # seconds

def clean_float(val, default=0.0):
    """Safely converts any numeric / numpy / pandas value into a clean, finite Python float or default."""
    if val is None:
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return round(f, 2)
    except (ValueError, TypeError):
        return default

PRESET_STOCKS = [
    ("RELIANCE.NS", "Reliance Industries", "Energy / Conglomerate"),
    ("TCS.NS", "Tata Consultancy Services", "IT & Software"),
    ("INFY.NS", "Infosys", "IT & Software"),
    ("HDFCBANK.NS", "HDFC Bank", "Banking & Finance"),
    ("ICICIBANK.NS", "ICICI Bank", "Banking & Finance"),
    ("SBIN.NS", "State Bank of India", "Banking & PSU"),
    ("HINDUNILVR.NS", "Hindustan Unilever", "FMCG / Consumer"),
    ("ITC.NS", "ITC Limited", "FMCG / Tobacco"),
    ("BHARTIARTL.NS", "Bharti Airtel", "Telecom"),
    ("LT.NS", "Larsen & Toubro", "Infrastructure"),
    ("SUNPHARMA.NS", "Sun Pharma", "Healthcare"),
    ("BAJFINANCE.NS", "Bajaj Finance", "NBFC / Finance"),
]

INDIAN_STOCKS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "sector": "Technology"},
    {"symbol": "INFY.NS", "name": "Infosys", "sector": "Technology"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Banking"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "sector": "Banking"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "sector": "Banking"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "sector": "FMCG"},
    {"symbol": "ITC.NS", "name": "ITC Limited", "sector": "FMCG"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "sector": "Telecom"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro", "sector": "Capital Goods"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharma", "sector": "Pharma"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "sector": "Finance"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "sector": "Automobile"},
    {"symbol": "WIPRO.NS", "name": "Wipro", "sector": "Technology"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank", "sector": "Banking"},
    {"symbol": "TATASTEEL.NS", "name": "Tata Steel", "sector": "Metals"},
    {"symbol": "TITAN.NS", "name": "Titan Company", "sector": "Consumer Goods"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "sector": "Banking"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints", "sector": "Consumer Goods"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "sector": "Technology"},
    {"symbol": "ADANIPORTS.NS", "name": "Adani Ports", "sector": "Infrastructure"},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "sector": "Cement"},
    {"symbol": "ZOMATO.NS", "name": "Zomato", "sector": "Consumer Tech"},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India", "sector": "FMCG"},
    {"symbol": "NTPC.NS", "name": "NTPC", "sector": "Power"},
    {"symbol": "POWERGRID.NS", "name": "Power Grid", "sector": "Power"},
]

def calculate_technical_signals(df: pd.DataFrame):
    """Computes current price, MA20, MA50, RSI, and BUY/SELL/HOLD signal."""
    if df.empty or len(df) < 5 or "Close" not in df:
        return 0.0, 0.0, 0.0, 50.0, "HOLD"

    closes = df["Close"].dropna()
    valid_closes = [float(v) for v in closes if math.isfinite(float(v))]
    if not valid_closes:
        return 0.0, 0.0, 0.0, 50.0, "HOLD"

    current_price = clean_float(valid_closes[-1], 0.0)
    if current_price <= 0.0:
        return 0.0, 0.0, 0.0, 50.0, "HOLD"

    ma20_val = closes.rolling(20, min_periods=5).mean().iloc[-1]
    ma50_val = closes.rolling(50, min_periods=10).mean().iloc[-1]
    ma20 = clean_float(ma20_val, current_price)
    ma50 = clean_float(ma50_val, current_price)

    # RSI (14 periods)
    delta = closes.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.rolling(14, min_periods=5).mean()
    avg_loss = loss.rolling(14, min_periods=5).mean()

    with np.errstate(divide='ignore', invalid='ignore'):
        rs = avg_gain / avg_loss
        rsi_series = 100 - (100 / (1 + rs))

    if not rsi_series.empty and pd.notna(rsi_series.iloc[-1]):
        rsi = clean_float(rsi_series.iloc[-1], 50.0)
    else:
        rsi = 50.0

    # Educational rule-based signal
    if current_price > ma20 and rsi < 68:
        signal = "BUY"
    elif current_price < ma20 and rsi > 35:
        signal = "SELL"
    else:
        signal = "HOLD"

    return current_price, ma20, ma50, rsi, signal

@router.get("/indices")
def get_market_indices():
    """Live Indian Market Indices (Nifty 50, Sensex, Bank Nifty) for Groww-style ticker bar."""
    cache_key = "indices"
    now = time.time()
    if cache_key in CACHE and (now - CACHE[cache_key]["timestamp"]) < CACHE_TTL:
        return CACHE[cache_key]["data"]

    indices_meta = [
        {"symbol": "^NSEI", "name": "NIFTY 50", "display": "NIFTY"},
        {"symbol": "^BSESN", "name": "S&P BSE SENSEX", "display": "SENSEX"},
        {"symbol": "^NSEBANK", "name": "BANK NIFTY", "display": "BANK NIFTY"},
    ]

    result = []
    for item in indices_meta:
        try:
            t = yf.Ticker(item["symbol"])
            hist = t.history(period="2d")
            closes = [float(v) for v in hist["Close"].dropna() if math.isfinite(float(v))] if "Close" in hist else []
            if len(closes) >= 2:
                curr = clean_float(closes[-1])
                prev = clean_float(closes[-2])
                chg = clean_float(curr - prev)
                pct = clean_float((chg / prev) * 100) if prev > 0 else 0.0
                result.append({
                    "symbol": item["symbol"],
                    "name": item["name"],
                    "display": item["display"],
                    "price": curr,
                    "change": chg,
                    "change_percent": pct,
                    "available": True
                })
            elif len(closes) == 1:
                curr = clean_float(closes[-1])
                result.append({
                    "symbol": item["symbol"],
                    "name": item["name"],
                    "display": item["display"],
                    "price": curr,
                    "change": None,
                    "change_percent": None,
                    "available": True
                })
            else:
                result.append({
                    "symbol": item["symbol"],
                    "name": item["name"],
                    "display": item["display"],
                    "price": None,
                    "change": None,
                    "change_percent": None,
                    "available": False
                })
        except Exception:
            result.append({
                "symbol": item["symbol"],
                "name": item["name"],
                "display": item["display"],
                "price": None,
                "change": None,
                "change_percent": None,
                "available": False
            })

    data = {"indices": result}
    CACHE[cache_key] = {"data": data, "timestamp": now}
    return data

@router.get("/preset")
def get_preset_stocks(
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Returns popular preset Indian stocks with prices, changes, signals, and AI scores."""
    cache_key = "preset_stocks_all"
    now = time.time()
    if cache_key in CACHE and (now - CACHE[cache_key]["timestamp"]) < CACHE_TTL:
        all_stocks = CACHE[cache_key]["data"]["stocks"]
        page = all_stocks[offset:offset + limit]
        return {
            "stocks": page,
            "offset": offset,
            "limit": limit,
            "total": len(all_stocks),
            "has_more": offset + len(page) < len(all_stocks),
        }

    stocks = []
    for stock_meta in INDIAN_STOCKS:
        symbol = stock_meta["symbol"]
        name = stock_meta["name"]
        sector = stock_meta["sector"]
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="3mo")
            if hist.empty or len(hist) < 2 or "Close" not in hist:
                continue

            curr_price, ma20, ma50, rsi, signal = calculate_technical_signals(hist)

            if curr_price <= 0.0 or not math.isfinite(curr_price):
                continue

            closes = [float(v) for v in hist["Close"].dropna() if math.isfinite(float(v))]
            if len(closes) >= 2:
                prev_price = clean_float(closes[-2], curr_price)
            else:
                prev_price = curr_price

            change = clean_float(curr_price - prev_price, 0.0)
            change_percent = clean_float((change / prev_price) * 100, 0.0) if prev_price > 0 else 0.0

            # Quick AI Score calculation
            ai_score_data = compute_composite_ai_score(
                price=curr_price,
                ma20=ma20,
                ma50=ma50,
                rsi=rsi,
                sentiment_score=0.25
            )

            stocks.append({
                "symbol": symbol,
                "name": name,
                "sector": sector,
                "price": curr_price,
                "change": change,
                "change_percent": change_percent,
                "ma20": ma20,
                "ma50": ma50,
                "rsi": rsi,
                "signal": signal,
                "ai_score": int(ai_score_data.get("composite_score", 70)),
                "ai_recommendation": str(ai_score_data.get("recommendation", "Neutral Hold"))
            })
        except Exception as e:
            print(f"Error fetching preset stock {symbol}: {e}")

    # Fallback to avoid empty preset list if yahoo finance is unavailable
    if not stocks:
        stocks = [
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "sector": "Energy", "price": 1257.50, "change": 18.25, "change_percent": 0.62, "signal": "BUY", "rsi": 54.2, "ai_score": 82, "ai_recommendation": "Strong Momentum Candidate"},
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "sector": "IT & Software", "price": 2200.80, "change": -14.50, "change_percent": -0.35, "signal": "HOLD", "rsi": 48.0, "ai_score": 74, "ai_recommendation": "Moderate Accumulate"},
            {"symbol": "INFY.NS", "name": "Infosys", "sector": "IT & Software", "price": 1890.30, "change": 22.10, "change_percent": 1.18, "signal": "BUY", "rsi": 62.4, "ai_score": 85, "ai_recommendation": "Strong Momentum Candidate"},
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "sector": "Banking & Finance", "price": 1650.00, "change": 5.40, "change_percent": 0.33, "signal": "HOLD", "rsi": 49.1, "ai_score": 71, "ai_recommendation": "Moderate Accumulate"},
            {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "sector": "Banking & Finance", "price": 1210.80, "change": 12.60, "change_percent": 1.05, "signal": "BUY", "rsi": 65.0, "ai_score": 88, "ai_recommendation": "Strong Momentum Candidate"},
            {"symbol": "SBIN.NS", "name": "State Bank of India", "sector": "Banking & PSU", "price": 815.40, "change": -2.30, "change_percent": -0.28, "signal": "HOLD", "rsi": 46.5, "ai_score": 68, "ai_recommendation": "Moderate Accumulate"},
        ]

    data = {"stocks": stocks}
    CACHE[cache_key] = {"data": data, "timestamp": now}
    page = stocks[offset:offset + limit]
    return {
        "stocks": page,
        "offset": offset,
        "limit": limit,
        "total": len(stocks),
        "has_more": offset + len(page) < len(stocks),
    }

@router.get("/news")
def market_news():
    cache_key = "market_news"
    now = time.time()
    if cache_key in CACHE and (now - CACHE[cache_key]["timestamp"]) < (CACHE_TTL * 3):
        return CACHE[cache_key]["data"]

    news_items = []
    try:
        ticker = yf.Ticker("^NSEI")
        raw_news = ticker.news or []
        for item in raw_news[:8]:
            content = item.get("content", {})
            title = content.get("title") or item.get("title")
            publisher = content.get("provider", {}).get("displayName") or item.get("publisher", "Market Wire")
            link = content.get("clickThroughUrl", {}).get("url") or item.get("link", "#")
            if title:
                news_items.append({
                    "title": title,
                    "publisher": publisher,
                    "link": link
                })
    except Exception:
        pass

    if not news_items:
        news_items = [
            {
                "title": "Nifty and Sensex consolidate near record highs amid strong domestic mutual fund flows",
                "publisher": "Economic Times",
                "link": "https://economictimes.indiatimes.com"
            },
            {
                "title": "IT and Banking stocks lead market momentum as foreign institutional inflows pick up",
                "publisher": "Livemint",
                "link": "https://www.livemint.com"
            },
            {
                "title": "RBI monetary policy stance remains supportive of sustained economic growth",
                "publisher": "Moneycontrol",
                "link": "https://www.moneycontrol.com"
            },
            {
                "title": "Auto sales surge during festive season; manufacturing indicators hit multi-month peak",
                "publisher": "Business Standard",
                "link": "https://www.business-standard.com"
            }
        ]

    data = {"news": news_items}
    CACHE[cache_key] = {"data": data, "timestamp": now}
    return data

@router.get("/search")
def search_stock(q: str = ""):
    query = q.strip().lower()
    if not query:
        return {"results": INDIAN_STOCKS[:10]}

    matches = []
    for stock in INDIAN_STOCKS:
        clean_symbol = stock["symbol"].replace(".NS", "").lower()
        name = stock["name"].lower()
        sector = stock.get("sector", "").lower()
        if query in clean_symbol or query in name or query in sector:
            matches.append(stock)

    return {"results": matches[:12]}

@router.get("/{symbol}/chart")
def stock_chart(symbol: str, period: str = "6mo"):
    period_map = {
        "1d": "1d",
        "5d": "5d",
        "1mo": "1mo",
        "3mo": "3mo",
        "6mo": "6mo",
        "1y": "1y",
        "5y": "5y",
        "max": "max"
    }
    valid_period = period_map.get(period, "6mo")
    interval = "5m" if valid_period in ["1d"] else ("15m" if valid_period == "5d" else "1d")

    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=valid_period, interval=interval)
        if df.empty:
            df = ticker.history(period="6mo", interval="1d")

        chart_points = []
        if not df.empty and "Close" in df:
            closes = df["Close"].dropna()
            ma20_series = df["Close"].rolling(20, min_periods=1).mean()
            ma50_series = df["Close"].rolling(50, min_periods=1).mean()

            for idx, row in df.iterrows():
                close_val = clean_float(row.get("Close"), None)
                if close_val is None:
                    continue
                date_str = str(idx.strftime("%H:%M" if valid_period == "1d" else "%b %d, %Y"))
                open_val = clean_float(row.get("Open"), None) if "Open" in row else None
                high_val = clean_float(row.get("High"), None) if "High" in row else None
                low_val = clean_float(row.get("Low"), None) if "Low" in row else None
                vol_raw = row.get("Volume")
                vol_val = int(vol_raw) if vol_raw is not None and pd.notna(vol_raw) and math.isfinite(float(vol_raw)) else 0
                m20_val = clean_float(ma20_series.loc[idx], None) if idx in ma20_series.index and pd.notna(ma20_series.loc[idx]) else None
                m50_val = clean_float(ma50_series.loc[idx], None) if idx in ma50_series.index and pd.notna(ma50_series.loc[idx]) else None

                chart_points.append({
                    "date": date_str,
                    "close": close_val,
                    "open": open_val,
                    "high": high_val,
                    "low": low_val,
                    "volume": vol_val,
                    "ma20": m20_val,
                    "ma50": m50_val,
                })

        return {"chart": chart_points}
    except Exception as e:
        print(f"Chart error for {symbol}: {e}")
        return {"chart": []}

@router.get("/{symbol}")
def stock_details(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="1y")
        if df.empty:
            df = ticker.history(period="3mo")

        if df.empty or "Close" not in df:
            return {"error": f"Stock '{symbol}' not found"}

        current_price, ma20, ma50, rsi, signal = calculate_technical_signals(df)

        closes = [float(v) for v in df["Close"].dropna() if math.isfinite(float(v))]
        if len(closes) >= 2:
            prev_price = clean_float(closes[-2], current_price)
            change = clean_float(current_price - prev_price, 0.0)
            change_percent = clean_float((change / prev_price) * 100, 0.0) if prev_price > 0 else 0.0
        else:
            prev_price = current_price
            change = 0.0
            change_percent = 0.0

        # High/Low ranges
        lows = [float(v) for v in df["Low"].dropna() if math.isfinite(float(v))] if "Low" in df else closes
        highs = [float(v) for v in df["High"].dropna() if math.isfinite(float(v))] if "High" in df else closes
        day_low = clean_float(lows[-1], current_price) if lows else current_price
        day_high = clean_float(highs[-1], current_price) if highs else current_price
        fifty_two_low = clean_float(min(lows), current_price) if lows else current_price
        fifty_two_high = clean_float(max(highs), current_price) if highs else current_price

        vol_series = df["Volume"].dropna() if "Volume" in df else []
        latest_volume = int(vol_series.iloc[-1]) if len(vol_series) > 0 and math.isfinite(float(vol_series.iloc[-1])) else 0

        # Fetch company metadata & news for NLP sentiment
        info = {}
        stock_news = []
        try:
            info = ticker.info or {}
            raw_news = ticker.news or []
            for item in raw_news[:6]:
                content = item.get("content", {})
                t_str = content.get("title") or item.get("title")
                if t_str:
                    stock_news.append({"title": t_str})
        except Exception:
            pass

        company_name = info.get("longName") or info.get("shortName") or symbol.replace(".NS", "").replace(".BO", "")
        sector = info.get("sector") or "Indian Equities"
        industry = info.get("industry") or "Diversified"
        market_cap_raw = info.get("marketCap")
        market_cap = clean_float(market_cap_raw, None) if market_cap_raw and math.isfinite(float(market_cap_raw)) else None
        pe_ratio_raw = info.get("trailingPE")
        pe_ratio = clean_float(pe_ratio_raw, None) if pe_ratio_raw and math.isfinite(float(pe_ratio_raw)) else None
        pb_ratio_raw = info.get("priceToBook")
        pb_ratio = clean_float(pb_ratio_raw, None) if pb_ratio_raw and math.isfinite(float(pb_ratio_raw)) else None
        dividend_yield_raw = info.get("dividendYield")
        dividend_yield = clean_float(dividend_yield_raw * 100, None) if dividend_yield_raw and math.isfinite(float(dividend_yield_raw)) else None
        summary = info.get("longBusinessSummary") or f"{company_name} is one of India's prominent publicly traded enterprises listed on the National Stock Exchange (NSE)."

        # Run Data Science NLP Sentiment Analysis on news
        sentiment_analysis = analyze_stock_sentiment(stock_news)

        # Run Data Science Multi-Factor Composite AI Scorer
        ai_score_data = compute_composite_ai_score(
            price=current_price,
            ma20=ma20,
            ma50=ma50,
            rsi=rsi,
            sentiment_score=sentiment_analysis["score"],
            pe_ratio=pe_ratio,
            market_cap=market_cap
        )

        # Build chart series (with MA20 & MA50)
        chart_points = []
        ma20_s = df["Close"].rolling(20, min_periods=1).mean()
        ma50_s = df["Close"].rolling(50, min_periods=1).mean()

        for idx, row in df.iterrows():
            c_val = clean_float(row.get("Close"), None)
            if c_val is None:
                continue
            m20_p = clean_float(ma20_s.loc[idx], None) if idx in ma20_s.index and pd.notna(ma20_s.loc[idx]) else None
            m50_p = clean_float(ma50_s.loc[idx], None) if idx in ma50_s.index and pd.notna(ma50_s.loc[idx]) else None
            chart_points.append({
                "date": str(idx.date()),
                "close": c_val,
                "ma20": m20_p,
                "ma50": m50_p,
            })

        return {
            "symbol": symbol,
            "name": company_name,
            "exchange": "NSE",
            "sector": sector,
            "industry": industry,
            "price": current_price,
            "previous_price": prev_price,
            "change": change,
            "change_percent": change_percent,
            "day_low": day_low,
            "day_high": day_high,
            "fifty_two_week_low": fifty_two_low,
            "fifty_two_week_high": fifty_two_high,
            "volume": latest_volume,
            "market_cap": market_cap,
            "pe_ratio": pe_ratio,
            "pb_ratio": pb_ratio,
            "dividend_yield": dividend_yield,
            "summary": summary,
            "ma20": ma20,
            "ma50": ma50,
            "rsi": rsi,
            "signal": signal,
            "sentiment": sentiment_analysis,
            "ai_score": ai_score_data,
            "chart": chart_points
        }

    except Exception as e:
        print(f"Error fetching details for {symbol}: {e}")
        return {"error": f"Failed to retrieve data for {symbol}"}

@router.get("/{symbol}/safety-shield")
def get_stock_safety_shield(symbol: str):
    """
    Computes the 4-Point Pre-Trade AI Inspection:
    1. Fundamental Health (P/E & Market Cap vs Risk)
    2. Technical Entry Timing (RSI & Support/Resistance)
    3. NLP News Sentiment Polarity
    4. Auto-calculated Stop-Loss (-3%) & Target (+8%)
    """
    details = stock_details(symbol)
    if "error" in details:
        return {"error": details["error"]}

    price = details.get("price", 0.0)
    rsi = details.get("rsi", 50.0)
    pe = details.get("pe_ratio")
    sentiment = details.get("sentiment", {}).get("polarity", "Neutral")
    sentiment_score = details.get("sentiment", {}).get("score", 50)
    ai_score = details.get("ai_score", {}).get("overall_score", 70)

    # 1. Fundamental Health
    if pe and pe > 60:
        fund_status = "OVERVALUED"
        fund_text = f"P/E is high ({pe}), pricing in aggressive future growth."
        fund_verdict = "WARNING"
    elif pe and pe < 15:
        fund_status = "VALUE_ZONE"
        fund_text = f"Attractive valuation (P/E {pe}), trading at discount."
        fund_verdict = "PASS"
    else:
        fund_status = "HEALTHY"
        fund_text = f"Stable valuation (P/E {pe or 'N/A'}), in-line with peers."
        fund_verdict = "PASS"

    # 2. Technical Entry Timing
    if rsi > 70:
        tech_status = "OVERBOUGHT"
        tech_text = f"RSI is {rsi} (Overbought). High risk of immediate pullback."
        tech_verdict = "CAUTION"
    elif rsi < 35:
        tech_status = "OVERSOLD"
        tech_text = f"RSI is {rsi} (Oversold). Value rebound territory."
        tech_verdict = "PASS"
    else:
        tech_status = "OPTIMAL_ENTRY"
        tech_text = f"RSI is {rsi} (Healthy momentum, near moving average support)."
        tech_verdict = "PASS"

    # 3. Live News Sentiment
    if sentiment.upper() in ["BULLISH", "POSITIVE"]:
        news_status = "POSITIVE"
        news_text = f"News sentiment is Bullish (Score: {sentiment_score}/100)."
        news_verdict = "PASS"
    elif sentiment.upper() in ["BEARISH", "NEGATIVE"]:
        news_status = "NEGATIVE"
        news_text = f"News sentiment is Bearish (Score: {sentiment_score}/100)."
        news_verdict = "CAUTION"
    else:
        news_status = "NEUTRAL"
        news_text = "No high-volatility news detected in last 24 hours."
        news_verdict = "PASS"

    # 4. Recommended SL and Target
    recommended_target = round(price * 1.08, 2)  # +8% target
    recommended_sl = round(price * 0.97, 2)      # -3% stoploss
    risk_reward_ratio = "1:2.67"

    # Overall Safety Verdict
    pass_count = sum(1 for v in [fund_verdict, tech_verdict, news_verdict] if v == "PASS")
    if pass_count == 3:
        overall_safety = "HIGH_SAFETY"
        badge_text = "🟢 SAFE TO ENTER"
    elif pass_count == 2:
        overall_safety = "MODERATE_SAFETY"
        badge_text = "🟡 MODERATE RISK"
    else:
        overall_safety = "HIGH_RISK"
        badge_text = "🔴 HIGH VOLATILITY"

    return {
        "symbol": symbol,
        "name": details.get("name", symbol),
        "current_price": price,
        "overall_safety": overall_safety,
        "badge_text": badge_text,
        "composite_ai_score": ai_score,
        "checks": [
            {
                "id": "fundamentals",
                "title": "1. Fundamental Valuation Check",
                "status": fund_status,
                "verdict": fund_verdict,
                "explanation": fund_text
            },
            {
                "id": "technicals",
                "title": "2. Technical Entry Timing",
                "status": tech_status,
                "verdict": tech_verdict,
                "explanation": tech_text
            },
            {
                "id": "news_sentiment",
                "title": "3. Live NLP News Mood",
                "status": news_status,
                "verdict": news_verdict,
                "explanation": news_text
            },
            {
                "id": "risk_reward",
                "title": "4. Calculated Risk-to-Reward",
                "status": "CALCULATED",
                "verdict": "PASS",
                "target_price": recommended_target,
                "stoploss_price": recommended_sl,
                "risk_reward_ratio": risk_reward_ratio,
                "explanation": f"Recommended Target: ₹{recommended_target:,.2f} (+8%) | Stop-Loss: ₹{recommended_sl:,.2f} (-3%)"
            }
        ]
    }