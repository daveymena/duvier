import axios from "axios";
import { getCredential } from "../../db/credentials.js";

async function getAccessToken(businessId: string): Promise<string | null> {
  const clientId = getCredential(businessId, "PAYPAL_CLIENT_ID");
  const secret = getCredential(businessId, "PAYPAL_CLIENT_SECRET");
  if (!clientId || !secret) return null;
  const base = getCredential(businessId, "PAYPAL_ENV") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const { data } = await axios.post(`${base}/v1/oauth2/token`, "grant_type=client_credentials", {
    auth: { username: clientId, password: secret },
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data.access_token as string;
}

export async function createPaypalOrder(
  businessId: string,
  opts: { amount: number; currency?: string; description: string }
) {
  const token = await getAccessToken(businessId);
  if (!token) return { available: false, link: null, note: "Conecta PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en Configuración → Pagos." };
  const base = getCredential(businessId, "PAYPAL_ENV") === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const { data } = await axios.post(
    `${base}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        { amount: { currency_code: opts.currency ?? "USD", value: opts.amount.toFixed(2) }, description: opts.description },
      ],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const approveLink = (data.links as any[]).find((l) => l.rel === "approve")?.href;
  return { available: true, link: approveLink as string, orderId: data.id as string };
}
