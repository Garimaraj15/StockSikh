import React, { useState } from "react";
import { TrendingUp, TrendingDown, Sparkles, Coins } from "lucide-react";

export default function MoneyGrowthVisualizer({ stockName = "Reliance Industries", stockPrice = 1257.50, stockChangePercent = 2.40 }) {
  const [investAmount, setInvestAmount] = useState(1000);
  const [timeframe, setTimeframe] = useState("1d");

  const changePct = stockChangePercent || 2.4;
  const isPositive = changePct >= 0;

  let multiplier = 1.0;
  let periodLabel = "Today";
  if (timeframe === "1d") {
    multiplier = (changePct / 100);
    periodLabel = "Today (1 Day)";
  } else if (timeframe === "1m") {
    multiplier = (changePct * 4.5) / 100;
    periodLabel = "In 1 Month (Estimated)";
  } else if (timeframe === "1y") {
    multiplier = (changePct * 12.0) / 100;
    periodLabel = "In 1 Year (Estimated)";
  }

  const profitAmount = Number((investAmount * multiplier).toFixed(2));
  const totalValue = Number((investAmount + profitAmount).toFixed(2));
  const sharesCount = (investAmount / (stockPrice || 1000)).toFixed(2);

  return (
    <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-8 border border-[#334155] shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D09C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#334155] pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00D09C] to-[#387ED1] flex items-center justify-center text-[#0F172A] shadow-lg">
            <Coins className="w-6 h-6 text-[#0F172A]" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#00D09C] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Live Money Growth Math
            </div>
            <h3 className="font-heading font-extrabold text-xl text-white">
              Paisa Kaise Badhta Hai? (Live Return Calculator)
            </h3>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-xl border border-[#334155]">
          {["1d", "1m", "1y"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                timeframe === t
                  ? "bg-[#00D09C] text-[#0F172A] shadow-md scale-105"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {t === "1d" ? "1 Day" : t === "1m" ? "1 Month" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Slider */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between text-xs font-bold text-[#94A3B8]">
          <span>Agar aap invest karte:</span>
          <span className="text-xl font-extrabold text-white bg-[#0B0F19] px-4 py-1.5 rounded-xl border border-[#334155]">
            ₹{investAmount.toLocaleString("en-IN")}
          </span>
        </div>

        <input
          type="range"
          min="500"
          max="50000"
          step="500"
          value={investAmount}
          onChange={(e) => setInvestAmount(Number(e.target.value))}
          className="w-full h-2.5 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#00D09C]"
        />

        <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
          <span>₹500</span>
          <span>₹10,000</span>
          <span>₹25,000</span>
          <span>₹50,000</span>
        </div>
      </div>

      {/* 3D Visual Growth Math Step-by-Step */}
      <div className="grid sm:grid-cols-3 gap-4 pt-2 relative z-10">
        {/* Step 1: Invested */}
        <div className="bg-[#0B0F19]/80 border border-[#334155] rounded-2xl p-4.5 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
            1. Aapka Invested Capital
          </div>
          <div className="font-heading font-extrabold text-2xl text-white">
            ₹{investAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-[#64748B] font-medium">
            ≈ {sharesCount} Shares of {stockName}
          </div>
        </div>

        {/* Step 2: Live Stock Movement */}
        <div className="bg-[#0B0F19]/80 border border-[#334155] rounded-2xl p-4.5 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
            2. Stock Movement ({periodLabel})
          </div>
          <div className={`font-heading font-extrabold text-2xl flex items-center gap-1.5 ${isPositive ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {isPositive ? "+" : ""}{(changePct * (timeframe === "1y" ? 12 : timeframe === "1m" ? 4.5 : 1)).toFixed(2)}%
          </div>
          <div className="text-xs text-[#64748B] font-medium">
            Share price: ₹{stockPrice}
          </div>
        </div>

        {/* Step 3: Resulting Net Worth */}
        <div className="bg-gradient-to-br from-[#00D09C]/20 to-[#387ED1]/20 border border-[#00D09C]/40 rounded-2xl p-4.5 space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#00D09C]">
            3. Aapka Naya Balance
          </div>
          <div className="font-heading font-extrabold text-2xl text-white">
            ₹{totalValue.toLocaleString("en-IN")}
          </div>
          <div className={`text-xs font-extrabold ${profitAmount >= 0 ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
            {profitAmount >= 0 ? `+₹${profitAmount.toLocaleString("en-IN")} Net Profit 🎉` : `-₹${Math.abs(profitAmount).toLocaleString("en-IN")} Loss`}
          </div>
        </div>
      </div>

      {/* Educational Note */}
      <div className="bg-[#0B0F19] rounded-2xl p-4 border border-[#334155] flex items-start gap-3 text-xs text-[#94A3B8] relative z-10">
        <Sparkles className="w-4 h-4 text-[#00D09C] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white font-bold">Funda Simple Hai:</strong> Jab company grow karti hai aur share price upar jaata hai, toh aapke lagaye hue har share ki value badh jaati hai. StockSikh ke Virtual Wallet me aap bina kisi risk ke yeh live dekh sakte hain!
        </div>
      </div>
    </div>
  );
}
