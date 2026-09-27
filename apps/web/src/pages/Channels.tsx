import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface ChannelRow {
  id: string;
  type: string;
  external_id?: string;
  status: string;
  meta?: string;
}

export default function Channels() {
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [telegramToken, setTelegramToken] = useState("");
  const [msg, setMsg] = useState({ pageId: "", pageToken: "" });
  const [ig, setIg] = useState({ igBusinessId: "", pageToken: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function load() {
    const { data } = await api.get("/channels");
    setChannels(data.channels);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  function statusOf(type: string) {
    return channels.find((c) => c.type === type);
  }

  async function connectWhatsapp() {
    setBusy("whatsapp");
    await api.post("/channels/whatsapp/connect");
    setBusy(null);
  }

  async function connectTelegram(e: React.FormEvent) {
    e.preventDefault();
    setBusy("telegram");
    try {
      const { data } = await api.post("/channels/telegram/connect", { botToken: telegramToken });
      if (!data.ok) setNotice(data.error);
      else setNotice("¡Telegram conectado!");
    } finally {
      setBusy(null);
      load();
    }
  }

  async function connectMessenger(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/channels/messenger/connect", msg);
    setNotice("Messenger conectado. Configura el webhook en tu App de Meta apuntando a /webhooks/meta");
    load();
  }

  async function connectInstagram(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/channels/instagram/connect", ig);
    setNotice("Instagram conectado. Configura el webhook en tu App de Meta apuntando a /webhooks/meta");
    load();
  }

  const wa = statusOf("whatsapp");
  const waMeta = wa?.meta ? JSON.parse(wa.meta) : {};

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Canales</h1>
        <p className="text-gray-500">Conecta WhatsApp, Telegram, Messenger e Instagram. Cada negocio tiene su propia sesión aislada.</p>
        {notice && <div className="mt-3 bg-violet-50 text-violet-700 text-sm rounded-lg p-2">{notice}</div>}
      </div>

      <section className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">🟢 WhatsApp</h2>
          <StatusBadge status={wa?.status ?? "disconnected"} />
        </div>
        <p className="text-sm text-gray-500 mb-3">Conexión directa (sin depender de la aprobación de Meta) mediante código QR, igual que WhatsApp Web.</p>
        {wa?.status === "connected" ? (
          <div className="text-sm text-emerald-700">Conectado como {wa.external_id}</div>
        ) : waMeta.qr ? (
          <div className="flex flex-col items-center gap-2">
            <img src={waMeta.qr} alt="QR WhatsApp" className="w-48 h-48" />
            <span className="text-xs text-gray-500">Escanea con WhatsApp → Dispositivos vinculados</span>
          </div>
        ) : (
          <button onClick={connectWhatsapp} disabled={busy === "whatsapp"} className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            {busy === "whatsapp" ? "Generando QR..." : "Conectar WhatsApp"}
          </button>
        )}
      </section>

      <section className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">✈️ Telegram</h2>
          <StatusBadge status={statusOf("telegram")?.status ?? "disconnected"} />
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Crea un bot con <a className="underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a> y pega aquí el token.
        </p>
        <form onSubmit={connectTelegram} className="flex gap-2">
          <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Token del bot" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} />
          <button className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Conectar</button>
        </form>
      </section>

      <section className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">🔵 Messenger (Facebook)</h2>
          <StatusBadge status={statusOf("messenger")?.status ?? "disconnected"} />
        </div>
        <p className="text-sm text-gray-500 mb-3">Requiere una App de Meta con permisos de Messenger y el Page Access Token de tu página.</p>
        <form onSubmit={connectMessenger} className="grid grid-cols-2 gap-2">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Page ID" value={msg.pageId} onChange={(e) => setMsg({ ...msg, pageId: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Page Access Token" value={msg.pageToken} onChange={(e) => setMsg({ ...msg, pageToken: e.target.value })} />
          <button className="col-span-2 bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Conectar</button>
        </form>
      </section>

      <section className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">📸 Instagram</h2>
          <StatusBadge status={statusOf("instagram")?.status ?? "disconnected"} />
        </div>
        <p className="text-sm text-gray-500 mb-3">Requiere una cuenta de Instagram profesional vinculada a tu página de Facebook.</p>
        <form onSubmit={connectInstagram} className="grid grid-cols-2 gap-2">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Instagram Business ID" value={ig.igBusinessId} onChange={(e) => setIg({ ...ig, igBusinessId: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Page Access Token" value={ig.pageToken} onChange={(e) => setIg({ ...ig, pageToken: e.target.value })} />
          <button className="col-span-2 bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Conectar</button>
        </form>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    connected: "bg-emerald-100 text-emerald-700",
    connecting: "bg-amber-100 text-amber-700",
    disconnected: "bg-gray-100 text-gray-500",
    error: "bg-red-100 text-red-600",
  };
  const label: Record<string, string> = { connected: "Conectado", connecting: "Conectando...", disconnected: "Desconectado", error: "Error" };
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${map[status] ?? map.disconnected}`}>{label[status] ?? status}</span>;
}
