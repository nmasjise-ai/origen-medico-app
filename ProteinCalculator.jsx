import React, { useMemo, useState } from 'react';
import { Plus, Minus, RotateCcw, Calculator, Info, ShieldAlert } from 'lucide-react';

// Valores aproximados por porción habitual; pueden variar por preparación y marca.
const foods = [
  { id: 'egg', name: 'Huevo', portion: '1 unidad', protein: 6, emoji: '🥚' },
  { id: 'chicken', name: 'Pollo cocido', portion: '1 palma (100 g)', protein: 31, emoji: '🍗' },
  { id: 'fish', name: 'Pescado cocido', portion: '1 palma (100 g)', protein: 22, emoji: '🐟' },
  { id: 'beef', name: 'Carne magra cocida', portion: '1 palma (100 g)', protein: 26, emoji: '🥩' },
  { id: 'milk', name: 'Leche', portion: '1 vaso (240 ml)', protein: 8, emoji: '🥛' },
  { id: 'yogurt', name: 'Yogur natural', portion: '1 pote (170 g)', protein: 6, emoji: '🥣' },
  { id: 'quesillo', name: 'Quesillo', portion: '1 porción pequeña (50 g)', protein: 9, emoji: '🧀' },
  { id: 'lentils', name: 'Lentejas cocidas', portion: '1 taza', protein: 18, emoji: '🫘' },
  { id: 'beans', name: 'Porotos cocidos', portion: '1 taza', protein: 15, emoji: '🫘' },
  { id: 'tuna', name: 'Atún escurrido', portion: '1 lata pequeña (100 g)', protein: 25, emoji: '🐟' }
];

export default function ProteinCalculator() {
  const [goal, setGoal] = useState('');
  const [counts, setCounts] = useState({});
  const total = useMemo(() => foods.reduce((sum, food) => sum + food.protein * (counts[food.id] || 0), 0), [counts]);
  const hasGoal = goal !== '' && Number.isFinite(Number(goal)) && Number(goal) > 0 && Number(goal) <= 300;
  const progress = hasGoal ? Math.min(100, Math.round(total / Number(goal) * 100)) : 0;
  const change = (id, delta) => setCounts(current => ({ ...current, [id]: Math.max(0, (current[id] || 0) + delta) }));
  const reset = () => setCounts({});

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-[#E6D9C0] bg-gradient-to-br from-[#FFFDF9] to-[#F7EEDB] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#9A742C] text-white"><Calculator className="h-5 w-5" /></div>
          <div><span className="text-xs font-bold uppercase tracking-wider text-[#9A742C]">Herramienta sencilla</span><h3 className="font-serif text-xl font-bold text-[#231F1A]">Mi proteína del día</h3></div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#5C4D3C]">Marca lo que comiste y mira cuánta proteína aproximada llevas durante el día.</p>
        <label htmlFor="protein-goal" className="mt-5 block text-sm font-semibold text-[#231F1A]">Mi meta diaria indicada por mi profesional (gramos)</label>
        <input id="protein-goal" type="number" min="1" max="300" step="1" inputMode="numeric" value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ej. 90" className="mt-2 w-full rounded-xl border border-[#D9C9A8] bg-white px-4 py-3 text-lg font-semibold text-[#231F1A] outline-none focus:ring-2 focus:ring-[#B18A3B]" />
        <p className="mt-2 text-xs text-[#735318]">Escribe solamente la meta que te indicó tu médico o nutricionista. Esta herramienta no calcula ni prescribe tu requerimiento.</p>
      </div>
      <div className="rounded-2xl border border-[#E6D9C0] bg-white p-5">
        <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-medium text-[#735318]">Consumido aproximadamente</p><p className="mt-1 text-3xl font-bold tabular-nums text-[#231F1A]">{total} <span className="text-base font-medium">g</span></p></div>
          {hasGoal && <div className="text-right"><p className="text-xs text-[#8C7A63]">Meta diaria</p><p className="text-xl font-bold text-[#231F1A]">{Number(goal)} g</p></div>}</div>
        {hasGoal ? <><div className="mt-4 h-3 overflow-hidden rounded-full bg-[#F0E9DC]"><div className="h-full rounded-full bg-[#9A742C] transition-all" style={{ width: progress + '%' }} /></div><p className="mt-2 text-xs text-[#735318]">{total >= Number(goal) ? 'Has alcanzado la meta que registraste.' : 'Llevas ' + progress + '% de la meta indicada.'} El resultado es orientativo.</p></> : <p className="mt-3 rounded-xl bg-[#FAF6EE] p-3 text-xs text-[#735318]">Aún no registraste una meta. Puedes sumar alimentos, pero consulta a tu equipo para conocer tu objetivo personal.</p>}
      </div>
      <div className="flex items-center justify-between gap-2"><div><h4 className="font-serif text-lg font-bold text-[#231F1A]">¿Qué comiste hoy?</h4><p className="text-xs text-[#8C7A63]">Toca + por cada porción que consumiste.</p></div><button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[#735318] hover:bg-[#FAF6EE]"><RotateCcw className="h-3.5 w-3.5" /> Reiniciar día</button></div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {foods.map(food => { const count = counts[food.id] || 0; return <article key={food.id} className="flex items-center gap-3 rounded-2xl border border-[#E6D9C0] bg-[#FFFDF9] p-3"><span className="text-2xl" aria-hidden="true">{food.emoji}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#231F1A]">{food.name}</p><p className="text-xs text-[#8C7A63]">{food.portion} · ~{food.protein} g proteína</p>{count > 0 && <p className="mt-1 text-xs font-semibold text-[#735318]">{count} porción(es) = {count * food.protein} g</p>}</div><div className="flex items-center gap-2"><button type="button" aria-label={'Quitar una porción de ' + food.name} onClick={() => change(food.id, -1)} disabled={count === 0} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D9C9A8] text-[#735318] disabled:opacity-30"><Minus className="h-4 w-4" /></button><span className="w-4 text-center text-sm font-bold tabular-nums">{count}</span><button type="button" aria-label={'Agregar una porción de ' + food.name} onClick={() => change(food.id, 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9A742C] text-white"><Plus className="h-4 w-4" /></button></div></article>; })}
      </div>
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-sky-950"><Info className="h-4 w-4" /> Recuerda</div><p className="mt-1 text-xs leading-relaxed text-sky-950">Las cantidades son aproximadas y cambian según el tamaño, la marca y la preparación. Registra porciones de alimentos ya cocidos cuando así se indica. No necesitas alcanzar una cifra a cualquier costo.</p></div>
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-950"><ShieldAlert className="h-4 w-4" /> Importante</div><p className="mt-1 text-xs leading-relaxed text-amber-950">Si tienes enfermedad renal, estás embarazada o tienes otra condición que requiere una alimentación especial, utiliza esta herramienta solamente con orientación de tu profesional. Los datos no se guardan: al salir o actualizar la página, el registro del día se reinicia.</p></div>
    </section>
  );
}