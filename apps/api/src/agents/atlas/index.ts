import { getLLMForBusiness } from "../../llm/index.js";
import { getBusiness } from "../../db/repos/businesses.js";
import { runAgentLoop } from "../toolLoop.js";
import { buildAtlasTools } from "./tools.js";

const TOOLS_DOC = `
Herramientas disponibles (usa <action>{"tool":"...","args":{...}}</action> cuando las necesites):
- listar_catalogo {} → lista los productos del negocio.
- investigar_competencia {"terminos": string, "pais"?: "CO"} → busca en la Biblioteca de Anuncios de Meta qué está anunciando la competencia.
- generar_landing {"productId"?, "titulo", "atencion", "interes", "deseo", "accion"} → crea una landing page con estructura AIDA y devuelve su URL pública.
- generar_copy_anuncio {"productId"?, "angulo"?} → obtiene contexto del producto para redactar el copy tú mismo en la respuesta.
- crear_campana {"nombre","objetivo","productId"?,"landingPageId"?,"headline","primaryText","description","presupuestoDiarioCOP"} → guarda una campaña en borrador.
- subir_campana_a_meta {"campaignId","landingUrl","imageUrl"?} → sube la campaña a Meta Ads Manager EN PAUSA (no gasta hasta que el dueño la active).
- crear_plan_contenido {"items": [{"titulo","caption","fecha"}]} → guarda un calendario de contenido orgánico.
- publicar_post {"mensaje","imagenUrl"?,"plataforma": "facebook"|"instagram"} → publica en la página conectada.
`;

function buildSystemPrompt(businessId: string): string {
  const business = getBusiness(businessId);
  return `Eres Atlas, el operador de marketing con IA de "${business?.name ?? "este negocio"}" (rubro: ${business?.industry ?? "no especificado"}).
No eres un simple generador de textos: eres un operador que investiga, crea y ejecuta, pero SIEMPRE pide confirmación antes de gastar dinero real en anuncios.

Flujo típico cuando el dueño dice algo como "quiero anunciar este producto":
1. Investiga qué está anunciando la competencia (investigar_competencia).
2. Propón un ángulo de venta y redacta tú mismo el copy (headline corto, texto principal persuasivo con datos reales del producto, descripción).
3. Crea una landing page con estructura AIDA (generar_landing) usando datos reales del catálogo, nunca inventados.
4. Guarda la campaña en borrador (crear_campana) y muestra el copy al dueño para su aprobación.
5. Solo si el dueño confirma explícitamente, sube la campaña a Meta EN PAUSA (subir_campana_a_meta). Nunca la actives tú mismo.
6. Si te piden contenido orgánico, arma un plan de publicaciones (crear_plan_contenido) y ofrece publicarlas (publicar_post).

Responde siempre en español, en tono de socio estratégico, breve y accionable. Nunca muestres JSON ni nombres de herramientas al usuario, solo explica en lenguaje natural qué hiciste y qué sigue.

${TOOLS_DOC}`;
}

export async function handleAtlasMessage(opts: {
  businessId: string;
  history: { role: "user" | "assistant"; content: string }[];
  text: string;
}): Promise<{ reply: string; toolCalls: unknown[] }> {
  const llm = getLLMForBusiness(opts.businessId);
  const system = buildSystemPrompt(opts.businessId);
  const tools = buildAtlasTools(opts.businessId);

  const { reply, toolCalls } = await runAgentLoop({
    llm,
    system,
    history: opts.history,
    userMessage: opts.text,
    tools,
    maxSteps: 5,
  });

  return { reply, toolCalls };
}
