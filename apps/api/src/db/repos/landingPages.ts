import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface LandingPage {
  id: string;
  business_id: string;
  slug: string;
  title: string;
  product_id?: string;
  content: string; // JSON AIDA
  published: number;
  created_at: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "landing"
  );
}

export function createLandingPage(
  businessId: string,
  title: string,
  content: Record<string, unknown>,
  productId?: string
): LandingPage {
  const id = newId("lp");
  let base = slugify(title);
  let slug = base;
  let i = 1;
  while (get(`SELECT id FROM landing_pages WHERE business_id = $businessId AND slug = $slug`, { businessId, slug })) {
    slug = `${base}-${i++}`;
  }
  run(
    `INSERT INTO landing_pages (id, business_id, slug, title, product_id, content) VALUES ($id, $businessId, $slug, $title, $productId, $content)`,
    { id, businessId, slug, title, productId: productId ?? null, content: JSON.stringify(content) }
  );
  return get<LandingPage>(`SELECT * FROM landing_pages WHERE id = $id`, { id })!;
}

export function listLandingPages(businessId: string): LandingPage[] {
  return all<LandingPage>(`SELECT * FROM landing_pages WHERE business_id = $businessId ORDER BY created_at DESC`, {
    businessId,
  });
}

export function getLandingPageBySlug(businessSlug: string, slug: string): (LandingPage & { businessName: string }) | undefined {
  return get(
    `SELECT lp.*, b.name as businessName FROM landing_pages lp
     JOIN businesses b ON b.id = lp.business_id
     WHERE b.slug = $businessSlug AND lp.slug = $slug`,
    { businessSlug, slug }
  );
}

export function getLandingPage(id: string): LandingPage | undefined {
  return get<LandingPage>(`SELECT * FROM landing_pages WHERE id = $id`, { id });
}
