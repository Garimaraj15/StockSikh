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
    context: Optional[dict] = None

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None

if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        for model_name in ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-pro", "gemini-pro"]:
            try:
                gemini_model = genai.GenerativeModel(model_name)
                print(f"[CHATBOT] Successfully initialized Gemini with model: {model_name}")
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

def generate_natural_mentor_reply(query: str, stock_data: Optional[dict] = None, page_context: Optional[dict] = None) -> str:
    """Natural, friendly conversational mentor reply matching user language and answering directly."""
    q_lower = query.lower()

    # Detect language style
    is_english = not any(w in q_lower for w in ["kya", "kyu", "kyun", "kaise", "hai", "mera", "meri", "mere", "aaj", "nikal", "sakte", "bata", "batao", "iska", "mtlb", "matlab", "kitna", "kitni", "kaun", "kaisa", "paise", "paisa", "rakhe", "karein", "ho", "raha", "rahi"])

    # Portfolio page: number-identification + keyword answers
    if page_context and isinstance(page_context, dict) and page_context.get("page") == "portfolio":
        p_val  = float(page_context.get("portfolio_value", 0) or 0)
        p_cash = float(page_context.get("cash_available", 0) or 0)
        inv_val = float(page_context.get("invested_value", 0) or 0)
        h_val  = float(page_context.get("holdings_value", 0) or 0)
        p_today = float(page_context.get("today_pnl", 0) or 0)
        p_pnl  = float(page_context.get("total_pnl", 0) or 0)
        u_pnl  = float(page_context.get("unrealized_pnl", 0) or 0)
        r_pnl  = float(page_context.get("realized_pnl", 0) or 0)
        holdings = page_context.get("holdings", [])

        # --- Number identification: match user-mentioned numeric values to portfolio fields ---
        raw_numbers = re.findall(r"-?[\d,]+\.?\d*", query)
        for raw in raw_numbers:
            try:
                num = float(raw.replace(",", ""))
                field_map = [
                    (p_val,   "Total Portfolio Value",
                     "aapki total net worth hai (Cash + Holdings ki combined value)"),
                    (p_cash,  "Cash Available",
                     "aapka uninvested virtual cash balance hai jo trading ke liye ready hai"),
                    (inv_val, "Invested Capital",
                     "aapne abhi tak stocks mein invest kiya hua amount hai"),
                    (h_val,   "Holdings Value",
                     "aapki current stock holdings ki live market value hai"),
                    (p_pnl,   "Overall P&L",
                     "aapka total profit/loss hai since you started trading"),
                    (p_today, "Today's P&L",
                     "aaj ka portfolio profit/loss hai"),
                    (u_pnl,   "Unrealized P&L",
                     "abhi bhi held stocks par unrealized profit/loss hai"),
                    (r_pnl,   "Realized P&L",
                     "sold stocks se book hua profit/loss hai"),
                ]
                for field_val, field_name, field_desc in field_map:
                    if field_val != 0 and abs(num - field_val) < 1.0:
                        if is_english:
                            msg = f"₹{num:,.2f} is your **{field_name}** — it is {field_desc}."
                            if field_name == "Total Portfolio Value":
                                msg += f" Note: this is NOT entirely withdrawable. Cash Available is ₹{p_cash:,.2f} and Holdings are ₹{h_val:,.2f}. StockSikh uses virtual paper money."
                        else:
                            msg = f"₹{num:,.2f} aapka **{field_name}** hai — ye {field_desc}."
                            if field_name == "Total Portfolio Value":
                                msg += f" Ye poora withdrawable nahi hai — Cash Available ₹{p_cash:,.2f} aur Holdings ₹{h_val:,.2f} hain. StockSikh virtual paper trading platform hai."
                        return msg
            except ValueError:
                pass

        if any(w in q_lower for w in ["nikal", "withdraw", "available", "cash", "nikal sakte", "paisa hai"]):
            if is_english:
                return f"No, ₹{p_val:,.2f} is not entirely withdrawable cash. ₹{p_val:,.2f} is your Total Portfolio Value (Holdings: ₹{h_val:,.2f} + Cash: ₹{p_cash:,.2f}). Your currently available virtual Cash Balance is ₹{p_cash:,.2f}. To convert holdings into cash, you need to sell your stocks. Also, note that StockSikh is a paper-trading learning platform with virtual money, not real bank currency."
            return f"Nahi, ₹{p_val:,.2f} poora withdrawable cash nahi hai. ₹{p_val:,.2f} aapke total portfolio ki current value hai (Holdings: ₹{h_val:,.2f} + Cash: ₹{p_cash:,.2f}). Abhi aapka available Cash Balance ₹{p_cash:,.2f} hai. Holdings ko cash banane ke liye shares sell karne honge. Saath hi yaad rakhein ki StockSikh ek virtual paper trading platform hai, isme real money withdrawal nahi hota."

        if any(w in q_lower for w in ["down", "loss", "gira", "kam", "aaj"]):
            if holdings:
                worst_today = min(holdings, key=lambda x: x.get("day_pnl", 0) or 0)
                worst_sym = worst_today.get('company_name') or worst_today.get('symbol')
                worst_loss = worst_today.get('day_pnl', 0)
                if is_english:
                    return f"Your portfolio is down by ₹{abs(p_today):,.2f} today. The main drag on your performance today is {worst_sym} with a daily change of ₹{worst_loss:,.2f} ({worst_today.get('day_pnl_percent', 0)}%)."
                return f"Aapka portfolio aaj ₹{abs(p_today):,.2f} down hai. Iska main reason {worst_sym} ka stock hai, jo aaj ₹{worst_loss:,.2f} ({worst_today.get('day_pnl_percent', 0)}%) down chal raha hai."
            else:
                if is_english:
                    return f"You currently have no active stock holdings. Your Cash Available is ₹{p_cash:,.2f}."
                return f"Aapke portfolio mein abhi koi active stock holdings nahi hain. Cash Balance ₹{p_cash:,.2f} ready hai."

        if any(w in q_lower for w in ["holding", "holdings", "stock", "stocks", "kaun"]):
            if not holdings:
                return "You have no active holdings." if is_english else "Aapke paas abhi koi active stock holdings nahi hain."
            h_lines = [f"• {h.get('company_name') or h.get('symbol')}: {h.get('quantity')} shares @ ₹{h.get('current_price', 0):,.2f} (P&L: ₹{h.get('pnl', 0):,.2f})" for h in holdings]
            prefix = f"Your active holdings ({len(holdings)} stocks):" if is_english else f"Aapki active holdings ({len(holdings)} stocks):"
            return prefix + "\n" + "\n".join(h_lines)

    # General concept answers directly without data dumping
    if "rsi" in q_lower:
        if stock_data:
            rsi_val = stock_data.get("rsi", 50)
            sym = stock_data.get("name") or stock_data.get("symbol", "").replace(".NS", "")
            if is_english:
                return f"The 14-day RSI for {sym} is currently {rsi_val}. RSI measures price momentum from 0 to 100: values above 70 indicate overbought conditions (potential pullback), while below 30 indicate oversold conditions (potential rebound). At {rsi_val}, momentum is {'overbought' if rsi_val > 70 else 'oversold' if rsi_val < 30 else 'in a neutral healthy range'}."
            return f"{sym} ka 14-day RSI abhi {rsi_val} hai. RSI stock ke momentum ko 0 se 100 ke beech naapta hai. 70 se upar overbought (cooling off expected) aur 30 se neeche oversold (bounce back possible) mana jaata hai. Abhi RSI {rsi_val} neutral range mein hai."
        else:
            if is_english:
                return "RSI (Relative Strength Index) is a momentum indicator that measures the speed and change of price movements on a scale from 0 to 100. Above 70 means overbought (potential pullback), and below 30 means oversold (potential bounce)."
            return "RSI (Relative Strength Index) ek momentum indicator hai jo stock price ki speed aur change ko 0 se 100 ke scale par dikhata hai. 70 se upar overbought (bhaav gir sakta hai) aur 30 se neeche oversold (bhaav sambhal sakta hai) hota hai."

    if "moving average" in q_lower or "ma" in q_lower:
        if stock_data:
            ma20 = stock_data.get("ma20", 0)
            price = stock_data.get("price", 0)
            sym = stock_data.get("name") or stock_data.get("symbol", "").replace(".NS", "")
            above = price >= ma20
            if is_english:
                return f"{sym} is currently trading at ₹{price:,.2f}, which is {'above' if above else 'below'} its 20-day Moving Average of ₹{ma20:,.2f}."
            return f"{sym} ka live price ₹{price:,.2f} hai, jo uske 20-Day MA (₹{ma20:,.2f}) se {'upar' if above else 'neeche'} trade kar raha hai."

    # Stock overview if specifically asked
    if stock_data:
        sym = stock_data.get("name") or stock_data.get("symbol", "").replace(".NS", "")
        price = stock_data.get("price") or 0.0
        signal = stock_data.get("signal") or "HOLD"
        rsi = stock_data.get("rsi") or 50.0
        if is_english:
            return f"{sym} is trading at ₹{price:,.2f} with a technical signal of {signal} and an RSI of {rsi}."
        return f"{sym} abhi ₹{price:,.2f} par trade kar raha hai, technical signal {signal} hai aur RSI {rsi} hai."

    if is_english:
        return f"Regarding your question '{query}': StockSikh is an interactive stock market learning platform. Feel free to ask about stock indicators, technical analysis, or paper trading strategies!"
    return f"Aapke sawal '{query}' ke baare mein: StockSikh par aap live technical indicators, portfolio strategies aur market trends ke baare mein kuch bhi pooch sakte hain!"

