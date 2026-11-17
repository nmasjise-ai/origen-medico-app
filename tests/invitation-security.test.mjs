import test from "node:test";
import assert from "node:assert/strict";
import {
  createInvitationToken,
  hashInvitationToken,
  invitationIsActive,
  normalizeInvitationEmail,
  normalizeInvitationToken,
  INVITATION_TTL_MS
} from "../api/_lib/invitation-security.js";

test("generates a high-entropy URL-safe invitation token", () => {
  const first = createInvitationToken();
  const second = createInvitationToken();
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
});

test("stores only a SHA-256 hash representation", () => {
  const token = createInvitationToken();
  const hash = hashInvitationToken(token);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(hashInvitationToken(token), hash);
});

test("normalizes invitation emails", () => {
  assert.equal(normalizeInvitationEmail("  Patient@Example.COM "), "patient@example.com");
});

test("rejects malformed email addresses", () => {
  assert.throws(() => normalizeInvitationEmail("not-an-email"), /correo electrónico/i);
  assert.throws(() => normalizeInvitationEmail("a@b"), /correo electrónico/i);
  assert.throws(() => normalizeInvitationEmail("a".repeat(250) + "@example.com"), /correo electrónico/i);
});

test("accepts only generated token format", () => {
  const token = createInvitationToken();
  assert.equal(normalizeInvitationToken(token), token);
  assert.throws(() => normalizeInvitationToken("short"), /invitación/i);
  assert.throws(() => normalizeInvitationToken("../secrets"), /invitación/i);
});

test("accepts a pending, matching and unexpired invitation", () => {
  const now = Date.now();
  const invitation = {
    email: "patient@example.com",
    status: "pending",
    expiresAt: new Date(now + INVITATION_TTL_MS)
  };
  assert.equal(invitationIsActive(invitation, "patient@example.com", now), true);
});

test("rejects expired, revoked, used or email-mismatched invitations", () => {
  const now = Date.now();
  const base = {
    email: "patient@example.com",
    status: "pending",
    expiresAt: new Date(now - 1000)
  };
  assert.equal(invitationIsActive(base, "patient@example.com", now), false);
  assert.equal(invitationIsActive({ ...base, status: "revoked", expiresAt: new Date(now + 1000) }, "patient@example.com", now), false);
  assert.equal(invitationIsActive({ ...base, status: "used", expiresAt: new Date(now + 1000) }, "patient@example.com", now), false);
  assert.equal(invitationIsActive({ ...base, expiresAt: new Date(now + 1000) }, "other@example.com", now), false);
});
