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
const CATEGORIES = [...new Set(products.map((p) => p.category))];

const SUMMARY =
  "NaiguaStore es una tienda de componentes para PC nuevos en Naiguatá, La Guaira, Venezuela. " +
  "Vende procesadores, tarjetas gráficas, placas base, almacenamiento y memoria RAM con 90 días de garantía " +
  "por defecto de fábrica, envíos a todo el país y pagos con Binance, Zelle, Pago Móvil o efectivo.";

// Iconos de trazo (rellenos con currentColor)
const I = {
  cart: '<path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2v2h2l3.6 7.6-1.4 2.4A2 2 0 0 0 7 17h12v-2H7.4l1.1-2h7.5a2 2 0 0 0 1.7-1l3.6-6.5A1 1 0 0 0 20.4 5H5.2l-.9-2H1z"/>',
  search: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16.5 16.5 21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7" cy="17.5" r="1.8" fill="currentColor"/><circle cx="17" cy="17.5" r="1.8" fill="currentColor"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 10h19M6 15h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="13" width="4" height="6" rx="1.5" fill="currentColor"/><rect x="17" y="13" width="4" height="6" rx="1.5" fill="currentColor"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7.5" cy="8.5" r="1.5" fill="currentColor"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/>',
  wa: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" fill="currentColor"/>',
};
const svg = (name, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">${I[name]}</svg>`;

function shell({ base, page, title, description, canonical, jsonld = [], body }) {
  const home = `${base}index.html`;
  const cats = CATEGORIES.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
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
  <meta name="theme-color" content="#0a0f1d">
  <link rel="icon" href="${base}assets/img/logo.webp" type="image/webp">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap">
  <link rel="stylesheet" href="${base}css/styles.css">
  ${jsonld.map(ld).join("\n  ")}
</head>
<body data-page="${page}" data-base="${base}">
  <a class="skip" href="#app">Ir al contenido</a>
  <div id="loader" aria-hidden="true"><img src="${base}assets/img/logo.webp" alt=""></div>

  <header class="site-header">
    <div class="topbar">
      <a class="brand" href="${home}" aria-label="NaiguaStore, inicio"><img src="${base}assets/img/logo.webp" alt="NaiguaStore" width="44" height="44"></a>
      <form class="search" role="search" action="${home}" method="get" data-search-form>
        <label class="sr-only" for="cat-select">Categoría</label>
        <select id="cat-select" class="search__cat" data-cat-select>
          <option value="Todas">Todas las categorías</option>${cats}
        </select>
        <label class="sr-only" for="search">Buscar componentes</label>
        <input id="search" name="q" type="search" placeholder="Buscar componentes, marcas, modelos…" autocomplete="off">
        <button class="search__btn" type="submit" aria-label="Buscar">${svg("search")}</button>
      </form>
      <div class="topbar__items">
        <a class="topbar__item" href="${home}#garantia" aria-label="Garantía de 90 días">${svg("shield")}<span>Garantía</span></a>
        <a class="topbar__item" href="${home}#envios" aria-label="Envíos">${svg("truck")}<span>Envíos</span></a>
        <button class="cart-btn" id="cart-open" type="button" aria-label="Abrir carrito">
          ${svg("cart")}
          <span class="cart-btn__count" id="cart-count">0</span>
          <span class="cart-btn__total" id="cart-total-header">$0.00</span>
        </button>
      </div>
    </div>
    <nav class="subnav" aria-label="Principal">
      <a class="subnav__all" href="${home}#catalogo">${svg("menu")}<span>Componentes</span></a>
      ${CATEGORIES.map((c) => `<a href="${home}#catalogo" data-cat="${esc(c)}">${esc(c)}</a>`).join("")}
      <a class="subnav__offer" href="${home}#catalogo">${svg("tag")}<span>Ofertas</span></a>
      <a class="subnav__build" href="${home}#asesoria">Arma tu PC</a>
    </nav>
  </header>

  <main id="app" tabindex="-1">
${body}
  </main>

  <footer class="site-footer">
    <div class="site-footer__grid">
      <div>
        <img class="site-footer__logo" src="${base}assets/img/logo.webp" alt="NaiguaStore" width="56" height="56">
        <p>Hardware, componentes y tecnología para gamers, creadores y profesionales.</p>
      </div>
      <nav aria-label="Tienda">
        <h2>Tienda</h2>
        <a href="${home}#catalogo">Catálogo</a>
        ${CATEGORIES.slice(0, 4).map((c) => `<a href="${home}#catalogo" data-cat="${esc(c)}">${esc(c)}</a>`).join("")}
      </nav>
      <nav aria-label="Ayuda">
        <h2>Ayuda</h2>
        <a href="${home}#garantia">Garantía y términos</a>
        <a href="${home}#envios">Política de envíos</a>
        <a href="${home}#como-comprar">Cómo comprar</a>
        <a href="${home}#preguntas">Preguntas frecuentes</a>
      </nav>
      <div class="site-footer__contact">
        <h2>Contacto</h2>
        <a href="${esc(waHref("Hola NaiguaStore, tengo una pregunta."))}" target="_blank" rel="noopener">${svg("wa")}<span>WhatsApp ${esc(config.phoneDisplay)}</span></a>
        <p>${svg("pin")}<span>Naiguatá, La Guaira, Venezuela</span></p>
      </div>
    </div>
    <p class="site-footer__legal">© 2026 NaiguaStore. Todos los derechos reservados.</p>
  </footer>

  <nav class="bottom-nav" aria-label="Navegación móvil">
    <a href="${home}">Inicio</a>
    <a href="${home}#catalogo">Catálogo</a>
    <button type="button" data-open-cart>Carrito <span class="bottom-nav__count" id="cart-count-mobile">0</span></button>
    <a href="${esc(waHref("Hola NaiguaStore, tengo una pregunta."))}" target="_blank" rel="noopener">WhatsApp</a>
  </nav>

  <aside class="cart" id="cart" inert aria-label="Carrito de compras">
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
        <button class="btn btn--primary btn--block" id="cart-checkout" type="button">Continuar al pedido</button>
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

function sectionTitle(id, text, link) {
  return `<div class="sec-head"><h2 id="${id}"><span class="sec-head__bar" aria-hidden="true"></span>${esc(text)}</h2>${
    link ? `<a class="sec-head__link" href="${link.href}">${esc(link.text)} ${svg("arrow")}</a>` : ""
  }</div>`;
}

// ---------- Portada ----------
function homeBody() {
  const ctx = ctxFor("", true);
  const cards = products.map((p, i) => T.card(p, { ...ctx, eager: i < 2 })).join("\n");
  const catTiles = [
    ["Procesadores", "assets/img/cpus.webp"],
    ["Tarjetas gráficas", "assets/img/gpu.webp"],
    ["Memoria RAM", "assets/img/ram.webp"],
    ["Almacenamiento", "assets/img/ssd.webp"],
    ["Placas base", "assets/img/motherboards.webp"],
  ].filter(([c]) => CATEGORIES.includes(c));
  const chipsAll = ["Todas", ...CATEGORIES];
  return `
  <section class="hero">
    <div class="hero__copy">
      <p class="eyebrow"><span aria-hidden="true"></span>Componentes de calidad · Envíos rápidos</p>
      <h1>Arma tu PC con <em>precios claros.</em></h1>
      <p class="lead">${esc(SUMMARY)}</p>
      <div class="hero__cta">
        <a class="btn btn--primary btn--lg" href="#catalogo">${svg("cart")}<span>Ver catálogo</span></a>
        <a class="btn btn--outline btn--lg" href="${esc(waHref("Hola, quiero asesoría para armar mi PC."))}" target="_blank" rel="noopener">${svg("wa")}<span>Asesoría por WhatsApp</span></a>
      </div>
      <ul class="pays" aria-label="Métodos de pago">
        <li>Binance</li><li>Zelle</li><li>Pago Móvil</li><li>Efectivo</li><li class="pays__warranty">${svg("shield")}Garantía 90 días</li>
      </ul>
    </div>
    <figure class="hero__media"><img src="assets/img/hero-pc.webp" alt="Torre de PC gamer con iluminación RGB" width="1024" height="1024" fetchpriority="high"></figure>
  </section>

  <section class="features" aria-label="Ventajas">
    <div id="envios"><span class="features__ico">${svg("truck")}</span><div><strong>Envíos nacionales</strong><span>Entrega local y nacional</span></div></div>
    <div><span class="features__ico">${svg("card")}</span><div><strong>Métodos de pago</strong><span>Divisas y pago móvil</span></div></div>
    <div id="garantia"><span class="features__ico">${svg("shield")}</span><div><strong>Garantía 90 días</strong><span>Por defecto de fábrica</span></div></div>
    <div><span class="features__ico">${svg("headset")}</span><div><strong>Asesoría experta</strong><span>Respuesta por WhatsApp</span></div></div>
  </section>

  <section class="cats" aria-labelledby="cats-title">
    ${sectionTitle("cats-title", "Explora por categoría", { href: "#catalogo", text: "Ver todas las categorías" })}
    <div class="cats__grid">
      ${catTiles
        .map(
          ([c, img]) => `<a class="cat" href="#catalogo" data-cat="${esc(c)}">
        <img src="${img}" alt="" width="600" height="400" loading="lazy">
        <span class="cat__body"><strong>${esc(c)}</strong><span>Ver productos ${svg("arrow")}</span></span>
      </a>`
        )
        .join("\n      ")}
    </div>
  </section>

  <section class="catalog" id="catalogo" aria-labelledby="catalog-title">
    ${sectionTitle("catalog-title", "Catálogo", null)}
    <div class="catalog__bar">
      <div class="chips" id="chips" role="tablist" aria-label="Categorías">
        ${chipsAll
          .map((c, i) => {
            const n = c === "Todas" ? products.length : products.filter((p) => p.category === c).length;
            return `<button class="chip${i === 0 ? " is-on" : ""}" type="button" role="tab" aria-selected="${i === 0}" data-cat="${esc(c)}">${esc(c)} <span>${n}</span></button>`;
          })
          .join("")}
      </div>
      <label class="sort">Ordenar
        <select data-sort>
          <option value="featured">Destacados</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
        </select>
      </label>
    </div>
    <p class="count" id="count" aria-live="polite">${products.length} productos</p>
    <div class="grid" id="grid">${cards}</div>
  </section>

  <section class="promo" aria-labelledby="promo-title">
    <img src="assets/img/motherboards.webp" alt="" width="800" height="450" loading="lazy">
    <div class="promo__text">
      <h2 id="promo-title"><span class="sec-head__bar" aria-hidden="true"></span>Tu próxima PC empieza aquí.</h2>
      <p>Elige tus componentes, verifica la compatibilidad y arma un equipo a tu medida.</p>
      <a class="btn btn--gold" href="#asesoria">${svg("tag")}<span>Arma tu PC</span></a>
    </div>
  </section>

  <section class="how" id="como-comprar" aria-labelledby="how-title">
    ${sectionTitle("how-title", "Cómo comprar", null)}
    <ol class="steps">
      <li><strong>Elige</strong><span>Agrega productos al carrito y ve el total en dólares antes de confirmar.</span></li>
      <li><strong>Confirma por WhatsApp</strong><span>Revisamos stock, precio y envío contigo. Aún no se cobra nada.</span></li>
      <li><strong>Paga</strong><span>Con Binance, Zelle, Pago Móvil o efectivo, con los datos que te enviamos por WhatsApp.</span></li>
      <li><strong>Recibe</strong><span>Envío a todo el país o entrega local en Naiguatá y La Guaira.</span></li>
    </ol>
  </section>

  <section class="warranty" aria-labelledby="warranty-title">
    <div>
      <h2 id="warranty-title"><span class="sec-head__bar" aria-hidden="true"></span>Garantía de 90 días</h2>
      <p>Todos los componentes nuevos tienen 90 días de garantía directa en tienda contra defectos de fabricación.</p>
    </div>
    <div class="warranty__cols">
      <div><h3>Sí cubre</h3><p>Fallas que vienen de fábrica, sin daños causados por el uso.</p></div>
      <div><h3>No cubre</h3><p>Daños físicos (pines doblados, golpes, humedad), cortocircuitos por variaciones eléctricas y el uso de fuentes de poder genéricas insuficientes.</p></div>
    </div>
  </section>

  <section class="faq" id="preguntas" aria-labelledby="faq-title">
    ${sectionTitle("faq-title", "Preguntas frecuentes", null)}
    ${faq.map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("\n    ")}
  </section>

  <section class="advisor" id="asesoria" aria-labelledby="advisor-title">
    <div>
      <h2 id="advisor-title">Asesoría personalizada y pedidos especiales</h2>
      <p>Verificamos la compatibilidad de tu presupuesto o conseguimos cualquier componente que no veas en el catálogo.</p>
    </div>
    <a class="btn btn--primary btn--lg" href="${esc(waHref("Hola, necesito asesoría para armar mi PC."))}" target="_blank" rel="noopener">${svg("wa")}<span>Chatear con un asesor</span></a>
  </section>

  <section class="brands" aria-label="Marcas">
    <p>Nuestras marcas</p>
    <ul>${["AMD", "NVIDIA", "ASUS", "Corsair", "Samsung"].map((b) => `<li>${b}</li>`).join("")}</ul>
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
      logo: `${SITE}/assets/img/logo.webp`,
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
    <figure class="pdp__media">${T.media(p, { base, eager: true })}</figure>
    <div class="pdp__info">
      <p class="pcard__cat">${esc(p.category)}</p>
      <h1>${esc(p.name)}</h1>
      <p class="pcard__avail">${p.inStock ? '<span class="dot dot--ok" aria-hidden="true"></span>Disponible' : '<span class="dot dot--out" aria-hidden="true"></span>Agotado'}</p>
      <div class="pdp__price">${T.price(p, config.bsRate, true)}</div>
      <p class="lead">${esc(p.description)}</p>
      <ul class="specs">${p.specs.map((s) => `<li>${esc(s)}</li>`).join("")}<li>Garantía: ${esc(p.warranty)}</li></ul>
      <div class="pdp__actions">
        ${
          p.inStock
            ? `<button class="btn btn--primary btn--lg" type="button" data-add="${esc(p.id)}">${T.cartIcon}<span>Agregar al carrito</span></button>`
            : `<button class="btn btn--line btn--lg" type="button" disabled>Agotado</button>`
        }
        <a class="btn btn--outline btn--lg" href="${esc(waHref(`Hola, quiero consultar sobre el ${p.name}.`))}" target="_blank" rel="noopener">${T.waIcon}<span>Consultar por WhatsApp</span></a>
      </div>
      <p class="hint">Garantía directa en tienda contra defectos de fabricación. <a href="${base}index.html#garantia">Ver qué cubre</a>.</p>
    </div>
  </section>
  <section class="related">
    ${sectionTitle("related-title", "Otros componentes", null)}
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
      image: `${SITE}/${p.image}`,
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
  write(
    `producto/${p.id}/index.html`,
    shell({
      base: "../../",
      page: "producto",
      title: `${p.name} | NaiguaStore`,
      description: `${p.name}: ${p.specs.join(", ")}. ${p.price.toFixed(2)} USD, garantía de 90 días. Envíos a todo el país desde Naiguatá, La Guaira.`,
      canonical: `${SITE}/producto/${p.id}/`,
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
