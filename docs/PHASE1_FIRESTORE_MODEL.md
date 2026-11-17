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
