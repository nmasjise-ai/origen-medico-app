export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
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
    const { verifyRequestUser } = await import("../_lib/firebase-admin.js");
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
}
