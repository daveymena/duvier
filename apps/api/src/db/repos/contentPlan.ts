import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface ContentPlanItem {
  id: string;
  business_id: string;
  title: string;
  caption?: string;
  platform: string;
  scheduled_for?: string;
  status: string;
  published_post_id?: string;
}

export function createContentPlanItem(
  businessId: string,
  data: Partial<ContentPlanItem> & { title: string }
): ContentPlanItem {
  const id = newId("cpi");
  run(
    `INSERT INTO content_plan_items (id, business_id, title, caption, platform, scheduled_for)
     VALUES ($id, $businessId, $title, $caption, $platform, $scheduledFor)`,
    {
      id,
      businessId,
      title: data.title,
      caption: data.caption ?? null,
      platform: data.platform ?? "facebook,instagram",
      scheduledFor: data.scheduled_for ?? null,
    }
  );
  return get<ContentPlanItem>(`SELECT * FROM content_plan_items WHERE id = $id`, { id })!;
}

export function listContentPlan(businessId: string): ContentPlanItem[] {
  return all<ContentPlanItem>(
    `SELECT * FROM content_plan_items WHERE business_id = $businessId ORDER BY COALESCE(scheduled_for, created_at) ASC`,
    { businessId }
  );
}

export function updateContentPlanItem(id: string, fields: Partial<ContentPlanItem>) {
  const sets = Object.keys(fields)
    .map((k) => `${k} = $${k}`)
    .join(", ");
  if (!sets) return;
  run(`UPDATE content_plan_items SET ${sets} WHERE id = $id`, { ...fields, id });
}
