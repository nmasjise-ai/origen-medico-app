## Revisión de continuidad — 18/11/2026: autorización de sesión del paciente
- [x] Añadido helper `api/_lib/patient-session-authorization.js` para validar que el documento de mapeo pertenece al UID autenticado, tiene rol `patient` y contiene un identificador de expediente con formato permitido.
- [x] El endpoint `api/patient/session.js` ahora valida el UID almacenado y el formato de `patientId` antes de consultar el expediente.
- [x] Añadida comprobación explícita de que el expediente mantiene `linkedUid` igual al UID autenticado y `accountStatus === linked`.
- [x] Añadidas pruebas unitarias para mapeos ausentes, UID distinto, rol incorrecto, identificadores manipulados y expedientes no vinculados.
- [ ] **Pendiente:** ejecutar suite Node/Firebase Emulator y build para el HEAD actual; Vercel READY no sustituye las pruebas unitarias.
- [ ] **Pendiente:** prueba funcional A/B con dos cuentas ficticias en Preview.
- [ ] **Pendiente:** comprobar que la sesión se comporta correctamente si un mapeo Firestore está incompleto o corrupto.


### Secuencia prioritaria siguiente
1. Ejecutar y confirmar pruebas automatizadas del HEAD actual.
2. Completar pruebas de invitación/activación y aislamiento A/B en Preview con cuentas ficticias.
3. Revisar todos los endpoints del portal paciente y crear pruebas de autorización por recurso.
4. Definir persistencia, validación y permisos para lecturas clínicas del portal real.
5. Cerrar privacidad, consentimiento, auditoría, copias de seguridad y recuperación antes de producción.

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
- [x] **Método de la mano y la taza:** guía visual de porciones de proteína (palma), carbohidratos (puño), grasas (pulgar) y verduras (dos manos abiertas). Incluir ejemplos de alimentos locales. Aclarar que es una guía aproximada y que las porciones se individualizan.
- [x] **Centro educativo ORIGEN:** artículos breves, consejos e infografías revisados por profesional; categorías de alimentación, hidratación, actividad física, conservación de masa muscular y tratamiento GLP-1. Mostrar fecha/estado de revisión y evitar publicar contenido clínico no aprobado.
- [x] **Equivalencias de alimentos locales:** alternativas por grupo alimentario y porciones aproximadas con ingredientes disponibles en mercados y supermercados de Santa Cruz. Diferenciar equivalencia práctica de equivalencia nutricional calculada.
- [x] **Guía de tolerancia gastrointestinal:** información sobre náuseas, reflujo, diarrea y estreñimiento; consejos generales y señales de alarma. No clasificar alimentos como universalmente prohibidos ni sustituir evaluación clínica.
- [ ] **Semáforo/registro de hidratación:** registro diario simple y visual de líquidos. Metas individualizadas por profesional; no recomendar automáticamente electrolitos, sales de rehidratación o magnesio.
- [x] **Calculadora de proteína:** mostrar objetivo indicado/revisado por profesional y traducirlo a combinaciones de alimentos. Usar una base nutricional fiable, cantidades explícitas y advertir que el colágeno no equivale a una fuente completa de proteína para todos los objetivos.

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
- [x] Compilación del Preview verificada para el commit 0a7840803bcec24765fca4c51d685d9c351c9511; pruebas Node/Firebase Emulator posteriores a los últimos commits aún pendientes.
- [x] Deployment Preview del commit 0a7840803bcec24765fca4c51d685d9c351c9511 confirmado READY; pendiente revisión visual manual en escritorio/móvil.
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

## Revisión de seguridad y continuidad — 18/11/2026 (actualización)

