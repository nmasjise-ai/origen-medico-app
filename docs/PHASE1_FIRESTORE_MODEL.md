# ORIGEN Médico — Fase 1: modelo de datos clínicos y migración

## Objetivo

Sustituir el documento compartido `artifacts/{appId}/public/data/clinic_state/main` por expedientes independientes en Cloud Firestore. Cada paciente tendrá una identidad vinculada a un único expediente. El médico podrá consultar todos los expedientes autorizados mediante un custom claim de Firebase Authentication (`admin: true`).

**Este documento define el destino; no significa que el frontend ya esté migrado ni que estas reglas deban publicarse todavía.**

## Hechos del proyecto actual

- El frontend React/Vite mantiene un objeto `clinicData` con `clinicConfig`, `patients[]`, `webLeads[]` y `rxRequests[]`.
- Cada paciente contiene `dailyLog`, `bodyMetrics[]`, `titrationHistory[]`, `prescriptions[]` y datos de tratamiento.
- La aplicación intenta guardar todo el objeto en un único documento Firestore y además lo copia a `localStorage`.
- El archivo `App.jsx` contiene registros ficticios de demostración (por ejemplo, IDs `pat-sofia`, `pat-carlos`, `pat-valeria`, `lead-1`, `req-1`). Esos registros no deben importarse como pacientes reales.
- La aplicación aún contiene un selector de paciente de demostración. En la versión final, la identidad del paciente autenticado determinará el expediente; el paciente no podrá elegir el ID de otra persona.

## Modelo Firestore propuesto

### Colección `users/{uid}`

Documento de autorización/mapeo, provisionado únicamente por el servidor:

- `patientId`: ID del único expediente asignado a la cuenta paciente. No existe para la cuenta médica.
- `createdAt`, `updatedAt`: marcas de tiempo.
- No confiar en un campo `role` escrito por el cliente. La autorización médica se basa en el custom claim verificado `admin: true`; el vínculo paciente-expediente se asigna desde Firebase Admin SDK.

### Colección `patients/{patientId}`

Documento de perfil que puede ver el paciente asociado y el médico:

- Identidad: `displayName`, `birthDate` o edad calculada, `sex`, `phone`, `email`.
- Estado: `status`, `createdAt`, `updatedAt`, `assignedClinicianUid`.
- Datos necesarios para el portal: objetivos visibles, altura y preferencias acordadas.
- No guardar aquí notas internas del médico, alertas internas ni datos de auditoría.

### Subcolecciones de cada paciente

| Ruta | Contenido | Paciente | Médico |
|---|---|---|---|
| `measurements/{id}` | Peso, cintura, composición corporal e IMC derivado | Leer | Leer/escribir |
| `treatmentEvents/{id}` | Tratamiento prescrito, dosis indicada, calendario y cambios autorizados | Leer | Leer/escribir |
| `nutritionPlans/{id}` | Planes nutricionales aprobados, versiones y vigencia | Leer | Leer/escribir |
| `prescriptions/{id}` | Recetas emitidas y estado | Leer | Leer/escribir |
| `dailyLogs/{id}` | Registro diario de proteína, hidratación y adherencia | Leer/crear propio | Leer/escribir |
| `symptomReports/{id}` | Síntomas, intensidad, duración y notas del paciente | Leer/crear propio | Leer/escribir |
| `prescriptionRequests/{id}` | Solicitudes del paciente pendientes de revisión | Leer/crear propio | Leer/gestionar |
| `doctorNotes/{id}` | Notas clínicas internas | Sin acceso | Leer/escribir |
| `auditLogs/{id}` | Quién consultó/modificó qué y cuándo | Sin acceso | Lectura; escritura desde servidor |

Las rutas internas se separan deliberadamente: que el paciente pueda leer su plan no significa que deba leer las notas privadas del médico.

### Configuración del consultorio y contenido público

- `clinicSettings/{documentId}`: precios, datos bancarios, contactos internos y configuración privada; solo médico.
- `publicContent/{documentId}`: información pública expresamente seleccionada; lectura pública, escritura del médico.
- `intakeLeads/{leadId}`: solicitudes web; lectura/gestión del médico. La creación pública se hará mediante endpoint de servidor con validación y protección contra abuso, no con escritura abierta de Firestore.

