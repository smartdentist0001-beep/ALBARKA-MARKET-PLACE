import { connectToDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ message: "Unauthorized" });

  const { db } = await connectToDatabase();

  if (req.method === "GET") {
    const products = await db.collection("products").find({}).toArray();
    return res.json({ products });
  }

  if (req.method === "POST") {
    const body = req.body;
    if (!body.title || !body.slug) return res.status(400).json({ message: "Missing title or slug" });

    const doc = {
      title: body.title,
      slug: body.slug,
      price: parseFloat(body.price) || 0,
      image: body.image,
      description: body.description,
      category: body.category || "other",
      inventory: parseInt(body.inventory) || 0,
      createdAt: new Date()
    };
    await db.collection("products").insertOne(doc);
    return res.json({ ok: true, product: doc });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
