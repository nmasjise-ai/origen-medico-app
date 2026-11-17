# ORIGEN Médico — Referencia de medicamentos (fase 2)

## Propósito
Biblioteca interna para profesionales. No es tienda, no ofrece disponibilidad/precios de farmacias, no genera recomendaciones automáticas ni emite recetas.

## Esquema mínimo de cada ficha
- `id`: identificador estable.
- `genericName`: principio activo.
- `brandName`: marca, si está confirmada.
- `holderOrImporter`: titular/importador, si está confirmado.
- `strength`, `form`, `presentation`: datos exactos del envase/registro.
- `registrationNumber`: número de registro sanitario.
- `registrationStatus`: vigente, cancelado, pendiente o alerta oficial.
- `sourceUrl`, `sourceTitle`, `reviewedAt`: trazabilidad.
- `safetyAlerts[]`: alertas oficiales asociadas al producto exacto.
- `clinicalReferences[]`: prospecto/ficha técnica y guías clínicas con fecha.
- `isPrescribable`: nunca se deriva automáticamente de una coincidencia de marca; requiere verificación individual por el profesional.
- `visibility`: professional-only por defecto.

## Reglas de calidad
1. Una marca no es suficiente para identificar un producto: se verifican titular, fabricante, presentación, concentración, forma, número de registro, lote y vencimiento.
2. No inferir que una presentación está autorizada porque otra con el mismo nombre genérico sí lo está.
3. No inferir que un producto es ilícito solo por compartir nombre con otro; relacionar alertas con la presentación, titular y rasgos exactos descritos por AGEMED.
4. No almacenar precios de farmacias ni afirmar disponibilidad comercial.
5. No usar texto promocional como fuente clínica.
6. No asociar un número de registro a una dosis/presentación si la fuente oficial no proporciona ese mapeo.
7. Toda actualización conserva fuente, fecha y responsable de revisión.
8. Ninguna ficha incluye un botón “prescribir en un clic”. La receta se redacta y valida dentro del flujo clínico correspondiente.
9. Pacientes y visitantes no pueden consultar esta biblioteca interna.
10. La referencia es informativa; no sustituye la evaluación del paciente ni el juicio clínico.

## Estado de primera carga
- Tirzepatida / TG: la Alerta AGEMED 082/2026 identifica comercialización legal de TG por IMFAR S.R.L. con los registros II-97037/2026, II-97039/2026, II-97040/2026, II-97058/2026, II-97059 e II-97062/2026. La misma alerta describe TG de contrabando sin registro. No se asignan números a presentaciones individuales sin evidencia.
- Tirzepatida / LIPOLESS MD 15: alerta AGEMED 043/2026, producto específico sin registro sanitario y de contrabando.
- Tirzepatida / TIRZEC 15: aparece en la lista oficial AGEMED como Alerta 230/2026, de contrabando. No se completan otros detalles no verificados en el PDF de alerta.
- Semaglutida: marcas y presentaciones pendientes de verificación individual en el registro diario y cancelaciones AGEMED.

## Fuente oficial de consulta
AGEMED, listado diario de registros sanitarios aprobados y cancelados:
https://apiwww.agemed.gob.bo/api/listautcom

La versión inicial de esta fase se revisó el 17/11/2026. Antes de publicar el módulo o incorporar una marca nueva, volver a consultar la fuente oficial.
