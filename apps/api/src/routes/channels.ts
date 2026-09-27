import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { listChannels, upsertChannel } from "../db/repos/channels.js";
import { setCredential } from "../db/credentials.js";
import { connectWhatsApp, disconnectWhatsApp, getWhatsAppStatus } from "../channels/whatsapp/manager.js";
import { connectTelegram, disconnectTelegram } from "../channels/telegram/manager.js";

export const channelsRouter = Router();
channelsRouter.use(requireAuth);

channelsRouter.get("/", (req: AuthedRequest, res) => {
  res.json({ channels: listChannels(req.auth!.businessId) });
});

// --- WhatsApp (Baileys, sesión propia por negocio vía QR) ---
channelsRouter.post("/whatsapp/connect", async (req: AuthedRequest, res) => {
  await connectWhatsApp(req.auth!.businessId);
  res.json({ ok: true });
});

channelsRouter.get("/whatsapp/status", (req: AuthedRequest, res) => {
  res.json({ channel: getWhatsAppStatus(req.auth!.businessId) });
});

channelsRouter.post("/whatsapp/disconnect", async (req: AuthedRequest, res) => {
  await disconnectWhatsApp(req.auth!.businessId);
  res.json({ ok: true });
});

// --- Telegram (bot token propio del negocio) ---
channelsRouter.post("/telegram/connect", async (req: AuthedRequest, res) => {
  const { botToken } = req.body ?? {};
  if (!botToken) return res.status(400).json({ error: "botToken es obligatorio" });
  setCredential(req.auth!.businessId, "TELEGRAM_BOT_TOKEN", botToken);
  const result = await connectTelegram(req.auth!.businessId);
  res.json(result);
});

channelsRouter.post("/telegram/disconnect", async (req: AuthedRequest, res) => {
  await disconnectTelegram(req.auth!.businessId);
  res.json({ ok: true });
});

// --- Messenger / Instagram (vía Meta Graph API, requiere Page Token) ---
channelsRouter.post("/messenger/connect", (req: AuthedRequest, res) => {
  const { pageId, pageToken } = req.body ?? {};
  if (!pageId || !pageToken) return res.status(400).json({ error: "pageId y pageToken son obligatorios" });
  setCredential(req.auth!.businessId, "MESSENGER_PAGE_TOKEN", pageToken);
  setCredential(req.auth!.businessId, "FACEBOOK_PAGE_ID", pageId);
  upsertChannel(req.auth!.businessId, "messenger", { status: "connected", external_id: pageId });
  res.json({ ok: true });
});

channelsRouter.post("/instagram/connect", (req: AuthedRequest, res) => {
  const { igBusinessId, pageToken } = req.body ?? {};
  if (!igBusinessId || !pageToken) return res.status(400).json({ error: "igBusinessId y pageToken son obligatorios" });
  setCredential(req.auth!.businessId, "INSTAGRAM_PAGE_TOKEN", pageToken);
  setCredential(req.auth!.businessId, "INSTAGRAM_BUSINESS_ID", igBusinessId);
  upsertChannel(req.auth!.businessId, "instagram", { status: "connected", external_id: igBusinessId });
  res.json({ ok: true });
});
