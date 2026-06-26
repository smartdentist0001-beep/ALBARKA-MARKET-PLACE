import { connectToDatabase } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  const admin = req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN}`;
  if (!admin) return res.status(401).json({ message: "Unauthorized" });

  const sample = [
    {
      title: "Atamfa Ankara Fabric - Blue Floral",
      slug: "atamfa-blue-floral",
      price: 25.0,
      currency: "USD",
      description: "High-quality atamfa/ankara fabric, 6 yards.",
      image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1200&q=80",
      category: "fabrics",
      inventory: 50
    },
    {
      title: "Men's Kente Shirt",
      slug: "mens-kente-shirt",
      price: 45.0,
      currency: "USD",
      description: "Traditional kente shirt for men, tailored cut.",
      image: "https://placehold.co/600x400?text=Kente+Shirt",
      category: "men",
      inventory: 20
    },
    {
      title: "Women's Adire Blouse",
      slug: "womens-adire-blouse",
      price: 35.0,
      currency: "USD",
      description: "Elegant adire blouse for women, comfortable fit.",
      image: "https://placehold.co/600x400?text=Adire+Blouse",
      category: "women",
      inventory: 25
    },
    {
      title: "Children's Ankara Shorts",
      slug: "childrens-ankara-shorts",
      price: 20.0,
      currency: "USD",
      description: "Colorful Ankara shorts for children, perfect for summer.",
      image: "https://placehold.co/600x400?text=Ankara+Shorts",
      category: "children",
      inventory: 30
    }
  ];

  const { db } = await connectToDatabase();
  await db.collection("products").deleteMany({});
  await db.collection("products").insertMany(sample);
  res.json({ ok: true, inserted: sample.length });
}
