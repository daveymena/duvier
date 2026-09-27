import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { getBusiness, updateBusiness } from "../db/repos/businesses.js";
import { funnelCounts } from "../db/repos/contacts.js";
import { revenueTotal } from "../db/repos/orders.js";
import { all } from "../db/client.js";

export const businessRouter = Router();
businessRouter.use(requireAuth);

businessRouter.get("/me", (req: AuthedRequest, res) => {
  res.json({ business: getBusiness(req.auth!.businessId) });
});

businessRouter.put("/me", (req: AuthedRequest, res) => {
  const { name, industry, brand_voice } = req.body ?? {};
  const business = updateBusiness(req.auth!.businessId, { name, industry, brand_voice });
  res.json({ business });
});

businessRouter.get("/stats", (req: AuthedRequest, res) => {
  const businessId = req.auth!.businessId;
  const funnel = funnelCounts(businessId);
  const revenue = revenueTotal(businessId);
  const messages30d = all<{ c: number }>(
    `SELECT COUNT(*) as c FROM messages WHERE business_id = $businessId AND created_at >= datetime('now', '-30 days')`,
    { businessId }
  )[0]?.c ?? 0;
  const conversations = all<{ c: number }>(`SELECT COUNT(*) as c FROM conversations WHERE business_id = $businessId`, {
    businessId,
  })[0]?.c ?? 0;
  res.json({ funnel, revenue, messages30d, conversations });
});
