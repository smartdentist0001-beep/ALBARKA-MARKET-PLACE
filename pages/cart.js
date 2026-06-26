import Navbar from "../components/Navbar";
import { useCart } from "../components/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useCart();

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Cart</h1>
        {cart.length === 0 ? (
          <div>
            <p>Your cart is empty.</p>
            <Link href="/"><a className="text-primary">Continue shopping</a></Link>
          </div>
        ) : (
          <div>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.slug} className="flex items-center justify-between border p-3 rounded bg-white">
                  <div className="flex items-center space-x-4">
                    <img src={item.image} className="w-20 h-20 object-cover rounded" />
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm">${item.price.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.slug, Math.max(1, Number(e.target.value)))} className="w-16 p-1 border rounded" />
                    <button onClick={() => removeFromCart(item.slug)} className="text-red-500">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between items-center">
              <div>
                <div className="text-lg">Subtotal</div>
                <div className="text-2xl font-bold">${subtotal.toFixed(2)}</div>
              </div>
              <Link href="/checkout">
                <a className="bg-primary text-white px-4 py-2 rounded">Checkout</a>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
          }
