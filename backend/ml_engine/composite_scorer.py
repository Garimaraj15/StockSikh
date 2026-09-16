from typing import Dict, Any, Optional

def compute_composite_ai_score(
    price: float,
    ma20: float,
    ma50: float,
    rsi: float,
    sentiment_score: float,
    pe_ratio: Optional[float] = None,
    market_cap: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes a multi-factor AI Stock Health Score (0 - 100) combining:
    1. Technical Momentum & Trend (40% weight)
    2. Real-Time NLP News Sentiment (35% weight)
    3. Fundamental Valuation & Market Cap (25% weight)
    """
    # 1. Technical Score (0 - 100)
    tech_points = 50.0

    # RSI component (sweet spot: 45 to 65)
    if 45 <= rsi <= 65:
        tech_points += 20.0
    elif 30 <= rsi < 45:
        tech_points += 10.0  # Oversold recovery potential
    elif 65 < rsi <= 75:
        tech_points += 5.0   # Strong trend but getting heated
    elif rsi > 75:
        tech_points -= 15.0  # Overbought risk
    elif rsi < 30:
        tech_points -= 10.0  # High selling pressure

    # Moving average trend
    if ma20 > 0 and price > ma20:
        tech_points += 15.0
    else:
        tech_points -= 10.0

    if ma50 > 0 and price > ma50:
        tech_points += 15.0
    elif ma50 > 0 and price < ma50:
        tech_points -= 10.0

    tech_score = max(10.0, min(100.0, tech_points))

    # 2. Sentiment Score (0 - 100)
    # sentiment_score is between -1.0 and +1.0
    sentiment_pct = ((sentiment_score + 1.0) / 2.0) * 100.0
    sentiment_score_final = max(10.0, min(100.0, sentiment_pct))

    # 3. Fundamental Score (0 - 100)
    fund_points = 60.0
    if pe_ratio:
        if 12.0 <= pe_ratio <= 35.0:
            fund_points += 20.0
        elif pe_ratio < 12.0:
            fund_points += 15.0  # Value territory
        elif pe_ratio > 60.0:
            fund_points -= 15.0  # Rich valuation

    if market_cap:
        if market_cap > 5e11:  # > 50,000 Cr large cap
            fund_points += 20.0
        elif market_cap > 1e11:  # > 10,000 Cr mid cap
            fund_points += 10.0

    fund_score = max(20.0, min(100.0, fund_points))

    # Multi-Factor Weighted Sum
    total_ai_score = int(round(
        (0.40 * tech_score) +
        (0.35 * sentiment_score_final) +
        (0.25 * fund_score)
    ))
    total_ai_score = max(5, min(98, total_ai_score))

    if total_ai_score >= 80:
        recommendation = "Strong Momentum Candidate"
        badge_color = "#00D09C"
        verdict = "High AI Conviction (Bullish alignment across Technicals & News)"
    elif total_ai_score >= 65:
        recommendation = "Moderate Accumulate"
        badge_color = "#00D09C"
        verdict = "Positive Trend with Healthy Momentum"
    elif total_ai_score >= 45:
        recommendation = "Neutral Hold"
        badge_color = "#F59E0B"
        verdict = "Balanced Indicators; Await Clear Directional Breakout"
    else:
        recommendation = "Caution / Underperform"
        badge_color = "#EB5B3C"
        verdict = "Elevated Short-Term Risk Profile"

    return {
        "composite_score": total_ai_score,
        "recommendation": recommendation,
        "badge_color": badge_color,
        "verdict": verdict,
        "breakdown": {
            "technical_score": int(round(tech_score)),
            "sentiment_score": int(round(sentiment_score_final)),
            "fundamental_score": int(round(fund_score))
        }
    }
