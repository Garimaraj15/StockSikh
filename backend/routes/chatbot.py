import os
import re
from typing import Optional
from dotenv import load_dotenv
from fastapi import APIRouter
import google.generativeai as genai
import pandas as pd
from pydantic import BaseModel
import yfinance as yf

from routes.stocks import calculate_technical_signals

load_dotenv()

router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)

class ChatRequest(BaseModel):
    message: str

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None

if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        for model_name in ["gemini-1.5-flash", "gemini-2.0-flash", "models/gemini-1.5-flash", "gemini-pro"]:
            try:
                gemini_model = genai.GenerativeModel(model_name)
                break
            except Exception:
                continue
    except Exception as e:
        print(f"Gemini configuration error: {e}")
        gemini_model = None

KNOWN_STOCKS = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "INFOSYS": "INFY.NS",
    "HDFC": "HDFCBANK.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICI": "ICICIBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "SBI": "SBIN.NS",
    "SBIN": "SBIN.NS",
    "TATA": "TATAMOTORS.NS",
    "TATAMOTORS": "TATAMOTORS.NS",
    "ITC": "ITC.NS",
    "AIRTEL": "BHARTIARTL.NS",
    "BHARTI": "BHARTIARTL.NS",
    "LT": "LT.NS",
    "L&T": "LT.NS",
    "SUNPHARMA": "SUNPHARMA.NS",
    "BAJAJ": "BAJFINANCE.NS",
    "BAJFINANCE": "BAJFINANCE.NS",
    "MARUTI": "MARUTI.NS",
    "WIPRO": "WIPRO.NS",
    "ZOMATO": "ZOMATO.NS"
}

def generate_natural_mentor_reply(query: str, stock_data: Optional[dict] = None) -> str:
    """Natural, friendly conversational mentor reply in clean English."""
    q_lower = query.lower()

    if stock_data:
        sym = stock_data["symbol"].replace(".NS", "")
        price = stock_data["price"]
        rsi = stock_data["rsi"]
        ma20 = stock_data["ma20"]
        signal = stock_data["signal"]

        rsi_desc = "Overbought zone (exercise caution before buying)" if rsi > 70 else "Oversold zone (potential technical rebound)" if rsi < 30 else "Healthy neutral momentum"

        if signal == "BUY":
            trend_advice = f"The stock is trading comfortably above its 20-Day Moving Average (₹{ma20}), indicating strong short-term bullish momentum."
        elif signal == "SELL":
            trend_advice = f"Price is currently below its 20-Day MA (₹{ma20}), suggesting downward selling pressure. It may be wise to wait for support consolidation before entering."
        else:
            trend_advice = f"The stock is consolidating between support and resistance levels. A breakout above ₹{ma20} would confirm the next trend."

        return f"""Here is the live market snapshot for {sym}:

• Live Price: ₹{price:,.2f}
• Technical Signal: {signal}
• 14-Day RSI: {rsi} ({rsi_desc})
• 20-Day Moving Average: ₹{ma20:,.2f}

Key Takeaway:
{trend_advice}

You can practice paper trading a few shares of {sym} in your Virtual Portfolio with zero financial risk to test this strategy!"""

    # Concepts
    if "rsi" in q_lower:
        return """RSI (Relative Strength Index) measures the velocity and magnitude of recent price changes on a scale from 0 to 100.

Key Interpretations:
• Above 70 (Overbought): Indicates rapid buying momentum; price may face temporary pullback or profit-taking.
• Below 30 (Oversold): Indicates heavy selling pressure; price may be undervalued or due for a technical bounce.
• 40 to 60 (Neutral Range): Indicates steady consolidation or moderate trend continuation.

Pro Tip: Combine RSI with Moving Averages rather than trading RSI alone!"""

    if "grow" in q_lower or "profit" in q_lower or "paisa" in q_lower or "how" in q_lower:
        return """In equity markets, capital grows when the underlying company expands revenues, earnings, and investor demand pushes share prices higher.

For Example:
Suppose you invest ₹10,000 in a stock at ₹500/share (20 shares):
• If the price rises by +3.5% to ₹517.50, your investment value becomes ₹10,350 (+₹350 net profit).
• If the stock gains +10% to ₹550.00, your portfolio value reaches ₹11,000 (+₹1,000 profit).

In StockSikh's Virtual Portfolio, you can monitor this exact real-time valuation change across live market hours!"""

    if "moving average" in q_lower or "ma" in q_lower:
        return """Moving Averages (MA) smooth out short-term price fluctuations to reveal the underlying market trend.

• 20-Day MA: Reflects the short-term 1-month trend. Prices above MA20 signify bullish control.
• 50-Day MA: Tracks the medium-term quarterly trend.

Golden Cross: When the 20-Day MA crosses above the 50-Day MA, it signals a strong technical breakout."""

    if "signal" in q_lower or "buy" in q_lower or "sell" in q_lower:
        return """Our quantitative model evaluates three core technical pillars:
• BUY: Price trades above 20-Day MA with healthy non-overbought RSI (< 68).
• HOLD: Mixed momentum where waiting for directional clarity is optimal.
• SELL: Price falls below key moving average support.

Use these signals to analyze risk-reward ratios in your virtual trades!"""

    return f"""Hello! I am Vidya AI, your stock market companion on StockSikh. 😊

Regarding your question: "{query}"

Here are the 3 essential principles for stock market mastery:
1. Understand the Business: Focus on companies with solid earnings and competitive moats.
2. Follow Technical Trends: Use Moving Averages and RSI to optimize entry timing.
3. Manage Risk: Diversify across sectors rather than concentrating all capital in one stock.

Feel free to ask about any stock like "How is Reliance performing?" or technical concepts like RSI and Moving Averages!"""

