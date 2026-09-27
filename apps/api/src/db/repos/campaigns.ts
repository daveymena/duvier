import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface Campaign {
  id: string;
  business_id: string;
  platform: string;
  objective?: string;
  product_id?: string;
  landing_page_id?: string;
  copy?: string;
  daily_budget?: number;
  status: string;
  meta_campaign_id?: string;
  meta_adset_id?: string;
  meta_ad_id?: string;
  research?: string;
  created_at: string;
}

export function createCampaign(businessId: string, data: Partial<Campaign> & { objective?: string }): Campaign {
  const id = newId("camp");
  run(
    `INSERT INTO campaigns (id, business_id, platform, objective, product_id, landing_page_id, copy, daily_budget, status, research)
     VALUES ($id, $businessId, $platform, $objective, $productId, $landingPageId, $copy, $dailyBudget, $status, $research)`,
    {
      id,
      businessId,
      platform: data.platform ?? "meta",
      objective: data.objective ?? null,
      productId: data.product_id ?? null,
      landingPageId: data.landing_page_id ?? null,
      copy: data.copy ?? null,
      dailyBudget: data.daily_budget ?? null,
      status: data.status ?? "borrador",
      research: data.research ?? null,
    }
  );
  return get<Campaign>(`SELECT * FROM campaigns WHERE id = $id`, { id })!;
}

export function listCampaigns(businessId: string): Campaign[] {
  return all<Campaign>(`SELECT * FROM campaigns WHERE business_id = $businessId ORDER BY created_at DESC`, { businessId });
}

export function getCampaign(id: string): Campaign | undefined {
  return get<Campaign>(`SELECT * FROM campaigns WHERE id = $id`, { id });
}

export function updateCampaign(id: string, fields: Partial<Campaign>) {
  const sets = Object.keys(fields)
    .map((k) => `${k} = $${k}`)
    .join(", ");
  if (!sets) return;
  run(`UPDATE campaigns SET ${sets} WHERE id = $id`, { ...fields, id });
  return getCampaign(id);
}
