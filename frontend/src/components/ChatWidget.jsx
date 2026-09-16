import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API } from "../context/AuthContext";
import { Send, X, Sparkles, Bot, RefreshCw } from "lucide-react";

const STARTER_PROMPTS = [
  "What is RSI in simple words?",
  "How does 20-Day Moving Average work?",
  "What does a BUY signal really mean?",
  "Tell me about Reliance stock indicators"
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! 🙏 I'm Vidya, your AI stock mentor on StockSikh. Ask me any question about Indian stocks, technical indicators like RSI or Moving Averages, or signals!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

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
        { role: "assistant", content: res.data?.reply || "No response received." }
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I'm temporarily having trouble connecting to the mentor server. Please try asking again in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          data-testid="chat-open-btn"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-full px-5 py-3.5 shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 border border-[#00D09C]/40 group"
        >
          <div className="w-6 h-6 rounded-full bg-[#00D09C] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm text-white">Ask Vidya AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {open && (
        <div
          data-testid="chat-widget"
          className="fixed bottom-6 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00D09C] flex items-center justify-center text-white shadow">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                  Vidya AI Mentor
                  <span className="w-2 h-2 rounded-full bg-[#00D09C]"></span>
                </div>
                <div className="text-[11px] text-[#94A3B8] font-medium">
                  Indian Market Learning Companion
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

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8FAFC]">
            {messages.map((m, i) => (
              <div
                key={i}
                data-testid={`chat-msg-${m.role}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-[#00D09C] text-white rounded-br-none font-semibold shadow-sm"
                      : "bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-none font-medium shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-none px-4 py-3 text-xs font-semibold text-[#64748B] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00D09C]" />
                  Vidya is analyzing market logic...
                </div>
              </div>
            )}

            {/* Quick Starter Chips */}
            {messages.length === 1 && !loading && (
              <div className="pt-2 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-1">
                  Suggested Questions
                </div>
                {STARTER_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    data-testid={`chat-starter-${i}`}
                    onClick={() => send(p)}
                    className="block w-full text-left text-xs font-semibold bg-white border border-[#E2E8F0] hover:border-[#00D09C] hover:bg-[#E8FAF4] rounded-xl px-3.5 py-2.5 transition-all text-[#0F172A]"
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
              placeholder="Ask about RSI, MA, or any stock..."
              className="flex-1 rounded-full px-4 py-2.5 bg-[#F1F5F9] text-xs sm:text-sm text-[#0F172A] font-medium placeholder-[#94A3B8] outline-none focus:ring-2 focus:ring-[#00D09C]/30 transition-all"
            />
            <button
              data-testid="chat-send-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-[#00D09C] hover:bg-[#00B386] text-white flex items-center justify-center disabled:opacity-50 transition-colors shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
