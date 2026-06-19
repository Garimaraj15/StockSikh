import React, {
  useEffect,
  useRef,
  useState
} from "react";import axios from "axios";
import { useAuth, API } from "../context/AuthContext";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";

const STARTER_PROMPTS = [
  "What is RSI in simple words?",
  "Explain Moving Average like I'm 12",
  "What does a BUY signal mean?",
  "Is RELIANCE a good stock for beginners?",
];

export default function ChatWidget() {
  const { user, authHeaders } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! 👋 I'm Vidya, your learning buddy. Ask me anything about the stock market — RSI, charts, signals, anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!user) return null;

  const send = async (text) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;
    setMessages((m) => [...m, { role: "user", content: messageText }]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(
  `${API}/chat`,
  {
    message: messageText
  },
  {
    headers: authHeaders()
  }
);
      setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          data-testid="chat-open-btn"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#1A3626] hover:bg-[#264F38] text-white rounded-full px-5 py-3.5 shadow-[0_10px_30px_rgba(26,54,38,0.3)] flex items-center gap-2 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Ask Vidya</span>
        </button>
      )}

      {open && (
        <div
          data-testid="chat-widget"
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[80vh] bg-white rounded-3xl border border-[#E5E3DB] shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#1A3626] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D96C5B] flex items-center justify-center font-heading font-semibold">
                V
              </div>
              <div>
                <div className="font-heading font-semibold">Vidya</div>
                <div className="text-xs text-[#A7D8B9]">Your stock-market tutor</div>
              </div>
            </div>
            <button
              data-testid="chat-close-btn"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-[#264F38] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9F8F6]">
            {messages.map((m, i) => (
              <div
                key={i}
                data-testid={`chat-msg-${m.role}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#1A3626] text-white rounded-br-sm"
                      : "bg-white border border-[#E5E3DB] text-[#1C1C1C] rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E5E3DB] rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-[#A1A1AA] flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                </div>
              </div>
            )}
            {messages.length === 1 && !loading && (
              <div className="pt-2 space-y-2">
                <div className="text-xs uppercase tracking-[0.1em] text-[#A1A1AA] px-1">
                  Try asking
                </div>
                {STARTER_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    data-testid={`chat-starter-${i}`}
                    onClick={() => send(p)}
                    className="block w-full text-left text-sm bg-white border border-[#E5E3DB] rounded-2xl px-3.5 py-2.5 hover:bg-[#F3F2ED] transition-colors text-[#1C1C1C]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-[#E5E3DB] p-3 bg-white flex gap-2"
          >
            <input
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about RSI, MA, signals…"
              className="flex-1 rounded-full px-4 py-2.5 bg-[#F3F2ED] text-sm text-[#1C1C1C] placeholder-[#A1A1AA] outline-none"
            />
            <button
              data-testid="chat-send-btn"
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-[#D96C5B] hover:bg-[#C85A4A] text-white flex items-center justify-center disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
