import { getProduct, listProducts } from "../../db/repos/products.js";
import { createLandingPage, getLandingPage } from "../../db/repos/landingPages.js";
import { createCampaign, updateCampaign } from "../../db/repos/campaigns.js";
import { createContentPlanItem } from "../../db/repos/contentPlan.js";
import { getBusiness } from "../../db/repos/businesses.js";
import { searchMetaAdLibrary, publishFacebookPost, publishInstagramPost } from "../../integrations/metaGraph.js";
import { createPausedMetaCampaign } from "../../integrations/metaAds.js";
import type { ToolFn } from "../toolLoop.js";

export function buildAtlasTools(businessId: string): Record<string, ToolFn> {
  const business = getBusiness(businessId);

  return {
    async listar_catalogo() {
      const products = listProducts(businessId);
      return { products: products.map((p) => ({ id: p.id, nombre: p.name, precio: p.price, imagen: p.image_url })) };
    },

    async investigar_competencia({ terminos, pais }) {
      return searchMetaAdLibrary(businessId, String(terminos ?? business?.name ?? ""), String(pais ?? "CO"));
    },

    async generar_landing({ productId, titulo, atencion, interes, deseo, accion }) {
      const product = productId ? getProduct(String(productId)) : undefined;
      const content = {
        headline: titulo,
        atencion,
        interes,
        deseo,
        accion,
        producto: product ? { nombre: product.name, precio: product.price, imagen: product.image_url } : null,
      };
      const lp = createLandingPage(businessId, String(titulo ?? product?.name ?? "landing"), content, product?.id);
      const slug = (getBusiness(businessId)?.slug) ?? "negocio";
      return { landingPageId: lp.id, url: `/l/${slug}/${lp.slug}` };
    },

    async generar_copy_anuncio({ productId, angulo }) {
      const product = productId ? getProduct(String(productId)) : undefined;
      return {
        producto: product?.name ?? "producto",
        anguloSugerido: angulo ?? "dolor-solucion",
        nota: "Usa este resultado como base; el copy final debe redactarlo el propio modelo en su respuesta.",
      };
    },

    async crear_campana({ nombre, objetivo, productId, landingPageId, headline, primaryText, description, presupuestoDiarioCOP }) {
      const campaign = createCampaign(businessId, {
        objective: String(objetivo ?? "OUTCOME_TRAFFIC"),
        product_id: productId ? String(productId) : undefined,
        landing_page_id: landingPageId ? String(landingPageId) : undefined,
        copy: JSON.stringify({ headline, primaryText, description }),
        daily_budget: Number(presupuestoDiarioCOP) || undefined,
        status: "borrador",
      });
      return { campaignId: campaign.id, estado: "borrador (aún no subida a Meta)" };
    },

    async subir_campana_a_meta({ campaignId, landingUrl, imageUrl }) {
      const { getCampaign } = await import("../../db/repos/campaigns.js");
      const campaign = getCampaign(String(campaignId));
      if (!campaign) return { error: "Campaña no encontrada" };
      const copy = campaign.copy ? JSON.parse(campaign.copy) : { headline: "", primaryText: "" };
      const result = await createPausedMetaCampaign(businessId, {
        name: `Duvier · ${campaign.id}`,
        dailyBudgetCents: (campaign.daily_budget ?? 20000) * 100,
        copy,
        landingUrl: String(landingUrl ?? ""),
        imageUrl: imageUrl ? String(imageUrl) : undefined,
      });
      if (result.created) {
        updateCampaign(campaign.id, {
          status: "pausada",
          meta_campaign_id: result.campaignId,
          meta_adset_id: result.adSetId,
          meta_ad_id: result.adId,
        });
      }
      return result;
    },

    async crear_plan_contenido({ items }) {
      const list = Array.isArray(items) ? items : [];
      const created = list.map((it: any) =>
        createContentPlanItem(businessId, { title: it.titulo, caption: it.caption, scheduled_for: it.fecha })
      );
      return { creados: created.length };
    },

    async publicar_post({ mensaje, imagenUrl, plataforma }) {
      const platform = String(plataforma ?? "facebook");
      if (platform === "instagram") {
        if (!imagenUrl) return { error: "Instagram requiere una imagen" };
        return publishInstagramPost(businessId, String(mensaje ?? ""), String(imagenUrl));
      }
      return publishFacebookPost(businessId, String(mensaje ?? ""), imagenUrl ? String(imagenUrl) : undefined);
    },
  };
}
