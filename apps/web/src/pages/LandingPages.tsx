import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  url: string;
  created_at: string;
}

export default function LandingPages() {
  const [pages, setPages] = useState<LandingPage[]>([]);

  useEffect(() => {
    api.get("/landing-pages").then((r) => setPages(r.data.landingPages));
  }, []);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Landing Pages</h1>
      <p className="text-gray-500 mb-6">
        Se crean automáticamente cuando le pides a <b>Atlas</b> (en Marketing) que arme una página de venta. Estructura AIDA, con tus fotos reales y botón directo a WhatsApp.
      </p>
      <div className="space-y-3">
        {pages.map((p) => (
          <div key={p.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-gray-400">{p.url}</div>
            </div>
            <a href={p.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-violet-600">
              Ver página →
            </a>
          </div>
        ))}
        {pages.length === 0 && <div className="text-sm text-gray-400">Aún no tienes landing pages. Pídele a Atlas que te cree una.</div>}
      </div>
    </div>
  );
}
