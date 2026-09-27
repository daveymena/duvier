import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface Seller {
  id: string;
  business_id: string;
  name: string;
  personality?: string;
  tone: string;
  active: number;
}

export function createSeller(businessId: string, name: string, personality?: string, tone?: string): Seller {
  const id = newId("seller");
  run(
    `INSERT INTO sellers (id, business_id, name, personality, tone) VALUES ($id, $businessId, $name, $personality, $tone)`,
    { id, businessId, name, personality: personality ?? null, tone: tone ?? "amable y cercano" }
  );
  return get<Seller>(`SELECT * FROM sellers WHERE id = $id`, { id })!;
}

export function listSellers(businessId: string): Seller[] {
  return all<Seller>(`SELECT * FROM sellers WHERE business_id = $businessId ORDER BY created_at ASC`, { businessId });
}

export function getSeller(id: string): Seller | undefined {
  return get<Seller>(`SELECT * FROM sellers WHERE id = $id`, { id });
}

export function updateSeller(id: string, fields: Partial<Pick<Seller, "name" | "personality" | "tone" | "active">>) {
  const sets = Object.keys(fields)
    .map((k) => `${k} = $${k}`)
    .join(", ");
  if (!sets) return;
  run(`UPDATE sellers SET ${sets} WHERE id = $id`, { ...fields, id });
}

export function deleteSeller(id: string) {
  run(`DELETE FROM sellers WHERE id = $id`, { id });
}

export function ensureDefaultSeller(businessId: string): Seller {
  const existing = listSellers(businessId);
  if (existing.length > 0) return existing[0];
  return createSeller(businessId, "Sofía", "Vendedora experta, resolutiva y cercana", "amable y cercano");
}
