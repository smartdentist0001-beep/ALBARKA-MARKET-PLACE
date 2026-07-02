const { getUserFromAccessToken } = require("../../lib/piNetwork");

/**
 * The Pi SDK already authenticates the user in-browser, but a client-sent
 * username should never be trusted for anything sensitive (like tying an
 * order to an account). Call this once after Pi.authenticate() resolves to
 * get a server-verified username/uid pair to store alongside orders.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { accessToken } = req.body || {};
    if (!accessToken) return res.status(400).json({ error: "accessToken is required" });

    const piUser = await getUserFromAccessToken(accessToken);
    return res.status(200).json({
      uid: piUser.uid,
      username: piUser.username
    });
  } catch (err) {
    console.error("[auth/verify] error:", err);
    return res.status(401).json({ error: "Invalid or expired Pi access token" });
  }
};
