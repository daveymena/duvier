import axios from "axios";
import { getCredential } from "../../db/credentials.js";

/** Cliente REST mínimo para sincronizar catálogo/pedidos con una tienda WooCommerce. */
export function getWooClient(businessId: string) {
  const url = getCredential(businessId, "WOOCOMMERCE_URL");
  const key = getCredential(businessId, "WOOCOMMERCE_CONSUMER_KEY");
  const secret = getCredential(businessId, "WOOCOMMERCE_CONSUMER_SECRET");
  if (!url || !key || !secret) return null;
  return axios.create({ baseURL: `${url.replace(/\/$/, "")}/wp-json/wc/v3`, auth: { username: key, password: secret } });
}

export async function importWooProducts(businessId: string) {
  const client = getWooClient(businessId);
  if (!client) return { available: false, products: [], note: "Configura WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY y WOOCOMMERCE_CONSUMER_SECRET." };
  const { data } = await client.get("/products", { params: { per_page: 50 } });
  return { available: true, products: data };
}

export async function pushOrderToWoo(businessId: string, order: { items: { name: string; qty: number; price: number }[]; total: number; customerName?: string }) {
  const client = getWooClient(businessId);
  if (!client) return { available: false, note: "WooCommerce no está configurado." };
  const { data } = await client.post("/orders", {
    payment_method: "cod",
    payment_method_title: "Contraentrega",
    set_paid: false,
    billing: { first_name: order.customerName ?? "Cliente Duvier" },
    line_items: order.items.map((i) => ({ name: i.name, quantity: i.qty, total: String(i.price * i.qty) })),
  });
  return { available: true, order: data };
}
