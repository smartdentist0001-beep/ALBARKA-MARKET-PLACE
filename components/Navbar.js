import Link from "next/link";
import { useCart } from "./CartContext";

export default function Navbar() {
  const { cart } = useCart();
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <a className="text-xl font-semibold text-primary">LATCINTL</a>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <a className="text-sm text-gray-700">Admin</a>
          </Link>
          <Link href="/cart">
            <a className="text-sm text-gray-700">Cart ({count})</a>
          </Link>
        </div>
      </div>
    </nav>
  );
}
