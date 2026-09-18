import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StockCard from "../components/StockCard";
import StockSearch from "../components/StockSearch";
import FlyingVidyaBot from "../components/FlyingVidyaBot";
import {
  Bookmark,
  Plus,
  TrendingUp,
  BookOpen,
  X,
  ExternalLink,
  Flame,
  Wallet,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function Dashboard() {
  const { user, authConfig } = useAuth();
  const [presets, setPresets] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [hasMoreStocks, setHasMoreStocks] = useState(false);
  const [loadingMoreStocks, setLoadingMoreStocks] = useState(false);
  const [stockLoadError, setStockLoadError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        axios.get(`${API}/stocks/preset`, { params: { limit: 12, offset: 0 } }),
        axios.get(`${API}/stocks/news`)
      ];

      const token = localStorage.getItem("token");
      if (token) {
        requests.push(axios.get(`${API}/watchlist/details`, authConfig()));
      }

      const results = await Promise.all(requests);
      setPresets(results[0].data?.stocks || []);
      setHasMoreStocks(Boolean(results[0].data?.has_more));
      setStockLoadError("");
      setNews(results[1].data?.news || []);

      if (token && results[2]) {
        setWatchlist(results[2].data || []);
      } else {
        setWatchlist([]);
      }
    } catch (e) {
      console.error("Error loading dashboard data:", e);
      setStockLoadError("Unable to load more stocks right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authConfig]);

  const loadMoreStocks = async () => {
    setLoadingMoreStocks(true);
    setStockLoadError("");
    try {
      const res = await axios.get(`${API}/stocks/preset`, {
        params: { limit: 12, offset: presets.length }
      });
      const additionalStocks = res.data?.stocks || [];
      setPresets((current) => [...current, ...additionalStocks]);
      setHasMoreStocks(Boolean(res.data?.has_more));
    } catch (e) {
      console.error("Error loading more stocks:", e);
      setStockLoadError("Unable to load more stocks right now. Please try again.");
    } finally {
      setLoadingMoreStocks(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const removeFromWatchlist = async (symbol) => {
    try {
      await axios.delete(`${API}/watchlist/remove?symbol=${encodeURIComponent(symbol)}`, authConfig());
      setWatchlist((w) => w.filter((s) => s.symbol !== symbol));
    } catch (e) {
      console.error("Failed to remove from watchlist:", e);
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : null;

  // Smart Filter presets based on tab
  const displayedStocks = (() => {
    let filtered = [...presets];
    if (activeTab === "gainers") {
      filtered = filtered.filter((s) => (s.change_percent ?? 0) > 0);
      filtered.sort((a, b) => (b.change_percent ?? 0) - (a.change_percent ?? 0));
    } else if (activeTab === "buy") {
      filtered = filtered.filter(
        (s) => (s.signal ?? "").toUpperCase() === "BUY" || (s.change_percent ?? 0) >= 0.1
      );
    } else if (activeTab === "ai") {
      filtered = filtered.filter((s) => (s.ai_score ?? 0) >= 70);
      filtered.sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0));
    }

    if (filtered.length === 0 && presets.length > 0) {
      if (activeTab === "ai") {
        filtered = [...presets].sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0));
      } else {
        filtered = [...presets];
      }
    }
    return filtered;
  })();

  const dashboardContext = {
    page: "dashboard",
    stocks: presets.slice(0, 8).map((s) => ({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      change: s.change,
      change_percent: s.change_percent,
      signal: s.signal,
      ai_score: s.ai_score
    })),
    watchlist: watchlist.map((w) => ({
      symbol: w.symbol,
      name: w.name,
      price: w.price,
      change: w.change,
      change_percent: w.change_percent
    })),
    news: news.slice(0, 5).map((n) => ({
      title: n.title,
      publisher: n.publisher
    }))
  };

  return (
    <div className="min-h-screen bg-atmospheric text-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot context={dashboardContext} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Financial Intelligence Lab Hero ─────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0B0F17] via-[#111827] to-[#0B0F17] rounded-3xl p-6 sm:p-10 border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          {/* Atmospheric Glows */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-72 h-72 bg-[#00D09C]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] text-xs font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(0,208,156,0.15)]">
                <span className="w-2 h-2 rounded-full bg-[#00D09C] animate-pulse shadow-[0_0_6px_#00D09C]" />
                FINANCIAL INTELLIGENCE LAB • QUANT AI ENGINE
              </div>

              <div>
                <h1 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
                  {firstName ? (
                    <>
                      Welcome back, <span className="text-[#00D09C]">{firstName}</span>
                    </>
                  ) : (
                    <>
                      MARKET <span className="text-[#00D09C]">INTELLIGENCE</span>
                    </>
                  )}
                </h1>
                <p className="text-[#94A3B8] text-sm sm:text-base font-medium leading-relaxed mt-2">
                  Real-time NSE Indian equity intelligence, NLP news sentiment polarity, multi-factor AI scoring, and live paper trading simulation.
                </p>
              </div>

              {/* Dynamic Feature Badges */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-[#94A3B8]">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#00D09C]" /> Live NSE Quotes
                </span>
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-[#A78BFA]" /> NLP Sentiment Scorer
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00D09C]" /> ₹10,000 Paper Trading
                </span>
              </div>
            </div>

            {/* Quick Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                to="/portfolio"
                className="px-6 py-4 rounded-2xl bg-[#00D09C] hover:bg-[#00B386] text-[#07090E] font-extrabold text-sm shadow-[0_0_30px_rgba(0,208,156,0.35)] transition-all flex items-center justify-center gap-2 hover:scale-105 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Open Virtual Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Global Search Bar ────────────────────────────────────── */}
        <section className="relative">
          <StockSearch size="lg" placeholder="Search any Indian stock (e.g. Reliance, TCS, INFY, HDFC Bank)..." />
        </section>

        {/* ── User Watchlist ───────────────────────────────────────── */}
        <section data-testid="watchlist-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#111827] border border-white/[0.08] flex items-center justify-center text-white shadow-xs">
                <Bookmark className="w-5 h-5 text-[#00D09C]" />
              </div>
              <div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
                  My Watchlist
                </h2>
                <div className="text-xs text-[#94A3B8] font-medium">
                  {watchlist.length === 0 ? "No stocks pinned yet" : `${watchlist.length} stocks tracked with real-time indicators`}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 bg-[#111827]/60 border border-white/[0.06] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="bg-[#111827]/50 border border-dashed border-white/[0.1] rounded-3xl p-8 sm:p-12 text-center backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/20 text-[#00D09C] flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-white">Your watchlist is empty</h3>
              <p className="text-sm text-[#94A3B8] max-w-md mx-auto mt-1">
                Search any company above or pick from popular Indian stocks below to monitor their daily signals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {watchlist.map((s, i) => (
                <div key={s.symbol} className="relative group">
                  <button
                    data-testid={`watchlist-remove-${s.symbol}`}
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWatchlist(s.symbol);
                    }}
                    className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-[#111827]/90 border border-white/[0.1] shadow-md flex items-center justify-center text-[#94A3B8] hover:text-[#EF4444] hover:border-[#EF4444]/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove from watchlist"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <StockCard stock={s} index={i} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Explore Indian Market (Tabs) ─────────────────────────── */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/30 flex items-center justify-center text-[#00D09C] shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
                  Popular Indian Stocks
                </h2>
                <div className="text-xs text-[#94A3B8] font-medium">
                  Live National Stock Exchange (NSE) prices &amp; AI Health Scores ({displayedStocks.length} available)
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[#111827] p-1.5 rounded-2xl border border-white/[0.08] flex-wrap">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white/[0.1] text-white shadow-xs font-extrabold border border-white/[0.1]"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                All Stocks
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-[#00D09C] text-[#07090E] shadow-[0_0_15px_rgba(0,208,156,0.3)] font-extrabold"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                ⭐ AI Top Picks
              </button>
              <button
                onClick={() => setActiveTab("buy")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "buy"
                    ? "bg-[#00D09C] text-[#07090E] shadow-[0_0_15px_rgba(0,208,156,0.3)] font-extrabold"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                🟢 BUY Signals
              </button>
              <button
                onClick={() => setActiveTab("gainers")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "gainers"
                    ? "bg-white/[0.1] text-[#00D09C] shadow-xs font-extrabold border border-white/[0.1]"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                📈 Top Gainers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-36 bg-[#111827]/60 border border-white/[0.06] rounded-2xl animate-pulse" />
                ))
              : displayedStocks.map((s, i) => <StockCard key={s.symbol} stock={s} index={i} />)}
          </div>

          {stockLoadError && (
            <p className="mt-4 text-sm font-semibold text-[#EF4444]">{stockLoadError}</p>
          )}

          {!loading && hasMoreStocks && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMoreStocks}
                disabled={loadingMoreStocks}
                className="px-6 py-3 rounded-2xl bg-[#111827] border border-white/[0.1] text-white font-extrabold text-sm shadow-sm hover:border-[#00D09C] hover:text-[#00D09C] disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loadingMoreStocks ? "Loading stocks..." : "Load More"}
              </button>
            </div>
          )}
        </section>

        {/* ── Live Market News & Learning Split Section ────────────── */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Market News (2 Columns) */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#A78BFA] shadow-xs">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-xl text-white">
                  Market News &amp; Insights
                </h2>
                <div className="text-xs text-[#94A3B8] font-medium">
                  Latest updates impacting Indian markets
                </div>
              </div>
            </div>

            <div className="grid gap-3.5">
              {news.slice(0, 5).map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="groww-card p-5 flex items-start justify-between gap-4 group cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="font-bold text-white text-sm sm:text-base group-hover:text-[#00D09C] transition-colors leading-snug">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
                      <span className="text-[#38BDF8] font-semibold">{item.publisher}</span>
                      <span>•</span>
                      <span>Market Update</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#64748B] group-hover:text-[#00D09C] shrink-0 mt-1 transition-colors" />
                </a>
              ))}
            </div>
          </section>

          {/* Educational Quick Guide Card (1 Column) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/30 flex items-center justify-center text-[#00D09C] shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-xl text-white">
                  Data Science Lab Insights
                </h2>
                <div className="text-xs text-[#94A3B8] font-medium">
                  How AI Evaluates Stocks
                </div>
              </div>
            </div>

            <div className="bg-[#111827]/70 border border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-xl">
              <div className="border-l-4 border-[#00D09C] pl-3.5 py-1">
                <div className="font-extrabold text-xs text-[#00D09C] uppercase tracking-wider">
                  AI Composite Score (0-100)
                </div>
                <p className="text-xs font-medium text-[#CBD5E1] mt-0.5 leading-relaxed">
                  Synthesizes 40% Technical trend + 35% News NLP Sentiment + 25% Fundamental valuation into a single score.
                </p>
              </div>

              <div className="border-l-4 border-[#38BDF8] pl-3.5 py-1">
                <div className="font-extrabold text-xs text-[#38BDF8] uppercase tracking-wider">
                  NLP Sentiment Polarity
                </div>
                <p className="text-xs font-medium text-[#CBD5E1] mt-0.5 leading-relaxed">
                  Extracts positive/negative keywords from financial headlines to compute real-time market sentiment.
                </p>
              </div>

              <div className="border-l-4 border-[#F59E0B] pl-3.5 py-1">
                <div className="font-extrabold text-xs text-[#F59E0B] uppercase tracking-wider">
                  Paper Trading Risk Simulator
                </div>
                <p className="text-xs font-medium text-[#CBD5E1] mt-0.5 leading-relaxed">
                  Observe actual price movements on your virtual portfolio before investing real savings.
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.06] text-center">
                <p className="text-xs text-[#94A3B8] font-medium">
                  Got questions? Click <span className="font-bold text-[#00D09C]">Vidya AI</span> flying on the screen!
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
