const { getPayment, approvePayment } = require("../../lib/piNetwork");
const { saveOrder } = require("../../lib/store");
const products = require("../../lib/products.json");

/** Recompute the order total server-side so a tampered client can never approve a different amount. */
function computeExpectedTotal(items) {
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) throw new Error(`Unknown product in cart: ${item.id}`);
    return sum + product.price * item.qty;
  }, 0);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentId, order } = req.body || {};
    if (!paymentId) return res.status(400).json({ error: "paymentId is required" });
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
      return res.status(400).json({ error: "order.items is required" });
    }

    // 1. Ask Pi servers for the authoritative payment record.
    const payment = await getPayment(paymentId);

    // 2. Verify the amount the user is about to pay matches what LATCINTL calculated
    //    from the cart, using our own trusted price list — never trust client-sent totals.
    const expectedTotal = Number(computeExpectedTotal(order.items).toFixed(7));
    const paidAmount = Number(payment.amount);
    if (Math.abs(expectedTotal - paidAmount) > 0.0000001) {
      console.error("[approve] amount mismatch", { expectedTotal, paidAmount, paymentId });
      return res.status(400).json({ error: "Order amount does not match payment amount" });
    }

    // 3. Approve the payment with Pi so the user can confirm it in the Pi Browser.
    await approvePayment(paymentId);

    // 4. Persist the order as "pending" — it becomes "completed" once /complete runs.
    await saveOrder({
      paymentId,
      username: payment.user_uid || order.username || null,
      items: order.items,
      total: expectedTotal,
      status: "approved",
      memo: payment.memo,
      createdAt: Date.now()
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[approve] error:", err);
    return res.status(500).json({ error: "Failed to approve payment", detail: err.message });
  }
};
