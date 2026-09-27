import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Stats {
  funnel: Record<string, number>;
  revenue: number;
  messages30d: number;
  conversations: number;
}

const STAGE_LABELS: Record<string, string> = {
  nuevo: "Nuevos",
  cotizado: "Cotizados",
  negociando: "Negociando",
  pagado: "Pagados",
  cliente: "Clientes",
  perdido: "Perdidos",
};

export default function Dashboard() {
  const { business } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get("/business/stats").then((r) => setStats(r.data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Hola, {business?.name} 👋</h1>
      <p className="text-gray-500 mb-6">Así va tu negocio ahora mismo.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card title="Ingresos confirmados" value={`$${(stats?.revenue ?? 0).toLocaleString("es-CO")}`} color="bg-emerald-50 text-emerald-700" />
        <Card title="Conversaciones" value={String(stats?.conversations ?? 0)} color="bg-violet-50 text-violet-700" />
        <Card title="Mensajes (30 días)" value={String(stats?.messages30d ?? 0)} color="bg-blue-50 text-blue-700" />
        <Card title="Canales activos" value="WhatsApp · Messenger · Instagram · Telegram" color="bg-amber-50 text-amber-700" small />
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Embudo de ventas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <div key={key} className="border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-violet-700">{stats?.funnel?.[key] ?? 0}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-violet-50 border border-violet-200 rounded-xl p-6">
        <h2 className="font-semibold text-violet-800 mb-2">Próximos pasos sugeridos</h2>
        <ul className="text-sm text-violet-700 list-disc pl-5 space-y-1">
          <li>Conecta al menos un canal (WhatsApp, Telegram, Messenger o Instagram) en "Canales".</li>
          <li>Carga tu catálogo de productos para que Sofía pueda vender.</li>
          <li>Conecta tu proveedor de IA (OpenAI, Claude, Gemini u Ollama) en "Configuración".</li>
          <li>Habla con Atlas en "Marketing" para crear tu primera campaña.</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ title, value, color, small }: { title: string; value: string; color: string; small?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="text-xs font-medium opacity-80">{title}</div>
      <div className={small ? "text-sm font-semibold mt-1" : "text-2xl font-bold mt-1"}>{value}</div>
    </div>
  );
}
