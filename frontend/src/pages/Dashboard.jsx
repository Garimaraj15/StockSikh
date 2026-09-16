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
  Users
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [presets, setPresets] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const userId = user?.id || 1;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pres, wl, newsRes] = await Promise.all([
        axios.get(`${API}/stocks/preset`),
        axios.get(`${API}/watchlist/details?user_id=${userId}`),
        axios.get(`${API}/stocks/news`)
      ]);

      setPresets(pres.data?.stocks || []);
      setWatchlist(wl.data || []);
      setNews(newsRes.data?.news || []);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const removeFromWatchlist = async (symbol) => {
    try {
      await axios.delete(`${API}/watchlist/remove?user_id=${userId}&symbol=${encodeURIComponent(symbol)}`);
      setWatchlist((w) => w.filter((s) => s.symbol !== symbol));
    } catch (e) {
      console.error("Failed to remove from watchlist:", e);
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Trader";

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

    // Safety fallback: If filter returns empty, return sorted presets
    if (filtered.length === 0 && presets.length > 0) {
      if (activeTab === "ai") {
        filtered = [...presets].sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0));
      } else {
        filtered = [...presets];
      }
    }
    return filtered;
  })();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Signal AI Styled Market Intelligence Top Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-8 border border-[#334155] shadow-2xl">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D09C]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00D09C]/20 border border-[#00D09C]/40 text-[#00D09C] text-xs font-extrabold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#00D09C] animate-ping" />
                Live Market Intelligence • Signal AI Engine
              </div>
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                Welcome back, {firstName} 👋
              </h1>
              <p className="text-[#94A3B8] text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
                Real-time NSE Indian equity intelligence with NLP news sentiment, multi-factor AI scoring, and live paper trading simulation.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/portfolio"
                className="px-6 py-3.5 rounded-2xl bg-[#00D09C] hover:bg-[#00B386] text-[#0F172A] font-extrabold text-sm shadow-[0_10px_25px_rgba(0,208,156,0.3)] transition-all flex items-center gap-2 hover:scale-105"
              >
                <Wallet className="w-4 h-4" /> Virtual Portfolio &gt;
              </Link>

              <Link
                to="/pro-helpers"
                className="px-5 py-3.5 rounded-2xl bg-[#1E293B] hover:bg-[#334155] text-white border border-[#475569] font-bold text-sm transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-[#387ED1]" /> Pro Helpers
              </Link>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
          <StockSearch size="lg" placeholder="Search any Indian stock (e.g. Reliance, TCS, HDFC Bank, Infosys)..." />
        </section>

        {/* User Watchlist */}
        <section data-testid="watchlist-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm">
                <Bookmark className="w-5 h-5 text-[#00D09C]" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F172A]">
                  My Watchlist
                </h2>
                <div className="text-xs text-[#64748B] font-medium">
                  {watchlist.length === 0 ? "No stocks pinned yet" : `${watchlist.length} stocks tracked with real-time indicators`}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="bg-white border border-dashed border-[#CBD5E1] rounded-3xl p-8 sm:p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E8FAF4] text-[#00D09C] flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#0F172A]">Your watchlist is empty</h3>
              <p className="text-sm text-[#64748B] max-w-md mx-auto mt-1">
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
                    className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-white/90 border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#64748B] hover:text-[#EB5B3C] hover:border-[#FADCD8] opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Explore Indian Market (Tabs) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00D09C] flex items-center justify-center text-white shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F172A]">
                  Popular Indian Stocks
                </h2>
                <div className="text-xs text-[#64748B] font-medium">
                  Live National Stock Exchange (NSE) prices &amp; AI Health Scores ({displayedStocks.length} available)
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1.5 rounded-2xl flex-wrap">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-white text-[#0F172A] shadow-sm font-extrabold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                All Stocks
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "ai"
                    ? "bg-[#00D09C] text-[#0F172A] shadow-md font-extrabold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                ⭐ AI Top Picks
              </button>
              <button
                onClick={() => setActiveTab("buy")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "buy"
                    ? "bg-[#00D09C] text-[#0F172A] shadow-md font-extrabold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                🟢 BUY Signals
              </button>
              <button
                onClick={() => setActiveTab("gainers")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "gainers"
                    ? "bg-white text-[#00D09C] shadow-sm font-extrabold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                📈 Top Gainers
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-36 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
                ))
              : displayedStocks.map((s, i) => <StockCard key={s.symbol} stock={s} index={i} />)}
          </div>
        </section>

        {/* Live Market News & Learning Split Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Market News (2 Columns) */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#387ED1] flex items-center justify-center text-white shadow-sm">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl text-[#0F172A]">
                  Market News &amp; Insights
                </h2>
                <div className="text-xs text-[#64748B] font-medium">
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
                  className="groww-card p-5 flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1.5">
                    <div className="font-bold text-[#0F172A] text-sm sm:text-base group-hover:text-[#00D09C] transition-colors leading-snug">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
                      <span className="text-[#387ED1] font-semibold">{item.publisher}</span>
                      <span>•</span>
                      <span>Market Update</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#94A3B8] group-hover:text-[#00D09C] shrink-0 mt-1 transition-colors" />
                </a>
              ))}
            </div>
          </section>

          {/* Educational Quick Guide Card (1 Column) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F172A] flex items-center justify-center text-[#00D09C] shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl text-[#0F172A]">
                  Data Science Lab Insights
                </h2>
                <div className="text-xs text-[#64748B] font-medium">
                  How AI Evaluates Stocks
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="border-l-4 border-[#00D09C] pl-3.5 py-1">
                <div className="font-bold text-xs text-[#00D09C] uppercase tracking-wider">
                  AI Composite Score (0-100)
                </div>
                <p className="text-xs font-medium text-[#475569] mt-0.5 leading-relaxed">
                  Synthesizes 40% Technical trend + 35% News NLP Sentiment + 25% Fundamental valuation into a single score.
                </p>
              </div>

              <div className="border-l-4 border-[#387ED1] pl-3.5 py-1">
                <div className="font-bold text-xs text-[#387ED1] uppercase tracking-wider">
                  NLP Sentiment Polarity
                </div>
                <p className="text-xs font-medium text-[#475569] mt-0.5 leading-relaxed">
                  Extracts positive/negative keywords from financial headlines to compute market sentiment.
                </p>
              </div>

              <div className="border-l-4 border-[#F59E0B] pl-3.5 py-1">
                <div className="font-bold text-xs text-[#D97706] uppercase tracking-wider">
                  Paper Trading Risk Simulator
                </div>
                <p className="text-xs font-medium text-[#475569] mt-0.5 leading-relaxed">
                  Observe actual price movements on your virtual portfolio before investing real savings.
                </p>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] text-center">
                <p className="text-xs text-[#64748B] font-medium">
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
