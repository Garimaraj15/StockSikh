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
  Gift,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers
} from "lucide-react";

export default function VirtualPortfolio() {
  const { user } = useAuth();
  const userId = user?.id || 1;

  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Task claim modal state
  const [activeTask, setActiveTask] = useState(null);
  const [taskInput, setTaskInput] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);

  // Buy/Sell modal state
  const [tradeModalStock, setTradeModalStock] = useState(null);
  const [tradeModalMode, setTradeModalMode] = useState("BUY");

  const loadPortfolioData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, holdRes, txnRes, walRes] = await Promise.all([
        axios.get(`${API}/portfolio/summary?user_id=${userId}`),
        axios.get(`${API}/portfolio/holdings?user_id=${userId}`),
        axios.get(`${API}/portfolio/transactions?user_id=${userId}`),
        axios.get(`${API}/wallet/balance?user_id=${userId}`)
      ]);

      setSummary(sumRes.data);
      setHoldings(holdRes.data?.holdings || []);
      setTransactions(txnRes.data?.transactions || []);
      setWallet(walRes.data);
    } catch (err) {
      console.error("Error loading portfolio data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  const claimReward = async (task) => {
    if (task.id === "phone_bonus" || task.id === "dob_bonus") {
      setActiveTask(task);
      setTaskInput("");
      return;
    }

    setClaimLoading(true);
    try {
      await axios.post(`${API}/wallet/claim-task`, {
        user_id: userId,
        task_id: task.id
      });
      await loadPortfolioData();
    } catch (e) {
      console.error("Claim error:", e);
    } finally {
      setClaimLoading(false);
    }
  };

  const submitTaskModal = async (e) => {
    e.preventDefault();
    if (!taskInput.trim() || !activeTask) return;

    setClaimLoading(true);
    try {
      const payload = {
        user_id: userId,
        task_id: activeTask.id
      };
      if (activeTask.id === "phone_bonus") payload.phone = taskInput;
      if (activeTask.id === "dob_bonus") payload.dob = taskInput;

      await axios.post(`${API}/wallet/claim-task`, payload);
      setActiveTask(null);
      await loadPortfolioData();
    } catch (e) {
      console.error("Task modal error:", e);
    } finally {
      setClaimLoading(false);
    }
  };

  const totalInvested = summary?.total_invested ?? 0;
  const currentHoldingsValue = summary?.current_holdings_value ?? 0;
  const totalPnl = summary?.unrealized_pnl ?? 0;
  const totalPnlPercent = summary?.pnl_percent ?? 0;
  const dayPnl = summary?.day_pnl ?? 0;
  const dayPnlPercent = summary?.day_pnl_percent ?? 0;

  const isTotalZero = totalPnl === 0;
  const isTotalProfit = totalPnl > 0;
  const isDayZero = dayPnl === 0;
  const isDayProfit = dayPnl > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Banner (AmazingUI Aesthetic) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8FAF4] text-[#00D09C] text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Live Paper Trading &amp; Portfolio Tracker
            </div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
              Virtual Portfolio
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">
              Track live valuations, real-time returns, and price movements for your simulated stock holdings.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={loadPortfolioData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-bold text-[#0F172A] shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Quotes
            </button>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 text-[#00D09C]" /> Buy New Stocks
            </Link>
          </div>
        </div>

        {/* Groww-style Real-time Portfolio Overview Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Portfolio Value */}
          <div className="groww-card p-6 border-t-4 border-t-[#00D09C] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Total Portfolio Value</span>
              <Layers className="w-4 h-4 text-[#00D09C]" />
            </div>
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
              ₹{(summary?.net_worth ?? 10000).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
              <span>Holdings: ₹{currentHoldingsValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              <span>• Cash: ₹{(wallet?.virtual_cash ?? 10000).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Invested Capital */}
          <div className="groww-card p-6 border-t-4 border-t-[#64748B] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Invested Capital</span>
              <Wallet className="w-4 h-4 text-[#64748B]" />
            </div>
            <div className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
              ₹{totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-[#64748B] font-medium">
              Deployed across {summary?.holdings_count ?? 0} active positions
            </div>
          </div>

          {/* Total Returns (Overall P&L Since Purchase) */}
          <div
            className={`groww-card p-6 border-t-4 ${
              isTotalZero
                ? "border-t-[#64748B]"
                : isTotalProfit
                ? "border-t-[#00D09C]"
                : "border-t-[#EF4444]"
            } space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Total Returns (Net P&amp;L)</span>
              {isTotalZero ? (
                <Activity className="w-4 h-4 text-[#64748B]" />
              ) : isTotalProfit ? (
                <ArrowUpRight className="w-4 h-4 text-[#00D09C]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-[#EF4444]" />
              )}
            </div>
            <div
              className={`font-heading font-extrabold text-2xl sm:text-3xl ${
                isTotalZero
                  ? "text-[#0F172A]"
                  : isTotalProfit
                  ? "text-[#00D09C]"
                  : "text-[#EF4444]"
              }`}
            >
              {isTotalZero ? "₹0.00" : `${isTotalProfit ? "+" : ""}₹${totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
            </div>
            <div>
              {isTotalZero ? (
                <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B]">
                  0.00% Break-even (No Net Change)
                </span>
              ) : isTotalProfit ? (
                <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#E8FAF4] text-[#00D09C]">
                  +{totalPnlPercent.toFixed(2)}% Overall Gain
                </span>
              ) : (
                <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#FDF2F0] text-[#EF4444]">
                  {totalPnlPercent.toFixed(2)}% Overall Loss
                </span>
              )}
            </div>
          </div>

          {/* 1-Day Market Returns */}
          <div
            className={`groww-card p-6 border-t-4 ${
              isDayZero
                ? "border-t-[#64748B]"
                : isDayProfit
                ? "border-t-[#00D09C]"
                : "border-t-[#EF4444]"
            } space-y-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#387ED1] animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">1-Day Market Trend</span>
              </div>
              <Activity className="w-4 h-4 text-[#387ED1]" />
            </div>
            <div
              className={`font-heading font-extrabold text-2xl sm:text-3xl ${
                isDayZero
                  ? "text-[#0F172A]"
                  : isDayProfit
                  ? "text-[#00D09C]"
                  : "text-[#EF4444]"
              }`}
            >
              {isDayZero ? "₹0.00" : `${isDayProfit ? "+" : ""}₹${dayPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
            </div>
            <div>
              {isDayZero ? (
                <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#64748B]">
                  0.00% Today
                </span>
              ) : isDayProfit ? (
                <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#E8FAF4] text-[#00D09C]">
                  +{dayPnlPercent.toFixed(2)}% Today (vs Prev Close)
                </span>
              ) : (
                <span className="inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#FDF2F0] text-[#EF4444]">
                  {dayPnlPercent.toFixed(2)}% Today (vs Prev Close)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Smart Financial Transparency & P&L Explainer Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-6 sm:p-7 border border-[#334155] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00D09C]/20 border border-[#00D09C]/40 text-[#00D09C] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                Live Portfolio Intelligence &amp; Return Breakdown
                <span className="w-2 h-2 rounded-full bg-[#00D09C] animate-pulse" />
              </div>
              <p className="text-xs text-[#94A3B8] font-medium leading-relaxed mt-1 max-w-3xl">
                {holdings.length === 0
                  ? "You have not placed any stock orders yet. Your full ₹10,000 virtual balance is ready for paper trading."
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
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Recalculate
            </button>
          </div>
        </div>

        {/* Task Rewards Center (Clean English) */}
        <section className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8FAF4] text-[#00D09C] flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl text-[#0F172A]">
                  Task Rewards Center
                </h2>
                <div className="text-xs text-[#64748B] font-medium">
                  Complete onboarding milestones to claim free virtual trading capital!
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
              <Sparkles className="w-3.5 h-3.5" /> Virtual Currency
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {(wallet?.tasks || []).map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  task.is_claimed
                    ? "bg-[#F8FAFC] border-[#E2E8F0] opacity-80"
                    : "bg-white border-[#CBD5E1] shadow-xs hover:border-[#00D09C]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-[#0F172A] text-sm">{task.title}</h4>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-[#E8FAF4] text-[#00D09C]">
                    +₹{task.reward_cash}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed mb-3">
                  {task.description}
                </p>

                {task.is_claimed ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#00D09C]">
                    <CheckCircle2 className="w-4 h-4" /> Claimed
                  </div>
                ) : (
                  <button
                    onClick={() => claimReward(task)}
                    disabled={claimLoading}
                    className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Claim Reward (+₹{task.reward_cash})
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Active Holdings Table (Live Yahoo Finance Real-time Tracking) */}
        <section className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F172A]">
                  Active Holdings ({holdings.length})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8FAF4] text-[#00D09C] text-[11px] font-extrabold">
                  Live NSE
                </span>
              </div>
              <div className="text-xs text-[#64748B] font-medium mt-0.5">
                Real-time stock valuation updated directly from market data.
              </div>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00D09C] hover:bg-[#00B386] text-[#0F172A] text-xs font-extrabold transition-all self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" /> Explore Markets
            </Link>
          </div>

          {holdings.length === 0 ? (
            <div className="p-12 border border-dashed border-[#CBD5E1] rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8FAF4] text-[#00D09C] flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-[#0F172A]">No stocks in your portfolio yet</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                You have ₹{(wallet?.virtual_cash ?? 10000).toLocaleString("en-IN")} virtual cash ready. Select any Indian stock to execute your first paper trade!
              </p>
              <Link
                to="/dashboard"
                className="inline-block mt-3 px-6 py-2.5 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-[#1E293B] shadow-xs"
              >
                Explore &amp; Buy Stocks
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[#64748B] font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Instrument</th>
                    <th className="pb-3 px-3 text-right">Shares (Qty)</th>
                    <th className="pb-3 px-3 text-right">Avg. Buy Price</th>
                    <th className="pb-3 px-3 text-right">LTP (Live Price)</th>
                    <th className="pb-3 px-3 text-right">Current Value</th>
                    <th className="pb-3 px-3 text-right">Total Returns (P&amp;L)</th>
                    <th className="pb-3 px-3 text-right">1-Day Returns</th>
                    <th className="pb-3 px-3 text-center">Quick Trade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {holdings.map((h) => {
                    const isHoldDayProfit = (h.day_change_percent ?? 0) >= 0;
                    return (
                      <tr key={h.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-4 px-3">
                          <Link to={`/stock/${encodeURIComponent(h.symbol)}`} className="group">
                            <div className="font-extrabold text-sm text-[#0F172A] group-hover:text-[#00D09C] transition-colors">
                              {h.company_name}
                            </div>
                            <div className="text-[11px] text-[#64748B] font-semibold uppercase">
                              {h.symbol.replace(".NS", "")} • NSE
                            </div>
                          </Link>
                        </td>
                        <td className="py-4 px-3 text-right font-extrabold text-[#0F172A]">{h.quantity}</td>
                        <td className="py-4 px-3 text-right font-semibold text-[#64748B]">
                          <div>₹{h.avg_buy_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                          <div className="text-[10px] text-[#94A3B8]">Cost: ₹{h.total_invested.toLocaleString("en-IN")}</div>
                        </td>
                        <td className="py-4 px-3 text-right">
                          <div className="font-extrabold text-[#0F172A]">
                            ₹{h.current_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[10px] font-bold ${isHoldDayProfit ? "text-[#00D09C]" : "text-[#EF4444]"}`}>
                            {isHoldDayProfit ? "+" : ""}{h.day_change_percent ?? 0}%
                          </div>
                        </td>
                        <td className="py-4 px-3 text-right font-extrabold text-[#0F172A]">
                          ₹{h.current_value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <div
                            className={`font-extrabold text-sm ${
                              (h.unrealized_pnl ?? 0) === 0
                                ? "text-[#0F172A]"
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
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                                Break-even
                              </span>
                            ) : h.unrealized_pnl > 0 ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E8FAF4] text-[#00D09C]">
                                +{h.pnl_percent}% Gain
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FDF2F0] text-[#EF4444]">
                                {h.pnl_percent}% Loss
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-3 text-right">
                          <div
                            className={`font-bold text-xs ${
                              (h.day_pnl ?? 0) === 0
                                ? "text-[#64748B]"
                                : (h.day_pnl ?? 0) > 0
                                ? "text-[#00D09C]"
                                : "text-[#EF4444]"
                            }`}
                          >
                            {(h.day_pnl ?? 0) === 0
                              ? "₹0.00 (0.00%)"
                              : `${(h.day_pnl ?? 0) > 0 ? "+" : ""}₹${(h.day_pnl ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (${h.day_change_percent ?? 0}%)`}
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">vs prev close</div>
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
                              className="px-3 py-1.5 rounded-xl bg-[#E8FAF4] hover:bg-[#D1F5EA] text-[#00D09C] font-extrabold text-xs transition-colors"
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
                              className="px-3 py-1.5 rounded-xl bg-[#FDF2F0] hover:bg-[#FCE8E6] text-[#EF4444] border border-[#FADCD8] font-extrabold text-xs transition-colors"
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
        <section className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#64748B]" />
            <h2 className="font-heading font-extrabold text-xl text-[#0F172A]">
              Order Execution History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-[#64748B] py-2">No completed orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[#64748B] font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Type</th>
                    <th className="pb-3 px-3">Instrument</th>
                    <th className="pb-3 px-3 text-right">Quantity</th>
                    <th className="pb-3 px-3 text-right">Execution Price</th>
                    <th className="pb-3 px-3 text-right">Total Amount</th>
                    <th className="pb-3 px-3 text-right">Realized P&amp;L</th>
                    <th className="pb-3 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase ${
                            t.trade_type === "BUY"
                              ? "bg-[#E8FAF4] text-[#00D09C]"
                              : "bg-[#FDF2F0] text-[#EF4444]"
                          }`}
                        >
                          {t.trade_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#0F172A]">{t.company_name}</td>
                      <td className="py-3 px-3 text-right font-semibold text-[#0F172A]">{t.quantity}</td>
                      <td className="py-3 px-3 text-right font-semibold text-[#64748B]">₹{t.price_per_share}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-[#0F172A]">
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
                      <td className="py-3 px-3 text-right text-[11px] text-[#64748B]">
                        {t.timestamp.slice(0, 16)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Task Input Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 border border-[#E2E8F0] shadow-2xl">
            <h3 className="font-heading font-extrabold text-lg text-[#0F172A]">{activeTask.title}</h3>
            <p className="text-xs text-[#64748B]">{activeTask.description}</p>
            <form onSubmit={submitTaskModal} className="space-y-3">
              <input
                type={activeTask.id === "phone_bonus" ? "tel" : "date"}
                required
                placeholder={activeTask.id === "phone_bonus" ? "Enter Mobile Number" : ""}
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] outline-none focus:border-[#00D09C]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#00D09C] hover:bg-[#00B386] text-white text-xs font-bold shadow-sm"
                >
                  {claimLoading ? "Claiming..." : `Claim +₹${activeTask.reward_cash}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
