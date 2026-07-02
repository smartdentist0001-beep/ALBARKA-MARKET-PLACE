const { cancelPayment } = require("../../lib/piNetwork");
const { saveOrder, getOrder } = require("../../lib/store");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentId } = req.body || {};
    if (!paymentId) return res.status(400).json({ error: "paymentId is required" });

    await cancelPayment(paymentId).catch((err) => {
      // Pi returns an error if the payment is already cancelled/completed — non-fatal here.
      console.warn("[cancel] Pi cancel call warning:", err.message);
    });

    const existing = await getOrder(paymentId);
    await saveOrder({
      ...(existing || { paymentId }),
      paymentId,
      status: "cancelled",
      cancelledAt: Date.now()
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[cancel] error:", err);
    return res.status(500).json({ error: "Failed to cancel payment", detail: err.message });
  }
};
