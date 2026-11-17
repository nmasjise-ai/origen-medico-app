# ORIGEN Médico — Inventario inicial para catálogo

**Origen:** lectura preliminar de las dos fotografías compartidas el 17-11-2026.  
**Estado:** borrador interno; no publicar hasta verificar cada etiqueta, categoría, presentación, stock, precio y beneficios autorizados.

## Productos identificados visualmente

| Nombre leído en el envase/foto | Familia/marca visible | Estado de identificación | Precio Bs | Unidades |
|---|---|---|---:|---:|
| THERMO | MIXNUTRI | Confirmar etiqueta y presentación exacta | Pendiente | Pendiente |
| BELLE | MIXNUTRI | Confirmar ortografía/presentación | Pendiente | Pendiente |
| PRIMULA / PRÍMULA | MIXNUTRI | Confirmar escritura exacta y presentación | Pendiente | Pendiente |
| + TESTO | MIXNUTRI | Confirmar nombre legal completo/categoría | Pendiente | Pendiente |
| HSN + SILICIO | MIXNUTRI | Confirmar etiqueta y presentación | Pendiente | Pendiente |
| DETOX MATCHA | MIXNUTRI | Nombre legible; verificar categoría y etiqueta | Pendiente | Pendiente |
| LIPO TEA | MIXNUTRI | Nombre legible; verificar categoría y etiqueta | Pendiente | Pendiente |
| MAGNESIO BISGLICINATO | MIXNUTRI | Nombre legible; confirmar concentración/presentación | Pendiente | Pendiente |
| OMEGA 3 ULTRAPURE 33/22 | MIXNUTRI | Confirmar composición exacta desde etiqueta | Pendiente | Pendiente |
| CREATINHEX NEURO | MIXNUTRI | Nombre legible; confirmar presentación | Pendiente | Pendiente |
| CREATINHEX MUJER | MIXNUTRI | Nombre legible; confirmar presentación | Pendiente | Pendiente |
| VITAMINA A-Z | MIXNUTRI | Nombre legible; confirmar presentación | Pendiente | Pendiente |
| COLÁGENO ARTROS | MIXNUTRI | Nombre legible; confirmar denominación y presentación | Pendiente | Pendiente |
| VITAMINA D3 2000 UI | MIXNUTRI | Nombre/concentración visibles; confirmar envase | Pendiente | Pendiente |
| TRI MAGNESIO | MIXNUTRI | Nombre legible; confirmar composición exacta | Pendiente | Pendiente |
| OMEGA 3 (otra presentación visible) | MIXNUTRI | Confirmar si es SKU diferente y transcribir EPA/DHA | Pendiente | Pendiente |

**Importante:** las imágenes muestran varios envases repetidos, pero no permiten determinar con seguridad el número de unidades disponibles de cada SKU. No inferir cantidades desde la fotografía.

## Datos que faltan para habilitar cada ficha pública

1. Nombre exacto como figura en el envase.
2. Presentación/contenido neto y porciones.
3. Precio de venta en Bs.
4. Unidades disponibles reales.
5. Beneficios permitidos sustentados por etiqueta/documentación aplicable; no crear claims terapéuticos a partir del nombre.
6. Clasificación regulatoria y registro/autorización correspondiente, cuando aplique.
7. Condiciones de reserva, pago, entrega y devolución.

## Diseño de almacenamiento liviano

- Guardar en Firestore únicamente metadatos: nombre, categoría, descripción aprobada, presentación, precio, stock, estado, fechas y referencia de imagen.
- No guardar archivos de imagen, PDF ni cadenas base64 en Firestore.
- Para la primera versión se pueden usar tarjetas sin fotografía o imágenes pequeñas/optimizadas servidas como assets estáticos del sitio. No subir fotografías de envases a Storage hasta decidir que realmente hacen falta.
- Guardar pedidos en `orders/{orderId}` separados de expedientes clínicos.
- El catálogo público debe excluir medicamentos y artículos no autorizados; verificar la categoría de cada producto antes de habilitar compra o reserva.
