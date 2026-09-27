import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface Contact {
  id: string;
  business_id: string;
  channel_type: string;
  external_id: string;
  name?: string;
  funnel_stage: string;
  tags?: string;
}

export function findOrCreateContact(
  businessId: string,
  channelType: string,
  externalId: string,
  name?: string
): Contact {
  const existing = get<Contact>(
    `SELECT * FROM contacts WHERE business_id = $businessId AND channel_type = $channelType AND external_id = $externalId`,
    { businessId, channelType, externalId }
  );
  if (existing) {
    if (name && !existing.name) {
      run(`UPDATE contacts SET name = $name WHERE id = $id`, { name, id: existing.id });
      existing.name = name;
    }
    return existing;
  }
  const id = newId("contact");
  run(
    `INSERT INTO contacts (id, business_id, channel_type, external_id, name) VALUES ($id, $businessId, $channelType, $externalId, $name)`,
    { id, businessId, channelType, externalId, name: name ?? null }
  );
  return get<Contact>(`SELECT * FROM contacts WHERE id = $id`, { id })!;
}

export function listContacts(businessId: string): Contact[] {
  return all<Contact>(`SELECT * FROM contacts WHERE business_id = $businessId ORDER BY created_at DESC`, { businessId });
}

export function getContact(id: string): Contact | undefined {
  return get<Contact>(`SELECT * FROM contacts WHERE id = $id`, { id });
}

export function setFunnelStage(id: string, stage: string) {
  run(`UPDATE contacts SET funnel_stage = $stage WHERE id = $id`, { id, stage });
}

export function funnelCounts(businessId: string): Record<string, number> {
  const rows = all<{ funnel_stage: string; c: number }>(
    `SELECT funnel_stage, COUNT(*) as c FROM contacts WHERE business_id = $businessId GROUP BY funnel_stage`,
    { businessId }
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.funnel_stage] = r.c;
  return out;
}
