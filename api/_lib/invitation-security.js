import { createHash, randomBytes } from "node:crypto";

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizeInvitationEmail(value) {
  if (typeof value !== "string") {
    const error = new Error("Introduce un correo electrónico válido.");
    error.statusCode = 400;
    throw error;
  }

  const email = value.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    const error = new Error("Introduce un correo electrónico válido.");
    error.statusCode = 400;
    throw error;
  }

  return email;
}

export function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function normalizeInvitationToken(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
    const error = new Error("La invitación no es válida o ha vencido.");
    error.statusCode = 400;
    throw error;
  }
  return value;
}

export function hashInvitationToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function invitationIsActive(invitation, email, nowMs = Date.now()) {
  if (!invitation || invitation.status !== "pending") return false;
  if (typeof invitation.email !== "string" || invitation.email !== email) return false;
  const expiry = invitation.expiresAt?.toMillis
    ? invitation.expiresAt.toMillis()
    : invitation.expiresAt instanceof Date
      ? invitation.expiresAt.getTime()
      : NaN;
  return Number.isFinite(expiry) && expiry > nowMs;
}
