import { all, get, run } from "../client.js";
import { newId } from "../../utils/id.js";

export interface Coupon {
  id: string;
  business_id: string;
  code: string;
  percent_off?: number;
  amount_off?: number;
  max_uses: number;
  used_count: number;
  active: number;
  expires_at?: string;
}

export function createCoupon(
  businessId: string,
  code: string,
  opts: { percentOff?: number; amountOff?: number; maxUses?: number; expiresAt?: string } = {}
): Coupon {
  const id = newId("cpn");
  run(
    `INSERT INTO coupons (id, business_id, code, percent_off, amount_off, max_uses, expires_at)
     VALUES ($id, $businessId, $code, $percentOff, $amountOff, $maxUses, $expiresAt)`,
    {
      id,
      businessId,
      code: code.toUpperCase(),
      percentOff: opts.percentOff ?? null,
      amountOff: opts.amountOff ?? null,
      maxUses: opts.maxUses ?? -1,
      expiresAt: opts.expiresAt ?? null,
    }
  );
  return get<Coupon>(`SELECT * FROM coupons WHERE id = $id`, { id })!;
}

export function findCoupon(businessId: string, code: string): Coupon | undefined {
  return get<Coupon>(`SELECT * FROM coupons WHERE business_id = $businessId AND code = $code AND active = 1`, {
    businessId,
    code: code.toUpperCase(),
  });
}

export function listCoupons(businessId: string): Coupon[] {
  return all<Coupon>(`SELECT * FROM coupons WHERE business_id = $businessId ORDER BY created_at DESC`, { businessId });
}

export function useCoupon(id: string) {
  run(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $id`, { id });
}
