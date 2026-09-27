import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Seller {
  id: string;
  name: string;
  personality?: string;
  tone: string;
  active: number;
}

export default function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [form, setForm] = useState({ name: "", personality: "", tone: "amable y cercano" });

  async function load() {
    const { data } = await api.get("/sellers");
    setSellers(data.sellers);
  }

  useEffect(() => {
    load();
  }, []);

  async function addSeller(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/sellers", form);
    setForm({ name: "", personality: "", tone: "amable y cercano" });
    load();
  }

  async function removeSeller(id: string) {
    await api.delete(`/sellers/${id}`);
    load();
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Vendedoras IA</h1>
      <p className="text-gray-500 mb-6">Cada negocio puede tener varias "Sofías" con distinta personalidad, útil si atiendes distintas líneas de producto o marcas.</p>

      <div className="space-y-3 mb-8">
        {sellers.map((s) => (
          <div key={s.id} className="bg-white border rounded-xl p-4 flex justify-between items-start">
            <div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-gray-500">{s.tone}</div>
              {s.personality && <div className="text-sm text-gray-600 mt-1">{s.personality}</div>}
            </div>
            <button onClick={() => removeSeller(s.id)} className="text-xs text-red-500">
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={addSeller} className="bg-white border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold">Nueva vendedora</h3>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre (ej. Sofía, Valentina)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tono (ej. amable y cercano, directo y profesional)" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Personalidad / instrucciones extra" value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} />
        <button className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Crear vendedora</button>
      </form>
    </div>
  );
}
