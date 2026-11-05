// Genera las páginas estáticas: portada, una página por producto, sitemap y llms.txt.
// Uso: node scripts/build.mjs   (sin dependencias; requiere Node 18+)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NS = require(join(root, "js/logic.js"));
const T = require(join(root, "js/templates.js"));

const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const config = read("data/config.json");
const products = read("data/products.json");
const faq = read("data/faq.json");
const SITE = config.siteUrl.replace(/\/$/, "");
const TODAY = new Date().toISOString().slice(0, 10);
const esc = T.esc;
const ctxFor = (base, eager = false) => ({ base, whatsapp: config.whatsapp, bsRate: config.bsRate, eager });
const waHref = (text) => NS.waUrl(config.whatsapp, text);
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

const SUMMARY =
  "NaiguaStore es una tienda de componentes para PC nuevos en Naiguatá, La Guaira, Venezuela. " +
  "Vende procesadores, tarjetas gráficas, placas base, almacenamiento y memoria RAM con 90 días de garantía " +
  "por defecto de fábrica, envíos a todo el país y pagos con Binance, Zelle, Pago Móvil o efectivo.";

function shell({ base, page, title, description, canonical, jsonld = [], body }) {
  const homeHref = `${base}index.html`;
  return `<!doctype html>
<html lang="es-VE">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="${page === "producto" ? "product" : "website"}">
  <meta property="og:site_name" content="NaiguaStore">
  <meta property="og:locale" content="es_VE">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#0e1116">
  <link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="${base}css/styles.css">
  ${jsonld.map(ld).join("\n  ")}
</head>
<body data-page="${page}" data-base="${base}">
  <a class="skip" href="#app">Ir al contenido</a>
  <div id="loader" aria-hidden="true"><span class="loader__mark"></span><span class="loader__name">Naigua<b>Store</b></span></div>

  <div class="strip">Envíos a todo el país · Entregas locales en Naiguatá y La Guaira · Garantía de 90 días</div>

  <header class="site-header">
    <div class="site-header__bar">
      <a class="brand" href="${homeHref}" aria-label="NaiguaStore, inicio">
        <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M0 0h22l10 10v22H0z" fill="#f2b705"/><path d="M7 25V7h4l8 11V7h4v18h-4L11 14v11z" fill="#0e1116"/></svg>
        <span class="brand__name">Naigua<b>Store</b></span>
      </a>
      <form class="search" role="search" action="${homeHref}" method="get" data-search-form>
        <label class="sr-only" for="search">Buscar componentes</label>
        <input id="search" name="q" type="search" placeholder="Buscar Ryzen, RTX, DDR5…" autocomplete="off">
      </form>
      <button class="cart-btn" id="cart-open" type="button" aria-label="Abrir carrito">
        <span>Carrito</span><span class="cart-btn__count" id="cart-count">0</span>
      </button>
    </div>
    <nav class="site-header__nav" aria-label="Principal">
      <a href="${homeHref}#catalogo">Catálogo</a>
      <a href="${homeHref}#como-comprar">Cómo comprar</a>
      <a href="${homeHref}#garantia">Garantía</a>
      <a href="${homeHref}#preguntas">Preguntas</a>
      <a href="${homeHref}#/checkout">Pedido</a>
    </nav>
  </header>

  <main id="app" tabindex="-1">
${body}
  </main>

  <footer class="site-footer">
    <div class="site-footer__top">
      <div>
        <p class="brand__name site-footer__name">Naigua<b>Store</b></p>
        <p>Componentes para PC nuevos. Naiguatá, La Guaira, Venezuela.</p>
      </div>
      <nav aria-label="Pie de página">
        <a href="${homeHref}#catalogo">Catálogo</a>
        <a href="${homeHref}#garantia">Garantía</a>
        <a href="${homeHref}#preguntas">Preguntas frecuentes</a>
        <a href="${homeHref}#/checkout">Pedido</a>
      </nav>
      <a class="btn btn--solid" href="${esc(waHref("Hola NaiguaStore, tengo una pregunta."))}" target="_blank" rel="noopener">WhatsApp ${esc(config.phoneDisplay)}</a>
    </div>
    <p class="site-footer__legal">© 2026 NaiguaStore</p>
  </footer>

  <nav class="bottom-nav" aria-label="Navegación móvil">
    <a href="${homeHref}">Inicio</a>
    <a href="${homeHref}#catalogo">Catálogo</a>
    <button type="button" data-open-cart>Carrito <span class="bottom-nav__count" id="cart-count-mobile">0</span></button>
    <a href="${esc(waHref("Hola NaiguaStore, tengo una pregunta."))}" target="_blank" rel="noopener">WhatsApp</a>
  </nav>

  <aside class="cart" id="cart" aria-hidden="true" aria-label="Carrito de compras">
    <div class="cart__overlay" id="cart-overlay"></div>
    <div class="cart__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <header class="cart__head">
        <h2 id="cart-title">Tu carrito</h2>
        <button class="icon-btn" id="cart-close" type="button" aria-label="Cerrar carrito">×</button>
      </header>
      <div class="cart__body" id="cart-body"></div>
      <footer class="cart__foot" id="cart-footer" hidden>
        <div class="sum-line"><span>Total estimado</span><span><strong id="cart-total">$0.00</strong><small id="cart-total-bs"></small></span></div>
        <p class="hint">El envío se calcula al confirmar. No se te cobra nada todavía.</p>
        <button class="btn btn--solid btn--block" id="cart-checkout" type="button">Continuar al pedido</button>
      </footer>
    </div>
  </aside>

  <script src="${base}js/logic.js"></script>
  <script src="${base}js/templates.js"></script>
  <script src="${base}js/app.js" defer></script>
</body>
</html>
`;
}

