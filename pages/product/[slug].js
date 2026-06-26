import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import { useCart } from "../../components/CartContext";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then(r => r.json());

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { data, error } = useSWR(() => slug ? `/api/products?slug=${slug}` : null, fetcher);
  const { addToCart } = useCart();

  if (!data) return (<div><Navbar /><div className="p-8">Loading...</div></div>);
  if (error) return (<div><Navbar /><div className="p-8">Error loading product</div></div>);

  const product = data.product;
  if (!product) return (<div><Navbar /><div className="p-8">Product not found</div></div>);

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <img src={product.image} className="w-full h-96 object-cover rounded" />
          <div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <p className="text-gray-600 mt-2">{product.description}</p>
            <div className="mt-4">
              <span className="text-xl font-semibold">${product.price.toFixed(2)}</span>
            </div>
            <div className="mt-6">
              <button onClick={() => addToCart(product, 1)} className="bg-primary text-white px-4 py-2 rounded">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
    }
