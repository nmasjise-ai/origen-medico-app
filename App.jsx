import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, Award, Bell, BookOpen, Calendar,
  Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Clock,
  Copy, Download, Droplets, Edit3, ExternalLink, FileText, Flame,
  HeartPulse, HelpCircle, Info, Lock, MapPin, MessageCircle, Plus,
  Printer, QrCode, RefreshCw, Save, Scale, Search, Settings, ShieldAlert,
  ShieldCheck, ShoppingBag, Sparkles, Stethoscope, Syringe, Trash2,
  TrendingDown, TrendingUp, Upload, User, UserPlus, Users, Utensils, X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// ============================================================================
// CONFIGURACIÓN DE PERSISTENCIA EN LA NUBE (FIREBASE FIRESTORE + AUTH)
// ============================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'origen-medico-glp1-bo';

// ============================================================================
// EMBLEMA OFICIAL: ORIGEN MÉDICO (ÁRBOL DE LA VIDA DORADO)
// ============================================================================
const OrigenMedicoLogo = ({ size = 44, showText = true }) => (
  <div className="flex items-center gap-3 select-none">
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFBD69" />
          <stop offset="50%" stopColor="#9A742C" />
          <stop offset="100%" stopColor="#735318" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" stroke="url(#goldGrad)" strokeWidth="2.5" fill="#FAF6EE" />
      <circle cx="50" cy="50" r="41" stroke="url(#goldGrad)" strokeWidth="0.8" strokeDasharray="3 3" />
      {/* Tronco y raíces */}
      <path d="M50 82C50 68 48 56 48 45M50 82C50 68 52 56 52 45M48 76C42 80 36 82 32 82M52 76C58 80 64 82 68 82M49 80C46 84 44 86 42 87M51 80C54 84 56 86 58 87" stroke="url(#goldGrad)" strokeWidth="2.4" strokeLinecap="round" />
      {/* Ramas principales */}
      <path d="M50 50C40 44 32 36 28 28M50 50C60 44 68 36 72 28M50 45C44 34 40 24 41 18M50 45C56 34 60 24 59 18M50 42V15" stroke="url(#goldGrad)" strokeWidth="2.2" strokeLinecap="round" />
      {/* Hojas / Frutos dorados */}
      <circle cx="50" cy="14" r="3" fill="url(#goldGrad)" />
      <circle cx="40" cy="18" r="2.6" fill="url(#goldGrad)" />
      <circle cx="60" cy="18" r="2.6" fill="url(#goldGrad)" />
      <circle cx="28" cy="27" r="2.8" fill="url(#goldGrad)" />
      <circle cx="72" cy="27" r="2.8" fill="url(#goldGrad)" />
      <circle cx="22" cy="39" r="2.4" fill="url(#goldGrad)" />
      <circle cx="78" cy="39" r="2.4" fill="url(#goldGrad)" />
      <circle cx="34" cy="21" r="2" fill="#C59B43" />
      <circle cx="66" cy="21" r="2" fill="#C59B43" />
      <circle cx="45" cy="27" r="2" fill="#C59B43" />
      <circle cx="55" cy="27" r="2" fill="#C59B43" />
    </svg>
    {showText && (
      <div className="leading-tight">
        <div className="font-serif tracking-[0.18em] text-sm sm:text-base font-bold text-[#735318]">
          ORIGEN MÉDICO
        </div>
        <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#9A742C] font-medium">
          Nutrición Clínica & Terapia GLP-1
        </div>
      </div>
    )}
  </div>
);

// ============================================================================
// DATOS BASE: VADEMÉCUM COMERCIAL BOLIVIA (31 MEDICAMENTOS - FARMACORP/CHÁVEZ)
// ============================================================================
const BOLIVIA_VADEMECUM = [
  // 1. GASES / METEORISMO / SIMETICONA (6 MARCAS)
  { id: 'v1', category: 'Gases y Distensión', brand: 'Aero-OM 125 mg', generic: 'Simeticona', lab: 'OM Pharma', presentation: 'Caja x 30 cápsulas blandas', priceBs: '68 Bs.', dose: '1 cápsula después de almuerzo y cena', pearl: 'Ideal en pacientes con Tirzepatida que presentan eructos sulfurados o distensión postprandial.', symptomKey: 'nausea' },
  { id: 'v2', category: 'Gases y Distensión', brand: 'Factor AG 200', generic: 'Simeticona 200 mg', lab: 'Casasco', presentation: 'Caja x 20 cápsulas blandas', priceBs: '75 Bs.', dose: '1 cápsula antes o después de comidas principales', pearl: 'Alta concentración; excelente cuando el vaciamiento gástrico lento genera meteorismo nocturno.', symptomKey: 'nausea' },
  { id: 'v3', category: 'Gases y Distensión', brand: 'Gaseovet 80 mg', generic: 'Simeticona', lab: 'Medifarma', presentation: 'Caja x 30 tabletas masticables', priceBs: '42 Bs.', dose: '1 a 2 tabletas masticadas tras comer', pearl: 'Opción económica disponible en todas las sucursales de Farmacorp y Chávez en Santa Cruz.', symptomKey: 'nausea' },
  { id: 'v4', category: 'Gases y Distensión', brand: 'Flatoril', generic: 'Cleboprida + Simeticona', lab: 'Almirall', presentation: 'Caja x 30 cápsulas', priceBs: '115 Bs.', dose: '1 cápsula 15 min antes de almuerzo y cena', pearl: 'Combina antiflatulento con procinético suave para acelerar el vaciamiento gástrico lento.', symptomKey: 'nausea' },
  { id: 'v5', category: 'Gases y Distensión', brand: 'Meteospasmyl', generic: 'Alverina + Simeticona', lab: 'Mayoly Spindler', presentation: 'Caja x 20 cápsulas', priceBs: '138 Bs.', dose: '1 cápsula 2 veces al día antes de alimentos', pearl: 'De elección si hay cólicos abdominales asociados a gases por GLP-1.', symptomKey: 'nausea' },
  { id: 'v6', category: 'Gases y Distensión', brand: 'Eudon', generic: 'Bromazepam + Cleboprida + Simeticona', lab: 'Bago Bolivia', presentation: 'Caja x 20 comprimidos', priceBs: '92 Bs.', dose: '1 comprimido antes de almuerzo (uso corto)', pearl: 'Útil cuando la ansiedad por náuseas empeora la dispepsia funcional.', symptomKey: 'nausea' },

  // 2. ESTREÑIMIENTO POR ENLENTECIMIENTO INTESTINAL (5 MARCAS)
  { id: 'v7', category: 'Estreñimiento GLP-1', brand: 'Contumax (Polietilenglicol 3350)', generic: 'Macrogol 3350', lab: 'Asofarma', presentation: 'Caja x 15 sobres de 17 g', priceBs: '145 Bs.', dose: '1 sobre disuelto en 250 ml de agua al día', pearl: 'Primera línea mundial en GLP-1: no irrita la mucosa ni genera dependencia ni cólicos.', symptomKey: 'constipation' },
  { id: 'v8', category: 'Estreñimiento GLP-1', brand: 'Duphalac', generic: 'Lactulosa 66.7%', lab: 'Abbott', presentation: 'Frasco x 200 ml', priceBs: '88 Bs.', dose: '15 a 30 ml en ayunas con abundante agua', pearl: 'Osmótico seguro; advertir al paciente que puede causar leves gases los primeros 2 días.', symptomKey: 'constipation' },
  { id: 'v9', category: 'Estreñimiento GLP-1', brand: 'Metamucil', generic: 'Psyllium Plantago', lab: 'P&G Health', presentation: 'Bote x 174 g (Naranja)', priceBs: '112 Bs.', dose: '1 cucharada en 250 ml de agua (tomar rápido)', pearl: 'Solo indicar si el paciente cumple >2 L de agua/día; sin agua suficiente puede empeorar el bloqueo.', symptomKey: 'constipation' },
  { id: 'v10', category: 'Estreñimiento GLP-1', brand: 'Ciruelax Jalea / Comprimidos', generic: 'Senósidos A y B + Ciruela', lab: 'Garden House', presentation: 'Frasco x 150 g / 30 comp', priceBs: '65 Bs.', dose: '1 cucharadita o 1 comprimido antes de dormir (SOS)', pearl: 'Rescate puntual si lleva >72 horas sin evacuar; no usar de forma crónica diaria.', symptomKey: 'constipation' },
  { id: 'v11', category: 'Estreñimiento GLP-1', brand: 'Leche de Magnesia Phillips', generic: 'Hidróxido de Magnesio', lab: 'Aspen', presentation: 'Frasco x 120 ml', priceBs: '34 Bs.', dose: '15 a 30 ml antes de acostarse con un vaso de agua', pearl: 'Económico, aporta magnesio y alivia simultáneamente acidez leve nocturna.', symptomKey: 'constipation' },

  // 3. NÁUSEAS Y VÓMITOS (6 MARCAS)
  { id: 'v12', category: 'Náuseas y Vaciamiento', brand: 'Zofran / Ondansetrón 8 mg', generic: 'Ondansetrón', lab: 'Novartis / Genérico', presentation: 'Caja x 10 comprimidos', priceBs: '95 Bs.', dose: '4 a 8 mg cada 8-12 h según náusea (máx 3 días)', pearl: 'Antiemético de rescate más efectivo tras escalada de dosis; vigilar que puede estreñir un poco.', symptomKey: 'nausea' },
  { id: 'v13', category: 'Náuseas y Vaciamiento', brand: 'Plasil 10 mg', generic: 'Metoclopramida', lab: 'Sanofi', presentation: 'Caja x 20 comprimidos', priceBs: '38 Bs.', dose: '1 comprimido 20 min antes de comer (máx 5 días)', pearl: 'Procinético clásico y accesible; evitar uso continuo mayor a 5 días.', symptomKey: 'nausea' },
  { id: 'v14', category: 'Náuseas y Vaciamiento', brand: 'Moperidona / Domperidona 10 mg', generic: 'Domperidona', lab: 'Saval / Bago', presentation: 'Caja x 30 comprimidos', priceBs: '74 Bs.', dose: '1 comprimido 15 min antes de las 3 comidas', pearl: 'Excelente tolerancia sin somnolencia; mejora la saciedad precoz dolorosa.', symptomKey: 'nausea' },
  { id: 'v15', category: 'Náuseas y Vaciamiento', brand: 'Dramamine 50 mg', generic: 'Dimenhidrinato', lab: 'Johnson & Johnson', presentation: 'Caja x 24 tabletas', priceBs: '46 Bs.', dose: '1 tableta cada 8 horas si hay mareo o náusea leve', pearl: 'Venta libre en Bolivia; puede producir leve sueño, útil en náuseas vespertinas.', symptomKey: 'nausea' },
  { id: 'v16', category: 'Náuseas y Vaciamiento', brand: 'Bonadoxina', generic: 'Meclizina + Piridoxina (Vit B6)', lab: 'Pfizer', presentation: 'Caja x 25 tabletas', priceBs: '62 Bs.', dose: '1 tableta cada 12 horas', pearl: 'La vitamina B6 potencia el control de náuseas matutinas del día posterior a la inyección.', symptomKey: 'nausea' },
  { id: 'v17', category: 'Náuseas y Vaciamiento', brand: 'Cinitaprida 1 mg (Rogastril)', generic: 'Cinitaprida', lab: 'Roemmers', presentation: 'Caja x 30 comprimidos', priceBs: '128 Bs.', dose: '1 comprimido 15 min antes de cada comida', pearl: 'Procinético de alta gama que mejora tanto el vaciamiento gástrico como el tránsito colónico.', symptomKey: 'nausea' },

  // 4. REFLUJO GASTROESOFÁGICO Y ACIDEZ (5 MARCAS)
  { id: 'v18', category: 'Reflujo y Acidez', brand: 'Nexium 40 mg', generic: 'Esomeprazol', lab: 'AstraZeneca', presentation: 'Caja x 14 comprimidos', priceBs: '165 Bs.', dose: '1 comprimido en ayunas 30 min antes del desayuno', pearl: 'Control potente de acidez por retención gástrica; usar ciclos de 2 a 4 semanas.', symptomKey: 'reflux' },
  { id: 'v19', category: 'Reflujo y Acidez', brand: 'Pantoprazol 40 mg (Zoltum)', generic: 'Pantoprazol', lab: 'Bago Bolivia', presentation: 'Caja x 14 comprimidos', priceBs: '98 Bs.', dose: '1 comprimido en ayunas', pearl: 'Menor interacción hepática; excelente relación calidad-precio en Farmacorp y Chávez.', symptomKey: 'reflux' },
  { id: 'v20', category: 'Reflujo y Acidez', brand: 'Omeprazol 20 mg (Losec / Gen)', generic: 'Omeprazol', lab: 'AstraZeneca / Inti', presentation: 'Caja x 28 cápsulas', priceBs: '35 Bs.', dose: '1 cápsula en ayunas', pearl: 'Alternativa económica de primera línea en Bolivia.', symptomKey: 'reflux' },
  { id: 'v21', category: 'Reflujo y Acidez', brand: 'Gaviscon Doble Acción', generic: 'Alginato de Sodio + Bicarbonato', lab: 'Reckitt', presentation: 'Caja x 12 sobres líquidos', priceBs: '89 Bs.', dose: '1 sobre después de cenar y antes de acostarse', pearl: 'Crea una balsa física que evita el reflujo nocturno al acostarse sin inhibir la digestión.', symptomKey: 'reflux' },
  { id: 'v22', category: 'Reflujo y Acidez', brand: 'Riopan Gel 800 mg', generic: 'Magaldrato + Simeticona', lab: 'Takeda', presentation: 'Caja x 20 sobres / Frasco', priceBs: '104 Bs.', dose: '1 sobre 1 hora después de las comidas o SOS', pearl: 'Alivia acidez y gases al mismo tiempo con sabor agradable.', symptomKey: 'reflux' },

  // 5. HIDRATACIÓN, ELECTROLITOS Y FATIGA (5 MARCAS)
  { id: 'v23', category: 'Hidratación y Fatiga', brand: 'Pedialyte Active 60 mEq', generic: 'Sales de Rehidratación + Zinc', lab: 'Abbott', presentation: 'Botella x 500 ml (Manzana/Uva)', priceBs: '24 Bs.', dose: '500 ml fraccionados en el día de inyección y +1 día', pearl: 'Elimina la cefalea y fatiga por natriuresis inducida por GLP-1 en el calor de Santa Cruz.', symptomKey: 'fatigue' },
  { id: 'v24', category: 'Hidratación y Fatiga', brand: 'Electrolit 625 ml', generic: 'Sodio, Potasio, Magnesio, Calcio', lab: 'Pisa', presentation: 'Botella x 625 ml (Coco/Fresa)', priceBs: '22 Bs.', dose: '1 botella diaria si hay baja ingesta o calor intenso', pearl: 'Muy bien tolerado frío; ayuda a prevenir calambres nocturnos.', symptomKey: 'fatigue' },
  { id: 'v25', category: 'Hidratación y Fatiga', brand: 'Suero Oral Inti (Sobres)', generic: 'Sales de Rehidratación OMS', lab: 'Droguería Inti', presentation: 'Sobre individual para 1 L', priceBs: '4.50 Bs.', dose: '1 sobre disuelto en 1 litro de agua fría', pearl: 'Solución ultra económica boliviana; añadir gotas de limón para mejorar palatabilidad.', symptomKey: 'fatigue' },
  { id: 'v26', category: 'Hidratación y Fatiga', brand: 'Magnesio Quelado / Citrato', generic: 'Citrato de Magnesio 400 mg', lab: 'Now / Natural Systems', presentation: 'Frasco x 60 cápsulas', priceBs: '135 Bs.', dose: '1 cápsula por la noche', pearl: 'Doble beneficio: mejora la energía muscular, el sueño y favorece el tránsito intestinal.', symptomKey: 'fatigue' },
  { id: 'v27', category: 'Hidratación y Fatiga', brand: 'Neurobión DC / Complejo B', generic: 'Vitaminas B1, B6, B12', lab: 'P&G Health', presentation: 'Caja x 30 tabletas', priceBs: '96 Bs.', dose: '1 tableta con el desayuno', pearl: 'Previene déficit de B12 por menor ingesta de carnes rojas durante la terapia.', symptomKey: 'fatigue' },

  // 6. PROTECCIÓN BILIAR Y HEPÁTICA (4 MARCAS)
  { id: 'v28', category: 'Protección Biliar', brand: 'Ursofalk 250 mg', generic: 'Ácido Ursodesoxicólico', lab: 'Dr. Falk Pharma', presentation: 'Caja x 50 cápsulas', priceBs: '295 Bs.', dose: '250 mg cada 12 horas con alimentos', pearl: 'Fundamental en pacientes con pérdida rápida de peso (>1.5 kg/sem) para prevenir barro/cálculos biliares.', symptomKey: 'reflux' },
  { id: 'v29', category: 'Protección Biliar', brand: 'Ursacol 300 mg', generic: 'Ácido Ursodesoxicólico', lab: 'Zambon', presentation: 'Caja x 20 comprimidos', priceBs: '158 Bs.', dose: '1 comprimido en desayuno y cena', pearl: 'Alternativa de 300 mg ideal para pacientes con antecedente de esteatosis hepática.', symptomKey: 'reflux' },
  { id: 'v30', category: 'Protección Biliar', brand: 'Legalon 140 mg', generic: 'Silimarina', lab: 'Madaus', presentation: 'Caja x 30 cápsulas', priceBs: '118 Bs.', dose: '1 cápsula cada 12 horas', pearl: 'Coadyuvante hepatoprotector en hígado graso metabólico (MASLD).', symptomKey: 'fatigue' },
  { id: 'v31', category: 'Protección Biliar', brand: 'Enzymax / Kreon 10.000', generic: 'Pancreatina (Lipasa, Amilasa, Proteasa)', lab: 'Abbott', presentation: 'Frasco x 20 cápsulas', priceBs: '142 Bs.', dose: '1 cápsula con la comida más rica en proteínas/grasas', pearl: 'Facilita la digestión proteica cuando el paciente siente pesadez con carnes o huevos.', symptomKey: 'nausea' }
];

// ============================================================================
// PLAN NUTRICIONAL BOLIVIANO DE 7 DÍAS (GRAMAJES EXACTOS + MEDIDAS CASERAS)
// ============================================================================
const BOLIVIAN_MEAL_PLANS = {
  fat_loss: {
    id: 'fat_loss',
    name: 'Pérdida de Grasa & Protección Muscular',
    badge: 'Estándar Clínico GLP-1',
    description: 'Prioriza proteína magra en cada toma (30-35g) con carbohidratos complejos bolivianos controlados para evitar flacidez y sarcopenia.',
    days: [
      {
        day: 1, title: 'Día 1 · Arranque Metabólico', totalProtein: 112, totalKcal: 1320,
        meals: [
          { type: 'Desayuno', name: 'Revuelto proteico con quesillo cruceño', items: '3 huevos enteros (180g) + 40g quesillo fresco desgrasado + 1 rebanada pan integral (35g) + 100g papaya picada.', protein: 30, tip: 'Come primero el huevo y el quesillo antes que el pan.' },
          { type: 'Almuerzo', name: 'Pechuga a la plancha con arroz y vainitas', items: '150g pechuga de pollo (peso cocido, ~1 palma y media) + 80g arroz blanco cocido (½ taza) + 120g vainitas y zanahoria al vapor + 1 cdta aceite de oliva.', protein: 46, tip: 'Mastica despacio; detente apenas sientas saciedad cómoda.' },
          { type: 'Merienda', name: 'Yogur griego con chía', items: '170g yogur griego natural sin azúcar + 10g semillas de chía hidratadas.', protein: 16, tip: 'Aporta fibra soluble para evitar estreñimiento.' },
          { type: 'Cena', name: 'Filete de surubí o trucha al horno', items: '120g filete de pescado + 100g papa imilla cocida + ensalada de tomate y pepino.', protein: 26, tip: 'Cena ligero al menos 2.5 horas antes de dormir.' }
        ]
      },
      {
        day: 2, title: 'Día 2 · Control Glucémico', totalProtein: 115, totalKcal: 1340,
        meals: [
          { type: 'Desayuno', name: 'Omelette de claras y yema con palta', items: '2 huevos enteros + 2 claras (190g total) + 40g palta hass + café o mate de coca/manzanilla sin azúcar.', protein: 24, tip: 'La palta aporta grasas saludables sin irritar el estómago.' },
          { type: 'Almuerzo', name: 'Albóndigas magras caseras con lentejas', items: '140g carne molida magra (pulpa) + 90g lentejas cocidas (½ taza) + ensalada de repollo morado y tomate.', protein: 45, tip: 'Las lentejas aportan hierro y fibra prebiótica.' },
          { type: 'Merienda', name: 'Batido de proteína Whey o Quesillo', items: '1 scoop Whey Protein (30g) en 250 ml de agua fría (o 100g quesillo fresco + ½ manzana).', protein: 24, tip: 'Ideal en días de poco apetito post-inyección.' },
          { type: 'Cena', name: 'Pollo desmenuzado con puré de zapallo', items: '110g pechuga desmenuzada + 130g puré de zapallo amarillo + 1 cdta aceite de oliva.', protein: 32, tip: 'Textura suave de altísima digestibilidad nocturna.' }
        ]
      },
      {
        day: 3, title: 'Día 3 · Energía Sostenida', totalProtein: 110, totalKcal: 1310,
        meals: [
          { type: 'Desayuno', name: 'Yogur griego proteico con avena', items: '180g yogur griego + 25g avena en hojuelas + 1 huevo duro (60g) aparte.', protein: 25, tip: 'Avena hidratada evita pesadez gástrica.' },
          { type: 'Almuerzo', name: 'Guiso suave de pollo con camote', items: '150g muslo de pollo sin piel ni grasa + 100g camote al horno + 120g brócoli cocido.', protein: 42, tip: 'El camote tiene índice glucémico más bajo que la papa.' },
          { type: 'Merienda', name: 'Rollitos de jamón de pavo y quesillo', items: '60g jamón de pechuga de pavo + 40g quesillo fresco.', protein: 20, tip: 'Snack salado rápido y fácil de llevar.' },
          { type: 'Cena', name: 'Tortilla española ligera de calabacín', items: '2 huevos enteros + 1 clara + 100g zapallito verde rallado + 80g papa cocida en cubos.', protein: 23, tip: 'Evita frituras; usa sartén antiadherente.' }
        ]
      },
      {
        day: 4, title: 'Día 4 · Tránsito Intestinal Óptimo', totalProtein: 114, totalKcal: 1350,
        meals: [
          { type: 'Desayuno', name: 'Huevos pochados y papaya digestiva', items: '3 huevos pochados o tibios + 150g papaya madura + 1 tostada integral.', protein: 22, tip: 'La papaína de la papaya facilita la digestión proteica.' },
          { type: 'Almuerzo', name: 'Bife de cuadril magro con quinua', items: '140g bife magro a la plancha + 85g quinua real cocida + ensalada de pepino y rábano.', protein: 46, tip: 'La quinua boliviana aporta aminoácidos esenciales completos.' },
          { type: 'Merienda', name: 'Yogur griego con semillas de linaza', items: '170g yogur griego natural + 10g linaza molida.', protein: 16, tip: 'Toma 1 vaso de agua inmediatamente después.' },
          { type: 'Cena', name: 'Sopa crema de verduras con pollo', items: '110g pechuga en cubos + caldo casero desgrasado de zapallo, zanahoria y apio (300 ml).', protein: 30, tip: 'Hidrata y nutre sin distender el estómago.' }
        ]
      },
      {
        day: 5, title: 'Día 5 · Cierre Laboral Ligero', totalProtein: 112, totalKcal: 1300,
        meals: [
          { type: 'Desayuno', name: 'Tostada con quesillo y huevo revuelto', items: '2 huevos + 50g quesillo fresco + 1 rebanada pan integral + tomate en rodajas.', protein: 25, tip: 'Desayuno saciante hasta el mediodía.' },
          { type: 'Almuerzo', name: 'Pechuga al limón con arroz integral', items: '150g pechuga de pollo + 80g arroz integral cocido + 120g vainitas salteadas.', protein: 46, tip: 'El limón mejora la absorción de hierro.' },
          { type: 'Merienda', name: 'Batido proteico + 5 almendras', items: '1 scoop Whey Protein en agua + 5 almendras (7g).', protein: 25, tip: 'Control estricto de grasas saludables.' },
          { type: 'Cena', name: 'Atún al agua con palta y papa', items: '1 lata de atún al agua escurrida (120g) + 35g palta + 80g papa cocida.', protein: 28, tip: 'Siempre elige atún en agua, nunca en aceite.' }
        ]
      },
      {
        day: 6, title: 'Día 6 · Fin de Semana Saludable', totalProtein: 116, totalKcal: 1380,
        meals: [
          { type: 'Desayuno', name: 'Panqueques de avena y clara de huevo', items: '3 claras + 1 huevo entero + 30g avena licuada + 50g frutillas.', protein: 23, tip: 'Endulza solo con stevia o canela.' },
          { type: 'Almuerzo', name: 'Churrasco magro al estilo cruceño fit', items: '150g lomo o cuadril sin grasa visible + 90g yuca cocida (no frita) + ensalada fresca.', protein: 46, tip: 'Evita chorizos y achuras por su alto contenido graso.' },
          { type: 'Merienda', name: 'Yogur griego natural', items: '170g yogur griego sin azúcar.', protein: 16, tip: 'Mantén intervalos de 3-4 horas entre comidas.' },
          { type: 'Cena', name: 'Pechuga a la plancha con zapallo', items: '110g pechuga + 120g zapallo al horno con orégano.', protein: 31, tip: 'Ideal si al día siguiente toca aplicación de GLP-1.' }
        ]
      },
      {
        day: 7, title: 'Día 7 · Día de Aplicación GLP-1', totalProtein: 108, totalKcal: 1260,
        meals: [
          { type: 'Desayuno', name: 'Desayuno suave pre-inyección', items: '2 huevos tibios + 40g quesillo fresco + 1 tostada blanca o integral.', protein: 22, tip: 'Evita grasas pesadas el día que aplicas tu dosis.' },
          { type: 'Almuerzo', name: 'Pollo al vapor con arroz blanco y zanahoria', items: '140g pechuga hervida o al vapor + 80g arroz blanco + 100g zanahoria cocida.', protein: 43, tip: 'Comida de muy fácil vaciamiento gástrico.' },
          { type: 'Merienda', name: 'Gelatina sin azúcar + Yogur griego', items: '150g yogur griego + 1 porción gelatina dietética.', protein: 15, tip: 'Refrescante y suave para el estómago.' },
          { type: 'Cena', name: 'Consomé proteico de pollo', items: '100g pechuga desmenuzada en 250 ml de caldo claro con 80g papa cocida.', protein: 28, tip: 'Acompaña con 500 ml de electrolitos durante el día.' }
        ]
      }
    ]
  },
  digestive_soft: {
    id: 'digestive_soft',
    name: 'Tolerancia Digestiva Suave (Anti-Náuseas)',
    badge: 'Ideal Escalada de Dosis',
    description: 'Porciones fraccionadas, baja carga de grasa y fibra insoluble, texturas blandas y cocciones al vapor/hervidas para días sensibles.',
    days: [
      {
        day: 1, title: 'Día 1 · Vaciamiento Rápido', totalProtein: 102, totalKcal: 1200,
        meals: [
          { type: 'Desayuno', name: 'Claras revueltas y tostada suave', items: '4 claras + 1 huevo entero + 1 tostada de pan blanco + infusión de manzanilla.', protein: 22, tip: 'Evita café en ayunas si sientes acidez.' },
          { type: 'Almuerzo', name: 'Pechuga desmenuzada y puré de papa', items: '140g pechuga hervida + 100g puré de papa natural (sin mantequilla) + 80g zapallo cocido.', protein: 42, tip: 'Come la mitad y espera 20 minutos si hay plenitud.' },
          { type: 'Merienda', name: 'Batido de Whey aislado en agua', items: '1 scoop proteína aislada (25g) en 250 ml agua fría.', protein: 25, tip: 'Tómalo a sorbos pequeños durante 20 minutos.' },
          { type: 'Cena', name: 'Pescado blanco al vapor con arroz', items: '100g filete de pescado + 70g arroz blanco bien cocido.', protein: 23, tip: 'Cero condimentos picantes o frituras.' }
        ]
      },
      {
        day: 2, title: 'Día 2 · Protección Gástrica', totalProtein: 104, totalKcal: 1220,
        meals: [
          { type: 'Desayuno', name: 'Yogur griego natural + papaya', items: '170g yogur griego + 100g papaya sin semillas.', protein: 16, tip: 'Frío se tolera mucho mejor que caliente.' },
          { type: 'Almuerzo', name: 'Sopa crema de pollo y zanahoria', items: '140g pechuga licuada o picada fina + caldo de zanahoria y papa (300 ml).', protein: 42, tip: 'Alimento líquido-blando que no retiene el estómago.' },
          { type: 'Merienda', name: 'Quesillo fresco con galletas de agua', items: '80g quesillo fresco + 3 galletas de agua o soda.', protein: 16, tip: 'Las galletas secas absorben el exceso de ácido gástrico.' },
          { type: 'Cena', name: 'Tortilla de claras y zapallito pelado', items: '4 claras + 1 huevo + 80g zapallito sin cáscara.', protein: 22, tip: 'Pelar los vegetales reduce la fermentación.' }
        ]
      },
      {
        day: 3, title: 'Día 3 · Hidratación & Proteína', totalProtein: 105, totalKcal: 1230,
        meals: [
          { type: 'Desayuno', name: 'Huevos tibios y pan tostado', items: '2 huevos tibios + 40g quesillo + 1 rebanada pan molde.', protein: 22, tip: 'Mastica cada bocado 20 veces.' },
          { type: 'Almuerzo', name: 'Pollo al horno suave con camote', items: '140g pechuga + 100g puré de camote + 80g vainitas cocidas.', protein: 42, tip: 'No tomes líquidos grandes junto con el almuerzo; espera 30 min.' },
          { type: 'Merienda', name: 'Batido proteico + manzana cocida', items: '1 scoop Whey en agua + ½ manzana al vapor.', protein: 24, tip: 'La pectina de la manzana cocida calma la mucosa.' },
          { type: 'Cena', name: 'Consomé de pollo con fideo cabello de ángel', items: '100g pollo desmenuzado + 40g fideo fino en caldo claro.', protein: 28, tip: 'Reconfortante y ligero.' }
        ]
      },
      {
        day: 4, title: 'Día 4 · Transición Suave', totalProtein: 106, totalKcal: 1240,
        meals: [
          { type: 'Desayuno', name: 'Revuelto suave de huevo y quesillo', items: '2 huevos + 2 claras + 40g quesillo fresco.', protein: 26, tip: 'Cocina a fuego bajo.' },
          { type: 'Almuerzo', name: 'Filete de trucha con arroz blanco', items: '140g trucha a la plancha sin piel + 80g arroz + 80g zanahoria.', protein: 38, tip: 'Omega-3 antiinflamatorio.' },
          { type: 'Merienda', name: 'Yogur griego + 2 galletas soda', items: '170g yogur griego natural.', protein: 16, tip: 'Merienda fría anti-náusea.' },
          { type: 'Cena', name: 'Pechuga picada con puré de zapallo', items: '100g pechuga + 120g zapallo cocido.', protein: 28, tip: 'Evita acostarte inmediatamente tras cenar.' }
        ]
      },
      {
        day: 5, title: 'Día 5 · Estabilidad Digestiva', totalProtein: 105, totalKcal: 1230,
        meals: [
          { type: 'Desayuno', name: 'Avena cocida en agua con proteína', items: '25g avena cocida + ½ scoop Whey mezclado tibio + 1 huevo duro.', protein: 21, tip: 'Textura cremosa muy amigable.' },
          { type: 'Almuerzo', name: 'Albóndigas de pollo al vapor con papa', items: '140g carne molida de pechuga + 100g papa cocida + 80g zapallito.', protein: 42, tip: 'Más magro que la carne roja.' },
          { type: 'Merienda', name: 'Quesillo y papaya', items: '70g quesillo fresco + 100g papaya.', protein: 15, tip: 'Combinación enzimática suave.' },
          { type: 'Cena', name: 'Atún al agua con arroz blanco', items: '110g atún al agua + 70g arroz blanco.', protein: 27, tip: 'Sin mayonesa ni aderezos grasos.' }
        ]
      },
      {
        day: 6, title: 'Día 6 · Recuperación Muscular', totalProtein: 108, totalKcal: 1250,
        meals: [
          { type: 'Desayuno', name: 'Omelette de claras y jamón de pavo', items: '3 claras + 1 huevo + 40g jamón de pavo + 1 tostada.', protein: 26, tip: 'Alto valor biológico.' },
          { type: 'Almuerzo', name: 'Pechuga a la plancha con quinua lavada', items: '140g pechuga + 80g quinua bien cocida + 80g zanahoria.', protein: 44, tip: 'Lava bien la quinua antes de hervir.' },
          { type: 'Merienda', name: 'Yogur griego natural', items: '170g yogur griego.', protein: 16, tip: 'Aporta probióticos.' },
          { type: 'Cena', name: 'Sopa de verduras con huevo pochado', items: '2 huevos pochados en 300 ml de caldo de zapallo y papa.', protein: 22, tip: 'Cena clásica boliviana ligera.' }
        ]
      },
      {
        day: 7, title: 'Día 7 · Preparación Dosis Semanal', totalProtein: 104, totalKcal: 1210,
        meals: [
          { type: 'Desayuno', name: 'Claras revueltas y papaya', items: '4 claras + 1 huevo + 120g papaya.', protein: 21, tip: 'Prepara el sistema digestivo para la dosis.' },
          { type: 'Almuerzo', name: 'Pollo hervido con arroz y zapallo', items: '140g pechuga + 80g arroz + 100g zapallo.', protein: 42, tip: 'Cero grasas saturadas.' },
          { type: 'Merienda', name: 'Batido Whey en agua fría', items: '1 scoop Whey en 250 ml agua.', protein: 24, tip: 'Hidratación con aminoácidos.' },
          { type: 'Cena', name: 'Caldo claro de pollo desmenuzado', items: '90g pechuga + 250 ml caldo + 70g papa.', protein: 26, tip: 'Aplica tu inyección tras una cena ligera.' }
        ]
      }
    ]
  },
  maintenance: {
    id: 'maintenance',
    name: 'Mantenimiento & Recomposición Corporal',
    badge: 'Fase de Consolidación',
    description: 'Incremento controlado de carbohidratos complejos y grasas saludables para sostener masa muscular y evitar efecto rebote.',
    days: [
      {
        day: 1, title: 'Día 1 · Tonificación', totalProtein: 120, totalKcal: 1550,
        meals: [
          { type: 'Desayuno', name: 'Huevos completos con palta y pan integral', items: '3 huevos + 50g palta + 2 rebanadas pan integral + 100g papaya.', protein: 26, tip: 'Ideal para días de entrenamiento de fuerza.' },
          { type: 'Almuerzo', name: 'Pechuga grillada con arroz y lentejas', items: '160g pechuga + 100g arroz + 60g lentejas + ensalada mixta con oliva.', protein: 52, tip: 'Combinación completa de proteína y energía.' },
          { type: 'Merienda', name: 'Yogur griego con avena y chía', items: '180g yogur griego + 25g avena + 10g chía.', protein: 18, tip: 'Sostiene la saciedad vespertina.' },
          { type: 'Cena', name: 'Filete de surubí con camote asado', items: '130g surubí + 120g camote + ensalada verde.', protein: 28, tip: 'Recuperación nocturna óptima.' }
        ]
      },
      {
        day: 2, title: 'Día 2 · Fuerza Metabólica', totalProtein: 122, totalKcal: 1580,
        meals: [
          { type: 'Desayuno', name: 'Omelette con quesillo y avena', items: '3 huevos + 50g quesillo + 30g avena en hojuelas.', protein: 30, tip: 'Excelente arranque anabólico.' },
          { type: 'Almuerzo', name: 'Carne magra salteada con quinua', items: '160g lomo magro + 100g quinua cocida + 130g brócoli y vainitas.', protein: 50, tip: 'Aporte óptimo de creatina natural y hierro.' },
          { type: 'Merienda', name: 'Batido Whey + plátano pequeño', items: '1 scoop Whey + ½ plátano (50g).', protein: 25, tip: 'Ideal post-entrenamiento.' },
          { type: 'Cena', name: 'Pechuga desmenuzada con papa y palta', items: '120g pechuga + 100g papa + 40g palta.', protein: 32, tip: 'Cena equilibrada sin pesadez.' }
        ]
      },
      {
        day: 3, title: 'Día 3 · Balance Hormonal', totalProtein: 118, totalKcal: 1540,
        meals: [
          { type: 'Desayuno', name: 'Tostadas integrales con huevos y quesillo', items: '2 huevos + 60g quesillo + 2 tostadas integrales.', protein: 26, tip: 'Calcio y proteína para salud ósea.' },
          { type: 'Almuerzo', name: 'Muslo de pollo sin piel con arroz integral', items: '160g pollo + 100g arroz integral + 120g ensalada fresca.', protein: 46, tip: 'Fibra insoluble para salud intestinal.' },
          { type: 'Merienda', name: 'Yogur griego + nueces', items: '170g yogur griego + 10g nueces.', protein: 17, tip: 'Grasas esenciales.' },
          { type: 'Cena', name: 'Tortilla de 3 huevos con zapallo', items: '3 huevos + 120g zapallo cocido + 80g papa.', protein: 25, tip: 'Fácil de preparar.' }
        ]
      },
      {
        day: 4, title: 'Día 4 · Densidad Nutricional', totalProtein: 120, totalKcal: 1560,
        meals: [
          { type: 'Desayuno', name: 'Panqueques proteicos de avena', items: '2 huevos + 2 claras + 35g avena + 100g papaya.', protein: 24, tip: 'Energía limpia.' },
          { type: 'Almuerzo', name: 'Bife magro con yuca cocida y ensalada', items: '160g cuadril magro + 100g yuca cocida + ensalada tomate/pepino.', protein: 48, tip: 'Plato tradicional adaptado.' },
          { type: 'Merienda', name: 'Rollitos de pavo y quesillo', items: '60g pavo + 50g quesillo + 1 manzana.', protein: 22, tip: 'Fresco y saciante.' },
          { type: 'Cena', name: 'Atún con palta y tostada', items: '120g atún al agua + 40g palta + 1 rebanada pan integral.', protein: 28, tip: 'Rápido y nutritivo.' }
        ]
      },
      {
        day: 5, title: 'Día 5 · Sostenibilidad', totalProtein: 119, totalKcal: 1550,
        meals: [
          { type: 'Desayuno', name: 'Huevos revueltos con tomate y pan', items: '3 huevos + tomate + 2 tostadas integrales.', protein: 23, tip: 'Licopeno antioxidante.' },
          { type: 'Almuerzo', name: 'Pechuga al limón con quinua y vainitas', items: '160g pechuga + 100g quinua + 120g vainitas.', protein: 50, tip: 'Clásico de Origen Médico.' },
          { type: 'Merienda', name: 'Yogur griego con chía', items: '170g yogur griego + 10g chía.', protein: 16, tip: 'Hidratación intestinal.' },
          { type: 'Cena', name: 'Sopa crema de zapallo con pollo', items: '120g pechuga + 300 ml crema de zapallo y papa.', protein: 30, tip: 'Descanso digestivo.' }
        ]
      },
      {
        day: 6, title: 'Día 6 · Flexibilidad Inteligente', totalProtein: 122, totalKcal: 1600,
        meals: [
          { type: 'Desayuno', name: 'Desayuno completo de sábado', items: '3 huevos + 50g quesillo + 100g papaya + 1 tostada.', protein: 28, tip: 'Prioriza proteína antes de actividades.' },
          { type: 'Almuerzo', name: 'Parrillada magra controlada', items: '170g lomo o pechuga a la parrilla + 100g yuca cocida + ensalada.', protein: 50, tip: 'Disfruta la vida social con porciones medidas.' },
          { type: 'Merienda', name: 'Batido Whey en agua o leche descremada', items: '1 scoop Whey + 200 ml leche descremada.', protein: 30, tip: 'Refuerzo proteico.' },
          { type: 'Cena', name: 'Ensalada tibia de pollo y palta', items: '100g pechuga + 40g palta + hojas verdes y tomate.', protein: 26, tip: 'Ligera para compensar el almuerzo.' }
        ]
      },
      {
        day: 7, title: 'Día 7 · Balance Semanal', totalProtein: 118, totalKcal: 1520,
        meals: [
          { type: 'Desayuno', name: 'Yogur griego con avena y huevo duro', items: '180g yogur griego + 25g avena + 2 huevos duros.', protein: 28, tip: 'Preparación rápida.' },
          { type: 'Almuerzo', name: 'Trucha al horno con papa y brócoli', items: '150g trucha + 110g papa + 120g brócoli.', protein: 42, tip: 'Rico en omega-3.' },
          { type: 'Merienda', name: 'Quesillo fresco con fruta', items: '80g quesillo + 100g papaya.', protein: 16, tip: 'Snack natural.' },
          { type: 'Cena', name: 'Pechuga a la plancha con zapallo', items: '120g pechuga + 120g zapallo.', protein: 32, tip: 'Listo para una nueva semana.' }
        ]
      }
    ]
  }
};

const WEEKLY_GROCERY_LIST = [
  { category: 'Proteínas (Prioridad #1)', items: ['Pechuga de pollo limpia: 1.5 kg', 'Huevos frescos: 1 maple (30 unidades)', 'Yogur griego natural sin azúcar: 1.2 kg (7 potes)', 'Quesillo fresco bajo en sal: 400 g', 'Carne molida magra / cuadril: 600 g', 'Filete de surubí, trucha o atún al agua: 500 g'] },
  { category: 'Carbohidratos Inteligentes', items: ['Arroz blanco o integral: 500 g', 'Papa imilla y/o camote: 1 kg', 'Quinua real lavada y lentejas: 400 g', 'Avena en hojuelas y pan integral: 1 paquete c/u'] },
  { category: 'Verduras, Frutas y Grasas', items: ['Papaya madura (digestiva): 1 unidad mediana', 'Zapallo amarillo y zapallito verde: 1 kg', 'Vainitas, zanahoria y brócoli: 1 kg surtido', 'Tomate, pepino y hojas verdes: al gusto', 'Paltas hass medianas: 2 unidades', 'Semillas de chía / linaza: 100 g'] }
];

// ============================================================================
// DATOS INICIALES POR DEFECTO (SE GUARDAN Y SINCRONIZAN EN LA NUBE)
// ============================================================================
const DEFAULT_CLINIC_STATE = {
  clinicConfig: {
    doctorName: 'Dr. José Rodolfo Melgar Lizarazu',
    license: 'Mat. Prof. M-12631846 · Medicina Interna & Nutrición Clínica GLP-1',
    clinicName: 'ORIGEN MÉDICO',
    city: 'Santa Cruz de la Sierra, Bolivia',
    address: 'Equipetrol Norte, Calle 8 Este · Consultorio Origen Médico',
    whatsappNumber: '59170000000',
    singleConsultPriceBs: '350 Bs.',
    quarterlyProgramPriceBs: '1.450 Bs.',
    bankInfo: 'Banco Nacional de Bolivia (BNB) · Cta. Cte. 150-0000000 · Origen Médico SRL · NIT 000000000',
    qrImageDataUrl: '' // Si está vacío, renderiza un QR visual elegante de Bolivia; el médico puede subir su imagen real en 1 clic
  },
  patients: [
    {
      id: 'pat-sofia',
      name: 'Sofía Mendoza',
      age: 38,
      phone: '59176543210',
      medication: 'Tirzepatida',
      currentDose: '5.0 mg',
      injectionDay: 'Domingos',
      daysUntilInjection: 2,
      lastInjectionSite: 'Abdomen Inf. Der.',
      proteinGoal: 110,
      waterGoal: 2500,
      activePlan: 'fat_loss',
      doctorNote: 'Excelente evolución este mes, Sofía. Mantén al menos 110g de proteína diaria y toma 1 botella de electrolitos el domingo y lunes tras tu aplicación de 5.0 mg para evitar fatiga.',
      dailyLog: {
        proteinConsumed: 78,
        waterConsumed: 1750,
        electrolytesTaken: true,
        symptoms: { nausea: 1, reflux: 0, constipation: 2, fatigue: 1 }
      },
      bodyMetrics: [
        { date: '15 Sep', weight: 88.4, muscle: 26.8, fatPct: 41.2, waist: 98 },
        { date: '15 Oct', weight: 84.1, muscle: 26.4, fatPct: 38.6, waist: 93 },
        { date: '10 Nov', weight: 80.5, muscle: 26.1, fatPct: 36.1, waist: 89 }
      ],
      titrationHistory: [
        { month: 'Mes 1 (Sep)', dose: '2.5 mg', status: 'completed', note: 'Adaptación inicial sin efectos adversos' },
        { month: 'Mes 2 (Oct)', dose: '5.0 mg', status: 'completed', note: 'Excelente control de apetito' },
        { month: 'Mes 3 (Nov)', dose: '5.0 mg', status: 'current', note: 'Mantenemos 5.0 mg por óptima pérdida de grasa' },
        { month: 'Mes 4 (Dic)', dose: '7.5 mg', status: 'planned', note: 'Evaluar según bioimpedancia' }
      ],
      prescriptions: [
        { id: 'rx-1', date: '10 Nov 2026', generic: 'Macrogol 3350', brand: 'Contumax 17 g (Farmacorp/Chávez)', dose: '1 sobre disuelto en 250 ml de agua por las mañanas durante 15 días.', status: 'active' },
        { id: 'rx-2', date: '02 Nov 2026', generic: 'Simeticona 125 mg', brand: 'Aero-OM 125 mg', dose: '1 cápsula después del almuerzo si hay distensión abdominal.', status: 'active' }
      ]
    },
    {
      id: 'pat-carlos',
      name: 'Carlos Andrés Gutiérrez',
      age: 45,
      phone: '59171234567',
      medication: 'Semaglutida',
      currentDose: '1.0 mg',
      injectionDay: 'Viernes',
      daysUntilInjection: 1,
      lastInjectionSite: 'Muslo Sup. Izq.',
      proteinGoal: 135,
      waterGoal: 3000,
      activePlan: 'digestive_soft',
      doctorNote: 'Carlos, hemos activado el plan digestivo suave por las náuseas tras subir a 1.0 mg. Usa Ondansetrón solo si la náusea supera 3/5 y prioriza batidos proteicos fríos.',
      dailyLog: {
        proteinConsumed: 54,
        waterConsumed: 1250,
        electrolytesTaken: false,
        symptoms: { nausea: 4, reflux: 3, constipation: 1, fatigue: 3 }
      },
      bodyMetrics: [
        { date: '10 Sep', weight: 104.0, muscle: 35.2, fatPct: 35.8, waist: 112 },
        { date: '10 Oct', weight: 99.2, muscle: 34.1, fatPct: 33.9, waist: 107 },
        { date: '10 Nov', weight: 94.8, muscle: 32.3, fatPct: 32.4, waist: 102 }
      ],
      titrationHistory: [
        { month: 'Mes 1', dose: '0.25 mg', status: 'completed', note: 'Buena tolerancia' },
        { month: 'Mes 2', dose: '0.50 mg', status: 'completed', note: 'Descenso constante' },
        { month: 'Mes 3', dose: '1.0 mg', status: 'current', note: 'Náuseas moderadas tras escalada' }
      ],
      prescriptions: [
        { id: 'rx-3', date: '11 Nov 2026', generic: 'Ondansetrón 8 mg', brand: 'Zofran / Ondansetrón 8 mg', dose: '1 comprimido cada 12 horas por 48 horas si persisten náuseas.', status: 'active' }
      ]
    },
    {
      id: 'pat-valeria',
      name: 'Valeria Saucedo',
      age: 34,
      phone: '59178901234',
      medication: 'Tirzepatida',
      currentDose: '7.5 mg',
      injectionDay: 'Miércoles',
      daysUntilInjection: 5,
      lastInjectionSite: 'Brazo Post. Der.',
      proteinGoal: 105,
      waterGoal: 2500,
      activePlan: 'maintenance',
      doctorNote: 'En fase de mantenimiento. Excelente preservación muscular con entrenamiento de fuerza 3 veces por semana.',
      dailyLog: {
        proteinConsumed: 102,
        waterConsumed: 2500,
        electrolytesTaken: true,
        symptoms: { nausea: 0, reflux: 0, constipation: 0, fatigue: 0 }
      },
      bodyMetrics: [
        { date: '12 Ago', weight: 76.0, muscle: 24.5, fatPct: 37.0, waist: 86 },
        { date: '12 Oct', weight: 67.5, muscle: 24.2, fatPct: 29.8, waist: 76 },
        { date: '10 Nov', weight: 65.8, muscle: 24.3, fatPct: 28.1, waist: 74 }
      ],
      titrationHistory: [
        { month: 'Mes 1', dose: '2.5 mg', status: 'completed', note: 'Inicio' },
        { month: 'Mes 2', dose: '5.0 mg', status: 'completed', note: 'Sin síntomas' },
        { month: 'Mes 3', dose: '7.5 mg', status: 'current', note: 'Meta alcanzada' }
      ],
      prescriptions: []
    }
  ],
  webLeads: [
    {
      id: 'lead-1',
      name: 'Mariana Roca',
      phone: '59175544332',
      plan: 'Programa Trimestral GLP-1 (1.450 Bs.)',
      preferredDate: '2026-11-16',
      currentMed: 'Iniciando Tirzepatida 2.5 mg',
      paymentProofNote: 'Comprobante QR Simple BNB adjunto',
      status: 'pending',
      createdAt: 'Hoy, 14:20'
    }
  ],
  rxRequests: [
    {
      id: 'req-1',
      patientId: 'pat-sofia',
      patientName: 'Sofía Mendoza',
      symptom: 'Estreñimiento leve (2/5)',
      suggestedMed: 'Contumax (Macrogol 3350)',
      date: 'Hoy, 11:05',
      status: 'pending'
    }
  ]
};

// ============================================================================
// COMPONENTE PRINCIPAL DE LA APLICACIÓN
// ============================================================================
export default function App() {
  // Estado de autenticación y sincronización en la nube
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'synced' | 'local'
  const [toastMessage, setToastMessage] = useState(null);

  // Estado maestro de todo el consultorio
  const [clinicData, setClinicData] = useState(() => {
    try {
      const saved = localStorage.getItem('origen_medico_clinic_v1');
      return saved ? JSON.parse(saved) : DEFAULT_CLINIC_STATE;
    } catch {
      return DEFAULT_CLINIC_STATE;
    }
  });

  // Navegación de modos principales
  const [appMode, setAppMode] = useState('patient'); // 'public' | 'patient' | 'doctor'
  const [activePatientId, setActivePatientId] = useState('pat-sofia');
  const [patientTab, setPatientTab] = useState('today'); // 'today' | 'meals' | 'symptoms' | 'progress' | 'rx'
  const [doctorTab, setDoctorTab] = useState('triage'); // 'triage' | 'patient_detail' | 'vademecum' | 'settings'
  const [selectedDoctorPatientId, setSelectedDoctorPatientId] = useState('pat-sofia');

  // Estados UI auxiliares
  const [selectedPlanKey, setSelectedPlanKey] = useState('fat_loss');
  const [selectedMealDay, setSelectedMealDay] = useState(1);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [showQrPaymentModal, setShowQrPaymentModal] = useState(false);
  const [selectedPublicPlan, setSelectedPublicPlan] = useState('Programa Trimestral GLP-1 (1.450 Bs.)');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [printableRx, setPrintableRx] = useState(null);
  const [vademecumSearch, setVademecumSearch] = useState('');
  const [vademecumCategory, setVademecumCategory] = useState('Todas');
  const [targetRxPatientId, setTargetRxPatientId] = useState('pat-sofia');

  // Simulador público de metas
  const [simWeight, setSimWeight] = useState(82);
  const [simActivity, setSimActivity] = useState('moderate');

  // Formulario lead público
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    preferredDate: '2026-11-18',
    currentMed: 'Tirzepatida (Mounjaro / Zepbound)',
    paymentMethod: 'QR Simple Bolivia (Comprobante)',
    receiptFileName: '',
    consentAccepted: false
  });

  // Formulario nuevo paciente (Médico)
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: 36,
    phone: '5917',
    weight: 85,
    muscle: 27.5,
    fatPct: 38.0,
    waist: 95,
    medication: 'Tirzepatida',
    currentDose: '2.5 mg',
    injectionDay: 'Domingos',
    activePlan: 'fat_loss'
  });

  // Formulario nueva bioimpedancia
  const [newMetricForm, setNewMetricForm] = useState({
    weight: '',
    muscle: '',
    fatPct: '',
    waist: ''
  });

  const isRemoteUpdate = useRef(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  // 1. Autenticación Firebase (con fallback automático y silencioso)
  useEffect(() => {
    if (!auth) {
      setSyncStatus('local');
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Fallback local activo:', err);
        setSyncStatus('local');
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setSyncStatus('local');
    });
    return () => unsub();
  }, []);

  // 2. Suscripción en tiempo real a Firestore (cuando está disponible)
  useEffect(() => {
    if (!db || !user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'clinic_state', 'main');
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists() && snap.data()?.payload) {
          isRemoteUpdate.current = true;
          const parsed = JSON.parse(snap.data().payload);
          setClinicData(parsed);
          localStorage.setItem('origen_medico_clinic_v1', snap.data().payload);
        } else {
          // Inicializar nube con estado base
          setDoc(docRef, { payload: JSON.stringify(clinicData), updatedAt: new Date().toISOString() }).catch(() => {});
        }
        setSyncStatus('synced');
      },
      () => {
        setSyncStatus('local');
      }
    );
    return () => unsub();
  }, [user]);

  // Helper centralizado para guardar cambios en la nube y localmente sin que el médico programe nada
  const persistState = (updater) => {
    setClinicData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const serialized = JSON.stringify(next);
      try {
        localStorage.setItem('origen_medico_clinic_v1', serialized);
      } catch (e) {
        console.warn('LocalStorage lleno', e);
      }
      if (db && user) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'clinic_state', 'main');
        setDoc(docRef, { payload: serialized, updatedAt: new Date().toISOString() }).catch(() => {});
      }
      return next;
    });
  };

  // Paciente activo actual
  const currentPatient = useMemo(() => {
    return clinicData.patients.find((p) => p.id === activePatientId) || clinicData.patients[0];
  }, [clinicData.patients, activePatientId]);

  const doctorSelectedPatient = useMemo(() => {
    return clinicData.patients.find((p) => p.id === selectedDoctorPatientId) || clinicData.patients[0];
  }, [clinicData.patients, selectedDoctorPatientId]);

  // Cálculo del Índice Clínico de Preservación Muscular
  const getMusclePreservationStats = (patient) => {
    const metrics = patient.bodyMetrics || [];
    if (metrics.length < 2) {
      return { weightLoss: 0, muscleLoss: 0, leanLossRatio: 0, isRisk: false, label: 'Medición Basal' };
    }
    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    const weightLoss = +(first.weight - last.weight).toFixed(1);
    const muscleLoss = +(first.muscle - last.muscle).toFixed(1);
    if (weightLoss <= 0) {
      return { weightLoss: 0, muscleLoss: 0, leanLossRatio: 0, isRisk: false, label: 'Estable' };
    }
    const leanLossRatio = Math.max(0, Math.round((muscleLoss / weightLoss) * 100));
    const isRisk = leanLossRatio > 25;
    return {
      weightLoss,
      muscleLoss,
      leanLossRatio,
      isRisk,
      label: isRisk ? 'Alerta Sarcopenia (>25%)' : 'Preservación Óptima'
    };
  };

  // Semáforo de Triage Clínico por Paciente
  const getPatientTriage = (patient) => {
    const proteinPct = Math.round((patient.dailyLog.proteinConsumed / patient.proteinGoal) * 100);
    const maxSymptom = Math.max(...Object.values(patient.dailyLog.symptoms));
    const muscleStats = getMusclePreservationStats(patient);

    if (maxSymptom >= 4 || proteinPct < 50 || muscleStats.isRisk) {
      const reasons = [];
      if (maxSymptom >= 4) reasons.push(`Síntoma severo (${maxSymptom}/5)`);
      if (proteinPct < 50) reasons.push(`Proteína baja (${proteinPct}%)`);
      if (muscleStats.isRisk) reasons.push(`Pérdida magra ${muscleStats.leanLossRatio}%`);
      return { level: 'red', label: 'Alerta Clínica', reasons };
    }
    if (maxSymptom >= 2 || proteinPct < 75) {
      const reasons = [];
      if (maxSymptom >= 2) reasons.push(`Síntoma moderado (${maxSymptom}/5)`);
      if (proteinPct < 75) reasons.push(`Proteína en progreso (${proteinPct}%)`);
      return { level: 'amber', label: 'Seguimiento', reasons };
    }
    return { level: 'green', label: 'Óptimo', reasons: ['Metas y tolerancia en rango'] };
  };

  // Acciones rápidas del Paciente
  const addProtein = (grams) => {
    persistState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === currentPatient.id
          ? {
              ...p,
              dailyLog: {
                ...p.dailyLog,
                proteinConsumed: Math.min(250, p.dailyLog.proteinConsumed + grams)
              }
            }
          : p
      )
    }));
    showToast(`+${grams}g de proteína registrados en Mi Día GLP-1`);
  };

  const addWater = (ml) => {
    persistState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === currentPatient.id
          ? {
              ...p,
              dailyLog: {
                ...p.dailyLog,
                waterConsumed: Math.min(5000, p.dailyLog.waterConsumed + ml)
              }
            }
          : p
      )
    }));
    showToast(`+${ml} ml de hidratación sumados`);
  };

  const toggleElectrolytes = () => {
    persistState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === currentPatient.id
          ? {
              ...p,
              dailyLog: {
                ...p.dailyLog,
                electrolytesTaken: !p.dailyLog.electrolytesTaken
              }
            }
          : p
      )
    }));
  };

  const updateSymptom = (key, val) => {
    persistState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === currentPatient.id
          ? {
              ...p,
              dailyLog: {
                ...p.dailyLog,
                symptoms: { ...p.dailyLog.symptoms, [key]: val }
              }
            }
          : p
      )
    }));
  };

  const updateInjectionSite = (site) => {
    persistState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === currentPatient.id ? { ...p, lastInjectionSite: site, daysUntilInjection: 7 } : p
      )
    }));
    showToast(`Aplicación registrada en: ${site}`);
  };

  const handleAddBodyMetric = (e, targetId) => {
    e.preventDefault();
    if (!newMetricForm.weight || !newMetricForm.muscle) return;
    const todayStr = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
    const entry = {
      date: todayStr,
      weight: parseFloat(newMetricForm.weight),
      muscle: parseFloat(newMetricForm.muscle),
      fatPct: parseFloat(newMetricForm.fatPct || 32),
      waist: parseFloat(newMetricForm.waist || 88)
    };
    persistState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === targetId ? { ...p, bodyMetrics: [...p.bodyMetrics, entry] } : p
      )
    }));
    setNewMetricForm({ weight: '', muscle: '', fatPct: '', waist: '' });
    showToast('Control de bioimpedancia guardado');
  };

  // Solicitar receta desde la App Paciente
  const handleRequestRx = (med) => {
    const newReq = {
      id: `req-${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      symptom: `Consulta Vademécum (${med.category})`,
      suggestedMed: `${med.brand} (${med.generic})`,
      date: 'Ahora mismo',
      status: 'pending'
    };
    persistState((prev) => ({
      ...prev,
      rxRequests: [newReq, ...prev.rxRequests]
    }));
    showToast(`Solicitud de receta de ${med.brand} enviada al Dr. Melgar`);
  };

  // Prescribir medicamento desde el Panel del Médico
  const handleDoctorPrescribe = (patientId, med) => {
    const todayStr = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
    const newRx = {
      id: `rx-${Date.now()}`,
      date: todayStr,
      generic: med.generic,
      brand: `${med.brand} (Farmacorp/Chávez)`,
      dose: med.dose,
      status: 'active'
    };
    persistState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id === patientId ? { ...p, prescriptions: [newRx, ...p.prescriptions] } : p
      )
    }));
    const pat = clinicData.patients.find((p) => p.id === patientId);
    showToast(`Receta de ${med.brand} emitida para ${pat?.name}`);
  };

  // Crear nuevo paciente real en 30 segundos (Médico)
  const handleCreatePatient = (e) => {
    e.preventDefault();
    if (!newPatientForm.name.trim()) return;
    const weight = parseFloat(newPatientForm.weight) || 80;
    const calculatedProtein = Math.round(weight * 1.4);
    const calculatedWater = Math.round(weight * 32);
    const newPat = {
      id: `pat-${Date.now()}`,
      name: newPatientForm.name.trim(),
      age: parseInt(newPatientForm.age, 10) || 35,
      phone: newPatientForm.phone.replace(/\D/g, '') || '59170000000',
      medication: newPatientForm.medication,
      currentDose: newPatientForm.currentDose,
      injectionDay: newPatientForm.injectionDay,
      daysUntilInjection: 7,
      lastInjectionSite: 'Abdomen Inf. Der.',
      proteinGoal: calculatedProtein,
      waterGoal: calculatedWater,
      activePlan: newPatientForm.activePlan,
      doctorNote: `Bienvenido/a a Origen Médico. Tu meta diaria es ${calculatedProtein}g de proteína y ${(calculatedWater / 1000).toFixed(1)}L de agua para proteger tu masa muscular durante el tratamiento con ${newPatientForm.medication}.`,
      dailyLog: {
        proteinConsumed: 0,
        waterConsumed: 0,
        electrolytesTaken: false,
        symptoms: { nausea: 0, reflux: 0, constipation: 0, fatigue: 0 }
      },
      bodyMetrics: [
        {
          date: new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }),
          weight,
          muscle: parseFloat(newPatientForm.muscle) || +(weight * 0.33).toFixed(1),
          fatPct: parseFloat(newPatientForm.fatPct) || 36.0,
          waist: parseFloat(newPatientForm.waist) || 92
        }
      ],
      titrationHistory: [
        { month: 'Mes 1 (Actual)', dose: newPatientForm.currentDose, status: 'current', note: 'Inicio de protocolo Origen Médico' }
      ],
      prescriptions: []
    };

    persistState((prev) => ({
      ...prev,
      patients: [newPat, ...prev.patients]
    }));
    setSelectedDoctorPatientId(newPat.id);
    setActivePatientId(newPat.id);
    setShowNewPatientModal(false);
    setNewPatientForm({
      name: '', age: 36, phone: '5917', weight: 85, muscle: 27.5, fatPct: 38.0, waist: 95,
      medication: 'Tirzepatida', currentDose: '2.5 mg', injectionDay: 'Domingos', activePlan: 'fat_loss'
    });
    showToast(`Expediente creado para ${newPat.name}`);
  };

  // Envío de lead público + apertura opcional de WhatsApp
  const handlePublicLeadSubmit = (e) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.phone.trim() || !leadForm.consentAccepted) return;

    const newLead = {
      id: `lead-${Date.now()}`,
      name: leadForm.name.trim(),
      phone: leadForm.phone.trim(),
      plan: selectedPublicPlan,
      preferredDate: leadForm.preferredDate,
      currentMed: leadForm.currentMed,
      paymentProofNote: leadForm.receiptFileName
        ? `Comprobante adjunto: ${leadForm.receiptFileName}`
        : leadForm.paymentMethod,
      status: 'pending',
      createdAt: 'Hace un momento'
    };

    persistState((prev) => ({
      ...prev,
      webLeads: [newLead, ...prev.webLeads]
    }));

    const waText = encodeURIComponent(
      `Hola Dr. José Rodolfo Melgar (Origen Médico), soy *${newLead.name}*.\n` +
      `Solicito alta en: *${newLead.plan}*.\n` +
      `• Medicación GLP-1: ${newLead.currentMed}\n` +
      `• Fecha sugerida: ${newLead.preferredDate}\n` +
      `• Pago: ${newLead.paymentProofNote}`
    );
    const cleanPhone = clinicData.clinicConfig.whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${waText}`, '_blank');

    setShowQrPaymentModal(false);
    setLeadForm({
      name: '', phone: '', preferredDate: '2026-11-18',
      currentMed: 'Tirzepatida (Mounjaro / Zepbound)',
      paymentMethod: 'QR Simple Bolivia (Comprobante)',
      receiptFileName: '', consentAccepted: false
    });
    showToast('Solicitud registrada en el Panel del Dr. Melgar y redirigida a WhatsApp');
  };

  // Subir imagen de QR Simple desde el panel del médico
  const handleQrImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      persistState((prev) => ({
        ...prev,
        clinicConfig: { ...prev.clinicConfig, qrImageDataUrl: reader.result }
      }));
      showToast('Imagen de QR Simple actualizada correctamente');
    };
    reader.readAsDataURL(file);
  };

  // Exportar / Importar copia de seguridad completa en JSON
  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(clinicData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Origen_Medico_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad descargada');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.patients && parsed.clinicConfig) {
          persistState(parsed);
          showToast('Base de datos restaurada con éxito');
        } else {
          showToast('El archivo no corresponde a un respaldo válido');
        }
      } catch {
        showToast('Error al leer el archivo de respaldo');
      }
    };
    reader.readAsText(file);
  };

  // Filtrado de Vademécum
  const filteredVademecum = useMemo(() => {
    return BOLIVIA_VADEMECUM.filter((item) => {
      const matchesCat = vademecumCategory === 'Todas' || item.category === vademecumCategory;
      const q = vademecumSearch.toLowerCase();
      const matchesSearch =
        !q ||
        item.brand.toLowerCase().includes(q) ||
        item.generic.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.pearl.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [vademecumCategory, vademecumSearch]);

  const vademecumCategories = ['Todas', ...Array.from(new Set(BOLIVIA_VADEMECUM.map((v) => v.category)))];

  // Cálculos visuales de Mi Día GLP-1
  const proteinPct = Math.min(100, Math.round((currentPatient.dailyLog.proteinConsumed / currentPatient.proteinGoal) * 100));
  const waterPct = Math.min(100, Math.round((currentPatient.dailyLog.waterConsumed / currentPatient.waterGoal) * 100));
  const activeMaxSymptom = Math.max(...Object.values(currentPatient.dailyLog.symptoms));
  const isSosModeActive = activeMaxSymptom >= 3;

  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#231F1A] font-sans selection:bg-[#C59B43]/30">
      {/* NOTIFICACIÓN FLOTANTE */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-[#231F1A] text-[#FAF6EE] px-4 py-3 rounded-xl shadow-2xl border border-[#C59B43]/50 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#DFBD69] shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* BARRA SUPERIOR DE NAVEGACIÓN Y SELECTOR DE 3 MODOS */}
      <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E6D9C0] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center justify-between">
            <OrigenMedicoLogo size={42} />
            <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#F5EFE2] border border-[#E6D9C0] text-[#735318] lg:hidden">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {syncStatus === 'synced' ? 'Nube Activa' : 'Modo Local'}
            </div>
          </div>

          {/* SELECTOR DE 3 MODOS */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F3ECE0] p-1.5 rounded-2xl border border-[#E2D4B7]">
            <button
              onClick={() => setAppMode('public')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                appMode === 'public'
                  ? 'bg-[#9A742C] text-white shadow-sm'
                  : 'text-[#5C4D3C] hover:bg-[#FAF6EE]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Acceso Público / Beta</span>
            </button>

            <button
              onClick={() => setAppMode('patient')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                appMode === 'patient'
                  ? 'bg-[#9A742C] text-white shadow-sm'
                  : 'text-[#5C4D3C] hover:bg-[#FAF6EE]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>App Paciente</span>
            </button>

            <button
              onClick={() => setAppMode('doctor')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                appMode === 'doctor'
                  ? 'bg-[#231F1A] text-[#DFBD69] shadow-sm'
                  : 'text-[#5C4D3C] hover:bg-[#FAF6EE]'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Panel Clínico (Dr. Melgar)</span>
              {(clinicData.webLeads.filter((l) => l.status === 'pending').length +
                clinicData.rxRequests.filter((r) => r.status === 'pending').length) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-600 text-white rounded-full">
                  {clinicData.webLeads.filter((l) => l.status === 'pending').length +
                    clinicData.rxRequests.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* INDICADOR DE SINCRONIZACIÓN EN LA NUBE */}
          <div className="hidden lg:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[#F5EFE2] border border-[#E6D9C0] text-[#735318]">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-medium">
              {syncStatus === 'synced' ? 'Sincronizado en la Nube' : 'Guardado Automático Activo'}
            </span>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MODO 1: ACCESO PÚBLICO / BETA (CAPTACIÓN & PAGO QR BOLIVIA)          */}
      {/* ==================================================================== */}
      {appMode === 'public' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
          {/* HERO CLÍNICO */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF3E3] to-[#F1E4C8] border border-[#DFC99B] p-6 sm:p-10 shadow-sm">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9A742C]/10 border border-[#9A742C]/30 text-[#735318] text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#9A742C]" />
                <span>{clinicData.clinicConfig.doctorName} · {clinicData.clinicConfig.license}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#231F1A] leading-tight">
                Pierde grasa visceral con terapia GLP-1 <span className="text-[#9A742C]">sin perder tu masa muscular.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#5C4D3C] leading-relaxed">
                Acompañamiento médico y nutricional especializado en Santa Cruz de la Sierra para pacientes con <strong>Tirzepatida (Mounjaro)</strong> o <strong>Semaglutida (Ozempic / Wegovy)</strong>. Control de náuseas, reflujo, fatiga y preservación muscular por bioimpedancia.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedPublicPlan(`Programa Trimestral GLP-1 (${clinicData.clinicConfig.quarterlyProgramPriceBs})`);
                    setShowQrPaymentModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#9A742C] hover:bg-[#7D5C1E] text-white font-semibold shadow-md transition-all cursor-pointer"
                >
                  <QrCode className="w-5 h-5" />
                  <span>Inscribirme con QR Simple Bolivia</span>
                </button>
                <a
                  href="#simulador-publico"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FAF6EE] text-[#735318] border border-[#D4BC8B] font-semibold transition-all"
                >
                  <Activity className="w-5 h-5 text-[#9A742C]" />
                  <span>Calcular mi Meta de Proteína Gratis</span>
                </a>
              </div>
            </div>
          </section>

          {/* SIMULADOR GRATUITO DE PROTEÍNA E HIDRATACIÓN */}
          <section id="simulador-publico" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Herramienta Clínica Gratuita</span>
                <h2 className="font-serif text-2xl font-bold text-[#231F1A] mt-1">
                  Simulador de Protección Muscular GLP-1
                </h2>
                <p className="text-sm text-[#5C4D3C] mt-1">
                  Sin un piso mínimo de proteína, hasta el 35% del peso perdido con GLP-1 puede provenir de tu músculo. Calcula tu requerimiento diario:
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>Tu peso actual:</span>
                    <span className="text-[#9A742C] text-lg">{simWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={simWeight}
                    onChange={(e) => setSimWeight(Number(e.target.value))}
                    className="w-full accent-[#9A742C] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Nivel de actividad / entrenamiento de fuerza:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', label: 'Sedentario / Caminata', factor: 1.3 },
                      { id: 'moderate', label: 'Fuerza 2-3x/sem', factor: 1.5 },
                      { id: 'high', label: 'Fuerza 4+x/sem', factor: 1.7 }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSimActivity(opt.id)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                          simActivity === opt.id
                            ? 'bg-[#9A742C] text-white border-[#9A742C]'
                            : 'bg-[#FAF6EE] text-[#5C4D3C] border-[#E6D9C0] hover:border-[#C59B43]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-[#231F1A] to-[#362E25] text-[#FAF6EE] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-md">
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-widest text-[#DFBD69] font-semibold">
                  Tu Prescripción Estimada Origen Médico
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-[#DFBD69]/30">
                    <div className="text-xs text-[#D5C7B2]">Proteína Mínima Diaria</div>
                    <div className="text-3xl font-bold text-[#DFBD69] mt-1">
                      {Math.round(simWeight * (simActivity === 'light' ? 1.3 : simActivity === 'moderate' ? 1.5 : 1.7))} g
                    </div>
                    <div className="text-[11px] text-[#D5C7B2] mt-1">Dividida en 3-4 tomas</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-[#DFBD69]/30">
                    <div className="text-xs text-[#D5C7B2]">Hidratación Clima SCZ</div>
                    <div className="text-3xl font-bold text-sky-300 mt-1">
                      {((simWeight * 33) / 1000).toFixed(1)} L
                    </div>
                    <div className="text-[11px] text-[#D5C7B2] mt-1">+ Electrolitos sin azúcar</div>
                  </div>
                </div>
                <p className="text-xs text-[#D5C7B2] leading-relaxed">
                  *Estimación orientativa. En consulta realizamos bioimpedancia segmentaria para ajustar tus gramos exactos según tu masa magra real.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedPublicPlan(`Consulta Única + Plan Personalizado (${clinicData.clinicConfig.singleConsultPriceBs})`);
                  setShowQrPaymentModal(true);
                }}
                className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-[#DFBD69] hover:bg-[#C59B43] text-[#231F1A] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Agendar Evaluación con el Dr. Melgar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* VISTA PREVIA PLAN BOLIVIANO 7 DÍAS (DÍA 1 ABIERTO, DÍAS 2-7 CON CANDADO) */}
          <section className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Muestra Gratuita · Alimentos de Bolivia</span>
                <h2 className="font-serif text-2xl font-bold text-[#231F1A]">Plan Nutricional Boliviano de 7 Días</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <span
                    key={d}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      d === 1
                        ? 'bg-[#9A742C] text-white border-[#9A742C]'
                        : 'bg-[#FAF6EE] text-[#8C7A63] border-[#E6D9C0]'
                    }`}
                  >
                    {d > 1 && <Lock className="w-3 h-3 text-[#9A742C]" />}
                    Día {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BOLIVIAN_MEAL_PLANS.fat_loss.days[0].meals.map((meal, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#9A742C]">{meal.type}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {meal.protein}g proteína
                    </span>
                  </div>
                  <div className="font-bold text-[#231F1A]">{meal.name}</div>
                  <p className="text-xs text-[#5C4D3C]">{meal.items}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#F5EFE2] border border-[#DFC99B] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#9A742C] text-white flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#231F1A]">Desbloquea los Días 2 al 7 + Lista de Mercado + App Completa</div>
                  <div className="text-xs text-[#5C4D3C]">Incluye acceso al Vademécum anti-náuseas, control de bioimpedancia y chat directo.</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPublicPlan(`Programa Trimestral GLP-1 (${clinicData.clinicConfig.quarterlyProgramPriceBs})`);
                  setShowQrPaymentModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#9A742C] text-white text-xs font-bold shrink-0 hover:bg-[#7D5C1E] cursor-pointer"
              >
                Activar Acceso Completo
              </button>
            </div>
          </section>

          {/* COMPARATIVA DE PROGRAMAS CLÍNICOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C7A63]">Evaluación Inicial</span>
                <h3 className="font-serif text-2xl font-bold">Consulta Médica & Nutricional Única</h3>
                <div className="text-3xl font-bold text-[#9A742C]">{clinicData.clinicConfig.singleConsultPriceBs}</div>
                <ul className="space-y-2.5 text-sm text-[#5C4D3C] pt-2">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#9A742C]" /> Evaluación médica integral y bioimpedancia</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#9A742C]" /> Plan nutricional boliviano de 7 días con gramajes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#9A742C]" /> Esquema de titulación GLP-1 y manejo digestivo</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#9A742C]" /> Acceso a la App Origen Médico por 30 días</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setSelectedPublicPlan(`Consulta Única (${clinicData.clinicConfig.singleConsultPriceBs})`);
                  setShowQrPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-2xl border-2 border-[#9A742C] text-[#9A742C] hover:bg-[#9A742C] hover:text-white font-bold text-sm transition-all cursor-pointer"
              >
                Reservar Consulta Única
              </button>
            </div>

            <div className="bg-gradient-to-b from-[#FFFDF9] to-[#F7EEDB] rounded-3xl border-2 border-[#9A742C] p-6 sm:p-8 flex flex-col justify-between space-y-6 relative shadow-md">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[#9A742C] text-white text-xs font-bold">
                Recomendado · Resultados Sostenibles
              </div>
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Acompañamiento Integral 90 Días</span>
                <h3 className="font-serif text-2xl font-bold">Programa Trimestral GLP-1</h3>
                <div className="text-3xl font-bold text-[#231F1A]">{clinicData.clinicConfig.quarterlyProgramPriceBs}</div>
                <ul className="space-y-2.5 text-sm text-[#3D3326] pt-2">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#9A742C]" /> 3 Consultas presenciales o virtuales con bioimpedancia</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#9A742C]" /> App Paciente Origen Médico 24/7 con monitoreo clínico</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#9A742C]" /> Recetas digitales directas (Farmacorp / Chávez) ante síntomas</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#9A742C]" /> Ajuste mensual de planes (Pérdida de Grasa / Digestivo Suave)</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setSelectedPublicPlan(`Programa Trimestral GLP-1 (${clinicData.clinicConfig.quarterlyProgramPriceBs})`);
                  setShowQrPaymentModal(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#9A742C] hover:bg-[#7D5C1E] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Inscribirme con QR Simple Bolivia
              </button>
            </div>
          </section>
        </main>
      )}

      {/* ==================================================================== */}
      {/* MODO 2: APP PACIENTE (MI DÍA, PLAN 7 DÍAS, SOS, EVOLUCIÓN, RECETAS)  */}
      {/* ==================================================================== */}
      {appMode === 'patient' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* SELECTOR DE PACIENTE DEMO / REAL + INDICACIÓN DEL DR. MELGAR */}
          <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#9A742C] text-white font-serif font-bold text-lg flex items-center justify-center shrink-0">
                {currentPatient.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={currentPatient.id}
                    onChange={(e) => setActivePatientId(e.target.value)}
                    className="font-serif font-bold text-lg text-[#231F1A] bg-transparent border-b border-dashed border-[#9A742C] focus:outline-none cursor-pointer"
                  >
                    {clinicData.patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.medication} {p.currentDose})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5EFE2] text-[#735318] font-semibold border border-[#E6D9C0]">
                    Aplicación: {currentPatient.injectionDay}
                  </span>
                </div>
                <p className="text-xs text-[#5C4D3C] mt-1">
                  <strong className="text-[#9A742C]">Indicación Dr. Melgar:</strong> {currentPatient.doctorNote}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3.5 py-2 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] text-center">
                <div className="text-[10px] uppercase tracking-wider text-[#8C7A63] font-bold">Próxima Dosis</div>
                <div className="text-sm font-bold text-[#9A742C]">En {currentPatient.daysUntilInjection} días</div>
              </div>
            </div>
          </div>

          {/* SUB-NAVEGACIÓN DE LA APP PACIENTE */}
          <nav className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
            {[
              { id: 'today', label: 'Mi Día GLP-1', icon: Flame },
              { id: 'meals', label: 'Plan 7 Días', icon: Utensils },
              { id: 'symptoms', label: 'Síntomas & SOS', icon: HeartPulse, badge: isSosModeActive ? 'SOS' : null },
              { id: 'progress', label: 'Evolución & Dosis', icon: TrendingDown },
              { id: 'rx', label: 'Recetas & Farmacorp/Chávez', icon: FileText, count: currentPatient.prescriptions.length }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPatientTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    patientTab === tab.id
                      ? 'bg-[#231F1A] text-[#DFBD69] shadow-sm'
                      : 'bg-[#FFFDF9] text-[#5C4D3C] border border-[#E6D9C0] hover:border-[#9A742C]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-rose-600 text-white rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-[#9A742C] text-white rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* PESTAÑA 1: MI DÍA GLP-1 */}
          {patientTab === 'today' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ANILLO DE PROTEÍNA PROTAGONISTA */}
              <div className="lg:col-span-7 bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Escudo Anti-Sarcopenia</span>
                    <h2 className="font-serif text-2xl font-bold">Proteína Diaria Consumida</h2>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    proteinPct >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {proteinPct}% de la meta
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Anillo SVG */}
                  <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" stroke="#EFE6D5" strokeWidth="12" fill="none" />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#9A742C"
                        strokeWidth="12"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={314}
                        strokeDashoffset={314 - (314 * proteinPct) / 100}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-3xl font-bold text-[#231F1A]">{currentPatient.dailyLog.proteinConsumed}g</div>
                      <div className="text-xs text-[#8C7A63]">de {currentPatient.proteinGoal}g</div>
                    </div>
                  </div>

                  {/* Botones rápidos de bloques proteicos */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="text-xs font-bold uppercase text-[#8C7A63]">Suma rápida con 1 toque:</div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: '+25g Yogur Griego', grams: 25, sub: '1 pote (170g)' },
                        { label: '+30g Pechuga Pollo', grams: 30, sub: '1 palma (110g)' },
                        { label: '+18g 3 Huevos', grams: 18, sub: 'Revueltos / duros' },
                        { label: '+24g Batido Whey', grams: 24, sub: '1 scoop en agua' }
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          onClick={() => addProtein(btn.grams)}
                          className="p-3 rounded-2xl bg-[#FAF6EE] hover:bg-[#F3E7CE] border border-[#E2D4B7] text-left transition-all cursor-pointer group"
                        >
                          <div className="text-xs sm:text-sm font-bold text-[#735318] group-hover:text-[#231F1A]">
                            {btn.label}
                          </div>
                          <div className="text-[11px] text-[#8C7A63]">{btn.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* HIDRATACIÓN Y ELECTROLITOS */}
              <div className="lg:col-span-5 bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Clima Santa Cruz</span>
                      <h2 className="font-serif text-xl font-bold">Hidratación & Electrolitos</h2>
                    </div>
                    <Droplets className="w-6 h-6 text-sky-600" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span>{currentPatient.dailyLog.waterConsumed} ml</span>
                      <span className="text-[#8C7A63]">Meta: {currentPatient.waterGoal} ml ({waterPct}%)</span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-sky-100 overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-500"
                        style={{ width: `${waterPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => addWater(250)}
                      className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-bold cursor-pointer"
                    >
                      +250 ml (1 Vaso)
                    </button>
                    <button
                      onClick={() => addWater(500)}
                      className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-bold cursor-pointer"
                    >
                      +500 ml (1 Botella)
                    </button>
                  </div>
                </div>

                {/* Check Electrolitos */}
                <div
                  onClick={toggleElectrolytes}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    currentPatient.dailyLog.electrolytesTaken
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-[#FAF6EE] border-[#E6D9C0] text-[#5C4D3C]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Electrolitos sin azúcar (Pedialyte / Suero)</div>
                    <div className="text-[11px] opacity-80">Previene mareos, cefalea y calambres por GLP-1</div>
                  </div>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    currentPatient.dailyLog.electrolytesTaken ? 'bg-emerald-600 text-white' : 'border border-[#C59B43]'
                  }`}>
                    {currentPatient.dailyLog.electrolytesTaken && <Check className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: PLAN BOLIVIANO DE 7 DÍAS */}
          {patientTab === 'meals' && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Alimentos Económicos de Bolivia</span>
                    <h2 className="font-serif text-2xl font-bold">Plan Nutricional de 7 Días con Gramajes Exactos</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowGroceryModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9A742C] text-white text-xs font-bold hover:bg-[#7D5C1E] cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Lista de Mercado Semanal</span>
                    </button>
                  </div>
                </div>

                {/* Selector de 3 Enfoques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.values(BOLIVIAN_MEAL_PLANS).map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanKey(plan.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedPlanKey === plan.id
                          ? 'bg-[#F7EEDB] border-[#9A742C] shadow-xs'
                          : 'bg-[#FAF6EE] border-[#E6D9C0] hover:border-[#C59B43]'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase text-[#9A742C]">{plan.badge}</div>
                      <div className="font-bold text-sm text-[#231F1A] mt-0.5">{plan.name}</div>
                      <p className="text-xs text-[#5C4D3C] mt-1 line-clamp-2">{plan.description}</p>
                    </button>
                  ))}
                </div>

                {/* Selector de Días 1 al 7 */}
                <div className="flex overflow-x-auto gap-2 pb-1">
                  {BOLIVIAN_MEAL_PLANS[selectedPlanKey].days.map((d) => (
                    <button
                      key={d.day}
                      onClick={() => setSelectedMealDay(d.day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer ${
                        selectedMealDay === d.day
                          ? 'bg-[#231F1A] text-[#DFBD69] border-[#231F1A]'
                          : 'bg-[#FAF6EE] text-[#5C4D3C] border-[#E6D9C0]'
                      }`}
                    >
                      Día {d.day} · {d.totalProtein}g prot.
                    </button>
                  ))}
                </div>

                {/* Tarjetas de comidas del día seleccionado */}
                {(() => {
                  const activeDayObj = BOLIVIAN_MEAL_PLANS[selectedPlanKey].days.find((d) => d.day === selectedMealDay);
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-[#FAF6EE] px-4 py-3 rounded-2xl border border-[#E6D9C0]">
                        <div className="font-serif font-bold text-lg">{activeDayObj.title}</div>
                        <div className="text-xs font-bold text-[#735318]">
                          Total Día: {activeDayObj.totalProtein}g Proteína · ~{activeDayObj.totalKcal} kcal
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeDayObj.meals.map((meal, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">{meal.type}</span>
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  +{meal.protein}g proteína
                                </span>
                              </div>
                              <div className="font-bold text-base text-[#231F1A]">{meal.name}</div>
                              <p className="text-xs sm:text-sm text-[#3D3326] leading-relaxed">{meal.items}</p>
                            </div>

                            <div className="pt-2 border-t border-[#E6D9C0] flex items-center justify-between gap-2">
                              <span className="text-[11px] text-[#735318] italic">💡 {meal.tip}</span>
                              <button
                                onClick={() => addProtein(meal.protein)}
                                className="px-3 py-1.5 rounded-xl bg-[#9A742C] hover:bg-[#7D5C1E] text-white text-xs font-bold shrink-0 cursor-pointer"
                              >
                                Registrar en Mi Día
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: SÍNTOMAS & MODO SOS DIGESTIVO */}
          {patientTab === 'symptoms' && (
            <div className="space-y-6">
              {isSosModeActive && (
                <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 space-y-3">
                  <div className="flex items-center gap-2.5 text-rose-800 font-bold">
                    <ShieldAlert className="w-6 h-6 shrink-0" />
                    <span>Protocolo SOS Digestivo Activado (Síntoma ≥ 3/5)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                    1. Suspende temporalmente alimentos grasos, crudos o muy fibrosos hoy.<br />
                    2. Prioriza sorbos fríos de electrolitos y batido proteico aislado en agua.<br />
                    3. Si presentas dolor abdominal intenso irradiado a la espalda o vómitos incoercibles, contacta de inmediato al Dr. Melgar.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedPlanKey('digestive_soft');
                        setPatientTab('meals');
                        showToast('Plan cambiado a Tolerancia Digestiva Suave');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Cambiar a Menú Digestivo Suave
                    </button>
                    <button
                      onClick={() => setPatientTab('rx')}
                      className="px-4 py-2 rounded-xl bg-white text-rose-800 border border-rose-300 text-xs font-bold cursor-pointer"
                    >
                      Ver Medicamentos en Vademécum Bolivia
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Monitoreo de Tolerancia</span>
                  <h2 className="font-serif text-2xl font-bold">Registro Diario de Síntomas (0 = Ninguno · 5 = Severo)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { key: 'nausea', label: 'Náuseas o Plenitud Precoz', desc: 'Sensación de estómago lleno tras pocos bocados' },
                    { key: 'reflux', label: 'Reflujo o Acidez Nocturna', desc: 'Ardor retroesternal o eructos' },
                    { key: 'constipation', label: 'Estreñimiento', desc: 'Disminución en frecuencia o esfuerzo al evacuar' },
                    { key: 'fatigue', label: 'Fatiga o Mareo al Levantarse', desc: 'Asociado a deshidratación o baja ingesta' }
                  ].map((sym) => {
                    const currentVal = currentPatient.dailyLog.symptoms[sym.key];
                    return (
                      <div key={sym.key} className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm">{sym.label}</div>
                            <div className="text-xs text-[#8C7A63]">{sym.desc}</div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            currentVal >= 3 ? 'bg-rose-100 text-rose-800' : currentVal >= 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {currentVal} / 5
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {[0, 1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              onClick={() => updateSymptom(sym.key, num)}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                currentVal === num
                                  ? num >= 3
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-[#9A742C] text-white border-[#9A742C]'
                                  : 'bg-white text-[#5C4D3C] border-[#E6D9C0]'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 4: EVOLUCIÓN, BIOIMPEDANCIA & MAPA DE ROTACIÓN */}
          {patientTab === 'progress' && (() => {
            const metrics = currentPatient.bodyMetrics;
            const latest = metrics[metrics.length - 1];
            const first = metrics[0];
            const preservation = getMusclePreservationStats(currentPatient);

            return (
              <div className="space-y-6">
                {/* Tarjetas Resumen Bioimpedancia */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#FFFDF9] p-5 rounded-3xl border border-[#E6D9C0]">
                    <div className="text-xs text-[#8C7A63] font-semibold">Peso Actual</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#231F1A] mt-1">{latest.weight} kg</div>
                    <div className="text-xs text-emerald-700 font-semibold mt-1">
                      {(latest.weight - first.weight).toFixed(1)} kg desde inicio
                    </div>
                  </div>
                  <div className="bg-[#FFFDF9] p-5 rounded-3xl border border-[#E6D9C0]">
                    <div className="text-xs text-[#8C7A63] font-semibold">Masa Muscular Esquelética</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#9A742C] mt-1">{latest.muscle} kg</div>
                    <div className="text-xs text-[#5C4D3C] mt-1">
                      {(latest.muscle - first.muscle).toFixed(1)} kg variación
                    </div>
                  </div>
                  <div className="bg-[#FFFDF9] p-5 rounded-3xl border border-[#E6D9C0]">
                    <div className="text-xs text-[#8C7A63] font-semibold">% Grasa Corporal</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#231F1A] mt-1">{latest.fatPct}%</div>
                    <div className="text-xs text-emerald-700 font-semibold mt-1">
                      {(latest.fatPct - first.fatPct).toFixed(1)}% reducción
                    </div>
                  </div>
                  <div className={`p-5 rounded-3xl border ${
                    preservation.isRisk ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50/70 border-emerald-200'
                  }`}>
                    <div className="text-xs font-semibold text-[#5C4D3C]">Preservación Muscular</div>
                    <div className={`text-lg font-bold mt-1 ${preservation.isRisk ? 'text-rose-700' : 'text-emerald-800'}`}>
                      {preservation.label}
                    </div>
                    <div className="text-[11px] text-[#5C4D3C] mt-1">
                      Ratio pérdida magra: {preservation.leanLossRatio}% (Meta &lt;25%)
                    </div>
                  </div>
                </div>

                {/* Historial + Nuevo Control */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                    <h3 className="font-serif text-xl font-bold">Historial de Bioimpedancia</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-[#E6D9C0] text-[#8C7A63]">
                            <th className="py-2">Fecha</th>
                            <th className="py-2">Peso (kg)</th>
                            <th className="py-2">Músculo (kg)</th>
                            <th className="py-2">% Grasa</th>
                            <th className="py-2">Cintura</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((m, idx) => (
                            <tr key={idx} className="border-b border-[#F3ECE0]">
                              <td className="py-2.5 font-semibold">{m.date}</td>
                              <td className="py-2.5">{m.weight} kg</td>
                              <td className="py-2.5 font-bold text-[#9A742C]">{m.muscle} kg</td>
                              <td className="py-2.5">{m.fatPct}%</td>
                              <td className="py-2.5">{m.waist} cm</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <form onSubmit={(e) => handleAddBodyMetric(e, currentPatient.id)} className="pt-3 border-t border-[#E6D9C0] grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Peso kg"
                        value={newMetricForm.weight}
                        onChange={(e) => setNewMetricForm({ ...newMetricForm, weight: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-xs"
                        required
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Músculo kg"
                        value={newMetricForm.muscle}
                        onChange={(e) => setNewMetricForm({ ...newMetricForm, muscle: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-xs"
                        required
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="% Grasa"
                        value={newMetricForm.fatPct}
                        onChange={(e) => setNewMetricForm({ ...newMetricForm, fatPct: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-xs"
                      />
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Cintura cm"
                        value={newMetricForm.waist}
                        onChange={(e) => setNewMetricForm({ ...newMetricForm, waist: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-xs"
                      />
                      <button
                        type="submit"
                        className="col-span-2 sm:col-span-1 py-2 px-3 rounded-xl bg-[#9A742C] text-white text-xs font-bold hover:bg-[#7D5C1E] cursor-pointer"
                      >
                        + Registrar
                      </button>
                    </form>
                  </div>

                  {/* MAPA INTERACTIVO DE ROTACIÓN DE 8 ZONAS DE INYECCIÓN */}
                  <div className="lg:col-span-5 bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-[#9A742C]">Evita Lipohipertrofia</span>
                      <h3 className="font-serif text-xl font-bold">Rotación de Zona Subcutánea</h3>
                      <p className="text-xs text-[#5C4D3C] mt-0.5">
                        Última aplicación: <strong>{currentPatient.lastInjectionSite}</strong>. Toca una zona distinta para registrar tu dosis semanal:
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Abdomen Sup. Der.', 'Abdomen Sup. Izq.',
                        'Abdomen Inf. Der.', 'Abdomen Inf. Izq.',
                        'Muslo Sup. Der.', 'Muslo Sup. Izq.',
                        'Brazo Post. Der.', 'Brazo Post. Izq.'
                      ].map((zone) => {
                        const isLast = currentPatient.lastInjectionSite === zone;
                        return (
                          <button
                            key={zone}
                            onClick={() => updateInjectionSite(zone)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                              isLast
                                ? 'bg-[#9A742C] text-white border-[#9A742C]'
                                : 'bg-[#FAF6EE] text-[#3D3326] border-[#E6D9C0] hover:border-[#9A742C]'
                            }`}
                          >
                            <span>{zone}</span>
                            {isLast && <Syringe className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F5EFE2] border border-[#E2D4B7] text-[11px] text-[#5C4D3C] space-y-1">
                      <div className="font-bold text-[#735318]">Regla de Olvido de Dosis:</div>
                      <div>• <strong>Tirzepatida:</strong> Aplicar dentro de 4 días (96 h). Si pasaron &gt;4 días, saltar y esperar día habitual.</div>
                      <div>• <strong>Semaglutida:</strong> Aplicar dentro de 5 días. Nunca duplicar dosis.</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* PESTAÑA 5: RECETAS & VADEMÉCUM FARMACORP / CHÁVEZ */}
          {patientTab === 'rx' && (
            <div className="space-y-6">
              {/* RECETAS ACTIVAS DEL DR. MELGAR */}
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#9A742C]">Prescripción Médica Oficial</span>
                    <h2 className="font-serif text-2xl font-bold">Mis Recetas Activas (Farmacorp / Chávez)</h2>
                  </div>
                </div>

                {currentPatient.prescriptions.length === 0 ? (
                  <p className="text-sm text-[#8C7A63] py-4">No tienes recetas complementarias activas hoy. Puedes consultar el Vademécum inferior si presentas algún síntoma.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentPatient.prescriptions.map((rx) => (
                      <div key={rx.id} className="p-5 rounded-2xl bg-[#FAF6EE] border border-[#DFC99B] flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-[#8C7A63]">
                            <span>Emitida: {rx.date}</span>
                            <span className="text-emerald-700 font-bold">Activa</span>
                          </div>
                          <div className="font-bold text-base text-[#231F1A]">{rx.brand}</div>
                          <div className="text-xs font-semibold text-[#9A742C]">Principio activo: {rx.generic}</div>
                          <p className="text-xs text-[#3D3326] pt-1">{rx.dose}</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setPrintableRx({ rx, patient: currentPatient })}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#231F1A] text-[#DFBD69] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Ver Receta / PDF</span>
                          </button>
                          <button
                            onClick={() => {
                              const msg = encodeURIComponent(
                                `Hola, comparto mi receta emitida por el *${clinicData.clinicConfig.doctorName} (${clinicData.clinicConfig.clinicName})*:\n` +
                                `• Paciente: ${currentPatient.name}\n` +
                                `• Medicamento: ${rx.brand} (${rx.generic})\n` +
                                `• Indicación: ${rx.dose}`
                              );
                              window.open(`https://wa.me/?text=${msg}`, '_blank');
                            }}
                            className="py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BUSCADOR DE ALIVIO Y VADEMÉCUM COMERCIAL BOLIVIA */}
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#9A742C]">Guía Farmacológica Santa Cruz</span>
                    <h3 className="font-serif text-xl font-bold">Vademécum de Soporte GLP-1 (Disponibilidad y Precios Bolivia)</h3>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-[#8C7A63]" />
                    <input
                      type="text"
                      placeholder="Buscar marca, síntoma o compuesto..."
                      value={vademecumSearch}
                      onChange={(e) => setVademecumSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-xs"
                    />
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-1.5 pb-1">
                  {vademecumCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setVademecumCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border cursor-pointer ${
                        vademecumCategory === cat
                          ? 'bg-[#9A742C] text-white border-[#9A742C]'
                          : 'bg-[#FAF6EE] text-[#5C4D3C] border-[#E6D9C0]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVademecum.map((med) => (
                    <div key={med.id} className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-[#9A742C]">{med.category}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E6D9C0]/60 text-[#231F1A]">
                            ~{med.priceBs}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-[#231F1A]">{med.brand}</div>
                        <div className="text-xs text-[#735318] font-medium">{med.generic} · {med.lab}</div>
                        <p className="text-[11px] text-[#5C4D3C] pt-1">{med.pearl}</p>
                      </div>
                      <button
                        onClick={() => handleRequestRx(med)}
                        className="w-full py-2 rounded-xl bg-white hover:bg-[#9A742C] text-[#9A742C] hover:text-white border border-[#9A742C] text-xs font-bold transition-all cursor-pointer"
                      >
                        Solicitar Receta al Dr. Melgar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ==================================================================== */}
      {/* MODO 3: PANEL CLÍNICO DEL DR. JOSÉ RODOLFO MELGAR LIZARAZU           */}
      {/* ==================================================================== */}
      {appMode === 'doctor' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* CABECERA CLÍNICA & ACCIÓN RÁPIDA + NUEVO PACIENTE */}
          <div className="bg-[#231F1A] text-[#FAF6EE] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#DFBD69] font-bold">
                Consultorio Digital · {clinicData.clinicConfig.city}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
                {clinicData.clinicConfig.doctorName}
              </h1>
              <p className="text-xs text-[#D5C7B2] mt-0.5">{clinicData.clinicConfig.license}</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowNewPatientModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#DFBD69] hover:bg-[#C59B43] text-[#231F1A] font-bold text-xs sm:text-sm shadow-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Nuevo Paciente</span>
              </button>
            </div>
          </div>

          {/* SUB-NAVEGACIÓN PANEL MÉDICO */}
          <nav className="flex overflow-x-auto gap-2 pb-1">
            {[
              { id: 'triage', label: 'Semáforo Triage & Bandeja', icon: Activity },
              { id: 'patient_detail', label: 'Expediente Individual', icon: ClipboardCheck },
              { id: 'vademecum', label: 'Vademécum GLP-1 (31 Marcas Bolivia)', icon: BookOpen },
              { id: 'settings', label: 'Configuración Consultorio (Sin Código)', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDoctorTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    doctorTab === tab.id
                      ? 'bg-[#9A742C] text-white shadow-sm'
                      : 'bg-[#FFFDF9] text-[#5C4D3C] border border-[#E6D9C0] hover:border-[#9A742C]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* DOCTOR TAB 1: SEMÁFORO TRIAGE & SOLICITUDES PENDIENTES */}
          {doctorTab === 'triage' && (
            <div className="space-y-6">
              {/* BANDEJA DE SOLICITUDES WEB Y RECETAS */}
              {(clinicData.webLeads.filter((l) => l.status === 'pending').length > 0 ||
                clinicData.rxRequests.filter((r) => r.status === 'pending').length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Altas Web */}
                  {clinicData.webLeads
                    .filter((l) => l.status === 'pending')
                    .map((lead) => (
                      <div key={lead.id} className="p-5 rounded-3xl bg-[#FFFDF9] border-2 border-[#C59B43] flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-[#9A742C]">Nueva Solicitud Web / QR Bolivia</span>
                            <span className="text-[11px] text-[#8C7A63]">{lead.createdAt}</span>
                          </div>
                          <div className="font-bold text-base">{lead.name} · Tel: {lead.phone}</div>
                          <div className="text-xs text-[#3D3326]">{lead.plan} · {lead.currentMed}</div>
                          <div className="text-xs font-semibold text-emerald-700">{lead.paymentProofNote}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setNewPatientForm((prev) => ({
                                ...prev,
                                name: lead.name,
                                phone: lead.phone
                              }));
                              persistState((prev) => ({
                                ...prev,
                                webLeads: prev.webLeads.map((item) =>
                                  item.id === lead.id ? { ...item, status: 'converted' } : item
                                )
                              }));
                              setShowNewPatientModal(true);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#9A742C] text-white text-xs font-bold cursor-pointer"
                          >
                            Convertir en Paciente Activo
                          </button>
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    ))}

                  {/* Solicitudes de Receta */}
                  {clinicData.rxRequests
                    .filter((r) => r.status === 'pending')
                    .map((req) => (
                      <div key={req.id} className="p-5 rounded-3xl bg-[#FFFDF9] border-2 border-amber-400 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs font-bold uppercase text-amber-700">Solicitud de Receta desde App</span>
                            <span className="text-[11px] text-[#8C7A63]">{req.date}</span>
                          </div>
                          <div className="font-bold text-base">{req.patientName}</div>
                          <div className="text-xs text-[#3D3326]">Motivo: {req.symptom}</div>
                          <div className="text-xs font-bold text-[#9A742C]">Solicita: {req.suggestedMed}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const foundMed = BOLIVIA_VADEMECUM.find((m) => req.suggestedMed.includes(m.brand)) || BOLIVIA_VADEMECUM[0];
                              handleDoctorPrescribe(req.patientId, foundMed);
                              persistState((prev) => ({
                                ...prev,
                                rxRequests: prev.rxRequests.map((r) =>
                                  r.id === req.id ? { ...r, status: 'approved' } : r
                                )
                              }));
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Aprobar y Emitir Receta Ahora
                          </button>
                          <button
                            onClick={() =>
                              persistState((prev) => ({
                                ...prev,
                                rxRequests: prev.rxRequests.map((r) =>
                                  r.id === req.id ? { ...r, status: 'dismissed' } : r
                                )
                              }))
                            }
                            className="py-2 px-3 rounded-xl bg-[#FAF6EE] text-[#5C4D3C] border border-[#E6D9C0] text-xs font-bold cursor-pointer"
                          >
                            Descartar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* TABLERO DE PACIENTES CON SEMÁFORO */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {clinicData.patients.map((pat) => {
                  const triage = getPatientTriage(pat);
                  const latest = pat.bodyMetrics[pat.bodyMetrics.length - 1];
                  const proteinPctPat = Math.round((pat.dailyLog.proteinConsumed / pat.proteinGoal) * 100);

                  return (
                    <div
                      key={pat.id}
                      className={`bg-[#FFFDF9] rounded-3xl border-2 p-5 flex flex-col justify-between space-y-4 transition-all ${
                        triage.level === 'red'
                          ? 'border-rose-400'
                          : triage.level === 'amber'
                          ? 'border-amber-300'
                          : 'border-[#E6D9C0]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-serif font-bold text-lg text-[#231F1A]">{pat.name}</div>
                            <div className="text-xs font-semibold text-[#9A742C]">
                              {pat.medication} · {pat.currentDose} ({pat.injectionDay})
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              triage.level === 'red'
                                ? 'bg-rose-100 text-rose-800'
                                : triage.level === 'amber'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {triage.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center bg-[#FAF6EE] p-3 rounded-2xl border border-[#E6D9C0]">
                          <div>
                            <div className="text-[10px] text-[#8C7A63]">Proteína Hoy</div>
                            <div className="text-xs font-bold">{pat.dailyLog.proteinConsumed}/{pat.proteinGoal}g ({proteinPctPat}%)</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#8C7A63]">Peso Actual</div>
                            <div className="text-xs font-bold">{latest.weight} kg</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#8C7A63]">Músculo</div>
                            <div className="text-xs font-bold text-[#9A742C]">{latest.muscle} kg</div>
                          </div>
                        </div>

                        <div className="text-xs text-[#5C4D3C]">
                          {triage.reasons.map((r, i) => (
                            <span key={i} className="inline-block mr-2">• {r}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setSelectedDoctorPatientId(pat.id);
                            setDoctorTab('patient_detail');
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#231F1A] text-[#DFBD69] text-xs font-bold cursor-pointer"
                        >
                          Abrir Expediente
                        </button>
                        <a
                          href={`https://wa.me/${pat.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hola ${pat.name}, te saluda el ${clinicData.clinicConfig.doctorName} de Origen Médico. Revisé tu progreso con ${pat.medication} ${pat.currentDose}...`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DOCTOR TAB 2: EXPEDIENTE INDIVIDUAL DEL PACIENTE */}
          {doctorTab === 'patient_detail' && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6D9C0] pb-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={doctorSelectedPatient.id}
                      onChange={(e) => setSelectedDoctorPatientId(e.target.value)}
                      className="font-serif text-xl font-bold bg-[#FAF6EE] px-4 py-2 rounded-xl border border-[#9A742C] cursor-pointer"
                    >
                      {clinicData.patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.age} años)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setActivePatientId(doctorSelectedPatient.id);
                        setAppMode('patient');
                        showToast(`Viendo App como ${doctorSelectedPatient.name}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FAF6EE] border border-[#9A742C] text-[#735318] text-xs font-bold cursor-pointer"
                    >
                      Vista Previa App del Paciente
                    </button>
                    <button
                      onClick={() => {
                        const cardText = encodeURIComponent(
                          `*ORIGEN MÉDICO - Tu Plan GLP-1*\n` +
                          `Paciente: *${doctorSelectedPatient.name}*\n` +
                          `Esquema: ${doctorSelectedPatient.medication} ${doctorSelectedPatient.currentDose} (${doctorSelectedPatient.injectionDay})\n` +
                          `Meta Proteína: *${doctorSelectedPatient.proteinGoal}g/día*\n` +
                          `Meta Agua: *${(doctorSelectedPatient.waterGoal / 1000).toFixed(1)}L/día*\n` +
                          `Indicación Dr. Melgar: ${doctorSelectedPatient.doctorNote}`
                        );
                        window.open(`https://wa.me/${doctorSelectedPatient.phone.replace(/\D/g, '')}?text=${cardText}`, '_blank');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar Plan por WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* EDICIÓN DE PARÁMETROS CLÍNICOS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#735318] mb-1">Molécula GLP-1</label>
                    <select
                      value={doctorSelectedPatient.medication}
                      onChange={(e) =>
                        persistState((prev) => ({
                          ...prev,
                          patients: prev.patients.map((p) =>
                            p.id === doctorSelectedPatient.id ? { ...p, medication: e.target.value } : p
                          )
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm font-semibold"
                    >
                      <option value="Tirzepatida">Tirzepatida (Mounjaro / Zepbound)</option>
                      <option value="Semaglutida">Semaglutida (Ozempic / Wegovy)</option>
                      <option value="Liraglutida">Liraglutida (Saxenda)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#735318] mb-1">Dosis Semanal Actual</label>
                    <select
                      value={doctorSelectedPatient.currentDose}
                      onChange={(e) => {
                        persistState((prev) => ({
                          ...prev,
                          patients: prev.patients.map((p) =>
                            p.id === doctorSelectedPatient.id ? { ...p, currentDose: e.target.value } : p
                          )
                        }));
                        showToast(`Dosis actualizada a ${e.target.value}`);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm font-semibold"
                    >
                      {['0.25 mg', '0.50 mg', '1.0 mg', '1.7 mg', '2.4 mg', '2.5 mg', '5.0 mg', '7.5 mg', '10.0 mg', '12.5 mg', '15.0 mg'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#735318] mb-1">Meta Proteína Diaria (g)</label>
                    <input
                      type="number"
                      value={doctorSelectedPatient.proteinGoal}
                      onChange={(e) =>
                        persistState((prev) => ({
                          ...prev,
                          patients: prev.patients.map((p) =>
                            p.id === doctorSelectedPatient.id ? { ...p, proteinGoal: Number(e.target.value) } : p
                          )
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#735318] mb-1">
                    Indicación Médica Directa (Visible en la pantalla principal del paciente)
                  </label>
                  <textarea
                    rows={2}
                    value={doctorSelectedPatient.doctorNote}
                    onChange={(e) =>
                      persistState((prev) => ({
                        ...prev,
                        patients: prev.patients.map((p) =>
                          p.id === doctorSelectedPatient.id ? { ...p, doctorNote: e.target.value } : p
                        )
                      }))
                    }
                    className="w-full p-3 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DOCTOR TAB 3: VADEMÉCUM GLP-1 BOLIVIA (31 MEDICAMENTOS + PRESCRIPCIÓN EN 1 CLIC) */}
          {doctorTab === 'vademecum' && (
            <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase text-[#9A742C]">Farmacorp & Farmacias Chávez · Santa Cruz</span>
                  <h2 className="font-serif text-2xl font-bold">Vademécum Completo de Manejo de Efectos GLP-1 (31 Marcas)</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#735318]">Prescribir a:</span>
                  <select
                    value={targetRxPatientId}
                    onChange={(e) => setTargetRxPatientId(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#9A742C] text-xs font-bold"
                  >
                    {clinicData.patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Buscar marca o compuesto..."
                    value={vademecumSearch}
                    onChange={(e) => setVademecumSearch(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-xs"
                  />
                </div>
              </div>

              <div className="flex overflow-x-auto gap-1.5 pb-1">
                {vademecumCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setVademecumCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border cursor-pointer ${
                      vademecumCategory === cat
                        ? 'bg-[#231F1A] text-[#DFBD69] border-[#231F1A]'
                        : 'bg-[#FAF6EE] text-[#5C4D3C] border-[#E6D9C0]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVademecum.map((med) => (
                  <div key={med.id} className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-[#9A742C]">{med.category}</span>
                        <span className="text-xs font-bold text-[#231F1A]">{med.priceBs}</span>
                      </div>
                      <div className="font-bold text-sm">{med.brand}</div>
                      <div className="text-xs text-[#735318]">{med.generic} ({med.lab})</div>
                      <div className="text-[11px] font-semibold text-[#3D3326] pt-1">Posología: {med.dose}</div>
                      <p className="text-[11px] text-[#5C4D3C] italic">Perla: {med.pearl}</p>
                    </div>
                    <button
                      onClick={() => handleDoctorPrescribe(targetRxPatientId, med)}
                      className="w-full py-2 rounded-xl bg-[#9A742C] hover:bg-[#7D5C1E] text-white text-xs font-bold cursor-pointer"
                    >
                      Prescribir en 1 Clic
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCTOR TAB 4: CONFIGURACIÓN DEL CONSULTORIO SIN CÓDIGO */}
          {doctorTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 sm:p-8 space-y-5">
                <div>
                  <span className="text-xs font-bold uppercase text-[#9A742C]">Autogestión Total · Sin Programación</span>
                  <h2 className="font-serif text-2xl font-bold">Datos del Consultorio, WhatsApp y Aranceles</h2>
                  <p className="text-xs text-[#5C4D3C] mt-1">
                    Cualquier cambio que realices aquí se guarda automáticamente y actualiza la portada pública y las recetas.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Nombre del Médico</label>
                    <input
                      type="text"
                      value={clinicData.clinicConfig.doctorName}
                      onChange={(e) =>
                        persistState((prev) => ({
                          ...prev,
                          clinicConfig: { ...prev.clinicConfig, doctorName: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Matrícula Profesional</label>
                    <input
                      type="text"
                      value={clinicData.clinicConfig.license}
                      onChange={(e) =>
                        persistState((prev) => ({
                          ...prev,
                          clinicConfig: { ...prev.clinicConfig, license: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">WhatsApp Recepción (con 591)</label>
                    <input
                      type="text"
                      value={clinicData.clinicConfig.whatsappNumber}
                      onChange={(e) =>
                        persistState((prev) => ({
                          ...prev,
                          clinicConfig: { ...prev.clinicConfig, whatsappNumber: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Dirección Consultorio SCZ</label>
                    <input
                      type="text"
                      value={clinicData.clinicConfig.address}
                      onChange={(e) =>
                        persistState((prev) => ({
                          ...prev,
                          clinicConfig: { ...prev.clinicConfig, address: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Precio Consulta Única</label>
                    <input
                      type="text"
                      value={clinicData.clinicConfig.singleConsultPriceBs}
                      onChange={(e) =>
                        persistState((prev) => ({
                          ...prev,
                          clinicConfig: { ...prev.clinicConfig, singleConsultPriceBs: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Precio Programa Trimestral</label>
                    <input
                      type="text"
                      value={clinicData.clinicConfig.quarterlyProgramPriceBs}
                      onChange={(e) =>
                        persistState((prev) => ({
                          ...prev,
                          clinicConfig: { ...prev.clinicConfig, quarterlyProgramPriceBs: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Datos Bancarios / Cuenta para Transferencia</label>
                  <input
                    type="text"
                    value={clinicData.clinicConfig.bankInfo}
                    onChange={(e) =>
                      persistState((prev) => ({
                        ...prev,
                        clinicConfig: { ...prev.clinicConfig, bankInfo: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
              </div>

              {/* QR SIMPLE BOLIVIA & COPIAS DE SEGURIDAD */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                  <h3 className="font-serif text-lg font-bold">Imagen QR Simple de Cobro (Bolivia)</h3>
                  <p className="text-xs text-[#5C4D3C]">
                    Sube la captura de pantalla del QR de tu banco boliviano para que tus pacientes puedan pagarte directamente desde la web.
                  </p>
                  <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl bg-[#9A742C] text-white text-xs font-bold cursor-pointer hover:bg-[#7D5C1E]">
                    <Upload className="w-4 h-4" />
                    <span>Subir Imagen QR Simple (PNG/JPG)</span>
                    <input type="file" accept="image/*" onChange={handleQrImageUpload} className="hidden" />
                  </label>
                  {clinicData.clinicConfig.qrImageDataUrl && (
                    <div className="flex justify-center p-3 bg-[#FAF6EE] rounded-2xl border border-[#E6D9C0]">
                      <img src={clinicData.clinicConfig.qrImageDataUrl} alt="QR Simple" className="w-36 h-36 object-contain rounded-xl" />
                    </div>
                  )}
                </div>

                <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                  <h3 className="font-serif text-lg font-bold">Respaldo de Seguridad en 1 Clic</h3>
                  <p className="text-xs text-[#5C4D3C]">
                    Descarga una copia completa de todos tus pacientes, mediciones y recetas a tu computadora o celular cuando quieras.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleExportBackup}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#231F1A] text-[#DFBD69] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Respaldo</span>
                    </button>
                    <label className="flex-1 py-2.5 px-3 rounded-xl bg-[#FAF6EE] border border-[#9A742C] text-[#735318] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Restaurar Copia</span>
                      <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: LISTA DE MERCADO SEMANAL                                    */}
      {/* ==================================================================== */}
      {showGroceryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#DFC99B] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6D9C0] pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-[#9A742C]">Supermercado / Mercado Santa Cruz</span>
                <h3 className="font-serif text-xl font-bold">Lista de Compras Semanal GLP-1</h3>
              </div>
              <button onClick={() => setShowGroceryModal(false)} className="p-2 rounded-full hover:bg-[#FAF6EE] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {WEEKLY_GROCERY_LIST.map((cat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] space-y-2">
                  <div className="font-bold text-sm text-[#9A742C]">{cat.category}</div>
                  <ul className="space-y-1 text-xs sm:text-sm text-[#231F1A]">
                    {cat.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#9A742C] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: PAGO CON QR SIMPLE BOLIVIA + WHATSAPP + CONSENTIMIENTO      */}
      {/* ==================================================================== */}
      {showQrPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#DFC99B] shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6D9C0] pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-[#9A742C]">Inscripción & Reserva · Santa Cruz</span>
                <h3 className="font-serif text-xl font-bold">{selectedPublicPlan}</h3>
              </div>
              <button onClick={() => setShowQrPaymentModal(false)} className="p-2 rounded-full hover:bg-[#FAF6EE] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublicLeadSubmit} className="space-y-4">
              {/* Bloque QR Simple Bolivia */}
              <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#DFC99B] flex flex-col sm:flex-row items-center gap-4">
                <div className="w-32 h-32 rounded-2xl bg-white border border-[#E6D9C0] flex items-center justify-center shrink-0 p-2">
                  {clinicData.clinicConfig.qrImageDataUrl ? (
                    <img src={clinicData.clinicConfig.qrImageDataUrl} alt="QR Pago Bolivia" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center space-y-1">
                      <QrCode className="w-16 h-16 mx-auto text-[#231F1A]" />
                      <div className="text-[9px] font-bold text-[#9A742C]">QR SIMPLE BOLIVIA</div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 text-xs text-[#3D3326]">
                  <div className="font-bold text-sm text-[#231F1A]">Pago Rápido por QR Simple o Transferencia</div>
                  <p>{clinicData.clinicConfig.bankInfo}</p>
                  <p className="text-[#735318] font-medium">
                    Escanea el QR desde tu app bancaria (BNB, Mercantil, Ganadero, Bisa, Unión) o paga presencialmente en consultorio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Andrea Vargas"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Celular / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 76543210"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Tratamiento GLP-1 Actual</label>
                  <select
                    value={leadForm.currentMed}
                    onChange={(e) => setLeadForm({ ...leadForm, currentMed: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  >
                    <option>Tirzepatida (Mounjaro / Zepbound)</option>
                    <option>Semaglutida (Ozempic / Wegovy)</option>
                    <option>Aún no inicio / Busco evaluación médica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Fecha Preferida de Consulta</label>
                  <input
                    type="date"
                    value={leadForm.preferredDate}
                    onChange={(e) => setLeadForm({ ...leadForm, preferredDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0]">
                <span className="text-xs font-semibold text-[#5C4D3C]">
                  {leadForm.receiptFileName ? `Comprobante: ${leadForm.receiptFileName}` : '¿Ya realizaste el pago QR? Adjunta tu comprobante (opcional):'}
                </span>
                <label className="px-3 py-1.5 rounded-lg bg-white border border-[#9A742C] text-[#9A742C] text-xs font-bold cursor-pointer text-center">
                  Adjuntar Comprobante
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, receiptFileName: e.target.files?.[0]?.name || '' })
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {/* Consentimiento Informado Obligatorio */}
              <label className="flex items-start gap-2.5 text-xs text-[#5C4D3C] cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={leadForm.consentAccepted}
                  onChange={(e) => setLeadForm({ ...leadForm, consentAccepted: e.target.checked })}
                  className="mt-0.5 accent-[#9A742C]"
                />
                <span>
                  Acepto el resguardo confidencial de mis datos clínicos en <strong>Origen Médico</strong> y comprendo que el seguimiento digital complementa la consulta médica presencial sin sustituir atención de urgencias.
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#9A742C] hover:bg-[#7D5C1E] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar Registro y Abrir WhatsApp del Consultorio</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: ALTA RÁPIDA DE NUEVO PACIENTE (MÉDICO)                      */}
      {/* ==================================================================== */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#DFC99B] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6D9C0] pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-[#9A742C]">Alta Clínica en 30 Segundos</span>
                <h3 className="font-serif text-xl font-bold">Registrar Nuevo Paciente GLP-1</h3>
              </div>
              <button onClick={() => setShowNewPatientModal(false)} className="p-2 rounded-full hover:bg-[#FAF6EE] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">Nombre y Apellido del Paciente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Luis Fernando Ortiz"
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">WhatsApp (con 591)</label>
                  <input
                    type="text"
                    value={newPatientForm.phone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Edad</label>
                  <input
                    type="number"
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Peso Inicial (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPatientForm.weight}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, weight: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Masa Muscular (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPatientForm.muscle}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, muscle: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Molécula GLP-1</label>
                  <select
                    value={newPatientForm.medication}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, medication: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  >
                    <option value="Tirzepatida">Tirzepatida</option>
                    <option value="Semaglutida">Semaglutida</option>
                    <option value="Liraglutida">Liraglutida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Dosis Inicial</label>
                  <select
                    value={newPatientForm.currentDose}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, currentDose: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  >
                    {['0.25 mg', '0.50 mg', '1.0 mg', '2.5 mg', '5.0 mg', '7.5 mg'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5EFE2] text-xs text-[#735318]">
                La app calculará automáticamente su meta diaria de proteína (<strong>{Math.round((parseFloat(newPatientForm.weight) || 80) * 1.4)}g</strong>) e hidratación (<strong>{(((parseFloat(newPatientForm.weight) || 80) * 32) / 1000).toFixed(1)}L</strong>).
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#9A742C] hover:bg-[#7D5C1E] text-white font-bold text-sm cursor-pointer"
              >
                Crear Expediente y Activar App
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: RECETA FORMAL IMPRIMIBLE / PDF CON MEMBRETE ORIGEN MÉDICO   */}
      {/* ==================================================================== */}
      {printableRx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-[#9A742C] shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b-2 border-[#9A742C] pb-4">
              <OrigenMedicoLogo size={46} />
              <button onClick={() => setPrintableRx(null)} className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-0.5">
              <div className="font-bold text-sm text-gray-900">{clinicData.clinicConfig.doctorName}</div>
              <div>{clinicData.clinicConfig.license}</div>
              <div>{clinicData.clinicConfig.address} · {clinicData.clinicConfig.city}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#E6D9C0] space-y-1 text-xs">
              <div><strong>Paciente:</strong> {printableRx.patient.name} ({printableRx.patient.age} años)</div>
              <div><strong>Fecha de Emisión:</strong> {printableRx.rx.date}</div>
              <div><strong>Terapia Base:</strong> {printableRx.patient.medication} {printableRx.patient.currentDose}</div>
            </div>

            <div className="space-y-2 py-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Rp / Prescripción Médica:</div>
              <div className="text-lg font-bold text-gray-900">{printableRx.rx.brand}</div>
              <div className="text-xs font-semibold text-gray-600">Principio Activo: {printableRx.rx.generic}</div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 mt-2">
                <strong>Indicaciones:</strong> {printableRx.rx.dose}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-[#231F1A] text-[#DFBD69] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
              </button>
              <button
                onClick={() => setPrintableRx(null)}
                className="px-4 py-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
JavaScript
export default App;
