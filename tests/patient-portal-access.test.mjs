import test from "node:test";
import assert from "node:assert/strict";
import { getPatientPortalAccessState, validatePortalAccessChange } from "../api/_lib/patient-portal-access.js";

test("portal access is enabled by default for existing linked accounts", () => {
  assert.deepEqual(getPatientPortalAccessState({ role: "patient" }, { accountStatus: "linked" }), {
    enabled: true, status: "enabled", reason: null
  });
});

test("portal access is denied when either user mapping or patient record is suspended", () => {
  assert.equal(getPatientPortalAccessState({ portalAccessStatus: "suspended" }, {}).enabled, false);
  assert.equal(getPatientPortalAccessState({}, { portalAccessStatus: "suspended", portalAccessReason: "payment" }).enabled, false);
});

test("suspension requires a meaningful reason", () => {
  assert.throws(() => validatePortalAccessChange({ action: "suspend", reason: "no" }), { statusCode: 400 });
  assert.deepEqual(validatePortalAccessChange({ action: "suspend", reason: "Pago vencido" }), { action: "suspend", reason: "Pago vencido" });
});

test("reactivation accepts an optional reason and rejects unknown actions", () => {
  assert.deepEqual(validatePortalAccessChange({ action: "reactivate" }), { action: "reactivate", reason: "" });
  assert.throws(() => validatePortalAccessChange({ action: "delete" }), { statusCode: 400 });
});
