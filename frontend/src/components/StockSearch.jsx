import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../context/AuthContext";
import { Search, X, Loader2 } from "lucide-react";

export default function StockSearch({ size = "md", placeholder = "Search stocks (e.g. Reliance, TCS, HDFC)..." }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
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
      setError(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/stocks/search`, { params: { q: q.trim() } });
        setResults(res.data.results || []);
        setError(false);
        setOpen(true);
      } catch (e) {
        setResults([]);
        setError(true);
        setOpen(true);
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
        className={`flex items-center bg-[#0F172A]/80 border border-white/[0.1] hover:border-white/[0.2] focus-within:border-[#00D09C] focus-within:ring-2 focus-within:ring-[#00D09C]/20 rounded-2xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-xl ${
          isLarge ? "px-5 py-4" : "px-4 py-2.5"
        }`}
      >
        <Search className={`${isLarge ? "w-5 h-5" : "w-4 h-4"} text-[#94A3B8] mr-3.5 shrink-0`} />
        <input
          data-testid="stock-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (q.trim()) setOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent outline-none text-white font-medium placeholder-[#64748B] ${
            isLarge ? "text-base" : "text-sm"
          }`}
        />
        {q && (
          <button
            data-testid="stock-search-clear"
            onClick={() => {
              setQ("");
              setResults([]);
              setError(false);
              setOpen(false);
            }}
            className="p-1 rounded-full text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-[#0F172A]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-white/[0.06]">
          {loading && (
            <div className="px-5 py-4 text-xs font-semibold text-[#94A3B8] flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#00D09C] animate-spin" />
              Searching Indian stocks...
            </div>
          )}

          {!loading && error && (
            <div className="px-5 py-6 text-center text-sm text-[#EF4444]">
              Search is unavailable right now. Please try again.
            </div>
          )}

          {!loading && !error && results.length === 0 && q.trim() && (
            <div className="px-5 py-6 text-center text-sm text-[#94A3B8]">
              No stocks found matching "<span className="font-semibold text-white">{q}</span>"
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
              className="w-full text-left px-5 py-3.5 hover:bg-white/[0.06] flex items-center justify-between transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] group-hover:bg-[#00D09C]/20 border border-white/[0.08] group-hover:border-[#00D09C]/40 text-white group-hover:text-[#00D09C] flex items-center justify-center font-bold text-xs transition-colors shrink-0">
                  {r.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm group-hover:text-[#00D09C] transition-colors">
                    {r.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-0.5">
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

              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/[0.08] text-[#94A3B8] uppercase border border-white/[0.06]">
                NSE
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
