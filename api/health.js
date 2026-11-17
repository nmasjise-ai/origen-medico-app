export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    // Validate that the private Admin SDK credential exists, parses and
    // belongs to the configured Firebase project without returning any secret.
    const { getAdminAuth } = await import("./_lib/firebase-admin.js");
    getAdminAuth();

    return res.status(200).json({
      ok: true,
      service: "origen-medico-api",
      firebaseAdmin: "ready"
    });
  } catch (error) {
    console.error("Firebase Admin health check failed:", error?.name || "Error", error?.code || "");
    return res.status(503).json({
      ok: false,
      service: "origen-medico-api",
      firebaseAdmin: "not-ready",
      error: "The server could not initialize Firebase Admin. Check the private Preview credential configuration."
    });
  }
}
