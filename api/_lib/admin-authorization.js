export function isConfiguredAdministrator(decoded, configuredUid, configuredEmail) {
  if (!decoded || decoded.email_verified !== true) return false;
  if (typeof configuredUid !== "string" || !configuredUid) return false;
  if (typeof configuredEmail !== "string" || !configuredEmail.trim()) return false;

  const tokenEmail = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  const expectedEmail = configuredEmail.trim().toLowerCase();

  return decoded.uid === configuredUid && tokenEmail === expectedEmail;
}

export function isVerifiedAdministrator(decoded) {
  return Boolean(
    decoded &&
    typeof decoded.uid === "string" &&
    decoded.uid.length > 0 &&
    decoded.admin === true &&
    decoded.email_verified === true &&
    typeof decoded.email === "string" &&
    decoded.email.trim().length > 0
  );
}
