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
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
        stock.signal === "BUY"
          ? "bg-[#E8FAF4] text-[#00D09C] border border-[#B3F2DF]"
          : stock.signal === "SELL"
          ? "bg-[#FDF2F0] text-[#EB5B3C] border border-[#FADCD8]"
          : "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
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
            <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] group-hover:border-[#00D09C]/40 group-hover:bg-[#E8FAF4] flex items-center justify-center font-bold text-xs text-[#0F172A] group-hover:text-[#00D09C] transition-colors shrink-0">
              {symbolClean.slice(0, 3)}
            </div>
            <div className="flex items-center gap-1.5">
              {signalBadge}
              <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                NSE
              </span>
            </div>
          </div>

          {/* Company Name & Sector */}
          <div className="mb-4">
            <h4 className="font-bold text-[#0F172A] text-base group-hover:text-[#00D09C] transition-colors truncate">
              {stock.name || symbolClean}
            </h4>
            <div className="text-xs font-medium text-[#64748B] mt-0.5 flex items-center gap-1.5">
              <span className="uppercase font-semibold">{symbolClean}</span>
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
        <div className="pt-3 border-t border-[#F1F5F9] flex items-baseline justify-between">
          <div className="font-heading font-extrabold text-xl text-[#0F172A]">
            ₹{(stock.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
              isPositive
                ? "bg-[#E8FAF4] text-[#00D09C]"
                : "bg-[#FDF2F0] text-[#EB5B3C]"
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
