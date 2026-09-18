import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  Layers,
  Users,
  Wallet,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
  Lock
} from "lucide-react";
import AnimatedSection from "./AnimatedSection";

export default function BentoGridShowcase() {
  return (
    <section className="relative py-12 space-y-8">
      <AnimatedSection className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] text-xs font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(0,208,156,0.15)]">
          <Sparkles className="w-3.5 h-3.5" />
          POINTER-CLASS INTELLIGENCE ARCHITECTURE
        </div>
        <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          Next-Gen AI Trading & <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#00D09C] via-[#38BDF8] to-[#818CF8] bg-clip-text text-transparent">
            Quant Simulation Suite
          </span>
        </h2>
        <p className="text-[#94A3B8] text-sm sm:text-base font-medium">
          Six interconnected institutional-grade intelligence engines designed to make every retail investor fearless, disciplined, and profitable.
        </p>
      </AnimatedSection>

      {/* 6-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Card 1: Pre-Trade AI Shield Scanner */}
        <AnimatedSection delay={0.05} className="group relative rounded-3xl p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#00D09C]/40 backdrop-blur-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#00D09C]/10 rounded-full blur-2xl group-hover:bg-[#00D09C]/20 transition-all pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] flex items-center justify-center shadow-[0_0_15px_rgba(0,208,156,0.15)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/20">
                ACTIVE GUARD
              </span>
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white group-hover:text-[#00D09C] transition-colors">
                Pre-Trade AI Shield
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                Real-time risk audit engine that intercepts FOMO orders, verifies portfolio concentration, and calculates risk-reward before execution.
              </p>
            </div>

            {/* Interactive Micro UI Simulation */}
            <div className="p-3.5 rounded-2xl bg-[#07090E]/80 border border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                  <Activity className="w-3.5 h-3.5 text-[#00D09C]" /> Risk Score
                </span>
                <span className="text-[#00D09C] font-mono">18 / 100 (LOW)</span>
              </div>
              <div className="space-y-1 text-[11px] text-[#94A3B8]">
                <div className="flex justify-between items-center py-0.5 border-t border-white/[0.04]">
                  <span>Capital Allocation</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Safe (4.8%)
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-t border-white/[0.04]">
                  <span>Sector Concentration</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Diversified
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/portfolio"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#00D09C] hover:text-[#00B386] transition-colors group-hover:translate-x-1 transform duration-200"
          >
            Launch Paper Shield <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </AnimatedSection>

        {/* Card 2: Vidya AI Quant Analyst */}
        <AnimatedSection delay={0.1} className="group relative rounded-3xl p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#A78BFA]/40 backdrop-blur-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#A78BFA]/10 rounded-full blur-2xl group-hover:bg-[#A78BFA]/20 transition-all pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#A78BFA]/10 border border-[#A78BFA]/30 text-[#A78BFA] flex items-center justify-center shadow-[0_0_15px_rgba(167,139,250,0.15)]">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20">
                LLM COPILOT
              </span>
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white group-hover:text-[#A78BFA] transition-colors">
                Vidya AI Financial Copilot
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                Context-aware multimodal chatbot trained on Indian corporate filings, valuation fundamentals, and NLP news sentiment.
              </p>
            </div>

            {/* Micro Chat Prompt Box */}
            <div className="p-3.5 rounded-2xl bg-[#07090E]/80 border border-white/[0.06] space-y-2">
              <div className="text-[11px] font-mono text-[#A78BFA] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-ping" />
                "Explain RELIANCE 52W range vs RSI(14)..."
              </div>
              <div className="p-2 bg-white/[0.03] rounded-xl text-[10px] text-[#CBD5E1] border border-white/[0.04]">
                ⚡ <span className="font-semibold text-white">Vidya:</span> RSI is at 52.4 (Neutral zone), P/E of 24.1 trades at 8% discount to 3Y median.
              </div>
            </div>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-vidya"))}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#A78BFA] hover:text-[#C4B5FD] transition-colors group-hover:translate-x-1 transform duration-200 text-left cursor-pointer"
          >
            Chat with Vidya <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </AnimatedSection>

        {/* Card 3: Real-Time Virtual Terminal */}
        <AnimatedSection delay={0.15} className="group relative rounded-3xl p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#38BDF8]/40 backdrop-blur-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#38BDF8]/10 rounded-full blur-2xl group-hover:bg-[#38BDF8]/20 transition-all pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                LIVE NSE TICK
              </span>
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white group-hover:text-[#38BDF8] transition-colors">
                Real-Time Trading Terminal
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                Low-latency live NSE quotes, automated technical indicators (MA20/50, 52W Highs/Lows), and 1-click execution.
              </p>
            </div>

            {/* Micro Trading Display */}
            <div className="p-3.5 rounded-2xl bg-[#07090E]/80 border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-[#94A3B8]">TCS.NS • LIVE</div>
                <div className="font-heading font-black text-lg text-white">₹3,892.40</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-md bg-[#00D09C]/10 text-[#00D09C] font-mono font-bold text-xs">
                  +1.85% ▲
                </span>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">Vol: 1.42M</div>
              </div>
            </div>
          </div>

          <Link
            to="/stock/TCS"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#38BDF8] hover:text-[#7DD3FC] transition-colors group-hover:translate-x-1 transform duration-200"
          >
            Explore Stock Terminal <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </AnimatedSection>

        {/* Card 4: Multi-Asset Compounding Matrix */}
        <AnimatedSection delay={0.2} className="group relative rounded-3xl p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#F59E0B]/40 backdrop-blur-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#F59E0B]/10 rounded-full blur-2xl group-hover:bg-[#F59E0B]/20 transition-all pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                BENCHMARK ENGINE
              </span>
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white group-hover:text-[#F59E0B] transition-colors">
                Multi-Asset Matrix
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                Side-by-side growth simulator comparing Indian Equities (Nifty 50), Physical Gold, Real Estate, and Fixed Deposits.
              </p>
            </div>

            {/* Mini Multi-Bar Simulation */}
            <div className="p-3 rounded-2xl bg-[#07090E]/80 border border-white/[0.06] space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center text-[#CBD5E1]">
                <span>Nifty 50 CAGR (14.2%)</span>
                <div className="w-24 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-[#00D09C] rounded-full" />
                </div>
              </div>
              <div className="flex justify-between items-center text-[#CBD5E1]">
                <span>Gold SGB (11.0%)</span>
                <div className="w-24 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="w-[65%] h-full bg-[#F59E0B] rounded-full" />
                </div>
              </div>
              <div className="flex justify-between items-center text-[#CBD5E1]">
                <span>Bank FD (7.1%)</span>
                <div className="w-24 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="w-[40%] h-full bg-[#94A3B8] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/asset-matrix"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] hover:text-[#FBBF24] transition-colors group-hover:translate-x-1 transform duration-200"
          >
            Launch Matrix Simulator <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </AnimatedSection>

        {/* Card 5: Clans & Pro League Alpha */}
        <AnimatedSection delay={0.25} className="group relative rounded-3xl p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#EC4899]/40 backdrop-blur-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#EC4899]/10 rounded-full blur-2xl group-hover:bg-[#EC4899]/20 transition-all pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/10 border border-[#EC4899]/30 text-[#EC4899] flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#EC4899]/10 text-[#EC4899] border border-[#EC4899]/20">
                P2P LEADERBOARDS
              </span>
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white group-hover:text-[#EC4899] transition-colors">
                Trading Clans & Pro Alpha
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                Join competitive trading leagues, track top verified trader win rates, and ask queries in real-time community rooms.
              </p>
            </div>

            {/* Micro Clan Leaderboard */}
            <div className="p-3 rounded-2xl bg-[#07090E]/80 border border-white/[0.06] space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  Valhalla Bulls
                </span>
                <span className="text-[#EC4899] font-mono font-bold">+28.4% PnL</span>
              </div>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  Quantum Alphas
                </span>
                <span className="text-emerald-400 font-mono font-bold">+22.1% PnL</span>
              </div>
            </div>
          </div>

          <Link
            to="/community"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#EC4899] hover:text-[#F472B6] transition-colors group-hover:translate-x-1 transform duration-200"
          >
            Explore Trading Clans <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </AnimatedSection>

        {/* Card 6: Zero-Risk Virtual Capital */}
        <AnimatedSection delay={0.3} className="group relative rounded-3xl p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-[#00D09C]/40 backdrop-blur-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#00D09C]/10 rounded-full blur-2xl group-hover:bg-[#00D09C]/20 transition-all pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] flex items-center justify-center shadow-[0_0_15px_rgba(0,208,156,0.15)]">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/20">
                100% RISK-FREE
              </span>
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-white group-hover:text-[#00D09C] transition-colors">
                ₹10,00,000 Paper Capital
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                Test bold swing setups and intraday strategies with simulated virtual currency. Zero real money loss, maximum skill gain.
              </p>
            </div>

            {/* Micro Wallet Ledger */}
            <div className="p-3.5 rounded-2xl bg-[#07090E]/80 border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-[#94A3B8]">SIMULATED BALANCE</div>
                <div className="font-heading font-black text-lg text-[#00D09C]">₹10,00,000.00</div>
              </div>
              <div className="p-2 rounded-xl bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/20">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>

          <Link
            to="/portfolio"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#00D09C] hover:text-[#00B386] transition-colors group-hover:translate-x-1 transform duration-200"
          >
            Start Virtual Trading <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </AnimatedSection>

      </div>
    </section>
  );
}
