# ORIGEN Médico — Notas regulatorias y checklist de implementación

**Uso interno de producto. No constituye asesoría legal ni reemplaza la revisión de un abogado/regente farmacéutico ni la consulta formal a AGEMED/SEDES.** La aplicabilidad debe verificarse según cada producto, actividad, establecimiento y modalidad concreta antes del lanzamiento.

## 1. Vademécum vs. catálogo comercial

Decisión de diseño:
- El vademécum se renombra **Referencia de medicamentos** y queda dentro del panel profesional.
- Para la primera versión interna se mostrarán nombres genéricos/principios activos, información clínica pertinente y fuente/fecha de revisión.
- Se eliminan los nombres de cadenas de farmacias y las llamadas a compra/reserva desde esa sección.
- No usar el vademécum como catálogo público ni como flujo de venta.
- La tienda pública se denomina **Productos ORIGEN** y se limita inicialmente a productos no medicinales cuya categoría, registro y comercialización hayan sido verificados.

Motivo: cambiar el nombre de una farmacia o retirar su marca no cambia la naturaleza de la promoción, comercialización, dispensación o venta de un medicamento.

## 2. Fuentes oficiales revisadas

### Ley del Ejercicio Profesional Médico N° 3131 (Ministerio de Salud)
Fuente: https://minsalud.gob.bo/component/jdownloads/?Itemid=2411&catid=12&id=142%3Aley-no-3131&task=download.send

Puntos relevantes para el diseño:
- Art. 3: el secreto médico es inviolable salvo las excepciones previstas en la Ley.
- Arts. 4 y 12: información sobre salud, enfermedad y tratamiento queda bajo secreto médico; el profesional debe guardar el secreto aunque haya cesado la prestación.
- Art. 7: para ejercer, el médico debe estar matriculado en el Ministerio del área de Salud.
- Art. 10: identifica expediente médico, historia clínica, consentimiento informado, informes y recetas como documentos médicos oficiales bajo resguardo y custodia del establecimiento.
- Art. 13: el paciente tiene derechos a confidencialidad, secreto médico, información adecuada, intimidad y atención de calidad.

Implicaciones técnicas: separación de expedientes, roles mínimos, consentimiento, auditoría, control de descargas y minimización de información en notificaciones externas.

### AGEMED — Circular MSyD/AGEMED/CR/38/2022
Fuente: https://www.agemed.gob.bo/circulares/2022/CIRCULAR-38-2022.pdf

La circular establece que la publicidad dirigida al público general de medicamentos OTC debe incluir la leyenda “Venta libre solo en farmacias”, y recuerda que la publicidad está sujeta a mensajes educativos y a las reglas indicadas por AGEMED.

Implicación: no incluir publicidad/promociones de medicamentos en la tienda general sin una revisión regulatoria específica.

### AGEMED — Circular MSyD/AGEMED/CR/69/2022
Fuente: https://www.agemed.gob.bo/circulares/2022/CIRCULAR-69-2022.pdf

La circular se refiere a la comercialización de productos farmacéuticos y advierte sobre comercialización de medicamentos/dispositivos en el mercado informal y en establecimientos sin autorización del SEDES.

Implicación: antes de publicar o vender un producto que pudiera clasificarse como medicamento o dispositivo médico, verificar categoría, registro y habilitación del establecimiento/canal.

### AGEMED — Circular MSyD/AGEMED/CR/08/2024
Fuente: https://www.agemed.gob.bo/circulares/2024/CIRCULAR-8-2024.pdf

La circular recuerda a empresas farmacéuticas, importadoras y distribuidoras el reporte de precios de comercialización de medicamentos, dispositivos médicos, reactivos y equipos biomédicos a través de AGEMED VIRTUAL, y separa el reporte de precios de otros trámites de comercialización.

Implicación: no asumir que un precio introducido por el consultorio en la app equivale a un reporte regulatorio ni que el consultorio puede comercializar cualquier categoría de producto.

### Ministerio de Salud — Circular MS/AGEMED/CR/46/2020
Fuente de referencia oficial: https://www.minsalud.gob.bo/comunicado-oficiales-ministerial-gestion-2020?catid=8%3Ainstitucional&id=4442%3Atodas-las-comunicaciones-oficiales-del-ministerio-de-salud-relacionado-al-covid-19-gestion-2020&view=article

La circular específica sobre ivermectina durante 2020 señaló que ese medicamento, en ese contexto, era de venta con receta y que su comercialización por internet estaba prohibida. **No extrapolar automáticamente esa circular específica a todos los productos; verificar la norma aplicable a cada producto y modalidad.**

### Programa Nacional de Telesalud
Fuente: https://ts.minsalud.gob.bo/

El Ministerio describe la telemedicina como prestación de servicios de salud remotos a través de tecnologías de información y comunicación. Esto no sustituye la revisión de los requisitos aplicables al servicio privado específico de ORIGEN Médico.

## 3. Checklist antes de habilitar la tienda

- [ ] Clasificar cada producto: alimento, suplemento, cosmético, dispositivo médico, medicamento u otra categoría.
- [ ] Verificar registro/autorización aplicable (por ejemplo, Registro Sanitario/NSO cuando corresponda).
- [ ] Verificar que ORIGEN Médico y el punto de entrega tengan habilitación adecuada para esa actividad.
- [ ] Revisar las reglas de publicidad, claims de beneficios y leyendas obligatorias.
- [ ] No habilitar compra/reserva de medicamentos de prescripción en el catálogo público.
- [ ] No presentar un producto como tratamiento o cura sin autorización y respaldo aplicable.
- [ ] Definir responsable de facturación, almacenamiento, entrega, devoluciones y reclamos.
- [ ] Someter el flujo a revisión legal/regulatoria antes de abrir ventas.

