
from fastapi import APIRouter
from dotenv import load_dotenv
import google.generativeai as genai
import yfinance as yf
import pandas as pd
from pydantic import BaseModel
import os
import re

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel(
    "models/gemini-2.5-flash"
)

router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)
class ChatRequest(BaseModel):
    message: str

def calculate_rsi(data, period=14):
    delta = data.diff()

    gain = delta.where(
        delta > 0,
        0
    )

    loss = -delta.where(
        delta < 0,
        0
    )

    avg_gain = gain.rolling(period).mean()
    avg_loss = loss.rolling(period).mean()

    rs = avg_gain / avg_loss

    rsi = 100 - (
        100 / (1 + rs)
    )

    return round(
        float(rsi.iloc[-1]),
        2
    )


@router.post("/")
def chat(req: ChatRequest):

    message = req.message

    try:

        stock_context = ""

        # Find stock symbols from user text
        words = re.findall(
            r"[A-Za-z.]+",
            message.upper()
        )

        IGNORE_WORDS = {
    "WHAT",
    "WHY",
    "HOW",
    "IS",
    "ARE",
    "THE",
    "A",
    "AN",
    "RSI",
    "MA",
    "MA20",
    "MA50",
    "BUY",
    "SELL",
    "HOLD",
    "EXPLAIN"
}
        KNOWN_STOCKS = {
    "INFY": "INFY.NS",
    "TCS": "TCS.NS",
    "RELIANCE": "RELIANCE.NS",
    "SBIN": "SBIN.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "HDFCBANK": "HDFCBANK.NS"
}

        possible_symbol = None

        for word in words:
            if word in IGNORE_WORDS:
                continue
            if len(word) >= 3:

                if word in KNOWN_STOCKS:
                    symbol = KNOWN_STOCKS[word]
                else:
                    continue

                try:
                    ticker = yf.Ticker(symbol)

                    data = ticker.history(
                        period="3mo"
                    )

                    if len(data) > 30:
                        possible_symbol = symbol
                        print("DETECTED STOCK =", symbol)
                        break

                except:
                    pass

        if possible_symbol:

            ticker = yf.Ticker(
                possible_symbol
            )

            data = ticker.history(
                period="3mo"
            )

            price = round(
                float(
                    data["Close"].iloc[-1]
                ),
                2
            )

            ma20 = round(
                float(
                    data["Close"]
                    .rolling(20)
                    .mean()
                    .iloc[-1]
                ),
                2
            )

            ma50 = round(
                float(
                    data["Close"]
                    .rolling(50)
                    .mean()
                    .iloc[-1]
                ),
                2
            )

            rsi = calculate_rsi(
                data["Close"]
            )

            signal = "HOLD"

            if price > ma20 and rsi < 70:
                signal = "BUY"

            elif price < ma20 and rsi > 30:
                signal = "SELL"

            stock_context = f"""
            Stock Symbol: {possible_symbol}

            Current Price: ₹{price}

            RSI: {rsi}

            MA20: {ma20}

            MA50: {ma50}

            Signal: {signal}

            Interpretation:

            If RSI > 70:
            Overbought

            If RSI < 30:
            Oversold

            If RSI between 40 and 60:
            Neutral Momentum
            """

        prompt = f"""
You are Vidya AI.

You are a friendly Indian stock market mentor.

Your audience is beginners.

Format:

🎯 Quick Answer
(2-3 lines direct answer)

📊 Current Indicators
• RSI:
• MA20:
• MA50:
• Signal:

🧠 What This Means
(Explain in simple beginner-friendly language)

⚠️ Risk to Remember
(1 short point)

💡 Vidya's Tip
(1 practical beginner tip)

Keep response under 80 words.
Use bullet points.
Avoid long paragraphs.
Sound like a friendly mentor.

If stock data is not available,
DO NOT invent RSI, MA20, MA50 or price values.

Explain the concept only.

User Question:
{message}
"""

        response = model.generate_content(
            prompt
        )

        return {
            "reply": response.text
        }

    except Exception as e:

        return {
            "error": str(e)
        }
