import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react';

const topics = [
  {
    id: 'nausea',
    question: '¿Qué puedo hacer si tengo náuseas?',
    answer: 'Prueba porciones pequeñas, come despacio y evita continuar cuando ya te sientas satisfecho. Elige alimentos que toleres y mantén líquidos en pequeñas tomas frecuentes. Si las náuseas son intensas, persistentes o se acompañan de vómitos repetidos, contacta a tu equipo de salud.',
    note: 'No te automediques ni cambies la dosis por tu cuenta.'
  },
  {
    id: 'protein',
    question: '¿Por qué debo cuidar mi consumo de proteína?',
    answer: 'La proteína forma parte de una alimentación que ayuda a mantener y reparar tejidos, incluida la masa muscular. Incluye fuentes variadas según tu plan: huevo, pescado, pollo, carnes magras, lácteos o legumbres.',
    note: 'La cantidad adecuada depende de tu situación clínica, función renal, actividad y objetivos. Sigue la meta indicada por tu profesional.'
  },
  {
    id: 'hydration',
    question: '¿Por qué es importante hidratarme?',
    answer: 'Náuseas, vómitos o diarrea pueden hacer que pierdas líquidos. Mantén una ingesta de líquidos acorde con tu plan médico y presta atención a la disminución marcada de la orina, mareos o debilidad.',
    note: 'Si tienes restricción de líquidos por una enfermedad, respeta la indicación individual.'
  },
  {
    id: 'dose',
    question: '¿Puedo aumentar, reducir o saltarme la dosis?',
    answer: 'No ajustes, dupliques ni cambies el día de aplicación por tu cuenta. La dosis y el calendario deben seguir la prescripción y las indicaciones del profesional que supervisa tu tratamiento.',
    note: 'Si olvidaste una dosis o presentas efectos adversos, consulta las instrucciones del producto exacto y contacta a tu equipo tratante.'
  },
  {
    id: 'exercise',
    question: '¿Puedo hacer ejercicio durante el tratamiento?',
    answer: 'La actividad física puede formar parte del cuidado integral. Adapta la intensidad a tu condición y tolerancia; combina movimiento aeróbico con ejercicios de fuerza cuando tu profesional lo considere apropiado.',
    note: 'Si tienes mareos, debilidad importante, deshidratación o no puedes alimentarte e hidratarte bien, consulta antes de entrenar.'
  },
  {
    id: 'emergency',
    question: '¿Qué síntomas requieren atención urgente?',
    answer: 'Busca atención médica urgente ante dolor abdominal intenso o persistente, especialmente si se extiende hacia la espalda; vómitos persistentes o incapacidad para retener líquidos; signos de deshidratación importante; dolor en la parte superior del abdomen con fiebre o color amarillo en piel u ojos; o hinchazón de cara, labios o lengua y dificultad para respirar o tragar.',
    note: 'No esperes una respuesta por mensajería si tienes síntomas de alarma.'
  },
  {
    id: 'surgery',
    question: '¿Debo avisar si tengo una cirugía o procedimiento?',
    answer: 'Sí. Informa al médico, anestesiólogo y equipo del procedimiento que utilizas un medicamento GLP-1, indicando cuál y cuándo fue la última dosis. No lo suspendas ni lo continúes de forma distinta sin recibir instrucciones del equipo responsable.',
    note: 'El equipo debe valorar el riesgo y darte indicaciones específicas.'
  }
];

export default function NutritionFAQ() {
  const [openId, setOpenId] = useState('nausea');

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9A742C] text-white">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Orientación para pacientes</span>
          <h3 className="font-serif text-xl font-bold text-[#231F1A]">Preguntas frecuentes sobre GLP-1</h3>
          <p className="mt-1 text-sm text-[#5C4D3C]">Respuestas generales para acompañar tu seguimiento. Tu indicación individual siempre tiene prioridad.</p>
        </div>
      </div>

      <div className="space-y-2">
        {topics.map((item) => {
          const isOpen = openId === item.id;
          return (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-[#E6D9C0] bg-[#FFFDF9]">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? '' : item.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="min-w-0 flex-1 text-sm font-bold text-[#231F1A]">{item.question}</span>
                {isOpen ? <ChevronUp className="h-5 w-5 shrink-0 text-[#9A742C]" /> : <ChevronDown className="h-5 w-5 shrink-0 text-[#9A742C]" />}
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-[#E6D9C0] px-4 pb-4 pt-3">
                  <p className="text-sm leading-relaxed text-[#5C4D3C]">{item.answer}</p>
                  <p className="rounded-xl bg-[#FAF6EE] p-3 text-xs leading-relaxed text-[#735318]">{item.note}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
          <AlertTriangle className="h-4 w-4" />
          Señales de alarma
        </div>
        <p className="mt-2 text-sm leading-relaxed text-amber-950">Dolor abdominal intenso y persistente, vómitos que no permiten hidratarte o una reacción alérgica con dificultad respiratoria requieren atención inmediata. No esperes una respuesta por WhatsApp.</p>
      </div>

      <div className="space-y-2 border-t border-[#E6D9C0] pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8C7A63]">Fuentes de seguridad consultadas</p>
        <a className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A6829] underline" href="https://dailymed.nlm.nih.gov/dailymed/medguide.cfm?setid=d2d7da5d-ad07-4228-955f-cf7e355c8cc0" target="_blank" rel="noreferrer">
          Guía del paciente de tirzepatida · DailyMed <ExternalLink className="h-3 w-3" />
        </a>
        <p className="text-[10px] leading-relaxed text-[#8C7A63]">La fuente citada corresponde a una presentación específica de tirzepatida en Estados Unidos. La información no sustituye el prospecto del producto utilizado ni las normas y recomendaciones aplicables en Bolivia.</p>
      </div>
    </section>
  );
}
