import crypto from "node:crypto";

// Clave de cifrado en reposo para las credenciales (API keys) de cada negocio.
// En producción, define CREDENTIALS_SECRET en el .env con un valor largo y aleatorio.
const RAW_SECRET = process.env.CREDENTIALS_SECRET || "duvier-dev-secret-change-me-please";
const KEY = crypto.createHash("sha256").update(RAW_SECRET).digest();

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}
