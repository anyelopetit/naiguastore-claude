// Plantillas compartidas por el generador (Node) y el navegador.
// Estilo: tarjetas blancas sobre fondo azul marino, como el diseño de referencia de NaiguaStore.
(function (root) {
  const NS = root.NS || (typeof require !== "undefined" ? require("./logic.js") : null);
  const T = {};

  T.esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Iconos de trazo para categorías (sin imágenes de stock).
  const ICON_PATHS = {
    Procesadores:
      '<rect x="14" y="14" width="20" height="20" rx="2"/><rect x="19" y="19" width="10" height="10"/><path d="M19 8v6M29 8v6M19 34v6M29 34v6M8 19h6M8 29h6M34 19h6M34 29h6"/>',
    "Tarjetas gráficas":
      '<rect x="6" y="14" width="36" height="16" rx="2"/><circle cx="17" cy="22" r="4.5"/><circle cx="31" cy="22" r="4.5"/><path d="M10 30v4M16 30v4M32 30v4M38 30v4"/>',
    "Placas base":
      '<rect x="8" y="8" width="32" height="32" rx="2"/><rect x="13" y="13" width="11" height="11"/><path d="M29 13h6v20h-6M13 30h10M13 34h10"/>',
    Almacenamiento: '<rect x="8" y="15" width="32" height="18" rx="2"/><rect x="28" y="20" width="8" height="8"/><path d="M13 22h8"/>',
    "Memoria RAM":
      '<rect x="6" y="14" width="36" height="12" rx="1"/><path d="M12 26v5M18 26v5M24 26v5M30 26v5M36 26v5"/><rect x="11" y="18" width="4" height="4"/><rect x="22" y="18" width="4" height="4"/>',
  };
  const svg = (paths, cls = "") =>
    `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  T.icon = (category) => svg(ICON_PATHS[category] || '<rect x="10" y="10" width="28" height="28" rx="2"/>', "ico");

  T.price = (p, rate, big) => {
    const bs = NS.fmtBs(p.price, rate);
    return `<p class="price${big ? " price--lg" : ""}"><span class="price__usd">${NS.fmtUSD(p.price)}</span><span class="price__cur">USD</span></p>${
      bs ? `<p class="price__bs">≈ ${bs}</p>` : ""
    }`;
  };

  T.media = (p, opts = {}) => {
    const loading = opts.eager ? "eager" : "lazy";
    return `<img src="${T.esc(opts.base || "")}${T.esc(p.image)}" alt="${T.esc(p.name)}" width="800" height="600" loading="${loading}" decoding="async">`;
  };

  // ctx: { base, whatsapp, bsRate, eager }
  T.waLink = (ctx, text) => NS.waUrl(ctx.whatsapp, text);
  const waIcon = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>`;
  const cartIcon = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2v2h2l3.6 7.6-1.4 2.4A2 2 0 0 0 7 17h12v-2H7.4l1.1-2h7.5a2 2 0 0 0 1.7-1l3.6-6.5A1 1 0 0 0 20.4 5H5.2l-.9-2H1z"/></svg>`;
  T.cartIcon = cartIcon;
  T.waIcon = waIcon;

  T.card = (p, ctx) => {
    const base = ctx.base || "";
    const url = `${base}producto/${p.id}/`;
    const badges = [];
    if (p.badge) badges.push(`<span class="badge badge--${p.badge === "Nuevo" ? "blue" : "gold"}">${T.esc(p.badge)}</span>`);
    const avail = p.inStock
      ? `<span class="dot dot--ok" aria-hidden="true"></span>Disponible`
      : `<span class="dot dot--out" aria-hidden="true"></span>Agotado`;
    const action = p.inStock
      ? `<button class="btn btn--primary" type="button" data-add="${T.esc(p.id)}">${cartIcon}<span>Agregar al carrito</span></button>`
      : `<a class="btn btn--line" href="${T.esc(T.waLink(ctx, `Hola, quiero que me avisen cuando llegue el ${p.name}.`))}" target="_blank" rel="noopener">Avísame cuando llegue</a>`;
    return `<article class="pcard" data-id="${T.esc(p.id)}">
  <a class="pcard__media" href="${T.esc(url)}" aria-label="Ver ${T.esc(p.name)}">${badges.join("")}${T.media(p, { base, eager: ctx.eager })}</a>
  <div class="pcard__body">
    <p class="pcard__cat">${T.esc(p.category)}</p>
    <h3 class="pcard__name"><a href="${T.esc(url)}">${T.esc(p.name)}</a></h3>
    <p class="pcard__specs">${p.specs.map(T.esc).join(" · ")}</p>
    <p class="pcard__avail">${avail}</p>
    <div class="pcard__price">${T.price(p, ctx.bsRate, false)}</div>
    <div class="pcard__actions">
      ${action}
      <a class="btn btn--wa" href="${T.esc(T.waLink(ctx, `Hola, tengo una duda sobre el ${p.name}.`))}" target="_blank" rel="noopener" aria-label="Consultar ${T.esc(p.name)} por WhatsApp" title="Consultar por WhatsApp">${waIcon}</a>
    </div>
  </div>
</article>`;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = T;
  root.T = T;
})(typeof window !== "undefined" ? window : globalThis);
