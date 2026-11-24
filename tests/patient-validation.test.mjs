import test from "node:test";
import assert from "node:assert/strict";
import { normalizePatientProfile, normalizeNewPatient } from "../api/_lib/patient-validation.js";

const baseProfile = { displayName: "Paciente QA", waterGoalMl: 2000, proteinGoalGrams: 95 };

test("patient profile accepts clinician-defined water and protein goals", () => {
  const profile = normalizePatientProfile(baseProfile);
  assert.equal(profile.waterGoalMl, 2000);
  assert.equal(profile.proteinGoalGrams, 95);
});

test("patient profile clears unassigned individual goals", () => {
  const profile = normalizePatientProfile({ displayName: "Paciente QA", waterGoalMl: "", proteinGoalGrams: "" });
  assert.equal(profile.waterGoalMl, null);
  assert.equal(profile.proteinGoalGrams, null);
});

test("patient profile rejects out-of-range or non-integer water goals", () => {
  for (const waterGoalMl of [249, 7001, 1500.5, "abc"]) {
    assert.throws(() => normalizePatientProfile({ ...baseProfile, waterGoalMl }));
  }
});

test("patient profile rejects out-of-range protein goals", () => {
  for (const proteinGoalGrams of [0, 301, "abc"]) {
    assert.throws(() => normalizePatientProfile({ ...baseProfile, proteinGoalGrams }));
  }
});

test("new patient normalization preserves optional individual goals", () => {
  const patient = normalizeNewPatient({
    displayName: "Paciente QA", waterGoalMl: 2200, proteinGoalGrams: 110,
    initialMeasurement: { weightKg: 80 }
  });
  assert.equal(patient.waterGoalMl, 2200);
  assert.equal(patient.proteinGoalGrams, 110);
});
