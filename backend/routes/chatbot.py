import os
import re
from typing import Optional
from dotenv import load_dotenv
from fastapi import APIRouter
import google.generativeai as genai
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

def is_english_query(q: str) -> bool:
    """Detect if the query is in English or Hindi/Hinglish."""
    q_lower = q.lower()
    hindi_markers = [
        "kya", "kyu", "kyun", "kaise", "hai", "hain", "mera", "meri", "mere", "aaj",
        "nikal", "sakte", "bata", "batao", "btao", "btaoo", "iska", "mtlb", "matlab",
        "kitna", "kitni", "kaun", "kaunsa", "kaisa", "paise", "paisa",
        "rakhe", "karein", "kare", "karu", "kre", "ho", "raha", "rahi", "bech", "beche",
        "bechu", "becho", "bechna", "dono", "isme", "se", "bhut", "bahut", "jyada",
        "zyada", "isiliye", "puch", "tmko", "tumko", "lagta", "gira", "kam"
    ]
    for w in hindi_markers:
        if re.search(r'\b' + re.escape(w) + r'\b', q_lower):
            return False
    return True

def generate_natural_mentor_reply(query: str, stock_data: Optional[dict] = None, page_context: Optional[dict] = None) -> str:
    """Natural, friendly conversational mentor reply matching user language and answering directly."""
    q_lower = query.lower()
    is_eng = is_english_query(query)

    # ─────────────────────────────────────────────────────────────────────────────
    # 1. PORTFOLIO CONTEXT EVALUATION
    # ─────────────────────────────────────────────────────────────────────────────
    if page_context and isinstance(page_context, dict) and page_context.get("page") == "portfolio":
        p_val   = float(page_context.get("portfolio_value", 0) or 0)
        p_cash  = float(page_context.get("cash_available", 0) or 0)
        inv_val = float(page_context.get("invested_value", 0) or 0)
        h_val   = float(page_context.get("holdings_value", 0) or 0)
        p_today = float(page_context.get("today_pnl", 0) or 0)
        p_pnl   = float(page_context.get("total_pnl", 0) or 0)
        u_pnl   = float(page_context.get("unrealized_pnl", 0) or 0)
        r_pnl   = float(page_context.get("realized_pnl", 0) or 0)
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
                        if is_eng:
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

        # --- Withdrawal query ---
        if any(w in q_lower for w in ["nikal", "withdraw", "nikal sakte", "nikal sakte right", "paisa nikal"]):
            if is_eng:
                return f"No, ₹{p_val:,.2f} is not entirely withdrawable cash. ₹{p_val:,.2f} is your Total Portfolio Value (Holdings: ₹{h_val:,.2f} + Cash: ₹{p_cash:,.2f}). Your currently available virtual Cash Balance is ₹{p_cash:,.2f}. To convert holdings into cash, you need to sell your stocks. Also, note that StockSikh is a paper-trading learning platform with virtual money, not real bank currency."
            return f"Nahi, ₹{p_val:,.2f} poora withdrawable cash nahi hai. ₹{p_val:,.2f} aapke total portfolio ki current value hai (Holdings: ₹{h_val:,.2f} + Cash: ₹{p_cash:,.2f}). Abhi aapka available Cash Balance ₹{p_cash:,.2f} hai. Holdings ko cash banane ke liye shares sell karne honge. Saath hi yaad rakhein ki StockSikh ek virtual paper trading platform hai, isme real money withdrawal nahi hota."

        # --- Sell & Comparison Intents ---
        sell_terms = ["sell", "bech", "beche", "bechna", "bechu", "becho", "exit", "reduce", "nikalu", "nikalein", "hatao", "hataun", "close"]
        compare_terms = ["kaunsa", "kaun sa", "which one", "dono mein", "dono me", "dono", "which", "kis stock", "kis position", "weaker", "kise", "compare"]

        has_sell_intent = any(w in q_lower for w in sell_terms)
        has_compare_intent = any(w in q_lower for w in compare_terms)

        # A) Single stock sell inquiry (e.g. "RELIANCE sell karu?", "TCS bech de kya?")
        matching_holdings = []
        for h in holdings:
            sym_raw = h.get("symbol", "").upper().replace(".NS", "")
            comp_name = (h.get("company_name") or "").upper()
            if sym_raw in query.upper() or (len(sym_raw) > 2 and sym_raw.lower() in q_lower) or (comp_name and any(p in query.upper() for p in comp_name.split() if len(p) > 3)):
                matching_holdings.append(h)

        if has_sell_intent and len(matching_holdings) == 1 and not has_compare_intent:
            sh = matching_holdings[0]
            sh_name = sh.get("company_name") or sh.get("symbol", "").replace(".NS", "")
            sh_sym = sh.get("symbol", "").replace(".NS", "")
            sh_price = float(sh.get("current_price", 0) or 0)
            sh_buy = float(sh.get("avg_buy_price", 0) or 0)
            sh_pnl = float(sh.get("pnl", 0) or 0)
            sh_pnl_pct = float(sh.get("pnl_percent", 0) or 0)
            sh_day_pct = float(sh.get("day_pnl_percent", 0) or 0)

            if is_eng:
                return (
                    f"In your portfolio, **{sh_name} ({sh_sym})** is currently trading at ₹{sh_price:,.2f} "
                    f"(Avg Buy: ₹{sh_buy:,.2f}, Total P&L: ₹{sh_pnl:,.2f} / {sh_pnl_pct:+.2f}%, Today's Change: {sh_day_pct:+.2f}%).\n\n"
                    f"• **Analysis**: Your position is currently {'in profit' if sh_pnl >= 0 else 'in a loss'} of {abs(sh_pnl_pct):.2f}%.\n"
                    f"• **Decision Context**: If you are following a strict risk-reward strategy or stop-loss, consider whether this drawdown matches your pre-defined exit rules. (Note: This is data-driven analysis, not direct financial advice)."
                )
            else:
                return (
                    f"Aapke portfolio mein **{sh_name} ({sh_sym})** abhi ₹{sh_price:,.2f} par chal raha hai "
                    f"(Avg Buy: ₹{sh_buy:,.2f}, Total P&L: ₹{sh_pnl:,.2f} / {sh_pnl_pct:+.2f}%, Aaj ka Change: {sh_day_pct:+.2f}%).\n\n"
                    f"• **Position Status**: Yeh stock abhi {'profit mein' if sh_pnl >= 0 else f'{abs(sh_pnl_pct):.2f}% loss mein'} chal raha hai.\n"
                    f"• **Decision Context**: Agar aapka stop-loss hit hua hai ya capital ko kisi stronger opportunity mein move karna chahte hain, toh is position ko reduce/exit karna review kar sakte hain. (Yeh automated data summary hai, direct advisory nahi)."
                )

        # B) Comparison / Which one to sell / General sell intent with multiple holdings
        if (has_sell_intent or has_compare_intent) and holdings:
            candidate_holdings = matching_holdings if len(matching_holdings) >= 2 else holdings

            if len(candidate_holdings) >= 2:
                # Sort candidate holdings to find the weakest (lowest P&L % and lowest day P&L %)
                sorted_by_weakness = sorted(
                    candidate_holdings,
                    key=lambda x: (float(x.get("pnl_percent", 0) or 0), float(x.get("day_pnl_percent", 0) or 0))
                )
                weaker = sorted_by_weakness[0]
                stronger = sorted_by_weakness[-1]

                w_name = weaker.get("company_name") or weaker.get("symbol", "").replace(".NS", "")
                w_sym = weaker.get("symbol", "").replace(".NS", "")
                w_price = float(weaker.get("current_price", 0) or 0)
                w_buy = float(weaker.get("avg_buy_price", 0) or 0)
                w_pnl = float(weaker.get("pnl", 0) or 0)
                w_pnl_pct = float(weaker.get("pnl_percent", 0) or 0)
                w_day_pct = float(weaker.get("day_pnl_percent", 0) or 0)

                s_name = stronger.get("company_name") or stronger.get("symbol", "").replace(".NS", "")
                s_sym = stronger.get("symbol", "").replace(".NS", "")
                s_price = float(stronger.get("current_price", 0) or 0)
                s_buy = float(stronger.get("avg_buy_price", 0) or 0)
                s_pnl = float(stronger.get("pnl", 0) or 0)
                s_pnl_pct = float(stronger.get("pnl_percent", 0) or 0)
                s_day_pct = float(stronger.get("day_pnl_percent", 0) or 0)

                if is_eng:
                    first_line = f"Based on currently available portfolio data, **{w_name} ({w_sym})** is showing more relative weakness compared to **{s_name} ({s_sym})**."
                    comparison_block = (
                        f"**Comparative Data Summary:**\n"
                        f"• **{w_name} ({w_sym})**:\n"
                        f"  - Current Price: ₹{w_price:,.2f} (Avg Buy: ₹{w_buy:,.2f})\n"
                        f"  - Total P&L: ₹{w_pnl:,.2f} ({w_pnl_pct:+.2f}%)\n"
                        f"  - Today's Change: {w_day_pct:+.2f}%\n\n"
                        f"• **{s_name} ({s_sym})**:\n"
                        f"  - Current Price: ₹{s_price:,.2f} (Avg Buy: ₹{s_buy:,.2f})\n"
                        f"  - Total P&L: ₹{s_pnl:,.2f} ({s_pnl_pct:+.2f}%)\n"
                        f"  - Today's Change: {s_day_pct:+.2f}%"
                    )
                    reasoning = (
                        f"**Why {w_sym} looks weaker:**\n"
                        f"{w_name} has a deeper drawdown ({w_pnl_pct:+.2f}%) than {s_name} ({s_pnl_pct:+.2f}%).\n"
                        f"*(Note: Technical indicators such as RSI and AI Score are not in the portfolio overview, so this comparison is based on portfolio P&L and price drawdown).* "
                        f"If your risk management strategy prioritizes reducing the most underperforming position, **{w_name}** is the one to review first."
                    )
                    return f"{first_line}\n\n{comparison_block}\n\n{reasoning}"
                else:
                    first_line = f"Current available portfolio data ke basis par **{w_name} ({w_sym})** mein weakness **{s_name} ({s_sym})** ke comparison mein zyada dikh rahi hai."
                    comparison_block = (
                        f"**Dono Positions Ka Data Comparison:**\n"
                        f"• **{w_name} ({w_sym})**:\n"
                        f"  - Current Price: ₹{w_price:,.2f} (Avg Buy: ₹{w_buy:,.2f})\n"
                        f"  - Total P&L: ₹{w_pnl:,.2f} ({w_pnl_pct:+.2f}%)\n"
                        f"  - Aaj ka Change: {w_day_pct:+.2f}%\n\n"
                        f"• **{s_name} ({s_sym})**:\n"
                        f"  - Current Price: ₹{s_price:,.2f} (Avg Buy: ₹{s_buy:,.2f})\n"
                        f"  - Total P&L: ₹{s_pnl:,.2f} ({s_pnl_pct:+.2f}%)\n"
                        f"  - Aaj ka Change: {s_day_pct:+.2f}%"
                    )
                    reasoning = (
                        f"**Explanation:**\n"
                        f"{w_name} ka loss percentage ({w_pnl_pct:+.2f}%) {s_name} ({s_pnl_pct:+.2f}%) ke mukable zyada deep hai aur portfolio par bada drag hai.\n"
                        f"*(Note: Technical indicators jaise RSI/AI Score portfolio summary mein available nahi hain, isliye yeh comparison pure portfolio P&L drawdown par based hai).* "
                        f"Agar aapki trading strategy weaker/underperforming position ko reduce karne ki hai, toh **{w_name}** ko pehle review karein."
                    )
                    return f"{first_line}\n\n{comparison_block}\n\n{reasoning}"

            elif len(candidate_holdings) == 1:
                sh = candidate_holdings[0]
                sh_name = sh.get("company_name") or sh.get("symbol", "").replace(".NS", "")
                sh_pnl_pct = float(sh.get("pnl_percent", 0) or 0)
                sh_pnl = float(sh.get("pnl", 0) or 0)
                if is_eng:
                    return f"You have 1 active holding: **{sh_name}** (P&L: ₹{sh_pnl:,.2f} / {sh_pnl_pct:+.2f}%). If you want to reduce equity exposure or lock cash, this is your only active position to exit."
                return f"Aapke portfolio mein 1 hi active holding hai: **{sh_name}** (P&L: ₹{sh_pnl:,.2f} / {sh_pnl_pct:+.2f}%). Agar aap equity risk kam karna chahte hain toh yahi active position available hai."

        # --- Portfolio Loss / Negative Drag reasoning ---
        if any(w in q_lower for w in ["negative", "loss", "down", "gira", "kam", "kyu", "kyun"]):
            if holdings:
                worst_holding = min(holdings, key=lambda x: float(x.get("pnl_percent", 0) or 0))
                worst_sym = worst_holding.get("symbol", "").replace(".NS", "")
                worst_name = worst_holding.get("company_name") or worst_sym
                worst_loss = float(worst_holding.get("pnl", 0) or 0)
                worst_pct = float(worst_holding.get("pnl_percent", 0) or 0)

                if is_eng:
                    return (
                        f"Your portfolio is currently showing an overall loss of ₹{abs(p_pnl):,.2f} ({page_context.get('total_pnl_percent', 0)}%).\n\n"
                        f"• **Main Loss Driver**: The biggest drag on your portfolio is **{worst_name} ({worst_sym})**, which is down ₹{abs(worst_loss):,.2f} ({worst_pct:.2f}% from your buy price).\n"
                        f"• **Actionable Context**: In paper trading, evaluate whether these stocks are in temporary pullbacks or if their broader trend has broken down before taking action."
                    )
                else:
                    return (
                        f"Aapka portfolio abhi total ₹{abs(p_pnl):,.2f} ({page_context.get('total_pnl_percent', 0)}%) loss mein chal raha hai.\n\n"
                        f"• **Main Reason / Drag**: Aapke portfolio mein sabse bada negative drag **{worst_name} ({worst_sym})** hai, jo aapke buy price se ₹{abs(worst_loss):,.2f} ({worst_pct:.2f}%) neeche trade kar raha hai.\n"
                        f"• **Next Step**: Paper trading mein check karein ki kya yeh temporary market correction hai ya trend weak ho gaya hai, taaki aap disciplined decision le sakein."
                    )
            else:
                if is_eng:
                    return f"You currently have no active stock holdings. Your Cash Available is ₹{p_cash:,.2f}."
                return f"Aapke portfolio mein abhi koi active stock holdings nahi hain. Cash Balance ₹{p_cash:,.2f} ready hai."

        # --- Explicit holdings list requested ONLY when user asks "show holdings" / "mere stocks kaunse hai" ---
        if any(w in q_lower for w in ["show holdings", "list holdings", "kaun kaun se", "mere stocks", "my stocks"]) and not has_sell_intent:
            if not holdings:
                return "You have no active holdings." if is_eng else "Aapke paas abhi koi active stock holdings nahi hain."
            h_lines = [f"• {h.get('company_name') or h.get('symbol')}: {h.get('quantity')} shares @ ₹{float(h.get('current_price', 0) or 0):,.2f} (P&L: ₹{float(h.get('pnl', 0) or 0):,.2f})" for h in holdings]
            prefix = f"Your active holdings ({len(holdings)} stocks):" if is_eng else f"Aapki active holdings ({len(holdings)} stocks):"
            return prefix + "\n" + "\n".join(h_lines)

    # ─────────────────────────────────────────────────────────────────────────────
    # 2. GENERAL CONCEPT / STOCK DATA REPLIES
    # ─────────────────────────────────────────────────────────────────────────────
    if "rsi" in q_lower:
        if stock_data:
            rsi_val = stock_data.get("rsi", 50)
            sym = stock_data.get("name") or stock_data.get("symbol", "").replace(".NS", "")
            if is_eng:
                return f"The 14-day RSI for {sym} is currently {rsi_val}. RSI measures price momentum from 0 to 100: values above 70 indicate overbought conditions (potential pullback), while below 30 indicate oversold conditions (potential rebound). At {rsi_val}, momentum is {'overbought' if rsi_val > 70 else 'oversold' if rsi_val < 30 else 'in a neutral healthy range'}."
            return f"{sym} ka 14-day RSI abhi {rsi_val} hai. RSI stock ke momentum ko 0 se 100 ke beech naapta hai. 70 se upar overbought (cooling off expected) aur 30 se neeche oversold (bounce back possible) mana jaata hai. Abhi RSI {rsi_val} neutral range mein hai."
        else:
            if is_eng:
                return "RSI (Relative Strength Index) is a momentum indicator that measures the speed and change of price movements on a scale from 0 to 100. Above 70 means overbought (potential pullback), and below 30 means oversold (potential bounce)."
            return "RSI (Relative Strength Index) ek momentum indicator hai jo stock price ki speed aur change ko 0 se 100 ke scale par dikhata hai. 70 se upar overbought (bhaav gir sakta hai) aur 30 se neeche oversold (bhaav sambhal sakta hai) hota hai."

    if "moving average" in q_lower or "ma" in q_lower:
        if stock_data:
            ma20 = stock_data.get("ma20", 0)
            price = stock_data.get("price", 0)
            sym = stock_data.get("name") or stock_data.get("symbol", "").replace(".NS", "")
            above = price >= ma20
            if is_eng:
                return f"{sym} is currently trading at ₹{price:,.2f}, which is {'above' if above else 'below'} its 20-day Moving Average of ₹{ma20:,.2f}."
            return f"{sym} ka live price ₹{price:,.2f} hai, jo uske 20-Day MA (₹{ma20:,.2f}) se {'upar' if above else 'neeche'} trade kar raha hai."

    # Stock overview if specifically asked on Stock Detail page
    if stock_data:
        sym = stock_data.get("name") or stock_data.get("symbol", "").replace(".NS", "")
        price = stock_data.get("price") or 0.0
        signal = stock_data.get("signal") or "HOLD"
        rsi = stock_data.get("rsi") or 50.0
        if is_eng:
            return f"{sym} is trading at ₹{price:,.2f} with a technical signal of {signal} and an RSI of {rsi}."
        return f"{sym} abhi ₹{price:,.2f} par trade kar raha hai, technical signal {signal} hai aur RSI {rsi} hai."

    if is_eng:
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
  - If user writes in Hinglish (e.g. "tmko kya lagta stock bech de kya", "to dono mein se kaunsa beche", "kaunsa sell kre"), reply in natural, friendly Hinglish.
  - If user writes in Hindi (Devanagari), reply in Hindi.
  - If user writes in English, reply in clean English.
  - If user writes in Bengali/Tamil/other languages, reply in that language.
