import axios from "axios";
import type { ChatOptions, LLMProvider, VisionOptions } from "../types.js";

export function createOllamaProvider(baseUrl = "http://localhost:11434", model = "llama3.1"): LLMProvider {
  const client = axios.create({ baseURL: baseUrl, timeout: 120_000 });

  return {
    id: "ollama",
    async chat({ system, messages, temperature = 0.6 }: ChatOptions) {
      const { data } = await client.post("/api/chat", {
        model,
        stream: false,
        options: { temperature },
        messages: [{ role: "system", content: system }, ...messages],
      });
      return data.message?.content ?? "";
    },
    async vision({ system, prompt, imageBase64 }: VisionOptions) {
      const { data } = await client.post("/api/chat", {
        model,
        stream: false,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt, images: [imageBase64] },
        ],
      });
      return data.message?.content ?? "";
    },
  };
}
