import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync("App.jsx", "utf8");

test("clinical client no longer reads the legacy localStorage cache", () => {
  assert.doesNotMatch(appSource, /localStorage\.getItem\(['"]origen_medico_clinic_v1['"]\)/);
});

test("clinical client never writes patient records to localStorage", () => {
  assert.doesNotMatch(appSource, /localStorage\.setItem\(['"]origen_medico_clinic_v1['"]/);
});

test("clinical client no longer references the shared legacy Firestore document", () => {
  assert.doesNotMatch(appSource, /clinic_state/);
  assert.doesNotMatch(appSource, /artifacts['"],\s*appId/);
});

test("legacy browser backup and Base64 QR upload handlers are removed", () => {
  assert.doesNotMatch(appSource, /handleExportBackup|handleImportBackup|handleQrImageUpload/);
  assert.doesNotMatch(appSource, /readAsDataURL/);
});

test("admin panel keeps clinical mutations blocked while sync is not active", () => {
  assert.match(appSource, /La migración a expedientes individuales sigue en curso/);
  assert.match(appSource, /setSyncStatus\('local'\)/);
});
