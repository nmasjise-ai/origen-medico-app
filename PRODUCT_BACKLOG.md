# ORIGEN Médico — Product Backlog

Este backlog recoge ideas sin mezclarlas con el trabajo de seguridad y datos. Cada propuesta se priorizará por valor clínico, riesgo, esfuerzo y dependencia técnica.

## P0 — Fundaciones antes de pacientes reales
- [ ] Modelo Firestore por paciente y subcolecciones.
- [ ] Cuentas individuales, invitación y recuperación de acceso.
- [ ] Reglas de lectura/escritura por rol y pruebas automáticas.
- [ ] Eliminar expedientes clínicos de localStorage.
- [ ] Auditoría de cambios clínicos y copias de seguridad/restauración.
- [ ] Consentimiento informado, aviso de privacidad y control de acceso.
- [ ] Migración controlada, sin importar los registros ficticios.

## P1 — Flujo clínico esencial
- [ ] Alta de paciente con invitación segura y vinculación de UID.
- [ ] Expediente cronológico con mediciones, tratamiento, notas y recetas.
- [ ] Registro de síntomas con severidad, duración, alertas y orientación de urgencia para signos de alarma.
- [ ] Plan nutricional individual con revisión/aprobación del profesional.
- [ ] Informe de progreso PDF y exportación clínica controlada.
- [ ] Notificaciones de controles pendientes y solicitudes que esperan revisión.
- [ ] Búsqueda y filtros de pacientes, historial y estado de seguimiento.

## P2 — Operación del consultorio
- [ ] Agenda/citas y recordatorios por WhatsApp o correo.
- [ ] Bandeja de solicitudes web y seguimiento de pagos QR.
- [ ] Configuración desde panel médico: aranceles, programas, catálogo y contenido público.
- [ ] Vademécum con principio activo, marca, presentación, fuente, fecha de verificación y alertas de seguridad.
- [ ] Inventario de productos/insumos, lotes, vencimientos y cadena de frío cuando corresponda.
- [ ] Dashboard de indicadores del consultorio y evolución de pacientes.

## P3 — Diferenciadores ORIGEN Médico
- [ ] Motor nutricional de 7 y 15 días con alimentos económicos de Bolivia, preferencias y lista de compras.
- [ ] Seguimiento de hábitos: proteína, hidratación, actividad y adherencia.
- [ ] Resumen de evolución para el paciente y para el médico.
- [ ] Educación por etapas del tratamiento y biblioteca de recursos.
- [ ] Teleconsulta y carga segura de documentos/laboratorios.
- [ ] Perfiles para nutricionista y otros profesionales con permisos limitados.

## Criterio de priorización

**Ahora:** construir lo que condiciona la seguridad, identidad, relaciones y permisos de los datos.

**Después de la Fase 1:** añadir funciones que usen este modelo sin cambiarlo de raíz (agenda, notificaciones, educación, reportes, inventario y analítica).

**Nunca automatizar sin revisión profesional:** cambios de dosis, prescripción, diagnóstico o escalamiento clínico.