@router.post("/")
def chat(req: ChatRequest):
    message = req.message.strip()
    if not message:
        return {"reply": "Please ask any question about Indian stock markets, technical indicators, or paper trading!"}

    detected_stock_data = None
    detected_symbol = None
    page_context_data = None
    is_page_context = False

    # Check for structured page context (portfolio, watchlist, dashboard, community, quests, asset_matrix)
    if req.context and isinstance(req.context, dict) and req.context.get("page"):
        page_context_data = req.context
    # Priority 1: Check if valid context.symbol is supplied (Stock Detail page)
    elif req.context and isinstance(req.context, dict) and req.context.get("symbol"):
        ctx = req.context
        detected_symbol = str(ctx.get("symbol")).strip()
        is_page_context = True

        ai_score_val = None
        if isinstance(ctx.get("ai_score"), dict):
            ai_score_val = ctx["ai_score"].get("composite_score") or ctx["ai_score"].get("overall_score")
        elif ctx.get("ai_score") is not None:
            ai_score_val = ctx.get("ai_score")

        detected_stock_data = {
            "symbol": detected_symbol,
            "name": ctx.get("name") or detected_symbol,
            "sector": ctx.get("sector"),
            "price": ctx.get("price"),
            "change": ctx.get("change"),
            "change_percent": ctx.get("change_percent"),
            "day_low": ctx.get("day_low"),
            "day_high": ctx.get("day_high"),
            "fifty_two_week_low": ctx.get("fifty_two_week_low"),
            "fifty_two_week_high": ctx.get("fifty_two_week_high"),
            "ma20": ctx.get("ma20"),
            "ma50": ctx.get("ma50"),
            "rsi": ctx.get("rsi"),
            "signal": ctx.get("signal"),
            "pe_ratio": ctx.get("pe_ratio"),
            "market_cap": ctx.get("market_cap"),
            "sentiment": ctx.get("sentiment"),
            "ai_score": ai_score_val
        }

    # Priority 3: Fall back to existing KNOWN_STOCKS keyword detection if no context supplied
    if not page_context_data and not detected_symbol:
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
            if page_context_data:
                page = page_context_data.get("page")
                ctx = page_context_data

                if page == "portfolio":
                    holdings_lines = []
                    for h in ctx.get("holdings", []):
                        h_sym = h.get("symbol", "Stock")
                        h_name = h.get("company_name") or h_sym
                        holdings_lines.append(
                            f"• {h_name} ({h_sym}): Qty={h.get('quantity', 0)}, Avg Buy Price=₹{h.get('avg_buy_price', 0)}, Current Price=₹{h.get('current_price', 0)}, Total Value=₹{h.get('current_value', 0)}, Total P&L=₹{h.get('pnl', 0)} ({h.get('pnl_percent', 0)}%), Today's P&L=₹{h.get('day_pnl', 0)} ({h.get('day_pnl_percent', 0)}%)"
                        )
                    holdings_str = "\n".join(holdings_lines) if holdings_lines else "No active holdings (0 stocks)."
                    stock_context = f"""
[BACKGROUND USER PORTFOLIO CONTEXT - USE SILENTLY TO ANSWER RELEVANT QUESTIONS]
User is on Virtual Portfolio page.
Total Portfolio Value (Net Worth): ₹{ctx.get('portfolio_value', 0)}
Cash Available for Trading: ₹{ctx.get('cash_available', 0)}
Invested Capital: ₹{ctx.get('invested_value', 0)}
Holdings Value: ₹{ctx.get('holdings_value', 0)}
Overall Total P&L: ₹{ctx.get('total_pnl', 0)} ({ctx.get('total_pnl_percent', 0)}%)
Today's Portfolio P&L: ₹{ctx.get('today_pnl', 0)} ({ctx.get('today_pnl_percent', 0)}%)
Unrealized P&L: ₹{ctx.get('unrealized_pnl', 0)}
Realized P&L: ₹{ctx.get('realized_pnl', 0)}

Active Holdings:
{holdings_str}

CURRENT PAGE VALUES (strip commas from user-mentioned numbers and compare here):
- Total Portfolio Value = {ctx.get('portfolio_value', 0)}
- Cash Available = {ctx.get('cash_available', 0)}
- Invested Capital = {ctx.get('invested_value', 0)}
- Holdings Value = {ctx.get('holdings_value', 0)}
- Overall P&L = {ctx.get('total_pnl', 0)}
- Today P&L = {ctx.get('today_pnl', 0)}
- Unrealized P&L = {ctx.get('unrealized_pnl', 0)}
- Realized P&L = {ctx.get('realized_pnl', 0)}
"""

                elif page == "watchlist":
                    wl_lines = [f"• {s.get('name') or s.get('symbol')}: Price=₹{s.get('price', 0)}, Change={s.get('change', 0)} ({s.get('change_percent', 0)}%)" for s in ctx.get("watchlist", [])]
                    wl_str = "\n".join(wl_lines) if wl_lines else "Watchlist is currently empty."
                    stock_context = f"""
[BACKGROUND USER WATCHLIST CONTEXT]
Tracked Stocks:
{wl_str}
"""

                elif page == "dashboard":
                    st_lines = [f"• {s.get('name') or s.get('symbol')}: ₹{s.get('price', 0)} ({s.get('change_percent', 0)}%), Signal={s.get('signal', 'N/A')}, AI Score={s.get('ai_score', 'N/A')}" for s in ctx.get("stocks", [])]
                    news_lines = [f"• {n.get('title')} ({n.get('publisher', 'News')})" for n in ctx.get("news", [])]
                    stock_context = f"""
[BACKGROUND MARKET DASHBOARD CONTEXT]
Popular Stocks:
{chr(10).join(st_lines) if st_lines else 'No preset stocks'}

Recent News:
{chr(10).join(news_lines) if news_lines else 'No news available'}
"""

                elif page == "community":
                    trader = ctx.get("selected_trader")
                    if trader:
                        th_lines = [f"• {h.get('symbol')}: Qty={h.get('quantity')}, Value=₹{h.get('current_value')}" for h in trader.get("holdings", [])]
                        stock_context = f"""
[BACKGROUND COMMUNITY INSPECTION CONTEXT]
Inspected Trader: {trader.get('name')} ({trader.get('tier', 'Trader')})
Weekly P&L: ₹{trader.get('weekly_pnl', 0)} | Win Rate: {trader.get('win_rate', 'N/A')}%
Public Holdings:
{chr(10).join(th_lines) if th_lines else 'No shared public holdings'}
"""
                    else:
                        lead_lines = [f"#{l.get('rank')} {l.get('name')} ({l.get('tier')}): Weekly P&L ₹{l.get('weekly_pnl', 0)}, Win Rate {l.get('win_rate')}%" for l in ctx.get("leaderboard_preview", [])]
                        stock_context = f"""
[BACKGROUND COMMUNITY LEADERBOARD CONTEXT]
Top Traders:
{chr(10).join(lead_lines) if lead_lines else 'Leaderboard loading'}
"""

                elif page == "quests":
                    q_lines = [f"• {q.get('title')}: +{q.get('xp_reward')} XP / +₹{q.get('paper_cash_reward')} (Completed: {q.get('completed')}, Claimed: {q.get('claimed')}, Can Claim: {q.get('can_claim')})" for q in ctx.get("quests", [])]
                    milestone = ctx.get("xp_milestone") or {}
                    stock_context = f"""
[BACKGROUND QUESTS & PROGRESSION CONTEXT]
Rank: {ctx.get('tier_name')} (Level {ctx.get('tier_level')}) | XP: {ctx.get('total_xp')}
Streak: {ctx.get('login_streak_days')} days
Next Reward Milestone: {milestone.get('current_xp', 0)}/1000 XP ({milestone.get('remaining_xp', 0)} XP remaining, Claimed: {milestone.get('claimed', False)})
Active Quests:
{chr(10).join(q_lines) if q_lines else 'No active quests'}
"""

                elif page == "asset_matrix":
                    alloc_lines = [f"• {a.get('name')}: {a.get('pct')}% (₹{a.get('amount')})" for a in ctx.get("allocations", [])]
                    stock_context = f"""
[BACKGROUND ASSET MATRIX SIMULATOR CONTEXT]
Savings: ₹{ctx.get('savings')} | Expenses: ₹{ctx.get('monthly_expenses')}
Emergency Fund: ₹{ctx.get('emergency_reserve')} | Net Investable: ₹{ctx.get('net_investable_capital')}
Risk Model: {ctx.get('risk_preference')} | Equity Allocation: ₹{ctx.get('equity_allocation')}
Allocations:
{chr(10).join(alloc_lines) if alloc_lines else 'Standard allocations'}
"""

            elif detected_stock_data:
                name_str = detected_stock_data.get("name", detected_stock_data["symbol"])
                stock_context = f"""
[BACKGROUND STOCK CONTEXT]
Stock: {name_str} ({detected_stock_data['symbol']})
Live Price: ₹{detected_stock_data.get('price')} | Change: {detected_stock_data.get('change')} ({detected_stock_data.get('change_percent')}%)
20-Day MA: ₹{detected_stock_data.get('ma20')} | 50-Day MA: ₹{detected_stock_data.get('ma50')}
14-Day RSI: {detected_stock_data.get('rsi')} | Signal: {detected_stock_data.get('signal')}
AI Score: {detected_stock_data.get('ai_score') or 'N/A'}

CURRENT PAGE VALUES (strip commas from user-mentioned numbers and compare here):
- Live Price = {detected_stock_data.get('price')}
- 20-Day MA = {detected_stock_data.get('ma20')}
- 50-Day MA = {detected_stock_data.get('ma50')}
- RSI = {detected_stock_data.get('rsi')}
- Day Low = {detected_stock_data.get('day_low')}
- Day High = {detected_stock_data.get('day_high')}
- 52-Week Low = {detected_stock_data.get('fifty_two_week_low')}
- 52-Week High = {detected_stock_data.get('fifty_two_week_high')}
- P/E Ratio = {detected_stock_data.get('pe_ratio')}
"""

            prompt = f"""You are Vidya AI, an intelligent, empathetic Indian stock market mentor on StockSikh.

CRITICAL INSTRUCTIONS:
1. LANGUAGE MATCHING:
- Reply in the EXACT same language and writing style used by the user.
  - If user writes in Hinglish (e.g. "iska mtlb mere pass avi..."), reply in natural, friendly Hinglish.
  - If user writes in Hindi (Devanagari), reply in Hindi.
  - If user writes in English, reply in clean English.
  - If user writes in Bengali/Tamil/other languages, reply in that language.
- NEVER translate the user's question or reply in English when the user wrote in Hindi/Hinglish/etc.

2. DIRECT ANSWER FIRST (NO UNNECESSARY DUMPING):
- ALWAYS directly answer the user's SPECIFIC question in the very first sentence.
- NEVER dump the entire portfolio status or page context unprompted. Use the background context silently to answer.
- Only quote specific numbers (e.g. cash balance, holdings value) that directly answer the question.

3. PORTFOLIO & WITHDRAWAL SAFETY:
- Understand clearly: "Total Portfolio Value" = "Cash Available" + "Holdings Value".
- Total Portfolio Value is NOT directly withdrawable cash. Only "Cash Available" (virtual trading balance) is uninvested cash. Holdings must be sold to become cash.
- StockSikh is a paper-trading educational simulator with virtual cash; it is NOT real bank money and cannot be withdrawn to a bank account.

4. PEDAGOGY:
- Keep formatting concise, clear, and encouraging. Avoid robotic boilerplate.
- Currency: Always use Indian Rupees (₹ or Rs.).

5. NUMBER / VALUE IDENTIFICATION (HIGHEST PRIORITY):
- If the user mentions any number or amount (e.g. "10,902", "10902", "7553.70", "-98"):
  a. Strip commas/spaces to get the plain numeric value.
  b. Compare it (within Rs.1 tolerance) against EVERY entry in the CURRENT PAGE VALUES section below.
  c. If a match is found, immediately state what that label represents and explain it simply.
     EXAMPLE: user asks "10,902 kya hai?" and CURRENT PAGE VALUES has "Total Portfolio Value = 10902"
     -> Reply: "₹10,902 aapka Total Portfolio Value hai — ye aapki total net worth hai (Cash + Holdings)."
  d. If no match is found in CURRENT PAGE VALUES, say: "Ye number current page ke data mein match nahi karta."
- NEVER give a generic financial definition when the number clearly exists in the context.
- NEVER invent a meaning for a number not present in the context.
{stock_context}

User Question: "{message}"
"""
            response = gemini_model.generate_content(prompt)
            if response and response.text:
                return {"reply": response.text.strip()}
        except Exception as e:
            print(f"Gemini API error, falling back to local mentor: {e}")

    # Fallback to local intelligent mentor
    reply = generate_natural_mentor_reply(message, detected_stock_data, page_context_data)
    return {"reply": reply}
