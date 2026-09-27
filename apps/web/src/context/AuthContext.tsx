import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";

interface Business {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  brand_voice?: string;
}

interface AuthContextValue {
  token: string | null;
  business: Business | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { businessName: string; industry?: string; email: string; password: string; name?: string }) => Promise<void>;
  logout: () => void;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("duvier_token"));
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshBusiness() {
    try {
      const { data } = await api.get("/business/me");
      setBusiness(data.business);
    } catch {
      setBusiness(null);
    }
  }

  useEffect(() => {
    (async () => {
      if (token) await refreshBusiness();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("duvier_token", data.token);
    setToken(data.token);
    await refreshBusiness();
  }

  async function register(payload: { businessName: string; industry?: string; email: string; password: string; name?: string }) {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("duvier_token", data.token);
    setToken(data.token);
    setBusiness(data.business);
  }

  function logout() {
    localStorage.removeItem("duvier_token");
    setToken(null);
    setBusiness(null);
  }

  return (
    <AuthContext.Provider value={{ token, business, loading, login, register, logout, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
