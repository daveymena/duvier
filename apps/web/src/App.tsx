import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Catalog from "./pages/Catalog";
import Sellers from "./pages/Sellers";
import Channels from "./pages/Channels";
import Settings from "./pages/Settings";
import Marketing from "./pages/Marketing";
import LandingPages from "./pages/LandingPages";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="catalogo" element={<Catalog />} />
            <Route path="vendedoras" element={<Sellers />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="landing-pages" element={<LandingPages />} />
            <Route path="canales" element={<Channels />} />
            <Route path="configuracion" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
