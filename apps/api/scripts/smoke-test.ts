import "dotenv/config";
import "../src/db/client.js";
import { handleInboundMessage } from "../src/channels/dispatch.js";
import { createBusiness } from "../src/db/repos/businesses.js";
import { createProduct } from "../src/db/repos/products.js";
import { ensureDefaultSeller } from "../src/db/repos/sellers.js";
import { handleAtlasMessage } from "../src/agents/atlas/index.js";

async function main() {
  const business = createBusiness("Piano Smoke Test", "educacion");
  ensureDefaultSeller(business.id);
  createProduct(business.id, { name: "Curso Piano Desde Cero", description: "12 modulos en video", price: 150000 });

  console.log("--- Sofía (ventas) ---");
  const r1 = await handleInboundMessage({ businessId: business.id, channel: "telegram", externalId: "tg-1", contactName: "Juan", text: "Hola, cuánto cuesta el curso de piano?" });
  console.log(JSON.stringify(r1, null, 2));

  console.log("\n--- Atlas (marketing) ---");
  const r2 = await handleAtlasMessage({ businessId: business.id, history: [], text: "Quiero anunciar el curso de piano en Facebook e Instagram" });
  console.log(JSON.stringify(r2, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
