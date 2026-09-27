import { getLLMForBusiness } from "../../llm/index.js";
import { getBusiness } from "../../db/repos/businesses.js";
import { getSeller } from "../../db/repos/sellers.js";
import { listProducts } from "../../db/repos/products.js";
import { getContact } from "../../db/repos/contacts.js";
import { recentHistory } from "../../db/repos/conversations.js";
import { runAgentLoop } from "../toolLoop.js";
import { buildSofiaTools } from "./tools.js";

const TOOLS_DOC = `
Herramientas disponibles (usa <action>{"tool":"...","args":{...}}</action> cuando las necesites):
- buscar_producto {"query": string} → busca productos del catálogo por nombre/categoría.
- cotizar {"productId": string, "qty": number} → calcula el total de un producto.
- aplicar_cupon {"code": string} → valida un cupón de descuento.
- crear_pedido {"items": [{"productId": string, "qty": number}], "couponCode"?: string} → crea el pedido.
- generar_link_pago {"orderId": string, "metodo": "mercadopago"|"paypal"} → genera link de pago real.
- leer_comprobante {"imageUrl": string, "orderId"?: string} → analiza una foto de comprobante de pago.
- marcar_pagado {"orderId": string} → confirma el pago de un pedido.
- actualizar_etapa {"etapa": "nuevo"|"cotizado"|"negociando"|"pagado"|"cliente"|"perdido"} → actualiza el embudo del contacto.
`;

function buildSystemPrompt(businessId: string, sellerId?: string): string {
  const business = getBusiness(businessId);
  const seller = sellerId ? getSeller(sellerId) : undefined;
  const products = listProducts(businessId).slice(0, 15);
  const catalogText = products.length
    ? products.map((p) => `- ${p.name} · ${p.price} ${p.currency}${p.description ? ` — ${p.description}` : ""}`).join("\n")
    : "(El catálogo aún está vacío; invita al negocio a cargar productos desde el panel.)";

  return `Eres ${seller?.name ?? "Sofía"}, la vendedora de inteligencia artificial de "${business?.name ?? "este negocio"}".
Tono: ${seller?.tone ?? "amable y cercano"}. ${seller?.personality ?? ""}
Rubro del negocio: ${business?.industry ?? "no especificado"}.

Tu trabajo es atender por chat (WhatsApp, Messenger, Instagram o Telegram) exactamente como lo haría un vendedor humano excelente:
1. Presenta el producto que el cliente pide, resuelve dudas y maneja objeciones con empatía.
2. Da el precio solo cuando el cliente lo pida o cuando ya mostró interés real.
3. Cuando el cliente decida comprar, crea el pedido y genera el link de pago o explica las opciones (transferencia, contraentrega).
4. Si el cliente manda una imagen de comprobante, analízala con la herramienta correspondiente antes de confirmar el pago.
5. Sé breve (2-4 líneas), natural, y nunca inventes precios o productos que no estén en el catálogo.
6. Nunca muestres JSON, nombres de herramientas ni corchetes al cliente: solo texto natural.

Catálogo disponible:
${catalogText}

${TOOLS_DOC}`;
}

export async function handleSofiaMessage(opts: {
  businessId: string;
  contactId: string;
  conversationId: string;
  sellerId?: string;
  text: string;
}): Promise<{ reply: string; toolCalls: unknown[] }> {
  const llm = getLLMForBusiness(opts.businessId);
  const system = buildSystemPrompt(opts.businessId, opts.sellerId);
  const history = recentHistory(opts.conversationId, 12);
  const tools = buildSofiaTools(opts.businessId, opts.contactId);

  const { reply, toolCalls } = await runAgentLoop({
    llm,
    system,
    history,
    userMessage: opts.text,
    tools,
  });

  return { reply, toolCalls };
}
