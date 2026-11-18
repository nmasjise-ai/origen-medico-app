import test from "node:test";
import assert from "node:assert/strict";
import {
  isConfiguredAdministrator,
  isVerifiedAdministrator
} from "../api/_lib/admin-authorization.js";

const configuredUid = "trusted-admin-uid";
const configuredEmail = "doctor@example.com";

test("bootstrap accepts only the configured administrator with a verified matching email", () => {
  assert.equal(isConfiguredAdministrator({
    uid: configuredUid,
    email: "DOCTOR@example.com",
    email_verified: true
  }, configuredUid, configuredEmail), true);
});

test("bootstrap rejects an unverified matching email", () => {
  assert.equal(isConfiguredAdministrator({
    uid: configuredUid,
    email: configuredEmail,
    email_verified: false
  }, configuredUid, configuredEmail), false);
});

test("bootstrap rejects mismatched UID or email", () => {
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

test("bootstrap rejects missing configuration or incomplete token claims", () => {
  assert.equal(isConfiguredAdministrator(null, configuredUid, configuredEmail), false);
  assert.equal(isConfiguredAdministrator({ uid: configuredUid, email: configuredEmail }, configuredUid, configuredEmail), false);
  assert.equal(isConfiguredAdministrator({ uid: configuredUid, email: configuredEmail, email_verified: true }, "", configuredEmail), false);
  assert.equal(isConfiguredAdministrator({ uid: configuredUid, email: configuredEmail, email_verified: true }, configuredUid, ""), false);
});

test("protected APIs accept the admin claim for the configured UID without rechecking email_verified", () => {
  assert.equal(isVerifiedAdministrator({
    uid: configuredUid,
    email: configuredEmail,
    email_verified: false,
    admin: true
  }, configuredUid), true);
});

test("protected APIs reject another UID, missing claim, or missing configuration", () => {
  const base = { uid: configuredUid, admin: true };
  assert.equal(isVerifiedAdministrator(null, configuredUid), false);
  assert.equal(isVerifiedAdministrator({ ...base, uid: "other-uid" }, configuredUid), false);
  assert.equal(isVerifiedAdministrator({ ...base, admin: false }, configuredUid), false);
  assert.equal(isVerifiedAdministrator(base, ""), false);
  assert.equal(isVerifiedAdministrator(base, null), false);
});
