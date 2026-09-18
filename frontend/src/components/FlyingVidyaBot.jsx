import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { API } from "../context/AuthContext";
import { Send, X, Sparkles, RefreshCw, Bot, RotateCcw } from "lucide-react";

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
          <strong key={partIdx} className="font-extrabold text-white">
            {text}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D09C] shrink-0 mt-1.5 shadow-[0_0_6px_#00D09C]"></span>
          <span className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed flex-1">{formattedLine}</span>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed my-1">
        {formattedLine}
      </p>
    );
  });
}

export default function FlyingVidyaBot({ context } = {}) {
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
    } else if (location.pathname === "/community") {
      tip = "🏆 Consult verified Pro Learners or post a research question!";
    } else if (location.pathname === "/creators") {
      tip = "🌐 Discover verified top financial creators in multiple languages!";
    } else if (location.pathname === "/dashboard" || location.pathname === "/") {
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
      const res = await axios.post(`${API}/chat/`, {
        message: messageText,
        context: context || null
      });
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

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared! How can I help you analyze Indian stocks or trading strategies today?"
      }
    ]);
  };

  return (
    <>
      {/* Active Flying / Floating Animated Character Mascot */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto select-none animate-fly-roam">
          {/* Contextual Speech Bubble */}
          {showBubble && speechTip && (
            <div className="bg-[#0F172A]/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl rounded-br-none shadow-[0_15px_30px_rgba(0,0,0,0.6)] max-w-xs border border-[#00D09C]/40 animate-mascot-bob flex items-start justify-between gap-2.5 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00D09C] shrink-0 animate-spin" />
                <span className="leading-snug">{speechTip}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBubble(false);
                }}
                className="text-[#94A3B8] hover:text-white cursor-pointer"
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
                <path d="M 35 30 C 20 10, 5 20, 0 40 C 15 35, 25 45, 35 30 Z" />
              </svg>
            </div>

            {/* Character Head / Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#7C3AED] p-0.5 shadow-[0_0_25px_rgba(0,208,156,0.5)] relative border border-[#00D09C]">
              <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center overflow-hidden relative">
                {/* Stylized Anime-Inspired Mentor Face */}
                <div className="w-8 h-8 rounded-full bg-[#FFE4E6] relative flex flex-col items-center justify-center">
                  {/* Hair */}
                  <div className="absolute -top-1 w-9 h-4 bg-[#1E293B] rounded-t-full" />
                  {/* Eyes */}
                  <div className="flex gap-2 z-10 -mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00D09C] animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00D09C] animate-pulse" />
                  </div>
                  {/* Cyber Headset */}
                  <div className="absolute -right-1 top-2 w-2 h-3 bg-[#00D09C] rounded-r-md" />
                </div>
              </div>

              {/* Status Indicator */}
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00D09C] border-2 border-[#0F172A] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Vidya Chat Panel Drawer */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[580px] bg-[#0F172A]/95 rounded-3xl border border-white/[0.1] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#0B0F17] via-[#151D2C] to-[#0B0F17] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00D09C] to-[#7C3AED] text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(0,208,156,0.3)]">
                <Bot className="w-5 h-5 text-[#07090E]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-black text-sm text-white">
                    Vidya AI Mentor
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-[#00D09C] animate-pulse" />
                </div>
                <p className="text-[11px] text-[#94A3B8] font-medium">Quantitative Analyst &amp; Tutor</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={clearChat}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#94A3B8] hover:text-[#00D09C] hover:bg-white/[0.06] border border-white/[0.08] transition-colors cursor-pointer"
                title="Clear conversation history and start fresh"
                aria-label="Clear Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#07090E]/60">
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#00D09C] to-[#7C3AED] text-[#07090E] flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-black text-xs">
                      V
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-[#00D09C] text-[#07090E] font-semibold rounded-br-xs"
                        : "bg-[#1E293B]/80 text-[#E2E8F0] border border-white/[0.08] rounded-bl-xs"
                    }`}
                  >
                    {isUser ? m.content : formatChatMessage(m.content)}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#00D09C] to-[#7C3AED] text-[#07090E] flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
                  V
                </div>
                <div className="bg-[#1E293B]/80 border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-[#94A3B8] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00D09C]" />
                  <span>Vidya is analyzing market data...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Starter Chips */}
          <div className="p-2 px-3 bg-[#0B0F17] border-t border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => send("What is RSI and how is it calculated?")}
              className="text-[11px] font-semibold whitespace-nowrap px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#00D09C]/15 text-[#94A3B8] hover:text-[#00D09C] border border-white/[0.08] hover:border-[#00D09C]/30 transition-all cursor-pointer"
            >
              📊 Explain RSI
            </button>
            <button
              onClick={() => send("How does the Signal AI composite score work?")}
              className="text-[11px] font-semibold whitespace-nowrap px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#00D09C]/15 text-[#94A3B8] hover:text-[#00D09C] border border-white/[0.08] hover:border-[#00D09C]/30 transition-all cursor-pointer"
            >
              🧠 AI Composite Score
            </button>
            <button
              onClick={() => send("How do I manage risk in paper trading?")}
              className="text-[11px] font-semibold whitespace-nowrap px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#00D09C]/15 text-[#94A3B8] hover:text-[#00D09C] border border-white/[0.08] hover:border-[#00D09C]/30 transition-all cursor-pointer"
            >
              🛡️ Risk Management
            </button>
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-[#0B0F17] border-t border-white/[0.08] flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask Vidya anything about Indian stocks..."
              className="flex-1 bg-[#111827] border border-white/[0.1] focus:border-[#00D09C] focus:bg-[#151D2C] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#64748B] outline-none transition-all"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-2xl bg-[#00D09C] hover:bg-[#00B386] text-[#07090E] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,208,156,0.3)] shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
