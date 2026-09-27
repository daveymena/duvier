import { all, get, run } from "./client.js";
import { encrypt, decrypt } from "../utils/crypto.js";
import { newId } from "../utils/id.js";

/**
 * Credenciales por negocio (multi-tenant, "cada negocio con su propia sesión aislada").
 * Cada negocio puede traer sus propias llaves (BYOK): LLM, Meta, WhatsApp, Telegram, pagos, etc.
 * Si un negocio no configuró una llave, se usa la variable de entorno global (modo demo/plataforma).
 */

export function setCredential(businessId: string, keyName: string, value: string) {
  const existing = get<{ id: string }>(
    `SELECT id FROM credentials WHERE business_id = $businessId AND key_name = $keyName`,
    { businessId, keyName }
  );
  const encrypted = encrypt(value);
  if (existing) {
    run(`UPDATE credentials SET value_encrypted = $value, updated_at = datetime('now') WHERE id = $id`, {
      id: existing.id,
      value: encrypted,
    });
  } else {
    run(
      `INSERT INTO credentials (id, business_id, key_name, value_encrypted) VALUES ($id, $businessId, $keyName, $value)`,
      { id: newId("cred"), businessId, keyName, value: encrypted }
    );
  }
}

export function getCredential(businessId: string, keyName: string): string | undefined {
  const row = get<{ value_encrypted: string }>(
    `SELECT value_encrypted FROM credentials WHERE business_id = $businessId AND key_name = $keyName`,
    { businessId, keyName }
  );
  if (row) {
    try {
      return decrypt(row.value_encrypted);
    } catch {
      return undefined;
    }
  }
  // Fallback a variables de entorno globales (modo demo / claves compartidas de la plataforma)
  return process.env[keyName];
}

export function listCredentialKeys(businessId: string): string[] {
  const rows = all<{ key_name: string }>(`SELECT key_name FROM credentials WHERE business_id = $businessId`, {
    businessId,
  });
  return rows.map((r) => r.key_name);
}

export function deleteCredential(businessId: string, keyName: string) {
  run(`DELETE FROM credentials WHERE business_id = $businessId AND key_name = $keyName`, { businessId, keyName });
}
