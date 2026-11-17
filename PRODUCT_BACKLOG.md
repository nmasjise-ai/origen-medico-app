# ORIGEN Médico — Product Backlog y alcance funcional V1

**Marca:** ORIGEN Médico — Nutrición Clínica & Terapia GLP-1  
**Ámbito inicial:** Bolivia; atención presencial en Santa Cruz y atención remota nacional.  
**Precio inicial propuesto:** consulta virtual Bs 35, editable desde Configuración.

Este documento centraliza los requisitos. Las nuevas ideas se registran aquí; su implementación se prioriza según seguridad, valor clínico y dependencias técnicas.

## P0 — Fundaciones antes de pacientes reales
- [ ] Modelo Firestore por paciente y subcolecciones.
- [ ] Namespace QA `previewEnvironments/mejoras-seguridad-origen` dentro de `(default)`, restringido a API Preview y separado de `patients` de producción.
- [x] Método único de cuenta individual: correo electrónico y contraseña de Firebase Authentication; sin SMS/OTP de WhatsApp ni proveedores adicionales.
- [x] Invitación médica de un solo uso y con vencimiento; el paciente define su contraseña en ORIGEN y verifica su correo antes de vincular el expediente (Preview).
- [x] Recuperación de contraseña por correo y vínculo seguro de UID con expediente en namespace Preview; impedir auto-registro sin invitación válida.
- [ ] Roles y permisos de mínimo privilegio para médico, nutricionista, recepción, tienda y paciente.
- [ ] Pruebas con Firebase Emulator para visitante, médico, nutricionista, recepción, paciente A y paciente B.
- [x] Eliminar expedientes/datos clínicos de `localStorage` del frontend heredado.
- [ ] Verificar que no se exponga PII clínica en URLs, logs ni notificaciones externas.
- [ ] Auditoría de cambios clínicos y administrativos.
- [ ] Respaldos restringidos, restauración probada y política de retención.
- [ ] Consentimiento informado, aviso de privacidad, términos y registro versionado de aceptación.
- [ ] Migración controlada del documento legado: respaldo primero, clasificar registros y excluir los ficticios; no importar datos de origen desconocido.
- [ ] No publicar reglas ni fusionar a producción hasta validar el frontend migrado y los permisos extremo a extremo.

## P1 — Experiencia clínica esencial

### Expediente individual
- [x] Perfil del paciente, datos de contacto, fecha de nacimiento/edad y sexo biológico (implementado en Preview; QA pendiente).
- [x] Diagnósticos activos, antecedentes médicos/quirúrgicos/familiares, alergias y medicación concomitante (formulario validado y auditado en Preview).
- [ ] Línea de tiempo de consultas, mediciones, síntomas, tratamientos, recetas, planes y documentos.
- [x] Peso, talla, cintura, IMC derivado, composición corporal e historial/gráfico de evolución (implementado en Preview; pendiente validación manual de interfaz).
- [ ] Tratamiento indicado, dosis prescrita por médico, frecuencia y eventos autorizados. La app nunca ajusta dosis automáticamente.
- [ ] En V1 no se habilitará carga de archivos de laboratorio, PDF ni fotografías clínicas. Si más adelante se necesita, usar un servicio de almacenamiento separado, límites de tamaño, compresión, retención y permisos específicos; nunca guardar binarios/base64 en Firestore.
- [ ] Informe de progreso PDF, revisado por profesional antes de compartirlo.

### Registro de síntomas y alertas
- [ ] El paciente registra síntoma, intensidad, duración, fecha/hora y comentario.
- [ ] Alertas en tiempo real al panel médico con estados pendiente, revisado, contactado y cerrado.
- [ ] Notificaciones al médico dentro de la app y, con configuración/consentimiento, push, correo o WhatsApp Business oficial.
- [ ] Signos de alarma independientes de la puntuación: dolor abdominal intenso/persistente, vómitos persistentes, incapacidad para hidratarse, deshidratación o sangrado.
- [ ] Ante signos de alarma, instrucción clara de acudir a atención urgente. Nunca pedir al paciente que espere a que el médico vea una notificación.
- [ ] Registro de actuación y resolución de cada alerta.

