# ORIGEN Médico — Estado de migración y seguridad

## Estado de la rama

- Rama de trabajo: `mejoras-seguridad-origen`.
- Pull Request en borrador: https://github.com/nmasjise-ai/origen-medico-app/pull/1
- `main` y `respaldo-origen-medico` no se han modificado con esta iteración.
- Las reglas nuevas de Firestore **no se han desplegado**.

## Cambios confirmados

- Modelo Firestore por paciente en `docs/PHASE1_FIRESTORE_MODEL.md`.
- Reglas objetivo con administrador por claim, vínculo paciente `users/{uid}.patientId`, notas internas separadas y validación de síntomas/diarios/solicitudes.
- Firebase Emulator Suite, GitHub Actions y tests en `tests/*.test.mjs`.
- La última suite completada antes de añadir pruebas de validación tenía 13/13 aprobadas. Se añadieron 7 pruebas de validación de perfiles y 4 pruebas de aislamiento de base Preview; la nueva suite debe confirmar el total actualizado.
- Frontend desconectado del documento compartido `clinic_state` y de `localStorage` clínico; bloqueo de altas y guardado mientras no exista sincronización segura.
- Se retiraron exportación/restauración del objeto de demostración y carga QR Base64.
- La auditoría del documento legado busca la ruta esperada y raíces encontradas de `artifacts`; ahora también enumera colecciones de nivel superior y devuelve solo sus nombres y cantidades de documentos, nunca campos de documentos.
- `api/admin/patients.js`: listado y creación de perfiles solo para administrador, con validación de campos, medición inicial opcional y registro de auditoría.
- La API de pacientes usa exclusivamente `origen-staging`, una base Firestore nombrada; nunca usa `(default)`.
- `api/_lib/staging-firestore.js` exige `VERCEL_ENV=preview`, un ID de base nombrada y rechaza `(default)`.
- Vercel: variable plain `ORIGEN_STAGING_FIRESTORE_DATABASE_ID=origen-staging`, solo Preview y rama `mejoras-seguridad-origen`.
- La creación manual de la base Firestore nombrada aún está pendiente. Hasta entonces la API de pacientes falla de forma cerrada y no realiza escrituras.
- Backlog comercial/clínico en `PRODUCT_BACKLOG.md`; inventario MIXNUTRI preliminar en `docs/INITIAL_STOCK_CATALOG.md`; notas regulatorias en `docs/REGULATORY_AND_COMPLIANCE_NOTES.md`.

## Auditoría actual

La captura del administrador mostró:
- Documentos legados encontrados: 0.
- Raíces de `artifacts` revisadas: 0.
- Expedientes y solicitudes detectados: 0.

Interpretación: no se encontró el documento antiguo en la ruta esperada ni documentos raíz bajo `artifacts`. Esto no garantiza que todas las colecciones de Firestore estén vacías. La versión más reciente amplía la auditoría con nombres y conteos de todas las colecciones raíz.

## Separación Preview / Production

- La base `(default)` se mantiene como fuente actual y solo se consulta con auditoría de metadatos.
- Las escrituras de los endpoints nuevos de paciente se dirigen a `origen-staging`.
- Variable Vercel configurada solo en Preview y en la rama `mejoras-seguridad-origen`: `ORIGEN_STAGING_FIRESTORE_DATABASE_ID=origen-staging`.
- El endpoint rechaza Production y la base `(default)`.
- Falta crear manualmente `origen-staging` en Firebase Console con reglas iniciales en Production mode. Hasta entonces la API devuelve 503 y no escribe.
- El SDK Admin `getFirestore(app, databaseId)` se usa exclusivamente para pruebas/Preview; la referencia oficial lo marca Public Preview y no recomendado para Production: https://firebase.google.com/docs/reference/admin/node/firebase-admin.firestore

## Pendientes inmediatos

1. Crear la base nombrada `origen-staging` en Firebase Console, en la ubicación elegida, con reglas iniciales cerradas.
2. Repetir la auditoría ampliada y revisar nombres/cantidades de las colecciones raíz.
3. Probar API de pacientes en Preview solo con nombres ficticios de QA.
4. Construir portal de pacientes e invitaciones/identidad después de verificar el aislamiento.
5. Integrar los módulos de mediciones, tratamiento, nutrición, síntomas y solicitudes.
6. Probar roles médico, paciente A, paciente B, recepción y nutrición.
7. Desplegar reglas y frontend coordinadamente después de pruebas completas.

## Bloqueos

- No usar expedientes demo como información real.
- No cargar pacientes reales en Preview.
- No fusionar ni publicar reglas Firestore.
- No abrir ventas públicas de medicamentos ni teleconsulta privada sin revisión regulatoria específica.
