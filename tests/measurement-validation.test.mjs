import test from "node:test";
import assert from "node:assert/strict";
import {
  validatePatientMeasurement,
  validatePreviewPatientId
} from "../api/_lib/measurement-validation.js";

test("accepts valid weight and waist values", () => {
  assert.deepEqual(
    validatePatientMeasurement({ weightKg: "82.4", waistCm: "95" }),
    { weightKg: 82.4, waistCm: 95 }
  );
});

test("accepts a single measurement and ignores blank optional fields", () => {
  assert.deepEqual(
    validatePatientMeasurement({ weightKg: "82", waistCm: "" }),
    { weightKg: 82 }
  );
});

test("rejects empty measurement payloads", () => {
  assert.throws(() => validatePatientMeasurement({}), /al menos una medición/i);
  assert.throws(() => validatePatientMeasurement({ weightKg: "" }), /al menos una medición/i);
});

test("rejects unapproved fields", () => {
  assert.throws(
    () => validatePatientMeasurement({ medication: "tirzepatida", dose: "2.5mg" }),
    /campos no permitidos/i
  );
});

test("rejects out-of-range body measurements", () => {
  assert.throws(() => validatePatientMeasurement({ weightKg: 999 }), /fuera del rango/i);
  assert.throws(() => validatePatientMeasurement({ bodyFatPct: 0 }), /fuera del rango/i);
});

test("accepts generated preview patient identifiers", () => {
  assert.equal(validatePreviewPatientId("abc12345_xY"), "abc12345_xY");
  assert.equal(validatePreviewPatientId(["abc12345_xY"]), "abc12345_xY");
});

test("rejects arbitrary path and malformed patient identifiers", () => {
  assert.throws(() => validatePreviewPatientId("../patients"), /identificador/i);
  assert.throws(() => validatePreviewPatientId("short"), /identificador/i);
  assert.throws(() => validatePreviewPatientId(null), /identificador/i);
});
