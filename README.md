# NaiguaStore — tienda estática

Sitio sin compilación: HTML, CSS y JavaScript. El carrito vive en el navegador y el pedido se confirma por WhatsApp.

## Generar y ejecutar

El HTML de la portada y de cada producto se genera con un script sin dependencias (Node 18+):

```bash
node scripts/build.mjs
cd ~/Projects/naiguastore-claude && python3 -m http.server 8080
```

Abre http://localhost:8080. Después de cambiar `data/*.json`, vuelve a ejecutar `node scripts/build.mjs`.

## Estructura

```
index.html                 Portada generada (contenido completo para buscadores)
producto/<id>/index.html   Una página estática por producto (generada)
sitemap.xml, llms.txt      Generados
scripts/build.mjs          Generador de páginas, sitemap y llms.txt
js/templates.js            Plantillas compartidas: etiqueta de caja, tarjetas, iconos
js/logic.js                Lógica pura: carrito, precios, validación, mensaje de WhatsApp
js/app.js                  Carrito, buscador, filtros, checkout y gracias
css/styles.css             Diseño: etiquetas de caja, tipografía Barlow, responsive
data/config.json           WhatsApp, URL del sitio, tasa Bs, ID de GA4, estados, pagos
data/products.json         Catálogo
data/faq.json              Preguntas frecuentes (se usan en la página y en los datos estructurados)
robots.txt                 Permite buscadores y bots de IA
assets/                    Favicon, placeholder y carpeta de fotos de producto
```

## Antes de publicar

1. **Fotos reales:** pon cada imagen en `assets/products/<id>.jpg` (el `id` debe coincidir con `products.json`). Mientras no existan, se muestra `assets/placeholder.svg`.
2. **Precios y stock:** los datos vienen de la captura de la tienda anterior. Revísalos uno por uno y actualiza `products.json`.
3. **Tasa de cambio:** `bsRate` en `config.json` está en `null`, así que no se muestra el equivalente en bolívares. Cuando la definas (por ejemplo `36.5`), aparecerá en tarjetas, ficha, carrito y resumen.
4. **Google Analytics 4:** pon tu ID (`G-XXXXXXX`) en `gaId`. Sin ID no se carga ningún script de Google.
5. **Número de WhatsApp:** está en `whatsapp` (`584146380868`). Confírmalo antes de publicar.
6. **Dominio:** si cambias de dominio, actualiza `siteUrl` en `config.json` y vuelve a generar.

## Flujo de compra

1. El cliente agrega productos (el carrito se guarda en `localStorage` con `try/catch`).
2. En el checkout completa nombre, teléfono venezolano, entrega y método de pago. No se piden datos de tarjeta.
3. Al confirmar se abre `https://wa.me/584146380868?text=…` con el detalle del pedido y su número `NS-AAAAMMDD-XXXX`.
4. El equipo confirma stock, precio y envío por WhatsApp antes de cobrar.

**Importante:** cualquiera puede editar el texto de un enlace `wa.me`. Verifica precio y stock al confirmar, nunca solo con el mensaje.

## Pendiente

- Fotos reales de producto (ahora la etiqueta muestra un dibujo del componente).
- Imagen para compartir en redes (`og:image`, 1200×630).
- Buscador a pantalla completa en móvil, vista rápida y envío calculado por zona.
- Páginas de políticas completas (envíos y devoluciones).
