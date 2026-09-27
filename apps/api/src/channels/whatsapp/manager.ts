import path from "node:path";
import fs from "node:fs";
import QRCode from "qrcode";
import pino from "pino";
import { upsertChannel, getChannel } from "../../db/repos/channels.js";
import { handleInboundMessage, registerSender } from "../dispatch.js";

const SESSIONS_DIR = process.env.SESSIONS_DIR || path.join(process.cwd(), "sessions", "whatsapp");
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// Un socket activo de Baileys por negocio (aislamiento multi-tenant).
const sockets = new Map<string, any>();
const logger = pino({ level: "silent" });

/** Conecta (o reconecta) la sesión de WhatsApp de un negocio. Genera QR si hace falta. */
export async function connectWhatsApp(businessId: string): Promise<void> {
  if (sockets.has(businessId)) return;

  const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = await import(
    "@whiskeysockets/baileys"
  );

  const authDir = path.join(SESSIONS_DIR, businessId);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  upsertChannel(businessId, "whatsapp", { status: "connecting" });

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
  });
  sockets.set(businessId, sock);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      const qrDataUrl = await QRCode.toDataURL(qr);
      upsertChannel(businessId, "whatsapp", { status: "connecting", meta: JSON.stringify({ qr: qrDataUrl }) });
    }
    if (connection === "open") {
      const number = sock.user?.id?.split(":")[0];
      upsertChannel(businessId, "whatsapp", { status: "connected", external_id: number, meta: JSON.stringify({}) });
      console.log(`[whatsapp] negocio ${businessId} conectado como ${number}`);
    }
    if (connection === "close") {
      sockets.delete(businessId);
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      upsertChannel(businessId, "whatsapp", { status: "disconnected" });
      if (shouldReconnect) {
        setTimeout(() => connectWhatsApp(businessId).catch(() => {}), 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const jid = msg.key.remoteJid as string;
      if (!jid || jid.endsWith("@g.us") || jid === "status@broadcast") continue;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        "";
      if (!text) continue;
      const name = msg.pushName || undefined;
      try {
        await handleInboundMessage({ businessId, channel: "whatsapp", externalId: jid, contactName: name, text });
      } catch (err) {
        console.error("[whatsapp] error procesando mensaje:", err);
      }
    }
  });
}

export async function disconnectWhatsApp(businessId: string) {
  const sock = sockets.get(businessId);
  if (sock) {
    try {
      await sock.logout();
    } catch {}
    sockets.delete(businessId);
  }
  upsertChannel(businessId, "whatsapp", { status: "disconnected" });
}

export function getWhatsAppStatus(businessId: string) {
  return getChannel(businessId, "whatsapp");
}

registerSender("whatsapp", async (businessId, externalId, text) => {
  const sock = sockets.get(businessId);
  if (!sock) throw new Error("WhatsApp no está conectado para este negocio");
  await sock.sendMessage(externalId, { text });
});

/** Al iniciar el servidor, reconecta automáticamente los negocios que ya tenían sesión guardada. */
export async function resumeAllWhatsAppSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) return;
  const businessIds = fs.readdirSync(SESSIONS_DIR).filter((f) => fs.statSync(path.join(SESSIONS_DIR, f)).isDirectory());
  for (const businessId of businessIds) {
    connectWhatsApp(businessId).catch((err) => console.error(`[whatsapp] no se pudo reanudar ${businessId}:`, err));
  }
}