- [x] GitHub Actions para HEAD `1acd1d7277113e508a269a0cf07dde9858627b18`: **69/69 pruebas aprobadas** en Firebase Emulator/Node y compilación Vite correcta.
- [x] Vercel Preview actualizado al mismo commit: deployment `dpl_AQb6Vf4Q6J1f6pAHPjCQ5hFLBxoP`, estado **READY**. No equivale a QA funcional del navegador.
- [x] Confirmadas las variables de entorno de Preview asociadas a la rama: `ORIGEN_PREVIEW_DATA_NAMESPACE`, `ORIGEN_ADMIN_UID`, `ORIGEN_ADMIN_EMAIL` y `FIREBASE_SERVICE_ACCOUNT_JSON`. Se inspeccionaron nombres/ámbitos sin revelar valores secretos.
- [x] Verificada la configuración del namespace fijo de Preview; producción no utiliza ese namespace por estas rutas.
- [ ] **Pendiente crítico:** completar flujo funcional de invitación, verificación de correo, activación y acceso de dos pacientes ficticios (A/B) en Preview.
- [ ] **Pendiente de defensa en profundidad:** definir limitación de solicitudes para `POST /api/invitations/validate`. No hay configuración personalizada de Firewall ni Edge Config en el proyecto; no implementar limitación en memoria de funciones serverless.
- [ ] **Pendiente:** revisar dependencias con `npm audit` y fijar instalación reproducible mediante lockfile; no ejecutar actualizaciones forzadas ni publicar cambios de dependencias sin revisar compatibilidad.
- [ ] **Pendiente:** validar el bootstrap del administrador en Preview con la cuenta autorizada, sin exponer UID, correo ni credenciales en el repositorio.
- [ ] **Pendiente:** ejecutar auditoría de colecciones legadas desde el Preview actualizado y revisar sus resultados sin extraer contenido clínico.
- [ ] Mantener el PR en borrador; no fusionar, no publicar reglas Firestore y no introducir pacientes reales en Preview.

**Hallazgos de revisión:** las rutas API de paciente y administrador verifican token Firebase, autorización y namespace de Preview; los endpoints que devuelven datos clínicos usan `Cache-Control: no-store`. Las reglas Firestore versionadas describen el modelo objetivo en rutas raíz; el flujo Preview actual usa API server-side y un namespace anidado, por lo que no debe asumirse que el acceso directo del SDK cliente a ese namespace está habilitado. Antes de habilitar escrituras directas del paciente (diarios/síntomas/solicitudes) se deben añadir reglas y pruebas específicas para el namespace y validar el modelo final.


## Nueva especificación — Gestión de cuentas, acceso y pagos (18/11/2026)

### Decisiones confirmadas
- [x] Mostrar en cada expediente el correo asociado a la cuenta; distinguir correo de invitación de correo verificado/vinculado.
- [x] Mostrar fecha de vinculación cuando exista y mantener la identificación por nombre, teléfono y expediente.
- [x] Separar estrictamente el estado comercial del estado de acceso: el pago pendiente/vencido no modifica ni elimina el expediente clínico.
- [x] Política de vencimiento: **5 días calendario de tolerancia** posteriores a la fecha de vencimiento del periodo pagado.
- [x] Al finalizar los 5 días calendario sin pago confirmado, el acceso del paciente pasa a suspendido por motivo de pago.
- [x] Registrar pago confirmado por personal autorizado permite recalcular el próximo vencimiento y rehabilitar el acceso, sujeto a que no exista otra causa de suspensión.

### Modelo de estados
- **Estado de pago:** al día / pendiente / vencido / en verificación.
- **Estado de acceso:** habilitado / en tolerancia / suspendido / excepción manual.
- **Estado de seguimiento o plan:** activo / finalizado / pausado. No debe inferirse automáticamente del estado de pago.
- Guardar, como mínimo: plan contratado, periodo cubierto, fecha de vencimiento, inicio y fin de tolerancia, estado de pago, estado de acceso, fecha de último pago confirmado y actor que registró el pago.
- Calcular la tolerancia con fechas calendario en la zona horaria America/La_Paz, no como 120 horas desde un instante arbitrario. La fecha límite será el quinto día calendario posterior al vencimiento; la suspensión se ejecuta al comenzar el día siguiente si continúa impago.

### Experiencia del paciente y del equipo
- Mostrar aviso de próximo vencimiento antes de vencer y aviso de pago pendiente durante los 5 días de tolerancia.
- Indicar claramente la fecha límite de tolerancia y el canal/procedimiento de regularización configurado por el consultorio.
- En suspensión, mostrar una pantalla informativa sin permitir el acceso al portal clínico del paciente; no mostrar detalles clínicos en esa pantalla.
- El panel médico conserva el acceso autorizado al expediente y permite consultar el historial de pagos y cambios de acceso.
- Permitir excepción manual temporal por médico administrador, con motivo obligatorio, fecha de expiración y registro de auditoría.
- La recepción podrá registrar/verificar pagos solo con permiso específico; no obtiene acceso a notas ni contenido clínico.

