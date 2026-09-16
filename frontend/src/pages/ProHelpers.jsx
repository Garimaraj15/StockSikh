import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import FlyingVidyaBot from "../components/FlyingVidyaBot";
import {
  Users,
  Award,
  MessageSquare,
  Plus
} from "lucide-react";

export default function ProHelpers() {
  const { user } = useAuth();
  const userId = user?.id || 1;
  const userName = user?.name || "Learner Trader";

  const [pros, setPros] = useState([]);
  const [queries, setQueries] = useState([]);

  // New Query Form State
  const [showAskModal, setShowAskModal] = useState(false);
  const [title, setTitle] = useState("");
  const [queryText, setQueryText] = useState("");
  const [stockSymbol, setStockSymbol] = useState("RELIANCE.NS");
  const [postLoading, setPostLoading] = useState(false);

  // Reply State
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const loadCommunityData = useCallback(async () => {
    try {
      const [proRes, qRes] = await Promise.all([
        axios.get(`${API}/community/pros`),
        axios.get(`${API}/community/queries`)
      ]);
      setPros(proRes.data?.pros || []);
      setQueries(qRes.data?.queries || []);
    } catch (err) {
      console.error("Error loading community data:", err);
    }
  }, []);

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  const handleAskQuery = async (e) => {
    e.preventDefault();
    if (!title.trim() || !queryText.trim()) return;

    setPostLoading(true);
    try {
      await axios.post(`${API}/community/ask`, {
        learner_id: userId,
        learner_name: userName,
        title: title.trim(),
        query_text: queryText.trim(),
        stock_symbol: stockSymbol
      });
      setTitle("");
      setQueryText("");
      setShowAskModal(false);
      await loadCommunityData();
    } catch (err) {
      console.error("Ask query error:", err);
    } finally {
      setPostLoading(false);
    }
  };

  const handleReplyQuery = async (queryId) => {
    if (!replyText.trim()) return;

    setReplyLoading(true);
    try {
      await axios.post(`${API}/community/reply`, {
        query_id: queryId,
        pro_name: user?.role === "pro" ? user.name : `${userName} (Learner)`,
        pro_badge: user?.role === "pro" ? "🏆 Verified Pro Mentor" : "🎓 Community Contributor",
        reply_text: replyText.trim()
      });
      setReplyText("");
      setReplyingTo(null);
      await loadCommunityData();
    } catch (err) {
      console.error("Reply error:", err);
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <FlyingVidyaBot />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Top Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8FAF4] text-[#00D09C] text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" /> Peer Mentorship &amp; Community
            </div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight">
              Pro Helpers &amp; Query Solver Hub
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#64748B] mt-1 max-w-2xl">
              Connect with certified Pro Traders, get answers to your Indian stock queries, and learn winning technical setups.
            </p>
          </div>

          <button
            onClick={() => setShowAskModal(true)}
            className="self-start md:self-auto inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#00D09C] hover:bg-[#00B386] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Ask a Question
          </button>
        </div>

        {/* Pro Mentors Directory */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#00D09C]" />
            <h2 className="font-heading font-extrabold text-2xl text-[#0F172A]">
              Featured Pro Mentors
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pros.map((pro) => (
              <div key={pro.id} className="groww-card p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                      {pro.avatar}
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-[#E8FAF4] text-[#00D09C] border border-[#B3F2DF]">
                      {pro.badge}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-lg text-[#0F172A]">{pro.name}</h3>
                  <div className="text-xs font-bold text-[#387ED1] mt-0.5">{pro.specialization}</div>
                  <p className="text-xs text-[#64748B] mt-2.5 leading-relaxed">{pro.bio}</p>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-bold">
                  <span className="text-[#64748B]">{pro.experience}</span>
                  <span className="text-[#00D09C]">{pro.accuracy_rating}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Query Solver Board */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-[#387ED1]" />
              <h2 className="font-heading font-extrabold text-2xl text-[#0F172A]">
                Community Doubt &amp; Solution Board
              </h2>
            </div>
          </div>

          <div className="grid gap-4">
            {queries.map((q) => (
              <div key={q.id} className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#0F172A] uppercase">
                      {q.stock_symbol || "NSE"}
                    </span>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A]">
                      {q.title}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      q.status === "RESOLVED"
                        ? "bg-[#E8FAF4] text-[#00D09C]"
                        : "bg-[#FEF3C7] text-[#D97706]"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-[#475569] leading-relaxed">
                  {q.query_text}
                </p>

                <div className="text-[11px] font-semibold text-[#64748B] flex items-center gap-2">
                  <span>Asked by: <strong className="text-[#0F172A]">{q.learner_name}</strong></span>
                  <span>•</span>
                  <span>{q.created_at}</span>
                </div>

                {/* Pro Replies Section */}
                {q.replies && q.replies.length > 0 && (
                  <div className="pt-3 border-t border-[#F1F5F9] space-y-3">
                    <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                      Pro Mentor Solutions:
                    </div>
                    {q.replies.map((rep, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#0F172A]">{rep.pro_name}</span>
                          <span className="text-[10px] font-bold text-[#00D09C] bg-[#E8FAF4] px-2 py-0.5 rounded">
                            {rep.pro_badge}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#475569] leading-relaxed">
                          {rep.reply_text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Action */}
                <div className="pt-2 flex items-center gap-2">
                  {replyingTo === q.id ? (
                    <div className="w-full flex gap-2">
                      <input
                        type="text"
                        placeholder="Write your advice or analysis..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs outline-none focus:border-[#00D09C]"
                      />
                      <button
                        onClick={() => handleReplyQuery(q.id)}
                        disabled={replyLoading}
                        className="px-4 py-2 rounded-xl bg-[#00D09C] text-white font-bold text-xs shadow-xs"
                      >
                        {replyLoading ? "Posting..." : "Post Solution"}
                      </button>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#64748B]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyingTo(q.id);
                        setReplyText("");
                      }}
                      className="text-xs font-bold text-[#00D09C] hover:text-[#00B386] transition-colors"
                    >
                      + Answer this query
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 space-y-4 border border-[#E2E8F0] shadow-2xl">
            <h3 className="font-heading font-extrabold text-xl text-[#0F172A]">
              Ask the Pro Mentors
            </h3>
            <p className="text-xs text-[#64748B]">
              Post your doubt about Indian stocks, charts, or indicators to get verified feedback.
            </p>

            <form onSubmit={handleAskQuery} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#0F172A] uppercase">Select Stock</label>
                <select
                  value={stockSymbol}
                  onChange={(e) => setStockSymbol(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#0F172A] outline-none"
                >
                  <option value="RELIANCE.NS">Reliance Industries (RELIANCE.NS)</option>
                  <option value="TCS.NS">Tata Consultancy Services (TCS.NS)</option>
                  <option value="INFY.NS">Infosys (INFY.NS)</option>
                  <option value="HDFCBANK.NS">HDFC Bank (HDFCBANK.NS)</option>
                  <option value="ICICIBANK.NS">ICICI Bank (ICICIBANK.NS)</option>
                  <option value="SBIN.NS">State Bank of India (SBIN.NS)</option>
                  <option value="GENERAL">General Market Strategy</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F172A] uppercase">Question Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Should I enter HDFC Bank after today's breakout?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#00D09C]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F172A] uppercase">Detailed Question</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your reasoning, technical indicators observed, and your doubt..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#0F172A] outline-none focus:border-[#00D09C]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postLoading}
                  className="flex-1 py-3 rounded-xl bg-[#00D09C] hover:bg-[#00B386] text-white text-xs font-bold shadow-md"
                >
                  {postLoading ? "Submitting..." : "Post to Pro Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
