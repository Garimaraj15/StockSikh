from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from routes.auth import get_current_user

router = APIRouter(prefix="/multi-asset", tags=["Multi-Asset"])

ASSET_DATA = [
    {
        "id": "stocks_index",
        "name": "Nifty 50 Index / Direct Equities",
        "category": "Equity",
        "nominal_return_percent": 13.5,
        "inflation_rate_percent": 6.5,
        "real_return_percent": 7.0,
        "tax_treatment": "LTCG @ 12.5% (above 1.25L) / STCG @ 20%",
        "lock_in_period": "None (High Liquidity)",
        "min_investment_inr": 100,
        "risk_level": "Moderate - High",
        "pros": ["High wealth compounding", "Beats inflation consistently", "Zero making charges"],
        "cons": ["Short-term market volatility", "Requires risk discipline"]
    },
    {
        "id": "bank_fd",
        "name": "Bank Fixed Deposit (FD)",
        "category": "Debt",
        "nominal_return_percent": 6.8,
        "inflation_rate_percent": 6.5,
        "real_return_percent": -0.7,
        "tax_treatment": "Taxed as per Income Tax Slab (up to 30%)",
        "lock_in_period": "1 to 5 Years (Penalty on early withdrawal)",
        "min_investment_inr": 1000,
        "risk_level": "Very Low",
        "pros": ["Guaranteed principal up to 5 Lakhs (DICGC)", "Fixed predictable interest"],
        "cons": ["Negative real return after inflation and taxes", "Purchasing power loss"]
    },
    {
        "id": "gold_sgb",
        "name": "Sovereign Gold Bonds (SGB) / Gold ETF",
        "category": "Commodity",
        "nominal_return_percent": 11.2,
        "inflation_rate_percent": 6.5,
        "real_return_percent": 4.7,
        "tax_treatment": "100% Tax-Free at Maturity (8 Years) + 2.5% Annual Interest",
        "lock_in_period": "5 - 8 Years for SGB / Zero for Gold ETF",
        "min_investment_inr": 6500,
        "risk_level": "Low - Moderate",
        "pros": ["Zero making charges", "Sovereign guarantee", "2.5% extra government interest"],
        "cons": ["Physical delivery not possible for SGB", "Lock-in period"]
    },
    {
        "id": "commercial_reit",
        "name": "Real Estate Investment Trusts (REITs)",
        "category": "Real Estate",
        "nominal_return_percent": 10.5,
        "inflation_rate_percent": 6.5,
        "real_return_percent": 4.0,
        "tax_treatment": "Dividend mostly tax-free, Capital gains 12.5% LTCG",
        "lock_in_period": "None (Traded on NSE/BSE)",
        "min_investment_inr": 350,
        "risk_level": "Moderate",
        "pros": ["Own commercial IT parks/malls with just ₹350", "Regular quarterly rental payouts"],
        "cons": ["Interest rate sensitivity", "Commercial vacancy cycles"]
    },
    {
        "id": "crypto",
        "name": "Cryptocurrencies (BTC / ETH)",
        "category": "Digital Asset",
        "nominal_return_percent": 25.0,
        "inflation_rate_percent": 6.5,
        "real_return_percent": 18.5,
        "tax_treatment": "Flat 30% Tax on Gains + 1% TDS (No loss set-off)",
        "lock_in_period": "None",
        "min_investment_inr": 500,
        "risk_level": "Extreme",
        "pros": ["High asymmetrical upside", "Global 24/7 liquidity"],
        "cons": ["High regulatory risk in India", "30% flat tax penalty", "Can drop 70% in bear market"]
    }
]

@router.get("/compare")
def compare_assets(
    investment_amount: float = Query(50000, description="Amount to compare"),
    years: int = Query(1, description="Investment time horizon in years")
):
    results = []
    for a in ASSET_DATA:
        nom_rate = a["nominal_return_percent"] / 100.0
        inf_rate = a["inflation_rate_percent"] / 100.0
        
        # Compounding formula
        nominal_value = investment_amount * ((1 + nom_rate) ** years)
        # Real purchasing power adjusted for inflation
        real_value = investment_amount * (((1 + nom_rate) / (1 + inf_rate)) ** years)
        net_real_growth_inr = real_value - investment_amount
        effective_real_return_pct = round(((real_value / investment_amount) - 1) * 100, 2) if investment_amount > 0 else 0
        
        # 1-to-10 year projection curve
        projections = []
        for y in [1, 3, 5, 10]:
            n_val = investment_amount * ((1 + nom_rate) ** y)
            r_val = investment_amount * (((1 + nom_rate) / (1 + inf_rate)) ** y)
            projections.append({
                "year": y,
                "nominal_value": round(n_val, 2),
                "real_value": round(r_val, 2)
            })

        results.append({
            **a,
            "years": years,
            "nominal_value": round(nominal_value, 2),
            "real_value": round(real_value, 2),
            "nominal_value_1yr": round(investment_amount * (1 + nom_rate), 2),
            "real_value_1yr": round(investment_amount * ((1 + nom_rate) / (1 + inf_rate)), 2),
            "net_real_growth_inr": round(net_real_growth_inr, 2),
            "effective_real_return_percent": effective_real_return_pct,
            "projections": projections
        })
    return {"investment_amount": investment_amount, "years": years, "comparison": results}

@router.get("/anti-scam-check/{symbol}")
def anti_scam_checker(symbol: str):
    sym = symbol.upper().replace(".NS", "")
    if sym in ["RELIANCE", "TCS", "INFY", "TATAMOTORS", "HDFCBANK", "ICICIBANK", "SBIN"]:
        return {
            "symbol": sym,
            "verdict": "SAFE_INSTITUTIONAL",
            "risk_score": 15,
            "promoter_holding": "Healthy (> 50% or widely institutional)",
            "debt_health": "Managed / Low",
            "social_media_hype": "Organic Institutional Coverage",
            "warning": None,
            "guidance": "High liquidity large-cap stock. Suitable for long-term & disciplined swing trading."
        }
    else:
        return {
            "symbol": sym,
            "verdict": "MODERATE_CAUTION",
            "risk_score": 55,
            "promoter_holding": "Verify quarterly filing",
            "debt_health": "Moderate",
            "social_media_hype": "Check if trending on Telegram/WhatsApp tip groups",
            "warning": "Always verify company profitability and avoid market orders during low-volume sessions.",
            "guidance": "Never invest more than 2-3% of total portfolio capital into high-volatility mid/small-caps."
        }
