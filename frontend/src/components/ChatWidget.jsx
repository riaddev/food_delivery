import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, RotateCcw, Send, Sparkles, Trash2, X } from "lucide-react";
import { chatApi } from "../features/api/apiSlice";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=200&auto=format&fit=crop";

const HIDDEN_PATHS = [
  "/restaurant/dashboard",
  "/admin/dashboard",
  "/rider/dashboard",
  "/rider/setup",
  "/restaurant/setup",
];

const GREETING = {
  role: "assistant",
  text: "Hi! I'm Swift AI — your SwiftBite assistant. Ask me about dishes, restaurants or prices and I'll help you find something tasty!",
};

const QUICK_PROMPTS = [
  "Best biryani under ৳300?",
  "Cheap pizza near me?",
  "What should I try today?",
];

const STORAGE_KEY = "swiftai_chat_v1";
const MAX_HISTORY = 6;
const REQUEST_TIMEOUT_MS = 45000;

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [GREETING];
    // Keep only valid user/assistant turns, drop old error bubbles.
    const clean = parsed.filter(
      (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string"
    );
    return clean.length > 0 ? clean.slice(-20) : [GREETING];
  } catch {
    return [GREETING];
  }
}

// Minimal safe formatting: **bold** + bullet lines. No HTML injection.
function renderInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return (
        <strong key={i} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function renderMessage(text) {
  const lines = String(text).split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      return (
        <span key={i} className="block pl-3">
          • {renderInline(trimmed.slice(2))}
          {i < lines.length - 1 ? <br /> : null}
        </span>
      );
    }
    return (
      <span key={i}>
        {renderInline(line)}
        {i < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

export default function ChatWidget() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadPersisted);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const cancelledRef = useRef(false);
  const isHidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  // Persist conversation (user + assistant only) so refresh doesn't wipe it.
  useEffect(() => {
    try {
      const toSave = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // storage full / private mode — chat still works, just not persisted
    }
  }, [messages]);

  // Autofocus input when opened.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  if (isHidden) return null;

  const send = async (textOverride) => {
    const text = (typeof textOverride === "string" ? textOverride : input).trim();
    if (!text || loading) return;

    const history = messages
      .filter((m) => m.role !== "error")
      .slice(-MAX_HISTORY)
      .map(({ role, text: t }) => ({ role: role === "assistant" ? "assistant" : "user", text: t }));

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    cancelledRef.current = false;

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await chatApi.send(text, history, controller.signal);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.data.reply, dishes: res.data.dishes || [] },
      ]);
    } catch (err) {
      // User pressed ✕ to stop — just stop, don't show a red error bubble.
      if (cancelledRef.current || controller.signal.aborted) {
        if (!cancelledRef.current) {
          setMessages((prev) => [
            ...prev,
            { role: "error", text: "Taking too long — the request was stopped.", retryOf: text },
          ]);
        }
        return;
      }
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const serverReply = err.response?.data?.reply;
      let errorText;
      if (status === 429 || code === "upstream_rate_limited") {
        errorText = "You're chatting fast — wait a few seconds and try again.";
      } else if (status === 504 || code === "upstream_timeout") {
        errorText = "Swift AI is taking too long to answer. Please try a shorter question.";
      } else if (!err.response) {
        errorText = "Can't reach the server. Check your connection and that the backend is running.";
      } else {
        errorText = serverReply || "Something went wrong. Please try again.";
      }
      setMessages((prev) => [...prev, { role: "error", text: errorText, retryOf: text }]);
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  };

  const retry = (index) => {
    const failed = messages[index];
    if (!failed?.retryOf || loading) return;
    setMessages((prev) => prev.filter((_, i) => i !== index));
    send(failed.retryOf);
  };

  const cancel = () => {
    cancelledRef.current = true;
    abortRef.current?.abort();
  };

  const clearChat = () => {
    if (loading) return;
    setMessages([GREETING]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const showChips = messages.length <= 1 && !loading;

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex h-[480px] max-h-[70dvh] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-orange-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Bot size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">Swift AI</p>
                  <p className="text-xs leading-tight text-white/80">Always here to help</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="rounded-full p-1.5 transition hover:bg-white/20 disabled:opacity-40"
                  aria-label="Clear chat"
                  title="Clear chat"
                  disabled={loading || messages.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 transition hover:bg-white/20"
                  aria-label="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[85%] flex-col gap-2 ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-full whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-br-md bg-orange-500 text-white"
                          : msg.role === "error"
                            ? "rounded-bl-md border border-red-200 bg-red-50 text-red-600"
                            : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                      }`}
                    >
                      {renderMessage(msg.text)}
                      {msg.role === "error" && msg.retryOf && (
                        <button
                          onClick={() => retry(i)}
                          className="mt-2 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                        >
                          <RotateCcw size={12} /> Retry
                        </button>
                      )}
                    </div>

                    {msg.role === "assistant" && msg.dishes?.length > 0 && (
                      <div className="grid w-full max-w-full grid-cols-1 gap-1.5">
                        {msg.dishes.map((dish) => (
                          <button
                            key={dish.id}
                            onClick={() => {
                              if (!dish.restaurant_id) return;
                              const qs = dish.id
                                ? `/restaurants/${dish.restaurant_id}?dish=${dish.id}`
                                : `/restaurants/${dish.restaurant_id}`;
                              navigate(qs);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2 text-left transition hover:border-orange-300 hover:shadow-sm"
                          >
                            <img
                              src={dish.image_url || FALLBACK_IMG}
                              alt={dish.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = FALLBACK_IMG;
                              }}
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-gray-800">
                                {dish.name}
                              </span>
                              <span className="block truncate text-[11px] text-gray-500">
                                {dish.restaurant_name}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-bold text-orange-500">
                              {dish.price}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {showChips && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3">
                    {[0, 150, 300].map((delay) => (
                      <motion.span
                        key={delay}
                        className="h-1.5 w-1.5 rounded-full bg-orange-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: delay / 1000 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={loading ? "Waiting for Swift AI... (✕ to stop)" : "Ask about dishes or prices..."}
                  maxLength={1000}
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:bg-white"
                />
                {loading ? (
                  <button
                    type="button"
                    onClick={cancel}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white transition hover:bg-gray-900"
                    aria-label="Cancel request"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                )}
              </form>
              <p className="mt-1.5 text-center text-[10px] text-gray-400">
                Swift AI can make mistakes — please verify prices.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
        aria-label={open ? "Close Swift AI chat" : "Open Swift AI chat"}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </motion.button>
    </div>
  );
}