## Extensión del modelo para los módulos V1 aprobados

Estas colecciones se prevén desde el diseño para que la tienda y la teleconsulta no obliguen a volver al documento clínico monolítico.

### Equipo y permisos

Los roles se asignarán en backend mediante claims verificados y/o membresías provisionadas por servidor. Nunca se permitirá que una cuenta se asigne permisos editando su propio documento.

| Rol | Acceso previsto |
|---|---|
| Administrador médico | Configuración, equipo y todos los expedientes autorizados |
| Médico | Expedientes asignados/autorizados, notas, tratamientos, recetas, alertas y consultas |
| Nutricionista | Pacientes asignados y datos necesarios para nutrición; planes y seguimiento nutricional |
| Recepción | Agenda, contacto, reservas y estado de pago; sin notas, síntomas detallados ni laboratorios |
| Gestión de tienda | Catálogo, inventario y pedidos; sin expedientes clínicos |
| Paciente | Solo su expediente, planes compartidos, recetas publicadas, calendario y registros propios |
| Visitante | Contenido público y catálogo habilitado; sin información clínica |

Los permisos deben aplicarse a nivel de colección/documento/campo o a través de endpoints de servidor, no solo ocultando botones en React.

### Agenda, tratamiento y notificaciones

| Ruta | Contenido | Lectura/escritura |
|---|---|---|
| `patients/{id}/appointments/{appointmentId}` | Consulta presencial/virtual, horario, estado y respuestas de confirmación | Paciente: leer y responder campos permitidos; médico/recepción: gestionar según rol |
| `patients/{id}/scheduleEvents/{eventId}` | Fechas de control y calendario de aplicación prescrito | Paciente: leer; médico: crear/editar |
| `users/{uid}/notifications/{notificationId}` | Avisos operativos para el usuario | Usuario: leer/marcar visto; servidor: crear |
| `users/{uid}/pushTokens/{tokenId}` | Token de dispositivo para notificaciones push | Usuario: registrar/eliminar solo su token; servidor: validar |
| `notificationJobs/{jobId}` | Programación, ejecución, resultado y reintentos de recordatorios | Solo servidor; lectura de estado limitada a médico/admin |

Los avisos al paciente deben ser discretos (por ejemplo, “Tienes un recordatorio de ORIGEN Médico”), evitando diagnóstico, medicamento o síntoma en la pantalla bloqueada. Los avisos urgentes al paciente indicarán atención de emergencia; nunca dependerán de que el profesional responda a una notificación push.

### Consulta virtual

- Una teleconsulta es una cita de tipo `virtual` dentro de `appointments`, con consentimiento versionado, fecha/hora, estado de pago y profesional asignado.
- La URL de videollamada se genera después de confirmar la cita y se muestra solo al paciente y profesional autorizados.
- Los datos de pago y comprobantes se almacenan en un módulo separado del expediente; no guardar credenciales bancarias ni datos de tarjeta.
- El documento de consulta clínica generado se incorpora al expediente, con autor y fecha.
- El precio inicial de Bs 35 es configuración comercial editable, no una regla de seguridad ni una promesa de disponibilidad.

### Catálogo, solicitudes y pedidos

| Ruta | Contenido | Lectura/escritura |
|---|---|---|
| `storeProducts/{productId}` | Producto público aprobado, precio, disponibilidad, descripción e imagen | Público: leer activos; admin/tienda: gestionar |
| `orders/{orderId}` | Solicitud de compra/reserva, cliente, artículos, entrega y estado | Cliente: leer sus pedidos; backend: crear; tienda/admin: gestionar |
| `orders/{orderId}/paymentEvents/{eventId}` | Estado de verificación de pago y referencia de comprobante | Cliente: enviar comprobante por flujo validado; tienda/admin: revisar; servidor: registrar |
| `inventory/{productId}/movements/{movementId}` | Entradas, salidas, lote y vencimiento cuando corresponda | Admin/tienda autorizado |

