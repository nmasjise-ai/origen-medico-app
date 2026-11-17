import test from "node:test";
import assert from "node:assert/strict";
import { normalizeNewPatient } from "../api/_lib/patient-validation.js";

test("normalizes a valid Bolivian patient profile and measurements", () => {
  const result = normalizeNewPatient({
    displayName: "  María   Pérez  ",
    phone: "71234567",
    ageYears: "42",
    initialMeasurement: {
      weightKg: "84.5",
      waistCm: "96",
      muscleKg: "28.2"
    }
  });

  assert.equal(result.displayName, "María Pérez");
  assert.equal(result.phoneE164, "+59171234567");
  assert.equal(result.ageYears, 42);
  assert.equal(result.initialMeasurement.weightKg, 84.5);
  assert.equal(result.initialMeasurement.waistCm, 96);
});

test("allows a minimal profile without optional details", () => {
  const result = normalizeNewPatient({ displayName: "Paciente de prueba" });
  assert.equal(result.phoneE164, null);
  assert.deepEqual(result.initialMeasurement, {});
});

test("rejects missing or short names", () => {
  assert.throws(() => normalizeNewPatient({ displayName: " " }), /nombre/i);
});

test("rejects invalid phone numbers", () => {
  assert.throws(() => normalizeNewPatient({ displayName: "Paciente", phone: "123" }), /teléfono/i);
});

test("rejects medication and role fields from the profile form", () => {
  assert.throws(() => normalizeNewPatient({
    displayName: "Paciente",
    medication: "Tirzepatida",
    dose: "2.5 mg",
    role: "admin"
  }), /campos no permitidos/i);
});

test("rejects out-of-range measurements", () => {
  assert.throws(() => normalizeNewPatient({
    displayName: "Paciente",
    initialMeasurement: { weightKg: 999 }
  }), /weightKg/i);
});

test("rejects invalid age", () => {
  assert.throws(() => normalizeNewPatient({
    displayName: "Paciente",
    ageYears: 0
  }), /edad/i);
});
