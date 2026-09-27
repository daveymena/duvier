import type { LLMProvider } from "../llm/types.js";

export type ToolFn = (args: Record<string, any>) => Promise<unknown>;

export interface ToolCallLog {
  tool: string;
  args: Record<string, any>;
  result: unknown;
}

const ACTION_RE = /<action>([\s\S]*?)<\/action>/;

/**
 * Bucle de agente genérico y portable entre proveedores de IA (OpenAI, Claude,
 * Gemini, Ollama). El modelo puede responder texto normal para el cliente, o
 * pedir una herramienta con el formato:
 *   <action>{"tool": "nombre_herramienta", "args": { ... }}</action>
 * El resultado se reinyecta como contexto y se le vuelve a preguntar al modelo
 * hasta que responda texto plano (o se alcance el máximo de pasos).
 */
export async function runAgentLoop(opts: {
  llm: LLMProvider;
  system: string;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  tools: Record<string, ToolFn>;
  maxSteps?: number;
}): Promise<{ reply: string; toolCalls: ToolCallLog[] }> {
  const { llm, system, tools } = opts;
  const maxSteps = opts.maxSteps ?? 4;
  const messages = [...opts.history, { role: "user" as const, content: opts.userMessage }];
  const toolCalls: ToolCallLog[] = [];

  for (let step = 0; step < maxSteps; step++) {
    const raw = await llm.chat({ system, messages });
    const match = raw.match(ACTION_RE);
    if (!match) {
      return { reply: raw.trim(), toolCalls };
    }

    let action: { tool: string; args?: Record<string, any> };
    try {
      action = JSON.parse(match[1]);
    } catch {
      const cleaned = raw.replace(ACTION_RE, "").trim();
      return { reply: cleaned || "Perdón, ¿puedes repetir eso?", toolCalls };
    }

    const toolFn = tools[action.tool];
    let result: unknown;
    if (!toolFn) {
      result = { error: `Herramienta desconocida: ${action.tool}` };
    } else {
      try {
        result = await toolFn(action.args ?? {});
      } catch (err: any) {
        result = { error: err?.message ?? String(err) };
      }
    }
    toolCalls.push({ tool: action.tool, args: action.args ?? {}, result });

    messages.push({ role: "assistant", content: raw });
    messages.push({
      role: "user",
      content: `[resultado_herramienta:${action.tool}] ${JSON.stringify(result)}\n\nContinúa la conversación con el cliente de forma natural y breve, sin mostrar JSON ni nombres de herramientas. Si necesitas otra herramienta, usa otro bloque <action>.`,
    });
  }

  return { reply: "Dame un momento, ya te confirmo con más detalle.", toolCalls };
}
