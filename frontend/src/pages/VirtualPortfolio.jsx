import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import FlyingVidyaBot from "../components/FlyingVidyaBot";
import BuySellModal from "../components/BuySellModal";
import {
  Wallet,
  TrendingUp,
  Sparkles,
  Clock,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  Download,
  PieChart
} from "lucide-react";
import {
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function getChartDomain(points, keys) {
  const values = points.flatMap((point) => keys
    .map((key) => Number(point[key]))
    .filter((value) => Number.isFinite(value)));
  if (!values.length) return ["auto", "auto"];

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum;
  const padding = spread > 0 ? spread * 0.18 : Math.max(Math.abs(maximum) * 0.01, 1);
  return [Math.max(0, minimum - padding), maximum + padding];
}

function PortfolioHistoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-[#0F172A]/95 border border-white/[0.12] rounded-xl shadow-2xl p-3 text-xs text-white min-w-44 backdrop-blur-xl">
      <div className="font-bold text-[#94A3B8]">{new Date(label).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
      <div className="font-extrabold text-[#00D09C] mt-1">Portfolio Value: ₹{Number(point.portfolio_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      <div className="text-[#CBD5E1]">Daily Change: {point.daily_change >= 0 ? "+" : ""}₹{Number(point.daily_change ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      <div className="text-[#CBD5E1]">Daily Change: {point.daily_change_percent >= 0 ? "+" : ""}{Number(point.daily_change_percent ?? 0).toFixed(2)}%</div>
    </div>
  );
}

function StockHistoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  return (
    <div className="bg-[#0F172A]/95 border border-white/[0.12] rounded-xl shadow-2xl p-3 text-xs text-white backdrop-blur-xl">
      <div className="font-bold text-[#94A3B8]">{new Date(label).toLocaleDateString("en-IN")}</div>
      <div className="text-[#38BDF8] font-semibold">Position Value: ₹{Number(point.position_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      <div className={point.daily_change >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}>Daily Change: {point.daily_change >= 0 ? "+" : ""}₹{Number(point.daily_change).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
      <div className={point.overall_pnl >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}>Overall P&amp;L: {point.overall_pnl >= 0 ? "+" : ""}₹{Number(point.overall_pnl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
    </div>
  );
}

const STOCK_SECTOR_MAP = {
  "RELIANCE": "Energy & Oil",
  "RELIANCE.NS": "Energy & Oil",
  "TCS": "IT & Technology",
  "TCS.NS": "IT & Technology",
  "INFY": "IT & Technology",
  "INFY.NS": "IT & Technology",
  "WIPRO": "IT & Technology",
  "WIPRO.NS": "IT & Technology",
  "HDFCBANK": "Banking & Finance",
  "HDFCBANK.NS": "Banking & Finance",
  "ICICIBANK": "Banking & Finance",
  "ICICIBANK.NS": "Banking & Finance",
  "SBIN": "Banking & Finance",
  "SBIN.NS": "Banking & Finance",
  "BAJFINANCE": "Financial Services",
  "BAJFINANCE.NS": "Financial Services",
  "TATAMOTORS": "Automobile",
  "TATAMOTORS.NS": "Automobile",
  "MARUTI": "Automobile",
  "MARUTI.NS": "Automobile",
  "ITC": "FMCG",
  "ITC.NS": "FMCG",
  "SUNPHARMA": "Healthcare & Pharma",
  "SUNPHARMA.NS": "Healthcare & Pharma",
  "LT": "Infrastructure",
  "LT.NS": "Infrastructure",
  "BHARTIARTL": "Telecom",
  "BHARTIARTL.NS": "Telecom",
  "ZOMATO": "Consumer Tech",
  "ZOMATO.NS": "Consumer Tech"
};

export default function VirtualPortfolio() {
  const { authConfig } = useAuth();

  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buy/Sell modal state
  const [tradeModalStock, setTradeModalStock] = useState(null);
  const [tradeModalMode, setTradeModalMode] = useState("BUY");

  const loadPortfolioData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, holdRes, txnRes, walRes] = await Promise.all([
        axios.get(`${API}/portfolio/summary`, authConfig()),
        axios.get(`${API}/portfolio/holdings`, authConfig()),
        axios.get(`${API}/portfolio/transactions`, authConfig()),
        axios.get(`${API}/wallet/balance`, authConfig())
      ]);

      setSummary(sumRes.data);
      setHoldings(holdRes.data?.holdings || []);
      setTransactions(txnRes.data?.transactions || []);
      setWallet(walRes.data);
      window.dispatchEvent(new Event("stocksikh:wallet-updated"));

      const historyRes = await axios.get(`${API}/portfolio/history`, authConfig());
      setPortfolioHistory(historyRes.data?.history || []);
      setSelectedSymbol((current) => current || holdRes.data?.holdings?.[0]?.symbol || "");
    } catch (err) {
      console.error("Error loading portfolio data:", err);
    } finally {
      setLoading(false);
    }
  }, [authConfig]);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  useEffect(() => {
    if (!selectedSymbol) {
      setStockHistory([]);
      return;
    }

    const loadStockHistory = async () => {
      try {
        const res = await axios.get(`${API}/portfolio/history`, {
          ...authConfig(),
          params: { symbol: selectedSymbol }
        });
        setStockHistory(res.data?.history || []);
      } catch (err) {
        console.error("Error loading stock history:", err);
        setStockHistory([]);
      }
    };

    loadStockHistory();
  }, [selectedSymbol, authConfig]);

  const totalInvested = summary?.total_invested ?? 0;
  const currentHoldingsValue = summary?.current_holdings_value ?? 0;
  const totalPnl = summary?.total_pnl ?? 0;
  const realizedPnl = summary?.realized_pnl ?? 0;
  const unrealizedPnl = summary?.unrealized_pnl ?? 0;
  const totalPnlPercent = summary?.pnl_percent ?? 0;
  const dayPnl = summary?.day_pnl ?? 0;
  const dayPnlPercent = summary?.day_pnl_percent ?? 0;
  const startingCapital = summary?.starting_capital ?? 0;
  const cashAvailable = summary?.cash_balance ?? wallet?.virtual_cash ?? 0;
  const selectedHolding = holdings.find((holding) => holding.symbol === selectedSymbol);

  const displayPortfolioHistory = React.useMemo(() => {
    if (portfolioHistory && portfolioHistory.length >= 2) {
      return portfolioHistory;
    }
    const currentVal = summary?.net_worth ?? 10000;
    const startVal = summary?.capital_contributed || summary?.starting_capital || 10000;
    const today = new Date();
    const points = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const interpolated = i === 0 ? currentVal : (i === 4 ? startVal : Math.round(startVal + (currentVal - startVal) * ((4 - i) / 4)));
      points.push({
        date: d.toISOString().split("T")[0],
        portfolio_value: interpolated,
        daily_change: 0,
        daily_change_percent: 0
      });
    }
    return points;
  }, [portfolioHistory, summary]);

  const selectedCurrentValue = selectedHolding?.current_value ?? 0;
  const selectedOverallPnl = selectedHolding?.unrealized_pnl ?? 0;
  const selectedTodayPnl = selectedHolding?.day_pnl ?? 0;

  const displayStockHistory = React.useMemo(() => {
    if (stockHistory && stockHistory.length >= 2) {
      return stockHistory;
    }
    const currentVal = selectedCurrentValue || (selectedHolding?.current_value ?? 0);
    const startVal = selectedHolding?.total_invested ?? currentVal;
    const today = new Date();
    const points = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const interpolated = i === 0 ? currentVal : (i === 4 ? startVal : Math.round(startVal + (currentVal - startVal) * ((4 - i) / 4)));
      points.push({
        date: d.toISOString().split("T")[0],
        position_value: interpolated,
        invested_value: startVal,
        daily_change: 0,
        daily_change_percent: 0
      });
    }
    return points;
  }, [stockHistory, selectedCurrentValue, selectedHolding]);

  const portfolioDomain = getChartDomain(displayPortfolioHistory, ["portfolio_value"]);
  const stockDomain = getChartDomain(displayStockHistory, ["position_value", "invested_value"]);

  const isTotalZero = totalPnl === 0;
  const isTotalProfit = totalPnl > 0;
  const isDayProfit = dayPnl > 0;

  const portfolioContext = summary ? {
    page: "portfolio",
    portfolio_value: summary.net_worth ?? 0,
    cash_available: cashAvailable,
    invested_value: totalInvested,
    holdings_value: currentHoldingsValue,
    total_pnl: totalPnl,
    total_pnl_percent: totalPnlPercent,
    today_pnl: dayPnl,
    today_pnl_percent: dayPnlPercent,
    unrealized_pnl: unrealizedPnl,
    realized_pnl: realizedPnl,
    holdings: holdings.map((h) => ({
      symbol: h.symbol,
      company_name: h.company_name,
      quantity: h.quantity,
      avg_buy_price: h.avg_buy_price,
      current_price: h.current_price,
      current_value: h.current_value,
      total_invested: h.total_invested,
      pnl: h.unrealized_pnl,
      pnl_percent: h.pnl_percent,
      day_pnl: h.day_pnl,
      day_pnl_percent: h.day_change_percent
    }))
  } : null;

  const sectorAllocation = React.useMemo(() => {
    if (!holdings || holdings.length === 0 || currentHoldingsValue <= 0) return [];
    const sectorTotals = {};
    holdings.forEach((h) => {
      const sym = (h.symbol || "").toUpperCase();
      const cleanSym = sym.replace(".NS", "").replace(".BO", "");
      const sector = STOCK_SECTOR_MAP[sym] || STOCK_SECTOR_MAP[cleanSym] || "Other Equities";
      sectorTotals[sector] = (sectorTotals[sector] || 0) + (h.current_value || 0);
    });
    const colors = ["#00D09C", "#38BDF8", "#818CF8", "#F59E0B", "#EC4899", "#A78BFA", "#34D399"];
    return Object.entries(sectorTotals)
      .map(([name, value], idx) => ({
        name,
        value,
        percentage: Number(((value / currentHoldingsValue) * 100).toFixed(1)),
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings, currentHoldingsValue]);

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;
    const headers = [
      "Transaction ID",
      "Timestamp",
      "Symbol",
      "Company Name",
      "Trade Type",
      "Quantity",
      "Price Per Share (INR)",
      "Total Amount (INR)",
      "Realized PnL (INR)"
    ];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.timestamp || ""}"`,
      `"${t.symbol || ""}"`,
      `"${(t.company_name || "").replace(/"/g, '""')}"`,
      t.trade_type,
      t.quantity,
      t.price_per_share,
      t.total_amount,
      t.realized_pnl ?? 0
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "stocksikh_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-atmospheric text-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot context={portfolioContext} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#0B0F17] via-[#111827] to-[#0B0F17] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] text-xs font-extrabold uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(0,208,156,0.15)]">
              <Sparkles className="w-3.5 h-3.5" /> Live Paper Trading &amp; Portfolio Tracker
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
              Virtual Portfolio
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#94A3B8] mt-1">
              Track live valuations, real-time returns, and price movements for your simulated stock holdings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <button
              onClick={handleExportCSV}
              disabled={!transactions || transactions.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#111827] border border-white/[0.1] hover:bg-white/[0.06] disabled:opacity-50 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              title="Export your transaction history as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
              Export Transactions
            </button>

            <button
              onClick={loadPortfolioData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#111827] border border-white/[0.1] hover:bg-white/[0.06] text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#00D09C]" : ""}`} />
              Refresh Quotes
            </button>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#00D09C] hover:bg-[#00B386] text-[#07090E] text-xs font-extrabold shadow-[0_0_20px_rgba(0,208,156,0.3)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buy New Stocks
            </Link>
          </div>
        </div>

        {/* Portfolio summary */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="groww-card p-6 border-t-4 border-t-[#38BDF8] space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Starting Virtual Capital</span>
            <div className="font-heading font-black text-2xl text-white">₹{startingCapital.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-[#64748B]">The virtual money you started with for paper trading.</p>
          </div>
          <div className="groww-card p-6 border-t-4 border-t-[#00D09C] space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Current Portfolio Value</span><Layers className="w-4 h-4 text-[#00D09C]" /></div>
            <div className="font-heading font-black text-2xl text-white">₹{(summary?.net_worth ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-[#64748B]">The current total value of your cash and stocks.</p>
          </div>
          <div className="groww-card p-6 border-t-4 border-t-[#818CF8] space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Invested Capital</span><Wallet className="w-4 h-4 text-[#818CF8]" /></div>
            <div className="font-heading font-black text-2xl text-white">₹{totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-[#64748B]">The amount of money currently used to buy stocks.</p>
          </div>
          <div className="groww-card p-6 border-t-4 border-t-[#A78BFA] space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Holdings Value</span>
            <div className="font-heading font-black text-2xl text-white">₹{currentHoldingsValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-[#64748B]">What your currently held stocks are worth at live prices.</p>
          </div>
          <div className="groww-card p-6 border-t-4 border-t-[#38BDF8] space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Cash Available</span>
            <div className="font-heading font-black text-2xl text-white">₹{cashAvailable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-[#64748B]">Virtual cash available for your next paper trade.</p>
          </div>
          <div className={`groww-card p-6 border-t-4 ${isTotalProfit ? "border-t-[#00D09C]" : "border-t-[#EF4444]"} space-y-2`}>
            <div className="flex items-center justify-between"><span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Total P&amp;L</span>{isTotalProfit ? <ArrowUpRight className="w-4 h-4 text-[#00D09C]" /> : <ArrowDownRight className="w-4 h-4 text-[#EF4444]" />}</div>
            <div className={`font-heading font-black text-2xl ${isTotalProfit ? "text-[#00D09C]" : "text-[#EF4444]"}`}>{totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-[11px] text-[#64748B]">Your overall gain or loss since your trades were made.</p>
          </div>
          <div className={`groww-card p-6 border-t-4 ${isDayProfit ? "border-t-[#00D09C]" : "border-t-[#EF4444]"} space-y-2`}>
            <div className="flex items-center justify-between"><span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Today's Performance</span><Activity className="w-4 h-4 text-[#38BDF8]" /></div>
            <div className={`font-heading font-black text-2xl ${isDayProfit ? "text-[#00D09C]" : "text-[#EF4444]"}`}>{dayPnl >= 0 ? "+" : ""}₹{dayPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <div className="text-[11px] font-bold text-[#94A3B8]">Today's P&amp;L %: {dayPnlPercent >= 0 ? "+" : ""}{dayPnlPercent.toFixed(2)}%</div>
            <p className="text-[11px] text-[#64748B]">Change in your portfolio value compared with previous market close.</p>
          </div>
          <div className="groww-card p-6 border-t-4 border-t-[#F59E0B] space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">P&amp;L Breakdown</span>
            <div className="flex justify-between text-sm font-bold"><span className="text-[#94A3B8]">Unrealized P&amp;L</span><span className={unrealizedPnl >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}>{unrealizedPnl >= 0 ? "+" : ""}₹{unrealizedPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            <p className="text-[11px] text-[#64748B]">Gain or loss on stocks you still hold.</p>
            <div className="flex justify-between text-sm font-bold"><span className="text-[#94A3B8]">Realized P&amp;L</span><span className={realizedPnl >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}>{realizedPnl >= 0 ? "+" : ""}₹{realizedPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            <p className="text-[11px] text-[#64748B]">Gain or loss already locked in from sold stocks.</p>
          </div>
        </div>

        {/* Smart Financial Transparency & P&L Explainer Banner */}
        <div className="bg-gradient-to-r from-[#0B0F17] via-[#111827] to-[#0B0F17] rounded-3xl p-6 sm:p-7 border border-white/[0.1] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-sm text-white flex items-center gap-2">
                Live Portfolio Intelligence &amp; Return Breakdown
                <span className="w-2 h-2 rounded-full bg-[#00D09C] animate-pulse" />
              </div>
              <p className="text-xs text-[#94A3B8] font-medium leading-relaxed mt-1 max-w-3xl">
                {holdings.length === 0
                  ? `You have not placed any stock orders yet. Your ₹${cashAvailable.toLocaleString("en-IN", { minimumFractionDigits: 2 })} virtual cash is ready for paper trading. Starting capital is ₹${startingCapital.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`
                  : isTotalZero
                  ? `You invested ₹${totalInvested.toLocaleString("en-IN")} across ${holdings.length} stock(s). Since purchase price matches current price, your Net Position is Break-even (₹0.00 P&L). Today's stock price movement on the exchange is ${dayPnl >= 0 ? "+" : ""}₹${dayPnl.toLocaleString("en-IN")} (${dayPnlPercent >= 0 ? "+" : ""}${dayPnlPercent}% vs yesterday's closing price).`
                  : isTotalProfit
                  ? `Your portfolio is in Profit (+₹${totalPnl.toLocaleString("en-IN")}). Your holdings have appreciated +${totalPnlPercent.toFixed(2)}% above your average purchase cost.`
                  : `Your portfolio is at an Unrealized Loss (-₹${Math.abs(totalPnl).toLocaleString("en-IN")}). Your positions are currently ${totalPnlPercent.toFixed(2)}% below your average buy price.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={loadPortfolioData}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs border border-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Recalculate
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/quests" className="text-xs font-extrabold text-[#00D09C] hover:underline transition-colors flex items-center gap-1">
            <span>View Quests &amp; Rewards</span>
            <span>→</span>
          </Link>
        </div>

        {/* Investment Journey Chart */}
        <section className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 backdrop-blur-xl">
          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">Your Investment Journey</h2>
            <p className="text-xs text-[#94A3B8] font-medium mt-1">How your total portfolio value has changed over time.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Portfolio Value</div><div className="font-heading font-black text-xl text-white mt-1">₹{(summary?.net_worth ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div></div>
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Today's Change</div><div className={`font-heading font-black text-xl mt-1 ${dayPnl >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}`}>{dayPnl >= 0 ? "+" : ""}₹{dayPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })} <span className="text-xs">({dayPnlPercent >= 0 ? "+" : ""}{dayPnlPercent.toFixed(2)}%)</span></div></div>
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Overall P&amp;L</div><div className={`font-heading font-black text-xl mt-1 ${totalPnl >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}`}>{totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div></div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayPortfolioHistory} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                <defs><linearGradient id="portfolioValueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00D09C" stopOpacity={0.35} /><stop offset="100%" stopColor="#00D09C" stopOpacity={0.01} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis domain={portfolioDomain} tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} tick={{ fontSize: 11, fill: "#94A3B8" }} width={78} axisLine={false} />
                <Tooltip content={<PortfolioHistoryTooltip />} cursor={{ stroke: "#64748B", strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="portfolio_value" stroke="#00D09C" strokeWidth={3} fill="url(#portfolioValueFill)" dot={{ r: 3, fill: "#00D09C", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#00D09C", stroke: "#07090E", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Stock-wise Investment Performance */}
        <section className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-xl">
          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">Stock-wise Investment Performance</h2>
            <p className="text-xs text-[#94A3B8] font-medium mt-1">Overall returns are measured against each position's invested cost. Today's returns use the previous market close.</p>
          </div>

          {holdings.length === 0 ? (
            <div className="p-8 border border-dashed border-white/[0.1] rounded-2xl text-center text-sm text-[#94A3B8]">Your stock-wise performance will appear after your first holding is created.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[#94A3B8] font-bold uppercase tracking-wider">
                      <th className="pb-3 px-3">Stock</th>
                      <th className="pb-3 px-3 text-right">Invested</th>
                      <th className="pb-3 px-3 text-right">Current Value</th>
                      <th className="pb-3 px-3 text-right">Overall P&amp;L</th>
                      <th className="pb-3 px-3 text-right">Today's P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {holdings.map((holding) => (
                      <tr key={holding.symbol} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-3 font-extrabold text-white">{holding.symbol.replace(".NS", "")}</td>
                        <td className="py-3 px-3 text-right font-semibold text-[#94A3B8]">₹{holding.total_invested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-3 text-right font-semibold text-white">₹{holding.current_value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 px-3 text-right font-extrabold ${holding.unrealized_pnl >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}`}>{holding.unrealized_pnl >= 0 ? "+" : ""}₹{holding.unrealized_pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 px-3 text-right font-extrabold ${holding.day_pnl >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}`}>{holding.day_pnl >= 0 ? "+" : ""}₹{holding.day_pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-white/[0.08] pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-black text-lg text-white">{selectedSymbol.replace(".NS", "")} — Investment Performance</h3>
                    <p className="text-xs text-[#94A3B8] mt-1">Invested Amount: ₹{(selectedHolding?.total_invested ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} · Current Value: ₹{selectedCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })} · Overall P&amp;L: {selectedOverallPnl >= 0 ? "+" : ""}₹{selectedOverallPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })} · Today's P&amp;L: {selectedTodayPnl >= 0 ? "+" : ""}₹{selectedTodayPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)} className="px-3 py-2.5 rounded-xl border border-white/[0.1] bg-[#111827] text-sm font-bold text-white outline-none focus:border-[#00D09C]">
                    {holdings.map((holding) => <option key={holding.symbol} value={holding.symbol}>{holding.symbol.replace(".NS", "")}</option>)}
                  </select>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayStockHistory} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                      <defs><linearGradient id="selectedStockFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BDF8" stopOpacity={0.3} /><stop offset="100%" stopColor="#38BDF8" stopOpacity={0.02} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                      <YAxis domain={stockDomain} tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} tick={{ fontSize: 11, fill: "#94A3B8" }} width={78} axisLine={false} />
                      <Tooltip content={<StockHistoryTooltip />} />
                      <ReferenceLine y={selectedHolding?.total_invested ?? 0} stroke="#64748B" strokeDasharray="5 5" label={{ value: "Invested Amount", position: "insideTopRight", fill: "#94A3B8", fontSize: 11 }} />
                      <Area type="monotone" dataKey="position_value" stroke="#38BDF8" strokeWidth={3} fill="url(#selectedStockFill)" dot={{ r: 3, fill: "#38BDF8", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#38BDF8", stroke: "#07090E", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Portfolio Sector Allocation Breakdown */}
        <section className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-xl text-white">
                  Portfolio Sector Allocation
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Real concentration breakdown across Indian market sectors (excluding cash reserves).
                </p>
              </div>
            </div>
            {sectorAllocation.length > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/[0.06] text-[#94A3B8] self-start sm:self-auto">
                {sectorAllocation.length} Active {sectorAllocation.length === 1 ? "Sector" : "Sectors"}
              </span>
            )}
          </div>

          {sectorAllocation.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#94A3B8] italic border border-dashed border-white/[0.08] rounded-2xl">
              Sector allocation unavailable for current holdings. Execute a paper trade to view concentration weights.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Stacked Progress Bar */}
              <div className="h-4 w-full rounded-full bg-[#111827] overflow-hidden flex shadow-inner border border-white/[0.08]">
                {sectorAllocation.map((s) => (
                  <div
                    key={s.name}
                    style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                    title={`${s.name}: ${s.percentage}% (₹${s.value.toLocaleString("en-IN")})`}
                  />
                ))}
              </div>

              {/* Sector Grid Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
                {sectorAllocation.map((s) => (
                  <div
                    key={s.name}
                    className="p-3.5 rounded-2xl bg-[#111827]/80 border border-white/[0.06] hover:border-white/[0.15] transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-xs font-bold text-white truncate max-w-[120px]" title={s.name}>
                          {s.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-[#00D09C]">{s.percentage}%</span>
                    </div>
                    <div className="text-[11px] font-semibold text-[#94A3B8] pl-4.5">
                      ₹{s.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Active Holdings Table */}
        <section className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
                  Active Holdings ({holdings.length})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00D09C]/15 border border-[#00D09C]/30 text-[#00D09C] text-[11px] font-extrabold">
                  Live NSE
                </span>
              </div>
              <div className="text-xs text-[#94A3B8] font-medium mt-0.5">
                Real-time stock valuation updated directly from market data.
              </div>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00D09C] hover:bg-[#00B386] text-[#07090E] text-xs font-extrabold transition-all self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" /> Explore Markets
            </Link>
          </div>

          {holdings.length === 0 ? (
            <div className="p-12 border border-dashed border-white/[0.1] rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-black text-lg text-white">No stocks in your portfolio yet</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                You have ₹{cashAvailable.toLocaleString("en-IN", { minimumFractionDigits: 2 })} virtual cash ready. Select any Indian stock to execute your first paper trade!
              </p>
              <Link
                to="/dashboard"
                className="inline-block mt-3 px-6 py-2.5 rounded-full bg-[#00D09C] text-[#07090E] text-xs font-extrabold hover:bg-[#00B386] shadow-xs"
              >
                Explore &amp; Buy Stocks
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[#94A3B8] font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Instrument</th>
                    <th className="pb-3 px-3 text-right">Shares (Qty)</th>
                    <th className="pb-3 px-3 text-right">Avg. Buy Price</th>
                    <th className="pb-3 px-3 text-right">LTP (Live Price)</th>
                    <th className="pb-3 px-3 text-right">Current Value</th>
                    <th className="pb-3 px-3 text-right">Overall Returns (P&amp;L)</th>
                    <th className="pb-3 px-3 text-right">Today's Returns</th>
                    <th className="pb-3 px-3 text-center">Quick Trade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {holdings.map((h) => {
                    const isHoldDayProfit = (h.day_change_percent ?? 0) >= 0;
                    return (
                      <tr key={h.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 px-3">
                          <Link to={`/stock/${encodeURIComponent(h.symbol)}`} className="group">
                            <div className="font-bold text-sm text-white group-hover:text-[#00D09C] transition-colors">
                              {h.company_name}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] font-semibold uppercase">
                              {h.symbol.replace(".NS", "")} • NSE
                            </div>
                          </Link>
                        </td>
                        <td className="py-4 px-3 text-right font-extrabold text-white">{h.quantity}</td>
                        <td className="py-4 px-3 text-right font-semibold text-[#94A3B8]">
                          <div>₹{h.avg_buy_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                          <div className="text-[10px] text-[#64748B]">Cost: ₹{h.total_invested.toLocaleString("en-IN")}</div>
                        </td>
                        <td className="py-4 px-3 text-right">
                          <div className="font-black text-white">
                            ₹{h.current_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[10px] font-bold ${isHoldDayProfit ? "text-[#00D09C]" : "text-[#EF4444]"}`}>
                            {isHoldDayProfit ? "+" : ""}{h.day_change_percent ?? 0}%
                          </div>
                        </td>
                        <td className="py-4 px-3 text-right font-black text-white">
                          ₹{h.current_value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <div
                            className={`font-black text-sm ${
                              (h.unrealized_pnl ?? 0) === 0
                                ? "text-white"
                                : h.unrealized_pnl > 0
                                ? "text-[#00D09C]"
                                : "text-[#EF4444]"
                            }`}
                          >
                            {(h.unrealized_pnl ?? 0) === 0
                              ? "₹0.00"
                              : `${h.unrealized_pnl > 0 ? "+" : ""}₹${h.unrealized_pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                          </div>
                          <div className="mt-0.5">
                            {(h.unrealized_pnl ?? 0) === 0 ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-[#94A3B8]">
                                Break-even
                              </span>
                            ) : h.unrealized_pnl > 0 ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00D09C]/15 border border-[#00D09C]/30 text-[#00D09C]">
                                +{h.pnl_percent}% Gain
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                                {h.pnl_percent}% Loss
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-3 text-right">
                          <div
                            className={`font-bold text-xs ${
                              (h.day_pnl ?? 0) === 0
                                ? "text-[#94A3B8]"
                                : (h.day_pnl ?? 0) > 0
                                ? "text-[#00D09C]"
                                : "text-[#EF4444]"
                            }`}
                          >
                            {(h.day_pnl ?? 0) === 0
                              ? "₹0.00 (0.00%)"
                              : `${(h.day_pnl ?? 0) > 0 ? "+" : ""}₹${(h.day_pnl ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (${h.day_change_percent ?? 0}%)`}
                          </div>
                          <div className="text-[10px] text-[#64748B]">vs prev close</div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setTradeModalStock({
                                  symbol: h.symbol,
                                  name: h.company_name,
                                  price: h.current_price
                                });
                                setTradeModalMode("BUY");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#00D09C]/15 hover:bg-[#00D09C]/25 text-[#00D09C] border border-[#00D09C]/30 font-extrabold text-xs transition-colors cursor-pointer"
                            >
                              BUY
                            </button>
                            <button
                              onClick={() => {
                                setTradeModalStock({
                                  symbol: h.symbol,
                                  name: h.company_name,
                                  price: h.current_price
                                });
                                setTradeModalMode("SELL");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 font-extrabold text-xs transition-colors cursor-pointer"
                            >
                              SELL
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Order Execution History (Passbook) */}
        <section className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#94A3B8]" />
            <h2 className="font-heading font-black text-xl text-white">
              Order Execution History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-[#94A3B8] py-2">No completed orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[#94A3B8] font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Type</th>
                    <th className="pb-3 px-3">Instrument</th>
                    <th className="pb-3 px-3 text-right">Quantity</th>
                    <th className="pb-3 px-3 text-right">Execution Price</th>
                    <th className="pb-3 px-3 text-right">Total Amount</th>
                    <th className="pb-3 px-3 text-right">Realized P&amp;L</th>
                    <th className="pb-3 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.03]">
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase ${
                            t.trade_type === "BUY"
                              ? "bg-[#00D09C]/15 border border-[#00D09C]/30 text-[#00D09C]"
                              : "bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]"
                          }`}
                        >
                          {t.trade_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{t.company_name}</td>
                      <td className="py-3 px-3 text-right font-semibold text-white">{t.quantity}</td>
                      <td className="py-3 px-3 text-right font-semibold text-[#94A3B8]">₹{t.price_per_share}</td>
                      <td className="py-3 px-3 text-right font-black text-white">
                        ₹{t.total_amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        {t.trade_type === "SELL" ? (
                          <span className={t.realized_pnl >= 0 ? "text-[#00D09C]" : "text-[#EF4444]"}>
                            {t.realized_pnl >= 0 ? "+" : ""}₹{t.realized_pnl}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] text-[#94A3B8]">
                        {t.timestamp ? t.timestamp.slice(0, 16) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Buy/Sell Modal */}
      <BuySellModal
        stock={tradeModalStock}
        isOpen={Boolean(tradeModalStock)}
        initialMode={tradeModalMode}
        onClose={() => setTradeModalStock(null)}
        onTradeComplete={loadPortfolioData}
      />
    </div>
  );
}
