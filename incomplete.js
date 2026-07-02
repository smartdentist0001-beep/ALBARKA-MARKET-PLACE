const { getPayment, completePayment, approvePayment } = require("../../lib/piNetwork");
const { saveOrder, getOrder } = require("../../lib/store");

/**
 * Pi.authenticate() can surface a payment that was started in a previous
 * session but never finished (e.g. the user closed the Pi Browser mid-flow).
 * The client forwards { paymentId } here and we resolve it against the
 * authoritative Pi record, finishing whichever step is outstanding.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentId } = req.body || {};
    if (!paymentId) return res.status(400).json({ error: "paymentId is required" });

    const payment = await getPayment(paymentId);
    const existing = await getOrder(paymentId);

    // A blockchain transaction already exists and Pi has verified it — finish the loop.
    if (payment.transaction && payment.transaction.verified && payment.transaction.txid) {
      await completePayment(paymentId, payment.transaction.txid);
      await saveOrder({
        ...(existing || { paymentId, items: payment.metadata?.items || [] }),
        paymentId,
        username: payment.user_uid,
        txid: payment.transaction.txid,
        total: payment.amount,
        status: "completed",
        completedAt: Date.now()
      });
      return res.status(200).json({ ok: true, resolution: "completed" });
    }

    // Server never approved it in the first place — approve now so the user can retry.
    if (!payment.status.developer_approved) {
      await approvePayment(paymentId);
      await saveOrder({
        ...(existing || { paymentId, items: payment.metadata?.items || [] }),
        paymentId,
        username: payment.user_uid,
        total: payment.amount,
        status: "approved",
        createdAt: existing?.createdAt || Date.now()
      });
      return res.status(200).json({ ok: true, resolution: "approved" });
    }

    // Approved but no verified transaction yet — leave it pending, client can retry payment.
    return res.status(200).json({ ok: true, resolution: "pending" });
  } catch (err) {
    console.error("[incomplete] error:", err);
    return res.status(500).json({ error: "Failed to resolve incomplete payment", detail: err.message });
  }
};
