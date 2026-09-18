import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../context/AuthContext";
import { ShieldCheck, AlertTriangle, ArrowUpRight, CheckCircle2, XCircle, Info, Sparkles, X } from "lucide-react";

export default function PreTradeShieldModal({ isOpen, onClose, symbol, stockName, onProceedToTrade }) {
  const [loading, setLoading] = useState(true);
  const [shieldData, setShieldData] = useState(null);
  const [error, setError] = useState(null);

  const fetchShieldData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/stocks/${encodeURIComponent(symbol)}/safety-shield`);
      setShieldData(res.data);
    } catch (err) {
      console.error("Error fetching safety shield:", err);
      setError("Unable to run live AI safety inspection at this moment.");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (isOpen && symbol) {
      fetchShieldData();
    }
  }, [isOpen, symbol, fetchShieldData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0F172A] rounded-3xl border border-white/[0.08] shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#1E293B]/60 text-slate-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 flex items-center justify-center text-[#00D09C] shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Pre-Trade 4-Point AI Safety Shield</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1E293B]/60 text-slate-400 uppercase">
                Zero Risk Inspection
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Inspecting <b>{stockName || symbol}</b> before capital commitment
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-3 border-[#00D09C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-400">Running multi-factor AI safety algorithms...</p>
            <p className="text-xs text-slate-500 mt-1">Scanning fundamentals, RSI timing & 24h news sentiment</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-[#FDF2F0] border border-[#FCA5A5] text-[#EF4444] text-center my-4">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={fetchShieldData}
              className="mt-4 px-4 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626]"
            >
              Retry Inspection
            </button>
          </div>
        ) : (
          <div>
            {/* Overall Verdict Banner */}
            <div className="p-4 rounded-2xl bg-[#0B0F17]/80 border border-white/[0.08] mb-6 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Overall AI Safety Rating
                </span>
                <span className="text-lg font-black text-white">
                  {shieldData?.badge_text}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 block">Composite Score</span>
                <span className="text-2xl font-black text-[#00D09C]">
                  {shieldData?.composite_ai_score ?? 75}<span className="text-xs text-slate-400">/100</span>
                </span>
              </div>
            </div>

            {/* 4 Inspection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {shieldData?.checks?.map((check) => {
                const isPass = check.verdict === "PASS";
                const isWarn = check.verdict === "WARNING";
                return (
                  <div
                    key={check.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPass
                        ? "bg-[#00D09C]/10/30 border-[#A7F3D0]"
                        : isWarn
                        ? "bg-[#FFFBEB] border-[#FDE68A]"
                        : "bg-[#FDF2F0]/40 border-[#FECACA]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-white">{check.title}</span>
                      {isPass ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00D09C]" />
                      ) : isWarn ? (
                        <Info className="w-4 h-4 text-[#F59E0B]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#EF4444]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#475569] font-medium leading-relaxed">
                      {check.explanation}
                    </p>
                    {check.target_price && (
                      <div className="mt-2 pt-2 border-t border-white/[0.08] flex justify-between text-[10px] font-bold">
                        <span className="text-[#00D09C]">Target: ₹{check.target_price}</span>
                        <span className="text-[#EF4444]">SL: ₹{check.stoploss_price}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Educational Disclaimer */}
            <div className="p-3 rounded-xl bg-[#1E293B]/60 text-slate-400 text-[11px] mb-6 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#00D09C] shrink-0 mt-0.5" />
              <span>
                <b>Discipline Rule:</b> Never risk more than 2% of your virtual wallet on a single trade. Set the suggested Stop-Loss level to prevent deep drawdowns.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#CBD5E1] text-slate-400 hover:bg-[#0B0F17]/80 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (onProceedToTrade) {
                    onProceedToTrade(shieldData);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-[#00D09C] hover:bg-[#00B789] text-white text-xs font-extrabold shadow-lg shadow-[#00D09C]/20 transition-all flex items-center gap-1.5"
              >
                <span>Proceed to Order</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
