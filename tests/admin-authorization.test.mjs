import test from "node:test";
import assert from "node:assert/strict";
import { isConfiguredAdministrator } from "../api/_lib/admin-authorization.js";

const configuredUid = "trusted-admin-uid";
const configuredEmail = "doctor@example.com";

test("accepts only the configured administrator with a verified matching email", () => {
  assert.equal(isConfiguredAdministrator({
    uid: configuredUid,
    email: "DOCTOR@example.com",
    email_verified: true
  }, configuredUid, configuredEmail), true);
});

test("rejects an unverified matching email", () => {
  assert.equal(isConfiguredAdministrator({
    uid: configuredUid,
    email: configuredEmail,
    email_verified: false
  }, configuredUid, configuredEmail), false);
});

test("rejects mismatched UID or email", () => {
  assert.equal(isConfiguredAdministrator({
    uid: "other-uid",
    email: configuredEmail,
    email_verified: true
  }, configuredUid, configuredEmail), false);

  assert.equal(isConfiguredAdministrator({
    uid: configuredUid,
    email: "attacker@example.com",
    email_verified: true
  }, configuredUid, configuredEmail), false);
});

test("rejects missing configuration or incomplete token claims", () => {
  assert.equal(isConfiguredAdministrator(null, configuredUid, configuredEmail), false);
  assert.equal(isConfiguredAdministrator({ uid: configuredUid, email: configuredEmail }, configuredUid, configuredEmail), false);
  assert.equal(isConfiguredAdministrator({ uid: configuredUid, email: configuredEmail, email_verified: true }, "", configuredEmail), false);
  assert.equal(isConfiguredAdministrator({ uid: configuredUid, email: configuredEmail, email_verified: true }, configuredUid, ""), false);
});
