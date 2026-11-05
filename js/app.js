// Interfaz: carga de datos, render de vistas, carrito y checkout.
(function () {
  const NS = window.NS;
  const CART_KEY = "naigua_cart_v1";
  const ORDER_KEY = "naigua_last_order_v1";
  const PAGE_SIZE = 12;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    config: null,
    products: [],
    cart: { items: [] },
    filters: { category: "Todas", query: "", sort: "featured", visible: PAGE_SIZE },
    delivery: "envio",
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $("#app");

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const waLink = (text) => NS.waUrl(state.config.whatsapp, text);

  // ---------- Persistencia (no bloquea si el navegador la rechaza) ----------
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) state.cart = JSON.parse(raw);
    } catch (e) {
      state.cart = { items: [] };
    }
    if (!state.cart || !Array.isArray(state.cart.items)) state.cart = { items: [] };
  }
  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch (e) {
      /* sin persistencia: el carrito sigue en memoria */
    }
  }

  // ---------- Analytics (solo si hay ID de GA4 configurado) ----------
  function setupAnalytics() {
    const id = state.config.gaId;
    if (!id) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id);
  }
  function track(name, params = {}) {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
  }

  // ---------- Utilidades de vista ----------
  function setTitle(t) {
    document.title = `${t} · ${state.config.storeName}`;
  }
  function setJsonLd(obj) {
    let el = document.getElementById("ld-json");
    if (!obj) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "ld-json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(obj);
  }
  function priceBlock(usd, big = false) {
    const bs = NS.fmtBs(usd, state.config.bsRate);
    return `<div class="price ${big ? "price--lg" : ""}"><span class="price__usd">${NS.fmtUSD(usd)}</span>${
      bs ? `<span class="price__bs">${bs}</span>` : ""
    }</div>`;
  }
  const img = (p) =>
    `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='assets/placeholder.svg'">`;

  // ---------- Tarjeta de producto ----------
  function productCard(p) {
    const badge = !p.inStock ? `<span class="badge badge--out">Agotado</span>` : p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "";
    const avail = p.inStock
      ? `<span class="avail avail--ok"></span>Disponible · entrega ${esc(p.delivery)}`
      : `<span class="avail avail--out"></span>Agotado`;
    const addBtn = p.inStock
      ? `<button class="btn btn--primary btn--block" data-add="${esc(p.id)}">Agregar al carrito</button>`
      : `<a class="btn btn--ghost btn--block" href="${waLink(`Hola, quiero que me avisen cuando llegue el ${p.name}.`)}" target="_blank" rel="noopener">Avísame cuando llegue</a>`;
    const waBtn = `<a class="btn btn--icon" href="${waLink(`Hola, tengo una duda sobre el ${p.name}.`)}" target="_blank" rel="noopener" aria-label="Consultar ${esc(p.name)} por WhatsApp" title="Consultar por WhatsApp">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg></a>`;

    return `<article class="card reveal" data-id="${esc(p.id)}">
      <a class="card__media" href="#/producto/${esc(p.id)}" aria-label="Ver ${esc(p.name)}">
        ${img(p)}${badge}
      </a>
      <div class="card__body">
        <p class="card__cat">${esc(p.category)}</p>
        <h3 class="card__name"><a href="#/producto/${esc(p.id)}">${esc(p.name)}</a></h3>
        <p class="card__specs">${p.specs.map(esc).join(" · ")}</p>
        <p class="card__avail">${avail}</p>
        ${priceBlock(p.price)}
        <div class="card__actions">${addBtn}${waBtn}</div>
        <a class="card__details" href="#/producto/${esc(p.id)}">Ver detalles</a>
      </div>
    </article>`;
  }

  // ---------- Home ----------
  function renderHome() {
    setTitle("Componentes para tu PC");
    setJsonLd(null);
    const featured = state.products.find((p) => p.id === state.config.featuredId) || state.products[0];
    app.innerHTML = `
      <section class="hero">
        <div class="hero__text reveal">
          <span class="eyebrow">${esc(state.config.tagline)}</span>
          <h1>Arma tu PC con precios claros</h1>
          <p class="lead">Hardware nuevo, garantía real y asesoría por WhatsApp.</p>
          <div class="hero__cta">
            <a class="btn btn--primary" href="#catalogo">Ver catálogo</a>
            <a class="btn btn--ghost" href="${waLink("Hola, quiero asesoría para armar mi PC.")}" target="_blank" rel="noopener">Asesoría por WhatsApp</a>
          </div>
          <ul class="chips-static" aria-label="Métodos de pago">
            ${state.config.payments.map((m) => `<li>${esc(m)}</li>`).join("")}
            <li>Garantía 90 días</li>
          </ul>
        </div>
        <a class="spotlight reveal" href="#/producto/${esc(featured.id)}">
          <span class="badge">Destacado</span>
          <div class="spotlight__img">${img(featured)}</div>
          <p class="card__cat">${esc(featured.category)}</p>
          <h2 class="spotlight__name">${esc(featured.name)}</h2>
          ${priceBlock(featured.price, true)}
        </a>
      </section>

      <section class="trust" aria-label="Confianza">
        ${[
          ["Envíos", "Entrega local y nacional"],
          ["Pagos", "Divisas y pago móvil"],
          ["Garantía", "90 días por defecto de fábrica"],
          ["Asesoría", "Respuesta por WhatsApp"],
        ]
          .map(([t, d]) => `<div class="trust__item reveal"><strong>${t}</strong><span>${d}</span></div>`)
          .join("")}
      </section>

      <section class="catalog" id="catalogo" aria-labelledby="catalog-title">
        <div class="section-head">
          <h2 id="catalog-title">Catálogo</h2>
          <div class="toolbar">
            <label class="sr-only" for="sort">Ordenar</label>
            <select id="sort" class="select" data-sort>
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>
        <div class="chips" id="chips" role="tablist" aria-label="Categorías"></div>
        <p class="count" id="count" aria-live="polite"></p>
        <div class="grid" id="grid"></div>
        <div class="more"><button class="btn btn--ghost" id="more" data-more hidden>Ver más</button></div>
      </section>

      <section class="advisor reveal">
        <div>
          <h2>Asesoría personalizada y pedidos especiales</h2>
          <p>Verificamos la compatibilidad de tu presupuesto o conseguimos cualquier componente que no veas en el catálogo.</p>
        </div>
        <a class="btn btn--primary" href="${waLink("Hola, necesito asesoría para armar mi PC.")}" target="_blank" rel="noopener">Chatear con un asesor</a>
      </section>`;
    $("#sort").value = state.filters.sort;
    renderCatalog();
  }

  function renderCatalog() {
    const grid = $("#grid");
    if (!grid) return;
    const cats = ["Todas", ...new Set(state.products.map((p) => p.category))];
    $("#chips").innerHTML = cats
      .map((c) => {
        const n = c === "Todas" ? state.products.length : state.products.filter((p) => p.category === c).length;
        const on = state.filters.category === c;
        return `<button class="chip ${on ? "is-on" : ""}" role="tab" aria-selected="${on}" data-cat="${esc(c)}">${esc(c)} (${n})</button>`;
      })
      .join("");

    const all = NS.filterSort(state.products, state.filters);
    const shown = all.slice(0, state.filters.visible);
    grid.innerHTML = shown.length
      ? shown.map(productCard).join("")
      : `<p class="empty">No encontramos productos con ese filtro. <button class="link" data-cat="Todas">Ver todo</button></p>`;
    $("#count").textContent = `${all.length} producto${all.length === 1 ? "" : "s"}`;
    $("#more").hidden = all.length <= state.filters.visible;
    observeReveal();
  }

  // ---------- Ficha de producto ----------
  function renderProduct(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return renderNotFound();
    setTitle(p.name);
    setJsonLd({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      image: p.image,
      category: p.category,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: p.price.toFixed(2),
        availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    });
    const addBtn = p.inStock
      ? `<button class="btn btn--primary btn--block" data-add="${esc(p.id)}">Agregar al carrito</button>`
      : `<button class="btn btn--ghost btn--block" disabled>Agotado</button>`;
    app.innerHTML = `
      <nav class="crumbs"><a href="#/">Inicio</a> / <a href="#catalogo">${esc(p.category)}</a> / <span>${esc(p.name)}</span></nav>
      <section class="pdp">
        <div class="pdp__media">${img(p)}</div>
        <div class="pdp__info">
          <p class="card__cat">${esc(p.category)}</p>
          <h1>${esc(p.name)}</h1>
          <p class="card__avail">${p.inStock ? `<span class="avail avail--ok"></span>Disponible · entrega ${esc(p.delivery)}` : `<span class="avail avail--out"></span>Agotado`}</p>
          ${priceBlock(p.price, true)}
          <p>${esc(p.description)}</p>
          <ul class="specs">
            ${p.specs.map((s) => `<li>${esc(s)}</li>`).join("")}
            <li>Garantía: ${esc(p.warranty)}</li>
          </ul>
          <div class="pdp__actions">
            ${addBtn}
            <a class="btn btn--ghost btn--block" href="${waLink(`Hola, quiero consultar sobre el ${p.name}.`)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          </div>
        </div>
      </section>`;
  }

  function renderNotFound() {
    setTitle("No encontrado");
    app.innerHTML = `<section class="empty-page"><h1>Producto no encontrado</h1><a class="btn btn--primary" href="#catalogo">Ver catálogo</a></section>`;
  }

  // ---------- Carrito (panel) ----------
  function renderCart() {
    const lines = NS.cartLines(state.cart, state.products);
    const total = NS.cartTotal(lines);
    const body = $("#cart-body");
    $("#cart-count").textContent = NS.cartCount(state.cart);
    $("#cart-count-mobile").textContent = NS.cartCount(state.cart);
    if (!lines.length) {
      body.innerHTML = `<div class="cart-empty"><p>Tu carrito está vacío.</p>
        <a class="btn btn--primary" href="#catalogo" data-close-cart>Ver catálogo</a>
        <a class="btn btn--ghost" href="${waLink("Hola, necesito ayuda para elegir productos.")}" target="_blank" rel="noopener">Chatear con un asesor</a></div>`;
      $("#cart-footer").hidden = true;
      return;
    }
    body.innerHTML = lines
      .map(
        (l) => `<div class="cart-line">
          <div class="cart-line__img">${img(l.product)}</div>
          <div class="cart-line__info">
            <strong>${esc(l.product.name)}</strong>
            <div class="qty">
              <button data-qty="${esc(l.product.id)}" data-delta="-1" aria-label="Quitar uno">−</button>
              <span aria-label="Cantidad">${l.qty}</span>
              <button data-qty="${esc(l.product.id)}" data-delta="1" aria-label="Agregar uno" ${l.qty >= NS.MAX_QTY ? "disabled" : ""}>+</button>
            </div>
          </div>
          <div class="cart-line__price">
            <span>${NS.fmtUSD(l.lineTotal)}</span>
            <button class="link" data-remove="${esc(l.product.id)}">Eliminar</button>
          </div>
        </div>`
      )
      .join("");
    $("#cart-footer").hidden = false;
    $("#cart-total").textContent = NS.fmtUSD(total);
    const bs = NS.fmtBs(total, state.config.bsRate);
    $("#cart-total-bs").textContent = bs || "";
  }

  function openCart() {
    renderCart();
    $("#cart").classList.add("is-open");
    $("#cart").setAttribute("aria-hidden", "false");
    $("#cart-close").focus();
  }
  function closeCart() {
    $("#cart").classList.remove("is-open");
    $("#cart").setAttribute("aria-hidden", "true");
  }

  // Imagen que vuela al icono del carrito (se omite con movimiento reducido).
  function flyToCart(card) {
    if (reduceMotion || !card) return;
    const from = card.querySelector("img");
    const to = $("#cart-open");
    if (!from || !to) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const ghost = from.cloneNode();
    ghost.className = "fly";
    ghost.style.left = a.left + "px";
    ghost.style.top = a.top + "px";
    ghost.style.width = a.width + "px";
    ghost.style.height = a.height + "px";
    document.body.appendChild(ghost);
    ghost
      .animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(0.15)`, opacity: 0.3 },
        ],
        { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" }
      )
      .finished.then(() => ghost.remove());
  }

  function addToCart(id, btn) {
    const p = state.products.find((x) => x.id === id);
    if (!p || !p.inStock) return;
    NS.addToCart(state.cart, id, Math.min(NS.MAX_QTY, p.stock || NS.MAX_QTY));
    saveCart();
    track("add_to_cart", { currency: "USD", value: p.price, items: [{ item_id: p.id, item_name: p.name, price: p.price }] });
    flyToCart(btn && btn.closest(".card, .pdp"));
    $("#cart-count").classList.remove("bump");
    void $("#cart-count").offsetWidth;
    $("#cart-count").classList.add("bump");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Agregado ✓";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1200);
    }
    renderCart();
    if (window.innerWidth >= 768) openCart();
  }

  // ---------- Checkout ----------
  function renderCheckout() {
    setTitle("Pedido");
    const lines = NS.cartLines(state.cart, state.products);
    if (!lines.length) {
      app.innerHTML = `<section class="empty-page"><h1>Tu carrito está vacío</h1><p>Agrega productos antes de continuar.</p><a class="btn btn--primary" href="#catalogo">Ver catálogo</a></section>`;
      return;
    }
    track("begin_checkout", { currency: "USD", value: NS.cartTotal(lines) });
    const total = NS.cartTotal(lines);
    const stateOptions = state.config.states.map((s) => `<option>${esc(s)}</option>`).join("");
    app.innerHTML = `
      <section class="checkout">
        <form id="checkout-form" class="checkout__form" novalidate>
          <h1>Confirma tu pedido</h1>
          <p class="safe">🔒 No pedimos datos de tarjeta. Confirmamos stock y precio antes de cobrar; los datos de pago te los enviamos por WhatsApp.</p>

          <fieldset>
            <legend>Tus datos</legend>
            <label>Nombre completo<input name="name" autocomplete="name" required minlength="3"><small class="err" data-err="name"></small></label>
            <label>Teléfono (WhatsApp)<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0414 000 0000" required><small class="err" data-err="phone"></small></label>
          </fieldset>

          <fieldset>
            <legend>Entrega</legend>
            <label class="radio"><input type="radio" name="delivery" value="envio" checked> Envío a domicilio</label>
            <label class="radio"><input type="radio" name="delivery" value="retiro"> Retiro en Naiguatá / La Guaira</label>
            <div id="ship-fields">
              <label>Estado<select name="state">${stateOptions}</select></label>
              <label>Ciudad<input name="city" autocomplete="address-level2"><small class="err" data-err="city"></small></label>
              <label>Dirección completa<textarea name="address" rows="2" autocomplete="street-address"></textarea><small class="err" data-err="address"></small></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Método de pago</legend>
            ${state.config.payments
              .map((m, i) => `<label class="radio"><input type="radio" name="payment" value="${esc(m)}" ${i === 0 ? "checked" : ""}> ${esc(m)}</label>`)
              .join("")}
            <small class="hint">Te enviamos los datos de pago por WhatsApp después de confirmar.</small>
          </fieldset>

          <label>Notas (opcional)<textarea name="notes" rows="2" maxlength="300"></textarea></label>

          <button class="btn btn--primary btn--block btn--lg" type="submit">Confirmar pedido por WhatsApp</button>
        </form>

        <aside class="checkout__summary" aria-label="Resumen">
          <h2>Resumen</h2>
          ${lines
            .map((l) => `<div class="sum-line"><span>${esc(l.product.name)} × ${l.qty}</span><span>${NS.fmtUSD(l.lineTotal)}</span></div>`)
            .join("")}
          <div class="sum-line"><span>Envío</span><span>A confirmar</span></div>
          <div class="sum-total"><strong>Total estimado</strong><strong>${NS.fmtUSD(total)}</strong></div>
          <a class="link" href="#/">← Seguir comprando</a>
        </aside>
      </section>`;
  }

  function validateCheckout(form) {
    const f = new FormData(form);
    const errors = {};
    if (!NS.isValidName(f.get("name"))) errors.name = "Escribe tu nombre completo.";
    if (!NS.isValidVePhone(f.get("phone"))) errors.phone = "Usa un número móvil venezolano, ej. 0414 000 0000.";
    if (f.get("delivery") === "envio") {
      if (!String(f.get("city") || "").trim()) errors.city = "Indica la ciudad.";
      if (String(f.get("address") || "").trim().length < 10) errors.address = "Escribe la dirección completa.";
    }
    return errors;
  }

  function submitCheckout(form) {
    const errors = validateCheckout(form);
    form.querySelectorAll("[data-err]").forEach((el) => (el.textContent = errors[el.dataset.err] || ""));
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      const field = form.querySelector(`[name="${firstKey}"]`);
      if (field) field.focus();
      return;
    }
    const f = new FormData(form);
    const lines = NS.cartLines(state.cart, state.products);
    const order = {
      id: NS.orderId(),
      name: String(f.get("name")).trim(),
      phone: String(f.get("phone")).trim(),
      delivery:
        f.get("delivery") === "envio"
          ? { type: "envio", state: f.get("state"), city: String(f.get("city")).trim(), address: String(f.get("address")).trim() }
          : { type: "retiro" },
      payment: f.get("payment"),
      notes: String(f.get("notes") || "").trim(),
    };
    const text = NS.buildMessage(order, lines);
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify({ id: order.id, text, url: waLink(text) }));
    } catch (e) {
      /* sin persistencia: la pantalla de gracias no podrá recuperar el texto */
    }
    track("generate_lead", { currency: "USD", value: NS.cartTotal(lines) });
    window.open(waLink(text), "_blank", "noopener");
    location.hash = "#/gracias";
  }

  function renderThanks() {
    setTitle("Pedido enviado");
    let last = null;
    try {
      last = JSON.parse(localStorage.getItem(ORDER_KEY));
    } catch (e) {
      last = null;
    }
    if (!last) {
      app.innerHTML = `<section class="empty-page"><h1>No hay pedidos recientes</h1><a class="btn btn--primary" href="#/">Ir al inicio</a></section>`;
      return;
    }
    app.innerHTML = `
      <section class="thanks">
        <h1>Pedido enviado</h1>
        <p>Número de pedido: <strong>${esc(last.id)}</strong>. Te respondemos por WhatsApp para confirmar stock, envío y pago.</p>
        <p class="hint">Si WhatsApp no se abrió, usa el botón o copia el texto.</p>
        <div class="thanks__actions">
          <a class="btn btn--primary" href="${esc(last.url)}" target="_blank" rel="noopener">Abrir WhatsApp</a>
          <button class="btn btn--ghost" data-copy>Copiar texto</button>
          <button class="btn btn--ghost" data-done>Listo, vaciar carrito</button>
        </div>
        <pre class="preview" id="preview">${esc(last.text)}</pre>
      </section>`;
    track("purchase_intent_whatsapp", { order_id: last.id });
  }

  // ---------- Router ----------
  function route() {
    const hash = location.hash || "#/";
    closeCart();
    const onHome = hash === "#/" || hash === "#" || hash === "" || hash === "#catalogo";
    if (hash.startsWith("#/producto/")) renderProduct(decodeURIComponent(hash.slice("#/producto/".length)));
    else if (hash === "#/checkout") renderCheckout();
    else if (hash === "#/gracias") renderThanks();
    else if (onHome) {
      if (!$("#grid")) renderHome();
      if (hash === "#catalogo") $("#catalogo").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    } else renderNotFound();
    if (!onHome) window.scrollTo({ top: 0, behavior: "auto" });
    observeReveal();
    renderCart();
  }

  // ---------- Animaciones de entrada ----------
  let io = null;
  function observeReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
      return;
    }
    if (!io) {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io.unobserve(e.target);
            }
          }),
        { threshold: 0.12 }
      );
    }
    document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => io.observe(el));
  }

  function hideLoader() {
    const l = $("#loader");
    if (!l || l.classList.contains("done")) return;
    l.classList.add("done");
    setTimeout(() => l.remove(), 320);
  }

  // ---------- Eventos ----------
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-add],[data-qty],[data-remove],[data-cat],[data-more],[data-open-cart],[data-close-cart],[data-copy],[data-done]");
    if (!t) return;
    if (t.dataset.add) return addToCart(t.dataset.add, t);
    if (t.dataset.qty) {
      const item = state.cart.items.find((i) => i.id === t.dataset.qty);
      if (item) NS.setQty(state.cart, item.id, item.qty + Number(t.dataset.delta));
      saveCart();
      return renderCart();
    }
    if (t.dataset.remove) {
      NS.removeItem(state.cart, t.dataset.remove);
      saveCart();
      return renderCart();
    }
    if (t.dataset.cat !== undefined) {
      state.filters.category = t.dataset.cat;
      state.filters.visible = PAGE_SIZE;
      return renderCatalog();
    }
    if (t.hasAttribute("data-more")) {
      state.filters.visible += PAGE_SIZE;
      return renderCatalog();
    }
    if (t.hasAttribute("data-open-cart")) return openCart();
    if (t.hasAttribute("data-close-cart")) return closeCart();
    if (t.hasAttribute("data-copy")) {
      const text = $("#preview") ? $("#preview").textContent : "";
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => (t.textContent = "Copiado ✓"), () => {});
      return;
    }
    if (t.hasAttribute("data-done")) {
      state.cart = { items: [] };
      saveCart();
      location.hash = "#/";
    }
  });

  document.addEventListener("change", (ev) => {
    if (ev.target.name === "delivery") {
      const show = ev.target.value === "envio";
      const box = $("#ship-fields");
      if (box) box.hidden = !show;
    }
    if (ev.target.matches("[data-sort]")) {
      state.filters.sort = ev.target.value;
      state.filters.visible = PAGE_SIZE;
      renderCatalog();
    }
  });

  document.addEventListener("submit", (ev) => {
    if (ev.target.id === "checkout-form") {
      ev.preventDefault();
      submitCheckout(ev.target);
    }
  });

  $("#search").addEventListener("input", (ev) => {
    state.filters.query = ev.target.value;
    state.filters.visible = PAGE_SIZE;
    if (!$("#grid")) {
      location.hash = "#catalogo";
      renderHome();
    }
    renderCatalog();
  });

  $("#cart-open").addEventListener("click", openCart);
  $("#cart-close").addEventListener("click", closeCart);
  $("#cart-overlay").addEventListener("click", closeCart);
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeCart();
  });
  $("#cart-checkout").addEventListener("click", () => {
    closeCart();
    location.hash = "#/checkout";
  });
  window.addEventListener("hashchange", route);

  // ---------- Arranque ----------
  async function init() {
    try {
      const [cfg, prods] = await Promise.all([
        fetch("data/config.json").then((r) => r.json()),
        fetch("data/products.json").then((r) => r.json()),
      ]);
      state.config = cfg;
      state.products = prods;
    } catch (e) {
      app.innerHTML = `<section class="empty-page"><h1>No pudimos cargar el catálogo</h1><p>Intenta de nuevo en unos minutos.</p></section>`;
      hideLoader();
      return;
    }
    setupAnalytics();
    loadCart();
    route();
    hideLoader();
  }

  init();
  setTimeout(hideLoader, 2500);
})();
