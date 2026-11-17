const { getAdminAuth, verifyRequestUser } = require("../_lib/firebase-admin");

module.exports = async function handler(req, res) {
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

  try {
    const decoded = await verifyRequestUser(req);
    const email = (decoded.email || "").trim().toLowerCase();

    // This first-time bootstrap is restricted to the exact UID and email
    // configured privately in Vercel. No client-provided role is trusted.
    if (decoded.uid !== configuredUid || email !== configuredEmail) {
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
    console.error("Administrator bootstrap failed:", error.message);
    return res.status(status).json({
      error: status === 500 ? "Unable to configure the administrator role." : error.message
    });
  }
};
