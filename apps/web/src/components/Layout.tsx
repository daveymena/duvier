import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Panel", icon: "📊", end: true },
  { to: "/inbox", label: "Bandeja", icon: "💬" },
  { to: "/catalogo", label: "Catálogo", icon: "🛍️" },
  { to: "/vendedoras", label: "Vendedoras (Sofía)", icon: "🧑‍💼" },
  { to: "/marketing", label: "Marketing (Atlas)", icon: "🚀" },
  { to: "/landing-pages", label: "Landing Pages", icon: "🌐" },
  { to: "/canales", label: "Canales", icon: "🔌" },
  { to: "/configuracion", label: "Configuración", icon: "⚙️" },
];

export default function Layout() {
  const { business, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-5 border-b">
          <div className="text-xl font-extrabold text-violet-700">Duvier</div>
          <div className="text-xs text-gray-500 truncate">{business?.name ?? "Cargando..."}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-violet-50"
                }`
              }
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button onClick={logout} className="w-full text-sm text-gray-500 hover:text-red-600 py-2">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
