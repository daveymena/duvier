# Duvier · Ventas y Marketing con IA (WhatsApp · Messenger · Instagram · Telegram)

Duvier es una plataforma multi-tenant (multi-negocio) que combina dos agentes de IA:

- **Sofía** — vende por chat: atiende WhatsApp, Messenger, Instagram y Telegram con tu catálogo, cotiza, cierra ventas, genera links de pago (MercadoPago/PayPal), lee comprobantes de pago con visión IA y actualiza el embudo de ventas.
- **Atlas** — es tu operador de marketing: investiga a la competencia en la Biblioteca de Anuncios de Meta, redacta el copy, arma landing pages con estructura AIDA, sube campañas a Meta Ads **en pausa** (nunca gasta sin tu confirmación), y arma/publica tu plan de contenido orgánico.

Está inspirado y pensado para **igualar y superar** plataformas como [ventasproia.com](https://ventasproia.com), pero con arquitectura abierta, multi-proveedor de IA (no depende de un solo LLM) y control total del código.

## 🧠 Arquitectura

```
duvier/
├── apps/
│   ├── api/            Backend (Express + TypeScript + SQLite nativo de Node)
│   │   └── src/
│   │       ├── agents/sofia     Agente de ventas (prompt + herramientas)
│   │       ├── agents/atlas     Agente de marketing (prompt + herramientas)
│   │       ├── agents/toolLoop  Motor de "tool calling" portable entre proveedores de IA
│   │       ├── llm/             Adaptadores multi-proveedor: OpenAI, Anthropic, Gemini, Ollama, demo
│   │       ├── channels/        WhatsApp (Baileys/QR), Telegram (Telegraf), Messenger+Instagram (Graph API)
│   │       ├── integrations/    Meta Ads, Meta Graph, MercadoPago, PayPal, WooCommerce, Dropi, visión (comprobantes)
│   │       ├── db/               Esquema SQLite + repositorios (multi-tenant)
│   │       └── routes/           API REST del panel
│   └── web/            Panel (React + Vite + TypeScript + Tailwind)
```

### Multi-tenant real
Cada negocio (`business`) tiene su propia sesión de WhatsApp, su propio bot de Telegram, sus propias credenciales (cifradas con AES-256-GCM en la base de datos) y sus propios datos: catálogo, contactos, conversaciones, pedidos, cupones, landing pages y campañas. Nada se mezcla entre negocios.

### IA multi-proveedor (BYOK)
No dependemos de un solo modelo. Cada negocio elige y conecta su propia llave desde **Configuración**:
- OpenAI (GPT-4o / GPT-4o-mini)
- Anthropic (Claude 3.5 Sonnet)
- Google Gemini
- Ollama (modelo local, gratis, sin límites de uso)
- **Modo demo**: si no se conecta ninguna llave, el sistema sigue funcionando con respuestas de plantilla, para que nada se caiga mientras conectas tus credenciales reales.

### Motor de agentes portable
En vez de depender del "function calling" nativo de un solo proveedor (que varía entre OpenAI/Claude/Gemini/Ollama), Duvier usa un protocolo propio y simple: el modelo puede responder texto normal o pedir una herramienta con
```
<action>{"tool": "nombre_herramienta", "args": { ... }}</action>
```
El resultado se reinyecta en la conversación y el modelo continúa. Esto funciona igual sin importar qué proveedor de IA esté conectado (`apps/api/src/agents/toolLoop.ts`).

## ✅ Qué funciona ya (probado en este entorno)

- Registro/login multi-negocio con JWT.
- Catálogo de productos y cupones (CRUD completo).
- Vendedoras IA (personas) configurables por negocio.
- Bandeja de conversaciones en vivo con **control manual** (un humano puede tomar cualquier chat).
- Agente **Sofía**: busca productos, cotiza, crea pedidos, genera links de pago reales (MercadoPago/PayPal cuando hay credenciales), analiza comprobantes de pago con visión IA, actualiza el embudo.
- Agente **Atlas**: investiga competencia (Meta Ad Library), redacta copy, crea landing pages públicas (`/l/tu-negocio/tu-producto`), guarda campañas en borrador y las sube a Meta Ads **en pausa**, arma plan de contenido y publica en Facebook/Instagram.
- Conexión real a **Telegram** (bot propio por negocio) y **WhatsApp** (sesión propia vía código QR, sin depender de aprobación de Meta).
- Webhook único para **Messenger + Instagram** vía Graph API (requiere una App de Meta aprobada).
- Todo el flujo fue probado de punta a punta en modo demo (sin API keys) y con un proveedor de IA simulado (`apps/api/scripts/test-toolloop.ts`).

## 🚧 Qué falta para "producción" completa (honestidad ante todo)

Igualar el 100% de un SaaS como VentasPro implica piezas que requieren credenciales reales de terceros y tiempo de integración/pruebas que no se pueden completar sin tus llaves:

- **Tienda online + checkout propio** (catálogo público, carrito, checkout embebido) — hoy existe el modelo de datos y los pagos vía chat, falta la tienda pública tipo e-commerce.
- **Dropshipping**: WooCommerce ya tiene cliente REST funcional; Dropi está listo como adaptador pero su API varía por país/cuenta (necesita tus credenciales para afinarlo).
- **Facturación/planes de suscripción** (Starter/Growth/Pro como VentasPro) — no implementado, es una decisión de negocio tuya.
- **Multi-usuario con roles/permisos por negocio** — hoy solo hay 1 rol ("owner").
- Pruebas con credenciales reales de Meta (WhatsApp Cloud API oficial, Ads Manager, Ad Library) — el código está escrito contra la Graph API real, pero no puede probarse sin tus tokens.

## 🚀 Cómo correrlo

### 1. Backend
```bash
cd apps/api
cp .env.example .env    # y ajusta los secretos
npm install
npm run dev              # http://localhost:4000
```

### 2. Panel web
```bash
cd apps/web
npm install
npm run dev               # http://localhost:5173 (proxy a la API en /api)
```

### 3. Primeros pasos dentro del panel
1. Crea tu cuenta/negocio en `/registro`.
2. Ve a **Configuración** y conecta tu proveedor de IA (o déjalo en modo demo para probar).
3. Ve a **Canales** y conecta WhatsApp (QR) o Telegram (token de @BotFather).
4. Carga tu **Catálogo**.
5. Escríbele a tu número de WhatsApp/Telegram conectado — Sofía te responderá.
6. Ve a **Marketing** y pídele a Atlas: *"quiero anunciar mi producto X"*.

## 🔐 Seguridad

- Las credenciales de cada negocio se cifran con AES-256-GCM antes de guardarse (`CREDENTIALS_SECRET`).
- Los JWT expiran en 30 días (`JWT_SECRET`).
- Cambia ambos secretos en producción (`apps/api/.env`).

## 🗺️ Roadmap sugerido

1. Tienda pública + checkout embebido (Landing Studio → Tienda completa).
2. Panel de analítica/atribución (qué campaña trajo qué venta).
3. Roles de equipo (varios agentes humanos por negocio, asignación de conversaciones).
4. Suscripciones y límites de mensajes por plan.
5. Integración con WhatsApp Cloud API oficial como alternativa a Baileys para negocios grandes.
