import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../context/AuthContext";
import { Search, X } from "lucide-react";

export default function StockSearch({ size = "md", placeholder = "Search stocks (e.g. Reliance, TCS, HDFC)..." }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/stocks/search`, { params: { q: q.trim() } });
        setResults(res.data.results || []);
        setOpen(true);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const isLarge = size === "lg";

  return (
    <div ref={ref} className="relative w-full">
      <div
        className={`flex items-center bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus-within:border-[#00D09C] focus-within:ring-2 focus-within:ring-[#00D09C]/20 rounded-2xl transition-all shadow-sm ${
          isLarge ? "px-5 py-4" : "px-4 py-2.5"
        }`}
      >
        <Search className={`${isLarge ? "w-5 h-5" : "w-4 h-4"} text-[#64748B] mr-3.5 shrink-0`} />
        <input
          data-testid="stock-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (q.trim()) setOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent outline-none text-[#0F172A] font-medium placeholder-[#94A3B8] ${
            isLarge ? "text-base" : "text-sm"
          }`}
        />
        {q && (
          <button
            data-testid="stock-search-clear"
            onClick={() => {
              setQ("");
              setResults([]);
              setOpen(false);
            }}
            className="p-1 rounded-full text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-5 py-4 text-xs font-semibold text-[#64748B] flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-[#00D09C] border-t-transparent rounded-full animate-spin"></span>
              Searching Indian stocks...
            </div>
          )}

          {!loading && results.length === 0 && q.trim() && (
            <div className="px-5 py-6 text-center text-sm text-[#64748B]">
              No stocks found matching "<span className="font-semibold text-[#0F172A]">{q}</span>"
            </div>
          )}

          {results.map((r) => (
            <button
              key={r.symbol}
              data-testid={`search-result-${r.symbol}`}
              onClick={() => {
                navigate(`/stock/${encodeURIComponent(r.symbol)}`);
                setOpen(false);
                setQ("");
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-[#F8FAFC] flex items-center justify-between transition-colors border-b border-[#F1F5F9] last:border-b-0 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] group-hover:bg-[#E8FAF4] text-[#0F172A] group-hover:text-[#00D09C] flex items-center justify-center font-bold text-xs transition-colors shrink-0">
                  {r.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-[#0F172A] text-sm group-hover:text-[#00D09C] transition-colors">
                    {r.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                    <span className="font-semibold uppercase">{r.symbol.replace(".NS", "")}</span>
                    {r.sector && (
                      <>
                        <span>•</span>
                        <span>{r.sector}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] uppercase">
                NSE
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
