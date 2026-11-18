import test from "node:test";
import assert from "node:assert/strict";
import { normalizeNewPatient, normalizePatientProfile } from "../api/_lib/patient-validation.js";

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

test("normalizes date of birth, sex, height and clinical history", () => {
  const result = normalizePatientProfile({
    displayName: "Paciente QA",
    birthDate: "1990-05-10",
    sexAtBirth: "female",
    heightCm: "164.5",
    activeDiagnoses: "Obesidad",
    medicalHistory: "Hipertensión",
    allergies: "Penicilina",
    concomitantMedications: "Losartán"
  });
  assert.equal(result.birthDate, "1990-05-10");
  assert.equal(result.sexAtBirth, "female");
  assert.equal(result.heightCm, 164.5);
  assert.equal(result.activeDiagnoses, "Obesidad");
  assert.equal(result.medicalHistory, "Hipertensión");
  assert.equal(result.allergies, "Penicilina");
  assert.equal(result.ageYears >= 36, true);
});

test("rejects future or malformed birth dates and invalid sex values", () => {
  assert.throws(() => normalizePatientProfile({ displayName: "Paciente", birthDate: "2030-01-01" }), /futuro/i);
  assert.throws(() => normalizePatientProfile({ displayName: "Paciente", birthDate: "1990-02-31" }), /fecha/i);
  assert.throws(() => normalizePatientProfile({ displayName: "Paciente", sexAtBirth: "admin" }), /sexo/i);
});

test("rejects invalid height and excessive clinical history", () => {
  assert.throws(() => normalizePatientProfile({ displayName: "Paciente", heightCm: 40 }), /talla/i);
  assert.throws(() => normalizePatientProfile({ displayName: "Paciente", allergies: "x".repeat(2001) }), /alergias/i);
});

test("normalizes phone numbers containing spaces, hyphens and country prefix", () => {
  const local = normalizePatientProfile({ displayName: "Paciente", phone: "712 345 67" });
  const international = normalizePatientProfile({ displayName: "Paciente", phone: "+591 712-34567" });
  assert.equal(local.phoneE164, "+59171234567");
  assert.equal(international.phoneE164, "+59171234567");
});
