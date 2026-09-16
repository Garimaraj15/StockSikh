import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import FlyingVidyaBot from "../components/FlyingVidyaBot";
import {
  Globe2,
  Video,
  Share2,
  Filter
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero Banner */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8FAF4] text-[#00D09C] text-xs font-bold uppercase tracking-wider">
            <Globe2 className="w-3.5 h-3.5" /> Multi-Lingual Financial Education Hub
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
            Global Helpers &amp; Top Financial Creators
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#64748B] max-w-2xl leading-relaxed">
            Learn the stock market in your own native language from India's most trusted YouTube and Instagram educators.
          </p>
        </div>

        {/* Language Filter Pills */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#00D09C]" /> Select Your Learning Language:
          </div>

          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedLang === lang.code
                    ? "bg-[#00D09C] text-white shadow-md scale-105"
                    : "bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9]"
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
                <div key={i} className="h-64 bg-white border border-[#E2E8F0] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-3xl text-sm text-[#64748B]">
              No creators found for this language filter.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((c) => (
                <div key={c.id} className="groww-card p-6 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#FDF2F0] text-[#EB5B3C] flex items-center justify-center font-extrabold text-base shadow-xs">
                        <Video className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#F1F5F9] text-[#0F172A]">
                        {c.language} ({c.subscribers})
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-lg text-[#0F172A]">{c.name}</h3>
                    <div className="text-xs font-bold text-[#00D09C] mt-0.5">{c.category}</div>
                    <p className="text-xs text-[#64748B] mt-2.5 leading-relaxed">{c.description}</p>
                  </div>

                  {/* Featured Video Box */}
                  <div className="space-y-3 pt-3 border-t border-[#F1F5F9]">
                    <div className="text-[11px] font-bold text-[#64748B] uppercase">
                      Featured Lesson:
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-xs font-bold text-[#0F172A] leading-snug">
                      {c.featured_video_title}
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={c.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 rounded-xl bg-[#EB5B3C] hover:bg-[#D94B2C] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Video className="w-4 h-4" /> Watch Channel
                      </a>

                      {c.instagram_url && (
                        <a
                          href={c.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold flex items-center justify-center transition-colors"
                          title="Social Channel"
                        >
                          <Share2 className="w-4 h-4" />
                        </a>
                      )}
                    </div>
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
