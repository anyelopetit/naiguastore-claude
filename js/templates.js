// Plantillas compartidas por el generador (Node) y el navegador.
// La etiqueta de caja de cada producto es el objeto central del diseño.
(function (root) {
  const NS = root.NS || (typeof require !== "undefined" ? require("./logic.js") : null);
  const T = {};

  T.esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Dibujos de componentes en trazo simple (sin imágenes de stock).
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
  T.icon = (category) =>
    `<svg class="label__icon" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">${
      ICON_PATHS[category] || '<rect x="10" y="10" width="28" height="28" rx="2"/>'
    }</svg>`;

  T.price = (p, rate, big) => {
    const bs = NS.fmtBs(p.price, rate);
    return `<p class="price${big ? " price--lg" : ""}"><span class="price__usd">${NS.fmtUSD(p.price)}</span>${
      bs ? `<span class="price__bs">${bs}</span>` : ""
    }</p>`;
  };

  T.media = (p, opts = {}) => {
    const eager = opts.eager ? "eager" : "lazy";
    const img = `<img src="${T.esc(opts.base || "")}${T.esc(p.image)}" alt="${T.esc(p.name)}, componente para PC" width="400" height="400" loading="${eager}" decoding="async" onerror="this.remove()">`;
    return `<div class="label__window">${T.icon(p.category)}${img}</div>`;
  };

  // ctx: { base, whatsapp, bsRate, eager }
  T.waLink = (ctx, text) => NS.waUrl(ctx.whatsapp, text);

  T.card = (p, ctx) => {
    const base = ctx.base || "";
    const url = `${base}producto/${p.id}/`;
    const badge = !p.inStock
      ? `<span class="label__tag label__tag--out">Agotado</span>`
      : p.badge
      ? `<span class="label__tag">${T.esc(p.badge)}</span>`
      : "";
    const avail = p.inStock
      ? `<span class="dot dot--ok" aria-hidden="true"></span>En stock`
      : `<span class="dot dot--out" aria-hidden="true"></span>Agotado`;
    const action = p.inStock
      ? `<button class="btn btn--solid btn--block" type="button" data-add="${T.esc(p.id)}">Agregar al carrito</button>`
      : `<a class="btn btn--line btn--block" href="${T.esc(T.waLink(ctx, `Hola, quiero que me avisen cuando llegue el ${p.name}.`))}" target="_blank" rel="noopener">Avísame cuando llegue</a>`;
    return `<article class="label" data-id="${T.esc(p.id)}">
  <a class="label__link" href="${T.esc(url)}" aria-label="Ver ${T.esc(p.name)}">${badge}${T.media(p, { base, eager: ctx.eager })}</a>
  <div class="label__body">
    <p class="label__cat">${T.esc(p.category)}</p>
    <h3 class="label__name"><a href="${T.esc(url)}">${T.esc(p.name)}</a></h3>
    <ul class="label__specs">${p.specs.map((s) => `<li>${T.esc(s)}</li>`).join("")}</ul>
    <p class="label__avail">${avail}</p>
    ${T.price(p, ctx.bsRate, false)}
    <div class="label__actions">${action}</div>
  </div>
</article>`;
  };

  T.featured = (p, ctx) => {
    const base = ctx.base || "";
    return `<article class="label label--hero" aria-label="Producto destacado: ${T.esc(p.name)}">
  <div class="label__head"><span>${T.esc(p.category)}</span><span>${T.esc(p.model)}</span></div>
  <a class="label__link" href="${T.esc(base)}producto/${T.esc(p.id)}/">${T.media(p, { base, eager: true })}</a>
  <div class="label__body">
    <h2 class="label__name"><a href="${T.esc(base)}producto/${T.esc(p.id)}/">${T.esc(p.name)}</a></h2>
    <ul class="label__specs">${p.specs.map((s) => `<li>${T.esc(s)}</li>`).join("")}</ul>
    ${T.price(p, ctx.bsRate, true)}
    <p class="stamp">Garantía 90 días</p>
  </div>
</article>`;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = T;
  root.T = T;
})(typeof window !== "undefined" ? window : globalThis);