@router.post("/")
def chat(req: ChatRequest):
    message = req.message.strip()
    if not message:
        return {"reply": "Please ask any question about Indian stock markets, technical indicators, or paper trading!"}

    detected_stock_data = None
    detected_symbol = None

    # Detect known stocks in user message
    words = re.findall(r"[A-Za-z0-9&]+", message.upper())
    for word in words:
        if word in KNOWN_STOCKS:
            detected_symbol = KNOWN_STOCKS[word]
            break

    if detected_symbol:
        try:
            ticker = yf.Ticker(detected_symbol)
            hist = ticker.history(period="3mo")
            if not hist.empty and len(hist) >= 5:
                curr_price, ma20, ma50, rsi, signal = calculate_technical_signals(hist)
                detected_stock_data = {
                    "symbol": detected_symbol,
                    "price": curr_price,
                    "ma20": ma20,
                    "ma50": ma50,
                    "rsi": rsi,
                    "signal": signal
                }
        except Exception as e:
            print(f"Error extracting stock data for chat: {e}")

    # If Gemini model is configured, call it with natural prompt
    if gemini_model:
        try:
            stock_context = ""
            if detected_stock_data:
                stock_context = f"""
[LIVE INDIAN MARKET DATA]
Stock: {detected_stock_data['symbol']}
Current Live Price: ₹{detected_stock_data['price']}
20-Day Moving Average: ₹{detected_stock_data['ma20']}
50-Day Moving Average: ₹{detected_stock_data['ma50']}
14-Day RSI: {detected_stock_data['rsi']}
Current Technical Signal: {detected_stock_data['signal']}
"""

            prompt = f"""You are Vidya AI, an intelligent, helpful Indian stock market mentor and quantitative analyst on StockSikh.
Communicate clearly and conversationally in professional, approachable English (or bilingual if the user specifically writes in Hindi).

Key instructions:
- Answer directly with clear financial reasoning without robotic preamble.
- Do NOT output raw markdown asterisks or rigid tabular boilerplate. Keep formatting clean with bullet points and structured takeaways.
- Provide clear rupee valuation calculations (e.g. "If you invest ₹10,000 and the stock moves +3%, your position grows by +₹300").
- Currency: Indian Rupees (₹).
{stock_context}

User Question: "{message}"
"""
            response = gemini_model.generate_content(prompt)
            if response and response.text:
                return {"reply": response.text.strip()}
        except Exception as e:
            print(f"Gemini API error, falling back to local mentor: {e}")

    # Fallback to local intelligent mentor
    reply = generate_natural_mentor_reply(message, detected_stock_data)
    return {"reply": reply}
