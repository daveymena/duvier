import { runAgentLoop } from "../src/agents/toolLoop.js";
import type { LLMProvider } from "../src/llm/types.js";

// Proveedor falso que simula un modelo real pidiendo una herramienta y luego respondiendo.
let call = 0;
const fakeLLM: LLMProvider = {
  id: "fake",
  async chat() {
    call++;
    if (call === 1) {
      return `Claro, dejame revisar. <action>{"tool":"buscar_producto","args":{"query":"piano"}}</action>`;
    }
    return "¡Perfecto! Tenemos el Curso de Piano Desde Cero por $150.000 COP. ¿Quieres que te arme el pedido?";
  },
  async vision() {
    return "";
  },
};

async function main() {
  const result = await runAgentLoop({
    llm: fakeLLM,
    system: "eres un test",
    history: [],
    userMessage: "cuanto cuesta el piano?",
    tools: {
      async buscar_producto({ query }) {
        return { products: [{ nombre: "Curso Piano Desde Cero", precio: 150000 }] };
      },
    },
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.toolCalls.length !== 1) throw new Error("Se esperaba 1 tool call");
  if (result.reply.includes("<action>")) throw new Error("La respuesta final no debe contener JSON de acciones");
  console.log("\n✅ tool loop OK");
}

main();
