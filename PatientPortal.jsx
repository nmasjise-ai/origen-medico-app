import React, { useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, CalendarDays, CheckCircle2,
  ChevronRight, ClipboardList, Droplets, HeartPulse, Home, Info,
  RefreshCw, Scale, ShieldCheck, User, Utensils, Waves
} from 'lucide-react';
const NutritionEducation = React.lazy(() => import('./NutritionEducation.jsx'));

const NAV_ITEMS = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'evolution', label: 'Evolución', icon: Activity },
  { id: 'plan', label: 'Mi plan', icon: ClipboardList },
  { id: 'profile', label: 'Perfil', icon: User }
];

const hasValidWeight = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0;

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Card = ({ children, className = '' }) => (
  <section className={'rounded-3xl border border-[#E9DFC9] bg-white shadow-[0_8px_28px_rgba(67,49,18,0.045)] ' + className}>
    {children}
  </section>
);

const Metric = ({ label, value, suffix, icon: Icon, detail }) => (
  <div className="rounded-2xl border border-[#EFE6D5] bg-[#FFFEFC] p-4 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[#88785F]">{label}</span>
      {Icon ? <Icon className="h-4 w-4 text-[#A98235]" /> : null}
    </div>
    <div className="mt-2 flex items-baseline gap-1">
      <strong className="text-2xl tracking-tight text-[#28231C]">{value == null || value === '' ? '—' : value}</strong>
      {suffix ? <span className="text-xs text-[#88785F]">{suffix}</span> : null}
    </div>
    {detail ? <p className="mt-1 text-[11px] text-[#9A8A72]">{detail}</p> : null}
  </div>
);

