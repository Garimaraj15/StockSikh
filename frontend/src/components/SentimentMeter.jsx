import React from "react";
import { TrendingUp, TrendingDown, Newspaper } from "lucide-react";

export default function SentimentMeter({ sentiment }) {
  if (!sentiment) return null;

  const score = sentiment.score ?? 0;
  const bullishPct = sentiment.bullish_percent ?? 50;

  // Color mapping based on bullish %
  let bgBadge = "bg-[#E8FAF4] text-[#00D09C] border-[#B3F2DF]";

  if (bullishPct < 40) {
    bgBadge = "bg-[#FDF2F0] text-[#EB5B3C] border-[#FADCD8]";
  } else if (bullishPct <= 60) {
    bgBadge = "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E8FAF4] text-[#00D09C] flex items-center justify-center">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-base text-[#0F172A]">
              NLP Market News Sentiment
            </h4>
            <div className="text-[11px] text-[#64748B] font-medium">
              Data Science Natural Language Analysis
            </div>
          </div>
        </div>

        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${bgBadge}`}>
          {sentiment.status || "Neutral"}
        </span>
      </div>

      {/* 3D Visual Sentiment Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="flex justify-between items-center text-xs font-bold text-[#64748B]">
          <span className="flex items-center gap-1 text-[#EB5B3C]">
            <TrendingDown className="w-3.5 h-3.5" /> Bearish (0%)
          </span>
          <span className="font-extrabold text-sm text-[#0F172A]">
            {bullishPct}% Bullish
          </span>
          <span className="flex items-center gap-1 text-[#00D09C]">
            <TrendingUp className="w-3.5 h-3.5" /> Bullish (100%)
          </span>
        </div>

        {/* 3D Gradient Slider Track */}
        <div className="h-3.5 bg-[#F1F5F9] rounded-full relative overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#EB5B3C] via-[#F59E0B] to-[#00D09C] rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${bullishPct}%` }}
          />
        </div>
      </div>

      {/* Summary Commentary */}
      <p className="text-xs font-medium text-[#475569] leading-relaxed pt-1">
        {sentiment.summary}
      </p>

      <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#F1F5F9]">
        <span>Polarity Score: <strong className="text-[#0F172A]">{score >= 0 ? `+${score}` : score}</strong></span>
        <span>News Analyzed: <strong className="text-[#0F172A]">{sentiment.news_analyzed || 5} sources</strong></span>
      </div>
    </div>
  );
}
