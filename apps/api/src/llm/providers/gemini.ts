import axios from "axios";
import type { ChatOptions, LLMProvider, VisionOptions } from "../types.js";

export function createGeminiProvider(apiKey: string, model = "gemini-1.5-flash"): LLMProvider {
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  return {
    id: "gemini",
    async chat({ system, messages, temperature = 0.6, maxTokens = 700 }: ChatOptions) {
      const { data } = await axios.post(
        base,
        {
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        },
        { timeout: 60_000 }
      );
      return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    },
    async vision({ system, prompt, imageBase64, mimeType }: VisionOptions) {
      const { data } = await axios.post(
        base,
        {
          systemInstruction: { parts: [{ text: system }] },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }],
            },
          ],
          generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
        },
        { timeout: 60_000 }
      );
      return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    },
  };
}
