import { Router } from "express";
import { createBusiness } from "../db/repos/businesses.js";
import { createUser, findUserByEmail, verifyPassword } from "../db/repos/users.js";
import { ensureDefaultSeller } from "../db/repos/sellers.js";
import { signToken } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const { businessName, industry, email, password, name } = req.body ?? {};
  if (!businessName || !email || !password) {
    return res.status(400).json({ error: "businessName, email y password son obligatorios" });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
  }
  const business = createBusiness(businessName, industry);
  const user = createUser(business.id, email, password, name);
  ensureDefaultSeller(business.id);
  const token = signToken(user.id, business.id);
  res.json({ token, business, user: { id: user.id, email: user.email, name: user.name } });
});

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = findUserByEmail(email ?? "");
  if (!user || !verifyPassword(user, password ?? "")) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
  }
  const token = signToken(user.id, user.business_id);
  res.json({ token, businessId: user.business_id, user: { id: user.id, email: user.email, name: user.name } });
});