### Calendario del tratamiento y controles
- [ ] Calendario personal con fechas de aplicaciones conforme a la pauta prescrita y controles médicos.
- [ ] Recordatorio automático 24 horas antes de cada control.
- [ ] Respuestas del paciente: Confirmar asistencia / Solicitar cambio / Cancelar.
- [ ] Actualización de agenda y aviso al consultorio cuando responde.
- [ ] Recordatorios adicionales opcionales, configurables por el médico.
- [ ] Zona horaria `America/La_Paz`; registrar programación, envío y confirmación.
- [ ] Notificaciones discretas sin revelar diagnóstico, fármaco o síntomas en la pantalla bloqueada.

### Nutrición y adherencia
- [ ] Planes de 7 y 15 días personalizados según preferencias, alergias, presupuesto y alimentos bolivianos.
- [ ] Metas de proteína, hidratación y actividad revisadas por profesional.
- [ ] Diario de hábitos y lista de compras.
- [ ] Preparación por nutricionista y aprobación según el flujo clínico definido.

## P2 — Nuevos servicios y operación comercial

### Consulta virtual para pacientes a distancia
- [ ] Sección pública “Consulta virtual”, disponible para pacientes de Sucre, Cochabamba y otros departamentos.
- [ ] Precio inicial **Bs 35 por consulta virtual**, editable desde Configuración.
- [ ] Formulario de solicitud con ciudad/departamento, contacto y motivo general.
- [ ] Agenda con disponibilidad real, selección de día/hora y confirmación.
- [ ] Instrucciones de pago QR, carga del comprobante y estado pendiente de verificación.
- [ ] Enlace seguro de videollamada luego de confirmar pago y horario.
- [ ] Consentimiento específico para atención a distancia, verificación de identidad, ubicación del paciente al momento de la consulta y contacto de emergencia.
- [ ] Triage previo: detectar cuándo la atención remota no es adecuada y derivar a evaluación presencial/urgente.
- [ ] Nota de consulta en el expediente; recetas solo cuando el profesional las considere apropiadas y las valide.
- [ ] Política clara de reprogramaciones, cancelación, inasistencia y reembolso.

### Catálogo de productos ORIGEN
- [ ] Tienda/catálogo público separado del expediente clínico y del vademécum.
- [ ] Mostrar productos cuya categoría y comercialización hayan sido verificadas: nombre, descripción y beneficios autorizados, presentación, precio en Bs, stock y condiciones de entrega. El catálogo V1 no requiere fotografías de producto almacenadas en Firebase.
- [ ] Acciones “Comprar/Solicitar” y “Reservar”; iniciar como solicitud revisada por el consultorio, no venta automática.
- [ ] Pedido, datos de entrega/recogida, pago QR, comprobante y estados: recibido, pendiente de pago, pagado, reservado, listo, entregado o cancelado.
- [ ] Confirmaciones al comprador y bandeja de pedidos para el consultorio.
- [ ] Administración sin código para productos, precios, stock, descripciones, beneficios, promociones y disponibilidad. Los datos serán texto/números livianos; no almacenar imágenes en Firestore ni base64.
- [ ] Inventario básico y, cuando corresponda, lote y vencimiento.
- [ ] Personal de tienda solo ve datos necesarios para pedidos; no diagnósticos, síntomas ni notas clínicas.

### Referencia de medicamentos (antes Vademécum GLP-1)
- [x] Renombrar a **“Referencia de medicamentos”**; uso interno profesional, separado del catálogo comercial (Preview; validación manual pendiente).
- [x] Área interna para profesionales; la primera vista usa principios activos y datos regulatorios oficiales disponibles. La carga completa de marcas y presentaciones queda pendiente de verificación individual.
- [ ] Sin CTA de compra/reserva, precios de farmacia ni publicidad al público desde esta sección.
- [x] Cada ficha inicial incluye fuente, fecha de revisión y estado de verificación; ampliar con fichas técnicas y fuentes clínicas validadas.
- [x] Se retiró la prescripción en un clic y la aprobación automática de solicitudes; la referencia no emite recetas.
- [ ] Cambiar el nombre de una farmacia no elimina obligaciones regulatorias. El catálogo público no ofrecerá medicamentos de prescripción para compra/reserva. Cualquier comercialización, publicidad, dispensación o integración con una farmacia debe verificarse con AGEMED/SEDES y asesoría legal antes de activarse.

