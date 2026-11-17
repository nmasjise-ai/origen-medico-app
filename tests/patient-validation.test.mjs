import test from "node:test";
import assert from "node:assert/strict";
import { normalizeNewPatient } from "../api/_lib/patient-validation.js";

test("normalizes a valid Bolivian patient record", () => {
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

test("allows an initial patient profile without optional clinical measurements", () => {
  const result = normalizeNewPatient({ displayName: "Paciente de prueba" });
  assert.equal(result.phoneE164, null);
  assert.deepEqual(result.initialMeasurement, {});
});

test("rejects missing or very short names", () => {
  assert.throws(() => normalizeNewPatient({ displayName: " " }), /nombre/i);
});

test("rejects invalid phone numbers", () => {
  assert.throws(() => normalizeNewPatient({ displayName: "Paciente", phone: "123" }), /teléfono/i);
});

test("rejects unsupported fields such as medication dose", () => {
  assert.throws(() => normalizeNewPatient({
    displayName: "Paciente",
    medication: "Tirzepatida",
    dose: "2.5 mg"
  }), /campos no permitidos/i);
});

test("rejects out-of-range measurements", () => {
  assert.throws(() => normalizeNewPatient({
    displayName: "Paciente",
    initialMeasurement: { weightKg: 999 }
  }), /weightKg/i);
});

test("rejects patient-controlled role or account assignment fields", () => {
  assert.throws(() => normalizeNewPatient({
    displayName: "Paciente",
    role: "admin",
    patientId: "another-patient"
  }), /campos no permitidos/i);
});
