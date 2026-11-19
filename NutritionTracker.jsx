import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Droplets, Utensils, Save, Info } from 'lucide-react';

const MEALS = [
  ['breakfast', 'Desayuno'],
  ['lunch', 'Almuerzo'],
  ['dinner', 'Cena'],
  ['snacks', 'Colaciones']
];

export function getBoliviaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export default function NutritionTracker({
  dailyLog,
  loading = false,
  error = '',
  onSave,
  saving = false
}) {
  const [waterMl, setWaterMl] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [activityMinutes, setActivityMinutes] = useState('');
  const [meals, setMeals] = useState({
    breakfast: false, lunch: false, dinner: false, snacks: false
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!dailyLog) {
      // Evita conservar datos del paciente anterior si cambia la sesión/cuenta.
      setWaterMl('');
      setProteinGrams('');
      setActivityMinutes('');
      setMeals({ breakfast: false, lunch: false, dinner: false, snacks: false });
      setMessage('');
      return;
    }
    setWaterMl(String(dailyLog.waterMl ?? 0));
    setProteinGrams(String(dailyLog.proteinGrams ?? 0));
    setActivityMinutes(String(dailyLog.activityMinutes ?? 0));
    setMeals({
      breakfast: Boolean(dailyLog.meals?.breakfast),
      lunch: Boolean(dailyLog.meals?.lunch),
      dinner: Boolean(dailyLog.meals?.dinner),
      snacks: Boolean(dailyLog.meals?.snacks)
    });
    setMessage('Tu registro de hoy ya fue enviado. Puedes consultarlo aquí.');
  }, [dailyLog]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    if ([waterMl, proteinGrams, activityMinutes].some((value) => value.trim() === '')) {
      setMessage('Completa los campos de agua, proteína y actividad antes de guardar.');
      return;
    }
    const payload = {
      waterMl: Number(waterMl),
      proteinGrams: Number(proteinGrams),
      activityMinutes: Number(activityMinutes),
      meals
    };
    if (!Number.isFinite(payload.waterMl) || payload.waterMl < 0 || payload.waterMl > 7000
      || !Number.isFinite(payload.proteinGrams) || payload.proteinGrams < 0 || payload.proteinGrams > 300
      || !Number.isInteger(payload.activityMinutes) || payload.activityMinutes < 0 || payload.activityMinutes > 1440) {
      setMessage('Revisa los valores: agua 0–7000 ml, proteína 0–300 g y actividad 0–1440 minutos.');
      return;
    }
    const result = await onSave?.(payload);
    if (result?.ok) setMessage('Registro diario guardado correctamente.');
    else if (result?.message) setMessage(result.message);
  };

  return (
    <section className="rounded-3xl border border-[#E9DFC9] bg-white p-5 shadow-[0_8px_28px_rgba(67,49,18,0.045)] sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#F7F0E1] p-3 text-[#98732E]"><Activity className="h-5 w-5" /></div>
        <div><h3 className="font-serif text-xl font-bold text-[#30291F]">Tracker Diario ORIGEN</h3><p className="mt-1 text-xs text-[#8D7D65]">Registro del {new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())} · hora de Bolivia</p></div>
      </div>

      {loading ? <p className="mt-4 text-sm text-[#806126]">Cargando tu registro…</p> : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block rounded-2xl border border-[#EFE6D5] bg-[#FFFEFC] p-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#776A56]"><Droplets className="h-4 w-4 text-[#A17B34]" /> Agua (ml)</span>
              <input type="number" required min="0" max="7000" step="50" value={waterMl} onChange={e => setWaterMl(e.target.value)} className="mt-2 w-full rounded-xl border border-[#E9DFC9] bg-white px-3 py-2 text-lg font-semibold text-[#30291F]" />
            </label>
            <label className="block rounded-2xl border border-[#EFE6D5] bg-[#FFFEFC] p-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#776A56]"><Utensils className="h-4 w-4 text-[#A17B34]" /> Proteína (g)</span>
              <input type="number" required min="0" max="300" step="1" value={proteinGrams} onChange={e => setProteinGrams(e.target.value)} className="mt-2 w-full rounded-xl border border-[#E9DFC9] bg-white px-3 py-2 text-lg font-semibold text-[#30291F]" />
            </label>
            <label className="block rounded-2xl border border-[#EFE6D5] bg-[#FFFEFC] p-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#776A56]"><Activity className="h-4 w-4 text-[#A17B34]" /> Actividad (min)</span>
              <input type="number" required min="0" max="1440" step="1" value={activityMinutes} onChange={e => setActivityMinutes(e.target.value)} className="mt-2 w-full rounded-xl border border-[#E9DFC9] bg-white px-3 py-2 text-lg font-semibold text-[#30291F]" />
            </label>
          </div>

          <fieldset>
            <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#514634]"><CheckCircle2 className="h-4 w-4 text-[#A17B34]" /> Comidas realizadas</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MEALS.map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-xl border border-[#EFE6D5] bg-[#FFFEFC] px-3 py-3 text-sm text-[#71634E]">
                <input type="checkbox" checked={meals[key]} onChange={e => setMeals(current => ({ ...current, [key]: e.target.checked }))} className="h-4 w-4 accent-[#98732E]" />
                {label}
              </label>)}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#8D7D65]"><Info className="mt-0.5 h-4 w-4 shrink-0" />Registro descriptivo. Las metas de agua y proteína deben ser indicadas por tu profesional.</p>
            <button type="submit" disabled={saving || Boolean(dailyLog)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#806126] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? 'Guardando…' : dailyLog ? 'Registro enviado' : 'Guardar registro'}
            </button>
          </div>
          {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {message ? <p role="status" className="rounded-xl bg-[#F7F1E5] p-3 text-sm text-[#735318]">{message}</p> : null}
        </form>
      )}
    </section>
  );
}
