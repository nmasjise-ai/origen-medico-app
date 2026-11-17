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
- Última suite completada y verificada en el commit de código: **40/40 pruebas aprobadas** (8 reglas Firestore y 32 pruebas unitarias de invitaciones, mediciones, perfiles, namespace y regresión de almacenamiento).
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

Interpretación: no se encontró el documento clínico antiguo en la ruta esperada ni documentos raíz bajo `artifacts`. Esto no prueba que todas las colecciones raíz de Firestore estén vacías. La versión de auditoría incluye un resumen de nombres y cantidades de colecciones raíz; volver a ejecutarla en el Preview actual.

## Separación Preview / Production

- La base `(default)` conserva la cuota gratuita Spark y aloja el namespace lógico de QA; el API de Preview no usa la colección de producción.
- Los perfiles provisionales de Preview se escribirán exclusivamente en `previewEnvironments/mejoras-seguridad-origen/patients` dentro de `(default)`.
- Vercel establece el namespace de pruebas solo para Preview y la rama de seguridad.
- El endpoint rechaza Production y solo permite el namespace fijo de Preview.
- No requiere crear otra base ni cambiar a Blaze. La base `(default)` permanece en `southamerica-east1`.
- La separación QA/Production es por namespace lógico dentro de la misma base; no es aislamiento físico de bases. No poner datos reales en Preview.

## Pendientes inmediatos

1. Ejecutar la auditoría de colecciones raíz en el Preview actual.
2. Probar emisión, validación, expiración y reemisión de invitaciones con cuentas y datos totalmente ficticios.
3. Completar pruebas extremo a extremo de activación, verificación de correo, consumo único y sesión paciente.
4. Construir repositorios para mediciones, tratamiento, nutrición, síntomas y solicitudes.
5. Probar médico, paciente A, paciente B, nutricionista y recepción.
6. Mantener las reglas sin publicar hasta validar todos los flujos.

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

El flujo está limitado al namespace Preview `previewEnvironments/mejoras-seguridad-origen`. El último commit de la rama se desplegó como Preview READY en Vercel; quedan las pruebas funcionales de invitación y las pruebas extremo a extremo. Las reglas y la vinculación de producción aún requieren diseño y pruebas específicas antes de habilitar pacientes reales.


## Estado de pruebas y despliegue del módulo de invitaciones

- Firebase Emulator / GitHub Actions: la última ejecución completada antes del cambio que añade el paso de compilación aprobó **40/40 pruebas** (8 de reglas Firestore y 32 unitarias de invitaciones, mediciones, perfiles, namespace y regresión del frontend).
- El workflow también ejecutó `npm run build` y completó la compilación Vite correctamente en el commit de código verificado.
- La solicitud manual de despliegue alcanzó el límite diario gratuito de Vercel (`402 api-deployments-free-per-day`), pero el despliegue automático vinculado al último commit de GitHub sí terminó correctamente.
- Preview actual: `origen-medico-elf3yfqxy-origen-medico.vercel.app`, commit `468c4a5f6e60750e2f06ff1ceb6d8c607803a836`, estado `READY`.
- La protección de acceso de Vercel puede requerir iniciar sesión con la cuenta autorizada para abrir el Preview.
- El PR sigue en borrador, sin merge y sin despliegue de reglas.


## Acceso temporal al Preview protegido

El Preview está protegido con Vercel Authentication. Al abrir el Preview con el enlace compartible temporal, la pantalla de invitación conserva el parámetro `_vercel_share` al construir el enlace de activación. El token de invitación sigue en el fragmento `#activar=`, y el enlace debe compartirse únicamente con el correo de prueba indicado.

- El acceso compartible de Vercel vence aproximadamente en 23 horas.
- El token de invitación tiene vigencia propia de 7 días, pero el acceso temporal de Vercel puede vencer antes.
- Esto aplica solo a QA/Preview; no reemplaza la autenticación de Firebase ni autoriza el acceso a expedientes.
