import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { API, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import FlyingVidyaBot from "../components/FlyingVidyaBot";
import SentimentMeter from "../components/SentimentMeter";
import BuySellModal from "../components/BuySellModal";
import PreTradeShieldModal from "../components/PreTradeShieldModal";
import {
  TrendingUp,
  TrendingDown,
  BookmarkPlus,
  BookmarkCheck,
  ArrowLeft,
  Activity,
  Sparkles,
  ShieldCheck,
  HelpCircle
} from "lucide-react";

const PERIODS = [
  { key: "1d", label: "1D" },
  { key: "5d", label: "1W" },
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" }
];

export default function StockDetail() {
  const { symbol } = useParams();
  const decoded = decodeURIComponent(symbol);
  const { user, authConfig } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("6mo");
  const [chartPoints, setChartPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);

  // Trade & Safety Shield Modals
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [tradeMode, setTradeMode] = useState("BUY");

  // Load stock details
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/stocks/${encodeURIComponent(decoded)}`)
      .then((r) => {
        setData(r.data);
        if (r.data?.chart) {
          setChartPoints(r.data.chart);
        }
      })
      .catch((err) => {
        console.error("Error loading stock details:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [decoded]);

  // Load timeframe-specific chart
  useEffect(() => {
    if (!decoded) return;
    axios
      .get(`${API}/stocks/${encodeURIComponent(decoded)}/chart`, {
        params: { period }
      })
      .then((r) => {
        if (r.data?.chart && r.data.chart.length > 0) {
          setChartPoints(r.data.chart);
        }
      })
      .catch(() => {});
  }, [decoded, period]);

  // Check watchlist status
  useEffect(() => {
    if (!user) {
      setInWatchlist(false);
      return;
    }
    axios
      .get(`${API}/watchlist`, authConfig())
      .then((r) => {
        const list = r.data?.watchlist || r.data || [];
        setInWatchlist(list.some((s) => s.symbol === decoded));
      })
      .catch(() => {});
  }, [decoded, user, authConfig]);

  const toggleWatchlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      if (inWatchlist) {
        await axios.delete(`${API}/watchlist/remove?symbol=${encodeURIComponent(decoded)}`, authConfig());
        setInWatchlist(false);
      } else {
        await axios.post(`${API}/watchlist/add?symbol=${encodeURIComponent(decoded)}`, null, authConfig());
        setInWatchlist(true);
      }
    } catch (e) {
      console.error("Watchlist toggle failed:", e);
    } finally {
      setAdding(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-atmospheric text-[#F8FAFC]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="h-10 bg-[#111827]/60 border border-white/[0.08] rounded-xl animate-pulse w-1/3" />
          <div className="h-96 bg-[#111827]/60 border border-white/[0.08] rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-atmospheric text-[#F8FAFC]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-black text-2xl text-white mb-2">
            Stock Data Not Found
          </h2>
          <p className="text-[#94A3B8] mb-6">
            We couldn't retrieve market data for symbol "{decoded}".
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00D09C] hover:bg-[#00B386] text-[#07090E] font-extrabold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = (data.change ?? 0) >= 0;
  const rsi = data.rsi ?? 50;
  const rsiStatus = rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral";
  const rsiColor = rsi > 70 ? "#EF4444" : rsi < 30 ? "#00D09C" : "#F59E0B";

  const currentPrice = data.price ?? 0;
  const dayLow = data.day_low || currentPrice * 0.98;
  const dayHigh = data.day_high || currentPrice * 1.02;
  const dayPct = dayHigh !== dayLow ? Math.min(100, Math.max(0, ((currentPrice - dayLow) / (dayHigh - dayLow)) * 100)) : 50;

  const yearLow = data.fifty_two_week_low || currentPrice * 0.8;
  const yearHigh = data.fifty_two_week_high || currentPrice * 1.2;
  const yearPct = yearHigh !== yearLow ? Math.min(100, Math.max(0, ((currentPrice - yearLow) / (yearHigh - yearLow)) * 100)) : 50;

  const aiScore = data.ai_score;

  return (
    <div className="min-h-screen bg-atmospheric text-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot context={data} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link */}
        <Link
          to="/dashboard"
          data-testid="back-to-dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#00D09C] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#0B0F17] via-[#111827] to-[#0B0F17] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#00D09C] bg-[#00D09C]/10 border border-[#00D09C]/30 px-2.5 py-1 rounded">
                  {data.exchange || "NSE"}
                </span>
                <span className="text-xs font-semibold text-[#94A3B8] bg-white/[0.06] border border-white/[0.06] px-2.5 py-1 rounded">
                  {data.sector || "Equity"}
                </span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
                {data.name || decoded}
              </h1>
              <div className="text-sm font-semibold text-[#94A3B8] mt-1 uppercase">
                {decoded.replace(".NS", "").replace(".BO", "")}
              </div>
            </div>

            {/* Price & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="text-left sm:text-right">
                <div className="font-heading font-black text-3xl sm:text-4xl text-white">
                  ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div
                  className={`flex items-center sm:justify-end gap-1.5 text-sm font-bold mt-1 ${
                    isPositive ? "text-[#00D09C]" : "text-[#EF4444]"
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {isPositive ? "+" : ""}
                    {data.change?.toFixed(2)} ({isPositive ? "+" : ""}
                    {data.change_percent?.toFixed(2)}%)
                  </span>
                  <span className="text-xs font-medium text-[#94A3B8]">1D</span>
                </div>
              </div>

              {/* Action Buttons: BUY / SELL / WATCHLIST */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setShowShieldModal(true)}
                  className="px-6 py-3 rounded-full bg-[#00D09C] hover:bg-[#00B386] text-[#07090E] font-black text-sm shadow-[0_0_20px_rgba(0,208,156,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> BUY (AI SHIELD)
                </button>

                <button
                  onClick={() => {
                    setTradeMode("SELL");
                    setShowTradeModal(true);
                  }}
                  className="px-5 py-3 rounded-full bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 font-black text-sm transition-all cursor-pointer"
                >
                  SELL
                </button>

                <button
                  data-testid="watchlist-toggle-btn"
                  onClick={toggleWatchlist}
                  disabled={adding}
                  className={`p-3 rounded-full transition-all border cursor-pointer ${
                    inWatchlist
                      ? "bg-[#00D09C]/20 text-[#00D09C] border-[#00D09C]/40 shadow-[0_0_15px_rgba(0,208,156,0.2)]"
                      : "bg-[#111827] text-[#94A3B8] hover:text-white border-white/[0.1]"
                  }`}
                  title={inWatchlist ? "In Watchlist" : "Add to Watchlist"}
                >
                  {inWatchlist ? <BookmarkCheck className="w-5 h-5 text-[#00D09C]" /> : <BookmarkPlus className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Science AI Composite Health Score Banner */}
        {aiScore && (
          <div className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#07090E] border border-white/[0.1] text-white flex flex-col items-center justify-center shadow-lg shrink-0">
                  <span className="font-heading font-black text-2xl text-[#00D09C]">
                    {aiScore.composite_score}
                  </span>
                  <span className="text-[9px] text-[#94A3B8] font-bold uppercase">AI SCORE</span>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#00D09C]">
                    Multi-Factor Data Science Assessment
                  </div>
                  <h3 className="font-heading font-black text-xl text-white mt-0.5">
                    {aiScore.recommendation}
                  </h3>
                  <p className="text-xs font-medium text-[#CBD5E1] mt-1">
                    {aiScore.verdict}
                  </p>
                </div>
              </div>

              {/* Factors Breakdown */}
              {aiScore.breakdown && (
                <div className="grid grid-cols-3 gap-3 shrink-0">
                  <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-3 text-center">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Technicals</div>
                    <div className="font-black text-base text-white mt-0.5">
                      {aiScore.breakdown.technical_score}/100
                    </div>
                  </div>
                  <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-3 text-center">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Sentiment</div>
                    <div className="font-black text-base text-[#00D09C] mt-0.5">
                      {aiScore.breakdown.sentiment_score}/100
                    </div>
                  </div>
                  <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-3 text-center">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase">Fundamentals</div>
                    <div className="font-black text-base text-[#38BDF8] mt-0.5">
                      {aiScore.breakdown.fundamental_score}/100
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interactive Chart Section */}
        <section className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-white">
                  Price Movement &amp; Indicators
                </h3>
                <div className="text-xs text-[#94A3B8] font-medium">
                  Toggle Moving Averages to analyze short-term &amp; medium-term trends
                </div>
              </div>
            </div>

            {/* Period Switcher */}
            <div className="flex items-center gap-1 bg-[#111827] border border-white/[0.08] p-1 rounded-xl self-start sm:self-auto">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  data-testid={`period-${p.key}`}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    period === p.key
                      ? "bg-[#00D09C] text-[#07090E] shadow-[0_0_10px_rgba(0,208,156,0.3)]"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Technical Line Toggles */}
          <div className="flex items-center gap-4 text-xs font-semibold text-[#CBD5E1] pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMA20}
                onChange={(e) => setShowMA20(e.target.checked)}
                className="rounded accent-[#38BDF8] w-4 h-4"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#38BDF8]"></span> 20-Day MA (Short-term)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMA50}
                onChange={(e) => setShowMA50(e.target.checked)}
                className="rounded accent-[#EF4444] w-4 h-4"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#EF4444]"></span> 50-Day MA (Medium-term)
              </span>
            </label>
          </div>

          {/* Area Chart Container */}
          {chartPoints.length > 0 ? (
            <div className="w-full h-80 pt-4">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D09C" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00D09C" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={40}
                    tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                    tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip content={<GrowwChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#00D09C"
                    strokeWidth={2.5}
                    fill="url(#growwGrad)"
                    name="Price"
                  />
                  {showMA20 && (
                    <Line
                      type="monotone"
                      dataKey="ma20"
                      stroke="#38BDF8"
                      strokeWidth={1.8}
                      dot={false}
                      name="MA 20"
                    />
                  )}
                  {showMA50 && (
                    <Line
                      type="monotone"
                      dataKey="ma50"
                      stroke="#EF4444"
                      strokeWidth={1.8}
                      dot={false}
                      strokeDasharray="4 4"
                      name="MA 50"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm font-semibold text-[#94A3B8]">
              Loading historical chart points...
            </div>
          )}
        </section>

        {/* NLP Sentiment & Performance Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          <SentimentMeter sentiment={data.sentiment} />

          {/* Performance Range Bars */}
          <div className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-xl space-y-6 flex flex-col justify-between backdrop-blur-xl">
            <h4 className="font-heading font-black text-base text-white">
              Daily &amp; 52-Week Price Range
            </h4>

            {/* Today's Low / High */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#94A3B8]">
                <span>Today's Low: ₹{dayLow.toLocaleString("en-IN")}</span>
                <span>Today's High: ₹{dayHigh.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-2.5 bg-[#111827] rounded-full relative overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-[#00D09C] to-[#38BDF8] rounded-full"
                  style={{ width: `${dayPct}%` }}
                />
              </div>
              <div className="text-right text-[11px] font-bold text-white">
                Current: ₹{currentPrice.toLocaleString("en-IN")}
              </div>
            </div>

            {/* 52-Week Low / High */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#94A3B8]">
                <span>52W Low: ₹{yearLow.toLocaleString("en-IN")}</span>
                <span>52W High: ₹{yearHigh.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-2.5 bg-[#111827] rounded-full relative overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#00D09C] rounded-full"
                  style={{ width: `${yearPct}%` }}
                />
              </div>
              <div className="text-right text-[11px] font-bold text-white">
                Current: ₹{currentPrice.toLocaleString("en-IN")}
              </div>
            </div>

            {/* Layman Price Range Meaning Box */}
            <div className="p-3.5 rounded-2xl bg-[#111827] border border-white/[0.06] text-[11px] text-[#CBD5E1] leading-relaxed">
              <strong className="text-white block mb-0.5">💡 Simple Meaning (Kya represent karta hai?):</strong>
              <b>Today's Range</b> dikhata hai ki aaj stock ₹{dayLow.toLocaleString("en-IN")} se ₹{dayHigh.toLocaleString("en-IN")} ke beech ghuma.{" "}
              <b>52-Week Range</b> dikhata hai ki pichle 1 saal me sabse sasta ₹{yearLow.toLocaleString("en-IN")} aur sabse mehenga ₹{yearHigh.toLocaleString("en-IN")} gaya tha.
            </div>
          </div>
        </div>

        {/* Signals & Key Fundamentals Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Signal Box */}
          <div className="lg:col-span-2 bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Technical Signal Breakdown
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className="font-heading font-black text-3xl text-white">
                    {data.signal}
                  </h3>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      data.signal === "BUY"
                        ? "bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30"
                        : data.signal === "SELL"
                        ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                        : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                    }`}
                  >
                    RSI &amp; Moving Average Model
                  </span>
                </div>
              </div>
              <Sparkles className="w-6 h-6 text-[#00D09C]" />
            </div>

            <p className="text-sm font-medium text-[#CBD5E1] leading-relaxed">
              {data.signal === "BUY"
                ? `${data.name} is trading above its 20-day moving average (₹${data.ma20}) with RSI at ${rsi}, showing sustained buyer demand.`
                : data.signal === "SELL"
                ? `${data.name} is below its short-term moving average line (₹${data.ma20}) indicating that sellers are temporarily in control.`
                : `${data.name} is currently consolidating between technical support levels.`}
            </p>

            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
                <div className="text-xs font-semibold text-[#94A3B8]">RSI (14-Day)</div>
                <div className="font-heading font-black text-xl text-white mt-1">{rsi}</div>
                <div className="text-[11px] font-bold mt-0.5" style={{ color: rsiColor }}>
                  {rsiStatus}
                </div>
                <div className="text-[10px] text-[#64748B] mt-1">Speed of buying/selling</div>
              </div>

              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
                <div className="text-xs font-semibold text-[#94A3B8]">20-Day MA</div>
                <div className="font-heading font-black text-xl text-white mt-1">
                  ₹{data.ma20 ? data.ma20.toLocaleString("en-IN") : "—"}
                </div>
                <div className="text-[11px] font-semibold text-[#94A3B8] mt-0.5">Short-term base</div>
                <div className="text-[10px] text-[#64748B] mt-1">1-month average price</div>
              </div>

              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
                <div className="text-xs font-semibold text-[#94A3B8]">50-Day MA</div>
                <div className="font-heading font-black text-xl text-white mt-1">
                  ₹{data.ma50 ? data.ma50.toLocaleString("en-IN") : "—"}
                </div>
                <div className="text-[11px] font-semibold text-[#94A3B8] mt-0.5">Medium-term base</div>
                <div className="text-[10px] text-[#64748B] mt-1">Quarterly trend support</div>
              </div>
            </div>
          </div>

          {/* Fundamentals Metric Card */}
          <div className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 backdrop-blur-xl">
            <h3 className="font-heading font-black text-xl text-white">
              Key Fundamentals
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06] text-sm">
                <div>
                  <div className="font-semibold text-white">Market Cap</div>
                  <div className="text-[10px] text-[#64748B]">Company ki total market value</div>
                </div>
                <span className="font-black text-white">
                  {data.market_cap ? `₹${(data.market_cap / 1e7).toFixed(0)} Cr` : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06] text-sm">
                <div>
                  <div className="font-semibold text-white">P/E Ratio</div>
                  <div className="text-[10px] text-[#64748B]">Valuation (₹1 kamai ke liye price)</div>
                </div>
                <span className="font-black text-white">{data.pe_ratio || "—"}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06] text-sm">
                <div>
                  <div className="font-semibold text-white">52W High</div>
                  <div className="text-[10px] text-[#64748B]">1 saal ka sabse highest price</div>
                </div>
                <span className="font-black text-white">
                  ₹{data.fifty_two_week_high ? data.fifty_two_week_high.toLocaleString("en-IN") : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06] text-sm">
                <div>
                  <div className="font-semibold text-white">52W Low</div>
                  <div className="text-[10px] text-[#64748B]">1 saal ka sabse sasta price</div>
                </div>
                <span className="font-black text-white">
                  ₹{data.fifty_two_week_low ? data.fifty_two_week_low.toLocaleString("en-IN") : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div>
                  <div className="font-semibold text-white">Volume</div>
                  <div className="text-[10px] text-[#64748B]">Aaj kitne shares khareede/beche gaye</div>
                </div>
                <span className="font-black text-white">
                  {data.volume ? data.volume.toLocaleString("en-IN") : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* About Company */}
        {data.summary && (
          <section className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-3 backdrop-blur-xl">
            <h3 className="font-heading font-black text-xl text-white">
              About {data.name}
            </h3>
            <p className="text-sm font-medium text-[#CBD5E1] leading-relaxed">
              {data.summary}
            </p>
          </section>
        )}
      </main>

      {/* Pre-Trade 4-Point AI Safety Shield Modal */}
      <PreTradeShieldModal
        isOpen={showShieldModal}
        onClose={() => setShowShieldModal(false)}
        symbol={decoded}
        stockName={data?.name || decoded}
        onProceedToTrade={(shieldData) => {
          setTradeMode("BUY");
          setShowTradeModal(true);
        }}
      />

      {/* 3D Paper Trade Modal */}
      <BuySellModal
        stock={data}
        isOpen={showTradeModal}
        initialMode={tradeMode}
        onClose={() => setShowTradeModal(false)}
        onTradeComplete={() => {}}
      />
    </div>
  );
}

function GrowwChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="bg-[#0F172A]/95 text-white rounded-xl p-3 shadow-2xl text-xs space-y-1 border border-white/[0.12] backdrop-blur-xl">
      <div className="font-bold text-[#94A3B8]">{label}</div>
      <div className="font-black text-[#00D09C] text-sm">Price: ₹{p.close}</div>
      {p.ma20 != null && <div className="text-[#38BDF8]">20-Day MA: ₹{p.ma20}</div>}
      {p.ma50 != null && <div className="text-[#EF4444]">50-Day MA: ₹{p.ma50}</div>}
    </div>
  );
}
