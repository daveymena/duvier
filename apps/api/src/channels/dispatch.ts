import { findOrCreateContact } from "../db/repos/contacts.js";
import { findOrCreateConversation, addMessage, getConversation } from "../db/repos/conversations.js";
import { ensureDefaultSeller } from "../db/repos/sellers.js";
import { handleSofiaMessage } from "../agents/sofia/index.js";

export type ChannelType = "whatsapp" | "telegram" | "messenger" | "instagram";

export interface OutboundSender {
  (businessId: string, externalId: string, text: string): Promise<void>;
}

const senders: Partial<Record<ChannelType, OutboundSender>> = {};

export function registerSender(channel: ChannelType, fn: OutboundSender) {
  senders[channel] = fn;
}

/** Envía manualmente por el canal indicado (usado por el panel cuando un humano toma el control). */
export async function sendViaChannel(channel: ChannelType, businessId: string, externalId: string, text: string) {
  const send = senders[channel];
  if (!send) throw new Error(`El canal ${channel} no está conectado`);
  await send(businessId, externalId, text);
}

/**
 * Punto único de entrada para CUALQUIER mensaje entrante de cualquier canal.
 * Crea/actualiza contacto y conversación, guarda el mensaje, y si la IA está
 * activa para esa conversación, la deja responder y envía la respuesta.
 */
export async function handleInboundMessage(opts: {
  businessId: string;
  channel: ChannelType;
  externalId: string;
  contactName?: string;
  text: string;
}) {
  const contact = findOrCreateContact(opts.businessId, opts.channel, opts.externalId, opts.contactName);
  const seller = ensureDefaultSeller(opts.businessId);
  const conversation = findOrCreateConversation(opts.businessId, contact.id, opts.channel, seller.id);

  addMessage(conversation.id, opts.businessId, "inbound", "contact", opts.text);

  const fresh = getConversation(conversation.id)!;
  if (!fresh.ai_enabled) {
    // Control manual: un humano tomó la conversación, la IA no responde.
    return { autoReplied: false };
  }

  const { reply } = await handleSofiaMessage({
    businessId: opts.businessId,
    contactId: contact.id,
    conversationId: conversation.id,
    sellerId: seller.id,
    text: opts.text,
  });

  addMessage(conversation.id, opts.businessId, "outbound", "ai", reply);

  const send = senders[opts.channel];
  if (send) {
    try {
      await send(opts.businessId, opts.externalId, reply);
    } catch (err) {
      console.error(`[dispatch] error enviando por ${opts.channel}:`, err);
    }
  }

  return { autoReplied: true, reply };
}
