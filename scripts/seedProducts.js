/**
 * Seed script for sample products
 * Usage: node ./scripts/seedProducts.js
 */
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/latcintl";
const products = [
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
    title: "Children's Ankara Dress",
    slug: "childrens-ankara-dress",
    price: 30.0,
    currency: "USD",
    description: "Colorful Ankara dress for children.",
    image: "https://placehold.co/600x400?text=Ankara+Dress",
    category: "children",
    inventory: 15
  }
];

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const col = db.collection("products");
    await col.deleteMany({});
    await col.insertMany(products);
    console.log("Seeded products.");
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

seed();
