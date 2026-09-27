import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db/client.js"; // inicializa la base de datos y corre el esquema

import { authRouter } from "./routes/auth.js";
import { businessRouter } from "./routes/business.js";
import { catalogRouter } from "./routes/catalog.js";
import { sellersRouter } from "./routes/sellers.js";
import { channelsRouter } from "./routes/channels.js";
import { inboxRouter } from "./routes/inbox.js";
import { settingsRouter } from "./routes/settings.js";
import { landingRouter, publicLandingRouter } from "./routes/landing.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { metaWebhookRouter } from "./channels/meta/webhook.js";
import { resumeAllWhatsAppSessions } from "./channels/whatsapp/manager.js";
import { resumeAllTelegramBots } from "./channels/telegram/manager.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Salud del servicio
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "duvier-api", time: new Date().toISOString() }));

// Auth y núcleo del panel
app.use("/api/auth", authRouter);
app.use("/api/business", businessRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/sellers", sellersRouter);
app.use("/api/channels", channelsRouter);
app.use("/api/inbox", inboxRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/landing-pages", landingRouter);
app.use("/api/campaigns", campaignsRouter);

// Webhooks entrantes de Meta (Messenger + Instagram comparten formato)
app.use("/webhooks/meta", metaWebhookRouter);

// Landing pages públicas: duvier.tu-dominio.com/l/mi-negocio/mi-producto
app.use("/l", publicLandingRouter);

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`\n🚀 Duvier API escuchando en http://0.0.0.0:${PORT}`);
  console.log(`   Salud: http://localhost:${PORT}/api/health`);
  await resumeAllWhatsAppSessions();
  await resumeAllTelegramBots();
});
