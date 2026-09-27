import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { addMessage, getConversation, listConversations, listMessages, setAiEnabled } from "../db/repos/conversations.js";
import { getContact } from "../db/repos/contacts.js";
import type { ChannelType } from "../channels/dispatch.js";

export const inboxRouter = Router();
inboxRouter.use(requireAuth);

inboxRouter.get("/conversations", (req: AuthedRequest, res) => {
  res.json({ conversations: listConversations(req.auth!.businessId) });
});

inboxRouter.get("/conversations/:id/messages", (req: AuthedRequest, res) => {
  res.json({ messages: listMessages(req.params.id, 200) });
});

// Control manual: pausar/reanudar a la IA en una conversación puntual.
inboxRouter.post("/conversations/:id/ai", (req: AuthedRequest, res) => {
  const { enabled } = req.body ?? {};
  setAiEnabled(req.params.id, Boolean(enabled));
  res.json({ ok: true });
});

// Un humano del equipo toma el control y responde manualmente por el mismo canal.
inboxRouter.post("/conversations/:id/reply", async (req: AuthedRequest, res) => {
  const { text } = req.body ?? {};
  const conversation = getConversation(req.params.id);
  if (!conversation || conversation.business_id !== req.auth!.businessId) {
    return res.status(404).json({ error: "Conversación no encontrada" });
  }
  const contact = getContact(conversation.contact_id);
  addMessage(conversation.id, req.auth!.businessId, "outbound", "human", text);

  const { sendViaChannel } = await import("../channels/dispatch.js");
  try {
    await sendViaChannel(conversation.channel_type as ChannelType, req.auth!.businessId, contact!.external_id, text);
  } catch (err: any) {
    return res.json({ ok: true, warning: `Mensaje guardado pero no se pudo enviar por el canal: ${err.message}` });
  }
  res.json({ ok: true });
});
