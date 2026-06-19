import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { API, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StockCard from "../components/StockCard";
import StockSearch from "../components/StockSearch";
import { Button } from "../components/ui/button";
import { ArrowRight, Sparkles, BarChart3, BookOpen, ShieldCheck, TrendingUp } from "lucide-react";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Real-time charts",
    body: "Live NSE prices, smooth line charts, and key indicators — RSI & Moving Averages — explained in everyday language.",
  },
  {
    icon: Sparkles,
    title: "AI tutor: Vidya",
    body: "Stuck on a term? Ask Vidya. She explains stock concepts like a patient friend, no jargon.",
  },
  {
    icon: ShieldCheck,
    title: "Learn before you risk",
    body: "Practice reading signals and indicators with real Indian stocks — without putting a single rupee on the line.",
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
      .then((r) => setPresets(r.data.stocks || []))
      .catch(() => setPresets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Navbar />

      {/* HERO */}
      <section className="bg-grain">
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 md:pt-24 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F3F2ED] border border-[#E5E3DB] rounded-full text-xs uppercase tracking-[0.15em] text-[#52525B] mb-6">
              <Sprout /> Built for Indian beginners
            </div>
            <h1 className="font-heading font-semibold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#1A3626] leading-[1.05]">
              Learn the stock market <span className="text-[#D96C5B]">before</span> you risk a single rupee.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-[#52525B] leading-relaxed max-w-xl">
              Stockसीख is your friendly, AI-powered learning lab for NSE stocks.
              Live prices, beginner-grade indicators, and a tutor named Vidya who
              explains every BUY · SELL · HOLD signal in plain English.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                data-testid="hero-get-started-btn"
                onClick={() => navigate(user ? "/dashboard" : "/signup")}
                className="rounded-full bg-[#1A3626] hover:bg-[#264F38] text-white px-7 py-6 text-base font-medium"
              >
                {user ? "Open my dashboard" : "Start learning free"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                data-testid="hero-explore-btn"
                variant="outline"
                onClick={() => document.getElementById("live-stocks")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full border-[#E5E3DB] bg-white text-[#1C1C1C] hover:bg-[#F3F2ED] px-7 py-6 text-base font-medium"
              >
                Peek at live stocks
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-[#A1A1AA]">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% educational
              </span>
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" /> No financial advice
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -right-6 w-72 h-72 rounded-full bg-[#D96C5B]/10 blur-3xl" />
            <div className="relative bg-white rounded-3xl border border-[#E5E3DB] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A3626] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA]">Today's lesson</div>
                  <div className="font-heading font-semibold text-[#1A3626]">What is RSI?</div>
                </div>
              </div>
              <p className="text-sm text-[#52525B] leading-relaxed">
                Think of <span className="font-medium text-[#1C1C1C]">RSI (Relative Strength Index)</span> as a
                stock's <em>speedometer</em>. Above <span className="font-semibold">70</span> = racing too hot
                (could cool off). Below <span className="font-semibold">30</span> = barely moving (might bounce back).
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#FEE2E2] text-[#991B1B] rounded-xl py-2 font-semibold">{">70 Overbought"}</div>
                <div className="bg-[#FEF3C7] text-[#92400E] rounded-xl py-2 font-semibold">30-70 Neutral</div>
                <div className="bg-[#D1FAE5] text-[#065F46] rounded-xl py-2 font-semibold">{"<30 Oversold"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH STRIP */}
      <section className="max-w-4xl mx-auto px-6 md:px-8 -mt-2">
        <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA] mb-2">
            Find a stock
          </div>
          <StockSearch size="lg" />
        </div>
      </section>

      {/* LIVE STOCKS */}
      <section id="live-stocks" className="max-w-7xl mx-auto px-6 md:px-8 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA] mb-2">Live · NSE</div>
            <h2 className="font-heading font-semibold text-2xl sm:text-3xl tracking-tight text-[#1A3626]">
              Top Indian stocks right now
            </h2>
          </div>
          <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1 text-sm text-[#1A3626] hover:text-[#D96C5B] transition-colors">
            See full dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-white border border-[#E5E3DB] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {presets.map((s, i) => (
              <StockCard key={s.symbol} stock={s} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white border border-[#E5E3DB] rounded-2xl p-6 card-hover">
              <div className="w-11 h-11 rounded-xl bg-[#F3F2ED] flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#1A3626]" strokeWidth={1.8} />
              </div>
              <h3 className="font-heading font-semibold text-lg text-[#1A3626] mb-2">{f.title}</h3>
              <p className="text-sm text-[#52525B] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E3DB] py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-[#A1A1AA]">
          <div>© 2026 Stockसीख · For educational purposes only. Not financial advice.</div>
          <div className="flex items-center gap-4">
            <span>Powered by Yahoo Finance · OpenAI GPT-5.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Sprout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}
