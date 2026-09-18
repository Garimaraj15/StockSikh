import React, { useState } from "react";
import {
  Layers,
  ShieldAlert,
  Search,
  Wallet,
  ShieldCheck,
  PieChart,
  Sparkles,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Info,
  Award,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid
} from "recharts";
import Navbar from "../components/Navbar";
import FlyingVidyaBot from "../components/FlyingVidyaBot";

// 3 Dynamic Risk Allocation Profiles
const RISK_PROFILES = {
  CONSERVATIVE: {
    label: "Conservative",
    tagline: "Capital Safety First",
    desc: "25% Equity, 50% Bank FD, 15% Gold, 10% REITs",
    allocations: [
      { id: "equity", name: "Equity / Stocks", pct: 25, color: "#00D09C" },
      { id: "fd", name: "Bank Fixed Deposit", pct: 50, color: "#387ED1" },
      { id: "gold", name: "Gold / SGB", pct: 15, color: "#F59E0B" },
      { id: "reit", name: "Commercial REITs", pct: 10, color: "#8B5CF6" },
      { id: "crypto", name: "Crypto (High Risk)", pct: 0, color: "#EC4899" }
    ]
  },
  MODERATE: {
    label: "Moderate",
    tagline: "Balanced Growth",
    desc: "50% Equity, 25% Bank FD, 15% Gold, 10% REITs",
    allocations: [
      { id: "equity", name: "Equity / Stocks", pct: 50, color: "#00D09C" },
      { id: "fd", name: "Bank Fixed Deposit", pct: 25, color: "#387ED1" },
      { id: "gold", name: "Gold / SGB", pct: 15, color: "#F59E0B" },
      { id: "reit", name: "Commercial REITs", pct: 10, color: "#8B5CF6" },
      { id: "crypto", name: "Crypto (High Risk)", pct: 0, color: "#EC4899" }
    ]
  },
  GROWTH: {
    label: "Growth",
    tagline: "High Compounding",
    desc: "70% Equity, 10% Bank FD, 10% Gold, 5% REITs, 5% Crypto",
    allocations: [
      { id: "equity", name: "Equity / Stocks", pct: 70, color: "#00D09C" },
      { id: "fd", name: "Bank Fixed Deposit", pct: 10, color: "#387ED1" },
      { id: "gold", name: "Gold / SGB", pct: 10, color: "#F59E0B" },
      { id: "reit", name: "Commercial REITs", pct: 5, color: "#8B5CF6" },
      { id: "crypto", name: "Crypto (High Risk)", pct: 5, color: "#EC4899" }
    ]
  }
};

// 5 Core Assets Data & Historical CAGRs (Assumes 6.5% CPI benchmark inflation in India)
const ASSET_CLASSES = [
  {
    id: "equity",
    name: "Nifty 50 / Equity",
    category: "Equity",
    cagr: 13.5,
    color: "#00D09C",
    taxation: "12.5% LTCG (>₹1.25L) / 20% STCG",
    lockIn: "None (Instant T+1 Liquidity)",
    risk: "Moderate-High",
    badge: "Inflation Beater"
  },
  {
    id: "gold",
    name: "Gold / Sovereign Gold Bonds",
    category: "Commodity",
    cagr: 11.2,
    color: "#F59E0B",
    taxation: "Tax-Free on SGB Maturity + 2.5% p.a. Interest",
    lockIn: "5-8 Years for SGB",
    risk: "Low-Moderate",
    badge: "Crisis Hedge"
  },
  {
    id: "reit",
    name: "Commercial REITs",
    category: "Real Estate",
    cagr: 10.5,
    color: "#8B5CF6",
    taxation: "Rental dividends tax-exempt / 12.5% LTCG",
    lockIn: "None (Traded on NSE/BSE)",
    risk: "Moderate",
    badge: "Quarterly Yield"
  },
  {
    id: "fd",
    name: "Bank Fixed Deposit (FD)",
    category: "Fixed Income",
    cagr: 6.8,
    color: "#387ED1",
    taxation: "Taxed as per Income Tax Slab (up to 30%)",
    lockIn: "Fixed 1-5 Years",
    risk: "Very Low",
    badge: "DICGC Insured (₹5L)"
  },
  {
    id: "crypto",
    name: "Cryptocurrency (BTC/ETH)",
    category: "Digital Asset",
    cagr: 25.0,
    color: "#EC4899",
    taxation: "Flat 30% Tax on Gains + 1% TDS (No loss set-off)",
    lockIn: "None (24/7 Global)",
    risk: "Extreme",
    badge: "High Volatility"
  }
];

