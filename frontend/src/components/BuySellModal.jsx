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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#00D09C]" /> Paper Trading Engine
          </div>
          <h3 className="font-heading font-extrabold text-2xl text-[#0F172A]">
            Trade {stock.name || cleanSymbol}
          </h3>
          <div className="text-sm font-bold text-[#00D09C] mt-0.5">
            Live NSE Price: ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* BUY / SELL Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#F1F5F9] p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setMode("BUY");
              setStatusMsg({ type: "", text: "" });
            }}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              mode === "BUY"
                ? "bg-[#00D09C] text-white shadow-md"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> BUY SHARES
          </button>

          <button
            onClick={() => {
              setMode("SELL");
              setStatusMsg({ type: "", text: "" });
            }}
            className={`py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              mode === "SELL"
                ? "bg-[#EB5B3C] text-white shadow-md"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <TrendingDown className="w-4 h-4" /> SELL SHARES
          </button>
        </div>

        {/* Balances Strip */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
          <span className="font-semibold text-[#64748B] flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#00D09C]" /> Virtual Balance:
          </span>
          <span className="font-extrabold text-[#0F172A]">
            ₹{availableCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Holding Status if Selling */}
        {mode === "SELL" && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs">
            <span className="font-bold text-[#92400E]">In Your Portfolio:</span>
            <span className="font-extrabold text-[#92400E]">{availableShares} Shares</span>
          </div>
        )}

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Quantity (Number of Shares)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-11 h-11 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-extrabold text-lg flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="10000"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 py-2.5 text-center font-heading font-extrabold text-xl text-[#0F172A] rounded-xl border border-[#E2E8F0] focus:border-[#00D09C] outline-none"
            />
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-11 h-11 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-extrabold text-lg flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Total Cost / Proceeds Preview */}
        <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
          <span className="text-xs font-bold text-[#64748B] uppercase">
            {mode === "BUY" ? "Total Order Value:" : "Total Sale Proceeds:"}
          </span>
          <span className="font-heading font-extrabold text-2xl text-[#0F172A]">
            ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Status Message */}
        {statusMsg.text && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 ${
              statusMsg.type === "success"
                ? "bg-[#E8FAF4] text-[#00D09C] border border-[#B3F2DF]"
                : "bg-[#FDF2F0] text-[#EB5B3C] border border-[#FADCD8]"
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
          className={`w-full py-4 rounded-full text-white font-extrabold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === "BUY"
              ? "bg-[#00D09C] hover:bg-[#00B386]"
              : "bg-[#EB5B3C] hover:bg-[#D94B2C]"
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
