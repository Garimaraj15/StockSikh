
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { API, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ChatWidget from "../components/ChatWidget";
import { Button } from "../components/ui/button";
import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BookmarkPlus,
  BookmarkCheck,
  Info,
  ArrowLeft,
  Activity,
  Gauge,
  Sparkles,
} from "lucide-react";

const SIGNAL_THEME = {
  BUY: {
    bg: "bg-[#D1FAE5]",
    text: "text-[#065F46]",
    border: "border-[#A7F3D0]",
    accent: "#065F46",
  },
  SELL: {
    bg: "bg-[#FEE2E2]",
    text: "text-[#991B1B]",
    border: "border-[#FECACA]",
    accent: "#991B1B",
  },
  HOLD: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    border: "border-[#FDE68A]",
    accent: "#92400E",
  },
};

const PERIODS = [
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

export default function StockDetail() {
  const { symbol } = useParams();
  const decoded = decodeURIComponent(symbol);
  const { user, authHeaders } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("6mo");
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
  setLoading(true);

  axios
    .get(`${API}/stocks/${encodeURIComponent(decoded)}`)
    .then((r) => {
      console.log("API RESPONSE =", r.data);
      setData(r.data);
    })
    .catch((err) => {
      console.log(err);
      setData(null);
    })
    .finally(() => setLoading(false));

}, [decoded]);

  useEffect(() => {
    if (!user) return;
    axios
      .get(`${API}/watchlist`, { headers: authHeaders() })
      .then((r) => setInWatchlist((r.data.watchlist || []).some((s) => s.symbol === decoded)))
      .catch(() => {});
  }, [decoded, user]);

  const toggleWatchlist = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      if (inWatchlist) {
await axios.delete(
  `${API}/watchlist/remove?user_id=1&symbol=${decoded}`,
  {
    headers: authHeaders()
  }
);        setInWatchlist(false);
      } else {
await axios.post(
  `${API}/watchlist/add?user_id=1&symbol=${decoded}`,
  {},
  {
    headers: authHeaders()
  }
);        setInWatchlist(true);
      }
    } catch (e) {}
    setAdding(false);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10">
          <div className="h-12 bg-white border border-[#E5E3DB] rounded-2xl animate-pulse mb-6 w-1/2" />
          <div className="h-96 bg-white border border-[#E5E3DB] rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-center">
          <h2 className="font-heading text-2xl text-[#1A3626] mb-3">Stock not found</h2>
          <p className="text-[#52525B] mb-6">We couldn't find data for "{decoded}".</p>
          <Link to="/dashboard">
            <Button className="rounded-full bg-[#1A3626] hover:bg-[#264F38] text-white">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  
const chartData = data?.chart || [];

const firstPrice =
  chartData.length > 0
    ? chartData[0].close
    : 0;

const lastPrice =
  chartData.length > 0
    ? chartData[chartData.length - 1].close
    : 0;

const periodChange = lastPrice - firstPrice;

const periodPct =
  firstPrice > 0
    ? (periodChange / firstPrice) * 100
    : 0;

const positive = periodChange >= 0;

  const theme = SIGNAL_THEME[data.signal] || SIGNAL_THEME.HOLD;
  const rsi = data.rsi;
  const rsiState = rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral";
  const rsiColor = rsi > 70 ? "#991B1B" : rsi < 30 ? "#065F46" : "#92400E";

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <Navbar />
      <ChatWidget />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-6">
        {/* Back link */}
        <Link to="/dashboard" data-testid="back-to-dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#1A3626] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA] mb-1">
              {data.exchange || "NSE"} · {data.sector || "Equity"}
            </div>
            <h1 className="font-heading font-semibold text-3xl sm:text-4xl tracking-tight text-[#1A3626]">
              {decoded}
            </h1>
            <div className="text-sm text-[#A1A1AA] mt-1">{decoded.replace(".NS", "").replace(".BO", "")}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-baseline gap-3">
              <span className="font-heading font-semibold text-4xl text-[#1A3626]">
                ₹{(data.price || 0).toLocaleString("en-IN")}
              </span>
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  positive ? "text-[#065F46]" : "text-[#991B1B]"
                }`}
              >
                {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {positive ? "+" : ""}
                {periodChange.toFixed(2)} ({periodPct.toFixed(2)}%) · {period}
              </span>
            </div>
            <Button
              data-testid="watchlist-toggle-btn"
              onClick={toggleWatchlist}
              disabled={adding}
              variant="outline"
              className={`rounded-full border ${inWatchlist ? "bg-[#1A3626] text-white border-[#1A3626] hover:bg-[#264F38]" : "bg-white text-[#1A3626] border-[#E5E3DB] hover:bg-[#F3F2ED]"}`}
            >
              {inWatchlist ? (
                <><BookmarkCheck className="w-4 h-4 mr-2" /> In your watchlist</>
              ) : (
                <><BookmarkPlus className="w-4 h-4 mr-2" /> Add to watchlist</>
              )}
            </Button>
          </div>
        </header>

        {/* Period selector + price chart */}
        <section className="bg-white border border-[#E5E3DB] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg text-[#1A3626] flex items-center gap-2">
              <Activity className="w-4 h-4" /> Price chart with Moving Averages
            </h3>
            <div className="flex gap-1 bg-[#F3F2ED] rounded-full p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  data-testid={`period-${p.key}`}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    period === p.key
                      ? "bg-[#1A3626] text-white"
                      : "text-[#52525B] hover:text-[#1C1C1C]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        {data?.chart?.length > 0 && (
          <div className="h-80 -ml-2">
<ResponsiveContainer width={800} height={320}>              <AreaChart
  data={data?.chart || []}
  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A3626" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#1A3626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#F4F4F5" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={40} />
                <YAxis tickLine={false} axisLine={false} domain={["auto", "auto"]} width={60} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#1A3626"
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                  name="Price"
                />
                <Line type="monotone" dataKey="ma20" stroke="#D96C5B" strokeWidth={2} dot={false} name="MA 20" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
          <ChartLegend />
        </section>

        {/* Signal + Indicators grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Signal */}
          <div className={`lg:col-span-2 ${theme.bg} ${theme.border} border rounded-3xl p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] opacity-70 mb-1">
                  Today's signal
                </div>
                <div className={`font-heading font-semibold text-4xl ${theme.text}`}>
                  {data.signal}
                </div>
              </div>
              <Sparkles className={`w-6 h-6 ${theme.text}`} />
            </div>