El catálogo público se limita a productos cuya comercialización esté verificada. Los medicamentos no se publicarán como artículos de compra/reserva sin revisión legal y autorización aplicable. El vademécum se mantiene privado y separado del comercio.

### Solicitudes web

- `intakeLeads` debe diferenciar solicitud de consulta presencial, teleconsulta y contacto general.
- `orders` debe separar pedidos comerciales de los datos clínicos.
- Una solicitud pública no crea por sí sola un expediente médico activo ni concede acceso al paciente.
- Los comprobantes de pago se guardan en almacenamiento privado con URLs firmadas/reglas, no en un campo público del documento.

## Reglas de identidad

1. Médico: sesión Firebase válida y custom claim `admin: true`.
2. Paciente: sesión Firebase válida y documento `users/{uid}` provisionado por servidor con `patientId`.
3. El paciente solo puede leer el documento indicado por su propio mapeo y sus subcolecciones autorizadas.
4. El paciente no puede listar `patients`, cambiar su `patientId`, asignarse permisos, editar mediciones médicas, modificar recetas ni borrar registros clínicos.
5. El paciente puede añadir registros diarios, informes de síntomas y solicitudes dentro de su propia ruta; el contenido y los campos se validan mediante reglas.
6. El personal clínico no debe compartir la cuenta administradora. Si luego se agregan otros profesionales, se diseñarán roles de equipo y permisos explícitos.

## Correspondencia del modelo anterior

| Dato anterior | Destino propuesto |
|---|---|
| `patients[]` | Un documento `patients/{patientId}` por persona |
| `bodyMetrics[]` | `patients/{id}/measurements/{measurementId}` |
| `titrationHistory[]` y cambios de pauta | `treatmentEvents` |
| `prescriptions[]` | `prescriptions` |
| `dailyLog` | `dailyLogs` con fecha explícita; no inventar históricos |
| `webLeads[]` | `intakeLeads` |
| `rxRequests[]` | `prescriptionRequests` dentro del expediente vinculado |
| `clinicConfig` | `clinicSettings/private` y una proyección segura `publicContent` |
| Catálogo estático y menús de ejemplo | Catálogo versionado; separar datos de paciente de contenido general |

No trasladar el objeto completo como JSON dentro de un documento nuevo. Cada conjunto debe migrarse y validarse por separado.

## Plan de migración seguro

1. Mantener las reglas actuales de producción cerradas y no desplegar el borrador de esta rama.
2. Con Firebase Admin SDK en un endpoint temporal, verificar si existe el documento legado y exportar una copia restringida al médico. No exponer el contenido en logs ni al navegador.
3. Clasificar cada registro: dato ficticio de la aplicación, dato real validado o dato desconocido. Los registros ficticios identificados en `DEFAULT_CLINIC_STATE` se excluyen.
4. Diseñar un manifiesto de migración con conteos y hashes, sin imprimir PII.
5. Migrar primero a un proyecto/dataset de prueba con IDs estables, preservando fechas y el origen de cada dato. No inventar fechas para `dailyLog` ni completar campos clínicos faltantes.
6. Validar conteos, relaciones, adjuntos y permisos con pruebas automatizadas.
7. Integrar el frontend por módulos: perfil/expediente, controles, tratamiento, nutrición, síntomas y solicitudes.
8. Desplegar reglas y frontend coordinadamente solo después de que todas las pruebas pasen.
9. Mantener una copia de solo lectura del respaldo anterior y un plan de reversión hasta validar producción.

## Controles obligatorios antes de producción

- Paciente A no puede leer ni modificar datos del paciente B.
- Paciente no puede listar expedientes ni editar su asignación.
- Visitante no puede leer ningún dato clínico ni configuración privada.
- Médico autorizado puede gestionar los expedientes.
- Notas internas y auditoría solo son visibles para el médico.
- Los registros diarios e informes de síntomas del paciente son append-only desde el cliente.
- Ninguna receta se emite automáticamente; la solicitud del paciente requiere decisión médica.
- No hay PII clínica en `localStorage`, URLs, logs ni mensajes de error.
- Backups, restauración y registro de auditoría probados.

