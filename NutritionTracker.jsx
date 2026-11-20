import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Droplets, Utensils, Save, Info, Trophy } from 'lucide-react';

const ACTIVITY_TYPES = ['Caminata', 'Fuerza / pesas', 'Bicicleta', 'Natación', 'Baile', 'Movilidad / estiramiento', 'Otra actividad'];

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
  saving = false,
  weeklyHistory = []
}) {
  const [waterMl, setWaterMl] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [activityMinutes, setActivityMinutes] = useState('');
  const [activityDone, setActivityDone] = useState(false);
  const [activityType, setActivityType] = useState('Caminata');
  const [meals, setMeals] = useState({
    breakfast: false, lunch: false, dinner: false, snacks: false
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!dailyLog) {
      // Evita conservar datos del paciente anterior si cambia la sesión/cuenta.
      setWaterMl('');
      setProteinGrams('');
      setActivityMinutes('0');
      setActivityDone(false);
      setActivityType('Caminata');
      setMeals({ breakfast: false, lunch: false, dinner: false, snacks: false });
      setMessage('');
      return;
    }
    setWaterMl(String(dailyLog.waterMl ?? 0));
    setProteinGrams(String(dailyLog.proteinGrams ?? 0));
    setActivityMinutes(String(dailyLog.activityMinutes ?? 0));
    setActivityDone(Boolean(dailyLog.activityDone ?? Number(dailyLog.activityMinutes) > 0));
    setActivityType(ACTIVITY_TYPES.includes(dailyLog.activityType) ? dailyLog.activityType : 'Caminata');
    setMeals({
      breakfast: Boolean(dailyLog.meals?.breakfast),
      lunch: Boolean(dailyLog.meals?.lunch),
      dinner: Boolean(dailyLog.meals?.dinner),
      snacks: Boolean(dailyLog.meals?.snacks)
    });
    setMessage('Tu registro de hoy ya fue enviado. Puedes consultarlo aquí.');
  }, [dailyLog]);

  const weeklySummary = (() => {
    const entries = (Array.isArray(weeklyHistory) ? weeklyHistory : []).filter((entry) => entry && entry.dateKey);
    const water = entries.filter((entry) => Number.isFinite(entry.waterMl));
    const protein = entries.filter((entry) => Number.isFinite(entry.proteinGrams));
    const activity = entries.filter((entry) => Number.isFinite(entry.activityMinutes));
    const meals = entries.filter((entry) => entry.meals && typeof entry.meals === 'object');
    const average = (items, key) => items.length ? Math.round(items.reduce((sum, item) => sum + item[key], 0) / items.length) : null;
    const activeDays = activity.filter((entry) => entry.activityMinutes > 0).length;
    const checkedMeals = meals.reduce((sum, entry) => sum + ['breakfast', 'lunch', 'dinner', 'snacks'].filter((key) => entry.meals[key]).length, 0);
    return { days: entries.length, avgWater: average(water, 'waterMl'), avgProtein: average(protein, 'proteinGrams'), waterDays: water.length, proteinDays: protein.length, activityMinutes: activity.reduce((sum, entry) => sum + entry.activityMinutes, 0), activeDays, mealPercent: meals.length ? Math.round(checkedMeals / (meals.length * 4) * 100) : null };
  })();

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
      activityDone,
      activityType: activityDone ? activityType : null,
      meals
    };
    if (!Number.isFinite(payload.waterMl) || payload.waterMl < 0 || payload.waterMl > 7000
      || !Number.isFinite(payload.proteinGrams) || payload.proteinGrams < 0 || payload.proteinGrams > 300
      || !Number.isInteger(payload.activityMinutes) || payload.activityMinutes < 0 || payload.activityMinutes > 1440
      || (payload.activityDone && payload.activityMinutes < 1)) {
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

      <div className="mt-5 rounded-2xl border border-[#E9DFC9] bg-[#FBF8F1] p-4">
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-[#A17B34]" /><h4 className="text-sm font-bold text-[#514634]">Tu resumen de los últimos 7 días</h4></div>
        {weeklySummary.days === 0 ? <p className="mt-2 text-xs text-[#8D7D65]">Cuando registres tus hábitos, aquí verás tu progreso semanal.</p> : <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-3"><p className="text-[10px] text-[#8D7D65]">Agua promedio</p><p className="mt-1 text-lg font-bold text-[#30291F]">{weeklySummary.avgWater ?? '—'} <span className="text-[10px] font-normal">ml/día</span></p><p className="text-[10px] text-[#9A8A72]">{weeklySummary.waterDays} días registrados</p></div>
            <div className="rounded-xl bg-white p-3"><p className="text-[10px] text-[#8D7D65]">Proteína promedio</p><p className="mt-1 text-lg font-bold text-[#30291F]">{weeklySummary.avgProtein ?? '—'} <span className="text-[10px] font-normal">g/día</span></p><p className="text-[10px] text-[#9A8A72]">{weeklySummary.proteinDays} días registrados</p></div>
            <div className="rounded-xl bg-white p-3"><p className="text-[10px] text-[#8D7D65]">Actividad</p><p className="mt-1 text-lg font-bold text-[#30291F]">{weeklySummary.activityMinutes} <span className="text-[10px] font-normal">min</span></p><p className="text-[10px] text-[#9A8A72]">{weeklySummary.activeDays} días activos</p></div>
            <div className="rounded-xl bg-white p-3"><p className="text-[10px] text-[#8D7D65]">Comidas registradas</p><p className="mt-1 text-lg font-bold text-[#30291F]">{weeklySummary.mealPercent == null ? '—' : weeklySummary.mealPercent + '%'} </p><p className="text-[10px] text-[#9A8A72]">De los espacios registrados</p></div>
          </div>
          {weeklySummary.days >= 5 ? <p className="mt-3 rounded-xl border border-[#E8D8B5] bg-white p-3 text-xs font-medium text-[#735318]">¡Muy bien! Has registrado tus hábitos en {weeklySummary.days} de los últimos 7 días. La constancia también es un logro.</p> : <p className="mt-3 text-xs text-[#8D7D65]">Cada registro ayuda a conocer mejor tus hábitos. Sigue avanzando a tu ritmo.</p>}
        </>}
        <p className="mt-3 text-[10px] leading-relaxed text-[#8D7D65]">Los promedios se calculan solo con días registrados. Este resumen es descriptivo y no determina por sí mismo si una meta clínica se cumplió.</p>
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
              <input type="number" required min="0" max="1440" step="1" value={activityMinutes} onChange={e => setActivityMinutes(e.target.value)} disabled={!activityDone} className="mt-2 w-full rounded-xl border border-[#E9DFC9] bg-white px-3 py-2 text-lg font-semibold text-[#30291F] disabled:bg-[#F7F4ED] disabled:text-[#9A907F]" />
            </label>
          </div>

          <div className="grid gap-3 rounded-2xl border border-[#E9DFC9] bg-[#FBF8F1] p-4 sm:grid-cols-[1fr_1fr]">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#EFE6D5] bg-white p-3">
              <input type="checkbox" checked={activityDone} onChange={(event) => {
                const checked = event.target.checked;
                setActivityDone(checked);
                if (!checked) setActivityMinutes('0');
                else if (activityMinutes === '0') setActivityMinutes('30');
              }} className="h-5 w-5 accent-[#98732E]" />
              <span><span className="block text-sm font-semibold text-[#514634]">Hoy realicé ejercicio</span><span className="block text-[11px] text-[#8D7D65]">Marca si completaste alguna actividad</span></span>
            </label>
            <label className="block rounded-xl border border-[#EFE6D5] bg-white p-3">
              <span className="mb-2 block text-xs font-semibold text-[#776A56]">Tipo de actividad</span>
              <select value={activityType} onChange={(event) => setActivityType(event.target.value)} disabled={!activityDone} className="w-full rounded-xl border border-[#E9DFC9] bg-white px-3 py-2 text-sm text-[#30291F] disabled:cursor-not-allowed disabled:bg-[#F7F4ED] disabled:opacity-60">
                {ACTIVITY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
          </div>

          <aside className="rounded-2xl border border-[#E9DFC9] bg-gradient-to-br from-[#FFFEFC] to-[#F7F1E5] p-4" aria-labelledby="activity-benefits-title">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2 text-[#98732E]"><Activity className="h-5 w-5" /></div>
              <div className="min-w-0">
                <h4 id="activity-benefits-title" className="text-sm font-bold text-[#514634]">Tu movimiento también cuenta</h4>
                <p className="mt-1 text-xs leading-relaxed text-[#776A56]">Registrar tus minutos de actividad permite reconocer tu constancia y observar tus hábitos a lo largo del tratamiento.</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-white/80 p-3"><p className="text-xs font-semibold text-[#806126]">Músculo</p><p className="mt-1 text-[11px] leading-relaxed text-[#776A56]">El ejercicio de fuerza ayuda a preservar la masa muscular durante la pérdida de peso.</p></div>
              <div className="rounded-xl bg-white/80 p-3"><p className="text-xs font-semibold text-[#806126]">Metabolismo</p><p className="mt-1 text-[11px] leading-relaxed text-[#776A56]">Moverte con regularidad favorece la sensibilidad a la insulina y el control metabólico.</p></div>
              <div className="rounded-xl bg-white/80 p-3"><p className="text-xs font-semibold text-[#806126]">Salud integral</p><p className="mt-1 text-[11px] leading-relaxed text-[#776A56]">La actividad física contribuye a la salud cardiovascular, el ánimo y la capacidad funcional.</p></div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#806126]"><strong>Recuerda:</strong> no existe una cantidad diaria única que garantice evitar un estancamiento. La frecuencia, duración e intensidad deben ajustarse a tu evaluación clínica. La constancia y la progresión gradual son más importantes que exigirte de más.</p>
          </aside>

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
