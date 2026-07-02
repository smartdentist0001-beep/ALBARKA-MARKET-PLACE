const { completePayment } = require("../../lib/piNetwork");
const { saveOrder, getOrder } = require("../../lib/store");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentId, txid } = req.body || {};
    if (!paymentId || !txid) {
      return res.status(400).json({ error: "paymentId and txid are required" });
    }

    // Tell Pi servers the on-chain transaction has been submitted — this is
    // what finalizes the payment and releases funds.
    await completePayment(paymentId, txid);

    const existing = await getOrder(paymentId);
    await saveOrder({
      ...(existing || { paymentId }),
      paymentId,
      txid,
      status: "completed",
      completedAt: Date.now()
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[complete] error:", err);
    return res.status(500).json({ error: "Failed to complete payment", detail: err.message });
  }
};