// ---------- Portada ----------
function homeBody() {
  const featured = products.find((p) => p.id === config.featuredId) || products[0];
  const ctx = ctxFor("", true);
  const cards = products.map((p, i) => T.card(p, { ...ctx, eager: i < 2 })).join("\n");
  const cats = ["Todas", ...new Set(products.map((p) => p.category))];
  return `
  <section class="hero">
    <div class="hero__copy">
      <p class="eyebrow">Naiguatá, La Guaira</p>
      <h1>Componentes para PC nuevos, con garantía de 90 días</h1>
      <p class="lead">${esc(SUMMARY)}</p>
      <div class="hero__cta">
        <a class="btn btn--solid" href="#catalogo">Ver catálogo</a>
        <a class="btn btn--line" href="${esc(waHref("Hola, quiero asesoría para armar mi PC."))}" target="_blank" rel="noopener">Preguntar por WhatsApp</a>
      </div>
      <dl class="facts">
        <div><dt>Envíos</dt><dd>A todo el país</dd></div>
        <div><dt>Entregas locales</dt><dd>Naiguatá y La Guaira</dd></div>
        <div><dt>Garantía</dt><dd>90 días de fábrica</dd></div>
        <div><dt>Pagos</dt><dd>Binance, Zelle, Pago Móvil, efectivo</dd></div>
      </dl>
    </div>
    ${T.featured(featured, ctx)}
  </section>

  <section class="catalog" id="catalogo" aria-labelledby="catalog-title">
    <div class="section-head">
      <h2 id="catalog-title">Catálogo</h2>
      <label class="sort">Ordenar
        <select data-sort>
          <option value="featured">Destacados</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
        </select>
      </label>
    </div>
    <div class="chips" id="chips" role="tablist" aria-label="Categorías">
      ${cats
        .map((c, i) => {
          const n = c === "Todas" ? products.length : products.filter((p) => p.category === c).length;
          return `<button class="chip${i === 0 ? " is-on" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-cat="${esc(c)}">${esc(c)} <span>${n}</span></button>`;
        })
        .join("")}
    </div>
    <p class="count" id="count" aria-live="polite">${products.length} productos</p>
    <div class="grid" id="grid">${cards}</div>
  </section>

  <section class="how" id="como-comprar" aria-labelledby="how-title">
    <h2 id="how-title">Cómo comprar</h2>
    <ol class="steps">
      <li><strong>Elige</strong><span>Agrega productos al carrito. Ves el total en dólares antes de confirmar.</span></li>
      <li><strong>Confirma por WhatsApp</strong><span>Revisamos stock, precio y envío contigo. Aún no se cobra nada.</span></li>
      <li><strong>Paga</strong><span>Con Binance, Zelle, Pago Móvil o efectivo, con los datos que te enviamos por WhatsApp.</span></li>
      <li><strong>Recibe</strong><span>Envío a todo el país o entrega local en Naiguatá y La Guaira.</span></li>
    </ol>
  </section>

  <section class="warranty" id="garantia" aria-labelledby="warranty-title">
    <h2 id="warranty-title">Garantía de 90 días</h2>
    <p>Todos los componentes nuevos tienen 90 días de garantía directa en tienda contra defectos de fabricación.</p>
    <div class="warranty__cols">
      <div><h3>Sí cubre</h3><p>Fallas que vienen de fábrica, sin daños causados por el uso.</p></div>
      <div><h3>No cubre</h3><p>Daños físicos (pines doblados, golpes, humedad), cortocircuitos por variaciones eléctricas y el uso de fuentes de poder genéricas insuficientes.</p></div>
    </div>
  </section>

  <section class="faq" id="preguntas" aria-labelledby="faq-title">
    <h2 id="faq-title">Preguntas frecuentes</h2>
    ${faq
      .map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
      .join("\n    ")}
  </section>

  <section class="advisor" aria-labelledby="advisor-title">
    <div>
      <h2 id="advisor-title">¿No sabes qué comprar?</h2>
      <p>Te ayudamos a revisar la compatibilidad de tu presupuesto (procesador, placa base, memoria y fuente) o buscamos un componente que no esté en el catálogo.</p>
    </div>
    <a class="btn btn--solid" href="${esc(waHref("Hola, necesito asesoría para armar mi PC."))}" target="_blank" rel="noopener">Hablar con un asesor</a>
  </section>`;
}

function homeJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Store",
      "@id": `${SITE}/#store`,
      name: "NaiguaStore",
      url: `${SITE}/`,
      description: SUMMARY,
      telephone: config.phoneDisplay,
      address: { "@type": "PostalAddress", addressLocality: "Naiguatá", addressRegion: "La Guaira", addressCountry: "VE" },
      areaServed: { "@type": "Country", name: "Venezuela" },
      paymentAccepted: "Binance, Zelle, Pago Móvil, Efectivo",
      currenciesAccepted: "USD",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Componentes para PC",
        itemListElement: products.map((p) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Product", name: p.name, url: `${SITE}/producto/${p.id}/` },
          price: p.price.toFixed(2),
          priceCurrency: "USD",
          availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Componentes para PC de NaiguaStore",
      itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/producto/${p.id}/`, name: p.name })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
}

// ---------- Producto ----------
function productBody(p) {
  const base = "../../";
  const ctx = ctxFor(base, true);
  const related = products.filter((x) => x.id !== p.id).slice(0, 3);
  return `
  <nav class="crumbs" aria-label="Migas de pan"><a href="${base}index.html">Inicio</a> / <a href="${base}index.html#catalogo">${esc(p.category)}</a> / <span>${esc(p.name)}</span></nav>
  <section class="pdp">
    <article class="label label--pdp">
      <div class="label__head"><span>${esc(p.category)}</span><span>${esc(p.model)}</span></div>
      ${T.media(p, { base, eager: true })}
      <div class="label__body">
        <h1 class="label__name">${esc(p.name)}</h1>
        <p class="label__avail">${p.inStock ? '<span class="dot dot--ok" aria-hidden="true"></span>En stock' : '<span class="dot dot--out" aria-hidden="true"></span>Agotado'}</p>
        ${T.price(p, config.bsRate, true)}
        <ul class="label__specs">${p.specs.map((s) => `<li>${esc(s)}</li>`).join("")}<li>Garantía: ${esc(p.warranty)}</li></ul>
      </div>
    </article>
    <div class="pdp__info">
      <p class="lead">${esc(p.description)}</p>
      <div class="pdp__actions">
        ${
          p.inStock
            ? `<button class="btn btn--solid btn--block" type="button" data-add="${esc(p.id)}">Agregar al carrito</button>`
            : `<button class="btn btn--line btn--block" type="button" disabled>Agotado</button>`
        }
        <a class="btn btn--line btn--block" href="${esc(waHref(`Hola, quiero consultar sobre el ${p.name}.`))}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
      </div>
      <p class="hint">Garantía directa en tienda contra defectos de fabricación. <a href="${base}index.html#garantia">Ver qué cubre</a>.</p>
    </div>
  </section>
  <section class="related" aria-labelledby="related-title">
    <h2 id="related-title">Otros componentes</h2>
    <div class="grid">${related.map((r) => T.card(r, { ...ctx, eager: false })).join("\n")}</div>
  </section>`;
}

function productJsonLd(p) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: p.category, item: `${SITE}/#catalogo` },
        { "@type": "ListItem", position: 3, name: p.name, item: `${SITE}/producto/${p.id}/` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      category: p.category,
      ...(existsSync(join(root, p.image)) ? { image: `${SITE}/${p.image}` } : {}),
      brand: { "@type": "Brand", name: p.name.split(" ")[0] },
      offers: {
        "@type": "Offer",
        url: `${SITE}/producto/${p.id}/`,
        priceCurrency: "USD",
        price: p.price.toFixed(2),
        availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Store", name: "NaiguaStore", url: `${SITE}/` },
      },
    },
  ];
}

