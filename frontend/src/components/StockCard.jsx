import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StockCard({ stock, index = 0 }) {
  const change = stock.change ?? 0;
  const changePercent = stock.change_percent ?? 0;
  const isPositive = change >= 0;

  const symbolClean = stock.symbol.replace(".NS", "").replace(".BO", "");

  const signalBadge = stock.signal ? (
    <span
      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
        stock.signal === "BUY"
          ? "bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30"
          : stock.signal === "SELL"
          ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
          : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
      }`}
    >
      {stock.signal}
    </span>
  ) : null;

  return (
    <Link
      to={`/stock/${encodeURIComponent(stock.symbol)}`}
      data-testid={`stock-card-${stock.symbol}`}
      className="block group"
    >
      <div className="groww-card p-5 h-full flex flex-col justify-between">
        {/* Top Row: Symbol Avatar & Signal Badge */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-[#00D09C]/40 group-hover:bg-[#00D09C]/10 flex items-center justify-center font-extrabold text-xs text-white group-hover:text-[#00D09C] transition-colors shrink-0 shadow-xs">
              {symbolClean.slice(0, 3)}
            </div>
            <div className="flex items-center gap-1.5">
              {signalBadge}
              <span className="text-[10px] font-extrabold text-[#94A3B8] bg-white/[0.06] border border-white/[0.06] px-1.5 py-0.5 rounded">
                NSE
              </span>
            </div>
          </div>

          {/* Company Name & Sector */}
          <div className="mb-4">
            <h4 className="font-bold text-white text-base group-hover:text-[#00D09C] transition-colors truncate">
              {stock.name || symbolClean}
            </h4>
            <div className="text-xs font-medium text-[#94A3B8] mt-0.5 flex items-center gap-1.5">
              <span className="uppercase font-semibold text-white/80">{symbolClean}</span>
              {stock.sector && (
                <>
                  <span>•</span>
                  <span className="truncate">{stock.sector}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Live Price and +/-% pill */}
        <div className="pt-3 border-t border-white/[0.08] flex items-baseline justify-between">
          <div className="font-heading font-black text-xl text-white">
            ₹{(stock.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
              isPositive
                ? "bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30"
                : "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
            <span>
              {isPositive ? "+" : ""}
              {changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
