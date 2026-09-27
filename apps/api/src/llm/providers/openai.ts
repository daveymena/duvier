import axios from "axios";
import type { ChatOptions, LLMProvider, VisionOptions } from "../types.js";

export function createOpenAIProvider(apiKey: string, model = "gpt-4o-mini"): LLMProvider {
  const client = axios.create({
    baseURL: "https://api.openai.com/v1",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    timeout: 60_000,
  });

  return {
    id: "openai",
    async chat({ system, messages, temperature = 0.6, maxTokens = 700 }: ChatOptions) {
      const { data } = await client.post("/chat/completions", {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [{ role: "system", content: system }, ...messages],
      });
      return data.choices?.[0]?.message?.content ?? "";
    },
    async vision({ system, prompt, imageBase64, mimeType }: VisionOptions) {
      const { data } = await client.post("/chat/completions", {
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            ],
          },
        ],
      });
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}
