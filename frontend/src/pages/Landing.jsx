import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StockCard from "../components/StockCard";
import StockSearch from "../components/StockSearch";
import FlyingVidyaBot from "../components/FlyingVidyaBot";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Wallet,
  Users,
  BrainCircuit
} from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "Gamified Virtual Trading",
    body: "Get ₹10,000 starter virtual cash, claim task rewards, and practice buying/selling real NSE stocks with live P&L.",
  },
  {
    icon: BrainCircuit,
    title: "NLP Sentiment & AI Scores",
    body: "Data Science engine scans real-time news headlines to compute market sentiment and 0-100 composite stock health scores.",
  },
  {
    icon: Users,
    title: "Pro Mentors & Creators",
    body: "Post doubts on the Pro Query board and learn from top financial creators in Hindi, English, Marathi, Bengali, and more.",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/stocks/preset`)
      .then((r) => setPresets(r.data?.stocks || []))
      .catch(() => setPresets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-24 border-b border-[#E2E8F0] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8FAF4] border border-[#B3F2DF] text-xs font-bold uppercase tracking-wider text-[#00D09C]">
              <Sparkles className="w-4 h-4" /> AI-Driven Indian Stock Paper Trading Lab
            </div>

            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#0F172A] tracking-tight leading-[1.1]">
              Learn, trade &amp; grow <span className="text-[#00D09C]">before</span> you risk real money.
            </h1>

            <p className="text-base sm:text-lg text-[#475569] font-medium leading-relaxed max-w-xl">
              StockSikh AI is an interactive paper trading platform. Trade real-time NSE stocks with ₹10,000 virtual cash, decode NLP news sentiment, and get guided by Vidya AI.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                data-testid="hero-get-started-btn"
                onClick={() => navigate(user ? "/portfolio" : "/signup")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#00D09C] hover:bg-[#00B386] text-white text-base font-extrabold shadow-md hover:shadow-lg transition-all"
              >
                {user ? "Open Virtual Portfolio" : "Claim ₹10,000 & Start Free"}
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                data-testid="hero-explore-btn"
                onClick={() => document.getElementById("popular-stocks")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-base font-bold transition-colors"
              >
                Browse Live Indian Stocks
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00D09C]" /> Free ₹10,000 Virtual Cash
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00D09C]" /> NLP News Sentiment Engine
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00D09C]" /> Live NSE Yahoo Quotes
              </span>
            </div>
          </div>

          {/* Interactive Hero Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#00D09C] text-white flex items-center justify-center font-bold">
                    RE
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-base">Reliance Industries</h3>
                    <div className="text-xs text-[#64748B] font-medium">RELIANCE • NSE</div>
                  </div>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#E8FAF4] text-[#00D09C] border border-[#B3F2DF]">
                  AI SCORE: 88/100
                </span>
              </div>

              <div>
                <div className="text-xs uppercase font-bold text-[#64748B] tracking-wider mb-2">
                  Data Science Multi-Factor Signals
                </div>
                <div className="space-y-2 text-xs font-medium text-[#475569]">
                  <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-xl">
                    <span>NLP News Sentiment</span>
                    <span className="font-extrabold text-[#00D09C]">78% Bullish (Positive News)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-xl">
                    <span>20-Day Moving Average</span>
                    <span className="font-bold text-[#0F172A]">Above Support Line</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                  <Sparkles className="w-4 h-4 text-[#00D09C]" /> Flying Vidya AI Commentary
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  "Reliance has strong positive news sentiment and healthy momentum. Try buying 5 shares with your virtual cash to see how profits compound!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Search Strip */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-7 relative z-20">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-lg">
          <StockSearch size="lg" placeholder="Search across 25+ top Indian stocks (e.g. TCS, HDFC Bank, SBI, ITC)..." />
        </div>
      </section>

      {/* Popular Stocks Section */}
      <section id="popular-stocks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#00D09C] mb-1">
              Live National Stock Exchange
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
              Top Indian Stocks with AI Scores
            </h2>
          </div>

          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-[#00D09C] hover:text-[#00B386] transition-colors"
          >
            Open Full Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {presets.slice(0, 8).map((s, i) => (
              <StockCard key={s.symbol} stock={s} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="groww-card p-6 sm:p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8FAF4] text-[#00D09C] flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-[#0F172A]">{f.title}</h3>
              <p className="text-sm font-medium text-[#475569] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F172A]">Stockसीख AI</span>
            <span>•</span>
            <span>B.Tech Final Year Data Science Project. Pure educational simulation.</span>
          </div>
          <div>Powered by Yahoo Finance, NLP Sentiment &amp; Vidya AI</div>
        </div>
      </footer>
    </div>
  );
}
