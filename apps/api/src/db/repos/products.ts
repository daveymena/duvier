import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  image_url?: string;
  stock: number;
  active: number;
}

export function createProduct(businessId: string, data: Partial<Product> & { name: string }): Product {
  const id = newId("prod");
  run(
    `INSERT INTO products (id, business_id, name, description, price, currency, category, image_url, stock)
     VALUES ($id, $businessId, $name, $description, $price, $currency, $category, $image_url, $stock)`,
    {
      id,
      businessId,
      name: data.name,
      description: data.description ?? null,
      price: data.price ?? 0,
      currency: data.currency ?? "COP",
      category: data.category ?? null,
      image_url: data.image_url ?? null,
      stock: data.stock ?? -1,
    }
  );
  return get<Product>(`SELECT * FROM products WHERE id = $id`, { id })!;
}

export function listProducts(businessId: string): Product[] {
  return all<Product>(`SELECT * FROM products WHERE business_id = $businessId AND active = 1 ORDER BY created_at DESC`, {
    businessId,
  });
}

export function getProduct(id: string): Product | undefined {
  return get<Product>(`SELECT * FROM products WHERE id = $id`, { id });
}

export function searchProducts(businessId: string, query: string): Product[] {
  const like = `%${query.toLowerCase()}%`;
  return all<Product>(
    `SELECT * FROM products WHERE business_id = $businessId AND active = 1 AND (lower(name) LIKE $like OR lower(description) LIKE $like OR lower(category) LIKE $like) LIMIT 5`,
    { businessId, like }
  );
}

export function updateProduct(id: string, fields: Partial<Product>) {
  const sets = Object.keys(fields)
    .map((k) => `${k} = $${k}`)
    .join(", ");
  if (!sets) return;
  run(`UPDATE products SET ${sets} WHERE id = $id`, { ...fields, id });
}

export function deleteProduct(id: string) {
  run(`UPDATE products SET active = 0 WHERE id = $id`, { id });
}
