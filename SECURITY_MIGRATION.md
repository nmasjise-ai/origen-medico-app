# ORIGEN Médico — plan de migración de seguridad

## Estado de esta rama
Esta rama contiene una implementación preliminar del backend de administración y un diseño de reglas. No desplegar todavía las reglas de Firestore ni abrir el acceso a pacientes reales.

## Hallazgos verificados en el frontend original
- La aplicación usa Firebase Auth y llama a `signInAnonymously()`.
- La información clínica completa se serializa en `artifacts/{appId}/public/data/clinic_state/main`.
- La aplicación mantiene un duplicado de todo el estado en `localStorage`.
- El selector de modo cambia a `doctor` en el cliente sin comprobar una autorización.
- Firestore actualmente niega todas las operaciones del cliente. No cambiar esa regla a acceso público.

## Cambios preparados en esta rama
- `api/_lib/firebase-admin.js`: inicialización privada del Firebase Admin SDK y verificación de ID tokens revocados.
- `api/admin/bootstrap.js`: endpoint POST restringido por UID y correo configurados en variables privadas; asigna `admin: true` como custom claim, preservando claims existentes.
- `api/auth/session.js`: endpoint GET para verificar la identidad y exponer si el token tiene el claim de administrador.
- `api/admin/legacy-audit.js`: endpoint solo médico que consulta el documento legado mediante Firebase Admin y devuelve exclusivamente presencia, conteos e IDs de demostración conocidos; no devuelve nombres, teléfonos ni contenido clínico.
- `App.jsx`: el navegador ya no lee ni escribe el estado clínico en `localStorage`, ni se suscribe al documento monolítico `clinic_state`; el panel queda en demostración de solo lectura hasta integrar repositorios por paciente. Se eliminaron los handlers antiguos de exportación/restauración del objeto local y la carga del QR como Base64.
- `App.jsx`: panel de Configuración incluye el botón «Revisar datos antiguos» para invocar esa auditoría con el ID token del médico.
- `App.jsx`: login con correo/contraseña; no crea sesiones anónimas; el acceso al panel médico depende del claim `admin: true`; el cierre de sesión limpia la copia local.
- `firestore.rules`: reglas detalladas para el esquema por paciente, con perfiles vinculados por `users/{uid}.patientId`, documentos internos del médico, informes de síntomas y registros diarios validados. Son reglas objetivo y no deben publicarse antes de integrar el frontend y superar las pruebas del emulador.
- `firebase.json` y `tests/firestore.rules.test.mjs`: entorno local de emulación y pruebas de acceso para visitantes, médico, paciente A y paciente B. GitHub Actions completó 8/8 pruebas de reglas en el emulador (incluida la segunda ejecución tras endurecer el chequeo del claim).
- `docs/PHASE1_FIRESTORE_MODEL.md`: modelo de datos, mapeo del documento legado y plan de migración sin importar datos ficticios.
- `PRODUCT_BACKLOG.md`: hoja de ruta priorizada para nuevas ideas y módulos.
- `firebase-admin` se ejecuta solo en el servidor; se fijó en `13.10.0` tras observar `ERR_REQUIRE_ESM` con 14.5.1 en el runtime de Vercel. Node.js 22.x está configurado para la compatibilidad del SDK.
- Vercel Preview contiene las tres variables privadas restringidas a `mejoras-seguridad-origen`. El endpoint `/api/health` confirmó `firebaseAdmin: ready` sin exponer el JSON de la cuenta de servicio.

## Variables privadas requeridas en Vercel (Preview primero)
Configurar como Environment Variables privadas, solo en Preview durante las pruebas:
- `CUENTA_SERVICIO_FIREBASE_JSON` (nombre ya utilizado en Vercel) o `FIREBASE_SERVICE_ACCOUNT_JSON`: contenido JSON de una cuenta de servicio del proyecto `origen-medico`. El backend acepta cualquiera de los dos nombres. Nunca guardar el JSON en GitHub, en `App.jsx` ni compartirlo por chat.
- `ORIGEN_ADMIN_UID`: UID completo de la cuenta médica autorizada.
- `ORIGEN_ADMIN_EMAIL`: correo exacto de esa cuenta, en minúsculas.

