# Calendario inteligente y notificaciones Push — ORIGEN MÉDICO

**Estado:** diseño técnico iniciado; no habilitado para pacientes ni producción.  
**Rama:** `feature/calendario-inteligente-push`  
**Entorno objetivo inicial:** Vercel Preview + namespace aislado `previewEnvironments/mejoras-seguridad-origen`.  
**Zona horaria:** `America/La_Paz`.

## Objetivo
Unificar en el portal del paciente las fechas de aplicaciones prescritas y las citas de seguimiento del consultorio. Las citas presenciales generan un recordatorio 24 horas antes. El paciente puede confirmar asistencia o solicitar reprogramación; el consultorio revisa y confirma el cambio.

## Alcance funcional
1. **Eventos de tratamiento:** fecha/hora y pauta cargadas/autorizadas por el profesional. La aplicación solo recuerda; no prescribe ni modifica dosis.
2. **Citas de seguimiento:** fecha/hora, modalidad (presencial/virtual), ubicación/instrucciones operativas y estado.
3. **Recordatorio de cita:** push 24 horas antes, si el paciente otorgó permiso y tiene una suscripción activa. Mensaje discreto, sin diagnóstico, fármaco, dosis ni síntomas en pantalla bloqueada.
4. **Confirmación:** el paciente confirma asistencia y el estado queda registrado.
5. **Reprogramación:** el paciente envía una solicitud con nueva fecha/hora preferida y motivo opcional no clínico. La cita original no cambia hasta que recepción/médico apruebe una nueva hora disponible.
6. **Cancelación:** solicitud/cancelación según política del consultorio; conservar auditoría.
7. **Panel del consultorio:** agenda próxima, confirmaciones, solicitudes pendientes, cancelaciones e inasistencias.
8. **Auditoría:** registrar actor, fecha, estado anterior/nuevo y timestamps de creación, envío, confirmación y aprobación.

## Modelo de datos propuesto
Subcolecciones bajo el expediente del paciente en el namespace de Preview:
- `appointments/{appointmentId}`: `startsAt` (Timestamp UTC), `timeZone`, `type`, `status`, `locationLabel`, `createdBy`, `updatedAt`, `reminder24hAt`, `reminderSentAt`, `reminderStatus`.
- `treatmentEvents/{eventId}`: `scheduledAt`, `eventType`, `status`, `createdBy`; datos de pauta visibles solo cuando el profesional los haya autorizado.
- `rescheduleRequests/{requestId}`: `appointmentId`, `requestedStartsAt`, `status`, `requestedByUid`, `createdAt`, `reviewedBy`, `reviewedAt`.
- `notificationSubscriptions/{subscriptionId}`: token FCM, plataforma, UID, estado, consentimiento y timestamps. El token solo será accesible por el servidor y su propietario.
- `notificationJobs/{jobId}`: referencia de cita, tipo, fecha programada, estado, intentos y resultado técnico; sin contenido clínico.

Los nombres y campos definitivos se ajustarán al modelo y a las reglas existentes antes de escribir datos.

## Arquitectura de notificaciones
- PWA con Service Worker y Firebase Cloud Messaging (FCM) para Android y navegadores compatibles.
- En iPhone/iPad, Push web requiere iOS/iPadOS compatible, instalación de la PWA en pantalla de inicio y permiso explícito del usuario.
- VAPID public key en frontend; credenciales de servidor y FCM Admin únicamente en variables de entorno protegidas.
- Proceso servidor programado que busca recordatorios vencidos/no enviados, reclama cada trabajo de forma idempotente y envía FCM. No confiar en timers del navegador.
- Confirmar plan y límites reales del proveedor de cron antes de elegir Vercel Cron o Cloud Scheduler/Cloud Functions. No activar un servicio con facturación sin aprobación.
- Si el usuario no da permiso o el dispositivo no soporta Push, mostrar el evento dentro del portal y ofrecer recordatorio alternativo consentido cuando esté disponible.

## Seguridad y privacidad
- Todas las operaciones pasan por API autenticada; validar UID ↔ patientId y estado de acceso en servidor.
- Paciente solo lee sus eventos y crea confirmación/solicitud de reprogramación propia.
- Solo roles autorizados de consultorio crean, editan, aprueban o cancelan citas.
- No permitir al cliente enviar roles, patientId arbitrarios, estados finales ni tokens de otro usuario.
- No incluir datos clínicos en título/cuerpo de Push ni URLs.
- No guardar tokens en logs. Revocar tokens inválidos y permitir desactivar notificaciones.
- Idempotencia para evitar recordatorios duplicados; cambios de cita invalidan el job anterior.
- La notificación no sustituye atención urgente ni garantiza que el paciente la vea.

## Criterios de aceptación
- Zona horaria Bolivia correcta y pruebas de límites de fecha/hora.
- Recordatorio generado una sola vez aproximadamente 24 h antes.
- No enviar recordatorio para cita cancelada/reprogramada o ya completada.
- Confirmación visible para el consultorio.
- Reprogramación queda pendiente y no mueve la cita hasta aprobación.
- Al aprobar, calendario del paciente y agenda del consultorio muestran la misma fecha.
- Paciente A no puede leer ni alterar datos de paciente B.
- Pruebas con dos cuentas ficticias, notificaciones de prueba y dispositivos Android/iPhone compatibles.
- Sin datos reales hasta completar revisión de seguridad, privacidad y QA.
- Build, pruebas automatizadas, prueba manual en Preview y revisión de logs antes de producción.

## Secuencia de implementación
1. Verificar y cerrar el modelo de roles, permisos y namespace Preview.
2. Implementar API de agenda y pruebas de autorización.
3. Implementar vistas calendario paciente y agenda consultorio.
4. Implementar confirmación y flujo de solicitud/aprobación de reprogramación.
5. Implementar suscripción FCM y gestión de preferencias.
6. Implementar proceso programado idempotente de recordatorios.
7. Validar extremo a extremo en Preview; luego evaluar publicación.
