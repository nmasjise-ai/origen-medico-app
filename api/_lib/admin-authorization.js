export function isConfiguredAdministrator(decoded, configuredUid, configuredEmail) {
  if (!decoded || decoded.email_verified !== true) return false;
  if (typeof configuredUid !== "string" || !configuredUid) return false;
  if (typeof configuredEmail !== "string" || !configuredEmail.trim()) return false;

  const tokenEmail = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  const expectedEmail = configuredEmail.trim().toLowerCase();

  return decoded.uid === configuredUid && tokenEmail === expectedEmail;
}

// Bootstrap is the only operation that relies on a verified email address.
// Once the admin claim has been issued, every protected request checks both
// the signed custom claim and the configured administrator UID.
export function isVerifiedAdministrator(decoded, configuredUid = process.env.ORIGEN_ADMIN_UID) {
  return Boolean(
    decoded &&
    typeof configuredUid === "string" &&
    configuredUid.length > 0 &&
    typeof decoded.uid === "string" &&
    decoded.uid === configuredUid &&
    decoded.admin === true
  );
}
