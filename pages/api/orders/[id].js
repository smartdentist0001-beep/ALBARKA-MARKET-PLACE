import { connectToDatabase } from "../../../lib/db";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Missing id" });

  const { db } = await connectToDatabase();
  let order;

  try {
    // Try to parse as MongoDB ObjectId
    const objectId = new ObjectId(id);
    order = await db.collection("orders").findOne({ _id: objectId });
  } catch (e) {
    return res.status(400).json({ message: "Invalid id format" });
  }

  if (!order) return res.status(404).json({ message: "Order not found" });
  return res.json({ order });
}
