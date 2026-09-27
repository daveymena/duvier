import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "duvier.sqlite");

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

/** node:sqlite exige que los parámetros nombrados lleven el prefijo "$".
 * Estas helpers permiten llamar con claves simples: run(sql, { id, name }). */
function withDollar(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k.startsWith("$") ? k : `$${k}`] = v === undefined ? null : v;
  }
  return out;
}

/** Ejecuta un INSERT/UPDATE/DELETE y devuelve info del resultado. */
export function run(sql: string, params: Record<string, unknown> = {}) {
  const stmt = db.prepare(sql);
  return stmt.run(withDollar(params) as any);
}

/** Devuelve la primera fila que coincide, o undefined. */
export function get<T = any>(sql: string, params: Record<string, unknown> = {}): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(withDollar(params) as any) as T | undefined;
}

/** Devuelve todas las filas que coinciden. */
export function all<T = any>(sql: string, params: Record<string, unknown> = {}): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(withDollar(params) as any) as T[];
}

console.log(`[db] SQLite listo en ${DB_PATH}`);
