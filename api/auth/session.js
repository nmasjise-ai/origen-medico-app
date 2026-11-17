const { verifyRequestUser } = require("../_lib/firebase-admin");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const decoded = await verifyRequestUser(req);
    return res.status(200).json({
      authenticated: true,
      uid: decoded.uid,
      email: decoded.email || null,
      admin: decoded.admin === true
    });
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({
      authenticated: false,
      error: status === 500 ? "Unable to verify the session." : error.message
    });
  }
};