<p className={`text-sm ${theme.text} font-medium mb-4`}>
  Signal generated using RSI and Moving Average analysis.
</p>            <div className="bg-white/70 rounded-2xl p-4 space-y-2.5">
              <div className="text-xs uppercase tracking-[0.1em] text-[#52525B] font-semibold mb-1">
                Why this signal?
              </div>
              <div className="flex gap-2 text-sm">
  <span>•</span>
  <span>Current RSI: {data.rsi}</span>
</div>

<div className="flex gap-2 text-sm">
  <span>•</span>
  <span>20 Day MA: ₹{data.ma20}</span>
</div>

<div className="flex gap-2 text-sm">
  <span>•</span>
  <span>Signal: {data.signal}</span>
</div>
            </div>
            <div className="mt-4 text-xs text-[#52525B] flex items-start gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>This is an educational signal based on technical indicators. Not financial advice — always do your own research.</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E3DB] rounded-3xl p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#A1A1AA] mb-3">
                <Gauge className="w-3.5 h-3.5" /> RSI (14)
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-heading font-semibold text-3xl text-[#1A3626]">{rsi}</span>
                <span className="text-sm font-medium" style={{ color: rsiColor }}>{rsiState}</span>
              </div>
              <div className="mt-3 h-2 bg-[#F3F2ED] rounded-full relative overflow-hidden">
                <div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, rsi))}%`,
                    background: `linear-gradient(90deg, #065F46 0%, #92400E 50%, #991B1B 100%)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#A1A1AA] mt-1">
                <span>0</span><span>30</span><span>70</span><span>100</span>
              </div>
              <p className="text-xs text-[#52525B] mt-3 leading-relaxed">
                Like a speedometer for the stock. Above 70 = too hot. Below 30 = too cold.
              </p>
            </div>

            <div className="bg-white border border-[#E5E3DB] rounded-3xl p-5">
              <div className="text-xs uppercase tracking-[0.15em] text-[#A1A1AA] mb-3">Moving Averages</div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#52525B] flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-[#D96C5B]" /> MA 20-day
                  </span>
                  <span className="font-medium text-[#1A3626]">₹{(data.ma20 || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#52525B] flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-[#3B82F6]" style={{ borderTop: "1px dashed" }} /> MA 50-day
                  </span>
<span className="font-medium text-[#1A3626]">
  {data.ma50
    ? `₹${data.ma50.toLocaleString("en-IN")}`
    : "-"}
</span>                </div>
              </div>
              <p className="text-xs text-[#52525B] mt-3 leading-relaxed">
                When the 20-day line crosses above the 50-day line, it's often a sign of strength.
              </p>
            </div>
          </div>
        </div>



        {/* About */}
        /*{data.summary && (
          <section className="bg-white border border-[#E5E3DB] rounded-3xl p-6">
            <h3 className="font-heading font-semibold text-lg text-[#1A3626] mb-3">About {decoded}</h3>
            <p className="text-sm text-[#52525B] leading-relaxed">{data.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              <Metric label="Market cap" value={data.market_cap ? `₹${(data.market_cap / 1e7).toFixed(0)} Cr` : "—"} />
              <Metric label="P/E ratio" value={data.pe_ratio ? data.pe_ratio.toFixed(2) : "—"} />
              
            </div>
          </section>
        )}*/
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.1em] text-[#A1A1AA] mb-1">{label}</div>
      <div className="font-heading font-semibold text-[#1A3626]">{value}</div>
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="flex gap-5 text-xs text-[#52525B] mt-3 ml-2 flex-wrap">
      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#1A3626]" /> Price</span>
      <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#D96C5B]" /> 20-day MA (short-term trend)</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label, rsi }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-[#E5E3DB] rounded-xl p-3 shadow-lg text-xs">
      <div className="font-medium text-[#1C1C1C] mb-1">{label}</div>
      {rsi ? (
        <div>RSI: <span className="font-semibold">{p.rsi ?? "—"}</span></div>
      ) : (
        <>
          <div>Price: <span className="font-semibold">₹{p.close}</span></div>
          {p.ma20 != null && <div>MA 20: <span className="font-semibold">₹{p.ma20}</span></div>}
          {p.ma50 != null && <div>MA 50: <span className="font-semibold">₹{p.ma50}</span></div>}
        </>
      )}
    </div>
  );
}
