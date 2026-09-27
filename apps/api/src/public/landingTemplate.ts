interface LandingContent {
  headline?: string;
  atencion?: string;
  interes?: string;
  deseo?: string;
  accion?: string;
  producto?: { nombre?: string; precio?: number; imagen?: string } | null;
}

export function renderLandingHtml(opts: { title: string; businessName: string; content: LandingContent }): string {
  const { title, businessName, content } = opts;
  const price = content.producto?.precio ? `$${content.producto.precio.toLocaleString("es-CO")}` : "";
  const image = content.producto?.imagen || "https://placehold.co/900x600?text=" + encodeURIComponent(businessName);
  const waLink = `https://wa.me/?text=${encodeURIComponent(`Hola, quiero más información sobre ${title}`)}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} · ${escapeHtml(businessName)}</title>
<style>
  :root { --brand:#7c3aed; --dark:#111827; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: var(--dark); background:#fafafa; }
  .hero { background: linear-gradient(135deg, var(--brand), #4f46e5); color:white; padding: 64px 20px; text-align:center; }
  .hero h1 { font-size: 2.2rem; max-width: 780px; margin: 0 auto 16px; }
  .hero p { font-size: 1.15rem; opacity:.95; max-width: 640px; margin: 0 auto; }
  .container { max-width: 880px; margin: -40px auto 60px; padding: 0 20px; }
  .card { background:white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: 32px; margin-bottom: 24px; }
  img.product { width:100%; border-radius: 12px; margin-bottom: 16px; }
  .price { font-size: 2rem; font-weight: 700; color: var(--brand); }
  .cta { display:inline-block; background:#25D366; color:white; font-weight:700; padding: 16px 28px; border-radius: 999px; text-decoration:none; font-size:1.1rem; }
  h2 { color: var(--brand); }
  .section { margin-bottom: 20px; }
  footer { text-align:center; color:#888; padding: 24px; font-size:.9rem; }
</style>
</head>
<body>
  <section class="hero">
    <h1>${escapeHtml(content.headline || title)}</h1>
    <p>${escapeHtml(content.atencion || "")}</p>
  </section>
  <div class="container">
    <div class="card">
      <img class="product" src="${image}" alt="${escapeHtml(title)}" />
      ${price ? `<div class="price">${price}</div>` : ""}
      <div class="section"><h2>¿Por qué te interesa?</h2><p>${escapeHtml(content.interes || "")}</p></div>
      <div class="section"><h2>Lo que vas a lograr</h2><p>${escapeHtml(content.deseo || "")}</p></div>
      <div class="section" style="text-align:center; margin-top:32px;">
        <p style="font-weight:600; margin-bottom:16px;">${escapeHtml(content.accion || "¡Escríbenos ahora y te ayudamos a elegir!")}</p>
        <a class="cta" href="${waLink}" target="_blank" rel="noopener">Escribir por WhatsApp</a>
      </div>
    </div>
  </div>
  <footer>Página creada con Duvier · IA para ${escapeHtml(businessName)}</footer>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