### Requisitos técnicos y de seguridad antes de activar
- La autorización de acceso se aplica en servidor/backend para cada endpoint del paciente; ocultar botones o pantallas no es suficiente.
- La suspensión debe invalidar o rechazar sesiones/tokens existentes en las rutas protegidas, no solo impedir nuevos inicios de sesión.
- La rehabilitación requiere pago marcado como confirmado por usuario autorizado; un comprobante cargado o una solicitud no equivalen a pago confirmado.
- Toda transición (vencimiento, inicio/fin de tolerancia, suspensión, excepción, pago y reactivación) debe generar auditoría con actor o proceso, fecha, motivo y valores anterior/nuevo.
- La tarea automática debe ser idempotente, tolerar reintentos y no suspender si existe pago confirmado o excepción vigente.
- No borrar, archivar ni alterar mediciones, tratamientos, recetas, notas ni historial clínico al suspender una cuenta.
- Añadir pruebas de límites de fecha (incluido fin de mes/año), zona horaria, pago durante tolerancia, pago posterior a suspensión, excepciones, sesión ya abierta y aislamiento entre pacientes.
- Implementar primero en Preview con datos ficticios. No habilitar cobros automáticos, suspensiones en producción ni migraciones de datos reales hasta superar revisión y pruebas end-to-end.

### Próxima secuencia de implementación
1. Completar y validar la visualización del correo vinculado en la lista administrativa.
2. Diseñar campos y endpoints de suscripción/pagos y control de acceso; revisar roles de médico y recepción.
3. Implementar control de acceso server-side y pruebas de sesión ya abierta.
4. Implementar cálculo de 5 días calendario y proceso idempotente de suspensión/reactivación.
5. Incorporar avisos, filtros y auditoría en el panel médico.
6. Ejecutar pruebas funcionales completas en Preview; mantener producción desactivada.


## Plan de ejecución — Administración de cuentas y seguimiento (18/11/2026)

### Fase 1 — Gestión manual de acceso (en implementación)
- [x] Definir estados independientes del vínculo: `portalAccessStatus` enabled/suspended.
- [x] Añadir helper de autorización de acceso; las cuentas antiguas sin campo se consideran habilitadas para compatibilidad.
- [x] Aplicar el bloqueo en backend en `/api/patient/session` y `/api/patient/profile`.
- [x] Crear endpoint administrativo PATCH `/api/admin/patients/{patientId}/access` con validación de motivo, doble verificación de vínculo, actualización del mapping de usuario y expediente, y audit log.
- [x] Exponer el estado de acceso en la lista administrativa.
- [x] Añadir controles UI para suspender/reactivar desde el panel médico.
- [x] Añadir pruebas unitarias de helper/validación.
- [ ] Esperar GitHub Actions y Vercel Preview READY para el HEAD final; realizar prueba funcional con dos cuentas ficticias.
- [ ] Verificar suspensión de sesión ya iniciada y respuesta de acceso suspendido sin exposición de datos clínicos.

### Fase 2 — Planes y pagos (pendiente)
- [ ] Definir catálogo inicial de planes, periodicidad y reglas de renovación.
- [ ] Crear modelo de pagos append-only con importe/moneda, periodo cubierto, fecha, método, referencia y actor que confirma.
- [ ] Separar comprobante recibido de pago confirmado.
- [ ] Crear endpoints administrativos y permisos mínimos para registro/confirmación.
- [ ] Mostrar estado de pago, vencimiento e historial en panel.

### Fase 3 — Tolerancia y suspensión automática (pendiente)
- [ ] Calcular cinco días calendario posteriores al vencimiento en `America/La_Paz`.
- [ ] Avisos de próximo vencimiento y durante tolerancia.
- [ ] Proceso idempotente que suspenda al inicio del día siguiente al quinto día si sigue impago.
- [ ] Pago confirmado durante tolerancia o tras suspensión reactiva acceso, salvo otra suspensión vigente.
- [ ] Pruebas de fin de mes/año, zona horaria, reintentos y pagos concurrentes.

### Fase 4 — Auditoría y roles (pendiente)
- [ ] Historial administrativo legible por expediente.
- [ ] Excepciones temporales con motivo y fecha de expiración.
- [ ] Permisos diferenciados médico/recepción; recepción no accede a contenido clínico.
- [ ] Auditoría de cambios de acceso, planes, pagos y excepciones.

### Fase 5 — QA integral (pendiente)
- [ ] Sesiones independientes A/B, autorización cruzada y manipulación de IDs.
- [ ] Pruebas de sesión existente tras suspensión y reactivación.
- [ ] Pruebas funcionales escritorio/móvil, revisión de privacidad y restauración.
- [ ] Mantener Preview con datos ficticios; no fusionar ni habilitar producción hasta aprobación explícita.


## ORIGEN FINANZAS — módulo administrativo independiente (diseño e implementación por fases)

