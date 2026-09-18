import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import FlyingVidyaBot from "../components/FlyingVidyaBot";
import {
  Globe2,
  Video,
  ExternalLink,
  Filter,
  AlertCircle
} from "lucide-react";

export default function GlobalCreators() {
  const [creators, setCreators] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/creators/`, { params: { language: selectedLang } })
      .then((res) => {
        setCreators(res.data?.creators || []);
        setLanguages(res.data?.languages || []);
      })
      .catch((err) => console.error("Creators load error:", err))
      .finally(() => setLoading(false));
  }, [selectedLang]);

  return (
    <div className="min-h-screen bg-atmospheric text-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-r from-[#0B0F17] via-[#111827] to-[#0B0F17] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] text-xs font-extrabold uppercase tracking-wider">
            <Globe2 className="w-3.5 h-3.5" /> Curated Educational Directory
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight">
            Curated Educational Creators
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#94A3B8] max-w-2xl leading-relaxed">
            Learn stock market fundamentals and risk management in your native language from India's popular financial content creators.
          </p>

          {/* Educational Disclaimer */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#94A3B8] flex items-center gap-2.5 mt-2">
            <AlertCircle className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>
              <strong>Educational directory:</strong> Independent third-party educators — not affiliated with, sponsored by, or officially endorsed by StockSikh.
            </span>
          </div>
        </div>

        {/* Language Filter Pills */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#00D09C]" /> Filter by Language:
          </div>

          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedLang === lang.code
                    ? "bg-[#00D09C] text-[#07090E] font-black shadow-[0_0_15px_rgba(0,208,156,0.3)] scale-105"
                    : "bg-[#111827] border border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* Creators Grid */}
        <section>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-[#111827]/60 border border-white/[0.06] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className="p-12 text-center bg-[#111827]/40 border border-dashed border-white/[0.1] rounded-3xl text-sm text-[#94A3B8]">
              No creators found for this language filter.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((c) => (
                <div key={c.id} className="groww-card p-6 flex flex-col justify-between space-y-4 hover:border-white/[0.18] transition-all">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center font-extrabold text-base shadow-xs">
                        <Video className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/[0.06] text-[#94A3B8] border border-white/[0.06]">
                        {c.language} • {c.subscribers}
                      </span>
                    </div>

                    <h3 className="font-heading font-black text-lg text-white">{c.name}</h3>
                    <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#00D09C]">
                      {c.platform || "YouTube"}
                    </span>
                    {c.channel_url && (
                      <a
                        href={c.channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-[#00D09C] transition-colors"
                      >
                        Visit Channel <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
