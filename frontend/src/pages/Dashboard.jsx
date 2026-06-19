
import axios from "axios";
import { API, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import React, { useEffect, useState } from "react";
import StockCard from "../components/StockCard";
import StockSearch from "../components/StockSearch";
import ChatWidget from "../components/ChatWidget";
import { Link } from "react-router-dom";
import { Bookmark, Plus, TrendingUp, BookOpen, Sparkles, X } from "lucide-react";

export default function Dashboard() {
  const { user, authHeaders } = useAuth();
  const [presets, setPresets] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const loadAll = async () => {
  setLoading(true);

  try {
    const userId = 1; // abhi temporary

    const [pres, wl, newsRes] = await Promise.all([
  axios.get(`${API}/stocks/preset`),

  axios.get(
    `${API}/watchlist/details?user_id=${userId}`
  ),

  axios.get(`${API}/stocks/news`)
]);

    setPresets(pres.data.stocks || []);

    setWatchlist(wl.data || []);
    setNews(newsRes.data.news || []);
  }
  catch (e) {
    console.log(e);
  }
  finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadAll();
  }, []);

  const removeFromWatchlist = async (symbol) => {
    try {
      await axios.delete(`${API}/watchlist/${encodeURIComponent(symbol)}`, { headers: authHeaders() });
      setWatchlist((w) => w.filter((s) => s.symbol !== symbol));
    } catch (e) {}
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Navbar />
      <ChatWidget />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 space-y-10">
        {/* Greeting */}
        <header data-testid="dashboard-greeting">
          <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA] mb-2">
            Your learning dashboard
          </div>
          <h1 className="font-heading font-semibold text-3xl sm:text-4xl tracking-tight text-[#1A3626]">
            Namaste, {firstName} 👋
          </h1>
          <p className="text-[#52525B] mt-2 max-w-2xl">
            Pick any stock, read the signals in plain English, and ask Vidya if you get stuck.
          </p>
        </header>

        {/* Search */}
        <div className="bg-white border border-[#E5E3DB] rounded-3xl p-6">
          <StockSearch size="lg" />
        </div>

        {/* Watchlist */}
        <section data-testid="watchlist-section">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A3626] flex items-center justify-center">
                <Bookmark className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA]">Your watchlist</div>
                <h2 className="font-heading font-semibold text-xl sm:text-2xl text-[#1A3626]">
                  {watchlist.length === 0 ? "Empty for now" : `${watchlist.length} stocks tracked`}
                </h2>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-white border border-[#E5E3DB] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="bg-[#F3F2ED] border border-dashed border-[#D6D2C4] rounded-3xl p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E3DB] flex items-center justify-center mx-auto mb-4">
                <Plus className="w-5 h-5 text-[#1A3626]" />
              </div>
              <h3 className="font-heading font-semibold text-[#1A3626] mb-1">Build your watchlist</h3>
              <p className="text-sm text-[#52525B] max-w-md mx-auto">
                Click any stock below or search above, then tap "Add to Watchlist" on its page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {watchlist.map((s, i) => (
                <div key={s.symbol} className="relative group">
                  <button
                    data-testid={`watchlist-remove-${s.symbol}`}
                    onClick={(e) => { e.preventDefault(); removeFromWatchlist(s.symbol); }}
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white border border-[#E5E3DB] flex items-center justify-center text-[#A1A1AA] hover:text-[#991B1B] hover:border-[#FECACA] opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <StockCard stock={s} index={i} />
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
  <div className="flex items-center gap-3 mb-5">
    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
      📰
    </div>

    <div>
      <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA]">
        Live Market Updates
      </div>

      <h2 className="font-heading font-semibold text-xl sm:text-2xl text-[#1A3626]">
        Market News
      </h2>
    </div>
  </div>

  <div className="grid gap-4">
    {news.map((item, index) => (
      <a
        key={index}
        href={item.link}
        target="_blank"
        rel="noreferrer"
        className="bg-white border border-[#E5E3DB] rounded-2xl p-4 hover:shadow-md transition"
      >
        <div className="font-medium text-[#1A3626]">
          {item.title}
        </div>

        <div className="text-sm text-[#A1A1AA] mt-2">
          {item.publisher}
        </div>
      </a>
    ))}
  </div>
</section>
        {/* Top NSE */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D96C5B] flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA]">Live NSE</div>
                <h2 className="font-heading font-semibold text-xl sm:text-2xl text-[#1A3626]">
                  Popular Indian stocks
                </h2>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-32 bg-white border border-[#E5E3DB] rounded-2xl animate-pulse" />
                ))
              : presets.map((s, i) => <StockCard key={s.symbol} stock={s} index={i} />)}
          </div>
        </section>

        {/* Quick-Learn */}
        <section className="bg-white border border-[#E5E3DB] rounded-3xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F3F2ED] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-[#1A3626]" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA] mb-1">
                Quick lesson
              </div>
              <h3 className="font-heading font-semibold text-xl text-[#1A3626] mb-2">
                BUY · SELL · HOLD — what do they really mean?
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-[#D1FAE5] border border-[#A7F3D0] rounded-2xl p-4">
                  <div className="text-[#065F46] font-heading font-semibold mb-1">BUY</div>
                  <p className="text-sm text-[#065F46]/80 leading-relaxed">
                    Indicators are aligned upward — the market may be entering an uptrend.
                  </p>
                </div>
                <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-4">
                  <div className="text-[#92400E] font-heading font-semibold mb-1">HOLD</div>
                  <p className="text-sm text-[#92400E]/80 leading-relaxed">
                    Signals are mixed. Stay patient — wait for clearer direction.
                  </p>
                </div>
                <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-2xl p-4">
                  <div className="text-[#991B1B] font-heading font-semibold mb-1">SELL</div>
                  <p className="text-sm text-[#991B1B]/80 leading-relaxed">
                    Momentum is fading. Caution is suggested by the indicators.
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-4 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Need more detail? Ask Vidya — bottom-right corner.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
