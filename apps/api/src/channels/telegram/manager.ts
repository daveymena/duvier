import { Telegraf } from "telegraf";
import { upsertChannel, getChannel } from "../../db/repos/channels.js";
import { getCredential } from "../../db/credentials.js";
import { handleInboundMessage, registerSender } from "../dispatch.js";

const bots = new Map<string, Telegraf>();

export async function connectTelegram(businessId: string): Promise<{ ok: boolean; error?: string }> {
  if (bots.has(businessId)) return { ok: true };
  const token = getCredential(businessId, "TELEGRAM_BOT_TOKEN");
  if (!token) return { ok: false, error: "Falta TELEGRAM_BOT_TOKEN en Configuración → Canales." };

  const bot = new Telegraf(token);

  bot.on("text", async (ctx) => {
    try {
      await handleInboundMessage({
        businessId,
        channel: "telegram",
        externalId: String(ctx.chat.id),
        contactName: [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") || ctx.from?.username,
        text: ctx.message.text,
      });
    } catch (err) {
      console.error("[telegram] error procesando mensaje:", err);
    }
  });

  try {
    const me = await bot.telegram.getMe();
    upsertChannel(businessId, "telegram", { status: "connected", external_id: me.username });
    bot.launch().catch((err) => console.error("[telegram] launch error:", err));
    bots.set(businessId, bot);
    return { ok: true };
  } catch (err: any) {
    upsertChannel(businessId, "telegram", { status: "error" });
    return { ok: false, error: err?.message ?? "Token inválido" };
  }
}

export async function disconnectTelegram(businessId: string) {
  const bot = bots.get(businessId);
  if (bot) {
    bot.stop("manual");
    bots.delete(businessId);
  }
  upsertChannel(businessId, "telegram", { status: "disconnected" });
}

export function getTelegramStatus(businessId: string) {
  return getChannel(businessId, "telegram");
}

registerSender("telegram", async (businessId, externalId, text) => {
  const bot = bots.get(businessId);
  if (!bot) throw new Error("Telegram no está conectado para este negocio");
  await bot.telegram.sendMessage(externalId, text);
});

/** Reanuda los bots de Telegram de negocios que ya tenían un token guardado. */
export async function resumeAllTelegramBots() {
  const { all } = await import("../../db/client.js");
  const rows = all<{ business_id: string }>(`SELECT DISTINCT business_id FROM credentials WHERE key_name = 'TELEGRAM_BOT_TOKEN'`);
  for (const row of rows) {
    connectTelegram(row.business_id).catch((err) => console.error("[telegram] no se pudo reanudar:", err));
  }
}
