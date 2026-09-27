import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface Campaign {
  id: string;
  objective?: string;
  status: string;
  daily_budget?: number;
  copy?: string;
  meta_campaign_id?: string;
}

export default function Marketing() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "¡Hola! Soy Atlas 🚀. Decime algo como \"quiero anunciar mi producto X en Facebook e Instagram\" y me pongo a investigar y a armar la campaña." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadCampaigns() {
    const { data } = await api.get("/campaigns");
    setCampaigns(data.campaigns);
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: input };
    const history = messages;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/campaigns/atlas/chat", { message: userMsg.content, history });
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      loadCampaigns();
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", content: "Ups, tuve un error: " + (err?.response?.data?.error ?? err.message) }]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCampaign(c: Campaign) {
    const path = c.status === "activa" ? "pause" : "activate";
    try {
      await api.post(`/campaigns/${c.id}/${path}`);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "No se pudo cambiar el estado");
    }
    loadCampaigns();
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col border-r">
        <div className="p-4 border-b bg-white font-semibold">🚀 Atlas · tu agencia de marketing en un chat</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-lg px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-violet-600 text-white" : "bg-white border"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-gray-400">Atlas está trabajando...</div>}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 border-t bg-white flex gap-2">
          <input
            className="flex-1 border rounded-full px-4 py-2 text-sm"
            placeholder='Ej: "Quiero anunciar el curso de piano en Facebook"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} disabled={loading} className="bg-violet-600 text-white rounded-full px-5 py-2 text-sm font-semibold">
            Enviar
          </button>
        </div>
      </div>

      <div className="w-96 bg-white overflow-y-auto p-4">
        <h2 className="font-semibold mb-3">Campañas</h2>
        <div className="space-y-3">
          {campaigns.map((c) => {
            const copy = c.copy ? JSON.parse(c.copy) : {};
            return (
              <div key={c.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold uppercase text-gray-400">{c.status}</span>
                  {c.meta_campaign_id && (
                    <button onClick={() => toggleCampaign(c)} className="text-xs font-semibold text-violet-600">
                      {c.status === "activa" ? "Pausar" : "Activar"}
                    </button>
                  )}
                </div>
                <div className="font-medium text-sm">{copy.headline || "(sin título)"}</div>
                <div className="text-xs text-gray-500 line-clamp-3">{copy.primaryText}</div>
                {c.daily_budget && <div className="text-xs text-gray-400 mt-1">Presupuesto: ${c.daily_budget.toLocaleString("es-CO")}/día</div>}
              </div>
            );
          })}
          {campaigns.length === 0 && <div className="text-sm text-gray-400">Atlas aún no ha creado campañas.</div>}
        </div>
      </div>
    </div>
  );
}
