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
3. Esperar un despliegue Preview del último commit (la API de Vercel alcanzó el límite diario de despliegues gratuitos durante esta sesión).
4. Probar emisión, validación, expiración y reemisión de invitaciones con cuentas y datos totalmente ficticios.
5. Completar pruebas extremo a extremo de activación, verificación de correo, consumo único y sesión paciente.
6. Construir repositorios para mediciones, tratamiento, nutrición, síntomas y solicitudes.
7. Probar médico, paciente A, paciente B, nutricionista y recepción.
8. Mantener las reglas sin publicar hasta validar todos los flujos.

## Bloqueos de seguridad

- No usar expedientes demo para atención real.
- No cargar pacientes reales en Preview.
- No fusionar ni publicar reglas de Firestore.
- No permitir que una solicitud de paciente se convierta automáticamente en receta.
- No activar venta pública de medicamentos ni servicio de teleconsulta privada sin revisión regulatoria específica.


## Decisión de acceso de pacientes

Se confirma usar únicamente **correo electrónico y contraseña** mediante Firebase Authentication. El proveedor Email/Password ya está habilitado en el proyecto y el inicio de sesión del médico usa `signInWithEmailAndPassword`.

No se añadirá SMS, OTP de WhatsApp ni Google en esta etapa. El registro de pacientes no será público: la cuenta se activará solo mediante invitación médica de un solo uso y con vencimiento. Tras crear la cuenta, el paciente verificará su correo; el servidor consumirá la invitación y vinculará el UID con el único `patientId` autorizado. La recuperación de contraseña será por correo mediante Firebase. ORIGEN no pedirá ni almacenará contraseñas.


## Módulo de invitaciones (Preview)

Se implementó el flujo de invitación con correo y contraseña exclusivamente:

- `api/admin/invitations.js`: emite/reemite invitación solo para médico autorizado y un expediente no vinculado. Token aleatorio de 32 bytes, hash SHA-256 almacenado y vencimiento de 7 días. Reemitir revoca el token anterior.
- `api/invitations/validate.js`: comprueba token y correo invitado sin devolver información del paciente.
- `api/invitations/redeem.js`: exige ID token válido, correo verificado, no-admin, correo coincidente y usa transacción para crear el vínculo UID → patientId, actualizar expediente, consumir invitación y registrar auditoría.
- `api/patient/session.js`: recupera únicamente el expediente asociado al UID autenticado.
- `App.jsx`: el médico puede introducir correo y copiar enlace de activación. El paciente puede crear cuenta o usar cuenta existente, recibir verificación, reenviar correo, confirmar y acceder a un portal inicial sin datos demo.
- El enlace lleva el secreto como fragmento URL `#activar=`, no como query string. El envío del enlace se realiza manualmente; Firebase envía el correo de verificación.
- Firebase Email/Password es el único proveedor usado. No se ha habilitado SMS/WhatsApp OTP ni otros proveedores.

El flujo está limitado al namespace Preview `previewEnvironments/mejoras-seguridad-origen`. El código del flujo de invitación está en la rama de trabajo, pero todavía requiere despliegue Preview actualizado y pruebas extremo a extremo. Las reglas y la vinculación de producción aún requieren diseño y pruebas específicas antes de habilitar pacientes reales.


## Estado de pruebas y despliegue del módulo de invitaciones

- Firebase Emulator / GitHub Actions: la última ejecución completada antes del cambio que añade el paso de compilación aprobó **40/40 pruebas** (8 de reglas Firestore y 32 unitarias de invitaciones, mediciones, perfiles, namespace y regresión del frontend).
- Se añadió al workflow un paso adicional `npm run build`; la ejecución del commit que incluye ese paso está pendiente de terminar.
- El límite diario de Vercel Free para crear despliegues fue alcanzado durante esta sesión (respuesta 402 `api-deployments-free-per-day`, retry indicado 24 h). Por eso el último commit está guardado en GitHub pero aún no tiene un Preview nuevo asociado.
- El último Preview READY no incluye todos los cambios de invitación y no debe usarse para probarlos todavía.
- El PR sigue en borrador, sin merge y sin despliegue de reglas.
