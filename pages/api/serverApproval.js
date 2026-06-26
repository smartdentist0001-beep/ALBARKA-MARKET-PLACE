/**
 * Optional server-side approval endpoint.
 * Some payment providers require the merchant server to call an approve endpoint after creating payment.
 * This endpoint demonstrates how you might implement that.
 *
 * POST body: { payment_id: string, approve: true }
 */
import { connectToDatabase } from "../../lib/db";
import { approvePayment } from "../../lib/piClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { payment_id, approve } = req.body;
  if (!payment_id) return res.status(400).json({ message: "Missing payment_id" });

  try {
    const { db } = await connectToDatabase();

    // If your Pi flow requires a merchant approve call via Pi API:
    // Uncomment below and ensure approvePayment is implemented in lib/piClient
    // const approvalResponse = await approvePayment({ paymentId: payment_id, approve });

    // For now, just update the order to mark approval was requested
    await db.collection("orders").updateOne(
      { paymentId: payment_id },
      { $set: { serverApproved: approve ? true : false, updatedAt: new Date() } }
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("serverApproval error:", err);
    return res.status(500).json({ message: "Error approving payment", error: err.message });
  }
}