La cuenta de servicio necesita permisos para administrar usuarios de Firebase Authentication. Usar una identidad de servicio con privilegios mínimos posibles. No reutilizar una clave de cuenta de servicio en otros proyectos. Si la clave se expone, revocarla y generar otra.

El endpoint `POST /api/admin/bootstrap` solo asigna el claim cuando tanto el UID como el correo del token verificado coinciden con las variables privadas. La llamada debe llevar `Authorization: Bearer <Firebase ID token>`. Luego el cliente debe renovar el ID token para recibir el claim. `GET /api/auth/session` informa el estado de la sesión, pero el frontend todavía debe integrarlo.

## Modelo de datos de destino propuesto
- `users/{uid}`: perfil de cuenta no clínico; roles no asignables desde el cliente.
- `patients/{patientId}`: un expediente por paciente, con `authUid` enlazado por un proceso confiable.
- `patients/{patientId}/metrics/{metricId}`
- `patients/{patientId}/symptoms/{entryId}`
- `patients/{patientId}/nutritionPlans/{planId}`
- `publicContent/{documentId}`: contenido público sin datos personales.

## Autorización
- Rol médico: custom claim `admin: true`, asignada exclusivamente desde un entorno confiable mediante Firebase Admin SDK.
- Paciente: lectura limitada al expediente indicado por su propio documento `users/{uid}.patientId`, asignado por servidor.
- Escrituras clínicas sensibles y solicitudes deben validarse por operación, con reglas específicas o funciones de servidor.
- Ninguna regla de cliente debe confiar en un campo `role` enviado por el propio usuario.

## Secuencia obligatoria antes del despliegue
1. Variables privadas configuradas solo para Preview y Firebase Admin inicializado correctamente; falta probar el bootstrap del claim `admin: true` con una sesión real de la cuenta autorizada.
2. Añadir inicio/cierre de sesión con correo y contraseña y estado explícito de carga/no autenticado.
3. Eliminar el modo anónimo como mecanismo de acceso a expedientes.
4. Migrar el documento compartido a documentos por paciente; verificar conteos y contenido sin copiar datos ficticios a cuentas reales.
5. Retirar de `localStorage` cualquier expediente o dato clínico identificable; mantener solo preferencias no sensibles.
6. Implementar permisos de escritura por operación (síntomas, registros, solicitudes) con validación de campos.
7. Probar con Firebase Emulator Suite: visitante, paciente A, paciente B, administrador y usuario sin claim.
8. Solo después de pruebas satisfactorias desplegar reglas y frontend coordinadamente.

## Advertencias
- Las reglas describen el esquema objetivo, no el esquema actual.
- Desplegarlas antes de migrar el código y los datos causará errores de lectura/escritura: el documento legado queda denegado intencionalmente.
- La clave de configuración Firebase del frontend no sustituye las reglas de seguridad. No incluir claves privadas ni JSON de cuentas de servicio en el repositorio.
- No utilizar datos reales de pacientes durante el desarrollo y las pruebas iniciales.
- El backend de Preview inicializa Firebase Admin y el registro de Vercel confirmó que el bootstrap asignó `admin: true` a la cuenta médica.
- Las nuevas reglas y pruebas están en GitHub, pero todavía no se han ejecutado satisfactoriamente en el emulador ni se han publicado en Firebase.
- El frontend conserva aún el modelo visual de demostración, pero el cliente ya no consulta el documento monolítico ni almacena expedientes en `localStorage`. El indicador `Sin sincronización clínica` y los bloqueos deben mantenerse hasta integrar los repositorios individuales: no usar para altas ni seguimiento de pacientes reales.
- El portal de pacientes todavía no está habilitado para cuentas individuales; la navegación de paciente solo se conserva para vista previa del médico.
- El panel médico todavía usa el modelo legado de un documento compartido y la sincronización está bloqueada por las reglas actuales. No cargar pacientes reales ni anunciar la aplicación como lista para uso clínico hasta completar la migración.
