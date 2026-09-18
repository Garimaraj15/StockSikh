import React from "react";
import { TrendingUp, TrendingDown, Newspaper } from "lucide-react";

export default function SentimentMeter({ sentiment }) {
  if (!sentiment) return null;

  const score = sentiment.score ?? 0;
  const bullishPct = sentiment.bullish_percent ?? 50;

  let bgBadge = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";

  if (bullishPct < 40) {
    bgBadge = "bg-red-500/15 text-red-400 border border-red-500/30";
  } else if (bullishPct <= 60) {
    bgBadge = "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  }

  return (
    <div className="bg-[#0F172A]/70 border border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00D09C]/10 text-[#00D09C] flex items-center justify-center">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-white">
              NLP Market News Sentiment
            </h4>
            <div className="text-[11px] text-slate-400 font-medium">
              Data Science Natural Language Analysis
            </div>
          </div>
        </div>

        <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${bgBadge}`}>
          {sentiment.status || "Neutral"}
        </span>
      </div>

      {/* Visual Sentiment Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
          <span className="flex items-center gap-1 text-[#EB5B3C]">
            <TrendingDown className="w-3.5 h-3.5" /> Bearish (0%)
          </span>
          <span className="font-extrabold text-sm text-white">
            {bullishPct}% Bullish
          </span>
          <span className="flex items-center gap-1 text-[#00D09C]">
            <TrendingUp className="w-3.5 h-3.5" /> Bullish (100%)
          </span>
        </div>

        <div className="h-3.5 bg-[#0B0F17] rounded-full relative overflow-hidden p-0.5 border border-white/[0.08]">
          <div
            className="h-full bg-gradient-to-r from-[#EB5B3C] via-[#F59E0B] to-[#00D09C] rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${bullishPct}%` }}
          />
        </div>
      </div>

      {/* Summary Commentary */}
      <div className="p-3 rounded-2xl bg-[#0B0F17]/60 border border-white/[0.06] text-[11px] text-slate-300 leading-relaxed">
        <strong className="text-white block mb-0.5">💡 Simple Meaning (Kya hai yeh?):</strong>
        <span className="text-[#00D09C] font-bold">Bullish ({bullishPct}%)</span>: News aur market sentiment positive hai, demand badhne ke chances hain.{" "}
        <span className="text-[#EB5B3C] font-bold">Bearish ({100 - bullishPct}%)</span>: Negative news ya selling pressure.
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
        <span>Polarity Score: <strong className="text-white">{score >= 0 ? `+${score}` : score}</strong></span>
        <span>News Analyzed: <strong className="text-white">{sentiment.news_analyzed || 5} sources</strong></span>
      </div>
    </div>
  );
}
