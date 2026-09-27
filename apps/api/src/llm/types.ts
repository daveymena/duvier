export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface VisionOptions {
  system: string;
  prompt: string;
  imageBase64: string;
  mimeType: string;
}

export interface LLMProvider {
  id: string;
  chat(opts: ChatOptions): Promise<string>;
  vision(opts: VisionOptions): Promise<string>;
}
