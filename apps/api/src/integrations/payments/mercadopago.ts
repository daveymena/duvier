import axios from "axios";
import { getCredential } from "../../db/credentials.js";

export async function createMercadoPagoLink(
  businessId: string,
  opts: { title: string; quantity: number; unitPrice: number; currency?: string; externalReference: string }
) {
  const accessToken = getCredential(businessId, "MERCADOPAGO_ACCESS_TOKEN");
  if (!accessToken) {
    return { available: false, link: null, note: "Conecta MERCADOPAGO_ACCESS_TOKEN en Configuración → Pagos." };
  }
  const { data } = await axios.post(
    "https://api.mercadopago.com/checkout/preferences",
    {
      items: [
        {
          title: opts.title,
          quantity: opts.quantity,
          currency_id: opts.currency ?? "COP",
          unit_price: opts.unitPrice,
        },
      ],
      external_reference: opts.externalReference,
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return { available: true, link: data.init_point as string, preferenceId: data.id as string };
}
