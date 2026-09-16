import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { API } from "../context/AuthContext";
import { Send, X, Sparkles, RefreshCw, Bot } from "lucide-react";

// Helper function to format raw markdown into clean React elements without asterisks
function formatChatMessage(content) {
  if (!content) return null;

  const lines = content.split("\n");

  return lines.map((line, lineIdx) => {
    let trimmed = line.trim();
    if (!trimmed) return <div key={lineIdx} className="h-2" />;

    const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ") || trimmed.startsWith("* ");
    if (isBullet) {
      trimmed = trimmed.replace(/^[•\-*]\s*/, "");
    }

    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    const formattedLine = parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const text = part.slice(2, -2);
        return (
          <strong key={partIdx} className="font-extrabold text-[#0F172A]">
            {text}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D09C] shrink-0 mt-1.5"></span>
          <span className="text-xs sm:text-sm text-[#334155] leading-relaxed flex-1">{formattedLine}</span>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="text-xs sm:text-sm text-[#334155] leading-relaxed my-1">
        {formattedLine}
      </p>
    );
  });
}

export default function FlyingVidyaBot() {
  const [open, setOpen] = useState(false);
  const [speechTip, setSpeechTip] = useState("");
  const [showBubble, setShowBubble] = useState(true);
  const location = useLocation();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am Vidya AI, your stock market quantitative analyst and mentor. Feel free to ask about any Indian stock, technical indicators (RSI, Moving Averages), or paper trading strategies!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let tip = "Market Intelligence is active. Ask me anything about Indian stocks!";
    if (location.pathname === "/portfolio") {
      tip = "💡 Tip: Complete onboarding tasks to earn virtual trading capital!";
    } else if (location.pathname.startsWith("/stock/")) {
      tip = "📊 Check out the technical indicators and AI composite health score for this stock!";
    } else if (location.pathname === "/pro-helpers") {
      tip = "🏆 Consult verified financial analysts or post a research question!";
    } else if (location.pathname === "/creators") {
      tip = "🌐 Discover verified top financial creators in multiple languages!";
    } else if (location.pathname === "/dashboard") {
      tip = "🚀 Explore AI Top Picks for stocks scoring above 80/100!";
    }

    setSpeechTip(tip);
    setShowBubble(true);
  }, [location.pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (text) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setMessages((m) => [...m, { role: "user", content: messageText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/chat/`, { message: messageText });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.data?.reply || "Unable to retrieve response at this moment." }
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Connection interrupted. Please try asking your question again!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Active Flying / Floating Animated Character Mascot */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto select-none animate-fly-roam">
          {/* Contextual Speech Bubble */}
          {showBubble && speechTip && (
            <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white text-xs font-semibold px-4 py-3 rounded-2xl rounded-br-none shadow-[0_15px_30px_rgba(0,0,0,0.3)] max-w-xs border border-[#00D09C]/40 animate-mascot-bob flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00D09C] shrink-0 animate-spin" />
                <span className="leading-snug">{speechTip}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBubble(false);
                }}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Flying Girl Character Avatar with Cyber Wings */}
          <div
            onClick={() => setOpen(true)}
            className="group cursor-pointer relative flex items-center gap-3 transition-transform duration-300 hover:scale-110 active:scale-95"
          >
            {/* Cyber Wings */}
            <div className="absolute -left-4 top-2 w-7 h-10 pointer-events-none animate-wing-flutter -scale-x-100">
              <svg viewBox="0 0 40 60" className="w-full h-full fill-[#00D09C]/60 filter drop-shadow-[0_0_8px_rgba(0,208,156,0.8)]">
                <path d="M 35 30 C 20 10, 5 20, 0 40 C 15 35, 25 45, 35 30 Z" />
              </svg>
            </div>
            <div className="absolute -right-4 top-2 w-7 h-10 pointer-events-none animate-wing-flutter">
              <svg viewBox="0 0 40 60" className="w-full h-full fill-[#00D09C]/60 filter drop-shadow-[0_0_8px_rgba(0,208,156,0.8)]">
                <path d="M 5 30 C 20 10, 35 20, 40 40 C 25 35, 15 45, 5 30 Z" />
              </svg>
            </div>

            {/* Glowing Aura Ring */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#00D09C] via-[#387ED1] to-[#00D09C] rounded-full blur-md opacity-70 group-hover:opacity-100 animate-pulse transition duration-500"></div>

            {/* Character Face / Body */}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] border-2 border-[#00D09C] shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Stylized AI Girl Character Art */}
              <svg viewBox="0 0 100 100" className="w-14 h-14 transition-transform duration-300 group-hover:scale-110">
                {/* Cyber Headset Band */}
                <path d="M 22 45 A 28 28 0 0 1 78 45" stroke="#00D09C" strokeWidth="5" fill="none" strokeLinecap="round" />
                <rect x="16" y="42" width="8" height="14" rx="4" fill="#00D09C" />
                <rect x="76" y="42" width="8" height="14" rx="4" fill="#00D09C" />

                {/* Hair */}
                <path d="M 24 45 C 24 22, 76 22, 76 45 C 76 56, 70 60, 68 52 C 65 32, 35 32, 32 52 C 30 60, 24 56, 24 45 Z" fill="#3B82F6" />
                <path d="M 32 30 C 45 20, 55 20, 68 30 C 60 26, 40 26, 32 30 Z" fill="#60A5FA" />

                {/* Face */}
                <circle cx="50" cy="54" r="22" fill="#FDE047" />
                <ellipse cx="50" cy="55" rx="20" ry="19" fill="#FEF08A" />

                {/* Cute Big Eyes */}
                <ellipse cx="42" cy="53" rx="3.5" ry="5" fill="#0F172A" />
                <circle cx="43" cy="51" r="1.5" fill="#FFFFFF" />

                <ellipse cx="58" cy="53" rx="3.5" ry="5" fill="#0F172A" />
                <circle cx="59" cy="51" r="1.5" fill="#FFFFFF" />

                {/* Blush */}
                <ellipse cx="38" cy="60" rx="3" ry="1.5" fill="#F87171" opacity="0.6" />
                <ellipse cx="62" cy="60" rx="3" ry="1.5" fill="#F87171" opacity="0.6" />

                {/* Cute Smile */}
                <path d="M 46 62 Q 50 67 54 62" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* Smart Glasses Glow */}
                <rect x="36" y="48" width="12" height="9" rx="3" fill="none" stroke="#00D09C" strokeWidth="1.5" />
                <rect x="52" y="48" width="12" height="9" rx="3" fill="none" stroke="#00D09C" strokeWidth="1.5" />
                <line x1="48" y1="52" x2="52" y2="52" stroke="#00D09C" strokeWidth="1.5" />

                {/* Sparkle */}
                <circle cx="76" cy="30" r="3" fill="#00D09C" className="animate-ping" />
              </svg>
            </div>

            {/* Status Online Green Dot */}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00D09C] border-2 border-[#0F172A] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            </span>
          </div>
        </div>
      )}

      {/* 3D Glassmorphic Chat Drawer */}
      {open && (
        <div
          data-testid="chat-widget"
          className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[450px] h-[620px] max-h-[85vh] bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_25px_60px_rgba(15,23,42,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white px-5 py-4 flex items-center justify-between border-b border-[#334155]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00D09C] to-[#387ED1] flex items-center justify-center text-white shadow-lg shrink-0">
                <Bot className="w-6 h-6 text-[#0F172A]" />
              </div>
              <div>
                <div className="font-heading font-extrabold text-sm text-white flex items-center gap-1.5">
                  Vidya AI Financial Mentor
                  <span className="w-2 h-2 rounded-full bg-[#00D09C] animate-pulse"></span>
                </div>
                <div className="text-[11px] text-[#94A3B8] font-medium">
                  Live Market Intelligence &amp; Quantitative Analysis
                </div>
              </div>
            </div>
            <button
              data-testid="chat-close-btn"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8FAFC]">
            {messages.map((m, i) => (
              <div
                key={i}
                data-testid={`chat-msg-${m.role}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
                    m.role === "user"
                      ? "bg-[#00D09C] text-[#0F172A] rounded-br-none font-bold"
                      : "bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-none font-normal"
                  }`}
                >
                  {m.role === "assistant" ? formatChatMessage(m.content) : m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-none px-4 py-3 text-xs font-semibold text-[#64748B] flex items-center gap-2 shadow-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00D09C]" />
                  Vidya is analyzing market data and formulating insights...
                </div>
              </div>
            )}

            {/* Quick Starter Prompts */}
            {messages.length === 1 && !loading && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-1">
                  Suggested Prompts:
                </div>
                {[
                  "How does stock market valuation and profit work?",
                  "Analyze Reliance Industries technical indicators",
                  "What is RSI and how do I trade overbought/oversold levels?",
                  "Explain Moving Averages and the Golden Cross"
                ].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => send(p)}
                    className="block w-full text-left text-xs font-semibold bg-white border border-[#E2E8F0] hover:border-[#00D09C] hover:bg-[#E8FAF4] rounded-xl px-3.5 py-2.5 transition-all text-[#0F172A] shadow-xs"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="border-t border-[#E2E8F0] p-3 bg-white flex gap-2"
          >
            <input
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Reliance, TCS, RSI, or portfolio strategies..."
              className="flex-1 rounded-full px-4 py-2.5 bg-[#F1F5F9] text-xs sm:text-sm text-[#0F172A] font-medium placeholder-[#94A3B8] outline-none focus:ring-2 focus:ring-[#00D09C]/40 transition-all"
            />
            <button
              data-testid="chat-send-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-[#00D09C] hover:bg-[#00B386] text-white flex items-center justify-center disabled:opacity-50 transition-colors shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
