import React, { useState, useEffect, useMemo } from 'react';

// Cargar módulos secundarios solo cuando el usuario los abre reduce el bundle inicial.
const NutritionEducation = React.lazy(() => import('./NutritionEducation.jsx'));
const PatientPortal = React.lazy(() => import('./PatientPortal.jsx'));
const FinanceModule = React.lazy(() => import('./FinanceModule.jsx'));
import {
  Activity, AlertTriangle, ArrowRight, Award, Bell, BookOpen, Calendar,
  Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Clock,
  Copy, Download, Droplets, Edit3, ExternalLink, FileText, Flame,
  HeartPulse, HelpCircle, Info, Lock, MapPin, MessageCircle, Plus,
  Printer, QrCode, RefreshCw, Save, Scale, Search, Settings, ShieldAlert, Package,
  ShieldCheck, ShoppingBag, Sparkles, Stethoscope, Syringe, Trash2,
  TrendingDown, TrendingUp, Upload, User, UserPlus, Users, Utensils, X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, reload, signOut, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
// Firestore is connected through patient-scoped repositories in the migration phase.

// ============================================================================
// CONFIGURACIÓN DE PERSISTENCIA EN LA NUBE (FIREBASE FIRESTORE + AUTH)
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAs-O7G9rUF6q8lDZcDRaDOam8YHQsw-ic",
  authDomain: "origen-medico.firebaseapp.com",
  projectId: "origen-medico",
  storageBucket: "origen-medico.firebasestorage.app",
  messagingSenderId: "111024836345",
  appId: "1:111024836345:web:010b1c2b96e916c4fadc28"
};
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;

