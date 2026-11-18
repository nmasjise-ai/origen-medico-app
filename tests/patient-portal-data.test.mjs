import test from "node:test";
import assert from "node:assert/strict";
import {
  toPatientVisibleProfile,
  toPatientVisibleMeasurement
} from "../api/_lib/patient-portal-data.js";

test("patient profile serializer exposes only the patient-visible allowlist", () => {
  const result = toPatientVisibleProfile({
    displayName: "Paciente QA",
    email: "qa@example.com",
    birthDate: "1990-05-10",
    ageYears: 36,
    sexAtBirth: "female",
    heightCm: 165,
    activeDiagnoses: "Obesidad",
    medicalHistory: "Antecedente controlado",
    allergies: "Ninguna conocida",
    concomitantMedications: "Tratamiento habitual",
    linkedUid: "private-uid",
    activeInvitationHash: "private-hash",
    internalRiskFlag: "doctor-only",
    doctorNotes: "nota privada",
    accountStatus: "linked"
  }, "patient_12345");

  assert.equal(result.id, "patient_12345");
  assert.equal(result.displayName, "Paciente QA");
  assert.equal(result.activeDiagnoses, "Obesidad");
  assert.equal("linkedUid" in result, false);
  assert.equal("activeInvitationHash" in result, false);
  assert.equal("internalRiskFlag" in result, false);
  assert.equal("doctorNotes" in result, false);
  assert.equal("accountStatus" in result, false);
});

test("patient measurement serializer calculates BMI and uses profile height fallback", () => {
  const result = toPatientVisibleMeasurement({
    weightKg: 81,
    waistCm: 92,
    recordedAt: new Date("2026-11-18T10:00:00.000Z"),
    recordedByUid: "private-doctor-uid",
    source: "manual_control"
  }, "measurement-1", 180);

  assert.equal(result.weightKg, 81);
  assert.equal(result.heightCm, 180);
  assert.equal(result.bmi, 25);
  assert.equal(result.waistCm, 92);
  assert.equal("recordedByUid" in result, false);
  assert.equal("source" in result, false);
});

test("patient measurement serializer rejects non-numeric values and missing height", () => {
  const result = toPatientVisibleMeasurement({
    weightKg: "81",
    heightCm: 0,
    muscleKg: NaN
  }, "measurement-2");

  assert.equal(result.weightKg, null);
  assert.equal(result.heightCm, null);
  assert.equal(result.bmi, null);
  assert.equal(result.muscleKg, null);
});