export default function MultiAssetMatrix() {
  // -------------------------------------------------------------
  // PILLAR 1 STATE: CAPITAL READINESS SIMULATOR
  // -------------------------------------------------------------
  const [savingsInput, setSavingsInput] = useState(500000);
  const [monthlyExpensesInput, setMonthlyExpensesInput] = useState(30000);
  const [riskPreference, setRiskPreference] = useState("MODERATE");

  // -------------------------------------------------------------
  // PILLAR 2 STATE: COMPOUNDING GRAPH & TIME HORIZONS
  // -------------------------------------------------------------
  const [simCapital, setSimCapital] = useState(100000);
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [returnMode, setReturnMode] = useState("nominal"); // "nominal" | "real"

  // -------------------------------------------------------------
  // PILLAR 3 STATE: ANTI-SCAM TIP SCANNER
  // -------------------------------------------------------------
  const [scamQuery, setScamQuery] = useState("");
  const [scamResult, setScamResult] = useState(null);
  const [scamChecking, setScamChecking] = useState(false);

  // Gamification XP Toast
  const [xpToast, setXpToast] = useState(null);

  const showXpToast = (amount, task) => {
    setXpToast({ amount, task });
    window.dispatchEvent(new Event("stocksikh:wallet-updated"));
    window.dispatchEvent(new Event("stocksikh:xp-updated"));
    setTimeout(() => setXpToast(null), 4000);
  };

  // Currency Formatter Helper
  const formatINR = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  };

  // Reset all values to initial defaults
  const handleResetDefaults = () => {
    setSavingsInput(500000);
    setMonthlyExpensesInput(30000);
    setRiskPreference("MODERATE");
    setSimCapital(100000);
    setTimeHorizon(5);
    setReturnMode("nominal");
    setScamQuery("");
    setScamResult(null);
  };

  // -------------------------------------------------------------
  // PILLAR 1 CALCULATIONS
  // -------------------------------------------------------------
  const validSavings = Math.max(0, Number(savingsInput) || 0);
  const validExpenses = Math.max(0, Number(monthlyExpensesInput) || 0);

  // 6 months emergency buffer
  const rawEmergencyBuffer = validExpenses * 6;
  const emergencyBuffer = Math.min(validSavings, rawEmergencyBuffer);
  const netInvestable = Math.max(0, validSavings - emergencyBuffer);

  // Validation Warnings
  const isBufferDeficit = rawEmergencyBuffer > validSavings && validSavings > 0;
  const isHighBurnRate = validExpenses > validSavings / 12 && validSavings > 0;

  const currentProfile = RISK_PROFILES[riskPreference] || RISK_PROFILES.MODERATE;

  // Breakdown across asset categories
  const rawAllocations = currentProfile.allocations.map((item) => {
    const amount = Math.round((netInvestable * item.pct) / 100);
    return { ...item, amount };
  });

  const otherAllocated = rawAllocations
    .filter((a) => a.id !== "equity")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const potentialEquityAllocation = Math.max(0, netInvestable - otherAllocated);

  const finalAllocations = rawAllocations.map((item) =>
    item.id === "equity" ? { ...item, amount: potentialEquityAllocation } : item
  );

  const assetMatrixContext = {
    page: "asset_matrix",
    savings: validSavings,
    monthly_expenses: validExpenses,
    risk_preference: riskPreference,
    emergency_reserve: emergencyBuffer,
    net_investable_capital: netInvestable,
    equity_allocation: potentialEquityAllocation,
    allocations: finalAllocations.map((a) => ({
      name: a.name,
      pct: a.pct,
      amount: a.amount
    }))
  };

  // -------------------------------------------------------------
  // PILLAR 2 CALCULATIONS (COMPOUNDING CURVES & HORIZONS)
  // -------------------------------------------------------------
  const validSimCapital = Math.max(1000, Number(simCapital) || 100000);
  const inflationRate = 0.065; // 6.5% standard inflation

  // Multi-point graph data for time progression
  const yearSteps = Array.from({ length: timeHorizon }, (_, i) => i + 1);
  const chartData = [0, ...yearSteps].map((yr) => {
    const point = { year: yr === 0 ? "Start" : `${yr}Y` };

    ASSET_CLASSES.forEach((asset) => {
      const r = asset.cagr / 100.0;
      if (yr === 0) {
        point[asset.id] = validSimCapital;
      } else {
        const nominal = validSimCapital * Math.pow(1 + r, yr);
        const real = validSimCapital * Math.pow((1 + r) / (1 + inflationRate), yr);
        point[asset.id] = Math.round(returnMode === "nominal" ? nominal : real);
      }
    });

    // Inflation baseline (Purchasing Power erosion)
    if (yr === 0) {
      point["inflation_baseline"] = validSimCapital;
    } else {
      const purchasingPower = validSimCapital * Math.pow(1 + inflationRate, yr);
      point["inflation_baseline"] = Math.round(purchasingPower);
    }

    return point;
  });

  // Table summary for selected time horizon
  const assetSummaryTable = ASSET_CLASSES.map((asset) => {
    const r = asset.cagr / 100.0;
    const nominalFinal = validSimCapital * Math.pow(1 + r, timeHorizon);
    const realFinal = validSimCapital * Math.pow((1 + r) / (1 + inflationRate), timeHorizon);
    const nominalGain = nominalFinal - validSimCapital;
    const realGain = realFinal - validSimCapital;
    const totalReturnPct = ((nominalFinal / validSimCapital - 1) * 100).toFixed(1);

    return {
      ...asset,
      nominalFinal: Math.round(nominalFinal),
      realFinal: Math.round(realFinal),
      nominalGain: Math.round(nominalGain),
      realGain: Math.round(realGain),
      totalReturnPct
    };
  });

  // -------------------------------------------------------------
  // PILLAR 3: RULE-BASED ANTI-SCAM SCANNER
  // -------------------------------------------------------------
  const runAntiScamCheck = (inputOverride) => {
    const queryToCheck = (inputOverride || scamQuery).trim().toUpperCase();
    if (!queryToCheck) return;

    if (inputOverride) {
      setScamQuery(inputOverride);
    }
    setScamChecking(true);

    setTimeout(() => {
      const isBluechip = [
        "RELIANCE", "TCS", "INFY", "TATAMOTORS", "HDFCBANK", "ICICIBANK", "SBIN",
        "ITC", "BHARTIARTL", "LT", "TITAN", "MARUTI", "ASIANPAINT", "SUNPHARMA"
      ].some((sym) => queryToCheck.includes(sym));

      const scamTriggers = [
        "GUARANTEE", "100%", "DOUBLE", "JACKPOT", "MULTIBAGGER", "SECRET", "TELEGRAM",
        "WHATSAPP", "SURE SHOT", "FIXED PROFIT", "CALL", "PUT", "TIP", "PUMP", "UPPER CIRCUIT"
      ];
      const hasScamTrigger = scamTriggers.some((t) => queryToCheck.includes(t));

      if (isBluechip && !hasScamTrigger) {
        setScamResult({
          query: queryToCheck,
          verdict: "SAFE",
          title: "🟢 Bluechip / High Institutional Quality",
          badgeClass: "bg-[#00D09C]/10 text-[#00D09C] border-[#A7F3D0]",
          riskScore: "Low Risk (12/100)",
          promoterQuality: "High (>70% Institutional & Promoter Backing)",
          liquidity: "Deep NSE/BSE Liquidity",
          regulatoryAlert: null,
          actionAdvice: "Safe for systematic long-term investing (SIP) and disciplined swing trading."
        });
      } else if (hasScamTrigger || queryToCheck.includes("PENNY")) {
        setScamResult({
          query: queryToCheck,
          verdict: "DANGER",
          title: "🔴 High Risk / Finfluencer Red Flag",
          badgeClass: "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]",
          riskScore: "Extreme Risk (95/100)",
          promoterQuality: "Pledged / Unknown Entities / Shell Activity",
          liquidity: "Illiquid (Circuit-to-Circuit Operator Trap)",
          regulatoryAlert: "SEBI Unregistered Tip Alert: Guaranteed return claims are illegal in Indian securities markets.",
          actionAdvice: "DO NOT BUY. Retail traders get trapped when operators dump shares at circuit limits."
        });
      } else {
        setScamResult({
          query: queryToCheck,
          verdict: "CAUTION",
          title: "🟡 Caution / Moderate Volatility",
          badgeClass: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
          riskScore: "Moderate Risk (52/100)",
          promoterQuality: "Verify quarterly BSE/NSE shareholding filings",
          liquidity: "Moderate — Check average daily traded volume",
          regulatoryAlert: "Keep allocation under 2-3% of total portfolio capital.",
          actionAdvice: "Review company balance sheet, debt-to-equity ratio, and avoid blind social media tips."
        });
      }

      setScamChecking(false);
      showXpToast(25, "Anti-Scam Tip Verified");
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white font-sans pb-16">
      <Navbar />

      {/* Floating XP Reward Notification */}
      {xpToast && (
        <div className="fixed top-20 right-5 z-50 bg-[#0F172A] text-white border border-[#00D09C] shadow-2xl rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-10 h-10 rounded-xl bg-[#00D09C]/20 flex items-center justify-center text-[#00D09C]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#00D09C] uppercase tracking-wider">
              Quest Progress! +{xpToast.amount} XP
            </div>
            <div className="text-sm font-extrabold text-white">
              {xpToast.task}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Educational Disclaimer Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span className="font-semibold">
              <strong>Educational Simulator:</strong> All calculations, allocations, and inflation models are for financial literacy. Not personalized investment advice.
            </span>
          </div>
          <button
            onClick={handleResetDefaults}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A]/70 border border-[#FDE68A] text-[11px] font-bold text-[#92400E] hover:bg-[#FEF3C7] transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#00D09C]/10 text-[#00D09C] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Asset Matrix Reality Engine
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Real Wealth &amp; Multi-Asset Comparator
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Build capital readiness, simulate compounding power across 5 core asset classes, and scan tips against scams.
            </p>
          </div>

          <button
            onClick={handleResetDefaults}
            className="sm:hidden px-4 py-2 rounded-2xl bg-[#0F172A]/70 border border-white/[0.08] hover:bg-[#07090E] text-xs font-extrabold text-slate-400 flex items-center gap-1.5 shadow-xs transition-all w-fit"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PILLAR 1: CAPITAL READINESS & SMART INVESTMENT CAPACITY SIMULATOR           */}
        {/* ========================================================================= */}
        <section className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 text-[#00D09C] flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#00D09C] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Pillar 1: Capital Readiness
                </div>
                <h2 className="text-xl font-black text-white">Smart Investment Capacity Simulator</h2>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#07090E] border border-white/[0.08] text-[11px] text-slate-400 font-semibold">
              <Info className="w-3.5 h-3.5 text-[#387ED1]" />
              <span>Real-Time Buffer &amp; Risk Logic</span>
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Savings Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white block">
                  Total Accumulated Savings (₹)
                </label>
                <span className="text-[10px] font-extrabold text-[#00D09C]">
                  ₹{formatINR(validSavings)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  step="10000"
                  value={savingsInput}
                  onChange={(e) => setSavingsInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-[#07090E] border border-white/[0.08] focus:border-[#00D09C] focus:bg-[#0F172A]/70 rounded-2xl text-sm font-black text-white outline-none transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[100000, 250000, 500000, 1000000, 2500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSavingsInput(val)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#1E293B]/60 hover:bg-[#E2E8F0] text-slate-400 cursor-pointer"
                  >
                    ₹{(val / 100000).toFixed(val >= 1000000 ? 0 : 1)}L
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Expenses Input with Real-Time Validation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white block">
                  Monthly Essential Expenses (₹)
                </label>
                <span className="text-[10px] font-extrabold text-[#387ED1]">
                  ₹{formatINR(validExpenses)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  max={validSavings}
                  step="5000"
                  value={monthlyExpensesInput}
                  onChange={(e) => setMonthlyExpensesInput(e.target.value)}
                  className={`w-full pl-8 pr-4 py-2.5 bg-[#07090E] border rounded-2xl text-sm font-black text-white outline-none transition-all ${
                    isBufferDeficit
                      ? "border-[#EF4444] focus:border-[#EF4444]"
                      : "border-white/[0.08] focus:border-[#00D09C]"
                  }`}
                />
              </div>

              {/* Real-time Inline Warnings */}
              {isBufferDeficit ? (
                <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-[11px] text-[#DC2626] font-medium flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Buffer Alert:</strong> 6-Mo Emergency Fund (₹{formatINR(rawEmergencyBuffer)}) exceeds total savings. Investable corpus is ₹0 until liquid buffer is secure.
                  </span>
                </div>
              ) : isHighBurnRate ? (
                <div className="p-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[10px] text-[#D97706] font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>High Burn Rate: Monthly expenses exceed 1/12th of total savings.</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Reserves ₹{formatINR(rawEmergencyBuffer)} (6 months) in risk-free liquid emergency funds.
                </p>
              )}
            </div>

            {/* Dynamic Risk Preference Profile */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                Risk Preference Profile
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.keys(RISK_PROFILES).map((key) => {
                  const item = RISK_PROFILES[key];
                  const isSelected = riskPreference === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRiskPreference(key)}
                      className={`py-2 px-2 rounded-2xl text-xs font-extrabold border transition-all text-center cursor-pointer ${
                        isSelected
                          ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                          : "bg-[#07090E] border-white/[0.08] text-slate-400 hover:bg-[#1E293B]/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="p-2.5 rounded-xl bg-[#07090E] border border-white/[0.08] text-[11px] text-slate-300 leading-relaxed">
                <strong>{currentProfile.tagline}:</strong> {currentProfile.desc}
              </div>
            </div>
          </div>

          {/* 3 Core Stat Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-[#07090E] border border-white/[0.08] space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                1. Total Liquid Savings
              </span>
              <div className="text-2xl font-black text-white">
                ₹{formatINR(validSavings)}
              </div>
              <p className="text-[11px] text-slate-400">Your starting liquid bank corpus</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FEF2F2]/60 border border-[#FEE2E2] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#DC2626]">
                  2. Emergency Reserve (6 Mo)
                </span>
                <ShieldCheck className="w-4 h-4 text-[#DC2626]" />
              </div>
              <div className="text-2xl font-black text-[#DC2626]">
                ₹{formatINR(emergencyBuffer)}
              </div>
              <p className="text-[11px] text-slate-400">Liquid FD / Savings buffer (Do not invest)</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#00D09C]/10/70 border border-[#A7F3D0] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00D09C]">
                  3. Net Investable Corpus
                </span>
                <PieChart className="w-4 h-4 text-[#00D09C]" />
              </div>
              <div className="text-2xl font-black text-[#00D09C]">
                ₹{formatINR(netInvestable)}
              </div>
              <p className="text-[11px] text-slate-400">Safe for multi-asset allocation</p>
            </div>
          </div>

          {/* Dynamic Visual Allocation Bar & Rupee Reconciliation */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[#00D09C]" />
                Illustrative Asset Allocation ({currentProfile.label} Model)
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                Reconciles to 100% (₹{formatINR(netInvestable)})
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="w-full h-3.5 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-inner">
              {finalAllocations.map((item) => {
                if (item.pct <= 0) return null;
                return (
                  <div
                    key={item.id}
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    className="h-full transition-all duration-300"
                    title={`${item.name}: ${item.pct}% (₹${formatINR(item.amount)})`}
                  />
                );
              })}
            </div>

            {/* Allocation Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
              {finalAllocations.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#07090E] border border-white/[0.08] space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-black text-white shrink-0">{item.pct}%</span>
                  </div>
                  <div className="text-sm font-black text-white">
                    ₹{formatINR(item.amount)}
                  </div>
                </div>
              ))}
            </div>

            {/* Potential Equity Allocation Highlight Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#00D09C] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Calculated Potential Equity Allocation
                </div>
                <div className="text-2xl font-black text-white">
                  ₹{formatINR(potentialEquityAllocation)}
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    ({currentProfile.allocations.find((a) => a.id === "equity")?.pct}% of Net Investable)
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Disciplined allocation formula ensures zero exposure to emergency funds while compounding in institutional-grade equities.
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PILLAR 2: MULTI-ASSET COMPOUNDING GROWTH CURVES (INTERACTIVE GRAPH)        */}
        {/* ========================================================================= */}
        <section className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#4F46E5] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Pillar 2: Compounding Curves
                </div>
                <h2 className="text-xl font-black text-white">
                  Multi-Asset Reality Engine (1Y – 10Y Growth Trajectories)
                </h2>
              </div>
            </div>

            {/* Return Mode Toggle (Nominal vs Inflation Adjusted) */}
            <div className="flex items-center bg-[#1E293B]/60 p-1 rounded-2xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setReturnMode("nominal")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  returnMode === "nominal"
                    ? "bg-[#0F172A]/70 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Nominal Return
              </button>
              <button
                type="button"
                onClick={() => setReturnMode("real")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  returnMode === "real"
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Real (Post-Inflation 6.5%)
              </button>
            </div>
          </div>

          {/* Controls: Simulation Capital & Time Horizon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#07090E] p-4 sm:p-5 rounded-2xl border border-white/[0.08]">
            {/* Simulation Capital Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  Simulation Capital (₹)
                </label>
                <span className="text-[10px] font-extrabold text-[#4F46E5]">
                  ₹{formatINR(validSimCapital)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="1000"
                  max="100000000"
                  step="5000"
                  value={simCapital}
                  onChange={(e) => setSimCapital(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-[#0F172A]/70 border border-white/[0.08] focus:border-[#4F46E5] rounded-xl text-sm font-black text-white outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10000, 50000, 100000, 500000, 1000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSimCapital(val)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#0F172A]/70 border border-white/[0.08] hover:bg-[#1E293B]/60 text-slate-400 cursor-pointer"
                  >
                    ₹{(val / 100000).toFixed(val >= 1000000 ? 0 : 1)}L
                  </button>
                ))}
              </div>
            </div>

            {/* Time Horizon Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white block">
                Time Horizon
              </label>
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                {[1, 3, 5, 10].map((yr) => {
                  const isSelected = timeHorizon === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setTimeHorizon(yr)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs"
                          : "bg-[#0F172A]/70 border-white/[0.08] text-slate-400 hover:bg-[#1E293B]/60"
                      }`}
                    >
                      {yr} {yr === 1 ? "Year" : "Years"}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Simulating {timeHorizon}-year compound growth trajectory for ₹{formatINR(validSimCapital)}.
              </p>
            </div>
          </div>

          {/* Interactive Multi-Line Recharts Graph */}
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="year" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(value, name) => {
                    const match = ASSET_CLASSES.find((a) => a.id === name);
                    const label = match ? match.name : name === "inflation_baseline" ? "Inflation Baseline (6.5%)" : name;
                    return [`₹${formatINR(value)}`, label];
                  }}
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "16px",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const match = ASSET_CLASSES.find((a) => a.id === value);
                    return match ? match.name : value === "inflation_baseline" ? "6.5% Inflation Baseline" : value;
                  }}
                  wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                />

                {/* 5 Asset Lines */}
                {ASSET_CLASSES.map((asset) => (
                  <Line
                    key={asset.id}
                    type="monotone"
                    dataKey={asset.id}
                    stroke={asset.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: asset.color }}
                    activeDot={{ r: 6 }}
                  />
                ))}

                {/* Benchmark Inflation Line */}
                <Line
                  type="monotone"
                  dataKey="inflation_baseline"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Clean Multi-Asset Comparison Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400">
                  <th className="pb-3 font-extrabold uppercase">Asset Class</th>
                  <th className="pb-3 font-extrabold uppercase">Historical CAGR</th>
                  <th className="pb-3 font-extrabold uppercase">
                    {timeHorizon}Y Nominal Corpus
                  </th>
                  <th className="pb-3 font-extrabold uppercase">
                    {timeHorizon}Y Real (Post-Inflation)
                  </th>
                  <th className="pb-3 font-extrabold uppercase">Tax &amp; Liquidity Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {assetSummaryTable.map((item) => (
                  <tr key={item.id} className="hover:bg-[#07090E] transition-colors">
                    <td className="py-3 font-black text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <div>{item.name}</div>
                        <span className="text-[10px] font-bold text-slate-400">{item.category}</span>
                      </div>
                    </td>
                    <td className="py-3 font-black text-white">
                      {item.cagr}% p.a.
                    </td>
                    <td className="py-3 font-black text-[#00D09C]">
                      ₹{formatINR(item.nominalFinal)}
                      <div className="text-[10px] font-semibold text-slate-400">
                        +₹{formatINR(item.nominalGain)} ({item.totalReturnPct}%)
                      </div>
                    </td>
                    <td className="py-3 font-black text-[#4F46E5]">
                      ₹{formatINR(item.realFinal)}
                      <div className="text-[10px] font-semibold text-slate-400">
                        Real Gain: {item.realGain >= 0 ? "+" : ""}₹{formatINR(item.realGain)}
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 text-[11px] leading-relaxed max-w-xs">
                      <div><strong>Tax:</strong> {item.taxation}</div>
                      <div><strong>Lock-in:</strong> {item.lockIn}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PILLAR 3: ANTI-SCAM & FINFLUENCER TIP SCANNER                              */}
        {/* ========================================================================= */}
        <section className="bg-[#0F172A]/70 rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#DC2626] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Pillar 3: Scam Defense
                </div>
                <h2 className="text-xl font-black text-white">
                  Anti-Scam &amp; Finfluencer Tip Verifier
                </h2>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#07090E] border border-white/[0.08] text-[11px] text-slate-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D09C]" />
              <span>SEBI Unregistered Tip Detector</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Input & Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAntiScamCheck();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter Stock Symbol or Tip (e.g. RELIANCE, 100% Guaranteed Multibagger Tip...)"
                  value={scamQuery}
                  onChange={(e) => setScamQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#07090E] border border-white/[0.08] focus:border-[#DC2626] focus:bg-[#0F172A]/70 rounded-2xl text-sm font-semibold text-white outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={scamChecking || !scamQuery.trim()}
                className="px-6 py-3 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                {scamChecking ? "Analyzing..." : "Verify Tip Safety"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Test Sample Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-slate-400 text-[11px]">Quick Tests:</span>
              {[
                { label: "RELIANCE (Bluechip)", val: "RELIANCE" },
                { label: "TCS (Institutional)", val: "TCS" },
                { label: "100% Guaranteed Multibagger (Scam)", val: "100% Guaranteed Multibagger Tip" },
                { label: "Telegram Jackpot Penny Stock (Trap)", val: "Telegram Jackpot Penny Stock" }
              ].map((pill) => (
                <button
                  key={pill.val}
                  type="button"
                  onClick={() => runAntiScamCheck(pill.val)}
                  className="px-2.5 py-1 rounded-xl bg-[#1E293B]/60 hover:bg-[#E2E8F0] text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Verification Result Card */}
            {scamResult && (
              <div className="mt-4 p-5 sm:p-6 rounded-3xl border border-white/[0.08] bg-[#07090E] space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Verification Analysis for: "{scamResult.query}"
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5">
                      {scamResult.title}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border self-start sm:self-auto ${scamResult.badgeClass}`}>
                    {scamResult.riskScore}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#0F172A]/70 border border-white/[0.08] space-y-1">
                    <span className="font-bold text-slate-400 block">Promoter &amp; Institutional Holding</span>
                    <p className="font-bold text-white">{scamResult.promoterQuality}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0F172A]/70 border border-white/[0.08] space-y-1">
                    <span className="font-bold text-slate-400 block">Market Liquidity</span>
                    <p className="font-bold text-white">{scamResult.liquidity}</p>
                  </div>
                </div>

                {scamResult.regulatoryAlert && (
                  <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#DC2626] font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{scamResult.regulatoryAlert}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-[#0F172A] text-white text-xs font-medium leading-relaxed">
                  <strong className="text-[#00D09C]">SEBI Compliance Takeaway: </strong>
                  {scamResult.actionAdvice}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating AI Educational Assistant */}
      <FlyingVidyaBot context={assetMatrixContext} />
    </div>
  );
}
