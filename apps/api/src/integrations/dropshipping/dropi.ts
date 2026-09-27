import axios from "axios";
import { getCredential } from "../../db/credentials.js";

/**
 * Adaptador para Dropi (proveedor de dropshipping muy usado en LATAM).
 * Dropi no publica un API pública unificada para todos los países; este
 * adaptador queda listo para conectarse a su API/webhook privado en cuanto
 * el negocio tenga sus credenciales, sin bloquear el resto del sistema.
 */
export async function createDropiOrder(
  businessId: string,
  order: { productSku: string; qty: number; customerName: string; customerPhone: string; address: string; city: string }
) {
  const apiKey = getCredential(businessId, "DROPI_API_KEY");
  const baseUrl = getCredential(businessId, "DROPI_BASE_URL");
  if (!apiKey || !baseUrl) {
    return { available: false, note: "Configura DROPI_API_KEY y DROPI_BASE_URL en Configuración → Dropshipping." };
  }
  const { data } = await axios.post(
    `${baseUrl.replace(/\/$/, "")}/orders`,
    {
      sku: order.productSku,
      quantity: order.qty,
      customer: { name: order.customerName, phone: order.customerPhone, address: order.address, city: order.city },
      payment_type: "cod",
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  return { available: true, order: data };
}
