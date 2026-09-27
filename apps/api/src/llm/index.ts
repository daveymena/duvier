import { getCredential } from "../db/credentials.js";
import { createOpenAIProvider } from "./providers/openai.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createGeminiProvider } from "./providers/gemini.js";
import { createOllamaProvider } from "./providers/ollama.js";
import { createDemoProvider } from "./providers/demo.js";
import type { LLMProvider } from "./types.js";

/**
 * Fábrica multi-proveedor (BYOK). Cada negocio elige su proveedor de IA
 * (LLM_PROVIDER: openai | anthropic | gemini | ollama) y su propia llave.
 * Si no hay nada configurado, cae en modo demo para que el sistema nunca falle.
 */
export function getLLMForBusiness(businessId: string): LLMProvider {
  const provider = (getCredential(businessId, "LLM_PROVIDER") || "demo").toLowerCase();

  try {
    switch (provider) {
      case "openai": {
        const key = getCredential(businessId, "OPENAI_API_KEY");
        const model = getCredential(businessId, "OPENAI_MODEL") || "gpt-4o-mini";
        if (!key) return createDemoProvider();
        return createOpenAIProvider(key, model);
      }
      case "anthropic":
      case "claude": {
        const key = getCredential(businessId, "ANTHROPIC_API_KEY");
        const model = getCredential(businessId, "ANTHROPIC_MODEL") || "claude-3-5-sonnet-20241022";
        if (!key) return createDemoProvider();
        return createAnthropicProvider(key, model);
      }
      case "gemini":
      case "google": {
        const key = getCredential(businessId, "GEMINI_API_KEY");
        const model = getCredential(businessId, "GEMINI_MODEL") || "gemini-1.5-flash";
        if (!key) return createDemoProvider();
        return createGeminiProvider(key, model);
      }
      case "ollama": {
        const url = getCredential(businessId, "OLLAMA_BASE_URL") || "http://localhost:11434";
        const model = getCredential(businessId, "OLLAMA_MODEL") || "llama3.1";
        return createOllamaProvider(url, model);
      }
      default:
        return createDemoProvider();
    }
  } catch (err) {
    console.error("[llm] error creando proveedor, usando demo:", err);
    return createDemoProvider();
  }
}
