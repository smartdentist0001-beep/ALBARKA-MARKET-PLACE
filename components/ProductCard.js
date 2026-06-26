import Link from "next/link";

export default function ProductCard({ product }) {
  return (
    <div className="border rounded-md p-4 shadow-sm bg-white">
      <img src={product.image} alt={product.title} className="w-full h-40 object-cover rounded" />
      <h3 className="mt-3 font-semibold">{product.title}</h3>
      <p className="text-sm text-gray-600">{product.description}</p>
      <div className="mt-3 flex justify-between items-center">
        <span className="font-bold">${product.price.toFixed(2)}</span>
        <Link href={`/product/${product.slug}`}>
          <a className="text-sm bg-primary text-white px-3 py-1 rounded">View</a>
        </Link>
      </div>
    </div>
  );
                                }
