const CATEGORIES = new Set(["medicamentos", "sueroterapia", "vitaminas", "suplementos", "insumos_medicos", "equipos", "productos_venta", "otros"]);

function cleanText(value, field, max = 120, required = true) {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) throw new Error(`El campo ${field} es obligatorio.`);
  if (text.length > max) throw new Error(`El campo ${field} supera ${max} caracteres.`);
  return text;
}

function money(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100000000) {
    throw new Error(`El campo ${field} debe ser un importe válido en Bs.`);
  }
  return Math.round(number * 100) / 100;
}

function integer(value, field, max = 10000000) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > max) {
    throw new Error(`El campo ${field} debe ser un número entero no negativo.`);
  }
  return number;
}

export function normalizeNewFinanceProduct(input = {}) {
  const category = cleanText(input.category, "categoría", 40);
  if (!CATEGORIES.has(category)) throw new Error("La categoría seleccionada no es válida.");
  return {
    name: cleanText(input.name, "nombre", 120),
    category,
    description: cleanText(input.description, "descripción", 500, false),
    purchaseCostBs: money(input.purchaseCostBs, "costo de compra"),
    salePriceBs: money(input.salePriceBs, "precio de venta"),
    initialStock: integer(input.initialStock, "stock inicial"),
    minimumStock: integer(input.minimumStock, "stock mínimo"),
    unit: cleanText(input.unit || "unidad", "unidad", 30),
    supplier: cleanText(input.supplier, "proveedor", 120, false),
    lot: cleanText(input.lot, "lote", 80, false),
    expiryDate: cleanText(input.expiryDate, "vencimiento", 10, false)
  };
}

export function normalizeFinanceProductUpdate(input = {}) {
  const allowed = ["name", "category", "description", "purchaseCostBs", "salePriceBs", "minimumStock", "unit", "supplier", "lot", "expiryDate", "active"];
  const patch = {};
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) throw new Error(`No se permite modificar el campo ${key} desde la edición general.`);
  }
  if ("name" in input) patch.name = cleanText(input.name, "nombre", 120);
  if ("category" in input) {
    patch.category = cleanText(input.category, "categoría", 40);
    if (!CATEGORIES.has(patch.category)) throw new Error("La categoría seleccionada no es válida.");
  }
  if ("description" in input) patch.description = cleanText(input.description, "descripción", 500, false);
  if ("purchaseCostBs" in input) patch.purchaseCostBs = money(input.purchaseCostBs, "costo de compra");
  if ("salePriceBs" in input) patch.salePriceBs = money(input.salePriceBs, "precio de venta");
  if ("minimumStock" in input) patch.minimumStock = integer(input.minimumStock, "stock mínimo");
  if ("unit" in input) patch.unit = cleanText(input.unit, "unidad", 30);
  if ("supplier" in input) patch.supplier = cleanText(input.supplier, "proveedor", 120, false);
  if ("lot" in input) patch.lot = cleanText(input.lot, "lote", 80, false);
  if ("expiryDate" in input) patch.expiryDate = cleanText(input.expiryDate, "vencimiento", 10, false);
  if ("active" in input) {
    if (typeof input.active !== "boolean") throw new Error("El estado activo debe ser verdadero o falso.");
    patch.active = input.active;
  }
  if (!Object.keys(patch).length) throw new Error("No hay cambios válidos para guardar.");
  return patch;
}