### Agenda y gestión del consultorio
- [ ] Calendario unificado presencial/virtual, disponibilidad y lista de espera.
- [ ] Confirmaciones, reprogramaciones y cancelaciones.
- [ ] Bandeja de solicitudes, teleconsultas, pedidos y comprobantes.
- [ ] Configuración editable de precios, horarios, programas, canales de contacto y contenido público.
- [ ] Dashboard: pacientes activos, controles pendientes, alertas por revisar, consultas y pedidos; analítica sin exponer innecesariamente información clínica.

## P3 — Diferenciadores para una versión 10/10
- [ ] PWA instalable en Android/iPhone; sin cachear expedientes clínicos para uso sin conexión.
- [ ] Centro de notificaciones y preferencias de canal.
- [ ] Biblioteca educativa por etapas del tratamiento: alimentación, hidratación, fuerza, efectos adversos y signos de alarma.
- [ ] Mensajería segura médico-paciente para dudas no urgentes; WhatsApp solo para avisos operativos breves, sin detalle clínico.
- [ ] Seguimiento de objetivos, actividad física y adherencia.
- [ ] Reporte mensual comparativo y gráficos compartibles.
- [ ] Programa de fidelización y paquetes de servicios, sin incentivar uso innecesario de medicamentos.
- [ ] Encuesta de satisfacción.
- [ ] Multi-profesional y múltiples consultorios a futuro, con separación por organización.
- [ ] Exportación/portabilidad y proceso de corrección de información conforme a políticas aplicables.

## Matriz resumida de roles
- **Administrador médico (José):** configuración, expedientes y asignación de usuarios.
- **Médico:** pacientes autorizados; notas, tratamientos, recetas, síntomas y decisiones clínicas.
- **Nutricionista:** pacientes asignados y datos pertinentes a nutrición; crea planes, no recetas ni pauta farmacológica.
- **Recepción:** agenda, contacto, confirmaciones y estado de pago; no notas, recetas, síntomas detallados ni datos clínicos no necesarios.
- **Gestión de tienda:** catálogo, inventario y pedidos; sin acceso a expedientes.
- **Paciente:** solo su perfil, datos compartidos, planes, recetas publicadas, calendario y registros propios.
- **Visitante:** contenido público, catálogo habilitado y formularios; sin acceso clínico.

Los roles se asignan desde servidor. Nunca se confía en un rol enviado por el navegador. Toda operación se valida con reglas y pruebas.

## Decisiones funcionales propuestas
1. ORIGEN Médico es el producto principal; tienda, teleconsulta y referencia de medicamentos son módulos separados.
2. Precio inicial de consulta virtual: Bs 35, editable.
3. El vademécum es interno y no comercial.
4. El catálogo público se limita a productos cuya comercialización y publicidad estén verificadas.
5. Avisos externos respetan consentimiento y minimizan datos; las urgencias no dependen de una notificación.
6. Ninguna función diagnostica, ajusta dosis o receta automáticamente.
7. Primero resolver identidad, permisos, relaciones y datos; después construir módulos.

## Criterios de salida a producción
- [ ] Paciente A no puede leer/escribir datos del paciente B.
- [ ] Recepción, nutrición y tienda no acceden a campos clínicos fuera de su función.
- [ ] Sin PII clínica en `localStorage`, URLs, logs ni notificaciones externas.
- [ ] Consentimientos, auditoría y respaldo/restauración comprobados.
- [ ] Alertas, agenda, recordatorios y reprogramación probados extremo a extremo.
- [ ] Catálogo y flujo de pedidos revisados comercial/regulatoriamente.
- [ ] Consulta virtual y condiciones revisadas profesional y legalmente.
- [ ] Pruebas desktop, Android y iPhone.
- [ ] Revisión final de seguridad/privacidad antes de pacientes reales.

**Principio clínico:** una alerta nunca sustituye atención urgente; una solicitud de medicamento no es una receta ni una venta/dispensación autorizada.
