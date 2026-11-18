export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const configuredUid = process.env.ORIGEN_ADMIN_UID;
  const configuredEmail = (process.env.ORIGEN_ADMIN_EMAIL || "").trim().toLowerCase();

  if (!configuredUid || !configuredEmail) {
    return res.status(503).json({
      error: "The initial administrator has not been configured on the server."
    });
  }

  const header = req.headers.authorization || "";
  if (!/^Bearer\s+.+$/i.test(header)) {
    return res.status(401).json({ error: "Missing bearer token." });
  }

  try {
    // Dynamic import keeps the endpoint invocable and allows safe error handling
    // if the Firebase Admin SDK or private service-account configuration fails.
    const { getAdminAuth, verifyRequestUser } = await import("../_lib/firebase-admin.js");
    const { isConfiguredAdministrator } = await import("../_lib/admin-authorization.js");
    const decoded = await verifyRequestUser(req);

    if (!isConfiguredAdministrator(decoded, configuredUid, configuredEmail)) {
      return res.status(403).json({ error: "Not authorized to bootstrap the administrator." });
    }

    const auth = getAdminAuth();
    const userRecord = await auth.getUser(decoded.uid);
    const existingClaims = userRecord.customClaims || {};

    if (existingClaims.admin === true) {
      return res.status(200).json({ ok: true, alreadyAdmin: true });
    }

    await auth.setCustomUserClaims(decoded.uid, {
      ...existingClaims,
      admin: true
    });

    console.info("ORIGEN Médico administrator claim configured for UID:", decoded.uid);
    return res.status(200).json({
      ok: true,
      message: "Administrator role assigned. Refresh the Firebase ID token before using protected services."
    });
  } catch (error) {
    const status = error.statusCode || (error.code === "auth/id-token-revoked" ? 401 : 500);
    console.error("Administrator bootstrap failed:", error?.name || "Error", error?.code || "");
    return res.status(status).json({
      error: status === 500 ? "Unable to configure the administrator role." : error.message
    });
  }
}
