import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  business_id: string;
  contact_id: string;
  items: string;
  total: number;
  currency: string;
  coupon_code?: string;
  status: string;
  payment_method?: string;
  payment_link?: string;
  receipt_url?: string;
  created_at: string;
}

export function createOrder(
  businessId: string,
  contactId: string,
  items: OrderItem[],
  currency = "COP",
  couponCode?: string
): Order {
  const id = newId("ord");
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  run(
    `INSERT INTO orders (id, business_id, contact_id, items, total, currency, coupon_code)
     VALUES ($id, $businessId, $contactId, $items, $total, $currency, $couponCode)`,
    { id, businessId, contactId, items: JSON.stringify(items), total, currency, couponCode: couponCode ?? null }
  );
  return get<Order>(`SELECT * FROM orders WHERE id = $id`, { id })!;
}

export function listOrders(businessId: string): Order[] {
  return all<Order>(`SELECT * FROM orders WHERE business_id = $businessId ORDER BY created_at DESC`, { businessId });
}

export function getOrder(id: string): Order | undefined {
  return get<Order>(`SELECT * FROM orders WHERE id = $id`, { id });
}

export function updateOrder(id: string, fields: Partial<Order>) {
  const sets = Object.keys(fields)
    .map((k) => `${k} = $${k}`)
    .join(", ");
  if (!sets) return;
  run(`UPDATE orders SET ${sets} WHERE id = $id`, { ...fields, id });
}

export function revenueTotal(businessId: string): number {
  const row = get<{ total: number }>(
    `SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE business_id = $businessId AND status = 'pagado'`,
    { businessId }
  );
  return row?.total ?? 0;
}
