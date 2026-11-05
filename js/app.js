// Interfaz: carrito, buscador, filtros, checkout y pantalla de gracias.
// La portada y las fichas vienen generadas en HTML (scripts/build.mjs); aquí solo se añade comportamiento.
(function () {
  const NS = window.NS;
  const T = window.T;
  const CART_KEY = "naigua_cart_v1";
  const ORDER_KEY = "naigua_last_order_v1";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const base = body.dataset.base || "";
  const isHome = body.dataset.page === "inicio";

  const state = {
    config: null,
    products: [],
    cart: { items: [] },
    filters: { category: "Todas", query: "", sort: "featured" },
  };
  let homeHtml = null;

  const $ = (sel) => document.querySelector(sel);
  const app = $("#app");
  const waLink = (text) => NS.waUrl(state.config.whatsapp, text);
  const ctx = () => ({ base: "", whatsapp: state.config.whatsapp, bsRate: state.config.bsRate, eager: false });

  // ---------- Persistencia ----------
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

  // ---------- Analítica (solo con ID configurado) ----------
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

  // ---------- Carrito ----------
  function renderCart() {
    const lines = NS.cartLines(state.cart, state.products);
    const total = NS.cartTotal(lines);
    const count = NS.cartCount(state.cart);
    $("#cart-count").textContent = count;
    $("#cart-count-mobile").textContent = count;
    $("#cart-total-header").textContent = NS.fmtUSD(total);
    const bodyEl = $("#cart-body");
    if (!lines.length) {
      bodyEl.innerHTML = `<div class="cart-empty"><p>Tu carrito está vacío.</p>
        <a class="btn btn--solid" href="${base}index.html#catalogo" data-close-cart>Ver catálogo</a></div>`;
      $("#cart-footer").hidden = true;
      return;
    }
    bodyEl.innerHTML = lines
      .map(
        (l) => `<div class="cart-line">
          <div class="cart-line__img">${T.icon(l.product.category)}</div>
          <div class="cart-line__info">
            <strong>${T.esc(l.product.name)}</strong>
            <div class="qty">
              <button type="button" data-qty="${T.esc(l.product.id)}" data-delta="-1" aria-label="Quitar uno">−</button>
              <span aria-label="Cantidad">${l.qty}</span>
              <button type="button" data-qty="${T.esc(l.product.id)}" data-delta="1" aria-label="Agregar uno" ${l.qty >= NS.MAX_QTY ? "disabled" : ""}>+</button>
            </div>
          </div>
          <div class="cart-line__price">
            <span>${NS.fmtUSD(l.lineTotal)}</span>
            <button class="link" type="button" data-remove="${T.esc(l.product.id)}">Eliminar</button>
          </div>
        </div>`
      )
      .join("");
    $("#cart-footer").hidden = false;
    $("#cart-total").textContent = NS.fmtUSD(total);
    $("#cart-total-bs").textContent = NS.fmtBs(total, state.config.bsRate) || "";
  }

  function openCart() {
    renderCart();
    $("#cart").classList.add("is-open");
    $("#cart").inert = false;
    $("#cart-close").focus();
  }
  function closeCart() {
    $("#cart").classList.remove("is-open");
    $("#cart").inert = true;
  }

  // La imagen del producto vuela al carrito (se omite con movimiento reducido).
  function flyToCart(card) {
    if (reduceMotion || !card) return;
    const from = card.querySelector(".pcard__media img") || card.querySelector(".pdp__media img");
    const to = $("#cart-open");
    if (!from || !to) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    if (!a.width) return;
    const ghost = from.cloneNode(true);
    ghost.classList.add("fly");
    Object.assign(ghost.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
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
    flyToCart(btn && btn.closest(".pcard, .pdp"));
    const counter = $("#cart-count");
    counter.classList.remove("bump");
    void counter.offsetWidth;
    counter.classList.add("bump");
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

  function goCheckout() {
    closeCart();
    if (isHome) location.hash = "#/checkout";
    else location.href = `${base}index.html#/checkout`;
  }

  // ---------- Portada: filtros y buscador ----------
  function renderCatalog() {
    const grid = $("#grid");
    if (!grid) return;
    const all = NS.filterSort(state.products, state.filters);
    grid.innerHTML = all.length
      ? all.map((p) => T.card(p, ctx())).join("")
      : `<p class="empty">No encontramos productos con ese filtro. <button class="link" type="button" data-cat="Todas">Ver todo</button></p>`;
    $("#count").textContent = `${all.length} producto${all.length === 1 ? "" : "s"}`;
    const catSelect = document.querySelector("[data-cat-select]");
    if (catSelect) catSelect.value = state.filters.category;
    document.querySelectorAll(".chip").forEach((c) => {
      const on = c.dataset.cat === state.filters.category;
      c.classList.toggle("is-on", on);
      c.setAttribute("aria-selected", String(on));
    });
  }

  // ---------- Checkout ----------
  function renderCheckout() {
    document.title = "Pedido · NaiguaStore";
    const lines = NS.cartLines(state.cart, state.products);
    if (!lines.length) {
      app.innerHTML = `<section class="empty-page"><h1>Tu carrito está vacío</h1><p>Agrega productos antes de continuar.</p><a class="btn btn--solid" href="#catalogo">Ver catálogo</a></section>`;
      return;
    }
    track("begin_checkout", { currency: "USD", value: NS.cartTotal(lines) });
    const total = NS.cartTotal(lines);
    const stateOptions = state.config.states.map((s) => `<option>${T.esc(s)}</option>`).join("");
    app.innerHTML = `
      <section class="checkout">
        <form id="checkout-form" class="checkout__form" novalidate>
          <h1>Confirma tu pedido</h1>
          <p class="safe">No pedimos datos de tarjeta. Confirmamos stock y precio antes de cobrar; los datos de pago te los enviamos por WhatsApp.</p>

          <fieldset>
            <legend>Tus datos</legend>
            <label>Nombre completo<input name="name" autocomplete="name"><small class="err" data-err="name"></small></label>
            <label>Teléfono (WhatsApp)<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0414 000 0000"><small class="err" data-err="phone"></small></label>
          </fieldset>

          <fieldset>
            <legend>Entrega</legend>
            <label class="radio"><input type="radio" name="delivery" value="envio" checked> Envío a todo el país</label>
            <div id="ship-fields">
              <label>Estado<select name="state">${stateOptions}</select></label>
              <label>Ciudad<input name="city" autocomplete="address-level2"><small class="err" data-err="city"></small></label>
              <label>Dirección completa<textarea name="address" rows="2" autocomplete="street-address"></textarea><small class="err" data-err="address"></small></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Método de pago</legend>
            ${state.config.payments
              .map((m, i) => `<label class="radio"><input type="radio" name="payment" value="${T.esc(m)}" ${i === 0 ? "checked" : ""}> ${T.esc(m)}</label>`)
              .join("")}
            <small class="hint">Te enviamos los datos de pago por WhatsApp después de confirmar.</small>
          </fieldset>

          <label>Notas (opcional)<textarea name="notes" rows="2" maxlength="300"></textarea></label>

          <button class="btn btn--solid btn--block" type="submit">Confirmar pedido por WhatsApp</button>
        </form>

        <aside class="checkout__summary" aria-label="Resumen">
          <div class="ticket">
            <h2>Resumen</h2>
            ${lines.map((l) => `<div class="sum-line"><span>${T.esc(l.product.name)} × ${l.qty}</span><span>${NS.fmtUSD(l.lineTotal)}</span></div>`).join("")}
            <div class="sum-line"><span>Envío</span><span>A confirmar</span></div>
            <div class="sum-total"><span>Total</span><span>${NS.fmtUSD(total)}</span></div>
            <a class="link" href="${base}index.html#catalogo">← Seguir comprando</a>
          </div>
        </aside>
      </section>`;
  }

  function validateCheckout(form) {
    const f = new FormData(form);
    const errors = {};
    if (!NS.isValidName(f.get("name"))) errors.name = "Escribe tu nombre completo.";
    if (!NS.isValidVePhone(f.get("phone"))) errors.phone = "Usa un número móvil venezolano, por ejemplo 0414 000 0000.";
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
    document.title = "Pedido enviado · NaiguaStore";
    let last = null;
    try {
      last = JSON.parse(localStorage.getItem(ORDER_KEY));
    } catch (e) {
      last = null;
    }
    if (!last) {
      app.innerHTML = `<section class="empty-page"><h1>No hay pedidos recientes</h1><a class="btn btn--solid" href="#catalogo">Ver catálogo</a></section>`;
      return;
    }
    app.innerHTML = `
      <section class="thanks">
        <h1>Pedido enviado</h1>
        <p>Número de pedido: <strong>${T.esc(last.id)}</strong>. Te respondemos por WhatsApp para confirmar stock, envío y pago.</p>
        <p class="hint">Si WhatsApp no se abrió, usa el botón o copia el texto.</p>
        <div class="thanks__actions">
          <a class="btn btn--solid" href="${T.esc(last.url)}" target="_blank" rel="noopener">Abrir WhatsApp</a>
          <button class="btn btn--line" type="button" data-copy>Copiar texto</button>
          <button class="btn btn--line" type="button" data-done>Listo, vaciar carrito</button>
        </div>
        <pre class="preview" id="preview">${T.esc(last.text)}</pre>
      </section>`;
    track("purchase_intent_whatsapp", { order_id: last.id });
  }

  // ---------- Rutas (solo en la portada) ----------
  function route() {
    if (!isHome) return;
    const hash = location.hash;
    closeCart();
    if (hash === "#/checkout") return renderCheckout();
    if (hash === "#/gracias") return renderThanks();
    if (homeHtml !== null && app.innerHTML !== homeHtml) {
      app.innerHTML = homeHtml;
      document.title = "NaiguaStore | Componentes para PC nuevos, tienda online en Venezuela";
      bindHome();
      renderCatalog();
      renderCart();
    }
    if (hash === "#catalogo") {
      const el = $("#catalogo");
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function bindHome() {
    const sort = document.querySelector("[data-sort]");
    if (sort) sort.value = state.filters.sort;
    const search = $("#search");
    if (search) search.value = state.filters.query;
  }

  // ---------- Eventos ----------
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-add],[data-qty],[data-remove],[data-cat],[data-open-cart],[data-close-cart],[data-copy],[data-done]");
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
      renderCart();
    }
  });

  document.addEventListener("change", (ev) => {
    if (ev.target.name === "delivery") {
      const box = $("#ship-fields");
      if (box) box.hidden = ev.target.value !== "envio";
    }
    if (ev.target.matches("[data-sort]")) {
      state.filters.sort = ev.target.value;
      renderCatalog();
    }
    if (ev.target.matches("[data-cat-select]")) {
      state.filters.category = ev.target.value;
      renderCatalog();
    }
  });

  document.addEventListener("submit", (ev) => {
    if (ev.target.id === "checkout-form") {
      ev.preventDefault();
      submitCheckout(ev.target);
    }
    if (ev.target.matches("[data-search-form]") && isHome) ev.preventDefault();
  });

  $("#search").addEventListener("input", (ev) => {
    state.filters.query = ev.target.value;
    state.filters.category = "Todas";
    if (isHome && $("#grid")) renderCatalog();
  });

  $("#cart-open").addEventListener("click", openCart);
  $("#cart-close").addEventListener("click", closeCart);
  $("#cart-overlay").addEventListener("click", closeCart);
  $("#cart-checkout").addEventListener("click", goCheckout);
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeCart();
  });
  window.addEventListener("hashchange", route);

  // ---------- Arranque ----------
  function hideLoader() {
    const l = $("#loader");
    if (!l || l.classList.contains("done")) return;
    l.classList.add("done");
    setTimeout(() => l.remove(), 320);
  }

  async function init() {
    try {
      const [cfg, prods] = await Promise.all([
        fetch(`${base}data/config.json`).then((r) => r.json()),
        fetch(`${base}data/products.json`).then((r) => r.json()),
      ]);
      state.config = cfg;
      state.products = prods;
    } catch (e) {
      hideLoader();
      return;
    }
    setupAnalytics();
    loadCart();
    if (isHome) {
      homeHtml = app.innerHTML;
      const q = new URLSearchParams(location.search).get("q");
      if (q) {
        state.filters.query = q;
        $("#search").value = q;
        renderCatalog();
        requestAnimationFrame(() => {
          const el = $("#catalogo");
          if (el) el.scrollIntoView({ behavior: "auto" });
        });
      }
      route();
    }
    renderCart();
    hideLoader();
  }

  init();
  setTimeout(hideLoader, 2500);
})();
