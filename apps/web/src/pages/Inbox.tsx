import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

interface Conversation {
  id: string;
  contact_name?: string;
  contact_external_id: string;
  channel_type: string;
  funnel_stage: string;
  ai_enabled: number;
  last_message?: string;
  last_message_at: string;
}

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  sender: string;
  body?: string;
  created_at: string;
}

const CHANNEL_ICON: Record<string, string> = { whatsapp: "🟢", telegram: "✈️", messenger: "🔵", instagram: "📸" };

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const pollRef = useRef<number | null>(null);

  async function loadConversations() {
    const { data } = await api.get("/inbox/conversations");
    setConversations(data.conversations);
  }

  async function loadMessages(id: string) {
    const { data } = await api.get(`/inbox/conversations/${id}/messages`);
    setMessages(data.messages);
  }

  useEffect(() => {
    loadConversations();
    pollRef.current = window.setInterval(loadConversations, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId]);

  const active = conversations.find((c) => c.id === activeId);

  async function toggleAi() {
    if (!active) return;
    await api.post(`/inbox/conversations/${active.id}/ai`, { enabled: !active.ai_enabled });
    loadConversations();
  }

  async function send() {
    if (!activeId || !text.trim()) return;
    await api.post(`/inbox/conversations/${activeId}/reply`, { text });
    setText("");
    loadMessages(activeId);
  }

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b font-semibold">Bandeja de conversaciones</div>
        {conversations.length === 0 && <div className="p-4 text-sm text-gray-400">Aún no hay conversaciones. Conecta un canal para empezar.</div>}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`w-full text-left px-4 py-3 border-b hover:bg-violet-50 ${activeId === c.id ? "bg-violet-50" : ""}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">
                {CHANNEL_ICON[c.channel_type] ?? "💬"} {c.contact_name || c.contact_external_id}
              </span>
              <span className="text-[10px] uppercase text-gray-400">{c.funnel_stage}</span>
            </div>
            <div className="text-xs text-gray-500 truncate">{c.last_message}</div>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {active ? (
          <>
            <div className="p-4 border-b bg-white flex justify-between items-center">
              <div>
                <div className="font-semibold">{active.contact_name || active.contact_external_id}</div>
                <div className="text-xs text-gray-500">{active.channel_type}</div>
              </div>
              <button
                onClick={toggleAi}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  active.ai_enabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {active.ai_enabled ? "🤖 IA activa (Sofía)" : "🙋 Control manual"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-md px-3 py-2 rounded-2xl text-sm ${
                      m.direction === "outbound"
                        ? m.sender === "human"
                          ? "bg-blue-600 text-white"
                          : "bg-violet-600 text-white"
                        : "bg-white border"
                    }`}
                  >
                    {m.body}
                    <div className="text-[10px] opacity-70 mt-1">{m.sender === "ai" ? "Sofía (IA)" : m.sender === "human" ? "Tú" : ""}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-white flex gap-2">
              <input
                className="flex-1 border rounded-full px-4 py-2 text-sm"
                placeholder={active.ai_enabled ? "Escribe para tomar el control manual..." : "Responder manualmente..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button onClick={send} className="bg-violet-600 text-white rounded-full px-5 py-2 text-sm font-semibold">
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Selecciona una conversación</div>
        )}
      </div>
    </div>
  );
}
