import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { createLandingPage, getLandingPageBySlug, listLandingPages } from "../db/repos/landingPages.js";
import { getBusiness } from "../db/repos/businesses.js";
import { renderLandingHtml } from "../public/landingTemplate.js";

export const landingRouter = Router();
landingRouter.use(requireAuth);

landingRouter.get("/", (req: AuthedRequest, res) => {
  const business = getBusiness(req.auth!.businessId)!;
  const pages = listLandingPages(req.auth!.businessId).map((p) => ({ ...p, url: `/l/${business.slug}/${p.slug}` }));
  res.json({ landingPages: pages });
});

landingRouter.post("/", (req: AuthedRequest, res) => {
  const { title, content, productId } = req.body ?? {};
  const lp = createLandingPage(req.auth!.businessId, title, content ?? {}, productId);
  const business = getBusiness(req.auth!.businessId)!;
  res.json({ landingPage: lp, url: `/l/${business.slug}/${lp.slug}` });
});

// Router público (sin auth) para servir la landing renderizada, montado aparte en index.ts
export const publicLandingRouter = Router();
publicLandingRouter.get("/:businessSlug/:slug", (req, res) => {
  const lp = getLandingPageBySlug(req.params.businessSlug, req.params.slug);
  if (!lp || !lp.published) return res.status(404).send("Página no encontrada");
  const content = JSON.parse(lp.content);
  res.send(renderLandingHtml({ title: lp.title, businessName: lp.businessName, content }));
});
