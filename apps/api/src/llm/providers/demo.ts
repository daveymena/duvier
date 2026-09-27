import type { ChatOptions, LLMProvider, VisionOptions } from "../types.js";

/**
 * Proveedor "demo": no llama a ninguna IA externa. Sirve para que toda la
 * plataforma (agentes, canales, panel) funcione de inmediato sin API keys,
 * mientras el negocio conecta sus credenciales reales en Configuración.
 */
export function createDemoProvider(): LLMProvider {
  return {
    id: "demo",
    async chat({ messages }: ChatOptions) {
      const last = messages[messages.length - 1]?.content?.toLowerCase() ?? "";
      if (last.includes("precio") || last.includes("cuesta") || last.includes("vale")) {
        return "¡Con gusto! Este es uno de nuestros productos más pedidos. Para darte el precio exacto necesito que me confirmes cuál te interesa (dime el nombre o mándame una captura). Mientras tanto, conecta una llave de IA real (OpenAI, Claude, Gemini u Ollama) en Configuración para respuestas más precisas. [modo demo]";
      }
      if (last.includes("hola") || last.trim().length < 6) {
        return "¡Hola! Soy tu vendedora IA (modo demo). Cuéntame qué producto te interesa y te ayudo a cotizar. Para respuestas con inteligencia artificial real, conecta tu proveedor de IA en el panel de Configuración.";
      }
      return "Gracias por tu mensaje. Estoy en modo demo (sin proveedor de IA conectado), así que respondo con plantillas básicas. Conecta OpenAI, Claude, Gemini u Ollama en Configuración → IA para activar respuestas inteligentes de verdad.";
    },
    async vision({ prompt }: VisionOptions) {
      return `No puedo analizar la imagen todavía porque no hay un proveedor de IA con visión conectado (modo demo). Conecta OpenAI, Claude o Gemini en Configuración para leer comprobantes de pago automáticamente. (Instrucción recibida: ${prompt.slice(0, 80)}...)`;
    },
  };
}
