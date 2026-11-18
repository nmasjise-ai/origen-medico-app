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


---

## Nuevas propuestas — Nutrición práctica y herramientas de bajo impacto
Estas funciones se incorporan al alcance futuro. Se implementarán de forma incremental, preferentemente como componentes/pantallas independientes, sin reescribir el expediente, la autenticación ni la capa de datos existente.

### N1 — Herramientas educativas de nutrición (prioridad inicial)
- [ ] **Método de la mano y la taza:** guía visual de porciones de proteína (palma), carbohidratos (puño), grasas (pulgar) y verduras (dos manos abiertas). Incluir ejemplos de alimentos locales. Aclarar que es una guía aproximada y que las porciones se individualizan.
- [ ] **Centro educativo ORIGEN:** artículos breves, consejos e infografías revisados por profesional; categorías de alimentación, hidratación, actividad física, conservación de masa muscular y tratamiento GLP-1. Mostrar fecha/estado de revisión y evitar publicar contenido clínico no aprobado.
- [ ] **Equivalencias de alimentos locales:** alternativas por grupo alimentario y porciones aproximadas con ingredientes disponibles en mercados y supermercados de Santa Cruz. Diferenciar equivalencia práctica de equivalencia nutricional calculada.
- [ ] **Guía de tolerancia gastrointestinal:** información sobre náuseas, reflujo, diarrea y estreñimiento; consejos generales y señales de alarma. No clasificar alimentos como universalmente prohibidos ni sustituir evaluación clínica.
- [ ] **Semáforo/registro de hidratación:** registro diario simple y visual de líquidos. Metas individualizadas por profesional; no recomendar automáticamente electrolitos, sales de rehidratación o magnesio.
- [ ] **Calculadora de proteína:** mostrar objetivo indicado/revisado por profesional y traducirlo a combinaciones de alimentos. Usar una base nutricional fiable, cantidades explícitas y advertir que el colágeno no equivale a una fuente completa de proteína para todos los objetivos.

### N2 — Menús y seguimiento nutricional
- [ ] **Menús con alimentos cotidianos bolivianos:** opciones económicas, intermedias y flexibles, con alternativas por disponibilidad, alergias y preferencias.
- [ ] **Modos de menú:** pérdida de peso con preservación muscular; recomposición corporal; y tolerancia gastrointestinal. Son plantillas de planificación, no diagnósticos ni prescripciones automáticas.
- [ ] **Lista de compras:** derivada del menú aprobado, con cantidades aproximadas y agrupación por categoría.
- [ ] **Aprobación profesional:** el paciente solo visualiza el menú personalizado cuando el nutricionista/profesional autorizado lo revisa y publica.

### N3 — Mejoras administrativas sencillas
- [ ] **Buscador rápido de pacientes:** búsqueda por nombre o identificador, respetando los permisos del usuario.
- [ ] **Tarjeta de progreso:** resumen visual con evolución de peso, cintura y otros indicadores disponibles; incluir fechas y evitar interpretaciones automáticas no validadas.
- [ ] **Preguntas frecuentes:** respuestas generales revisadas y derivación a consulta cuando la pregunta requiera valoración individual.
- [ ] **Encuesta de satisfacción:** encuesta breve posterior a consulta/servicio, con resultados agregados para administración.
- [ ] **Rotación de sitio de aplicación:** registro educativo de los sitios utilizados, conforme a las instrucciones del producto y del profesional; no recomendar dosis ni sustituir la técnica enseñada.
- [ ] **Cumpleaños y controles pendientes:** recordatorios administrativos visibles solo para roles autorizados; mensajes externos discretos y con consentimiento.

### N4 — Panel “Hoy en ORIGEN” para el paciente
- [ ] Vista única con tareas del día: comidas/plan publicado, objetivo de proteína, hidratación, actividad y próximo control.
- [ ] Mostrar únicamente objetivos y planes aprobados y datos que el paciente tenga permiso para consultar.
- [ ] Registrar progreso sin penalizaciones ni mensajes que fomenten conductas alimentarias compulsivas.

### Orden recomendado de implementación
1. Documentación y diseño funcional de componentes educativos, sin tocar datos clínicos.
2. Centro educativo y método de la mano con contenido estático revisado.
3. Equivalencias locales y guía gastrointestinal.
4. Registro de hidratación y calculadora proteica, inicialmente con datos ingresados/objetivos revisados por profesional.
5. Menús personalizados y lista de compras, después de definir la fuente de datos nutricionales y el flujo de aprobación.
6. Buscador, tarjeta de progreso y mejoras administrativas, verificando roles y privacidad antes de habilitarlas.
7. Integraciones y notificaciones solo después de superar las pruebas de seguridad y consentimiento.