- NEVER switch to formal English when the user is speaking Hinglish or Hindi.

2. DIRECT ANSWER FIRST (NO UNNECESSARY DUMPING):
- ALWAYS directly answer the user's SPECIFIC question in the very first sentence.
- NEVER dump the raw portfolio list unprompted instead of answering.

3. SELL / EXIT & COMPARISON INTENTS (HIGHEST IMPORTANCE):
- If user asks which stock to sell / exit / reduce (e.g. "kaunsa sell kre?", "dono mein se kaunsa beche?", "which one should I sell?", "kis stock se exit karu?", "tmko kya lagta stock bech de kya"):
  a. The VERY FIRST sentence MUST directly state which stock is showing more relative weakness based on available data (e.g. deeper P&L % loss or daily drag).
     Example (Hinglish): "Current available data ke basis par TCS mein weakness RELIANCE ke comparison mein zyada dikh rahi hai."
     Example (English): "Based on the currently available portfolio data, TCS is showing more relative weakness compared to RELIANCE."
  b. Show a concise side-by-side comparison for the relevant holdings using available data (Current Price, Avg Buy Price, Total P&L, P&L %, Daily Change %).
  c. Explain WHY that stock looks weaker (e.g. deeper drawdown, larger loss percentage).
  d. Responsible Framing: Do NOT give rigid orders like "Sell TCS immediately". Use evidence-based phrasing: "If your risk strategy requires cutting the weaker position, TCS is the one to review first."
  e. If technical indicators (RSI/AI score) are not in the portfolio context, explicitly state: "Technical indicators portfolio overview mein available nahi hain, isliye yeh comparison pure portfolio P&L drawdown par based hai." DO NOT invent fake RSI numbers.
