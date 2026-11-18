import React, { useState } from 'react';
import { BookOpen, Hand, Beef, Wheat, Droplets, Leaf, Info, ChevronDown, ChevronUp } from 'lucide-react';

const guides = [
  {
    id: 'protein', title: 'Proteínas', measure: 'La palma de tu mano', emoji: '🍗',
    detail: 'Usa como referencia el tamaño y grosor de la palma, sin contar los dedos.',
    examples: 'Pollo, pescado, surubí, carne magra, huevo o quesillo.',
    color: 'border-amber-200 bg-amber-50'
  },
  {
    id: 'carbs', title: 'Carbohidratos', measure: 'Un puño cerrado', emoji: '🍚',
    detail: 'El puño sirve como referencia visual para una porción de alimentos ricos en carbohidratos.',
    examples: 'Arroz, quinua, papa, yuca, camote o plátano.',
    color: 'border-orange-200 bg-orange-50'
  },
  {
    id: 'fats', title: 'Grasas', measure: 'La punta del pulgar', emoji: '🥑',
    detail: 'El pulgar puede orientar una porción pequeña de grasas añadidas o untables.',
    examples: 'Aceite, palta, frutos secos o semillas.',
    color: 'border-lime-200 bg-lime-50'
  },
  {
    id: 'vegetables', title: 'Verduras', measure: 'Dos manos abiertas', emoji: '🥗',
    detail: 'El volumen de ambas manos juntas puede ayudar a visualizar una porción generosa de verduras.',
    examples: 'Tomate, pepino, zanahoria, hojas verdes y verduras cocidas.',
    color: 'border-emerald-200 bg-emerald-50'
  }
];

const localSwaps = [
  { group: 'Proteínas', options: 'Pollo ↔ pescado ↔ huevo ↔ quesillo ↔ legumbres', note: 'No aportan exactamente la misma cantidad de proteína; ajusta la porción.' },
  { group: 'Carbohidratos', options: 'Arroz ↔ papa ↔ yuca ↔ camote ↔ quinua', note: 'La cantidad y preparación modifican el aporte energético.' },
  { group: 'Verduras', options: 'Tomate ↔ pepino ↔ zanahoria ↔ verduras de estación', note: 'Varía colores y preparaciones según disponibilidad y tolerancia.' }
];

export default function NutritionEducation() {
  const [expanded, setExpanded] = useState('protein');
  const [activeSection, setActiveSection] = useState('portions');

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-[#E6D9C0] bg-gradient-to-br from-[#FFFDF9] to-[#F7EEDB] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#9A742C] text-white">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Aprende a comer con confianza</span>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#231F1A]">Centro Educativo ORIGEN</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5C4D3C]">
              Guías prácticas para organizar tus comidas con alimentos cotidianos. No necesitas una balanza para empezar a reconocer porciones.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveSection('portions')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeSection === 'portions' ? 'bg-[#231F1A] text-[#DFBD69]' : 'border border-[#E6D9C0] bg-white text-[#5C4D3C]'}`}>Método de la mano</button>
          <button onClick={() => setActiveSection('swaps')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeSection === 'swaps' ? 'bg-[#231F1A] text-[#DFBD69]' : 'border border-[#E6D9C0] bg-white text-[#5C4D3C]'}`}>Equivalencias locales</button>
        </div>
      </div>

      {activeSection === 'portions' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hand className="h-5 w-5 text-[#9A742C]" />
            <h3 className="font-serif text-xl font-bold text-[#231F1A]">Método de la mano y la taza</h3>
          </div>
          <p className="text-sm text-[#5C4D3C]">Selecciona cada grupo para ver cómo usarlo como referencia visual.</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {guides.map((item) => {
              const isOpen = expanded === item.id;
              return (
                <article key={item.id} className={`overflow-hidden rounded-2xl border ${item.color}`}>
                  <button onClick={() => setExpanded(isOpen ? '' : item.id)} className="flex w-full items-center gap-3 p-4 text-left">
                    <span className="text-3xl" aria-hidden="true">{item.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold uppercase tracking-wide text-[#735318]">{item.title}</span>
                      <span className="mt-0.5 block font-semibold text-[#231F1A]">{item.measure}</span>
                    </span>
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-black/5 px-4 pb-4 pt-3 text-sm text-[#5C4D3C]">
                      <p>{item.detail}</p>
                      <p><strong>Ejemplos:</strong> {item.examples}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <div className="rounded-2xl border border-[#E6D9C0] bg-[#FFFDF9] p-4 text-sm text-[#5C4D3C]">
            <div className="mb-1 flex items-center gap-2 font-bold text-[#735318]"><Info className="h-4 w-4" /> Recuerda</div>
            Estas medidas son orientativas, no equivalencias exactas en gramos ni una dieta individual. Tus porciones pueden variar según tus necesidades, objetivos, actividad física y situación clínica.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-[#231F1A]">Equivalencias del mercado cruceño</h3>
          <p className="text-sm text-[#5C4D3C]">Ideas para variar tus comidas cuando no encuentres un ingrediente. Las sustituciones son aproximadas.</p>
          {localSwaps.map((item) => (
            <article key={item.group} className="rounded-2xl border border-[#E6D9C0] bg-[#FFFDF9] p-5">
              <h4 className="font-bold text-[#735318]">{item.group}</h4>
              <p className="mt-2 text-sm font-semibold text-[#231F1A]">{item.options}</p>
              <p className="mt-2 text-xs text-[#8C7A63]">{item.note}</p>
            </article>
          ))}
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
            Para objetivos nutricionales específicos, consulta la cantidad indicada en tu plan aprobado por el profesional.
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E6D9C0] bg-[#FAF6EE] p-4 text-xs leading-relaxed text-[#735318]">
        <strong>Contenido educativo general.</strong> No reemplaza la consulta médica o nutricional. Si tienes alergias, enfermedad renal, diabetes u otra condición que requiera ajustes, sigue tu plan individual.
      </div>
    </section>
  );
}
