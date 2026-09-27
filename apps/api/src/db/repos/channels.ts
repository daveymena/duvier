import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface ChannelRow {
  id: string;
  business_id: string;
  type: string; // whatsapp | telegram | messenger | instagram
  external_id?: string;
  seller_id?: string;
  status: string;
  meta?: string; // JSON
}

export function upsertChannel(businessId: string, type: string, fields: Partial<ChannelRow> = {}): ChannelRow {
  const existing = get<ChannelRow>(`SELECT * FROM channels WHERE business_id = $businessId AND type = $type`, {
    businessId,
    type,
  });
  if (existing) {
    const merged = { ...fields };
    const sets = Object.keys(merged)
      .map((k) => `${k} = $${k}`)
      .join(", ");
    if (sets) run(`UPDATE channels SET ${sets} WHERE id = $id`, { ...merged, id: existing.id });
    return get<ChannelRow>(`SELECT * FROM channels WHERE id = $id`, { id: existing.id })!;
  }
  const id = newId("chan");
  run(
    `INSERT INTO channels (id, business_id, type, external_id, seller_id, status, meta)
     VALUES ($id, $businessId, $type, $externalId, $sellerId, $status, $meta)`,
    {
      id,
      businessId,
      type,
      externalId: fields.external_id ?? null,
      sellerId: fields.seller_id ?? null,
      status: fields.status ?? "disconnected",
      meta: fields.meta ?? null,
    }
  );
  return get<ChannelRow>(`SELECT * FROM channels WHERE id = $id`, { id })!;
}

export function listChannels(businessId: string): ChannelRow[] {
  return all<ChannelRow>(`SELECT * FROM channels WHERE business_id = $businessId`, { businessId });
}

export function getChannel(businessId: string, type: string): ChannelRow | undefined {
  return get<ChannelRow>(`SELECT * FROM channels WHERE business_id = $businessId AND type = $type`, { businessId, type });
}

export function findChannelByExternalId(type: string, externalId: string): ChannelRow | undefined {
  return get<ChannelRow>(`SELECT * FROM channels WHERE type = $type AND external_id = $externalId`, {
    type,
    externalId,
  });
}

export function findAllByType(type: string): ChannelRow[] {
  return all<ChannelRow>(`SELECT * FROM channels WHERE type = $type`, { type });
}
