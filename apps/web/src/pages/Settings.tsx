import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Field {
  key: string;
  label: string;
  group: string;
  secret?: boolean;
  configured: boolean;
}

const GROUP_LABELS: Record<string, string> = {
  ia: "🧠 Inteligencia Artificial",
  meta: "🔵 Meta Ads (Facebook + Instagram)",
  pagos: "💳 Pagos (MercadoPago / PayPal)",
  dropshipping: "📦 Dropshipping (WooCommerce / Dropi)",
};

export default function Settings() {
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  async function load() {
    const { data } = await api.get("/settings");
    setFields(data.fields);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    await api.post("/settings", { values });
    setValues({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  }

  const groups = Array.from(new Set(fields.map((f) => f.group)));

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Configuración</h1>
      <p className="text-gray-500 mb-6">
        Conecta tus propias llaves (BYOK). Se guardan cifradas y aisladas por negocio. Si no configuras un proveedor de IA, el sistema funciona en modo demo con respuestas de plantilla.
      </p>

      {groups.map((g) => (
        <section key={g} className="bg-white border rounded-xl p-5 mb-5">
          <h2 className="font-semibold mb-3">{GROUP_LABELS[g] ?? g}</h2>
          <div className="space-y-2">
            {fields
              .filter((f) => f.group === g)
              .map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500">{f.label}</label>
                  <input
                    type={f.secret ? "password" : "text"}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder={f.configured ? "•••••••• (ya configurado, escribe para reemplazar)" : "No configurado"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                </div>
              ))}
          </div>
        </section>
      ))}

      <button onClick={save} className="bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-lg">
        Guardar cambios
      </button>
      {saved && <span className="ml-3 text-emerald-600 text-sm">Guardado ✓</span>}
    </div>
  );
}