**Objetivo:** administrar inventario, caja, ingresos, egresos, compras y rentabilidad desde formularios de la web app, sin editar código ni acceder a Firebase/GitHub para las operaciones diarias. El módulo no almacena ni muestra diagnósticos, síntomas, notas ni datos clínicos.

### Reglas de diseño
- Moneda base BOB (Bs) y zona horaria `America/La_Paz`.
- Acceso solo para administrador y roles administrativos expresamente autorizados; el rol se valida en servidor.
- Persistencia separada del expediente: `previewEnvironments/mejoras-seguridad-origen/financeProducts` y colecciones financieras propias.
- En Preview solo datos ficticios. No migrar inventario, pacientes ni movimientos reales.
- No borrar productos con movimientos: desactivar/archivar y conservar auditoría.
- La edición de ficha no cambia existencias. El stock se modifica únicamente mediante movimientos trazables (compra/entrada, venta/salida, consumo interno, devolución o ajuste autorizado).
- No permitir stock negativo por defecto; ajustes requieren motivo y registro de actor/fecha.
- Compras y ventas deberán generar sus movimientos de inventario y financieros en una operación atómica para evitar doble conteo.
- Separar cobrado, pendiente por cobrar, ingresos, egresos y resultado operativo.
- Cada alta, edición, ajuste, venta, compra y cierre de caja genera auditoría.

### Fases
1. **Catálogo e inventario:** formulario para alta/edición/desactivación, categoría, costo, precio, unidad, proveedor, stock mínimo y campos opcionales de lote/vencimiento. Stock inicial registrado como apertura; cambios posteriores solo por movimientos.
2. **Movimientos y compras:** entradas/salidas, proveedores, comprobantes, lote/vencimiento, consumo interno y ajustes autorizados.
3. **Caja e ingresos/egresos:** consultas, curaciones, sueroterapia, fisioterapia/kinesiología, venta de productos, programas y otros; gastos por categoría; efectivo/transferencia/QR/otros.
4. **Ventas y servicios:** registro desde interfaz, descuento automático de stock, recibos internos y estados de pago.
5. **Costos y rentabilidad:** costo real, margen por producto/servicio, cuentas por cobrar y resultado operativo.
6. **Dashboard y reportes:** cierre diario, resumen semanal/mensual, bajo stock, vencimientos y exportación.

### Estado de implementación — 18/11/2026
- [x] Alcance y reglas de separación clínica/financiera documentados.
- [x] Endpoint inicial de catálogo en Preview: listar, crear, editar y desactivar productos con autenticación de administrador y auditoría.
- [x] Validación de datos: categorías permitidas, importes no negativos, cantidades enteras y edición general sin modificar existencias.
- [ ] Interfaz visual conectada al endpoint.
- [ ] Pruebas de integración con Firebase Emulator y aislamiento del namespace financiero.
- [ ] Movimientos de inventario y compras.
- [ ] Caja, ingresos, egresos, ventas, reportes y cierres.
- [ ] Roles administrativos diferenciados y permisos de mínimo privilegio.
- [ ] Validación manual en Preview antes de cualquier uso real.

## Seguimiento de desarrollo — 19/11/2026

- [x] Preview `dpl_Ds3C6oitDCUUvV2foUHfeNchHk94` en estado **READY**, commit `ddbc06b92e53bcab9d36d579bc9329230acf60a5`.
- [x] GitHub Actions #244 completado en **success**: control de funciones, reglas Firestore en emulador y build frontend aprobados.
- [x] Carga diferida de Portal Paciente, ORIGEN Finanzas y material educativo para reducir el bundle inicial.
- [x] Separación visual entre «Expedientes clínicos (Pruebas)» en nube y «Expediente local (respaldo)»; no se migraron ni borraron datos.
- [ ] QA funcional de invitación, verificación, vinculación, acceso/suspensión y aislamiento A/B en Preview con cuentas ficticias.
- [ ] Completar expediente clínico de Preview: línea de tiempo de tratamiento, notas clínicas con auditoría e informes PDF; primero diseñar contrato API y pruebas sin exceder 12 funciones Hobby.
- [ ] Recuperar seguimiento diario solo después de consolidar rutas y probar contratos/autorización; no agregar una 13.ª función.
- [ ] Conectar interfaz ORIGEN Finanzas al endpoint de catálogo y probar aislamiento financiero con datos ficticios.

**Regla de continuidad:** los cambios recientes de interfaz no escriben ni migran datos. El expediente local sigue conservado como respaldo y los expedientes de nube continúan en el namespace Preview. No usar pacientes reales ni habilitar producción hasta completar QA.


