import test from "node:test";
import assert from "node:assert/strict";
import {
  getLinkedPatientId,
  isPatientRecordLinkedToUser
} from "../api/_lib/patient-session-authorization.js";

const uid = "firebase-user-uid";
const patientId = "patient_12345";

test("accepts a patient mapping bound to the authenticated UID", () => {
  assert.equal(getLinkedPatientId({
    uid,
    role: "patient",
    patientId
  }, uid), patientId);
});

test("rejects missing, mismatched, or non-patient account mappings", () => {
  assert.equal(getLinkedPatientId(null, uid), null);
  assert.equal(getLinkedPatientId({ uid: "other", role: "patient", patientId }, uid), null);
  assert.equal(getLinkedPatientId({ uid, role: "admin", patientId }, uid), null);
  assert.equal(getLinkedPatientId({ uid, role: "patient", patientId: "../patients" }, uid), null);
  assert.equal(getLinkedPatientId({ uid, role: "patient" }, uid), null);
});

test("accepts only a patient record linked to the authenticated UID", () => {
  assert.equal(isPatientRecordLinkedToUser({
    linkedUid: uid,
    accountStatus: "linked"
  }, uid), true);
});

test("rejects missing, unlinked, or differently linked patient records", () => {
  assert.equal(isPatientRecordLinkedToUser(null, uid), false);
  assert.equal(isPatientRecordLinkedToUser({ linkedUid: uid, accountStatus: "invited" }, uid), false);
  assert.equal(isPatientRecordLinkedToUser({ linkedUid: "other", accountStatus: "linked" }, uid), false);
  assert.equal(isPatientRecordLinkedToUser({ linkedUid: uid, accountStatus: "linked" }, ""), false);
});
