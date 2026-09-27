import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image_url?: string;
}

interface Coupon {
  id: string;
  code: string;
  percent_off?: number;
  amount_off?: number;
}

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", image_url: "" });
  const [couponForm, setCouponForm] = useState({ code: "", percentOff: "" });

  async function load() {
    const [p, c] = await Promise.all([api.get("/catalog/products"), api.get("/catalog/coupons")]);
    setProducts(p.data.products);
    setCoupons(c.data.coupons);
  }

  useEffect(() => {
    load();
  }, []);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/catalog/products", { ...form, price: Number(form.price) || 0 });
    setForm({ name: "", description: "", price: "", image_url: "" });
    load();
  }

  async function removeProduct(id: string) {
    await api.delete(`/catalog/products/${id}`);
    load();
  }

  async function addCoupon(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/catalog/coupons", { code: couponForm.code, percentOff: Number(couponForm.percentOff) || undefined });
    setCouponForm({ code: "", percentOff: "" });
    load();
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Catálogo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-3">Productos ({products.length})</h2>
          <div className="space-y-2 mb-6">
            {products.map((p) => (
              <div key={p.id} className="bg-white border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-violet-700 text-sm">${p.price.toLocaleString("es-CO")}</span>
                  <button onClick={() => removeProduct(p.id)} className="text-xs text-red-500">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && <div className="text-sm text-gray-400">Aún no tienes productos.</div>}
          </div>

          <form onSubmit={addProduct} className="bg-white border rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-2">Agregar producto</h3>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Precio (COP)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="URL de imagen (opcional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <button className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Agregar</button>
          </form>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Cupones</h2>
          <div className="space-y-2 mb-4">
            {coupons.map((c) => (
              <div key={c.id} className="bg-white border rounded-lg p-3 text-sm flex justify-between">
                <span className="font-mono font-semibold">{c.code}</span>
                <span>{c.percent_off ? `${c.percent_off}% off` : c.amount_off ? `-$${c.amount_off}` : ""}</span>
              </div>
            ))}
            {coupons.length === 0 && <div className="text-sm text-gray-400">Sin cupones aún.</div>}
          </div>
          <form onSubmit={addCoupon} className="bg-white border rounded-xl p-4 space-y-2">
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Código (ej. VERANO20)" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} required />
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="% de descuento" value={couponForm.percentOff} onChange={(e) => setCouponForm({ ...couponForm, percentOff: e.target.value })} />
            <button className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Crear cupón</button>
          </form>
        </div>
      </div>
    </div>
  );
}
