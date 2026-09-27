import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ businessName: "", industry: "", email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      nav("/");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-700 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-violet-700 mb-1">Crea tu negocio en Duvier</h1>
        <p className="text-sm text-gray-500 mb-6">Sofía vende por chat, Atlas hace tu marketing. Todo en un panel.</p>
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-2 mb-4">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre de tu negocio" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Rubro (ej. moda, cursos, restaurante)" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Tu nombre" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" type="email" placeholder="Correo" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" type="password" placeholder="Contraseña" value={form.password} onChange={(e) => set("password", e.target.value)} required />
          <button disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60">
            {loading ? "Creando..." : "Comenzar gratis"}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-violet-600 font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
