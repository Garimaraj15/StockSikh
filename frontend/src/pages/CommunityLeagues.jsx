import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  Eye, MessageSquare, RefreshCw, Send, Trophy, Users, X,
  Loader2, HelpCircle, ChevronDown, ChevronUp, Plus, Search, Check,
  ArrowBigUp, MessageCircle, Star
} from "lucide-react";
import Navbar from "../components/Navbar";
import FlyingVidyaBot from "../components/FlyingVidyaBot";
import { API, useAuth } from "../context/AuthContext";

/* ─── formatters ─────────────────────────────────────────────────────────── */
const formatMoney = (value) => {
  if (value === null || value === undefined) return "—";
  return `${value >= 0 ? "+" : "-"}₹${Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
};

const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

const formatMessageDate = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch { return ""; }
};

const initials = (name) =>
  (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/* ─── Predefined stock options ───────────────────────────────────────────── */
const PREDEFINED_STOCKS = [
  { value: "GENERAL", label: "General Market Strategy" },
  { value: "RELIANCE.NS", label: "Reliance Industries (RELIANCE.NS)" },
  { value: "TCS.NS", label: "Tata Consultancy Services (TCS.NS)" },
  { value: "INFY.NS", label: "Infosys (INFY.NS)" },
  { value: "HDFCBANK.NS", label: "HDFC Bank (HDFCBANK.NS)" },
  { value: "ICICIBANK.NS", label: "ICICI Bank (ICICIBANK.NS)" },
  { value: "SBIN.NS", label: "State Bank of India (SBIN.NS)" },
  { value: "OTHER", label: "Other (Search Company / Stock)" },
];

/* ─── reusable UI pieces ─────────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#00D09C]/10 text-[#00D09C] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, heading, sub }) {
  return (
    <div className="py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#1E293B]/60 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-[#CBD5E1]" />
      </div>
      <p className="text-sm font-bold text-white">{heading}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function AvatarBadge({ name, size = "md" }) {
  const sz = size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-2xl bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] font-extrabold flex items-center justify-center shrink-0`}>
      {initials(name)}
    </div>
  );
}

