import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { createProduct, deleteProduct, listProducts, updateProduct } from "../db/repos/products.js";
import { createCoupon, listCoupons } from "../db/repos/coupons.js";

export const catalogRouter = Router();
catalogRouter.use(requireAuth);

catalogRouter.get("/products", (req: AuthedRequest, res) => {
  res.json({ products: listProducts(req.auth!.businessId) });
});

catalogRouter.post("/products", (req: AuthedRequest, res) => {
  const product = createProduct(req.auth!.businessId, req.body ?? {});
  res.json({ product });
});

catalogRouter.put("/products/:id", (req: AuthedRequest, res) => {
  updateProduct(req.params.id, req.body ?? {});
  res.json({ ok: true });
});

catalogRouter.delete("/products/:id", (req: AuthedRequest, res) => {
  deleteProduct(req.params.id);
  res.json({ ok: true });
});

catalogRouter.get("/coupons", (req: AuthedRequest, res) => {
  res.json({ coupons: listCoupons(req.auth!.businessId) });
});

catalogRouter.post("/coupons", (req: AuthedRequest, res) => {
  const { code, percentOff, amountOff, maxUses, expiresAt } = req.body ?? {};
  const coupon = createCoupon(req.auth!.businessId, code, { percentOff, amountOff, maxUses, expiresAt });
  res.json({ coupon });
});
