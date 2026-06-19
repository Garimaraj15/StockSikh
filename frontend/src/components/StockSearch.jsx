
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../context/AuthContext";
import { Search, X } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
export default function StockSearch({ size = "md" }) {
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
        const res = await axios.get(`${API}/stocks/search`, { params: { q } });
        setResults(res.data.results || []);
        setOpen(true);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const sizing = size === "lg" ? "py-4 text-base" : "py-3 text-sm";

  return (
    <div ref={ref} className="relative w-full">
      <div className={`flex items-center bg-white border border-[#E5E3DB] rounded-full px-5 ${sizing} shadow-[0_2px_12px_rgba(0,0,0,0.02)]`}>
        <Search className="w-4 h-4 text-[#A1A1AA] mr-3" />
        <input
          data-testid="stock-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          placeholder="Search Indian stocks (e.g., TCS, Reliance, INFY)..."
          className="flex-1 bg-transparent outline-none text-[#1C1C1C] placeholder-[#A1A1AA]"
        />
        {q && (
          <button
            data-testid="stock-search-clear"
            onClick={() => { setQ(""); setResults([]); }}
            className="text-[#A1A1AA] hover:text-[#1C1C1C]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl border border-[#E5E3DB] shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden z-30 max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-5 py-4 text-sm text-[#A1A1AA]">Searching...</div>
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
              className="w-full text-left px-5 py-3 hover:bg-[#F3F2ED] flex items-center justify-between transition-colors border-b border-[#F3F2ED] last:border-b-0"
            >
              <div>
                <div className="font-medium text-[#1C1C1C] text-sm">{r.name}</div>
                <div className="text-xs text-[#A1A1AA] uppercase tracking-wider">
                  {r.symbol.replace(".NS", "").replace(".BO", "")}
                </div>
              </div>
              <span className="text-xs text-[#A1A1AA]">NSE</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
