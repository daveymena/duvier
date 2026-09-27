import { Router } from "express";
import { findChannelByExternalId } from "../../db/repos/channels.js";
import { handleInboundMessage, registerSender } from "../dispatch.js";
import { sendMetaMessage } from "../../integrations/metaGraph.js";

export const metaWebhookRouter = Router();

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "duvier-verify-token";

// Meta llama a GET para verificar el webhook cuando lo configuras en la app de Meta.
metaWebhookRouter.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Meta manda POST con los eventos de Messenger e Instagram (mismo formato "entry/messaging").
metaWebhookRouter.post("/", async (req, res) => {
  res.sendStatus(200); // Responder rápido siempre, Meta reintenta si no.
  try {
    const body = req.body;
    const isInstagram = body.object === "instagram";
    const channelType = isInstagram ? "instagram" : "messenger";

    for (const entry of body.entry ?? []) {
      const pageOrIgId = entry.id as string;
      const channel = findChannelByExternalId(channelType, pageOrIgId);
      if (!channel) {
        console.warn(`[meta-webhook] no hay negocio configurado para ${channelType} ${pageOrIgId}`);
        continue;
      }
      for (const event of entry.messaging ?? []) {
        const senderId = event.sender?.id;
        const text = event.message?.text;
        if (!senderId || !text || event.message?.is_echo) continue;
        await handleInboundMessage({
          businessId: channel.business_id,
          channel: channelType,
          externalId: senderId,
          text,
        });
      }
    }
  } catch (err) {
    console.error("[meta-webhook] error procesando evento:", err);
  }
});

registerSender("messenger", async (businessId, externalId, text) => {
  await sendMetaMessage(businessId, "messenger", externalId, text);
});

registerSender("instagram", async (businessId, externalId, text) => {
  await sendMetaMessage(businessId, "instagram", externalId, text);
});
