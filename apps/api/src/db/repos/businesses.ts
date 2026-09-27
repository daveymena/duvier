import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface Business {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  brand_voice?: string;
  created_at: string;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "negocio"
  );
}

export function createBusiness(name: string, industry?: string): Business {
  const id = newId("biz");
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;
  while (get(`SELECT id FROM businesses WHERE slug = $slug`, { slug })) {
    slug = `${baseSlug}-${i++}`;
  }
  run(`INSERT INTO businesses (id, name, slug, industry) VALUES ($id, $name, $slug, $industry)`, {
    id,
    name,
    slug,
    industry: industry ?? null,
  });
  return get<Business>(`SELECT * FROM businesses WHERE id = $id`, { id })!;
}

export function getBusiness(id: string): Business | undefined {
  return get<Business>(`SELECT * FROM businesses WHERE id = $id`, { id });
}

export function getBusinessBySlug(slug: string): Business | undefined {
  return get<Business>(`SELECT * FROM businesses WHERE slug = $slug`, { slug });
}

export function updateBusiness(id: string, fields: Partial<Pick<Business, "name" | "industry" | "brand_voice">>) {
  const sets = Object.keys(fields)
    .map((k) => `${k} = $${k}`)
    .join(", ");
  if (!sets) return;
  run(`UPDATE businesses SET ${sets} WHERE id = $id`, { ...fields, id });
  return getBusiness(id);
}

export function listBusinesses(): Business[] {
  return all<Business>(`SELECT * FROM businesses ORDER BY created_at DESC`);
}