## QA de acceso durante sesión abierta — 19/11/2026

- [x] Añadida prueba automatizada del portal del paciente: la misma identidad autenticada obtiene el perfil antes de la suspensión y recibe HTTP 403 en su siguiente solicitud protegida después de que el estado de acceso cambia a `suspended`.
- [x] La prueba verifica que la segunda solicitud no vuelve a leer mediciones ni devuelve datos del paciente.
- [ ] **Pendiente de QA manual:** repetir el flujo en el Preview con dos cuentas ficticias, manteniendo una sesión del paciente abierta mientras el administrador suspende el acceso.
- [ ] **Pendiente:** comprobar visualmente la pantalla de acceso suspendido y su comportamiento en móvil/escritorio.

Esta prueba demuestra la revalidación server-side del endpoint de perfil en cada solicitud; no equivale a invalidar el token de Firebase ni sustituye la validación end-to-end en navegador.


- [x] Extendida la regresión de sesión abierta al endpoint `/api/patient/session`: el mismo usuario autenticado pasa de respuesta vinculada a HTTP 403 después de la suspensión; no se registra un segundo acceso ni se devuelve información del paciente.


## Mantenimiento de GitHub Actions — 19/11/2026

- [x] Actualizadas las acciones del workflow a versiones oficiales vigentes, fijadas por SHA: checkout v7.0.1, setup-node v7.1.0 y setup-java v6.3.0.
- [x] Se conserva Node.js 22 para instalar dependencias y compilar la aplicación, y Java Temurin 21 para Firebase Emulator.
- [ ] Validar el workflow completo tras la actualización. No marcar como verificado hasta que el nuevo run termine correctamente.

## ORIGEN NUTRI — Tracker Diario (19/11/2026)

- [x] Ampliadas las reglas Firestore para admitir comidas realizadas y minutos de actividad, manteniendo compatibilidad con los campos previos.
- [x] Añadidas pruebas de emulador para validación de campos, rangos, aislamiento entre pacientes y namespace Preview.
- [x] Creada la interfaz inicial del Tracker Diario en el portal del paciente.
- [x] Conectada la interfaz a lectura/escritura de Firestore en el namespace Preview con ID diario por fecha de Bolivia y bloqueo de sobrescritura desde el cliente.
- [ ] **Pendiente CI:** confirmar que pasan las pruebas de reglas y el build del último commit.
- [ ] **Pendiente:** prueba manual con dos cuentas ficticias vinculadas en Preview.
- [ ] **Pendiente:** validar el guardado real tras desplegar las reglas en un entorno controlado; no desplegar reglas a producción en esta fase.
- [ ] **Pendiente:** metas profesionales, planes aprobados y panel de revisión.

**Límite actual:** las metas aún no se muestran ni se calculan automáticamente. El registro es descriptivo y el paciente solo puede enviar un registro diario. No se usa almacenamiento local para datos nutricionales.

## ORIGEN NUTRI — Inicio de implementación (19/11/2026)

- [x] Definido alcance V1 y contrato de seguridad en `docs/ORIGEN_NUTRI_V1.md`.
- [x] Confirmado que el modelo versionado contempla `dailyLogs` y `nutritionPlans`; el portal del paciente aún muestra el seguimiento diario como “en preparación”.
- [x] Revisadas las reglas actuales: existen reglas para `dailyLogs` en raíz y namespace Preview, con creación propia y sin edición/borrado por paciente; requieren pruebas específicas ampliadas para el esquema V1 antes de conectar la interfaz.
- [ ] **Etapa 1:** ampliar pruebas de reglas Preview para campos de hidratación, proteína, comidas, actividad, duplicados y aislamiento A/B.
- [ ] **Etapa 2:** implementar Tracker Diario persistente; las metas solo se mostrarán cuando estén asignadas por profesional.
- [ ] **Etapa 3:** implementar metas profesionales y planes de 7 días con borrador/revisión/aprobación/publicación.
- [ ] **Etapa 4:** lista de compras derivada del plan publicado.
- [ ] **Etapa 5:** evolución, informes PDF y modo GLP-1 educativo.
- [ ] No añadir una función API número 13 (límite Hobby 12/12); no usar almacenamiento local para datos clínicos; no habilitar producción.

**Nota técnica:** las reglas actuales permiten una estructura acotada de diario con `dateKey`, `proteinGrams`, `waterMl`, `electrolytesTaken` y `createdAt`. La interfaz nueva necesita campos adicionales y pruebas antes de usarlos. No se cambió Firestore, sus reglas ni datos en esta primera entrega documental.