### Criterios de aceptación para estas propuestas
- [ ] Cada componente nuevo funciona de forma aislada y no rompe expediente, inicio de sesión ni navegación existente.
- [ ] Los datos clínicos o personales se leen únicamente desde fuentes autorizadas; no se duplican en almacenamiento local inseguro.
- [ ] El contenido educativo tiene responsable y fecha de revisión.
- [ ] Las metas nutricionales son individualizadas y revisadas; no hay diagnóstico, prescripción ni ajuste farmacológico automático.
- [ ] Se prueban estados vacíos, errores, móvil y escritorio antes de marcar cada función como completada.


---

## Revisión de estado real y brechas detectadas — 18/11/2026
Esta sección aclara la diferencia entre componentes de demostración y funciones habilitadas para cuentas individuales. No marcar como lista para pacientes una función que solo esté presente en la vista demo.

### Estado confirmado en el código revisado
- [x] Componente independiente `NutritionEducation.jsx` creado con método visual de porciones y equivalencias aproximadas.
- [x] Pestaña Centro Educativo conectada a la vista `appMode === 'patient'` (demostración).
- [x] Centro Educativo integrado también en el portal real `appMode === 'patient_portal'` como recurso estático, sin lecturas ni escrituras clínicas; pendiente build y revisión visual.
- [x] Base de autenticación por correo/contraseña, invitación de un solo uso y enlace UID → expediente implementada en Preview según el alcance del PR.
- [ ] **Pendiente:** completar pruebas de invitación, verificación de correo y aislamiento entre dos cuentas/pacientes ficticios.
- [x] Alta, listado, ficha individual, historia clínica y antropometría disponibles en el panel de pruebas del médico.
- [ ] **Pendiente:** validación de permisos por rol, reglas Firestore y pruebas automatizadas de acceso/denegación.
- [ ] **Pendiente:** ejecutar compilación y pruebas de los últimos commits educativos; la confirmación de archivos en GitHub no sustituye una compilación.
- [ ] **Pendiente:** validar despliegue Preview correspondiente al HEAD actual y probarlo en escritorio/móvil.
- [ ] **Pendiente:** el PR #1 continúa en borrador y no debe fusionarse ni desplegarse a producción hasta cumplir los criterios de salida.

### Siguiente secuencia segura
1. Confirmar build y Preview del HEAD actual, sin generar despliegues repetidos innecesarios.
2. Revisar visualmente la vista demo y corregir cualquier error de interfaz del Centro Educativo.
3. Mantener el Centro Educativo integrado en el portal individual real como contenido estático; revisar build y presentación.
4. Añadir FAQ y contenido educativo revisado, con responsable y fecha de revisión.
5. Implementar calculadora proteica como herramienta informativa separada; el objetivo debe ser introducido/revisado por el profesional, con fuente nutricional documentada.
6. Implementar tarjeta de progreso solo cuando el portal paciente disponga de endpoint seguro de lectura limitada para su propio expediente.
7. Implementar hidratación/diario solo después de definir persistencia por paciente, reglas y auditoría.
8. Antes de pacientes reales: pruebas Firebase Emulator, roles, acceso cruzado A/B, consentimiento, auditoría, respaldo/restauración y revisión de privacidad.

### Restricciones operativas vigentes
- Mantener cambios en `mejoras-seguridad-origen`; PR #1 en borrador.
- No modificar `main`, no fusionar, no desplegar a producción y no publicar reglas Firestore sin aprobación explícita.
- No usar expedientes reales en Preview.
- Evitar cambios de autenticación, reglas, esquema Firestore o migración mientras se construyen componentes educativos estáticos.

---

## Revisión de continuidad — 17/11/2026
- [x] Corregida la normalización del teléfono: se eliminan caracteres no numéricos antes de formar el E.164 boliviano (`+591`).
- [x] Añadida prueba de regresión para números locales con espacios y números internacionales con espacios/guiones.
- [x] Confirmado que la rama de Preview contiene el commit `0a7840803bcec24765fca4c51d685d9c351c9511`.
- [x] Vercel reporta el deployment de ese commit como `READY`; la compilación de Vite del deployment terminó correctamente.
- [ ] **Pendiente:** ejecutar explícitamente la suite Node/Firebase Emulator correspondiente a los commits posteriores a la última CI documentada; el estado READY de Vercel confirma el build, no la suite de pruebas.
- [ ] **Pendiente:** abrir y probar visualmente este Preview actualizado en escritorio y móvil con datos ficticios.
- [ ] **Pendiente:** completar pruebas funcionales de invitaciones, activación y aislamiento A/B.

### Notas de verificación
El deployment confirmado corresponde al commit `0a7840803bcec24765fca4c51d685d9c351c9511`, rama `mejoras-seguridad-origen`, estado Vercel `READY`. URL de Preview: `https://origen-medico-app-git-mejoras-seguridad-origen-origen-medico.vercel.app`. Este enlace identifica el Preview; si Vercel Authentication está activa, se requiere el acceso compartible vigente.