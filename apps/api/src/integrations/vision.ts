import axios from "axios";
import { getLLMForBusiness } from "../llm/index.js";

/** Descarga una imagen (comprobante de pago) y la pasa al modelo de visión configurado. */
export async function readPaymentReceipt(businessId: string, imageUrl: string): Promise<string> {
  const llm = getLLMForBusiness(businessId);
  const { data, headers } = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const mimeType = (headers["content-type"] as string) || "image/jpeg";
  const base64 = Buffer.from(data).toString("base64");
  return llm.vision({
    system:
      "Eres un asistente que revisa comprobantes de pago (Nequi, Daviplata, transferencias bancarias, MercadoPago). Extrae: monto, fecha, entidad y número de referencia si existen. Indica claramente si el comprobante parece válido o sospechoso.",
    prompt: "Analiza este comprobante de pago y resume en 2-3 líneas los datos clave para que un vendedor lo apruebe.",
    imageBase64: base64,
    mimeType,
  });
}
