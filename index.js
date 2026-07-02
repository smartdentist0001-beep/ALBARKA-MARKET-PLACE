const products = require("../../lib/products.json");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, category } = req.query;

  if (id) {
    const product = products.find((p) => p.id === id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.status(200).json({ product });
  }

  const filtered = category
    ? products.filter((p) => p.category === category)
    : products;

  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res.status(200).json({ products: filtered });
};