/* ─── Ask-a-Question modal ────────────────────────────────────────────────── */
function AskQuestionModal({ onClose, onPosted, authConfig }) {
  const [selectedStock, setSelectedStock] = useState("GENERAL");
  const [customStockQuery, setCustomStockQuery] = useState("");
  const [customStockSelected, setCustomStockSelected] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedStock !== "OTHER" || !customStockQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(false);
      try {
        const res = await axios.get(`${API}/stocks/search`, {
          params: { q: customStockQuery.trim() },
        });
        setSearchResults(res.data?.results || []);
        setShowDropdown(true);
      } catch (e) {
        setSearchResults([]);
        setSearchError(true);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedStock, customStockQuery]);

  const handleStockSelect = (stock) => {
    setCustomStockSelected(stock);
    setCustomStockQuery(`${stock.name} (${stock.symbol})`);
    setShowDropdown(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!title.trim()) {
      setErr("Question title is required.");
      return;
    }
    if (!body.trim()) {
      setErr("Question description is required.");
      return;
    }

    let finalSymbol = "GENERAL";
    if (selectedStock === "OTHER") {
      if (customStockSelected?.symbol) {
        finalSymbol = customStockSelected.symbol;
      } else if (customStockQuery.trim()) {
        finalSymbol = customStockQuery.trim().toUpperCase();
      } else {
        setErr("Please enter or select a stock symbol for your query.");
        return;
      }
    } else {
      finalSymbol = selectedStock;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API}/community/ask`,
        {
          title: title.trim(),
          query_text: body.trim(),
          stock_symbol: finalSymbol,
        },
        authConfig()
      );
      onPosted();
      onClose();
    } catch (ex) {
      setErr(ex.response?.data?.detail || "Failed to post question.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-white/[0.1] rounded-3xl border border-white/[0.08] shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-white text-base">Ask the Community</h3>
            <p className="text-xs text-slate-400 mt-0.5">Post a market doubt to get insights from fellow traders and Pro Learners.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Select Stock / Category
            </label>
            <div className="relative">
              <select
                value={selectedStock}
                onChange={(e) => {
                  setSelectedStock(e.target.value);
                  if (e.target.value !== "OTHER") {
                    setCustomStockQuery("");
                    setCustomStockSelected(null);
                  }
                }}
                className="w-full bg-[#0B0F17]/60 border border-white/[0.08] focus:border-[#00D09C] focus:bg-[#0F172A] border border-white/[0.1] rounded-2xl px-4 py-3 text-xs text-white font-semibold outline-none transition-all appearance-none cursor-pointer"
              >
                {PREDEFINED_STOCKS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Choose a stock or General Market Strategy. Select Other to search for another company.
            </p>
          </div>

          {selectedStock === "OTHER" && (
            <div ref={searchRef} className="space-y-1.5 relative">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Company / Stock Search
              </label>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={customStockQuery}
                  onChange={(e) => {
                    setCustomStockQuery(e.target.value);
                    setCustomStockSelected(null);
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Search company (e.g. ITC, Maruti, L&T) or enter symbol..."
                  className="w-full bg-[#0B0F17]/60 border border-white/[0.08] focus:border-[#00D09C] focus:bg-[#0F172A] border border-white/[0.1] rounded-2xl pl-10 pr-10 py-3 text-xs text-white font-medium outline-none transition-all"
                  required
                />
                {searchLoading && (
                  <Loader2 className="w-4 h-4 text-[#00D09C] animate-spin absolute right-3.5" />
                )}
                {customStockSelected && !searchLoading && (
                  <Check className="w-4 h-4 text-[#00D09C] absolute right-3.5" />
                )}
              </div>

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full mt-1.5 w-full bg-[#0F172A] border border-white/[0.1] rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto divide-y divide-[#F1F5F9]">
                  {searchResults.map((r) => (
                    <button
                      key={r.symbol}
                      type="button"
                      onClick={() => handleStockSelect(r)}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#0B0F17]/60 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-white">{r.name}</p>
                        <p className="text-[11px] text-slate-400">{r.symbol} {r.sector ? `• ${r.sector}` : ""}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#00D09C]/10 text-[#00D09C] text-[10px] font-extrabold uppercase">
                        NSE
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchError && (
                <p className="text-[11px] text-[#DC2626] font-semibold">
                  Search service unavailable. You can type the stock symbol directly (e.g. ITC.NS).
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Question Title
            </label>
            <input
              className="w-full bg-[#0B0F17]/60 border border-white/[0.08] focus:border-[#00D09C] focus:bg-[#0F172A] border border-white/[0.1] rounded-2xl px-4 py-3 text-xs text-white placeholder-[#94A3B8] font-medium outline-none transition-all"
              placeholder="e.g. Is Reliance showing a bullish breakout on the daily chart?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Your Question
            </label>
            <textarea
              rows={4}
              className="w-full bg-[#0B0F17]/60 border border-white/[0.08] focus:border-[#00D09C] focus:bg-[#0F172A] border border-white/[0.1] rounded-2xl px-4 py-3 text-xs text-white placeholder-[#94A3B8] font-medium outline-none transition-all resize-none leading-relaxed"
              placeholder="Describe your reasoning, key indicators observed, or questions for the community..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          {err && <p className="text-xs font-semibold text-[#DC2626]">{err}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[#00D09C] hover:bg-[#00B386] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#00D09C]" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-[#00D09C]" />
                <span>Post Question</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */
export default function CommunityLeagues() {
  const { user, authConfig } = useAuth();
  const location = useLocation();

  /* leaderboard */
  const [leaderboard, setLeaderboard] = useState(null);
  const [ldLoading, setLdLoading] = useState(true);
  const [ldError, setLdError] = useState("");

  /* pro helpers */
  const [pros, setPros] = useState([]);
  const [prosLoading, setProsLoading] = useState(true);
  const [prosError, setProsError] = useState("");
  const [showAllPros, setShowAllPros] = useState(false);

  /* community questions */
  const [queries, setQueries] = useState([]);
  const [queriesTotal, setQueriesTotal] = useState(0);
  const [hasMoreQueries, setHasMoreQueries] = useState(false);
  const [queriesLoading, setQueriesLoading] = useState(true);
  const [loadingMoreQueries, setLoadingMoreQueries] = useState(false);
  const [queriesError, setQueriesError] = useState("");
  const [queryFilter, setQueryFilter] = useState("top_voted"); // "top_voted" | "unanswered" | "recent"
  const [expandedQuery, setExpandedQuery] = useState(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState({});
  const [submittingReply, setSubmittingReply] = useState(false);

  /* portfolio inspection panel */
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  /* conversations */
  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [convsError, setConvsError] = useState("");

  /* DM modal */
  const [messageTrader, setMessageTrader] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgSending, setMsgSending] = useState(false);
  const [msgError, setMsgError] = useState("");
  const messagesEndRef = useRef(null);

  const deepLinkHandled = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── data loaders ────────────────────────────────────────────────── */
  const loadLeaderboard = useCallback(async () => {
    if (!user) return;
    setLdLoading(true);
    setLdError("");
    try {
      const r = await axios.get(`${API}/community/leaderboard`, authConfig());
      setLeaderboard(r.data);
    } catch (ex) {
      setLdError(ex.response?.data?.detail || "Could not load leaderboard.");
      setLeaderboard(null);
    } finally {
      setLdLoading(false);
    }
  }, [user, authConfig]);

  const loadPros = useCallback(async () => {
    if (!user) return;
    setProsLoading(true);
    setProsError("");
    try {
      const r = await axios.get(`${API}/community/pros`, authConfig());
      setPros(r.data?.pros || []);
    } catch (ex) {
      setProsError("Could not load Pro Learners.");
      setPros([]);
    } finally {
      setProsLoading(false);
    }
  }, [user, authConfig]);

  const loadQueries = useCallback(async (reset = true, overrideFilter = null) => {
    if (!user) return;
    const activeFilter = overrideFilter || queryFilter;
    if (reset) {
      setQueriesLoading(true);
      setQueriesError("");
    }
    try {
      const r = await axios.get(`${API}/community/queries`, {
        params: { offset: 0, limit: 5, filter_by: activeFilter },
        ...authConfig(),
      });
      setQueries(r.data?.queries || []);
      setQueriesTotal(r.data?.total || 0);
      setHasMoreQueries(r.data?.has_more || false);
    } catch (ex) {
      setQueriesError("Could not load community questions.");
      setQueries([]);
    } finally {
      if (reset) setQueriesLoading(false);
    }
  }, [user, authConfig, queryFilter]);

  const handleLoadMoreQueries = async () => {
    if (loadingMoreQueries || !hasMoreQueries) return;
    setLoadingMoreQueries(true);
    try {
      const currentOffset = queries.length;
      const r = await axios.get(`${API}/community/queries`, {
        params: { offset: currentOffset, limit: 5, filter_by: queryFilter },
        ...authConfig(),
      });
      const newItems = r.data?.queries || [];
      // Deduplicate by ID
      setQueries((prev) => {
        const existingIds = new Set(prev.map((q) => q.id));
        const filteredNew = newItems.filter((q) => !existingIds.has(q.id));
        return [...prev, ...filteredNew];
      });
      setQueriesTotal(r.data?.total || 0);
      setHasMoreQueries(r.data?.has_more || false);
    } catch (ex) {
      console.error("Error loading more questions:", ex);
    } finally {
      setLoadingMoreQueries(false);
    }
  };

  const handleToggleUpvote = async (queryId) => {
    // Optimistic UI update
    setQueries((prev) =>
      prev.map((q) => {
        if (q.id === queryId) {
          const nextHasUpvoted = !q.has_upvoted;
          const delta = nextHasUpvoted ? 1 : -1;
          return {
            ...q,
            has_upvoted: nextHasUpvoted,
            upvotes: Math.max(0, (q.upvotes || 0) + delta),
          };
        }
        return q;
      })
    );

    try {
      const res = await axios.post(
        `${API}/community/queries/${queryId}/upvote`,
        {},
        authConfig()
      );
      // Sync with exact server count
      setQueries((prev) =>
        prev.map((q) => {
          if (q.id === queryId) {
            return {
              ...q,
              has_upvoted: res.data.has_upvoted,
              upvotes: res.data.upvotes,
            };
          }
          return q;
        })
      );
    } catch (err) {
      console.error("Upvote failed, reverting:", err);
      // Revert on error
      loadQueries(false);
    }
  };

  const handlePostReply = async (queryId) => {
    const text = (replyTextMap[queryId] || "").trim();
    if (!text || submittingReply) return;

    setSubmittingReply(true);
    try {
      const res = await axios.post(
        `${API}/community/reply`,
        {
          query_id: queryId,
          reply_text: text,
        },
        authConfig()
      );

      setQueries((prev) =>
        prev.map((q) => {
          if (q.id === queryId) {
            return {
              ...q,
              replies: res.data?.replies || q.replies,
              reply_count: (res.data?.replies || []).length,
              status: "RESOLVED",
            };
          }
          return q;
        })
      );

      setReplyTextMap((prev) => ({ ...prev, [queryId]: "" }));
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setConvsLoading(true);
    setConvsError("");
    try {
      const r = await axios.get(`${API}/community/conversations`, authConfig());
      setConversations(r.data?.conversations || []);
    } catch {
      setConvsError("Unable to load messages.");
      setConversations([]);
    } finally {
      setConvsLoading(false);
    }
  }, [user, authConfig]);

  /* initial load */
  useEffect(() => {
    loadLeaderboard();
    loadPros();
    loadQueries(true);
    loadConversations();
  }, [loadLeaderboard, loadPros, loadQueries, loadConversations]);

  /* deep-link ?user=<id> from DM notification */
  useEffect(() => {
    if (deepLinkHandled.current) return;
    if (ldLoading || convsLoading) return;
    const uid = new URLSearchParams(location.search).get("user");
    if (!uid) return;
    deepLinkHandled.current = true;
    const targetId = parseInt(uid, 10);
    if (isNaN(targetId)) return;
    const fromConv = conversations.find((c) => c.other_user_id === targetId);
    if (fromConv) {
      openMessageModal({ user_id: fromConv.other_user_id, name: fromConv.other_user_name });
      return;
    }
    const fromBoard = (leaderboard?.traders || []).find((t) => t.user_id === targetId);
    if (fromBoard) {
      openMessageModal({ user_id: fromBoard.user_id, name: fromBoard.name });
    }
  }, [ldLoading, convsLoading, location.search, conversations, leaderboard]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── portfolio inspection ────────────────────────────────────────── */
  const inspectTrader = async (trader) => {
    setInspectLoading(true);
    setSelectedTrader(null);
    try {
      const r = await axios.get(`${API}/community/traders/${trader.user_id}/portfolio`, authConfig());
      setSelectedTrader(r.data);
    } catch {
      setSelectedTrader(null);
    } finally {
      setInspectLoading(false);
    }
  };

  /* ── DM modal ────────────────────────────────────────────────────── */
  const openMessageModal = async (trader) => {
    setMessageTrader(trader);
    setMsgError("");
    setTypedMessage("");
    setMsgLoading(true);
    try {
      const r = await axios.get(`${API}/community/messages/${trader.user_id}`, authConfig());
      setMessages(r.data?.messages || []);
      loadConversations();
    } catch (ex) {
      setMsgError(ex.response?.data?.detail || "Failed to load conversation.");
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const closeMessageModal = () => {
    setMessageTrader(null);
    loadConversations();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = typedMessage.trim();
    if (!text || !messageTrader || msgSending) return;
    if (text.length > 2000) {
      setMsgError("Message cannot exceed 2000 characters.");
      return;
    }
    setMsgSending(true);
    setMsgError("");
    try {
      const r = await axios.post(
        `${API}/community/messages/send`,
        { receiver_id: messageTrader.user_id, message_text: text },
        authConfig()
      );
      setMessages((prev) => [...prev, r.data]);
      setTypedMessage("");
      loadConversations();
    } catch (ex) {
      setMsgError(ex.response?.data?.detail || "Failed to send message.");
    } finally {
      setMsgSending(false);
    }
  };

  /* ── derived ─────────────────────────────────────────────────────── */
  const traders = leaderboard?.traders || [];
  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
  const displayedPros = showAllPros ? pros : pros.slice(0, 3);

  const communityContext = {
    page: "community",
    selected_trader: selectedTrader ? {
      name: selectedTrader.name,
      tier: selectedTrader.tier,
      weekly_pnl: selectedTrader.weekly_pnl,
      win_rate: selectedTrader.win_rate,
      holdings: (selectedTrader.holdings || []).map((h) => ({
        symbol: h.symbol,
        quantity: h.quantity,
        current_value: h.current_value,
      })),
    } : null,
    leaderboard_preview: (leaderboard?.traders || []).slice(0, 5).map((t) => ({
      rank: t.rank,
      name: t.name,
      tier: t.tier,
      weekly_pnl: t.weekly_pnl,
      win_rate: t.win_rate,
      is_you: t.is_current_user,
    })),
  };

  /* ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 min-h-screen">
      <Navbar />
      <FlyingVidyaBot context={communityContext} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D09C]/10 text-[#00D09C] text-xs font-extrabold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" /> StockSikh Community
            </div>
            <h1 className="text-3xl font-black text-white">Community Hub</h1>
            <p className="text-sm text-slate-400 mt-1">
              Connect with fellow StockSikh learners and traders.
            </p>
          </div>
          <button
            onClick={() => setShowAskModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#00D09C] text-slate-950 font-bold text-sm hover:bg-[#00B386] transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#00D09C]" /> Ask a Question
          </button>
        </div>

        {/* ── 1. Pro Helpers ─────────────────────────────────────────── */}
        <section className="bg-[#0F172A] border border-white/[0.1] rounded-3xl border border-white/[0.08] p-6 shadow-xs">
          <SectionHeader
            icon={Star}
            title="Pro Helpers"
            subtitle="Registered StockSikh members with Pro status who help the community."
            action={
              pros.length > 3 && (
                <button
                  onClick={() => setShowAllPros(!showAllPros)}
                  className="text-xs font-bold text-[#00D09C] hover:text-[#00D09C] transition-colors cursor-pointer"
                >
                  {showAllPros ? "Show Fewer ←" : `More Pro Helpers (${pros.length}) →`}
                </button>
              )
            }
          />

          {prosLoading ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00D09C]" /> Loading Pro Learners…
            </div>
          ) : prosError ? (
            <div className="py-6 text-center text-xs font-semibold text-[#DC2626]">
              {prosError}{" "}
              <button onClick={loadPros} className="underline ml-1 cursor-pointer">Retry</button>
            </div>
          ) : pros.length === 0 ? (
            <EmptyState
              icon={Users}
              heading="No Pro Learners yet."
              sub="Pro members will appear here once users with Pro status join the platform."
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedPros.map((pro) => (
                  <div
                    key={pro.id}
                    className="rounded-2xl border border-white/[0.08] bg-[#0B0F17]/60 p-4 flex flex-col gap-3 hover:border-white/[0.15] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarBadge name={pro.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-extrabold text-sm text-white truncate">{pro.name}</p>
                          {pro.is_current_user && (
                            <span className="text-[10px] font-extrabold text-[#00D09C] px-1.5 py-0.5 rounded-full bg-[#00D09C]/10">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-[#00D09C]/10 text-[#00D09C] text-[10px] font-extrabold uppercase tracking-wider">
                            Pro Learner
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ID: #{pro.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {pro.specialization && (
                      <p className="text-xs text-slate-400 font-medium">
                        <span className="font-bold text-white">Focus: </span>{pro.specialization}
                      </p>
                    )}
                    {pro.bio && (
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{pro.bio}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      Win rate:{" "}
                      {pro.win_rate !== null && pro.win_rate !== undefined ? (
                        <span className="font-extrabold text-[#00D09C]">{pro.win_rate.toFixed(1)}%</span>
                      ) : (
                        <span className="text-slate-500 font-semibold italic">No closed trades</span>
                      )}
                    </p>

                    <div className="flex items-center gap-2 mt-auto pt-1">
                      <button
                        onClick={() => inspectTrader({ user_id: pro.id, name: pro.name })}
                        className="flex-1 py-2 rounded-xl border border-white/[0.08] bg-[#0F172A] border border-white/[0.1] text-xs font-bold text-slate-400 hover:bg-white/[0.08] hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Profile
                      </button>
                      {!pro.is_current_user && (
                        <button
                          onClick={() => openMessageModal({ user_id: pro.id, name: pro.name })}
                          className="flex-1 py-2 rounded-xl bg-[#00D09C]/10 text-[#00D09C] text-xs font-bold hover:bg-[#00D09C] hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Message
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pros.length > 3 && !showAllPros && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowAllPros(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00D09C] hover:underline transition-colors cursor-pointer"
                  >
                    <span>More Pro Helpers ({pros.length})</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 2. Community Questions ─────────────────────────────────── */}
        <section className="bg-[#0F172A] border border-white/[0.1] rounded-3xl border border-white/[0.08] p-6 shadow-xs">
          <SectionHeader
            icon={HelpCircle}
            title="Community Questions"
            subtitle="Explore real market doubts, trade analyses, and strategies."
            action={
              <button
                onClick={() => loadQueries(true)}
                disabled={queriesLoading}
                className="p-2 rounded-xl bg-[#1E293B]/60 text-slate-400 hover:text-[#00D09C] transition-colors cursor-pointer"
                title="Refresh questions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${queriesLoading ? "animate-spin" : ""}`} />
              </button>
            }
          />

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setQueryFilter("top_voted");
                loadQueries(true, "top_voted");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                queryFilter === "top_voted"
                  ? "bg-[#00D09C] text-[#07090E] shadow-[0_0_12px_rgba(0,208,156,0.3)]"
                  : "bg-[#111827] text-slate-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              🔥 Top Voted
            </button>
            <button
              onClick={() => {
                setQueryFilter("unanswered");
                loadQueries(true, "unanswered");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                queryFilter === "unanswered"
                  ? "bg-[#00D09C] text-[#07090E] shadow-[0_0_12px_rgba(0,208,156,0.3)]"
                  : "bg-[#111827] text-slate-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              ⏳ Needs an Answer
            </button>
            <button
              onClick={() => {
                setQueryFilter("recent");
                loadQueries(true, "recent");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                queryFilter === "recent"
                  ? "bg-[#00D09C] text-[#07090E] shadow-[0_0_12px_rgba(0,208,156,0.3)]"
                  : "bg-[#111827] text-slate-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              ✨ Recent
            </button>
          </div>

          {queriesLoading ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00D09C]" /> Loading questions…
            </div>
          ) : queriesError ? (
            <div className="py-6 text-center text-xs font-semibold text-[#DC2626]">
              {queriesError}{" "}
              <button onClick={() => loadQueries(true)} className="underline ml-1 cursor-pointer">Retry</button>
            </div>
          ) : queries.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#1E293B]/60 flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="w-6 h-6 text-[#CBD5E1]" />
              </div>
              <p className="text-sm font-bold text-white">No community questions found in this category.</p>
              <p className="text-xs text-slate-500 mt-1">Be the first to ask the community for insights.</p>
              <button
                onClick={() => setShowAskModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00D09C] text-[#07090E] font-bold text-xs hover:bg-[#00B386] transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Ask a Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {queries.map((q) => {
                  const isOpen = expandedQuery === q.id;
                  const replyText = replyTextMap[q.id] || "";
                  const isAnswered = (q.replies || []).length > 0 || q.status === "RESOLVED";
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-white/[0.08] bg-[#0B0F17]/60 overflow-hidden transition-all hover:border-white/[0.15]"
                    >
                      <div className="p-4 flex items-start gap-4">
                        {/* Upvote Button Block */}
                        <button
                          onClick={() => handleToggleUpvote(q.id)}
                          className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                            q.has_upvoted
                              ? "bg-[#00D09C]/10 border-[#00D09C] text-[#00D09C] shadow-xs"
                              : "bg-[#0F172A] border border-white/[0.08] text-slate-400 hover:border-white/[0.15] hover:text-white"
                          }`}
                          title={q.has_upvoted ? "Remove upvote" : "Upvote this question"}
                        >
                          <ArrowBigUp className={`w-5 h-5 ${q.has_upvoted ? "fill-[#00A67D]" : ""}`} />
                          <span className="text-xs font-extrabold mt-0.5">{q.upvotes || 0}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            Votes
                          </span>
                        </button>

                        {/* Question Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {q.stock_symbol && q.stock_symbol !== "GENERAL" ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#00D09C]/10 text-[#00D09C] text-[10px] font-extrabold uppercase tracking-wider">
                                {q.stock_symbol.replace(".NS", "")}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#1E293B]/60 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                                General Market Strategy
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              isAnswered
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}>
                              {isAnswered ? "Answered" : "Needs an answer"}
                            </span>
                          </div>

                          <h3
                            onClick={() => setExpandedQuery(isOpen ? null : q.id)}
                            className="font-extrabold text-sm text-white leading-snug cursor-pointer hover:text-[#00D09C] transition-colors"
                          >
                            {q.title}
                          </h3>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-1.5 flex-wrap">
                            <span>Asked by <b className="text-slate-400">{q.learner_name}</b></span>
                            <span>•</span>
                            <span>{q.created_at}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-slate-400">
                              <MessageCircle className="w-3.5 h-3.5" />
                              {(q.replies || []).length} {q.replies?.length === 1 ? "reply" : "replies"}
                            </span>
                          </div>
                        </div>

                        {/* Expand Toggle CTA */}
                        <button
                          onClick={() => setExpandedQuery(isOpen ? null : q.id)}
                          className="px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#111827] hover:bg-white/[0.06] text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer mt-1"
                        >
                          <span>{isOpen ? "Close" : "View Discussion"}</span>
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Expanded View with Full Details & Replies */}
                      {isOpen && (
                        <div className="px-5 pb-5 pt-3 space-y-4 border-t border-white/[0.08] bg-[#0F172A] border border-white/[0.1]">
                          <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Question Details
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                              {q.query_text}
                            </p>
                          </div>

                          {/* Replies List */}
                          <div className="space-y-2.5">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Replies ({(q.replies || []).length})
                            </h4>

                            {(q.replies || []).length === 0 ? (
                              <p className="text-xs text-slate-500 italic">No replies yet. Be the first to share an answer below.</p>
                            ) : (
                              <div className="space-y-2">
                                {q.replies.map((rep, ri) => (
                                  <div key={ri} className="p-3.5 rounded-xl bg-[#0B0F17]/60 border border-white/[0.08] text-xs">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="font-extrabold text-white">
                                        {rep.replier_name || rep.pro_name || "Community Member"}
                                      </span>
                                      {(rep.replier_role === "pro" || rep.pro_badge) && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-[#00D09C]/10 text-[#00D09C] text-[10px] font-extrabold">
                                          Pro Learner
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{rep.reply_text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Reply Form */}
                          <div className="pt-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) =>
                                  setReplyTextMap((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePostReply(q.id);
                                  }
                                }}
                                placeholder="Write a constructive reply or answer..."
                                className="flex-1 bg-[#0B0F17]/60 border border-white/[0.08] focus:border-[#00D09C] focus:bg-[#0F172A] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#94A3B8] outline-none transition-all"
                              />
                              <button
                                onClick={() => handlePostReply(q.id)}
                                disabled={!replyText.trim() || submittingReply}
                                className="px-3.5 py-2 rounded-xl bg-[#00D09C] hover:bg-[#00B386] text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                              >
                                {submittingReply ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5 text-[#00D09C]" />
                                    <span>Reply</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasMoreQueries && (
                <div className="text-center pt-2">
                  <button
                    onClick={handleLoadMoreQueries}
                    disabled={loadingMoreQueries}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/[0.08] bg-[#0B0F17]/60 hover:bg-white/[0.08] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {loadingMoreQueries ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00D09C]" />
                        <span>Loading questions…</span>
                      </>
                    ) : (
                      <span>Load More Questions ({queriesTotal - queries.length} remaining)</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 3. Messages / Recent Conversations ─────────────────────── */}
        <section className="bg-[#0F172A] border border-white/[0.1] rounded-3xl border border-white/[0.08] p-6 shadow-xs">
          <SectionHeader
            icon={MessageSquare}
            title={
              <span className="flex items-center gap-2">
                Recent Conversations
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00D09C] text-white text-[10px] font-extrabold shadow-sm">
                    {totalUnread} new
                  </span>
                )}
              </span>
            }
            subtitle="Your direct messages with Pro Learners and fellow traders."
            action={
              <button
                onClick={loadConversations}
                disabled={convsLoading}
                className="p-2 rounded-xl bg-[#1E293B]/60 text-slate-400 hover:text-[#00D09C] transition-colors cursor-pointer"
                title="Refresh messages"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${convsLoading ? "animate-spin" : ""}`} />
              </button>
            }
          />

          {convsLoading ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00D09C]" /> Loading messages…
            </div>
          ) : convsError ? (
            <div className="py-6 text-center text-xs font-semibold text-[#DC2626]">{convsError}</div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              heading="No conversations yet."
              sub="Use Message on a Pro Helper or trader to start a conversation."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {conversations.map((c) => {
                const unread = (c.unread_count || 0) > 0;
                return (
                  <div
                    key={c.other_user_id}
                    onClick={() => openMessageModal({ user_id: c.other_user_id, name: c.other_user_name })}
                    className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-2.5 transition-all ${
                      unread
                        ? "bg-[#00D09C]/10/40 border-[#00D09C] shadow-xs hover:bg-[#00D09C]/10/70"
                        : "bg-[#0B0F17]/60 border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-white/[0.1] border border-white/[0.08] text-[#00D09C] font-extrabold flex items-center justify-center text-xs shrink-0">
                          {(c.other_user_name || "?")[0]}
                        </div>
                        <span className="font-extrabold text-xs text-white truncate">{c.other_user_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {unread && (
                          <span className="w-5 h-5 rounded-full bg-[#00D09C] text-white text-[10px] font-black flex items-center justify-center">
                            {c.unread_count}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-500">{formatMessageDate(c.last_message_at)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 truncate font-medium">{c.last_message || "No messages yet"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 4. Trader Community & Leaderboard ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-[#0F172A] border border-white/[0.1] rounded-3xl border border-white/[0.08] p-6 shadow-xs">
            <SectionHeader
              icon={Trophy}
              title="Weekly Trader Leaderboard"
              subtitle={leaderboard ? `${leaderboard.week_start} – ${leaderboard.week_end} (Discipline P&L)` : "Real weekly P&L from registered traders."}
              action={
                <button onClick={loadLeaderboard} disabled={ldLoading} className="p-2 rounded-xl bg-[#1E293B]/60 text-slate-400 hover:text-[#00D09C] cursor-pointer" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${ldLoading ? "animate-spin" : ""}`} />
                </button>
              }
            />

            {ldLoading ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-400">Loading leaderboard…</div>
            ) : ldError ? (
              <div className="py-16 text-center text-sm font-semibold text-[#EB5B3C]">{ldError}</div>
            ) : traders.length === 0 ? (
              <EmptyState
                icon={Trophy}
                heading="No active traders this week"
                sub="Leaderboard updates as traders place trades during the week."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-3">Rank</th>
                      <th className="pb-3 px-3">Trader</th>
                      <th className="pb-3 px-3">Tier</th>
                      <th className="pb-3 px-3 text-right">Weekly P&amp;L</th>
                      <th className="pb-3 px-3 text-right">Win Rate</th>
                      <th className="pb-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {traders.map((trader) => (
                      <tr
                        key={trader.user_id}
                        className={`hover:bg-[#0B0F17]/60 transition-colors ${trader.is_current_user ? "bg-emerald-500/10" : ""}`}
                      >
                        <td className="py-4 px-3 font-black text-sm">
                          {trader.rank <= 3 ? (
                            <span className={`${trader.rank === 1 ? "text-[#F59E0B]" : trader.rank === 2 ? "text-slate-500" : "text-[#CD7C2F]"}`}>
                              #{trader.rank}
                            </span>
                          ) : `#${trader.rank}`}
                        </td>
                        <td className="py-4 px-3 font-extrabold text-sm">
                          {trader.name}
                          {trader.is_current_user && (
                            <span className="ml-2 text-[10px] font-extrabold text-[#00D09C] px-1.5 py-0.5 rounded-full bg-[#00D09C]/10">You</span>
                          )}
                        </td>
                        <td className="py-4 px-3 font-bold text-slate-400">{trader.tier}</td>
                        <td className={`py-4 px-3 text-right font-extrabold ${trader.weekly_pnl >= 0 ? "text-[#00D09C]" : "text-[#EB5B3C]"}`}>
                          {formatMoney(trader.weekly_pnl)}
                        </td>
                        <td className="py-4 px-3 text-right font-bold text-slate-400">
                          {trader.win_rate === null ? "—" : `${trader.win_rate.toFixed(1)}%`}
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => inspectTrader(trader)}
                              className="p-2 rounded-xl bg-[#1E293B]/60 hover:bg-[#00D09C]/10 hover:text-[#00D09C] text-slate-400 transition-colors cursor-pointer"
                              title="View portfolio"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!trader.is_current_user && (
                              <button
                                onClick={() => openMessageModal(trader)}
                                className="p-2 rounded-xl bg-[#1E293B]/60 hover:bg-[#00D09C]/10 hover:text-[#00D09C] text-slate-400 transition-colors cursor-pointer"
                                title={`Message ${trader.name}`}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {traders.length === 1 && (
                  <p className="mt-5 text-center text-xs font-semibold text-slate-400">
                    You're currently the only active trader this week.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Portfolio Inspection panel */}
          <aside>
            <div className="bg-[#0F172A] border border-white/[0.1] rounded-3xl border border-white/[0.08] p-6 shadow-xs">
              <h2 className="text-base font-extrabold text-white mb-4">Portfolio Inspection</h2>

              {inspectLoading ? (
                <div className="py-10 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00D09C]" /> Loading…
                </div>
              ) : selectedTrader ? (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <AvatarBadge name={selectedTrader.name} size="lg" />
                    <div>
                      <h3 className="font-extrabold text-sm">{selectedTrader.name}</h3>
                      <p className="text-xs text-slate-400">{selectedTrader.tier}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs mb-5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Weekly P&amp;L</span>
                      <b className={selectedTrader.weekly_pnl >= 0 ? "text-[#00D09C]" : "text-[#EB5B3C]"}>
                        {formatMoney(selectedTrader.weekly_pnl)}
                      </b>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Win Rate</span>
                      <b>{selectedTrader.win_rate === null ? "No closed trades" : `${selectedTrader.win_rate.toFixed(1)}%`}</b>
                    </div>
                  </div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Public Holdings</h4>
                  {(selectedTrader.holdings || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No current holdings available.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTrader.holdings.map((h) => (
                        <div key={h.symbol} className="p-3 rounded-xl bg-[#0B0F17]/60 border border-white/[0.08] text-xs">
                          <div className="flex justify-between font-bold">
                            <span>{h.symbol.replace(".NS", "")}</span>
                            <span>Qty {h.quantity}</span>
                          </div>
                          <div className="flex justify-between text-slate-400 mt-1">
                            <span>Value</span>
                            <span>₹{h.current_value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Trophy}
                  heading="No trader selected"
                  sub="Click the eye icon on any trader to inspect their public portfolio."
                />
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ── Ask Question Modal ────────────────────────────────────── */}
      {showAskModal && (
        <AskQuestionModal
          onClose={() => setShowAskModal(false)}
          onPosted={() => loadQueries(true)}
          authConfig={authConfig}
        />
      )}

      {/* ── DM Modal ─────────────────────────────────────────────── */}
      {messageTrader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-white/[0.1] rounded-3xl border border-white/[0.08] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[560px]">
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-[#0B0F17]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00D09C]/10 text-[#00D09C] font-black flex items-center justify-center text-base border border-[#00D09C]/30">
                  {(messageTrader.name || "?")[0]}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    {messageTrader.name}
                    <span className="w-2 h-2 rounded-full bg-[#00D09C]" />
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">{messageTrader.tier || "Trader"}</p>
                </div>
              </div>
              <button
                onClick={closeMessageModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#07090E]/80">
              {msgLoading ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00D09C]" /> Loading conversation…
                </div>
              ) : msgError ? (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-[#FEE2E2] text-xs font-semibold text-[#DC2626] text-center">
                  {msgError}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E293B]/60 flex items-center justify-center text-slate-500 mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-white">No messages yet</p>
                  <p className="text-[11px] mt-1 text-slate-500">Start the conversation with {messageTrader.name}.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const out = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${out ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed break-words shadow-sm ${
                        out ? "bg-[#00D09C] text-white rounded-br-sm" : "bg-[#1E293B]/60 text-white border border-white/[0.08] rounded-bl-sm"
                      }`}>
                        {m.message_text}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold mt-1 px-1">{formatTime(m.created_at)}</span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.06] bg-[#0F172A] border border-white/[0.1]">
              {msgError && !msgLoading && (
                <p className="text-[11px] font-semibold text-[#DC2626] mb-2 px-1">{msgError}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder={`Message ${messageTrader.name}…`}
                  maxLength={2000}
                  disabled={msgSending || msgLoading}
                  className="flex-1 bg-[#0B0F17]/60 border border-white/[0.08] focus:border-[#00D09C] focus:bg-[#0F172A] border border-white/[0.1] rounded-2xl px-4 py-3 text-xs text-white placeholder-[#94A3B8] outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!typedMessage.trim() || msgSending || msgLoading}
                  className="px-4 py-3 rounded-2xl bg-[#00D09C] hover:bg-[#00B386] text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  {msgSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5 text-[#00D09C]" /><span>Send</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
