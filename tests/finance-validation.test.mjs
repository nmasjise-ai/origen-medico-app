import test from "node:test";
import assert from "node:assert/strict";
import { normalizeNewFinanceProduct, normalizeFinanceProductUpdate } from "../api/_lib/finance-validation.js";

const valid = {
  name: "Vitamina B12", category: "vitaminas", description: "Presentación de prueba",
  purchaseCostBs: "35", salePriceBs: "60", initialStock: "12", minimumStock: "3",
  unit: "ampolla", supplier: "Proveedor demo", lot: "L-DEMO", expiryDate: "2027-12-31"
};

test("normaliza producto y conserva importes en Bs", () => {
  const result = normalizeNewFinanceProduct(valid);
  assert.equal(result.purchaseCostBs, 35);
  assert.equal(result.salePriceBs, 60);
  assert.equal(result.initialStock, 12);
  assert.equal(result.category, "vitaminas");
});

test("rechaza categoría desconocida, precios negativos y stock fraccionado", () => {
  assert.throws(() => normalizeNewFinanceProduct({ ...valid, category: "clinico" }));
  assert.throws(() => normalizeNewFinanceProduct({ ...valid, salePriceBs: -1 }));
  assert.throws(() => normalizeNewFinanceProduct({ ...valid, initialStock: 1.5 }));
});

test("la edición general no permite alterar existencias", () => {
  assert.throws(() => normalizeFinanceProductUpdate({ currentStock: 999 }));
  assert.throws(() => normalizeFinanceProductUpdate({ initialStock: 999 }));
});

test("permite editar precio y desactivar sin borrar historial", () => {
  const result = normalizeFinanceProductUpdate({ salePriceBs: 75, active: false });
  assert.deepEqual(result, { salePriceBs: 75, active: false });
});