function WeightChart({ measurements }) {
  const series = useMemo(() => [...(measurements || [])]
    .filter((item) => hasValidWeight(item.weightKg))
    .slice(0, 30)
    .reverse(), [measurements]);

  if (!series.length) {
    return <div className="rounded-2xl bg-[#FBF8F1] p-6 text-center text-sm text-[#82745F]">Todavía no hay controles de peso registrados.</div>;
  }
  if (series.length === 1) {
    return <div className="rounded-2xl bg-[#FBF8F1] p-6 text-center text-sm text-[#82745F]">Hay un control registrado. Añade otro control para visualizar la tendencia.</div>;
  }

  const weights = series.map((item) => Number(item.weightKg));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = Math.max(max - min, 1);
  const points = series.map((item, index) => {
    const x = 12 + (index * 276 / (series.length - 1));
    const y = 86 - ((Number(item.weightKg) - min) / range) * 64;
    return x + ',' + y;
  }).join(' ');

  return (
    <div className="rounded-2xl border border-[#EFE6D5] bg-[#FFFEFC] p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div><p className="text-sm font-semibold text-[#332A1D]">Tendencia de peso</p><p className="text-xs text-[#91816A]">Registros disponibles · orden cronológico</p></div>
        <span className="rounded-full bg-[#F6EFDF] px-3 py-1 text-xs font-semibold text-[#806126]">{series.length} controles</span>
      </div>
      <svg viewBox="0 0 300 108" role="img" aria-label="Gráfico de evolución del peso registrado" className="mt-4 h-36 w-full overflow-visible">
        <line x1="12" y1="88" x2="288" y2="88" stroke="#E9DFC9" strokeWidth="1" />
        <line x1="12" y1="54" x2="288" y2="54" stroke="#F1EBDD" strokeWidth="1" strokeDasharray="3 4" />
        <polyline points={points} fill="none" stroke="#A98235" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {series.map((item, index) => {
          const x = 12 + (index * 276 / (series.length - 1));
          const y = 86 - ((Number(item.weightKg) - min) / range) * 64;
          return <g key={item.id || index}><circle cx={x} cy={y} r="4" fill="#A98235" stroke="#fff" strokeWidth="2" /><title>{Number(item.weightKg) + ' kg · ' + formatDate(item.recordedAt)}</title></g>;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-[#91816A]">
        <span>{formatDate(series[0].recordedAt)}</span><span>{formatDate(series[series.length - 1].recordedAt)}</span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[#91816A]">Visualización descriptiva de los datos registrados. No representa una meta ni sustituye la valoración del equipo médico.</p>
    </div>
  );
}

export default function PatientPortal({ profile, data, loading, error, onRefresh }) {
  const [activeTab, setActiveTab] = useState('home');
  const patient = data?.patient || {};
  const measurements = Array.isArray(data?.measurements) ? data.measurements : [];
  const latest = measurements[0] || {};
  const firstWeight = [...measurements].reverse().find((item) => hasValidWeight(item.weightKg))?.weightKg;
  const latestWeight = hasValidWeight(latest.weightKg) ? Number(latest.weightKg) : null;
  const change = latestWeight != null && firstWeight != null ? Number((latestWeight - Number(firstWeight)).toFixed(1)) : null;
  const height = Number(latest.heightCm || patient.heightCm);
  const bmi = latest.bmi ?? (latestWeight != null && height > 0 ? (latestWeight / Math.pow(height / 100, 2)).toFixed(1) : null);
  const displayName = profile?.displayName || patient.displayName || 'Paciente';
  const tabTitle = NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Inicio';

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-24 text-[#30291F]">
      <header className="sticky top-0 z-30 border-b border-[#EAE1D1] bg-[#FFFEFC]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E8D8B5] bg-[#FBF5E8] text-[#98732E]"><HeartPulse className="h-5 w-5" /></div>
            <div><p className="font-serif text-sm font-bold tracking-[0.12em] text-[#735318]">ORIGEN MÉDICO</p><p className="text-[10px] tracking-[0.12em] text-[#9A8259]">PORTAL DEL PACIENTE</p></div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#E9DFC9] bg-white px-3 py-2 text-xs text-[#74664F] sm:flex"><ShieldCheck className="h-4 w-4 text-[#9A742C]" /> Espacio privado</div>
          <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#E5D8BE] bg-white px-3 py-2 text-xs font-semibold text-[#735318] disabled:opacity-50">
            <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} /><span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A17B34]">{tabTitle}</p><h1 className="mt-1 font-serif text-2xl font-bold text-[#2B251C] sm:text-3xl">{activeTab === 'home' ? 'Tu bienestar, paso a paso.' : tabTitle}</h1></div>
          <div className="hidden rounded-2xl bg-[#F7F1E5] px-4 py-3 text-right sm:block"><p className="text-[10px] uppercase tracking-wider text-[#8B795C]">Cuenta vinculada</p><p className="text-xs font-semibold text-[#735318]">Acceso individual</p></div>
        </div>

        {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
        {loading ? <div className="rounded-2xl border border-[#E9DFC9] bg-white p-5 text-sm text-[#806126]">Cargando tu información personal…</div> : null}

        {activeTab === 'home' ? (
          <>
            <section className="relative overflow-hidden rounded-[28px] bg-[#29241D] p-6 text-[#FFFDF8] sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-[#B89655]/25" />
              <div className="pointer-events-none absolute -right-2 -top-8 h-40 w-40 rounded-full border border-[#B89655]/20" />
              <div className="relative max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D8B96F]">Bienvenido a tu espacio ORIGEN</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">Hola, {displayName.split(' ')[0]}.</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#E8DDC9]">Aquí puedes consultar tu evolución y acceder a los recursos de acompañamiento de tu equipo de salud.</p>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#E8DDC9]"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2"><ShieldCheck className="h-4 w-4 text-[#D8B96F]" /> Expediente individual</span><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2"><CalendarDays className="h-4 w-4 text-[#D8B96F]" /> Datos actualizados desde tu expediente</span></div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="Último peso" value={latestWeight} suffix="kg" icon={Scale} detail={latest.recordedAt ? formatDate(latest.recordedAt) : 'Sin control registrado'} />
              <Metric label="IMC registrado" value={bmi} icon={Activity} detail="Calculado con talla disponible" />
              <Metric label="Cintura" value={latest.waistCm} suffix="cm" icon={Waves} detail="Último dato registrado" />
              <Metric label="Cambio de peso" value={change == null ? '—' : Math.abs(change)} suffix={change == null ? '' : 'kg'} icon={change == null ? Activity : change <= 0 ? ArrowDownRight : ArrowUpRight} detail={change == null ? 'Se requieren controles' : change < 0 ? 'Respecto al primer registro' : change > 0 ? 'Respecto al primer registro' : 'Sin variación'} />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
              <Card className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-serif text-xl font-bold">Tu evolución</h3><p className="mt-1 text-xs text-[#8D7D65]">Un resumen de tus controles registrados</p></div><button type="button" onClick={() => setActiveTab('evolution')} className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A6728]">Ver detalle <ChevronRight className="h-4 w-4" /></button></div>
                <WeightChart measurements={measurements.slice(0, 8)} />
              </Card>
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2"><div className="rounded-xl bg-[#F7F0E1] p-2 text-[#98732E]"><ShieldCheck className="h-5 w-5" /></div><h3 className="font-serif text-lg font-bold">Acompañamiento médico</h3></div>
                <p className="mt-3 text-sm leading-relaxed text-[#776A56]">Tus indicaciones clínicas son registradas por el equipo de ORIGEN. Si tienes dudas o presentas síntomas nuevos, solicita orientación al consultorio.</p>
                <div className="mt-4 rounded-2xl bg-[#FBF8F1] p-4"><p className="text-xs font-semibold text-[#735318]">Próximo paso</p><p className="mt-1 text-sm text-[#5F5546]">Mantén tus controles y revisa las recomendaciones educativas disponibles.</p></div>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[{icon:Droplets,title:'Hidratación',desc:'Seguimiento diario en preparación'},{icon:Utensils,title:'Nutrición',desc:'Recursos educativos disponibles'},{icon:Activity,title:'Actividad física',desc:'Registro diario en preparación'}].map((item) => <Card key={item.title} className="p-4"><item.icon className="h-5 w-5 text-[#A17B34]" /><p className="mt-3 text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[#8D7D65]">{item.desc}</p></Card>)}
            </div>
          </>
        ) : null}

        {activeTab === 'evolution' ? (
          <div className="space-y-5">
            <Card className="p-5 sm:p-6"><div className="mb-5"><h2 className="font-serif text-xl font-bold">Resumen antropométrico</h2><p className="mt-1 text-xs text-[#8D7D65]">Solo se muestran mediciones registradas en tu expediente.</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Peso actual" value={latestWeight} suffix="kg" icon={Scale} /><Metric label="Talla" value={height || null} suffix="cm" icon={Activity} /><Metric label="IMC" value={bmi} icon={HeartPulse} /><Metric label="Cintura" value={latest.waistCm} suffix="cm" icon={Waves} /></div></Card>
            <Card className="p-5 sm:p-6"><WeightChart measurements={measurements} /></Card>
            <Card className="overflow-hidden"><div className="border-b border-[#EFE6D5] p-5"><h3 className="font-serif text-lg font-bold">Historial de controles</h3><p className="mt-1 text-xs text-[#8D7D65]">Hasta 30 registros disponibles</p></div>{measurements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-[#FBF8F1] text-[11px] uppercase tracking-wider text-[#8D7D65]"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Peso</th><th className="px-5 py-3">IMC</th><th className="px-5 py-3">Cintura</th></tr></thead><tbody>{measurements.map((item) => <tr key={item.id} className="border-t border-[#F1EBDD]"><td className="px-5 py-3 text-[#71634E]">{formatDate(item.recordedAt)}</td><td className="px-5 py-3 font-semibold">{item.weightKg == null ? '—' : item.weightKg + ' kg'}</td><td className="px-5 py-3">{item.bmi ?? '—'}</td><td className="px-5 py-3">{item.waistCm == null ? '—' : item.waistCm + ' cm'}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-[#8D7D65]">Aún no hay controles registrados.</p>}</Card>
          </div>
        ) : null}

        {activeTab === 'plan' ? (
          <div className="space-y-5">
            <Card className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A17B34]">Educación y orientación</p><h2 className="mt-2 font-serif text-2xl font-bold">Aprende a cuidar tu bienestar</h2><p className="mt-2 text-sm leading-relaxed text-[#776A56]">Material educativo general. Tu plan nutricional individual y las indicaciones terapéuticas deben ser definidos por tu equipo de salud.</p></Card>
            <React.Suspense fallback={<div className="rounded-2xl bg-[#FBF8F1] p-5 text-sm text-[#806126]">Cargando material educativo…</div>}>
              <NutritionEducation />
            </React.Suspense>
          </div>
        ) : null}

        {activeTab === 'profile' ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><div className="rounded-2xl bg-[#F7F0E1] p-3 text-[#98732E]"><User className="h-6 w-6" /></div><div><h2 className="font-serif text-xl font-bold">{displayName}</h2><p className="text-xs text-[#8D7D65]">Perfil vinculado al expediente</p></div></div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between border-b border-[#F1EBDD] pb-3"><span className="text-[#8D7D65]">Talla registrada</span><strong>{height ? height + ' cm' : '—'}</strong></div><div className="flex justify-between border-b border-[#F1EBDD] pb-3"><span className="text-[#8D7D65]">Fecha de nacimiento</span><strong>{patient.birthDate || 'No registrada'}</strong></div></div></Card>
            <Card className="p-5 sm:p-6"><h3 className="font-serif text-lg font-bold">Información clínica visible</h3><div className="mt-4 space-y-4"><div><p className="text-xs font-semibold text-[#8A6728]">Diagnósticos activos</p><p className="mt-1 whitespace-pre-wrap text-sm text-[#71634E]">{patient.activeDiagnoses || 'Sin información registrada.'}</p></div><div className="border-t border-[#F1EBDD] pt-4"><p className="text-xs font-semibold text-[#8A6728]">Alergias</p><p className="mt-1 whitespace-pre-wrap text-sm text-[#71634E]">{patient.allergies || 'Sin información registrada.'}</p></div></div></Card>
          </div>
        ) : null}

        <div className="flex items-start gap-3 rounded-2xl border border-[#E9DFC9] bg-[#F7F1E5] p-4 text-xs leading-relaxed text-[#75664F]"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#96702B]" /><p>Este portal permite consultar información registrada por ORIGEN Médico. No realiza diagnósticos, no modifica tratamientos ni reemplaza una consulta profesional. Si presentas síntomas intensos o una urgencia, busca atención médica inmediata.</p></div>
      </main>

      <nav aria-label="Navegación del portal del paciente" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DFC9] bg-[#FFFEFC]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(67,49,18,0.06)] backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-4 px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const selected = activeTab === item.id;
            return <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} aria-current={selected ? 'page' : undefined} className={'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-colors ' + (selected ? 'bg-[#F6EFDF] text-[#795A22]' : 'text-[#94866F] hover:bg-[#FAF7F0]')}><Icon className="h-5 w-5" /><span>{item.label}</span></button>;
          })}
        </div>
      </nav>
    </div>
  );
}