## 4. Checklist para consulta virtual

- [ ] Confirmar los requisitos profesionales, de habilitación y de prestación privada aplicables a ORIGEN Médico con SEDES/asesoría legal.
- [ ] Mostrar alcance y límites de la consulta remota antes del pago.
- [ ] Registrar identidad, ubicación del paciente al momento de consulta y contacto de emergencia.
- [ ] Obtener consentimiento específico para atención a distancia y su versión.
- [ ] Hacer triage previo y derivar a presencial/urgencias cuando el caso no sea adecuado para teleconsulta.
- [ ] Proteger el enlace de videollamada y la nota clínica.
- [ ] Definir cómo se emiten y custodian recetas/documentos médicos.
- [ ] Mantener política de reprogramación, cancelación, inasistencia y devolución.

## 5. Checklist de privacidad y derechos del paciente

- [ ] Aviso claro: responsable del tratamiento, finalidad, qué datos se recogen, quién puede acceder y canales de contacto.
- [ ] Consentimiento informado para atención y tratamiento digital de información; conservar fecha y versión.
- [ ] Acceso según rol y necesidad funcional; no compartir cuenta médica.
- [ ] Registro de accesos/cambios y procedimiento ante incidente de seguridad.
- [ ] Proceso para que el paciente solicite copia, corrección o actualización de sus datos, según normativa aplicable.
- [ ] Política de conservación, respaldo y eliminación segura.
- [ ] No incluir diagnósticos, síntomas o medicamentos en notificaciones visibles externamente.
- [ ] Contratos y evaluación de proveedores de nube, mensajería, video y pagos.

## 6. Regla de producto

Mientras no esté completada la revisión regulatoria:
- **Permitido para diseño:** catálogo de artículos no medicinales verificados y reserva de productos de bienestar autorizados.
- **Referencia interna:** lista profesional de medicamentos genéricos sin tienda, publicidad ni farmacia asociada.
- **No habilitar:** venta/dispensación en línea de medicamentos ni promesas de suministro farmacéutico sin autorización comprobada.


## 7. Actualización GLP-1 — revisión AGEMED al 17/11/2026

### Registro sanitario diario
AGEMED publica el listado oficial diario de registros sanitarios aprobados y el listado de registros cancelados. La página consultada muestra actualización al **17 de noviembre de 2026**:
https://apiwww.agemed.gob.bo/api/listautcom

La inclusión de una marca en una referencia interna requiere comprobar el registro vigente y los datos de la presentación exacta; no basta una búsqueda por principio activo.

### Tirzepatida — Alerta Nacional N° 082/2026
Fuente oficial:
https://www.agemed.gob.bo/archivo_farmacovigi/alertas/2026/ALERTA_082_2026.pdf

AGEMED alerta sobre versiones de TG (tirzepatida inyectable) de contrabando, sin registro sanitario, asociadas a comercialización por redes sociales y Marketplace. La alerta indica expresamente que el producto descrito no asegura estabilidad y no tiene autorización AGEMED. En la misma alerta AGEMED señala que TG se comercializa legalmente en Bolivia por IMFAR S.R.L. con los registros:
- II-97037/2026
- II-97039/2026
- II-97040/2026
- II-97058/2026
- II-97059
- II-97062/2026

**Regla de datos:** no asociar automáticamente esos números a una dosis/presentación específica, porque la alerta consultada no ofrece ese mapeo. Verificar el número impreso y la presentación exacta contra el registro oficial.

### Lipoless MD 15 — Alerta Nacional N° 043/2026
Fuente oficial:
https://www.agemed.gob.bo/archivo_farmacovigi/alertas/2026/ALERTA_043_2026.pdf

AGEMED identifica específicamente LIPOLESS MD 15, tirzepatida 15 mg/0,6 mL, fabricante ETICOS, origen Paraguay, sin registro sanitario en Bolivia y de contrabando. Esta alerta se refiere a la presentación descrita; no extrapolar automáticamente a toda marca o presentación distinta sin revisar el registro aplicable. No mostrar LIPOLESS MD 15 como producto autorizado.

### Tirzec 15 — Alerta N° 230/2026
El listado oficial de Vigilancia y Control de AGEMED incluye la Alerta N° 230/2026 para “TIRZEC 15” como medicamento ilícito de contrabando, con fecha 24/09/2026:
https://apiwww.agemed.gob.bo/api/web/vigilanciacontrol%7Ccontenido

Hasta verificar directamente el documento y el producto físico, no mostrar Tirzec 15 como autorizado ni recomendar su uso.

### Semaglutida
No se incorpora ninguna marca/presentación como autorizada en esta actualización. La marca, titular, forma farmacéutica, presentación y vigencia deben contrastarse individualmente con el listado oficial diario y el listado de registros cancelados. Estado interno inicial: **pendiente de verificación**.

### Nota de seguridad AGEMED N° 002/2026
Fuente:
https://www.agemed.gob.bo/archivo_uso_racional/notas_seguridad/2026/002_2026.pdf

La nota recoge el riesgo de pancreatitis asociado al uso inadecuado de agonistas GLP-1 (dulaglutida, liraglutida, semaglutida y tirzepatida), indica informar sobre dolor abdominal intenso y persistente, acudir inmediatamente a urgencias ante síntomas sugerentes, suspender si se sospecha pancreatitis y realizar evaluación médica, evaluar cuidadosamente antecedentes de pancreatitis y notificar sospechas de reacciones adversas. La referencia no debe convertir estas indicaciones en un algoritmo de prescripción autónoma.

**Regla de producto:** la referencia farmacológica es de uso profesional, no es catálogo comercial, no contiene precios de farmacia ni botones para emitir recetas. Toda prescripción sigue siendo una decisión individual del médico.
