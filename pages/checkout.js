import Navbar from "../components/Navbar";
import { useCart } from "../components/CartContext";
import { useState } from "react";
import Router from "next/router";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleCheckout() {
    try {
      setLoading(true);
      const res = await fetch("/api/createPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: subtotal,
          currency: "USD",
          items: cart.map(i => ({ slug: i.slug, title: i.title, quantity: i.quantity, price: i.price }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Payment create failed");

      if (data.approval_url) {
        window.location.href = data.approval_url;
        return;
      }

      setMessage("Payment initiated. Payment ID: " + data.payment_id);
      clearCart();
      Router.push("/");
    } catch (err) {
      setMessage("Error: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <div className="border rounded p-4 bg-white">
          <div className="mb-4">
            <div className="font-semibold">Order total</div>
            <div className="text-2xl">${subtotal.toFixed(2)}</div>
          </div>
          <div className="mb-4">
            <button onClick={handleCheckout} className="bg-primary text-white px-4 py-2 rounded" disabled={loading}>
              {loading ? "Processing..." : "Pay with Pi"}
            </button>
          </div>
          {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
          <div className="mt-6 text-xs text-gray-500">
            Note: This demo uses a server-side payment creation endpoint that must be connected to Pi Payments (testnet/mainnet). Implement Pi Auth on the client to pass buyer identification.
          </div>
        </div>
      </main>
    </div>
  );
            }
