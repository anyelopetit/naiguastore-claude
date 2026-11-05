# NaiguaStore — tienda estática

Sitio sin compilación: HTML, CSS y JavaScript. El carrito vive en el navegador y el pedido se confirma por WhatsApp.

## Ejecutar en local

```bash
cd ~/Projects/naiguastore-claude
python3 -m http.server 8080
```

Abre http://localhost:8080. Hace falta un servidor (no basta con abrir el archivo) porque la página lee `data/*.json`.

## Estructura

```
index.html          Estructura y carga de scripts
css/styles.css      Tema oscuro, responsive, animaciones (respeta prefers-reduced-motion)
js/logic.js         Lógica pura: carrito, precios, validación, mensaje de WhatsApp (se puede probar en Node)
js/app.js           Render de vistas, rutas por hash, carrito, checkout, eventos de GA4
data/config.json    Número de WhatsApp, tasa Bs, ID de GA4, estados, métodos de pago
data/products.json  Catálogo
robots.txt          Permite buscadores y bots de IA
assets/             favicon, placeholder y carpeta de fotos de producto
```

## Antes de publicar

1. **Fotos reales:** pon cada imagen en `assets/products/<id>.jpg` (el `id` debe coincidir con `products.json`). Mientras no existan, se muestra `assets/placeholder.svg`.
2. **Precios y stock:** los datos vienen de la captura de la tienda anterior. Revísalos uno por uno y actualiza `products.json`.
3. **Tasa de cambio:** `bsRate` en `config.json` está en `null`, así que no se muestra el equivalente en bolívares. Cuando la definas (por ejemplo `36.5`), aparecerá en tarjetas, ficha, carrito y resumen.
4. **Google Analytics 4:** pon tu ID (`G-XXXXXXX`) en `gaId`. Sin ID no se carga ningún script de Google.
5. **Número de WhatsApp:** está en `whatsapp` (`584146380868`). Confírmalo antes de publicar.
6. **Dominio:** el JSON-LD de la portada no tiene URL, y `robots.txt` no incluye `Sitemap:`. Agrégalos cuando tengas dominio.

## Flujo de compra

1. El cliente agrega productos (el carrito se guarda en `localStorage` con `try/catch`).
2. En el checkout completa nombre, teléfono venezolano, entrega y método de pago. No se piden datos de tarjeta.
3. Al confirmar se abre `https://wa.me/584146380868?text=…` con el detalle del pedido y su número `NS-AAAAMMDD-XXXX`.
4. El equipo confirma stock, precio y envío por WhatsApp antes de cobrar.

**Importante:** cualquiera puede editar el texto de un enlace `wa.me`. Verifica precio y stock al confirmar, nunca solo con el mensaje.

## Pendiente

- Buscador en pantalla completa para móvil (en esta versión el buscador va en una segunda fila).
- Vista rápida en escritorio, galería de imágenes en la ficha y envío calculado por zona.
- Página de garantía y políticas (el enlace al pie aún no existe).
- Datos estructurados `Product` por cada ficha se generan en el navegador; si necesitas que Google los lea sin ejecutar JavaScript, habrá que renderizarlos en el servidor.
