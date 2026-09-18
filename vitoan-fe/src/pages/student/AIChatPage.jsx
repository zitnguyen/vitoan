import { useEffect, useRef, useState } from "react";
import { Send, Mic, Plus, Trash2, MessageCircle } from "lucide-react";
import { chatService } from "../../api/services";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

function useSpeechRecognition(onResult) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  function start() {
    if (!supported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => onResult(e.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  return { supported, listening, start, stop };
}

export default function AIChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const bottomRef = useRef(null);

  const { supported: micSupported, listening, start, stop } = useSpeechRecognition((text) =>
    setInput((prev) => (prev ? `${prev} ${text}` : text))
  );

  function loadList() {
    return chatService.list().then((res) => {
      setConversations(res.data);
      setLoadingList(false);
    });
  }

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openConversation(id) {
    setActiveId(id);
    setError("");
    chatService.getOne(id).then((res) => setMessages(res.data.messages));
  }

  function newConversation() {
    setActiveId(null);
    setMessages([]);
    setError("");
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, _id: `tmp-${Date.now()}` }]);
    try {
      const res = await chatService.send(activeId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply, _id: `tmp-a-${Date.now()}` }]);
      if (!activeId) setActiveId(res.data.conversationId);
      await loadList();
    } catch (err) {
      setError(err.apiMessage || "Không thể gửi tin nhắn lúc này");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id) {
    await chatService.remove(id);
    if (activeId === id) newConversation();
    await loadList();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <div className="rounded-3xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100">
          <button
            type="button"
            onClick={newConversation}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" /> Cuộc trò chuyện mới
          </button>
          <div className="mt-3 space-y-1">
            {loadingList ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-3 text-caption text-slate-400">Chưa có cuộc trò chuyện nào.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c._id}
                  className={cn(
                    "group flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm",
                    activeId === c._id ? "bg-primary/10 text-primary font-bold" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <button type="button" onClick={() => openConversation(c._id)} className="flex-1 truncate text-left">
                    {c.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c._id)}
                    className="shrink-0 text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-3xl bg-white shadow-elevation-1 ring-1 ring-slate-100">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
            <OwlMascot className="h-9 w-9" animated={false} />
            <div>
              <p className="font-display font-bold text-slate-800">Bạn đồng hành</p>
              <p className="text-caption text-slate-400">Trợ lý học tập AI của ViToan</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ minHeight: 360, maxHeight: 480 }}>
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                <MessageCircle className="h-8 w-8" />
                <p className="text-caption">Hỏi mình bất cứ điều gì về bài học nhé!</p>
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={m._id || idx} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user" ? "bg-primary text-white" : "bg-slate-100 text-slate-700"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-400">Đang trả lời...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <p className="px-5 text-caption text-red-600">{error}</p>}

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
            {micSupported && (
              <button
                type="button"
                onClick={() => (listening ? stop() : start())}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition",
                  listening ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của em..."
              className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
