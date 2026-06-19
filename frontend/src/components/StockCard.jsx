

import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StockCard({ stock, index = 0 }) {
  const positive = stock.change >= 0;
  return (
    <Link
      to={`/stock/${encodeURIComponent(stock.symbol)}`}
      data-testid={`stock-card-${stock.symbol}`}
      className="block"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="card-hover bg-white rounded-2xl border border-[#E5E3DB] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.1em] text-[#A1A1AA] mb-1">
              {stock.symbol.replace(".NS", "").replace(".BO", "")}
            </div>
            <div className="font-heading font-medium text-[#1C1C1C] text-base truncate">
              {stock.name}
            </div>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              positive
                ? "bg-[#D1FAE5] text-[#065F46]"
                : "bg-[#FEE2E2] text-[#991B1B]"
            }`}
          >
            {positive ? (
              <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="w-3 h-3" strokeWidth={2.5} />
            )}
            {positive ? "+" : ""}
            {stock.change_percent}%
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-heading font-semibold text-2xl text-[#1A3626]">
            ₹{(stock.price || 0).toLocaleString("en-IN")}
          </span>
          <span
            className={`text-sm font-medium ${
              positive ? "text-[#065F46]" : "text-[#991B1B]"
            }`}
          >
            {positive ? "+" : ""}
            {stock.change}
          </span>
        </div>
      </div>
    </Link>
  );
}
