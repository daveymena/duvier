import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { listCredentialKeys, setCredential, deleteCredential } from "../db/credentials.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

const KNOWN_KEYS = [
  { key: "LLM_PROVIDER", label: "Proveedor de IA (openai | anthropic | gemini | ollama)", group: "ia" },
  { key: "OPENAI_API_KEY", label: "OpenAI API Key", group: "ia", secret: true },
  { key: "OPENAI_MODEL", label: "Modelo OpenAI (ej. gpt-4o-mini)", group: "ia" },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic (Claude) API Key", group: "ia", secret: true },
  { key: "ANTHROPIC_MODEL", label: "Modelo Claude", group: "ia" },
  { key: "GEMINI_API_KEY", label: "Google Gemini API Key", group: "ia", secret: true },
  { key: "GEMINI_MODEL", label: "Modelo Gemini", group: "ia" },
  { key: "OLLAMA_BASE_URL", label: "URL de Ollama local", group: "ia" },
  { key: "OLLAMA_MODEL", label: "Modelo Ollama", group: "ia" },
  { key: "META_ADS_ACCESS_TOKEN", label: "Meta Marketing API - Access Token", group: "meta", secret: true },
  { key: "META_AD_ACCOUNT_ID", label: "Meta Ad Account ID (act_...)", group: "meta" },
  { key: "META_AD_LIBRARY_TOKEN", label: "Token para Biblioteca de Anuncios de Meta", group: "meta", secret: true },
  { key: "MERCADOPAGO_ACCESS_TOKEN", label: "MercadoPago Access Token", group: "pagos", secret: true },
  { key: "PAYPAL_CLIENT_ID", label: "PayPal Client ID", group: "pagos" },
  { key: "PAYPAL_CLIENT_SECRET", label: "PayPal Client Secret", group: "pagos", secret: true },
  { key: "PAYPAL_ENV", label: "PayPal entorno (sandbox | live)", group: "pagos" },
  { key: "WOOCOMMERCE_URL", label: "URL tienda WooCommerce", group: "dropshipping" },
  { key: "WOOCOMMERCE_CONSUMER_KEY", label: "WooCommerce Consumer Key", group: "dropshipping", secret: true },
  { key: "WOOCOMMERCE_CONSUMER_SECRET", label: "WooCommerce Consumer Secret", group: "dropshipping", secret: true },
  { key: "DROPI_API_KEY", label: "Dropi API Key", group: "dropshipping", secret: true },
  { key: "DROPI_BASE_URL", label: "Dropi Base URL", group: "dropshipping" },
];

settingsRouter.get("/", (req: AuthedRequest, res) => {
  const configured = new Set(listCredentialKeys(req.auth!.businessId));
  res.json({
    fields: KNOWN_KEYS.map((k) => ({ ...k, configured: configured.has(k.key) })),
  });
});

settingsRouter.post("/", (req: AuthedRequest, res) => {
  const values = req.body?.values as Record<string, string> | undefined;
  if (!values) return res.status(400).json({ error: "values es obligatorio" });
  for (const [key, value] of Object.entries(values)) {
    if (value === "" || value === null || value === undefined) {
      deleteCredential(req.auth!.businessId, key);
    } else {
      setCredential(req.auth!.businessId, key, value);
    }
  }
  res.json({ ok: true });
});
