/**
 * Webhook endpoint for Pi payment status updates.
 * Validate signature with PI_WEBHOOK_SECRET (see lib/piClient.verifyWebhookSignature)
 *
 * Expected webhook payload will vary by Pi. This handler demonstrates:
 * - verify signature
 * - find order by payment_id or metadata.orderId
 * - update order status
 */
import { connectToDatabase } from "../../lib/db";
import { verifyWebhookSignature } from "../../lib/piClient";

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== "POST") return res.status(405).end();

  // Verify signature
  const okSignature = verifyWebhookSignature(req);
  if (!okSignature) {
    console.warn("Invalid webhook signature from Pi");
    return res.status(401).json({ message: "Invalid signature" });
  }

  const event = req.body;
  const type = event.type || event.event || null;
  const data = event.data || event || {};

  const paymentId = data.payment_id || data.id;
  const orderId = data.metadata && data.metadata.orderId;

  try {
    const { db } = await connectToDatabase();
    let order = null;

    // Try to find order by payment_id first, then by orderId
    if (paymentId) order = await db.collection("orders").findOne({ paymentId });
    if (!order && orderId) order = await db.collection("orders").findOne({ _id: orderId });

    // If order not found, return 200 (idempotent) and log
    if (!order) {
      console.warn("Order not found for webhook:", { paymentId, orderId, type });
      return res.json({ ok: true });
    }

    // Parse status and update order
    const status = (data.status || "").toLowerCase();
    if (status === "completed" || status === "success" || type === "payment.completed") {
      await db.collection("orders").updateOne(
        { _id: order._id },
        {
          $set: {
            status: "completed",
            updatedAt: new Date(),
            rawWebhook: event
          }
        }
      );
      console.log("Order marked completed:", order._id);
      // TODO: trigger fulfillment, send confirmation email, update inventory
    } else if (status === "failed" || type === "payment.failed") {
      await db.collection("orders").updateOne(
        { _id: order._id },
        {
          $set: {
            status: "failed",
            updatedAt: new Date(),
            rawWebhook: event
          }
        }
      );
      console.log("Order marked failed:", order._id);
      // TODO: send failure notification
    } else {
      // Store event for other statuses (pending, processing, etc)
      await db.collection("orders").updateOne(
        { _id: order._id },
        {
          $set: {
            rawWebhook: event,
            updatedAt: new Date()
          }
        }
      );
      console.log("Order webhook stored:", order._id, "status:", status);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("webhook handler error:", err);
    return res.status(500).json({ message: "server error" });
  }
                                                    }
