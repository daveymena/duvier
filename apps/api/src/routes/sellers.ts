import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { createSeller, deleteSeller, listSellers, updateSeller } from "../db/repos/sellers.js";

export const sellersRouter = Router();
sellersRouter.use(requireAuth);

sellersRouter.get("/", (req: AuthedRequest, res) => {
  res.json({ sellers: listSellers(req.auth!.businessId) });
});

sellersRouter.post("/", (req: AuthedRequest, res) => {
  const { name, personality, tone } = req.body ?? {};
  const seller = createSeller(req.auth!.businessId, name, personality, tone);
  res.json({ seller });
});

sellersRouter.put("/:id", (req: AuthedRequest, res) => {
  updateSeller(req.params.id, req.body ?? {});
  res.json({ ok: true });
});

sellersRouter.delete("/:id", (req: AuthedRequest, res) => {
  deleteSeller(req.params.id);
  res.json({ ok: true });
});
