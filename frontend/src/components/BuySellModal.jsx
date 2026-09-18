import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../context/AuthContext";
import { X, Sparkles, TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";

export default function BuySellModal({ stock, isOpen, onClose, onTradeComplete, initialMode = "BUY" }) {
  const { user } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [quantity, setQuantity] = useState(1);
  const [walletData, setWalletData] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const userId = user?.id || 1;
  const currentPrice = stock?.price || 1000.0;
  const cleanSymbol = stock?.symbol || "RELIANCE.NS";

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setStatusMsg({ type: "", text: "" });
    setQuantity(1);

    // Fetch user wallet balance and current holding
    axios.get(`${API}/wallet/balance?user_id=${userId}`).then((res) => setWalletData(res.data)).catch(() => {});
    axios.get(`${API}/portfolio/holdings?user_id=${userId}`).then((res) => setHoldings(res.data?.holdings || [])).catch(() => {});
  }, [isOpen, initialMode, userId]);

  if (!isOpen || !stock) return null;

  const userHolding = holdings.find((h) => h.symbol === cleanSymbol);
  const availableShares = userHolding ? userHolding.quantity : 0;
  const availableCash = walletData?.virtual_cash || 0;

  const totalCost = Number((quantity * currentPrice).toFixed(2));
  const canBuy = availableCash >= totalCost;
  const canSell = availableShares >= quantity;

  const executeTrade = async () => {
    setStatusMsg({ type: "", text: "" });
    setLoading(true);

    try {
      if (mode === "BUY") {
        const res = await axios.post(`${API}/portfolio/buy`, {
          user_id: userId,
          symbol: cleanSymbol,
          quantity: Number(quantity)
        });
        setStatusMsg({ type: "success", text: res.data.message });
        if (onTradeComplete) onTradeComplete();
      } else {
        const res = await axios.post(`${API}/portfolio/sell`, {
          user_id: userId,
          symbol: cleanSymbol,
          quantity: Number(quantity)
        });
        setStatusMsg({ type: "success", text: res.data.message });
        if (onTradeComplete) onTradeComplete();
      }

      // Refresh balances
      const [wRes, hRes] = await Promise.all([
        axios.get(`${API}/wallet/balance?user_id=${userId}`),
        axios.get(`${API}/portfolio/holdings?user_id=${userId}`)
      ]);
      setWalletData(wRes.data);
      setHoldings(hRes.data?.holdings || []);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Trade execution failed."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F172A]/90 backdrop-blur-xl rounded-3xl border border-white/[0.1] shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 sm:p-7 space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1E293B]/60 hover:bg-[#1E293B] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#00D09C]" /> Paper Trading Engine
          </div>
          <h3 className="font-heading font-extrabold text-2xl text-white">
            Trade {stock.name || cleanSymbol}
          </h3>
          <div className="text-sm font-bold text-[#00D09C] mt-0.5">
            Live NSE Price: ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* BUY / SELL Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#0B0F17] p-1.5 rounded-2xl border border-white/[0.06]">
          <button
            onClick={() => {
              setMode("BUY");
              setStatusMsg({ type: "", text: "" });
            }}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "BUY"
                ? "bg-[#00D09C] text-slate-950 font-black shadow-md shadow-[#00D09C]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> BUY SHARES
          </button>

          <button
            onClick={() => {
              setMode("SELL");
              setStatusMsg({ type: "", text: "" });
            }}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "SELL"
                ? "bg-[#EB5B3C] text-white font-bold shadow-md shadow-[#EB5B3C]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingDown className="w-4 h-4" /> SELL SHARES
          </button>
        </div>

        {/* Balances Strip */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0B0F17]/80 border border-white/[0.08] text-xs">
          <span className="font-semibold text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#00D09C]" /> Virtual Balance:
          </span>
          <span className="font-extrabold text-white">
            ₹{availableCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Holding Status if Selling */}
        {mode === "SELL" && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs">
            <span className="font-bold text-amber-300">In Your Portfolio:</span>
            <span className="font-extrabold text-amber-200">{availableShares} Shares</span>
          </div>
        )}

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Quantity (Number of Shares)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-11 h-11 rounded-xl bg-[#1E293B]/80 hover:bg-[#1E293B] text-white font-extrabold text-lg flex items-center justify-center border border-white/[0.08] cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="10000"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 py-2.5 text-center font-heading font-extrabold text-xl text-white bg-[#0B0F17]/90 rounded-xl border border-white/[0.08] focus:border-[#00D09C] outline-none"
            />
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-11 h-11 rounded-xl bg-[#1E293B]/80 hover:bg-[#1E293B] text-white font-extrabold text-lg flex items-center justify-center border border-white/[0.08] cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Total Cost / Proceeds Preview */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">
            {mode === "BUY" ? "Total Order Value:" : "Total Sale Proceeds:"}
          </span>
          <span className="font-heading font-extrabold text-2xl text-white">
            ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Status Message */}
        {statusMsg.text && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "bg-red-500/15 text-red-300 border border-red-500/30"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={executeTrade}
          disabled={loading || (mode === "BUY" && !canBuy) || (mode === "SELL" && !canSell)}
          className={`w-full py-4 rounded-full font-extrabold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            mode === "BUY"
              ? "bg-[#00D09C] hover:bg-[#00B386] text-slate-950 font-black shadow-[#00D09C]/20"
              : "bg-[#EB5B3C] hover:bg-[#D94B2C] text-white shadow-[#EB5B3C]/20"
          }`}
        >
          {loading
            ? "Executing on Live Market..."
            : mode === "BUY"
            ? canBuy
              ? `BUY ${quantity} SHARES (₹${totalCost.toLocaleString("en-IN")})`
              : "INSUFFICIENT VIRTUAL CASH"
            : canSell
            ? `SELL ${quantity} SHARES (₹${totalCost.toLocaleString("en-IN")})`
            : "NO SHARES TO SELL"}
        </button>
      </div>
    </div>
  );
}
