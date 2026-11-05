// Lógica sin DOM: carrito, precios, validaciones y mensaje de WhatsApp.
// Se puede probar en Node con module.exports.
(function (root) {
  const NS = {};

  NS.MAX_QTY = 10;

  NS.fmtUSD = (n) =>
    "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Devuelve null si no hay tasa configurada: la UI oculta el equivalente en Bs.
  NS.fmtBs = (usd, rate) => {
    if (!rate) return null;
    return "Bs " + (usd * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  NS.addToCart = (cart, id, max = NS.MAX_QTY) => {
    const item = cart.items.find((i) => i.id === id);
    if (item) item.qty = Math.min(max, item.qty + 1);
    else cart.items.push({ id, qty: 1 });
    return cart;
  };

  NS.setQty = (cart, id, qty, max = NS.MAX_QTY) => {
    const item = cart.items.find((i) => i.id === id);
    if (!item) return cart;
    if (qty < 1) cart.items = cart.items.filter((i) => i.id !== id);
    else item.qty = Math.min(max, qty);
    return cart;
  };

  NS.removeItem = (cart, id) => {
    cart.items = cart.items.filter((i) => i.id !== id);
    return cart;
  };

  // Cruza el carrito con el catálogo actual; descarta ids que ya no existen.
  NS.cartLines = (cart, products) =>
    cart.items
      .map((i) => {
        const product = products.find((p) => p.id === i.id);
        return product ? { product, qty: i.qty, lineTotal: product.price * i.qty } : null;
      })
      .filter(Boolean);

  NS.cartTotal = (lines) => lines.reduce((sum, l) => sum + l.lineTotal, 0);

  NS.cartCount = (cart) => cart.items.reduce((sum, i) => sum + i.qty, 0);

  // Móviles venezolanos: 04XX o +58/58 seguido del número sin 0 inicial.
  NS.isValidVePhone = (raw) => {
    const d = String(raw || "").replace(/\D/g, "");
    return /^0(412|414|416|424|426)\d{7}$/.test(d) || /^58(412|414|416|424|426)\d{7}$/.test(d);
  };

  NS.isValidName = (raw) => String(raw || "").trim().length >= 3;

  NS.orderId = (date = new Date()) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const rnd = new Uint32Array(1);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(rnd);
    else rnd[0] = Math.floor(Math.random() * 1e9);
    return `NS-${yyyy}${mm}${dd}-${String(rnd[0] % 10000).padStart(4, "0")}`;
  };

  // order: { id, name, phone, delivery: {type, state, city, address}, payment, notes }
  NS.buildMessage = (order, lines) => {
    const total = NS.cartTotal(lines);
    const productLines = lines.map(
      (l, idx) => `${idx + 1}) ${l.product.name} · x${l.qty} · ${NS.fmtUSD(l.lineTotal)}`
    );
    const delivery =
      order.delivery.type === "envio"
        ? `Envío a ${order.delivery.state}, ${order.delivery.city}. Dirección: ${order.delivery.address}`
        : "Retiro en Naiguatá / La Guaira";

    return [
      "Hola NaiguaStore, quiero confirmar mi pedido 🛒",
      `Pedido: ${order.id}`,
      "",
      "PRODUCTOS",
      ...productLines,
      "",
      `Subtotal: ${NS.fmtUSD(total)} USD`,
      "Envío: a confirmar",
      `Total estimado: ${NS.fmtUSD(total)} USD`,
      "",
      "DATOS",
      `Nombre: ${order.name}`,
      `Teléfono: ${order.phone}`,
      `Entrega: ${delivery}`,
      `Pago: ${order.payment}`,
      `Notas: ${order.notes || "ninguna"}`,
      "",
      "Quedo atento a los datos de pago y al costo de envío. Gracias.",
    ].join("\n");
  };

  NS.waUrl = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  NS.filterSort = (products, { category = "Todas", query = "", sort = "featured" } = {}) => {
    const q = query.trim().toLowerCase();
    let list = products.filter(
      (p) =>
        (category === "Todas" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = NS;
  root.NS = NS;
})(typeof window !== "undefined" ? window : globalThis);
