import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { listCampaigns, getCampaign, updateCampaign } from "../db/repos/campaigns.js";
import { listContentPlan } from "../db/repos/contentPlan.js";
import { handleAtlasMessage } from "../agents/atlas/index.js";
import { setMetaCampaignStatus } from "../integrations/metaAds.js";

export const campaignsRouter = Router();
campaignsRouter.use(requireAuth);

campaignsRouter.get("/", (req: AuthedRequest, res) => {
  res.json({ campaigns: listCampaigns(req.auth!.businessId) });
});

campaignsRouter.get("/:id", (req: AuthedRequest, res) => {
  res.json({ campaign: getCampaign(req.params.id) });
});

// Activar una campaña que ya se subió a Meta en pausa (el dueño confirma el gasto).
campaignsRouter.post("/:id/activate", async (req: AuthedRequest, res) => {
  const campaign = getCampaign(req.params.id);
  if (!campaign?.meta_campaign_id) return res.status(400).json({ error: "La campaña aún no se ha subido a Meta" });
  try {
    await setMetaCampaignStatus(req.auth!.businessId, campaign.meta_campaign_id, "ACTIVE");
    updateCampaign(campaign.id, { status: "activa" });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

campaignsRouter.post("/:id/pause", async (req: AuthedRequest, res) => {
  const campaign = getCampaign(req.params.id);
  if (!campaign?.meta_campaign_id) return res.status(400).json({ error: "La campaña aún no se ha subido a Meta" });
  try {
    await setMetaCampaignStatus(req.auth!.businessId, campaign.meta_campaign_id, "PAUSED");
    updateCampaign(campaign.id, { status: "pausada" });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

campaignsRouter.get("/plan/contenido", (req: AuthedRequest, res) => {
  res.json({ items: listContentPlan(req.auth!.businessId) });
});

// Chat con Atlas (el "operador de marketing en un chat").
campaignsRouter.post("/atlas/chat", async (req: AuthedRequest, res) => {
  const { message, history } = req.body ?? {};
  if (!message) return res.status(400).json({ error: "message es obligatorio" });
  try {
    const result = await handleAtlasMessage({
      businessId: req.auth!.businessId,
      history: Array.isArray(history) ? history : [],
      text: message,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