- If user asks about a SINGLE stock to sell (e.g. "RELIANCE sell karu?"):
  Focus strictly on that stock's available metrics and performance without discussing unrelated stocks.

4. NUMBER / VALUE IDENTIFICATION:
- If user mentions a number (e.g. "10,902", "10902", "7553.70"):
  Match it against CURRENT PAGE VALUES and state exactly what that label represents.

5. PORTFOLIO & WITHDRAWAL SAFETY:
- "Total Portfolio Value" = "Cash Available" + "Holdings Value".
- Total Portfolio Value is NOT entirely withdrawable cash. Only Cash Available is uninvested cash.
- StockSikh is a paper-trading educational simulator with virtual cash; it cannot be withdrawn to a bank account.

6. PEDAGOGY:
- Keep formatting concise, clear, and encouraging with bullet points.
- Always use Indian Rupees (₹ or Rs.).
{stock_context}

User Question: "{message}"
"""
            response = gemini_model.generate_content(prompt, request_options={"timeout": 15})
            if response and response.text:
                return {"reply": response.text.strip()}
        except Exception as e:
            print(f"Gemini API error, falling back to local mentor: {e}")

    # Fallback to local intelligent mentor
    reply = generate_natural_mentor_reply(message, detected_stock_data, page_context_data)
    return {"reply": reply}
