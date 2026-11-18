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

import test from "node:test";
import assert from "node:assert/strict";
import { isVerifiedAdministrator } from "../api/_lib/admin-authorization.js";

test("accepts an administrator with a verified email and UID", () => {
  assert.equal(isVerifiedAdministrator({
    uid: "admin-uid",
    email: "doctor@example.com",
    email_verified: true,
    admin: true
  }), true);
});

test("rejects missing, unverified or non-admin sessions", () => {
  const base = {
    uid: "admin-uid",
    email: "doctor@example.com",
    email_verified: true,
    admin: true
  };
  assert.equal(isVerifiedAdministrator(null), false);
  assert.equal(isVerifiedAdministrator({ ...base, email_verified: false }), false);
  assert.equal(isVerifiedAdministrator({ ...base, admin: false }), false);
  assert.equal(isVerifiedAdministrator({ ...base, email: "" }), false);
  assert.equal(isVerifiedAdministrator({ ...base, uid: "" }), false);
});