## Extensiones previstas para no rehacer el modelo

El esquema deja espacio para consentimiento informado, alergias/antecedentes, objetivos, laboratorios, alertas clínicas, citas, recordatorios, seguimiento de adherencia y documentos adjuntos. Se incorporarán con sus propios permisos y retención; no se añadirán al documento raíz del paciente por comodidad.


## Decisión de almacenamiento liviano para V1

- No se implementará en V1 la carga de informes de laboratorio, PDFs ni fotografías clínicas. Se mantendrán únicamente antecedentes esenciales y valores clínicos estructurados (fecha, parámetro, resultado, unidad y profesional que los registró) cuando el flujo clínico los requiera.
- No almacenar imágenes, PDFs, adjuntos ni cadenas base64 dentro de documentos Firestore.
- El catálogo de productos almacenará solo metadatos pequeños en `storeProducts/{productId}`: nombre, categoría validada, presentación, descripción/beneficios aprobados, precio en Bs, unidades disponibles, estado de publicación y fechas de actualización.
- No se requiere Firebase Storage para el catálogo inicial. Las fichas pueden comenzar en formato texto; si más adelante se deciden fotografías, usar assets estáticos optimizados del sitio o un almacenamiento de objetos separado, con límites y revisión de coste.
- Los pedidos se guardan en `orders/{orderId}` y nunca dentro del expediente médico. El acceso comercial no otorga acceso clínico.
- Las fotografías compartidas para inventario son referencia de trabajo; no se guardan automáticamente en Firestore ni en Storage.

## Inventario inicial leído de las fotografías

Se creó `docs/INITIAL_STOCK_CATALOG.md` con un borrador de nombres visibles: THERMO, BELLE, PRIMULA/PRÍMULA (por confirmar), + TESTO, HSN + SILICIO, DETOX MATCHA, LIPO TEA, MAGNESIO BISGLICINATO, OMEGA 3 ULTRAPURE 33/22, CREATINHEX NEURO, CREATINHEX MUJER, VITAMINA A-Z, COLÁGENO ARTROS, VITAMINA D3 2000 UI, TRI MAGNESIO y una segunda presentación de OMEGA 3 que requiere transcripción exacta.

Los precios, cantidades exactas, presentaciones y beneficios no se infieren de las fotografías; deben confirmarse con el inventario y las etiquetas antes de publicación.



## Aislamiento de Preview sin una base Firestore adicional

El proyecto está en el plan Firebase Spark. Las bases Firestore con ID distinto de `(default)` requieren activar facturación Blaze y no reciben la cuota gratuita de Firestore. Por ello, V1 no creará `origen-staging` como base secundaria.

- Se conserva la única base `(default)`, en la ubicación existente `southamerica-east1`.
- Los datos de control de calidad de Preview van bajo `previewEnvironments/mejoras-seguridad-origen/patients/{patientId}`.
- La API de pacientes verifica cuenta médica, `VERCEL_ENV=preview` y el namespace exacto `ORIGEN_PREVIEW_DATA_NAMESPACE`.
- La variable de Vercel queda limitada a Preview y a la rama `mejoras-seguridad-origen`.
- La API Admin SDK escribe solo en ese subárbol, nunca en `patients/{patientId}` de producción.
- Las reglas cliente mantienen denegado todo acceso que no esté expresamente permitido; el SDK Admin del servidor utiliza autenticación y autorización propias y no depende de las reglas cliente.
- No se debe crear una base Firestore nombrada ni activar Blaze para este paso.

Esta separación es lógica por colección/namespace dentro de la base existente, no aislamiento físico de bases. No se deben guardar datos reales de pacientes en Preview.


## Ficha individual y mediciones de control en Preview

- `GET /api/admin/patients/{patientId}`: devuelve solo los campos básicos de perfil y hasta 30 mediciones recientes, con acceso de administrador y namespace Preview.
- `POST /api/admin/patients/{patientId}`: agrega una nueva medición mediante lista permitida de campos y límites numéricos; no acepta medicamentos, dosis, notas libres ni cambios de rol.
- Cada nuevo control genera un evento de auditoría y actualiza `updatedAt`.
- La pantalla del panel permite abrir una ficha provisional, consultar el historial y registrar un nuevo control.
- Estos datos son QA; todavía no existe cuenta de paciente vinculada ni portal individual activo.


