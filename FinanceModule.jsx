import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Package, Pencil, Archive, RefreshCw, AlertTriangle, X, Save } from "lucide-react";

const EMPTY = {
  name: "", category: "vitaminas", description: "", purchaseCostBs: "",
  salePriceBs: "", initialStock: "0", minimumStock: "0", unit: "unidad",
  supplier: "", lot: "", expiryDate: ""
};
const CATEGORIES = [
  ["medicamentos", "Medicamentos"], ["sueroterapia", "Sueroterapia"],
  ["vitaminas", "Vitaminas"], ["suplementos", "Suplementos"],
  ["insumos_medicos", "Insumos médicos"], ["equipos", "Equipos"],
  ["productos_venta", "Productos de venta"], ["otros", "Otros"]
];

export default function FinanceModule({ user, isAdmin }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const request = useCallback(async (method, body) => {
    if (!user || !isAdmin) throw new Error("Se requiere una cuenta administradora.");
    const token = await user.getIdToken();
    const response = await fetch("/api/admin/finance/products", {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo completar la operación.");
    return payload;
  }, [user, isAdmin]);

  const load = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoading(true); setError("");
    try {
      const payload = await request("GET");
      setProducts(Array.isArray(payload.products) ? payload.products : []);
    } catch (err) {
      setError(err.message || "No se pudo cargar el inventario.");
    } finally { setLoading(false); }
  }, [request, user, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => products.filter((p) =>
    [p.name, p.category, p.supplier].join(" ").toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); setError(""); setNotice(""); };
  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || "", category: product.category || "otros",
      description: product.description || "", purchaseCostBs: String(product.purchaseCostBs ?? ""),
      salePriceBs: String(product.salePriceBs ?? ""), initialStock: "0",
      minimumStock: String(product.minimumStock ?? 0), unit: product.unit || "unidad",
      supplier: product.supplier || "", lot: product.lot || "", expiryDate: product.expiryDate || ""
    });
    setShowForm(true); setError(""); setNotice("");
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      if (editing) {
        const { initialStock, ...changes } = form;
        await request("PATCH", { id: editing.id, changes: {
          ...changes, purchaseCostBs: Number(changes.purchaseCostBs),
          salePriceBs: Number(changes.salePriceBs), minimumStock: Number(changes.minimumStock)
        }});
        setNotice("Producto actualizado. Las existencias no se modificaron.");
      } else {
        await request("POST", {
          ...form, purchaseCostBs: Number(form.purchaseCostBs),
          salePriceBs: Number(form.salePriceBs), initialStock: Number(form.initialStock),
          minimumStock: Number(form.minimumStock)
        });
        setNotice("Producto agregado al inventario de pruebas.");
      }
      setShowForm(false); await load();
    } catch (err) { setError(err.message || "No se pudo guardar el producto."); }
    finally { setSaving(false); }
  };
  const toggleActive = async (product) => {
    const action = product.active ? "desactivar" : "reactivar";
    if (!window.confirm(`¿Deseas ${action} ${product.name}? Se conservará su historial.`)) return;
    setError(""); setNotice("");
    try {
      await request("PATCH", { id: product.id, changes: { active: !product.active } });
      setNotice(product.active ? "Producto desactivado; el historial se conserva." : "Producto reactivado.");
      await load();
    } catch (err) { setError(err.message || "No se pudo cambiar el estado."); }
  };

  if (!isAdmin) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Acceso restringido al administrador.</div>;

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <strong className="block">ENTORNO DE PRUEBAS · INVENTARIO FICTICIO</strong>
        <span>Este catálogo está aislado del expediente clínico y no debe contener existencias ni movimientos reales todavía.</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div><p className="text-xs uppercase font-bold tracking-wider text-[#9A742C]">ORIGEN FINANZAS</p>
          <h2 className="font-serif text-2xl font-bold text-[#33291D]">Inventario y productos</h2>
          <p className="text-sm text-[#6B5A43]">Administra el catálogo directamente desde esta pantalla.</p></div>
        <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A742C] px-4 py-3 text-sm font-bold text-white"><Plus className="w-4 h-4"/> Agregar producto</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#E6D9C0] bg-[#FFFDF9] p-4"><p className="text-xs text-[#6B5A43]">Productos registrados</p><p className="text-2xl font-bold">{products.length}</p></div>
        <div className="rounded-2xl border border-[#E6D9C0] bg-[#FFFDF9] p-4"><p className="text-xs text-[#6B5A43]">Activos</p><p className="text-2xl font-bold">{products.filter(p=>p.active).length}</p></div>
        <div className="rounded-2xl border border-[#E6D9C0] bg-[#FFFDF9] p-4 col-span-2 lg:col-span-1"><p className="text-xs text-[#6B5A43]">Bajo stock</p><p className="text-2xl font-bold">{products.filter(p=>p.active && p.currentStock <= p.minimumStock).length}</p></div>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 w-4 h-4 text-stone-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por producto, categoría o proveedor" className="w-full rounded-xl border border-[#E6D9C0] bg-white py-2.5 pl-9 pr-3 text-sm"/></div>
        <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6D9C0] px-4 py-2.5 text-sm"><RefreshCw className="w-4 h-4"/> Actualizar</button>
      </div>
      {showForm && <div className="rounded-3xl border border-[#DFC99B] bg-[#FFFDF9] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-[#9A742C]">{editing ? "Editar ficha" : "Nuevo registro"}</p><h3 className="font-serif text-xl font-bold">{editing ? "Editar producto" : "Agregar producto"}</h3></div><button onClick={()=>setShowForm(false)} className="rounded-full p-2 hover:bg-stone-100" aria-label="Cerrar"><X className="w-5 h-5"/></button></div>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="text-xs font-semibold">Nombre *<input required maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Categoría *<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm">{CATEGORIES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
          <label className="text-xs font-semibold">Unidad<input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Costo compra (Bs) *<input required min="0" step="0.01" type="number" value={form.purchaseCostBs} onChange={e=>setForm({...form,purchaseCostBs:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Precio venta (Bs) *<input required min="0" step="0.01" type="number" value={form.salePriceBs} onChange={e=>setForm({...form,salePriceBs:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          {editing ? <label className="text-xs font-semibold">Existencias actuales<input disabled value={editing.currentStock} className="mt-1 w-full rounded-xl border bg-stone-100 p-2.5 text-sm"/></label> : <label className="text-xs font-semibold">Stock inicial<input required min="0" step="1" type="number" value={form.initialStock} onChange={e=>setForm({...form,initialStock:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>}
          <label className="text-xs font-semibold">Stock mínimo<input required min="0" step="1" type="number" value={form.minimumStock} onChange={e=>setForm({...form,minimumStock:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Proveedor<input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Lote (si aplica)<input value={form.lot} onChange={e=>setForm({...form,lot:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold">Vencimiento (si aplica)<input type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          <label className="text-xs font-semibold sm:col-span-2 lg:col-span-3">Descripción<textarea rows="2" maxLength={500} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-1 w-full rounded-xl border p-2.5 text-sm"/></label>
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap justify-end gap-2 pt-2"><button type="button" onClick={()=>setShowForm(false)} className="rounded-xl border px-4 py-2.5 text-sm">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#9A742C] px-4 py-2.5 text-sm font-bold text-white"><Save className="w-4 h-4"/>{saving ? "Guardando…" : "Guardar producto"}</button></div>
        </form>
      </div>}
      <div className="overflow-hidden rounded-3xl border border-[#E6D9C0] bg-[#FFFDF9]">
        <div className="flex items-center justify-between border-b border-[#E6D9C0] p-4"><h3 className="font-bold">Catálogo</h3><span className="text-xs text-stone-500">{filtered.length} resultado(s)</span></div>
        {loading ? <p className="p-8 text-center text-sm text-stone-500">Cargando inventario…</p> : filtered.length === 0 ? <div className="p-10 text-center"><Package className="mx-auto mb-3 h-9 w-9 text-[#B69A62]"/><p className="font-semibold">Aún no hay productos registrados</p><p className="mt-1 text-sm text-stone-500">Agrega el primer producto con el botón superior.</p></div> :
          <div className="divide-y divide-[#EEE5D5]">{filtered.map(p=><div key={p.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong>{p.name}</strong><span className="rounded-full bg-stone-100 px-2 py-1 text-[10px]">{CATEGORIES.find(c=>c[0]===p.category)?.[1] || p.category}</span>{!p.active && <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] text-rose-800">Inactivo</span>}</div><p className="mt-1 text-xs text-stone-500">Costo Bs {Number(p.purchaseCostBs).toFixed(2)} · Venta Bs {Number(p.salePriceBs).toFixed(2)} · Stock {p.currentStock} {p.unit}</p><p className="text-xs text-stone-500">Mínimo {p.minimumStock} · {p.supplier || "Sin proveedor asignado"}</p></div>
            <div className="flex shrink-0 gap-2"><button onClick={()=>openEdit(p)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"><Pencil className="h-3.5 w-3.5"/> Editar</button><button onClick={()=>toggleActive(p)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"><Archive className="h-3.5 w-3.5"/>{p.active ? "Desactivar" : "Reactivar"}</button></div>
          </div>)}</div>}
      </div>
      <p className="flex items-start gap-2 text-xs text-stone-500"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/> Las existencias no se editan desde la ficha. En la siguiente fase se habilitarán entradas, salidas y ajustes con motivo y auditoría.</p>
    </section>
  );
}
