export function isConfiguredAdministrator(decoded, configuredUid, configuredEmail) {
  if (!decoded || decoded.email_verified !== true) return false;
  if (typeof configuredUid !== "string" || !configuredUid) return false;
  if (typeof configuredEmail !== "string" || !configuredEmail.trim()) return false;

  const tokenEmail = typeof decoded.email === "string" ? decoded.email.trim().toLowerCase() : "";
  const expectedEmail = configuredEmail.trim().toLowerCase();

  return decoded.uid === configuredUid && tokenEmail === expectedEmail;
}
