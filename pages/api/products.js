import { connectToDatabase } from "../../lib/db";

export default async function handler(req, res) {
  const { db } = await connectToDatabase();
  if (req.method === "GET") {
    const { slug } = req.query;
    if (slug) {
      const product = await db.collection("products").findOne({ slug });
      if (!product) return res.status(404).json({ message: "Not found" });
      return res.json({ product });
    }
    const products = await db.collection("products").find({}).toArray();
    return res.json({ products });
  }
  res.status(405).json({ message: "Method not allowed" });
}
