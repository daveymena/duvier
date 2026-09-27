import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "duvier-dev-jwt-secret-change-me";

export interface AuthedRequest extends Request {
  auth?: { userId: string; businessId: string };
}

export function signToken(userId: string, businessId: string): string {
  return jwt.sign({ userId, businessId }, JWT_SECRET, { expiresIn: "30d" });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No autenticado" });
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string; businessId: string };
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