const getPatientActivityStatus = (lastAccessAt) => {
  if (!lastAccessAt) {
    return { label: 'Sin actividad', detail: 'Aún no ha iniciado sesión', className: 'bg-slate-100 text-slate-700' };
  }

  const lastAccess = new Date(lastAccessAt);
  if (Number.isNaN(lastAccess.getTime())) {
    return { label: 'Sin actividad', detail: 'Fecha de acceso no disponible', className: 'bg-slate-100 text-slate-700' };
  }

  const elapsedMs = Date.now() - lastAccess.getTime();
  if (elapsedMs < 0) {
    return { label: 'Acceso reciente', detail: 'Último acceso registrado', className: 'bg-emerald-100 text-emerald-800' };
  }

  const elapsedDays = Math.floor(elapsedMs / 86400000);
  if (elapsedDays <= 7) {
    return { label: 'Reciente', detail: elapsedDays === 0 ? 'Ingresó hoy' : `Ingresó hace ${elapsedDays} día(s)`, className: 'bg-emerald-100 text-emerald-800' };
  }

  if (elapsedDays > 30) {
    return { label: 'Inactivo', detail: `Sin ingresar hace ${elapsedDays} días`, className: 'bg-amber-100 text-amber-800' };
  }

  return { label: 'Actividad intermedia', detail: `Último ingreso hace ${elapsedDays} días`, className: 'bg-sky-100 text-sky-800' };
};

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
  {
    id: 'tirzepatida-tg-imfar',
    category: 'Agonistas GLP-1',
    generic: 'Tirzepatida',
    brand: 'TG · IMFAR S.R.L.',
    registrationStatus: 'Registro sanitario identificado en alerta oficial AGEMED',
    registrationNumbers: [
      'II-97037/2026', 'II-97039/2026', 'II-97040/2026',
      'II-97058/2026', 'II-97059', 'II-97062/2026'
    ],
    regulatoryNote: 'AGEMED identifica comercialización legal por IMFAR S.R.L. con los registros indicados. Verificar que el envase, titular/importador, presentación, lote y número impreso coincidan exactamente antes de considerar el producto.',
    alertNote: 'AGEMED también alertó sobre presentaciones TG de contrabando sin registro sanitario. La coincidencia del nombre TG por sí sola no acredita legitimidad.',
    sourceLabel: 'AGEMED · Alerta Nacional N° 082/2026',
    sourceUrl: 'https://www.agemed.gob.bo/archivo_farmacovigi/alertas/2026/ALERTA_082_2026.pdf',
    reviewedAt: '2026-11-17',
    status: 'verified_specific_registration'
  },
  {
    id: 'semaglutida-pending',
    category: 'Agonistas GLP-1',
    generic: 'Semaglutida',
    brand: 'Marcas y presentaciones por verificar',
    registrationStatus: 'Pendiente de verificación individual en el registro sanitario vigente',
    registrationNumbers: [],
    regulatoryNote: 'No se atribuye autorización sanitaria a una marca o presentación hasta contrastar su registro, titular, presentación y vigencia en el listado oficial de AGEMED.',
    alertNote: 'No sustituir la verificación del registro por el nombre comercial, país de origen o disponibilidad en redes sociales.',
    sourceLabel: 'AGEMED · Listado oficial diario de registros sanitarios',
    sourceUrl: 'https://apiwww.agemed.gob.bo/api/listautcom',
    reviewedAt: '2026-11-17',
    status: 'pending_verification'
  }
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
    whatsappNumber: '59176007523',
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
function App() {
  // Estado de autenticación y sincronización en la nube
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authStatusMessage, setAuthStatusMessage] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [patientInvitationToken, setPatientInvitationToken] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('activar') || '';
  });
  const [activationEmail, setActivationEmail] = useState('');
  const [activationPassword, setActivationPassword] = useState('');
  const [activationExistingAccount, setActivationExistingAccount] = useState(false);
  const [activationBusy, setActivationBusy] = useState(false);
  const [activationMessage, setActivationMessage] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationAwaitingVerification, setActivationAwaitingVerification] = useState(false);
  const [patientPortalProfile, setPatientPortalProfile] = useState(null);
  const [patientPortalData, setPatientPortalData] = useState(null);
  const [patientPortalLoading, setPatientPortalLoading] = useState(false);
  const [patientPortalError, setPatientPortalError] = useState('');
  const [patientDailyLog, setPatientDailyLog] = useState(null);
  const [patientActivityHistory, setPatientActivityHistory] = useState([]);
  const [patientDailyLogLoading, setPatientDailyLogLoading] = useState(false);
  const [patientDailyLogSaving, setPatientDailyLogSaving] = useState(false);
  const [patientDailyLogError, setPatientDailyLogError] = useState('');
  const [cloudInviteEmails, setCloudInviteEmails] = useState({});
  const [cloudInviteLoadingId, setCloudInviteLoadingId] = useState('');
  const [cloudInviteResult, setCloudInviteResult] = useState(null);
  const [legacyAuditBusy, setLegacyAuditBusy] = useState(false);
  const [legacyAuditResult, setLegacyAuditResult] = useState(null);
  const [legacyAuditError, setLegacyAuditError] = useState('');
  const [cloudPatients, setCloudPatients] = useState([]);
  const [cloudPatientSearch, setCloudPatientSearch] = useState('');
  const [cloudPatientsLoading, setCloudPatientsLoading] = useState(false);
  const [cloudPatientsError, setCloudPatientsError] = useState('');
  const [cloudPatientSaving, setCloudPatientSaving] = useState(false);
  const [selectedCloudPatient, setSelectedCloudPatient] = useState(null);
  const [cloudPatientDetailLoading, setCloudPatientDetailLoading] = useState(false);
  const [cloudPatientDetailError, setCloudPatientDetailError] = useState('');
  const [cloudProfileSaving, setCloudProfileSaving] = useState(false);
  const [cloudRecordTab, setCloudRecordTab] = useState('summary');
  const [cloudProfileForm, setCloudProfileForm] = useState({
    displayName: '', phone: '', ageYears: '', birthDate: '', sexAtBirth: '', heightCm: '',
    activeDiagnoses: '', medicalHistory: '', surgicalHistory: '', familyHistory: '', allergies: '',
    concomitantMedications: ''
  });
  const [cloudMeasurementSaving, setCloudMeasurementSaving] = useState(false);
  const [cloudMeasurementForm, setCloudMeasurementForm] = useState({
    weightKg: '', heightCm: '', waistCm: '', muscleKg: '', bodyFatPct: ''
  });
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'synced' | 'local'
  const [toastMessage, setToastMessage] = useState(null);

  // Estado maestro de todo el consultorio
  // Always start from clearly labeled demo data. Do not load clinical records
  // from localStorage; the patient-scoped Firestore repository is not active yet.
  const [clinicData, setClinicData] = useState(DEFAULT_CLINIC_STATE);

  // Navegación de modos principales
  const [appMode, setAppMode] = useState(() => patientInvitationToken ? 'activation' : 'public'); // 'public' | 'login' | 'activation' | 'patient_portal' | 'patient' (demo) | 'doctor'
  const [activePatientId, setActivePatientId] = useState('pat-sofia');
  const [patientTab, setPatientTab] = useState('today'); // 'today' | 'meals' | 'symptoms' | 'progress' | 'rx' | 'education'
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

  // Alta provisional bajo el namespace de Preview (sin tratamiento ni dosis).
  const [cloudPatientForm, setCloudPatientForm] = useState({
    displayName: '',
    phone: '',
    ageYears: '',
    birthDate: '',
    sexAtBirth: '',
    heightCm: '',
    weightKg: '',
    waistCm: '',
    muscleKg: '',
    bodyFatPct: ''
  });

  // Formulario nueva bioimpedancia
  const [newMetricForm, setNewMetricForm] = useState({
    weight: '',
    muscle: '',
    fatPct: '',
    waist: ''
  });


  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  const loadCloudPatients = async (userToUse = user) => {
    if (!userToUse || !isAdmin) {
      setCloudPatients([]);
      return;
    }

    setCloudPatientsLoading(true);
    setCloudPatientsError('');

    try {
      const idToken = await userToUse.getIdToken();
      const response = await fetch('/api/admin/patients', {
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('El namespace de Preview no está configurado. No se ha guardado ningún expediente.');
        }
        throw new Error(payload.error || 'No se pudo consultar la lista de pacientes.');
      }

      setCloudPatients(Array.isArray(payload.patients) ? payload.patients : []);
    } catch (err) {
      console.error('No se pudo cargar la lista de pacientes de prueba:', err);
      setCloudPatientsError(err.message || 'No se pudo consultar la base de pruebas.');
      setCloudPatients([]);
    } finally {
      setCloudPatientsLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadCloudPatients(user);
    } else {
      setCloudPatients([]);
      setCloudPatientsError('');
    }
  }, [user, isAdmin]);

  const handlePortalAccessChange = async (patient) => {
    if (!user || !isAdmin || !patient?.id) return;
    const currentlySuspended = patient.portalAccessStatus === 'suspended';
    const action = currentlySuspended ? 'reactivate' : 'suspend';
    const reason = window.prompt(
      currentlySuspended
        ? 'Motivo de la reactivación (opcional):'
        : 'Motivo de la suspensión (obligatorio):'
    );
    if (reason === null) return;
    if (!currentlySuspended && reason.trim().length < 5) {
      showToast('Escribe un motivo de al menos 5 caracteres.');
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/patients/${encodeURIComponent(patient.id)}/access`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason.trim() })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'No se pudo cambiar el acceso.');
      showToast(payload.message || 'Acceso actualizado.');
      await loadCloudPatients(user);
    } catch (error) {
      showToast(error.message || 'No se pudo cambiar el acceso.');
    }
  };

  const handleCreateCloudPatient = async (event) => {
    event.preventDefault();

    if (!user || !isAdmin) {
      setCloudPatientsError('Se requiere una sesión médica autorizada.');
      return;
    }

    setCloudPatientSaving(true);
    setCloudPatientsError('');

    try {
      const idToken = await user.getIdToken();
      const initialMeasurement = {
        weightKg: cloudPatientForm.weightKg,
        waistCm: cloudPatientForm.waistCm,
        muscleKg: cloudPatientForm.muscleKg,
        bodyFatPct: cloudPatientForm.bodyFatPct
      };

      const response = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: cloudPatientForm.displayName,
          phone: cloudPatientForm.phone,
          ageYears: cloudPatientForm.ageYears,
          birthDate: cloudPatientForm.birthDate,
          sexAtBirth: cloudPatientForm.sexAtBirth,
          heightCm: cloudPatientForm.heightCm,
          initialMeasurement
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('El namespace de Preview no está configurado. No se ha guardado ningún expediente.');
        }
        throw new Error(payload.error || 'No se pudo crear el expediente provisional.');
      }

      setCloudPatientForm({
        displayName: '',
        phone: '',
        ageYears: '',
        birthDate: '',
        sexAtBirth: '',
        heightCm: '',
        weightKg: '',
        waistCm: '',
        muscleKg: '',
        bodyFatPct: ''
      });
      showToast('Expediente provisional creado en el espacio de Preview.');
      await loadCloudPatients(user);
    } catch (err) {
      console.error('No se pudo crear el expediente provisional:', err);
      setCloudPatientsError(err.message || 'No se pudo crear el expediente.');
    } finally {
      setCloudPatientSaving(false);
    }
  };

  const loadCloudPatientDetails = async (patientId) => {
    if (!user || !isAdmin || !patientId) return;

    setCloudPatientDetailLoading(true);
    setCloudPatientDetailError('');

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/patients/${encodeURIComponent(patientId)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo abrir el expediente de prueba.');
      }

      setSelectedCloudPatient(payload);
      setCloudRecordTab('summary');
      setCloudProfileForm({
        displayName: payload.patient?.displayName || '',
        phone: (payload.patient?.phoneE164 || '').replace(/^\+/, ''),
        ageYears: Number(payload.patient?.ageYears) > 0 ? payload.patient.ageYears : '',
        birthDate: payload.patient?.birthDate || '',
        sexAtBirth: payload.patient?.sexAtBirth || '',
        heightCm: payload.patient?.heightCm ?? '',
        activeDiagnoses: payload.patient?.activeDiagnoses || '',
        medicalHistory: payload.patient?.medicalHistory || '',
        surgicalHistory: payload.patient?.surgicalHistory || '',
        familyHistory: payload.patient?.familyHistory || '',
        allergies: payload.patient?.allergies || '',
        concomitantMedications: payload.patient?.concomitantMedications || ''
      });
    } catch (err) {
      console.error('No se pudo abrir la ficha del paciente de prueba:', err);
      setCloudPatientDetailError(err.message || 'No se pudo abrir el expediente.');
      setSelectedCloudPatient(null);
    } finally {
      setCloudPatientDetailLoading(false);
    }
  };

  const handleSaveCloudProfile = async (event) => {
    event.preventDefault();
    const patientId = selectedCloudPatient?.patient?.id;
    if (!user || !isAdmin || !patientId) {
      setCloudPatientDetailError('Abre primero un expediente de prueba.');
      return;
    }
    setCloudProfileSaving(true);
    setCloudPatientDetailError('');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/patients/${encodeURIComponent(patientId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile: cloudProfileForm })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el perfil clínico.');
      showToast('Perfil clínico guardado en el espacio de pruebas.');
      await loadCloudPatientDetails(patientId);
      await loadCloudPatients(user);
    } catch (err) {
      console.error('No se pudo guardar el perfil clínico de prueba:', err);
      setCloudPatientDetailError(err.message || 'No se pudo guardar el perfil clínico.');
    } finally {
      setCloudProfileSaving(false);
    }
  };

  const handleCreateCloudMeasurement = async (event) => {
    event.preventDefault();

    if (!user || !isAdmin || !selectedCloudPatient?.patient?.id) {
      setCloudPatientDetailError('Abre primero un expediente de prueba.');
      return;
    }

    setCloudMeasurementSaving(true);
    setCloudPatientDetailError('');

    try {
      const idToken = await user.getIdToken();
      const measurement = {
        weightKg: cloudMeasurementForm.weightKg,
        heightCm: cloudMeasurementForm.heightCm,
        waistCm: cloudMeasurementForm.waistCm,
        muscleKg: cloudMeasurementForm.muscleKg,
        bodyFatPct: cloudMeasurementForm.bodyFatPct
      };

      const response = await fetch(
        `/api/admin/patients/${encodeURIComponent(selectedCloudPatient.patient.id)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ measurement })
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo registrar la medición.');
      }

      setCloudMeasurementForm({ weightKg: '', heightCm: '', waistCm: '', muscleKg: '', bodyFatPct: '' });
      showToast('Control registrado en la base de pruebas.');
      await loadCloudPatientDetails(selectedCloudPatient.patient.id);
      await loadCloudPatients(user);
    } catch (err) {
      console.error('No se pudo guardar la medición de prueba:', err);
      setCloudPatientDetailError(err.message || 'No se pudo guardar la medición.');
    } finally {
      setCloudMeasurementSaving(false);
    }
  };

  const loadPatientSession = async (account = user) => {
    if (!account) return null;

    const idToken = await account.getIdToken();
    const response = await fetch('/api/patient/session', {
      method: 'GET',
      headers: { Authorization: `Bearer ${idToken}` },
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(payload.error || 'No se pudo verificar el acceso del paciente.');
    }

    setPatientPortalProfile(payload.patient || null);
    return payload.patient || null;
  };

  const loadPatientPortalData = async (account = user) => {
    if (!account) return null;
    setPatientPortalLoading(true);
    setPatientPortalError('');

    try {
      const idToken = await account.getIdToken();
      const response = await fetch('/api/patient/profile', {
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo cargar tu expediente.');
      }

      const data = {
        patient: payload.patient || null,
        measurements: Array.isArray(payload.measurements) ? payload.measurements : []
      };
      setPatientPortalData(data);

      setPatientDailyLogLoading(true);
      setPatientDailyLogError('');
      setPatientDailyLog(payload.dailyLog || null);
      setPatientActivityHistory(Array.isArray(payload.activityHistory) ? payload.activityHistory : []);
      setPatientDailyLogLoading(false);
      return data;
    } catch (err) {
      console.error('No se pudo cargar el expediente del paciente:', err);
      setPatientPortalError(err.message || 'No se pudo cargar tu expediente.');
      setPatientPortalData(null);
      return null;
    } finally {
      setPatientPortalLoading(false);
    }
  };

  const handleSavePatientDailyLog = async (values) => {
    if (!user) {
      return { ok: false, message: 'Vuelve a iniciar sesión para guardar tu registro.' };
    }

    setPatientDailyLogSaving(true);
    setPatientDailyLogError('');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/patient/profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values),
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'No se pudo guardar el registro diario.');
      setPatientDailyLog(payload.dailyLog || null);
      setPatientActivityHistory((current) => {
        const next = [...current.filter((entry) => entry.dateKey !== payload.dailyLog?.dateKey), {
          dateKey: payload.dailyLog?.dateKey,
          activityMinutes: payload.dailyLog?.activityMinutes ?? values.activityMinutes
        }].filter((entry) => entry.dateKey);
        return next.sort((left, right) => left.dateKey.localeCompare(right.dateKey)).slice(-7);
      });
      return { ok: true };
    } catch (saveError) {
      const message = saveError.message || 'No se pudo guardar el registro. Inténtalo nuevamente.';
      setPatientDailyLogError(message);
      return { ok: false, message };
    } finally {
      setPatientDailyLogSaving(false);
    }
  };

  const handleCreatePatientInvitation = async (patientId) => {
    const email = (cloudInviteEmails[patientId] || '').trim();
    if (!email) {
      setCloudPatientsError('Introduce el correo electrónico que utilizará el paciente.');
      return;
    }

    if (!user || !isAdmin) {
      setCloudPatientsError('Solo el médico puede crear invitaciones.');
      return;
    }

    setCloudInviteLoadingId(patientId);
    setCloudPatientsError('');
    setCloudInviteResult(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ patientId, email })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo crear la invitación.');
      }

      // When Preview is protected by Vercel Authentication, carry only its
      // short-lived share parameter into the activation link. The invitation
      // token remains in the URL fragment and is never sent in HTTP requests.
      const activationUrlObject = new URL(window.location.origin);
      const previewShareToken = new URLSearchParams(window.location.search).get('_vercel_share');
      if (previewShareToken) {
        activationUrlObject.searchParams.set('_vercel_share', previewShareToken);
      }
      activationUrlObject.hash = `activar=${payload.invitation.token}`;
      const activationUrl = activationUrlObject.toString();
      setCloudInviteResult({
        patientId,
        email: payload.invitation.email,
        activationUrl,
        expiresAt: payload.invitation.expiresAt
      });
      showToast('Invitación creada. Copia el enlace para compartirlo.');
      await loadCloudPatients(user);
    } catch (err) {
      console.error('No se pudo crear la invitación del paciente:', err);
      setCloudPatientsError(err.message || 'No se pudo crear la invitación.');
    } finally {
      setCloudInviteLoadingId('');
    }
  };

  const handleCopyInvitationLink = async () => {
    if (!cloudInviteResult?.activationUrl) return;
    try {
      await navigator.clipboard.writeText(cloudInviteResult.activationUrl);
      showToast('Enlace de invitación copiado.');
    } catch {
      setCloudPatientsError('No se pudo copiar automáticamente. Selecciona y copia el enlace mostrado.');
    }
  };

  const completePatientInvitation = async (account = auth?.currentUser) => {
    if (!account || !patientInvitationToken) {
      setActivationError('Abre el enlace de invitación completo para continuar.');
      return;
    }

    setActivationBusy(true);
    setActivationError('');
    setActivationMessage('');

    try {
      await reload(account);
      if (!account.emailVerified) {
        setActivationAwaitingVerification(true);
        setActivationMessage('Todavía no aparece la verificación. Abre el correo de Firebase, confirma tu dirección y vuelve a pulsar «Ya verifiqué mi correo».');
        return;
      }

      const idToken = await account.getIdToken(true);
      const response = await fetch('/api/invitations/redeem', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: patientInvitationToken })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo activar la invitación.');
      }

      setUser(account);
      setIsAdmin(false);
      const linkedPatient = await loadPatientSession(account);
      setActivationMessage('Tu cuenta quedó vinculada correctamente a tu expediente.');
      setActivationAwaitingVerification(false);
      setActivationPassword('');
      setAppMode('patient_portal');
      setPatientInvitationToken('');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      if (linkedPatient) setPatientPortalProfile(linkedPatient);
    } catch (err) {
      console.error('No se pudo completar la activación del paciente:', err);
      setActivationError(err.message || 'No se pudo activar la cuenta.');
    } finally {
      setActivationBusy(false);
    }
  };

  const handlePatientInvitationActivation = async (event) => {
    event.preventDefault();
    setActivationError('');
    setActivationMessage('');

    if (!auth || !patientInvitationToken) {
      setActivationError('El enlace de invitación no es válido.');
      return;
    }

    if (isAdmin) {
      setActivationError('Para evitar cerrar tu sesión médica, abre este enlace en una ventana privada o en el dispositivo del paciente.');
      return;
    }

    setActivationBusy(true);
    try {
      const email = activationEmail.trim().toLowerCase();
      const validationResponse = await fetch('/api/invitations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: patientInvitationToken, email })
      });
      const validationPayload = await validationResponse.json().catch(() => ({}));

      if (!validationResponse.ok || validationPayload.valid !== true) {
        throw new Error(validationPayload.error || 'La invitación no corresponde a este correo o ha vencido.');
      }

      const credential = activationExistingAccount
        ? await signInWithEmailAndPassword(auth, email, activationPassword)
        : await createUserWithEmailAndPassword(auth, email, activationPassword);

      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        setUser(credential.user);
        setActivationAwaitingVerification(true);
        setActivationMessage('Cuenta preparada. Enviamos un correo de verificación. Abre ese mensaje, confirma tu dirección y vuelve a esta pestaña para finalizar la vinculación.');
        return;
      }

      await completePatientInvitation(credential.user);
    } catch (err) {
      console.error('Error durante la activación del paciente:', err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setActivationError('Ese correo ya tiene una cuenta. Selecciona «Ya tengo una cuenta» e ingresa con tu contraseña.');
      } else if (code === 'auth/weak-password') {
        setActivationError('La contraseña debe tener al menos 6 caracteres.');
      } else if (code === 'auth/invalid-credential') {
        setActivationError('Correo o contraseña incorrectos.');
      } else if (code === 'auth/too-many-requests') {
        setActivationError('Demasiados intentos. Espera un momento e inténtalo nuevamente.');
      } else {
        setActivationError(err.message || 'No se pudo preparar la cuenta.');
      }
    } finally {
      setActivationBusy(false);
    }
  };

  const handleConfirmPatientEmail = async () => {
    await completePatientInvitation(auth?.currentUser);
  };

  const handlePasswordReset = async () => {
    const email = loginEmail.trim();
    setAuthError('');
    setAuthStatusMessage('');

    if (!email) {
      setAuthError('Escribe tu correo electrónico para enviarte el enlace de recuperación.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setAuthStatusMessage('Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.');
    } catch (err) {
      console.error('No se pudo solicitar recuperación de contraseña:', err);
      setAuthError('No se pudo enviar el enlace de recuperación. Verifica el correo e inténtalo más tarde.');
    }
  };

  const handlePatientPortalClick = async () => {
    if (isAdmin) {
      setAppMode('patient');
      return;
    }

    if (!user) {
      setAuthError('');
      setAppMode('login');
      return;
    }

    try {
      const linkedPatient = await loadPatientSession(user);
      if (linkedPatient) {
        setAppMode('patient_portal');
      } else {
        setAppMode('public');
        showToast('Esta cuenta todavía no está vinculada a un expediente.');
      }
    } catch (err) {
      setAuthError(err.message || 'No se pudo validar la cuenta del paciente.');
      setAppMode('login');
    }
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setAuthError('');

    if (!auth) {
      setAuthError('El servicio de autenticación no está disponible. Inténtalo más tarde.');
      return;
    }

    setAuthBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        loginEmail.trim(),
        loginPassword
      );

      let tokenResult = await getIdTokenResult(credential.user, true);

      // A verified patient with a consumed invitation is routed to their own
      // server-resolved profile before attempting the protected admin bootstrap.
      if (tokenResult.claims.admin !== true) {
        const patientProfile = await loadPatientSession(credential.user);
        if (patientProfile) {
          setIsAdmin(false);
          setPatientPortalProfile(patientProfile);
          setLoginPassword('');
          setAuthError('');
          setAppMode('patient_portal');
          return;
        }
      }

      // Only the account preconfigured in private Vercel variables can receive admin:true.
      if (tokenResult.claims.admin !== true) {
        const idToken = await credential.user.getIdToken();
        const response = await fetch('/api/admin/bootstrap', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` }
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? 'La cuenta ingresó correctamente, pero todavía no tiene autorización de médico.'
              : payload.error || 'No se pudo verificar el rol del administrador.'
          );
        }

        tokenResult = await getIdTokenResult(credential.user, true);
      }

      if (tokenResult.claims.admin !== true) {
        throw new Error('La cuenta no tiene un rol médico habilitado.');
      }

      setIsAdmin(true);
      setLoginPassword('');
      setAuthError('');
      setAppMode('doctor');
    } catch (err) {
      console.error('Error de inicio de sesión:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setAuthError('Correo o contraseña incorrectos.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Se hicieron demasiados intentos. Espera un momento e inténtalo nuevamente.');
      } else {
        setAuthError(err.message || 'No se pudo iniciar sesión.');
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setIsAdmin(false);
      setPatientPortalProfile(null);
      setAppMode('public');
      setClinicData(DEFAULT_CLINIC_STATE);
      try {
        localStorage.removeItem('origen_medico_clinic_v1');
      } catch (err) {
        console.warn('No se pudo limpiar el almacenamiento local:', err);
      }
    } catch (err) {
      showToast('No se pudo cerrar la sesión. Inténtalo nuevamente.');
    }
  };

  const handleLegacyAudit = async () => {
    if (!user || !isAdmin) {
      setLegacyAuditError('Se requiere una sesión de médico autorizada.');
      return;
    }

    setLegacyAuditBusy(true);
    setLegacyAuditError('');
    setLegacyAuditResult(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/legacy-audit', {
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo revisar el almacenamiento anterior.');
      }

      setLegacyAuditResult(payload);
    } catch (err) {
      console.error('Error en auditoría de datos antiguos:', err);
      setLegacyAuditError(err.message || 'No se pudo completar la auditoría.');
    } finally {
      setLegacyAuditBusy(false);
    }
  };

  // 1. Autenticación Firebase: nunca crear sesiones anónimas para acceder a datos clínicos.
  useEffect(() => {
    if (!auth) {
      setSyncStatus('local');
      setAuthReady(true);
      return;
    }

    const clearLegacyClinicalCache = () => {
      try {
        localStorage.removeItem('origen_medico_clinic_v1');
      } catch (err) {
        console.warn('No se pudo limpiar el almacenamiento local:', err);
      }
      setClinicData(DEFAULT_CLINIC_STATE);
    };

    const unsub = onAuthStateChanged(auth, async (u) => {
      // Older versions created persistent anonymous sessions. They must not
      // be treated as an account or be allowed to keep legacy clinical cache.
      if (u?.isAnonymous) {
        setUser(null);
        setIsAdmin(false);
        setAuthReady(false);
        setSyncStatus('local');
        setAppMode('public');
        clearLegacyClinicalCache();
        try {
          await signOut(auth);
        } catch (err) {
          console.error('No se pudo cerrar la sesión anónima heredada:', err);
          setAuthReady(true);
        }
        return;
      }

      setUser(u);
      // Remove all legacy clinical cache on every auth transition, including
      // the administrator session. The old monolithic record is not a source
      // of truth and must not be restored into browser memory.
      clearLegacyClinicalCache();
      setSyncStatus('local');

      if (!u) {
        setIsAdmin(false);
        setPatientPortalProfile(null);
        setAuthReady(true);
        setAppMode(patientInvitationToken ? 'activation' : 'public');
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(u);
        const admin = tokenResult.claims.admin === true;
        setIsAdmin(admin);

        if (admin) {
          setPatientPortalProfile(null);
          setAppMode(patientInvitationToken ? 'activation' : 'doctor');
        } else if (patientInvitationToken) {
          setAppMode('activation');
        } else if (tokenResult.claims.email_verified === true) {
          const idToken = await u.getIdToken();
          const response = await fetch('/api/patient/session', {
            method: 'GET',
            headers: { Authorization: `Bearer ${idToken}` },
            cache: 'no-store'
          });
          const payload = await response.json().catch(() => ({}));

          if (response.ok && payload.linked === true && payload.patient) {
            setPatientPortalProfile(payload.patient);
            setAppMode('patient_portal');
          } else {
            setPatientPortalProfile(null);
            setAppMode('login');
          }
        } else {
          setPatientPortalProfile(null);
          setAppMode('login');
        }
      } catch (err) {
        console.error('No se pudo verificar el rol o la cuenta del paciente:', err);
        setIsAdmin(false);
        setPatientPortalProfile(null);
        setAppMode(patientInvitationToken ? 'activation' : 'login');
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, [patientInvitationToken]);

  // 2. The legacy shared Firestore document is intentionally disconnected.
  useEffect(() => {
    if (appMode === 'patient_portal' && user && !isAdmin) {
      loadPatientPortalData(user);
    } else {
      setPatientPortalData(null);
      setPatientPortalError('');
      setPatientPortalLoading(false);
    }
  }, [appMode, user, isAdmin]);

  // Clinical sync will only be re-enabled after the individual-patient
  // repositories, account mappings and end-to-end security checks are complete.
  useEffect(() => {
    setSyncStatus('local');
  }, [user, isAdmin]);

  // Temporary write guard: never save clinical data to localStorage or to the
  // legacy shared document. Each module will be switched to its own repository.
  const persistState = () => {
    if (!isAdmin) {
      setToastMessage('Inicia sesión con una cuenta médica autorizada.');
      return;
    }
    setToastMessage('La migración a expedientes individuales sigue en curso. No se guardó ningún cambio.');
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
  // Filtrado de Vademécum
  const filteredVademecum = useMemo(() => {
    const q = vademecumSearch.trim().toLowerCase();
    return BOLIVIA_VADEMECUM.filter((item) =>
      !q || [item.generic, item.brand, item.category, item.registrationStatus]
        .some((value) => String(value || '').toLowerCase().includes(q))
    );
  }, [vademecumSearch]);

  const vademecumCategories = ['Todas', 'Agonistas GLP-1'];

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

      {/* BARRA SUPERIOR DE NAVEGACIÓN CON ACCESOS SEGÚN ROL */}
      <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E6D9C0] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center justify-between">
            <OrigenMedicoLogo size={42} />
            <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#F5EFE2] border border-[#E6D9C0] text-[#735318] lg:hidden">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isAdmin ? (syncStatus === 'synced' ? 'Nube Activa' : 'Sin sincronización') : appMode === 'patient_portal' ? 'Cuenta paciente' : 'Vista pública'}
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
              onClick={handlePatientPortalClick}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                appMode === 'patient' || appMode === 'patient_portal'
                  ? 'bg-[#9A742C] text-white shadow-sm'
                  : 'text-[#5C4D3C] hover:bg-[#FAF6EE]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>App Paciente</span>
            </button>

            {isAdmin && (
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
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-xl border border-[#E6D9C0] text-xs font-semibold text-[#735318] hover:bg-[#FAF6EE]"
              >
                Cerrar sesión
              </button>
            ) : (
              <button
                onClick={() => { setAuthError(''); setAppMode('login'); }}
                className="px-3 py-2 rounded-xl bg-[#231F1A] text-[#DFBD69] text-xs font-semibold hover:bg-[#3D3326]"
              >
                Ingresar
              </button>
            )}
          </div>

          {/* INDICADOR DE SINCRONIZACIÓN EN LA NUBE */}
          <div className="hidden lg:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[#F5EFE2] border border-[#E6D9C0] text-[#735318]">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-medium">
              {isAdmin
                ? (syncStatus === 'synced' ? 'Sincronizado en la Nube' : 'Sin sincronización clínica')
                : appMode === 'patient_portal' ? 'Cuenta de paciente verificada' : 'Vista pública · sin datos clínicos'}
            </span>
          </div>
        </div>
      </header>

      {/* ACCESO PRIVADO */}
      {appMode === 'login' && (
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-12">
          <section className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] shadow-sm p-6 sm:p-9 space-y-6">
            <div className="text-center space-y-2">
              <OrigenMedicoLogo size={58} />
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Acceso seguro</p>
              <h1 className="font-serif text-3xl font-bold text-[#231F1A]">Ingresar a ORIGEN Médico</h1>
              <p className="text-sm text-[#5C4D3C]">
                Ingresa con correo y contraseña. El panel médico o el portal individual se habilitan según los permisos verificados en Firebase.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="origen-login-email" className="block text-xs font-bold text-[#735318] mb-1">Correo electrónico</label>
                <input
                  id="origen-login-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm outline-none focus:border-[#9A742C]"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label htmlFor="origen-login-password" className="block text-xs font-bold text-[#735318] mb-1">Contraseña</label>
                <input
                  id="origen-login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm outline-none focus:border-[#9A742C]"
                  placeholder="Tu contraseña"
                />
              </div>

              {authError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {authError}
                </div>
              )}
              {authStatusMessage && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {authStatusMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={authBusy || !authReady}
                className="w-full rounded-xl bg-[#9A742C] hover:bg-[#7D5C1E] disabled:opacity-60 text-white font-bold py-3 text-sm"
              >
                {authBusy ? 'Verificando cuenta…' : 'Ingresar de forma segura'}
              </button>

              <button
                type="button"
                onClick={handlePasswordReset}
                className="w-full text-sm text-[#735318] underline underline-offset-4"
              >
                ¿Olvidaste tu contraseña? Enviar recuperación por correo
              </button>

              <button
                type="button"
                onClick={() => { setAuthError(''); setAuthStatusMessage(''); setAppMode('public'); }}
                className="w-full rounded-xl border border-[#E6D9C0] text-[#735318] font-semibold py-3 text-sm"
              >
                Volver al acceso público
              </button>
            </form>
          </section>
        </main>
      )}

      {/* ACTIVACIÓN SEGURA DE CUENTA DE PACIENTE POR INVITACIÓN */}
      {appMode === 'activation' && (
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
          <section className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] shadow-sm p-6 sm:p-9 space-y-6">
            <div className="text-center space-y-2">
              <OrigenMedicoLogo size={58} />
              <p className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Invitación privada</p>
              <h1 className="font-serif text-3xl font-bold text-[#231F1A]">Activar cuenta de paciente</h1>
              <p className="text-sm text-[#5C4D3C]">
                La invitación está ligada al correo que indicó el consultorio. No necesitas pagar ni introducir datos clínicos para activar tu acceso.
              </p>
            </div>

            {isAdmin && (
              <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                Estás dentro de la sesión médica. Abre este enlace en una ventana privada o en el dispositivo del paciente para no reemplazar tu sesión de administrador.
              </div>
            )}

            {!activationAwaitingVerification && (
              <form onSubmit={handlePatientInvitationActivation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#735318] mb-1">Correo invitado</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={activationEmail}
                    onChange={(event) => setActivationEmail(event.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#735318] mb-1">
                    {activationExistingAccount ? 'Contraseña de tu cuenta' : 'Crear contraseña'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={activationExistingAccount ? 'current-password' : 'new-password'}
                    value={activationPassword}
                    onChange={(event) => setActivationPassword(event.target.value)}
                    placeholder="Al menos 6 caracteres"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={activationBusy || isAdmin}
                  className="w-full rounded-xl bg-[#9A742C] hover:bg-[#7D5C1E] disabled:opacity-50 text-white font-bold py-3 text-sm"
                >
                  {activationBusy ? 'Validando invitación…' : activationExistingAccount ? 'Ingresar y activar expediente' : 'Crear cuenta y enviar verificación'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivationExistingAccount((value) => !value);
                    setActivationError('');
                    setActivationMessage('');
                  }}
                  className="w-full text-sm text-[#735318] underline underline-offset-4"
                >
                  {activationExistingAccount ? 'Necesito crear una cuenta nueva' : 'Ya tengo una cuenta de ORIGEN Médico'}
                </button>

                {activationExistingAccount && (
                  <button
                    type="button"
                    onClick={async () => {
                      const email = activationEmail.trim();
                      if (!email) {
                        setActivationError('Escribe primero el correo invitado.');
                        return;
                      }
                      try {
                        await sendPasswordResetEmail(auth, email);
                        setActivationMessage('Si existe una cuenta con ese correo, Firebase enviará instrucciones para restablecer la contraseña.');
                        setActivationError('');
                      } catch (err) {
                        setActivationError('No se pudo enviar el enlace de recuperación. Inténtalo nuevamente.');
                      }
                    }}
                    className="w-full text-sm text-[#735318] underline underline-offset-4"
                  >
                    Olvidé mi contraseña
                  </button>
                )}
              </form>
            )}

            {activationAwaitingVerification && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {activationMessage || 'Revisa tu correo electrónico y confirma tu dirección.'}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmPatientEmail}
                  disabled={activationBusy}
                  className="w-full rounded-xl bg-[#9A742C] hover:bg-[#7D5C1E] disabled:opacity-50 text-white font-bold py-3 text-sm"
                >
                  {activationBusy ? 'Comprobando correo…' : 'Ya verifiqué mi correo'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const account = auth?.currentUser;
                      if (!account) throw new Error('Vuelve a ingresar con el correo invitado.');
                      await sendEmailVerification(account);
                      setActivationMessage('Enviamos otro correo de verificación. Revisa también la carpeta de spam.');
                    } catch (err) {
                      setActivationError(err.message || 'No se pudo reenviar el correo.');
                    }
                  }}
                  className="w-full text-sm text-[#735318] underline underline-offset-4"
                >
                  Reenviar correo de verificación
                </button>
              </div>
            )}

            {activationError && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {activationError}
              </div>
            )}
            {!activationAwaitingVerification && activationMessage && (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {activationMessage}
              </div>
            )}

            <p className="text-[11px] text-[#7A6A54]">
              La invitación vence a los 7 días y se usa una sola vez. ORIGEN Médico nunca te pedirá tu contraseña por WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => setAppMode('public')}
              className="w-full rounded-xl border border-[#E6D9C0] text-[#735318] font-semibold py-3 text-sm"
            >
              Volver al acceso público
            </button>
          </section>
        </main>
      )}

      {appMode === 'patient_portal' && (
        <React.Suspense fallback={<div className="mx-auto max-w-4xl p-6 text-sm text-[#735318]">Cargando portal del paciente…</div>}>
          <PatientPortal
            profile={patientPortalProfile}
            data={patientPortalData}
            loading={patientPortalLoading}
            error={patientPortalError}
            dailyLog={patientDailyLog}
            activityHistory={patientActivityHistory}
            dailyLogLoading={patientDailyLogLoading}
            dailyLogError={patientDailyLogError}
            dailyLogSaving={patientDailyLogSaving}
            onSaveDailyLog={handleSavePatientDailyLog}
            onRefresh={() => loadPatientPortalData(user)}
          />
        </React.Suspense>
      )}

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
          {syncStatus !== 'synced' && (
            <div role="alert" className="rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong className="block font-bold">VISTA DE DEMOSTRACIÓN · DATOS FICTICIOS</strong>
              <span>Este selector y los registros mostrados son ejemplos. No corresponden a pacientes reales y no deben utilizarse para seguimiento clínico. El portal individual estará disponible cuando termine la migración de expedientes.</span>
            </div>
          )}
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
              { id: 'rx', label: 'Recetas & Farmacorp/Chávez', icon: FileText, count: currentPatient.prescriptions.length },
              { id: 'education', label: 'Centro Educativo', icon: BookOpen }
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

          {/* CENTRO EDUCATIVO: COMPONENTE INDEPENDIENTE, SIN PERSISTENCIA CLÍNICA */}
          {patientTab === 'education' && (
            <React.Suspense fallback={<div className="rounded-2xl bg-[#FAF6EE] p-5 text-sm text-[#735318]">Cargando material educativo…</div>}>
              <NutritionEducation />
            </React.Suspense>
          )}

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

              <div className="rounded-3xl border border-[#E6D9C0] bg-[#FAF6EE] p-5 space-y-2">
                <div className="flex items-center gap-2 text-[#735318] font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  Información farmacológica supervisada
                </div>
                <p className="text-xs text-[#5C4D3C]">
                  La referencia de medicamentos es una herramienta interna del equipo profesional. No se muestran recomendaciones de automedicación, precios ni botones para solicitar recetas. Consulta cualquier síntoma o duda sobre tu tratamiento directamente con tu médico.
                </p>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ==================================================================== */}
      {/* MODO 3: PANEL CLÍNICO DEL DR. JOSÉ RODOLFO MELGAR LIZARAZU           */}
      {/* ==================================================================== */}
      {appMode === 'doctor' && isAdmin && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {syncStatus !== 'synced' && (
            <div role="alert" className="rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong className="block font-bold">ENTORNO DE DEMOSTRACIÓN · NO USAR CON PACIENTES REALES</strong>
              <span>Los pacientes, medidas, solicitudes y recetas que aparecen son registros ficticios. La sincronización clínica está deshabilitada mientras migramos a expedientes independientes. No registres ni modifiques información clínica aquí.</span>
            </div>
          )}
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
                onClick={() => setDoctorTab('cloud_patients')}
                disabled={!isAdmin}
                title="Abrir alta provisional en el espacio de Preview"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#DFBD69] hover:bg-[#C59B43] disabled:opacity-50 disabled:cursor-not-allowed text-[#231F1A] font-bold text-xs sm:text-sm shadow-sm cursor-pointer"
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
              { id: 'cloud_patients', label: 'Expedientes clínicos (Pruebas)', icon: Users },
              { id: 'patient_detail', label: 'Expediente local (respaldo)', icon: ClipboardCheck },
              { id: 'vademecum', label: 'Vademécum GLP-1 (31 Marcas Bolivia)', icon: BookOpen },
              { id: 'settings', label: 'Configuración Consultorio (Sin Código)', icon: Settings },
              { id: 'finance', label: 'ORIGEN Finanzas', icon: Package }
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

          {/* DOCTOR TAB: EXPEDIENTES EN BASE DE PRUEBAS AISLADA */}
          {doctorTab === 'cloud_patients' && (
            <div className="space-y-5">
              <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <strong className="block font-bold">ENTORNO DE PRUEBAS · NO USAR CON PACIENTES REALES</strong>
                <span>Este es el espacio principal para revisar expedientes ficticios en Preview. Los registros se guardan bajo `previewEnvironments/mejoras-seguridad-origen`; permanecen separados de la colección clínica de producción y no habilitan por sí solos el portal del paciente.</span>
              </div>
              <div className="rounded-3xl border border-[#E6D9C0] bg-[#FFFDF9] p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#9A742C]">Expediente clínico · Vista de trabajo</span>
                <h2 className="font-serif text-2xl font-bold text-[#231F1A]">Expedientes de pacientes de prueba</h2>
                <p className="text-sm text-[#6F6250]">Selecciona un registro para consultar su resumen, historia clínica básica y evolución antropométrica. Puedes crear controles ficticios y revisar el estado de vinculación sin alterar los datos del expediente local de demostración.</p>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#735318]">
                  <span className="rounded-full bg-[#FAF6EE] px-3 py-1">Resumen y evolución</span>
                  <span className="rounded-full bg-[#FAF6EE] px-3 py-1">Historia clínica</span>
                  <span className="rounded-full bg-[#FAF6EE] px-3 py-1">Antropometría</span>
                  <span className="rounded-full bg-[#FAF6EE] px-3 py-1">Invitaciones y acceso</span>
                </div>
              </div>

              {cloudPatientsError && (
                <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  {cloudPatientsError}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <form onSubmit={handleCreateCloudPatient} className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#9A742C]">Nuevo registro provisional</span>
                    <h2 className="font-serif text-2xl font-bold">Crear expediente de prueba</h2>
                    <p className="text-xs text-[#6F6250] mt-1">Perfil básico y medición inicial opcional. No se registran medicamentos ni dosis en este paso.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Nombre de prueba *</label>
                    <input
                      required
                      minLength={2}
                      maxLength={120}
                      value={cloudPatientForm.displayName}
                      onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Ej. Paciente de prueba 001"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">WhatsApp (opcional)</label>
                      <input
                        value={cloudPatientForm.phone}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="71234567"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Edad (opcional)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={cloudPatientForm.ageYears}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, ageYears: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Fecha de nacimiento (opcional)</label>
                      <input
                        type="date"
                        value={cloudPatientForm.birthDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Sexo biológico (opcional)</label>
                      <select
                        value={cloudPatientForm.sexAtBirth}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, sexAtBirth: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      >
                        <option value="">No especificado</option>
                        <option value="female">Femenino</option>
                        <option value="male">Masculino</option>
                        <option value="intersex">Intersexual</option>
                        <option value="not_specified">Prefiere no especificar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Talla (cm)</label>
                      <input
                        type="number"
                        min="80"
                        max="250"
                        step="0.1"
                        value={cloudPatientForm.heightCm}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, heightCm: e.target.value }))}
                        placeholder="Ej. 170"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Peso inicial (kg)</label>
                      <input
                        type="number"
                        min="20"
                        max="400"
                        step="0.1"
                        value={cloudPatientForm.weightKg}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Cintura (cm)</label>
                      <input
                        type="number"
                        min="30"
                        max="250"
                        step="0.1"
                        value={cloudPatientForm.waistCm}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, waistCm: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Músculo (kg)</label>
                      <input
                        type="number"
                        min="2"
                        max="150"
                        step="0.1"
                        value={cloudPatientForm.muscleKg}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, muscleKg: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Grasa corporal (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="75"
                        step="0.1"
                        value={cloudPatientForm.bodyFatPct}
                        onChange={(e) => setCloudPatientForm((prev) => ({ ...prev, bodyFatPct: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cloudPatientSaving || !user || !isAdmin}
                    className="w-full py-3 rounded-2xl bg-[#9A742C] text-white text-sm font-bold disabled:opacity-50"
                  >
                    {cloudPatientSaving ? 'Guardando en pruebas…' : 'Crear expediente provisional'}
                  </button>
                  <p className="text-[11px] text-[#7A6A54]">El expediente quedará como «Pendiente de cuenta». La vinculación de usuario se implementará por separado con una invitación segura.</p>
                </form>

                <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase text-[#9A742C]">Base de pruebas</span>
                      <h2 className="font-serif text-2xl font-bold">Expedientes en nube</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadCloudPatients(user)}
                      disabled={cloudPatientsLoading}
                      className="px-3 py-2 rounded-xl border border-[#E6D9C0] text-xs font-bold disabled:opacity-50"
                    >
                      {cloudPatientsLoading ? 'Actualizando…' : 'Actualizar'}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="search"
                      value={cloudPatientSearch}
                      onChange={(event) => setCloudPatientSearch(event.target.value)}
                      placeholder="Buscar por nombre, correo o teléfono"
                      aria-label="Buscar pacientes por nombre, correo o teléfono"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-sm"
                    />
                  </div>

                  {cloudPatientsLoading && <p className="text-sm text-[#6F6250]">Consultando la base de pruebas…</p>}

                  {!cloudPatientsLoading && cloudPatients.length === 0 && !cloudPatientsError && (
                    <div className="rounded-2xl bg-[#FAF6EE] p-5 text-sm text-[#6F6250]">
                      Todavía no hay expedientes ficticios en el espacio de Preview.
                    </div>
                  )}

                  <div className="space-y-2">
                    {cloudPatients.filter((patient) => {
                      const query = cloudPatientSearch.trim().toLowerCase();
                      if (!query) return true;
                      return [patient.displayName, patient.email, patient.invitedEmail, patient.phoneE164]
                        .some((value) => String(value || '').toLowerCase().includes(query));
                    }).map((patient) => (
                      <div key={patient.id} className="rounded-2xl border border-[#E6D9C0] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm">{patient.displayName}</strong>
                          <span className={`text-[10px] rounded-full px-2 py-1 font-bold ${
                            patient.accountStatus === 'linked'
                              ? 'bg-emerald-100 text-emerald-800'
                              : patient.accountStatus === 'invited'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {patient.accountStatus === 'linked' ? 'Cuenta vinculada' : patient.accountStatus === 'invited' ? 'Invitación pendiente' : 'Pendiente de cuenta'}
                          </span>
                        </div>
                        <p className="text-xs text-[#6F6250]">{patient.phoneE164 || 'Sin teléfono'}{patient.ageYears ? ` · ${patient.ageYears} años` : ''}</p>
                        {(patient.email || patient.invitedEmail || patient.lastAccessAt) && (
                          <div className="rounded-xl bg-[#FAF6EE] px-3 py-2 space-y-1">
                            {(patient.email || patient.invitedEmail) && (
                              <>
                                <p className="flex items-start gap-2 text-xs text-[#735318] break-all">
                                  <span aria-hidden="true">✉</span>
                                  <span>{patient.email || patient.invitedEmail}</span>
                                </p>
                                <p className="text-[10px] font-semibold text-emerald-700">
                                  {patient.accountStatus === 'linked' ? 'Correo vinculado y verificado' : patient.accountStatus === 'invited' ? 'Correo de invitación' : 'Correo pendiente de vinculación'}
                                </p>
                              </>
                            )}
                            {patient.linkedAt && <p className="text-[10px] text-[#6F6250]">Cuenta vinculada: {new Date(patient.linkedAt).toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })}</p>}
                            {patient.accountStatus === 'linked' && (() => {
                              const activity = getPatientActivityStatus(patient.lastAccessAt);
                              return (
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${activity.className}`}>
                                    {activity.label}
                                  </span>
                                  <span className="text-[10px] text-[#6F6250]">{activity.detail}</span>
                                </div>
                              );
                            })()}
                            {patient.accountStatus === 'linked' && patient.lastAccessAt && (
                              <p className="text-[10px] text-[#6F6250]">
                                Último acceso: {new Date(patient.lastAccessAt).toLocaleString('es-BO', { timeZone: 'America/La_Paz', dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            )}
                          </div>
                        )}
                        {patient.accountStatus === 'linked' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${patient.portalAccessStatus === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {patient.portalAccessStatus === 'suspended' ? 'Acceso suspendido' : 'Acceso habilitado'}
                            </span>
                            {patient.portalAccessStatus === 'suspended' && patient.portalAccessReason && (
                              <span className="text-[10px] text-[#6F6250]">Motivo: {patient.portalAccessReason}</span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => loadCloudPatientDetails(patient.id)}
                            disabled={cloudPatientDetailLoading}
                            className="px-3 py-2 rounded-xl bg-[#231F1A] text-[#DFBD69] text-xs font-bold disabled:opacity-50"
                          >
                            {cloudPatientDetailLoading && selectedCloudPatient?.patient?.id === patient.id ? 'Abriendo…' : 'Abrir ficha provisional'}
                          </button>
                          {patient.accountStatus === 'linked' && (
                            <button
                              type="button"
                              onClick={() => handlePortalAccessChange(patient)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border ${patient.portalAccessStatus === 'suspended' ? 'border-emerald-300 text-emerald-800 bg-emerald-50' : 'border-rose-300 text-rose-800 bg-rose-50'}`}
                            >
                              {patient.portalAccessStatus === 'suspended' ? 'Reactivar acceso' : 'Suspender acceso'}
                            </button>
                          )}
                        </div>

                        {patient.accountStatus !== 'linked' && (
                          <div className="border-t border-[#E6D9C0] pt-3 space-y-2">
                            <label className="block text-[11px] font-bold text-[#735318]">Correo que usará para ingresar</label>
                            <input
                              type="email"
                              value={cloudInviteEmails[patient.id] ?? patient.invitedEmail ?? ''}
                              onChange={(event) => setCloudInviteEmails((prev) => ({ ...prev, [patient.id]: event.target.value }))}
                              placeholder="paciente@correo.com"
                              className="w-full px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleCreatePatientInvitation(patient.id)}
                              disabled={cloudInviteLoadingId === patient.id || !isAdmin}
                              className="w-full py-2.5 rounded-xl bg-[#9A742C] text-white text-xs font-bold disabled:opacity-50"
                            >
                              {cloudInviteLoadingId === patient.id ? 'Creando invitación…' : patient.accountStatus === 'invited' ? 'Reemplazar invitación' : 'Crear invitación segura'}
                            </button>
                            {cloudInviteResult?.patientId === patient.id && (
                              <div className="rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] p-3 space-y-2">
                                <p className="text-[11px] text-[#5C4D3C]">Invitación para <strong>{cloudInviteResult.email}</strong>. Vence: {new Date(cloudInviteResult.expiresAt).toLocaleString('es-BO')}.</p>
                                <input
                                  readOnly
                                  value={cloudInviteResult.activationUrl}
                                  className="w-full px-2 py-2 rounded-lg border border-[#E6D9C0] bg-white text-[10px]"
                                />
                                <button
                                  type="button"
                                  onClick={handleCopyInvitationLink}
                                  className="w-full py-2 rounded-lg bg-[#231F1A] text-[#DFBD69] text-xs font-bold"
                                >
                                  Copiar enlace de activación
                                </button>
                                <p className="text-[10px] text-[#7A6A54]">El enlace solo se muestra ahora. Compártelo con ese correo; la invitación anterior se invalida al reemplazarla.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {cloudPatientDetailError && (
                    <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                      {cloudPatientDetailError}
                    </div>
                  )}

                  {cloudPatientDetailLoading && !selectedCloudPatient && (
                    <p className="text-xs text-[#6F6250]">Cargando ficha individual…</p>
                  )}

                  {selectedCloudPatient?.patient && (
                    <div className="mt-5 border-t border-[#E6D9C0] pt-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wide font-bold text-[#9A742C]">Expediente individual · Preview</span>
                          <h3 className="font-serif text-xl font-bold">{selectedCloudPatient.patient.displayName}</h3>
                          <p className="text-xs text-[#6F6250]">
                            {selectedCloudPatient.patient.phoneE164 || 'Sin teléfono'}
                            {selectedCloudPatient.patient.ageYears ? ` · ${selectedCloudPatient.patient.ageYears} años` : ''}
                          </p>
                          <p className="text-[10px] text-[#8C7A63] break-all">ID: {selectedCloudPatient.patient.id}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedCloudPatient.patient.accountStatus === 'linked' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                              {selectedCloudPatient.patient.accountStatus === 'linked' ? 'Cuenta vinculada' : 'Cuenta sin vincular'}
                            </span>
                            <span className="rounded-full border border-[#E6D9C0] bg-[#FAF6EE] px-2.5 py-1 text-[10px] font-semibold text-[#6F6250]">Expediente de Preview</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCloudPatient(null)}
                          className="px-2 py-1 rounded-lg border border-[#E6D9C0] text-xs"
                        >
                          Cerrar
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'summary', label: 'Resumen' },
                          { id: 'history', label: 'Historia clínica' },
                          { id: 'anthropometry', label: 'Antropometría' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setCloudRecordTab(tab.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold ${cloudRecordTab === tab.id ? 'bg-[#9A742C] text-white' : 'bg-[#FAF6EE] border border-[#E6D9C0] text-[#5C4D3C]'}`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {cloudRecordTab === 'summary' && (() => {
                        const latest = (selectedCloudPatient.measurements || [])[0] || {};
                        const height = latest.heightCm ?? selectedCloudPatient.patient.heightCm;
                        const bmi = latest.weightKg && height
                          ? (latest.weightKg / Math.pow(height / 100, 2)).toFixed(1)
                          : null;
                        const weightSeries = [...(selectedCloudPatient.measurements || [])]
                          .filter((item) => item.weightKg !== null && item.weightKg !== undefined && Number.isFinite(Number(item.weightKg)))
                          .slice(0, 8)
                          .reverse();
                        const minWeight = weightSeries.length ? Math.min(...weightSeries.map((item) => Number(item.weightKg))) : 0;
                        const maxWeight = weightSeries.length ? Math.max(...weightSeries.map((item) => Number(item.weightKg))) : 0;
                        const chartPoints = weightSeries.length > 1
                          ? weightSeries.map((item, index) => {
                              const x = 12 + (index * 276 / (weightSeries.length - 1));
                              const y = 88 - ((Number(item.weightKg) - minWeight) / (maxWeight - minWeight || 1)) * 72;
                              return `${x},${y}`;
                            }).join(' ')
                          : '';
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="rounded-xl bg-[#FAF6EE] p-3"><span className="text-[10px] text-[#8C7A63]">Peso actual</span><strong className="block text-lg">{latest.weightKg ?? '—'} kg</strong></div>
                              <div className="rounded-xl bg-[#FAF6EE] p-3"><span className="text-[10px] text-[#8C7A63]">Talla</span><strong className="block text-lg">{height ? `${height} cm` : '—'}</strong></div>
                              <div className="rounded-xl bg-[#FAF6EE] p-3"><span className="text-[10px] text-[#8C7A63]">IMC actual</span><strong className="block text-lg">{bmi || '—'}</strong></div>
                              <div className="rounded-xl bg-[#FAF6EE] p-3"><span className="text-[10px] text-[#8C7A63]">Cintura</span><strong className="block text-lg">{latest.waistCm ?? '—'} cm</strong></div>
                            </div>
                            <div className="rounded-2xl border border-[#E6D9C0] p-3">
                              <strong className="text-xs">Evolución del peso</strong>
                              {weightSeries.length > 1 ? (
                                <svg viewBox="0 0 300 105" role="img" aria-label="Gráfico de evolución del peso" className="w-full h-28 mt-2">
                                  <line x1="12" y1="88" x2="288" y2="88" stroke="#E6D9C0" strokeWidth="1" />
                                  <polyline points={chartPoints} fill="none" stroke="#9A742C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                  {weightSeries.map((item, index) => {
                                    const x = 12 + (index * 276 / (weightSeries.length - 1));
                                    const y = 88 - ((Number(item.weightKg) - minWeight) / (maxWeight - minWeight || 1)) * 72;
                                    return <circle key={item.id || index} cx={x} cy={y} r="3.5" fill="#9A742C" />;
                                  })}
                                </svg>
                              ) : (
                                <p className="text-xs text-[#6F6250] mt-2">Registra al menos dos pesos para visualizar la tendencia.</p>
                              )}
                              {weightSeries.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-[10px] text-[#8C7A63]">Últimos {weightSeries.length} registros con peso · Tendencia descriptiva, no objetivo terapéutico.</p>
                                  <div className="flex flex-wrap gap-2 text-[10px] text-[#6F6250]">
                                    {weightSeries.map((item, index) => (
                                      <span key={item.id || index} className="rounded-md bg-[#FAF6EE] px-2 py-1">
                                        {item.recordedAt ? new Date(item.recordedAt).toLocaleDateString('es-BO') : 'Sin fecha'}: <strong>{item.weightKg} kg</strong>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="rounded-2xl bg-[#FAF6EE] p-3">
                              <strong className="text-xs">Datos generales</strong>
                              <p className="text-xs mt-2">Fecha de nacimiento: {selectedCloudPatient.patient.birthDate || 'No registrada'}</p>
                              <p className="text-xs">Sexo biológico: {({ female: 'Femenino', male: 'Masculino', intersex: 'Intersexual', not_specified: 'No especificado' })[selectedCloudPatient.patient.sexAtBirth] || 'No registrado'}</p>
                              <p className="text-xs">Edad: {selectedCloudPatient.patient.ageYears ? `${selectedCloudPatient.patient.ageYears} años` : 'No registrada'}</p>
                            </div>
                          </div>
                        );
                      })()}

                      {cloudRecordTab === 'history' && (
                        <form onSubmit={handleSaveCloudProfile} className="rounded-2xl border border-[#E6D9C0] p-3 space-y-3">
                          <strong className="text-xs">Perfil e historia clínica básica</strong>
                          <p className="text-[10px] text-[#8C7A63]">Completa solo información verificada durante la anamnesis. No incluyas notas internas del profesional en estos campos.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="text-[10px] font-bold">Nombre completo
                              <input required minLength="2" maxLength="120" value={cloudProfileForm.displayName} onChange={(e) => setCloudProfileForm((p) => ({ ...p, displayName: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                            </label>
                            <label className="text-[10px] font-bold">Teléfono / WhatsApp
                              <input value={cloudProfileForm.phone} onChange={(e) => setCloudProfileForm((p) => ({ ...p, phone: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" placeholder="71234567" />
                            </label>
                            <label className="text-[10px] font-bold">Edad en años (si no se conoce la fecha de nacimiento)
                              <input type="number" min="1" max="120" value={cloudProfileForm.ageYears} disabled={Boolean(cloudProfileForm.birthDate)} onChange={(e) => setCloudProfileForm((p) => ({ ...p, ageYears: e.target.value }))} placeholder="No registrada" className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs disabled:opacity-60" />
                            </label>
                            <label className="text-[10px] font-bold">Fecha de nacimiento
                              <input type="date" value={cloudProfileForm.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setCloudProfileForm((p) => ({ ...p, birthDate: e.target.value, ageYears: e.target.value ? '' : p.ageYears }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                            </label>
                            <label className="text-[10px] font-bold">Sexo biológico
                              <select value={cloudProfileForm.sexAtBirth} onChange={(e) => setCloudProfileForm((p) => ({ ...p, sexAtBirth: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs">
                                <option value="">No especificado</option><option value="female">Femenino</option><option value="male">Masculino</option><option value="intersex">Intersexual</option><option value="not_specified">Prefiere no especificar</option>
                              </select>
                            </label>
                            <label className="text-[10px] font-bold">Talla (cm)
                              <input type="number" min="80" max="250" step="0.1" value={cloudProfileForm.heightCm} onChange={(e) => setCloudProfileForm((p) => ({ ...p, heightCm: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                            </label>
                          </div>
                          {[
                            ['activeDiagnoses', 'Diagnósticos activos / problemas vigentes', '2000'],
                            ['medicalHistory', 'Antecedentes médicos relevantes', '3000'],
                            ['surgicalHistory', 'Antecedentes quirúrgicos', '2000'],
                            ['familyHistory', 'Antecedentes familiares', '2000'],
                            ['allergies', 'Alergias (medicamentos/alimentos/otras)', '2000'],
                            ['concomitantMedications', 'Medicación concomitante', '3000']
                          ].map(([key, label, maxLength]) => (
                            <label key={key} className="block text-[10px] font-bold">{label}
                              <textarea maxLength={Number(maxLength)} rows="2" value={cloudProfileForm[key]} onChange={(e) => setCloudProfileForm((p) => ({ ...p, [key]: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                            </label>
                          ))}
                          <button type="submit" disabled={cloudProfileSaving} className="w-full py-2.5 rounded-xl bg-[#9A742C] text-white text-xs font-bold disabled:opacity-50">
                            {cloudProfileSaving ? 'Guardando perfil…' : 'Guardar perfil clínico'}
                          </button>
                        </form>
                      )}

                      {cloudRecordTab === 'anthropometry' && (
                        <div className="space-y-3">
                          <div className="rounded-2xl bg-[#FAF6EE] p-3 space-y-2">
                            <strong className="text-xs">Historial antropométrico</strong>
                            {(selectedCloudPatient.measurements || []).length === 0 ? (
                              <p className="text-xs text-[#6F6250]">Todavía no hay mediciones registradas.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead><tr className="text-[#8C7A63]">
                                    <th className="py-2 pr-2">Fecha y hora</th><th className="py-2 pr-2">Registro</th><th className="py-2 pr-2">Peso</th><th className="py-2 pr-2">Δ peso</th><th className="py-2 pr-2">Talla</th><th className="py-2 pr-2">IMC</th><th className="py-2 pr-2">Cintura</th><th className="py-2 pr-2">Δ cintura</th><th className="py-2 pr-2">Músculo</th><th className="py-2">Grasa</th>
                                  </tr></thead>
                                  <tbody>
                                    {(selectedCloudPatient.measurements || []).map((measurement, index, rows) => {
                                      const previous = rows[index + 1];
                                      const weightDelta = measurement.weightKg != null && previous?.weightKg != null ? Number((measurement.weightKg - previous.weightKg).toFixed(1)) : null;
                                      const waistDelta = measurement.waistCm != null && previous?.waistCm != null ? Number((measurement.waistCm - previous.waistCm).toFixed(1)) : null;
                                      return (
                                        <tr key={measurement.id} className="border-t border-[#E6D9C0]">
                                          <td className="py-2 pr-2 whitespace-nowrap">{measurement.recordedAt ? new Date(measurement.recordedAt).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                          <td className="py-2 pr-2 whitespace-nowrap">{measurement.source === 'initial_registration' ? 'Inicial' : measurement.source === 'manual_control' ? 'Control' : 'Registro'}</td>
                                          <td className="py-2 pr-2 whitespace-nowrap">{measurement.weightKg ?? '—'} kg</td>
                                          <td className="py-2 pr-2 whitespace-nowrap">{weightDelta == null ? '—' : (weightDelta > 0 ? '+' : '') + weightDelta + ' kg'}</td>
                                          <td className="py-2 pr-2 whitespace-nowrap">{measurement.heightCm ?? '—'} cm</td>
                                          <td className="py-2 pr-2">{measurement.bmi ?? '—'}</td>
                                          <td className="py-2 pr-2 whitespace-nowrap">{measurement.waistCm ?? '—'} cm</td>
                                          <td className="py-2 pr-2 whitespace-nowrap">{waistDelta == null ? '—' : (waistDelta > 0 ? '+' : '') + waistDelta + ' cm'}</td>
                                          <td className="py-2 pr-2">{measurement.muscleKg ?? '—'} kg</td>
                                          <td className="py-2">{measurement.bodyFatPct ?? '—'}%</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                          <form onSubmit={handleCreateCloudMeasurement} className="rounded-2xl border border-[#E6D9C0] p-3 space-y-3">
                            <strong className="text-xs">Registrar nuevo control (solo pruebas)</strong>
                            <p className="text-[10px] text-[#8C7A63]">La talla se registra en cada control. Si la dejas vacía, se utilizará la talla vigente del perfil y quedará guardada como referencia histórica.</p>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="number" min="20" max="400" step="0.1" placeholder="Peso kg" value={cloudMeasurementForm.weightKg} onChange={(e) => setCloudMeasurementForm((p) => ({ ...p, weightKg: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                              <input type="number" min="80" max="250" step="0.1" placeholder={'Talla cm (' + (selectedCloudPatient.patient.heightCm || 'opcional') + ')'} value={cloudMeasurementForm.heightCm} onChange={(e) => setCloudMeasurementForm((p) => ({ ...p, heightCm: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                              <input type="number" min="30" max="250" step="0.1" placeholder="Cintura cm" value={cloudMeasurementForm.waistCm} onChange={(e) => setCloudMeasurementForm((p) => ({ ...p, waistCm: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                              <input type="number" min="2" max="150" step="0.1" placeholder="Músculo kg" value={cloudMeasurementForm.muscleKg} onChange={(e) => setCloudMeasurementForm((p) => ({ ...p, muscleKg: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                              <input type="number" min="1" max="75" step="0.1" placeholder="Grasa corporal %" value={cloudMeasurementForm.bodyFatPct} onChange={(e) => setCloudMeasurementForm((p) => ({ ...p, bodyFatPct: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#E6D9C0] text-xs" />
                            </div>
                            <button type="submit" disabled={cloudMeasurementSaving} className="w-full py-2.5 rounded-xl bg-[#9A742C] text-white text-xs font-bold disabled:opacity-50">
                              {cloudMeasurementSaving ? 'Guardando control…' : 'Guardar nuevo control'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                              persistState((prev) => ({
                                ...prev,
                                rxRequests: prev.rxRequests.map((r) =>
                                  r.id === req.id ? { ...r, status: 'reviewed' } : r
                                )
                              }));
                              showToast('Solicitud marcada para revisión clínica; no se emitió receta.');
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#9A742C] text-white text-xs font-bold cursor-pointer"
                          >
                            Marcar como revisada (sin receta)
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
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
                <strong className="block">Vista local de demostración conservada</strong>
                <span>Se mantiene separada para no perder ni sobrescribir los datos ficticios anteriores. Para trabajar con expedientes de prueba guardados en la nube, utiliza «Expedientes clínicos (Pruebas)».</span>
              </div>
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

          {/* REFERENCIA DE MEDICAMENTOS · SOLO USO PROFESIONAL */}
          {doctorTab === 'vademecum' && (
            <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase text-[#9A742C]">Biblioteca profesional · Bolivia</span>
                  <h2 className="font-serif text-2xl font-bold">Referencia de medicamentos</h2>
                  <p className="text-xs text-[#6F6250] mt-1">Consulta regulatoria y farmacológica. No emite recetas ni sustituye el juicio clínico.</p>
                </div>
                <input
                  type="search"
                  placeholder="Buscar principio activo o marca..."
                  value={vademecumSearch}
                  onChange={(e) => setVademecumSearch(e.target.value)}
                  className="w-full lg:w-72 px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E6D9C0] text-xs"
                />
              </div>

              <div role="alert" className="rounded-2xl border border-amber-400 bg-amber-50 p-4 space-y-2 text-xs text-amber-950">
                <div className="font-bold flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Alertas regulatorias importantes de AGEMED</div>
                <p><strong>LIPOLESS MD 15:</strong> AGEMED lo identificó como producto sin registro sanitario y de contrabando (Alerta 043/2026). No confundir con otras presentaciones o titulares sin verificar su registro específico.</p>
                <p><strong>TIRZEC 15:</strong> figura en la lista oficial de alertas como medicamento ilícito de contrabando (Alerta 230/2026).</p>
                <p><strong>TG inyectable:</strong> AGEMED alertó sobre versiones de contrabando sin registro (Alerta 082/2026), pero en esa misma alerta identificó comercialización legal de TG por IMFAR S.R.L. con seis registros sanitarios específicos. Debe verificarse el envase y número de registro exacto.</p>
                <a href="https://apiwww.agemed.gob.bo/api/web/vigilanciacontrol%7Ccontenido" target="_blank" rel="noreferrer" className="inline-flex font-bold underline">Consultar alertas oficiales de AGEMED</a>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredVademecum.map((med) => (
                  <article key={med.id} className="rounded-2xl border border-[#E6D9C0] bg-[#FAF6EE] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#9A742C]">{med.category}</span>
                        <h3 className="font-bold text-base text-[#231F1A]">{med.generic}</h3>
                        <p className="text-xs text-[#735318]">{med.brand}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${med.status === 'verified_specific_registration' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                        {med.status === 'verified_specific_registration' ? 'Registro identificado' : 'Verificación pendiente'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#3D3326]">{med.registrationStatus}</p>
                    {med.registrationNumbers.length > 0 && (
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-[10px] font-bold text-[#8C7A63] mb-1">Registros mencionados por AGEMED</div>
                        <div className="flex flex-wrap gap-1.5">
                          {med.registrationNumbers.map((number) => <span key={number} className="text-[10px] bg-[#F4EAD5] rounded-md px-2 py-1">{number}</span>)}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-[#5C4D3C]">{med.regulatoryNote}</p>
                    <p className="text-xs text-amber-900">{med.alertNote}</p>
                    <div className="flex items-center justify-between gap-2 border-t border-[#E6D9C0] pt-2">
                      <span className="text-[10px] text-[#8C7A63]">Revisado: {med.reviewedAt}</span>
                      <a href={med.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#8A6829] underline">{med.sourceLabel}</a>
                    </div>
                  </article>
                ))}
              </div>
              <p className="text-[10px] text-[#8C7A63]">La presencia de un registro en esta referencia no garantiza la legitimidad de cualquier unidad comercializada. Verificar siempre titular, envase, presentación, lote, vencimiento y vigencia del registro en AGEMED. La referencia no recomienda dosis ni permite prescripción automática.</p>
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
                  <label className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl text-xs font-bold ${syncStatus === 'synced' ? 'bg-[#9A742C] text-white cursor-pointer hover:bg-[#7D5C1E]' : 'bg-stone-200 text-stone-500 cursor-not-allowed'}`}>
                    <Upload className="w-4 h-4" />
                    <span>{syncStatus === 'synced' ? 'Subir Imagen QR Simple (PNG/JPG)' : 'Carga de QR temporalmente deshabilitada'}</span>
                    <input type="file" accept="image/*" disabled className="hidden" />
                  </label>
                  {syncStatus !== 'synced' && (
                    <p className="text-[11px] text-amber-800">La configuración de pagos se habilitará con el nuevo módulo seguro. No se guardan imágenes en el sistema antiguo.</p>
                  )}
                  {clinicData.clinicConfig.qrImageDataUrl && (
                    <div className="flex justify-center p-3 bg-[#FAF6EE] rounded-2xl border border-[#E6D9C0]">
                      <img src={clinicData.clinicConfig.qrImageDataUrl} alt="QR Simple" className="w-36 h-36 object-contain rounded-xl" />
                    </div>
                  )}
                </div>

                <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold">Auditoría del almacenamiento anterior</h3>
                    <p className="text-xs text-[#5C4D3C] mt-1">
                      Busca el documento legado en la ruta habitual y revisa otras raíces de la colección artifacts. Solo devuelve conteos; no muestra nombres, teléfonos ni contenido clínico.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLegacyAudit}
                    disabled={legacyAuditBusy}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#9A742C] disabled:opacity-60 text-white text-xs font-bold"
                  >
                    {legacyAuditBusy ? 'Revisando datos…' : 'Revisar datos antiguos'}
                  </button>
                  {legacyAuditError && (
                    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                      {legacyAuditError}
                    </div>
                  )}
                  {legacyAuditResult && (
                    <div className="rounded-xl border border-[#E6D9C0] bg-[#FAF6EE] p-3 space-y-2 text-xs text-[#3D3326]">
                      <strong>{legacyAuditResult.exists ? 'Documento antiguo encontrado' : 'No se encontró el documento antiguo'}</strong>
                      <div className="grid grid-cols-2 gap-2">
                        <div>Documentos legados: <strong>{legacyAuditResult.matchingDocuments ?? (legacyAuditResult.exists ? 1 : 0)}</strong></div>
                        <div>Raíces de artifacts: <strong>{legacyAuditResult.scannedArtifactRoots ?? 0}</strong></div>
                        <div>Colecciones principales revisadas: <strong>{legacyAuditResult.rootCollectionsScanned ?? 'No disponible'}</strong></div>
                        {legacyAuditResult.counts && (
                          <>
                            <div>Expedientes: <strong>{legacyAuditResult.counts.patients}</strong></div>
                            <div>Registros demo: <strong>{legacyAuditResult.counts.demoPatientRecords}</strong></div>
                            <div>Por clasificar: <strong>{legacyAuditResult.counts.unclassifiedPatientRecords}</strong></div>
                            <div>Solicitudes web: <strong>{legacyAuditResult.counts.webLeads}</strong></div>
                            <div>Solicitudes de receta: <strong>{legacyAuditResult.counts.prescriptionRequests}</strong></div>
                            <div>Solicitudes demo: <strong>{legacyAuditResult.counts.demoPrescriptionRequests}</strong></div>
                          </>
                        )}
                        {legacyAuditResult.unparsedDocuments > 0 && (
                          <div className="col-span-2 text-amber-800">Documentos que requieren revisión técnica: <strong>{legacyAuditResult.unparsedDocuments}</strong></div>
                        )}
                      </div>
                      {legacyAuditResult.storageLocations && (
                        <div className="border-t border-[#E6D9C0] pt-2 space-y-1">
                          <strong>Comparación de ubicaciones (solo cantidades)</strong>
                          <div className="flex justify-between gap-3"><span>Pacientes antiguos (raíz)</span><strong>{legacyAuditResult.storageLocations.legacyRootPatients}</strong></div>
                          <div className="flex justify-between gap-3"><span>Usuarios antiguos (raíz)</span><strong>{legacyAuditResult.storageLocations.legacyRootUsers}</strong></div>
                          <div className="flex justify-between gap-3"><span>Expedientes del espacio de pruebas</span><strong>{legacyAuditResult.storageLocations.previewPatients}</strong></div>
                          <div className="flex justify-between gap-3"><span>Usuarios vinculados en pruebas</span><strong>{legacyAuditResult.storageLocations.previewUsers}</strong></div>
                          <div className="flex justify-between gap-3"><span>Invitaciones en pruebas</span><strong>{legacyAuditResult.storageLocations.previewInvitations}</strong></div>
                        </div>
                      )}
                      {Array.isArray(legacyAuditResult.rootCollections) && legacyAuditResult.rootCollections.length > 0 && (
                        <div className="border-t border-[#E6D9C0] pt-2 space-y-1">
                          <strong>Colecciones principales (solo cantidades)</strong>
                          {legacyAuditResult.rootCollections.map((item) => (
                            <div key={item.collection} className="flex justify-between gap-3">
                              <span>{item.collection}</span>
                              <strong>{item.documents}</strong>
                            </div>
                          ))}
                          {legacyAuditResult.rootCollectionsTruncated && (
                            <p className="text-amber-800">La lista se limitó a las primeras 100 colecciones.</p>
                          )}
                        </div>
                      )}
                      {legacyAuditResult.updatedAt && (
                        <p>Última actualización: {new Date(legacyAuditResult.updatedAt).toLocaleString('es-BO')}</p>
                      )}
                      <p className="text-[#735318]">{legacyAuditResult.message}</p>
                    </div>
                  )}
                </div>

                <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6D9C0] p-6 space-y-4">
                  <h3 className="font-serif text-lg font-bold">Respaldo seguro de expedientes</h3>
                  <p className="text-xs text-[#5C4D3C]">
                    El respaldo y la restauración se habilitarán cuando los expedientes estén migrados a colecciones individuales y exista un procedimiento de recuperación probado.
                  </p>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <strong>Temporalmente deshabilitado.</strong> El respaldo antiguo exportaba el objeto de demostración del navegador y no constituye una copia fiable de Firestore. No uses archivos JSON antiguos para restaurar pacientes.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      disabled
                      title="Disponible después de completar la migración segura"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-stone-200 text-stone-500 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      <span>Respaldo no disponible</span>
                    </button>
                    <label className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <Upload className="w-4 h-4" />
                      <span>Restauración no disponible</span>
                      <input type="file" accept=".json" disabled className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          {doctorTab === 'finance' && (
            <React.Suspense fallback={<div className="rounded-2xl bg-[#FAF6EE] p-5 text-sm text-[#735318]">Cargando ORIGEN Finanzas…</div>}>
              <FinanceModule user={user} isAdmin={isAdmin} />
            </React.Suspense>
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
export default App;
