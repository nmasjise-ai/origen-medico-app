# ORIGEN NUTRI — Especificación funcional y técnica V1

**Estado:** diseño aprobado para desarrollo en Preview; no habilitado para producción.  
**Ámbito:** pacientes ficticios y cuentas de prueba únicamente.  
**Objetivo:** incorporar seguimiento nutricional y hábitos en el portal individual, con datos persistentes, metas profesionales y publicación controlada de planes.

## Principios no negociables

1. Cada registro se guarda bajo el expediente del paciente autenticado; el cliente nunca envía un `patientId` arbitrario como autoridad.
2. El paciente solo puede crear registros propios. Los registros enviados son append-only desde el cliente; no puede editarlos ni borrarlos.
3. Metas y planes son asignados/editados por profesional autorizado. El paciente no puede cambiar su meta clínica.
4. Un plan solo es visible al paciente cuando está aprobado y publicado.
5. No usar `localStorage`, `sessionStorage`, URLs ni logs para datos clínicos o nutricionales.
6. No añadir una nueva función API mientras Vercel Hobby esté en 12/12. Evaluar acceso Firestore cliente bajo reglas específicas y pruebas de emulador, o consolidar rutas existentes con revisión y autorización antes de retirar cualquier ruta.
7. No desplegar reglas Firestore a producción ni migrar datos reales en esta fase.

## Módulos V1

### 1. Tracker Diario

El paciente podrá registrar:
- Agua consumida en ml.
- Proteína consumida en gramos (estimación educativa, no medición de laboratorio).
- Comidas realizadas (desayuno, almuerzo, cena y colaciones; marcar realizadas, sin juicios de valor).
- Actividad física en minutos, opcional.

El registro debe tener fecha local `America/La_Paz`, fecha de creación del servidor y versión de esquema. El backend/reglas validan límites razonables, tipos y campos permitidos. No aceptar notas clínicas libres en el diario V1.

**Metas:** agua, proteína y actividad se muestran únicamente si un profesional las asignó. No calcular automáticamente objetivos de hidratación/proteína a partir del peso ni recomendar electrolitos. Si no existe una meta revisada, mostrar “Tu equipo aún no ha definido esta meta”.

**Persistencia:** `previewEnvironments/{environmentId}/patients/{patientId}/dailyLogs/{logId}`. El `logId` debe ser determinista por paciente y fecha o existir una validación equivalente que evite duplicados diarios. La regla debe impedir update/delete por el paciente.

### 2. Plan nutricional de 7 días

Documento versionado en `nutritionPlans/{planId}` con:
- `schemaVersion`, `status` (draft, pending_review, approved, published, archived).
- `createdAt`, `updatedAt`, `approvedAt`, `publishedAt`, `reviewedBy`.
- Rango de vigencia y zona horaria.
- Preferencias, alergias y presupuesto considerados.
- Siete días, con desayuno, almuerzo, cena y colaciones opcionales.
- Ingredientes, porciones/cantidades, preparación y sustituciones disponibles en Bolivia.
- Objetivos individualizados solo si fueron asignados por el profesional.

Solo nutricionista/médico autorizado podrá crear o editar. Solo un profesional autorizado podrá aprobar/publicar. El paciente tendrá lectura del plan publicado vigente, nunca de borradores ni notas internas.

### 3. Lista de compras

Se deriva exclusivamente del plan publicado. Agrupar ingredientes y cantidades por semana; permitir al paciente marcar elementos como comprados en estado local de interfaz únicamente si no se persiste como dato clínico, o diseñar después una subcolección propia con permisos. No alterar el plan original.

### 4. Panel profesional

- Buscar paciente autorizado.
- Asignar metas y vigencia.
- Crear/editar plan.
- Revisar alergias/preferencias disponibles.
- Enviar a revisión, aprobar, publicar, pausar o archivar con auditoría.
- Mostrar registros diarios y tendencia descriptiva.
- No permitir que la aprobación nutricional modifique tratamientos farmacológicos.

### 5. Evolución e informe

Resumen semanal/mensual de los registros realmente enviados, porcentaje de días con registro y evolución antropométrica existente. Diferenciar “sin registro” de cero consumo. PDF solo después de validación del contenido y revisión profesional; no inferir adherencia clínica de datos incompletos.

### 6. Modo GLP-1 y “Mi día en ORIGEN”

Modo educativo de acompañamiento: tolerancia gastrointestinal, hidratación y alimentación según metas profesionales, recordatorios y señales para solicitar atención. Nunca sugerir aumentar, reducir, retrasar ni suspender dosis. Síntomas de alarma requieren atención urgente; no depender de una notificación al profesional.

## Modelo de datos propuesto

- `patients/{patientId}/dailyLogs/{dateKey}`: registro diario append-only.
- `patients/{patientId}/nutritionGoals/{goalId}`: metas con autor, fecha, vigencia, unidad, valor, estado y motivo; escritura profesional.
- `patients/{patientId}/nutritionPlans/{planId}`: planes versionados; escritura profesional, lectura paciente solo aprobado/publicado.
- `patients/{patientId}/nutritionAuditLogs/{eventId}`: eventos de creación, aprobación, publicación, pausa y archivo; escritura de servidor.

Para Preview, anteponer el namespace existente:
`previewEnvironments/mejoras-seguridad-origen/patients/{patientId}/...`

El modelo final debe comprobar que las reglas Firestore actuales del namespace Preview aplican al SDK cliente autenticado. No asumir que una regla existente equivale a una prueba de autorización completa.

## Seguridad y pruebas obligatorias antes de activar el Tracker

- Paciente A crea y lee solo sus registros.
- Paciente A no puede leer, crear, editar ni borrar registros de B.
- Paciente no puede escribir metas ni planes.
- Médico/nutricionista autorizado puede asignar metas y publicar planes.
- Borrador y plan pendiente no son visibles al paciente.
- Paciente suspendido no puede leer ni escribir registros.
- Rechazar campos adicionales, tipos incorrectos, valores fuera de rango y fechas inválidas.
- Rechazar edición/borrado del diario desde cliente y probar duplicados diarios.
- Verificar que no se filtran datos en logs, errores, URLs ni almacenamiento local.
- Probar el build, la suite completa de emulador y Preview con cuentas ficticias.

## Secuencia de implementación

1. **Contrato y pruebas:** ampliar pruebas de reglas del namespace Preview y validar el esquema del diario.
2. **Tracker Diario:** UI conectada a persistencia segura, metas profesionales y estados vacíos.
3. **Planes de 7 días:** editor profesional, ciclo de revisión/aprobación/publicación y vista del paciente.
4. **Lista de compras:** agregación desde plan publicado.
5. **Panel y evolución:** indicadores descriptivos y filtros.
6. **PDF y modo GLP-1:** después de revisión clínica, privacidad y QA.

## Fuera de alcance en V1

- Cálculo automático de calorías o metas terapéuticas.
- Recomendación automática de electrolitos o suplementos.
- Ajustes automáticos de tirzepatida u otros medicamentos.
- Alertas diagnósticas basadas en adherencia.
- Uso de datos reales de pacientes en Preview.
- Despliegue a producción o publicación de reglas sin aprobación explícita.
