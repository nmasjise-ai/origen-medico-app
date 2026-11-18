export function createAuthSessionHandler(dependencies = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed." });
    }

    // /api/health is internally rewritten here to keep its public URL while
    // avoiding a separate Serverless Function on Vercel Hobby.
    if (req.query?.mode === "health") {
      try {
        const getAdminAuth = dependencies.getAdminAuth ||
          (await import("../_lib/firebase-admin.js")).getAdminAuth;
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

    const header = req.headers.authorization || "";
    if (!/^Bearer\s+.+$/i.test(header)) {
      return res.status(401).json({
        authenticated: false,
        error: "Missing bearer token."
      });
    }

    try {
      // Load the Admin SDK only after the request has passed basic validation.
      const verifyRequestUser = dependencies.verifyRequestUser ||
        (await import("../_lib/firebase-admin.js")).verifyRequestUser;
      const decoded = await verifyRequestUser(req);
      return res.status(200).json({
        authenticated: true,
        uid: decoded.uid,
        email: decoded.email || null,
        admin: decoded.admin === true
      });
    } catch (error) {
      console.error("Session verification failed:", error?.name || "Error", error?.code || "");
      const status = error.statusCode || 401;
      return res.status(status).json({
        authenticated: false,
        error: status === 500 ? "Unable to verify the session." : error.message
      });
    }
  };
}

export default createAuthSessionHandler();
