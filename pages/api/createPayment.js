/**
 * POST /api/createPayment
 * Creates an order and calls Pi Payments createPayment endpoint via lib/piClient
 *
 * Expected body:
 * {
 *  amount: number,
 *  currency: "USD",
 *  items: [{ slug, title, price, quantity }],
 *  buyerPiId?: string (optional, if using Pi Auth)
 * }
 */
import { connectToDatabase } from "../../lib/db";
import { createPayment } from "../../lib/piClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { amount, currency = "USD", items = [], buyerPiId } = req.body;
    if (!amount || items.length === 0) return res.status(400).json({ message: "Invalid request" });

    const { db } = await connectToDatabase();
    const order = {
      amount,
      currency,
      items,
      buyerPiId: buyerPiId || null,
      status: "pending",
      createdAt: new Date()
    };

    const insert = await db.collection("orders").insertOne(order);
    const orderId = insert.insertedId.toString();

    // Call Pi Payments to create a payment
    const payment = await createPayment({
      amount,
      currency,
      orderId,
      metadata: { orderId, items }
    });

    // store payment info in order
    await db.collection("orders").updateOne({ _id: insert.insertedId }, { $set: { paymentId: payment.payment_id, paymentRaw: payment.raw } });

    return res.json({
      ok: true,
      orderId,
      payment_id: payment.payment_id,
      approval_url: payment.approval_url
    });
  } catch (err) {
    console.error("createPayment error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
}
