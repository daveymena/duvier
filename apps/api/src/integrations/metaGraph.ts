import axios from "axios";
import { getCredential } from "../db/credentials.js";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

/** Envía un mensaje de texto por Messenger o Instagram usando el Send API de Meta. */
export async function sendMetaMessage(businessId: string, channel: "messenger" | "instagram", recipientId: string, text: string) {
  const pageToken = getCredential(businessId, channel === "messenger" ? "MESSENGER_PAGE_TOKEN" : "INSTAGRAM_PAGE_TOKEN");
  if (!pageToken) throw new Error(`Falta configurar el token de página para ${channel}`);
  const endpoint = channel === "messenger" ? "me/messages" : "me/messages"; // IG usa el mismo Send API vía la página conectada
  const { data } = await axios.post(`${GRAPH_BASE}/${endpoint}`, {
    recipient: { id: recipientId },
    message: { text },
  }, { params: { access_token: pageToken } });
  return data;
}

/** Publica un post de texto/foto en la página de Facebook. */
export async function publishFacebookPost(businessId: string, message: string, imageUrl?: string) {
  const pageToken = getCredential(businessId, "MESSENGER_PAGE_TOKEN");
  const pageId = getCredential(businessId, "FACEBOOK_PAGE_ID");
  if (!pageToken || !pageId) throw new Error("Falta configurar FACEBOOK_PAGE_ID o MESSENGER_PAGE_TOKEN");
  const endpoint = imageUrl ? `${pageId}/photos` : `${pageId}/feed`;
  const payload: Record<string, unknown> = imageUrl ? { url: imageUrl, caption: message } : { message };
  const { data } = await axios.post(`${GRAPH_BASE}/${endpoint}`, payload, { params: { access_token: pageToken } });
  return data;
}

/** Publica en el feed de Instagram (requiere cuenta business + contenedor de medios). */
export async function publishInstagramPost(businessId: string, caption: string, imageUrl: string) {
  const igToken = getCredential(businessId, "INSTAGRAM_PAGE_TOKEN");
  const igUserId = getCredential(businessId, "INSTAGRAM_BUSINESS_ID");
  if (!igToken || !igUserId) throw new Error("Falta configurar INSTAGRAM_BUSINESS_ID o INSTAGRAM_PAGE_TOKEN");
  const created = await axios.post(`${GRAPH_BASE}/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
  }, { params: { access_token: igToken } });
  const creationId = created.data.id;
  const published = await axios.post(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    creation_id: creationId,
  }, { params: { access_token: igToken } });
  return published.data;
}

/** Investiga anuncios activos de la competencia en la Biblioteca de Anuncios de Meta (Ad Library API). */
export async function searchMetaAdLibrary(businessId: string, searchTerms: string, countryCode = "CO") {
  const token = getCredential(businessId, "META_AD_LIBRARY_TOKEN") || getCredential(businessId, "META_ADS_ACCESS_TOKEN");
  if (!token) {
    return { available: false, note: "Conecta META_AD_LIBRARY_TOKEN en Configuración para investigar competencia con datos reales.", results: [] };
  }
  const { data } = await axios.get(`${GRAPH_BASE}/ads_archive`, {
    params: {
      access_token: token,
      search_terms: searchTerms,
      ad_reached_countries: JSON.stringify([countryCode]),
      ad_active_status: "ACTIVE",
      fields: "ad_creative_bodies,ad_creative_link_titles,page_name,ad_snapshot_url",
      limit: 10,
    },
  });
  return { available: true, results: data.data ?? [] };
}