## Decisión de autenticación de pacientes

- Método único de inicio de sesión: correo electrónico + contraseña mediante Firebase Authentication.
- El proveedor Email/Password ya está habilitado en Firebase Console y el frontend actual del médico usa `signInWithEmailAndPassword`.
- No implementar inicio de sesión por SMS, OTP de WhatsApp, ni Google/otros proveedores en esta fase.
- El paciente podrá crear su cuenta solo después de recibir una invitación emitida por el consultorio; no habrá auto-registro público abierto.
- El flujo previsto es: invitación de un solo uso y con vencimiento → paciente crea cuenta con correo y contraseña → verificación de correo → servidor valida y consume invitación → servidor vincula `users/{uid}.patientId` y marca la cuenta del expediente como vinculada.
- Recuperación de contraseña mediante correo de Firebase. No pedir ni almacenar contraseñas en ORIGEN ni enviarlas por WhatsApp.
- El enlace de invitación puede compartirse manualmente por el canal que el consultorio elija, pero el canal de mensajería no es un proveedor de autenticación ni reemplaza la verificación de correo.
- El vínculo de paciente se realiza solo desde servidor; el cliente nunca puede escoger ni modificar libremente `patientId`.


## Flujo de invitación y vinculación de cuentas (Preview)

### Colecciones
- `previewEnvironments/mejoras-seguridad-origen/patients/{patientId}`: perfil y estado de cuenta.
- `previewEnvironments/mejoras-seguridad-origen/invitations/{tokenHash}`: invitación ligada a un solo correo y expediente. Guarda SHA-256 del token, email normalizado, estado, UID emisor y vencimiento. Nunca guarda el token original.
- `previewEnvironments/mejoras-seguridad-origen/users/{uid}`: vínculo creado por el servidor con `role=patient` y un único `patientId`.

### Secuencia
1. El médico autenticado (claim `admin=true`) emite una invitación para un paciente pendiente y un correo concreto.
2. El servidor genera 32 bytes aleatorios URL-safe, almacena solo su hash SHA-256, fija vencimiento a 7 días y marca `accountStatus=invited`.
3. El médico copia el enlace de activación. El token viaja en el fragmento `#activar=` para no incluirse en solicitudes HTTP ni en el referrer. El enlace se comparte manualmente; no hay envío automático de invitaciones.
4. El paciente introduce el correo invitado y crea contraseña con Firebase Authentication Email/Password; o inicia sesión si ya tiene una cuenta.
5. Firebase envía el correo de verificación. La pantalla permite reenviar el correo y comprobar la verificación.
6. El endpoint de vinculación verifica el ID token Firebase con revocación y exige `email_verified=true`, correo coincidente y que el usuario no sea administrador.
7. Una transacción de Firestore verifica invitación pendiente, vencimiento, correo, estado del paciente y que ni el paciente ni el UID estén vinculados. En la misma transacción crea `users/{uid}`, marca el paciente como vinculado, consume la invitación y registra auditoría.
8. El endpoint de sesión devuelve solo el perfil básico del paciente actualmente autenticado.

### Controles
- Token aleatorio de 256 bits; solo hash SHA-256 almacenado.
- Vencimiento 7 días; un solo uso; invitación anterior revocada al emitir otra.
- Token ligado a correo exacto después de normalización.
- No hay registro público abierto, OTP/SMS, Google ni contraseñas almacenadas por ORIGEN.
- La recuperación de contraseña usa el correo de Firebase.
- La API y las colecciones están restringidas a la implementación Vercel Preview y al namespace de pruebas. No usar datos reales.
- El enlace se muestra una sola vez al médico; copiarlo y entregarlo manualmente al paciente.
- La activación de cuenta no abre todavía módulos clínicos completos; la vista paciente inicial solo confirma que la cuenta quedó vinculada.
