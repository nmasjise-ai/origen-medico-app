# ORIGEN Médico — plan de migración de seguridad

## Estado de esta rama
Este archivo es un diseño de destino para revisión y pruebas. No desplegar estas reglas en Firebase todavía.

## Hallazgos verificados
- La aplicación usa Firebase Auth y llama a `signInAnonymously()`.
- Toda la información clínica está serializada en `artifacts/{appId}/public/data/clinic_state/main`.
- La aplicación mantiene un duplicado de todo el estado en `localStorage`.
- El selector de modo cambia a `doctor` en el cliente sin comprobar una autorización.
- Firestore actualmente niega todas las operaciones del cliente. No cambiar esa regla a acceso público.

## Modelo de destino propuesto
- `users/{uid}`: perfil de cuenta no clínico; roles no asignables desde el cliente.
- `patients/{patientId}`: un expediente por paciente, con `authUid` enlazado por un proceso confiable.
- `patients/{patientId}/metrics/{metricId}`
- `patients/{patientId}/symptoms/{entryId}`
- `patients/{patientId}/nutritionPlans/{planId}`
- `publicContent/{documentId}`: contenido público sin datos personales.

## Autorización
- Rol médico: custom claim `admin: true`, asignada exclusivamente desde un entorno confiable mediante Firebase Admin SDK.
- Paciente: lectura limitada a su documento y subcolecciones mediante coincidencia de `authUid` con `request.auth.uid`.
- Escrituras clínicas sensibles y solicitudes deberán validarse mediante reglas específicas o funciones de servidor.
- Ninguna regla de cliente debe confiar en un campo `role` enviado por el propio usuario.

## Secuencia obligatoria antes del despliegue
1. Crear un backend/función confiable para asignar claims y vincular UID ↔ paciente.
2. Añadir inicio/cierre de sesión con correo y contraseña y un estado explícito de carga/no autenticado.
3. Eliminar el modo anónimo como mecanismo de acceso a expedientes.
4. Migrar el documento compartido a documentos por paciente; verificar conteos y contenido sin copiar datos ficticios a cuentas reales.
5. Retirar de `localStorage` cualquier expediente o dato clínico identificable; mantener solo preferencias no sensibles.
6. Implementar permisos de escritura por operación (síntomas, registros, solicitudes) con validación de campos.
7. Probar con Firebase Emulator Suite: visitante, paciente A, paciente B, administrador y usuario sin claim.
8. Solo después de pruebas satisfactorias desplegar reglas y frontend coordinadamente.

## Advertencias
- Estas reglas describen el esquema objetivo, no el esquema actual.
- Desplegarlas antes de migrar el código y los datos causará errores de lectura/escritura (el documento legado está denegado intencionalmente).
- La clave de configuración Firebase del frontend no sustituye las reglas de seguridad. No incluir claves privadas ni JSON de cuentas de servicio en el repositorio.
- No utilizar datos reales de pacientes durante el desarrollo y las pruebas iniciales.
