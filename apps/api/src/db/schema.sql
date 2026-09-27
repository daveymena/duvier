-- Duvier · esquema de base de datos (SQLite)
-- Multi-tenant: todo cuelga de "businesses" (negocios).

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT,
  brand_voice TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Credenciales/API keys por negocio (cifradas). key_name ej: OPENAI_API_KEY, WHATSAPP..., etc.
CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(business_id, key_name)
);

-- Vendedoras IA (personas de Sofía). Un negocio puede tener varias con distinto tono/canal.
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality TEXT,
  tone TEXT DEFAULT 'amable y cercano',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Canales conectados (whatsapp, telegram, messenger, instagram)
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- whatsapp | telegram | messenger | instagram
  external_id TEXT,   -- numero, bot username, page id, ig business id
  seller_id TEXT REFERENCES sellers(id),
  status TEXT NOT NULL DEFAULT 'disconnected', -- disconnected|connecting|connected|error
  meta TEXT, -- JSON libre (qr, tokens no sensibles, etc.)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(business_id, type)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'COP',
  category TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT -1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  percent_off REAL,
  amount_off REAL,
  max_uses INTEGER DEFAULT -1,
  used_count INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(business_id, code)
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  external_id TEXT NOT NULL, -- numero whatsapp, chat id telegram, psid messenger, igsid instagram
  name TEXT,
  funnel_stage TEXT NOT NULL DEFAULT 'nuevo', -- nuevo|cotizado|negociando|pagado|cliente|perdido
  tags TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(business_id, channel_type, external_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  seller_id TEXT REFERENCES sellers(id),
  ai_enabled INTEGER NOT NULL DEFAULT 1, -- 0 = control manual (humano tomo el control)
  last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- inbound|outbound
  sender TEXT NOT NULL, -- contact|ai|human|system
  body TEXT,
  media_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  items TEXT NOT NULL, -- JSON [{productId,name,price,qty}]
  total REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'COP',
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente', -- pendiente|pagado|entregado|cancelado
  payment_method TEXT, -- mercadopago|paypal|transferencia|contraentrega
  payment_link TEXT,
  receipt_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS landing_pages (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  product_id TEXT REFERENCES products(id),
  content TEXT NOT NULL, -- JSON con estructura AIDA (headline, atencion, interes, deseo, accion, imagenes)
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(business_id, slug)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'meta', -- meta (facebook+instagram)
  objective TEXT,
  product_id TEXT REFERENCES products(id),
  landing_page_id TEXT REFERENCES landing_pages(id),
  copy TEXT, -- JSON {headline, primaryText, description}
  daily_budget REAL,
  status TEXT NOT NULL DEFAULT 'borrador', -- borrador|pausada|activa|con_error
  meta_campaign_id TEXT,
  meta_adset_id TEXT,
  meta_ad_id TEXT,
  research TEXT, -- JSON con hallazgos de investigacion de competencia
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_plan_items (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  platform TEXT NOT NULL DEFAULT 'facebook,instagram',
  scheduled_for TEXT,
  status TEXT NOT NULL DEFAULT 'planificado', -- planificado|publicado|error
  published_post_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_contacts_business ON contacts(business_id);
