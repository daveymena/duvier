import axios from "axios";
import type { ChatOptions, LLMProvider, VisionOptions } from "../types.js";

export function createAnthropicProvider(apiKey: string, model = "claude-3-5-sonnet-20241022"): LLMProvider {
  const client = axios.create({
    baseURL: "https://api.anthropic.com/v1",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    timeout: 60_000,
  });

  return {
    id: "anthropic",
    async chat({ system, messages, temperature = 0.6, maxTokens = 700 }: ChatOptions) {
      const { data } = await client.post("/messages", {
        model,
        system,
        max_tokens: maxTokens,
        temperature,
        messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      });
      return data.content?.map((c: any) => c.text).join("") ?? "";
    },
    async vision({ system, prompt, imageBase64, mimeType }: VisionOptions) {
      const { data } = await client.post("/messages", {
        model,
        system,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      });
      return data.content?.map((c: any) => c.text).join("") ?? "";
    },
  };
}
