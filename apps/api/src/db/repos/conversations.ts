import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface Conversation {
  id: string;
  business_id: string;
  contact_id: string;
  channel_type: string;
  seller_id?: string;
  ai_enabled: number;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  business_id: string;
  direction: "inbound" | "outbound";
  sender: "contact" | "ai" | "human" | "system";
  body?: string;
  media_url?: string;
  created_at: string;
}

export function findOrCreateConversation(
  businessId: string,
  contactId: string,
  channelType: string,
  sellerId?: string
): Conversation {
  const existing = get<Conversation>(
    `SELECT * FROM conversations WHERE business_id = $businessId AND contact_id = $contactId AND channel_type = $channelType`,
    { businessId, contactId, channelType }
  );
  if (existing) return existing;
  const id = newId("conv");
  run(
    `INSERT INTO conversations (id, business_id, contact_id, channel_type, seller_id) VALUES ($id, $businessId, $contactId, $channelType, $sellerId)`,
    { id, businessId, contactId, channelType, sellerId: sellerId ?? null }
  );
  return get<Conversation>(`SELECT * FROM conversations WHERE id = $id`, { id })!;
}

export function getConversation(id: string): Conversation | undefined {
  return get<Conversation>(`SELECT * FROM conversations WHERE id = $id`, { id });
}

export function setAiEnabled(id: string, enabled: boolean) {
  run(`UPDATE conversations SET ai_enabled = $enabled WHERE id = $id`, { id, enabled: enabled ? 1 : 0 });
}

export function touchConversation(id: string) {
  run(`UPDATE conversations SET last_message_at = datetime('now') WHERE id = $id`, { id });
}

export function listConversations(businessId: string): any[] {
  return all(
    `SELECT c.*, ct.name as contact_name, ct.external_id as contact_external_id, ct.funnel_stage,
            (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
     FROM conversations c
     JOIN contacts ct ON ct.id = c.contact_id
     WHERE c.business_id = $businessId
     ORDER BY c.last_message_at DESC`,
    { businessId }
  );
}

export function addMessage(
  conversationId: string,
  businessId: string,
  direction: "inbound" | "outbound",
  sender: Message["sender"],
  body?: string,
  mediaUrl?: string
): Message {
  const id = newId("msg");
  run(
    `INSERT INTO messages (id, conversation_id, business_id, direction, sender, body, media_url)
     VALUES ($id, $conversationId, $businessId, $direction, $sender, $body, $mediaUrl)`,
    { id, conversationId, businessId, direction, sender, body: body ?? null, mediaUrl: mediaUrl ?? null }
  );
  touchConversation(conversationId);
  return get<Message>(`SELECT * FROM messages WHERE id = $id`, { id })!;
}

export function listMessages(conversationId: string, limit = 50): Message[] {
  return all<Message>(
    `SELECT * FROM messages WHERE conversation_id = $conversationId ORDER BY created_at ASC LIMIT $limit`,
    { conversationId, limit }
  );
}

export function recentHistory(conversationId: string, limit = 12): { role: "user" | "assistant"; content: string }[] {
  const rows = listMessages(conversationId, limit).slice(-limit);
  return rows
    .filter((r) => r.body)
    .map((r) => ({ role: r.direction === "inbound" ? ("user" as const) : ("assistant" as const), content: r.body! }));
}