// ---------- Escritura ----------
function write(rel, content) {
  const full = join(root, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
}

write(
  "index.html",
  shell({
    base: "",
    page: "inicio",
    title: "NaiguaStore | Componentes para PC nuevos en Naiguatá, Venezuela",
    description: "Procesadores, tarjetas gráficas, placas base, SSD y RAM nuevos. Garantía de 90 días, envíos a todo el país y pagos con Binance, Zelle o Pago Móvil.",
    canonical: `${SITE}/`,
    jsonld: homeJsonLd(),
    body: homeBody(),
  })
);

for (const p of products) {
  const url = `${SITE}/producto/${p.id}/`;
  write(
    `producto/${p.id}/index.html`,
    shell({
      base: "../../",
      page: "producto",
      title: `${p.name} | NaiguaStore`,
      description: `${p.name}: ${p.specs.join(", ")}. ${p.price.toFixed(2)} USD, garantía de 90 días. Envíos a todo el país desde Naiguatá, La Guaira.`,
      canonical: url,
      jsonld: productJsonLd(p),
      body: productBody(p),
    })
  );
}

const urls = [`${SITE}/`, ...products.map((p) => `${SITE}/producto/${p.id}/`)];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`
);

write(
  "llms.txt",
  `# NaiguaStore

> ${SUMMARY}

Contacto y compras: WhatsApp ${config.phoneDisplay} (https://wa.me/${config.whatsapp}). Precios en USD.

## Productos
${products
  .map((p) => `- [${p.name}](${SITE}/producto/${p.id}/): ${p.price.toFixed(2)} USD, ${p.inStock ? "en stock" : "agotado"}`)
  .join("\n")}

## Políticas
- Garantía: 90 días directa en tienda contra defectos de fabricación. No cubre daños físicos, cortocircuitos por variaciones eléctricas ni fuentes de poder genéricas insuficientes.
- Envíos: a todo el país. Costo y tiempo se confirman por WhatsApp antes de pagar.
- Entregas locales: Naiguatá y La Guaira.
- Pagos: Binance, Zelle, Pago Móvil y efectivo. Los datos de pago se envían por WhatsApp después de confirmar el pedido. La web no pide datos de tarjeta.
- Asesoría de compatibilidad: por WhatsApp.

## Preguntas frecuentes
${faq.map((f) => `- ${f.q} ${f.a}`).join("\n")}
`
);

console.log(`Generado: index.html, ${products.length} páginas de producto, sitemap.xml, llms.txt`);
