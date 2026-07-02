module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    // Defaults to true (Testnet) so the app never accidentally moves real Pi
    // unless PI_SANDBOX is explicitly set to "false" in the environment.
    sandbox: process.env.PI_SANDBOX !== "false",
    appName: "LATCINTL"
  });
};
