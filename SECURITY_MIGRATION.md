# ORIGEN Médico — Estado de migración y seguridad

## Estado de la rama

- Rama de trabajo: `mejoras-seguridad-origen`.
- Pull Request en borrador: https://github.com/nmasjise-ai/origen-medico-app/pull/1
- La rama `main` no se ha modificado mediante esta iteración.
- La rama `respaldo-origen-medico` se mantiene idéntica a `main`.
- Las reglas nuevas de Firestore **no se han desplegado** en Firebase.

## Cambios confirmados

- `firestore.rules`: reglas objetivo con administrador por custom claim, vínculo paciente mediante `users/{uid}.patientId`, separación de notas internas, informes de síntomas y registros diarios validados.
- `firebase.json`, `tests/firestore.rules.test.mjs` y `.github/workflows/firestore-rules.yml`: Firebase Emulator Suite y pruebas automatizadas.
- Última ejecución completada: **13/13 pruebas aprobadas** (8 pruebas de aislamiento/permisos de Firestore y 5 pruebas de regresión del cliente).
- `App.jsx`: el cliente ya no lee ni escribe expedientes en `localStorage`, no consulta el documento compartido `artifacts/{appId}/public/data/clinic_state/main`, y no guarda cambios clínicos en ese documento. El panel se mantiene en demostración de solo lectura/bloqueado hasta implementar repositorios por paciente.
- Los antiguos handlers de exportación/restauración del objeto de demostración se retiraron y la carga de QR Base64 quedó deshabilitada.
- Se muestra una advertencia de datos ficticios; el alta de pacientes permanece deshabilitada sin sincronización clínica.
- `api/admin/legacy-audit.js`: endpoint de auditoría protegido por claim médico. Primero consulta la ruta predeterminada y luego recorre hasta 100 IDs de documentos raíz de `artifacts`, buscando el documento legado bajo cada raíz. Devuelve solo conteos, cantidad de raíces examinadas, presencia/estado de análisis y metadatos; no devuelve nombres, teléfonos ni payload clínico.
- `App.jsx`: Configuración muestra «Revisar datos antiguos» y presenta documentos legados coincidentes y raíces revisadas.
- `PRODUCT_BACKLOG.md`: alcance funcional de V1, permisos, tienda liviana, consulta virtual, alertas y calendarios.
- `docs/PHASE1_FIRESTORE_MODEL.md`: modelo de datos ampliado para equipo, citas, notificaciones, pedidos, inventario y catálogo.
- `docs/INITIAL_STOCK_CATALOG.md`: lectura preliminar del inventario MIXNUTRI; precios, cantidades y beneficios no se inventan.
- `docs/REGULATORY_AND_COMPLIANCE_NOTES.md`: checklist preliminar, no asesoría legal.

## Auditoría de datos antiguos

La primera ejecución desde el panel informó que no encontró el documento en la ruta predeterminada:
`artifacts/origen-medico-glpi-bo/public/data/clinic_state/main`.

El resultado fue cero expedientes, solicitudes web y solicitudes de receta en esa ruta. Esto **no prueba por sí solo** que no exista un documento legado bajo otro ID de aplicación; por eso el endpoint se amplió para revisar también las raíces existentes de la colección `artifacts`.

Próximo paso: repetir «Revisar datos antiguos» con la versión Preview que contiene la auditoría ampliada. No importar datos automáticamente y no clasificar registros desconocidos como pacientes reales.

## Validación de entorno

- Vercel Preview compila correctamente; el endpoint `/api/health` ha respondido HTTP 200 con Firebase Admin listo.
- Las pruebas de reglas se ejecutan en Firebase Emulator; no acceden a los datos de producción.
- No se ha ejecutado migración ni alterado datos de Firestore.
- No desplegar reglas ni habilitar pacientes reales hasta completar la integración.

## Pendientes de Fase 1

1. Repetir la auditoría ampliada de `artifacts` y revisar conteos.
2. Determinar si existe un conjunto real que deba respaldarse; si no existe, empezar con expedientes nuevos tras validar el modelo.
3. Implementar aprovisionamiento de cuentas individuales y vínculo seguro `users/{uid}.patientId`.
4. Crear repositorios Firestore para pacientes, mediciones, tratamiento, nutrición, síntomas y solicitudes.
5. Sustituir los datos de demostración y el selector de paciente por la identidad autenticada.
6. Definir y probar roles diferenciados de médico, nutrición, recepción y tienda.
7. Ejecutar pruebas de extremo a extremo en Preview con médico y dos cuentas de paciente.
8. Desplegar reglas y frontend coordinadamente solo tras validación completa.

## Bloqueos de seguridad

- No usar los pacientes ficticios actuales para seguimiento.
- No cargar pacientes reales en esta Preview.
- No publicar ni fusionar las reglas antes de integrar el frontend y verificar permisos.
- No activar la venta pública de medicamentos ni promesas de dispensación sin verificación regulatoria específica.
