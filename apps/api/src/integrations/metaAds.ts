import axios from "axios";
import { getCredential } from "../db/credentials.js";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

interface AdCopy {
  headline: string;
  primaryText: string;
  description?: string;
}

/**
 * Crea una campaña + conjunto de anuncios + anuncio en Meta Marketing API,
 * SIEMPRE en estado PAUSED. El dueño del negocio debe activarla manualmente
 * (igual que en el sistema de referencia: "no gasta hasta que digas").
 */
export async function createPausedMetaCampaign(
  businessId: string,
  opts: { name: string; objective?: string; dailyBudgetCents: number; copy: AdCopy; landingUrl: string; imageUrl?: string }
) {
  const token = getCredential(businessId, "META_ADS_ACCESS_TOKEN");
  const adAccountId = getCredential(businessId, "META_AD_ACCOUNT_ID"); // ej: act_1234567890
  const pageId = getCredential(businessId, "FACEBOOK_PAGE_ID");

  if (!token || !adAccountId || !pageId) {
    return {
      created: false,
      note:
        "Faltan credenciales de Meta Ads (META_ADS_ACCESS_TOKEN, META_AD_ACCOUNT_ID, FACEBOOK_PAGE_ID). La campaña quedó guardada como borrador local; conecta tus credenciales en Configuración para subirla en pausa a Meta.",
    };
  }

  const api = axios.create({ baseURL: GRAPH_BASE, params: { access_token: token } });

  // 1) Campaña
  const campaign = await api.post(`/${adAccountId}/campaigns`, {
    name: opts.name,
    objective: opts.objective ?? "OUTCOME_TRAFFIC",
    status: "PAUSED",
    special_ad_categories: [],
  });

  // 2) Conjunto de anuncios
  const adSet = await api.post(`/${adAccountId}/adsets`, {
    name: `${opts.name} · Conjunto`,
    campaign_id: campaign.data.id,
    daily_budget: opts.dailyBudgetCents,
    billing_event: "IMPRESSIONS",
    optimization_goal: "LINK_CLICKS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: { geo_locations: { countries: ["CO"] } },
    status: "PAUSED",
  });

  // 3) Creativo
  const creative = await api.post(`/${adAccountId}/adcreatives`, {
    name: `${opts.name} · Creativo`,
    object_story_spec: {
      page_id: pageId,
      link_data: {
        message: opts.copy.primaryText,
        link: opts.landingUrl,
        name: opts.copy.headline,
        description: opts.copy.description ?? "",
        picture: opts.imageUrl,
      },
    },
  });

  // 4) Anuncio
  const ad = await api.post(`/${adAccountId}/ads`, {
    name: `${opts.name} · Anuncio`,
    adset_id: adSet.data.id,
    creative: { creative_id: creative.data.id },
    status: "PAUSED",
  });

  return {
    created: true,
    campaignId: campaign.data.id,
    adSetId: adSet.data.id,
    adId: ad.data.id,
  };
}

/** Activa (o vuelve a pausar) una campaña ya creada en Meta. */
export async function setMetaCampaignStatus(businessId: string, metaCampaignId: string, status: "ACTIVE" | "PAUSED") {
  const token = getCredential(businessId, "META_ADS_ACCESS_TOKEN");
  if (!token) throw new Error("Falta META_ADS_ACCESS_TOKEN");
  const { data } = await axios.post(`${GRAPH_BASE}/${metaCampaignId}`, { status }, { params: { access_token: token } });
  return data;
}
