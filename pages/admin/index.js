import { useState } from "react";
import Navbar from "../../components/Navbar";
import useSWR from "swr";

const fetcher = (url, token) =>
  fetch(url, { headers: { Authorization: "Bearer " + token } }).then(r => r.json());

export default function Admin() {
  const [token, setToken] = useState(typeof window !== "undefined" ? localStorage.getItem("admin_token") || "" : "");
  const { data, mutate } = useSWR(token ? ["/api/admin/products", token] : null, () => fetcher("/api/admin/products", token));

  async function handleSave(product) {
    await fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(product)
    });
    mutate();
  }

  function login() {
    localStorage.setItem("admin_token", token);
    window.location.reload();
  }

  if (!token) {
    return (
      <div>
        <Navbar />
        <main className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
          <input placeholder="ADMIN_TOKEN" value={token} onChange={(e) => setToken(e.target.value)} className="border p-2 w-full" />
          <button onClick={login} className="mt-3 bg-primary text-white px-4 py-2 rounded">Login</button>
          <div className="mt-4 text-sm text-gray-500">Admin token stored in localStorage for demo only.</div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        {!data && <div>Loading...</div>}
        {data && (
          <div>
            <h2 className="font-semibold">Products</h2>
            <div className="mt-4 space-y-3">
              {data.products.map(p => (
                <div key={p._id} className="border p-3 rounded flex justify-between items-center bg-white">
                  <div>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-sm text-gray-600">{p.slug} • ${p.price}</div>
                  </div>
                  <div>
                    <button onClick={() => navigator.clipboard.writeText(p.slug)} className="text-sm text-gray-600">Copy Slug</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h3 className="font-semibold">Create product (quick)</h3>
              <CreateProductForm onSave={handleSave} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CreateProductForm({ onSave }) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    price: "10.00",
    image: "https://placehold.co/600x400",
    description: "",
    inventory: 10
  });

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  return (
    <div className="mt-3 border p-4 rounded bg-white">
      <input placeholder="Title" value={form.title} onChange={e => update("title", e.target.value)} className="w-full border p-2 mb-2" />
      <input placeholder="Slug" value={form.slug} onChange={e => update("slug", e.target.value)} className="w-full border p-2 mb-2" />
      <input placeholder="Price" value={form.price} onChange={e => update("price", e.target.value)} className="w-full border p-2 mb-2" />
      <input placeholder="Image URL" value={form.image} onChange={e => update("image", e.target.value)} className="w-full border p-2 mb-2" />
      <textarea placeholder="Description" value={form.description} onChange={e => update("description", e.target.value)} className="w-full border p-2 mb-2" />
      <button onClick={() => onSave({ ...form, price: parseFloat(form.price), inventory: Number(form.inventory) })} className="bg-primary text-white px-3 py-1 rounded">Save</button>
    </div>
  );
      }
