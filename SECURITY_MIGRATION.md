# ORIGEN Médico — Estado de migración y seguridad

## Estado de la rama

- Rama de trabajo: `mejoras-seguridad-origen`.
- Pull Request en borrador: https://github.com/nmasjise-ai/origen-medico-app/pull/1
- `main` no se ha modificado por esta iteración.
- `respaldo-origen-medico` no se ha modificado por esta iteración; la rama está tres commits detrás de `main` y no es una copia exacta actual.
- Las reglas nuevas de Firestore **no se han desplegado**.

## Cambios confirmados

- Modelo Firestore por paciente en `docs/PHASE1_FIRESTORE_MODEL.md`.
- Reglas objetivo con administrador por claim, vínculo paciente `users/{uid}.patientId`, notas internas separadas y validación de síntomas/diarios/solicitudes.
- Firebase Emulator Suite, GitHub Actions y pruebas en `tests/*.test.mjs`.
- Última suite completada y verificada: 13/13 (8 reglas + 5 regresiones del frontend). Se añadieron 7 pruebas de validación de perfil y 4 de aislamiento de base Preview; la suite completa ampliada se ejecutó en GitHub Actions y aprobó 31/31 casos.
- Frontend desconectado del documento compartido `clinic_state` y del almacenamiento clínico en `localStorage`; altas y guardado del flujo legado continúan bloqueados.
- Se retiraron exportación/restauración del estado de demostración y carga QR Base64.
- Auditoría protegida: revisa la ruta de datos anterior, raíces de `artifacts` y nombres/cantidades de colecciones principales; nunca devuelve campos de documentos.
- Nueva pantalla «Pacientes en nube (Pruebas)» en el panel médico.
- `api/admin/patients.js`: listado y creación de perfiles provisionales solo para administrador, con validación estricta, medición inicial opcional y evento de auditoría.
- `api/_lib/staging-firestore.js`: exige `VERCEL_ENV=preview` y un namespace exacto configurado; rechaza Production.
- `api/admin/patients.js` solo accede al namespace `previewEnvironments/mejoras-seguridad-origen/patients` dentro de `(default)`; no escribe en la colección `patients` de producción.
- Vercel: `ORIGEN_PREVIEW_DATA_NAMESPACE=previewEnvironments/mejoras-seguridad-origen`, variable plain, únicamente en Preview y rama `mejoras-seguridad-origen`.
- No se creará una segunda base Firestore: el plan Spark no permite bases nombradas adicionales sin activar Blaze. Los datos QA se alojan en un subárbol de la única base `(default)` y la API solo funciona en Preview.
- Backlog en `PRODUCT_BACKLOG.md`; catálogo MixNutri preliminar en `docs/INITIAL_STOCK_CATALOG.md`; notas regulatorias en `docs/REGULATORY_AND_COMPLIANCE_NOTES.md`.

## Auditoría de Firestore actual

La captura de la auditoría ampliada mostró:
- Documentos legados: 0.
- Raíces de `artifacts`: 0.
- Expedientes, solicitudes web y solicitudes de receta en la ruta antigua: 0.

Interpretación: no se encontró el documento clínico antiguo en la ruta esperada ni documentos raíz bajo `artifacts`. Esto no prueba que todas las colecciones raíz de Firestore estén vacías. La versión más reciente añade un resumen de todas las colecciones raíz con nombres y conteos; hay que volver a ejecutar la auditoría en la nueva Preview.

## Separación Preview / Production

- La base `(default)` conserva la cuota gratuita Spark y aloja el namespace lógico de QA; el API de Preview no usa la colección de producción.
- Los perfiles provisionales de Preview se escribirán exclusivamente en `previewEnvironments/mejoras-seguridad-origen/patients` dentro de `(default)`.
- Vercel establece el namespace de pruebas solo para Preview y la rama de seguridad.
- El endpoint rechaza Production y solo permite el namespace fijo de Preview.
- No requiere crear otra base ni cambiar a Blaze. La base `(default)` permanece en `southamerica-east1`.
- La separación QA/Production es por namespace lógico dentro de la misma base; no es aislamiento físico de bases. No poner datos reales en Preview.

## Pendientes inmediatos

1. Crear `origen-staging` desde Firebase Console.
2. Repetir auditoría de colecciones raíz desde la última Preview.
3. Probar alta, apertura de ficha, historial de mediciones y nuevo control solo con registros ficticios de QA.
4. Implementar invitaciones y vínculo seguro `users/{uid}.patientId`.
5. Construir repositorios para mediciones, tratamiento, nutrición, síntomas y solicitudes.
6. Reemplazar el expediente demo y selector por la identidad autenticada.
7. Implementar vínculo de cuentas y probar médico, paciente A, paciente B, nutricionista y recepción.
8. Mantener las reglas sin publicar hasta validar todos los flujos.

## Bloqueos de seguridad

- No usar expedientes demo para atención real.
- No cargar pacientes reales en Preview.
- No fusionar ni publicar reglas de Firestore.
- No permitir que una solicitud de paciente se convierta automáticamente en receta.
- No activar venta pública de medicamentos ni servicio de teleconsulta privada sin revisión regulatoria específica.
