/**
 * public/js/cart.js
 * Simple cart state kept in localStorage. Exposes window.Cart.
 */
(function () {
  const STORAGE_KEY = "latcintl.cart.v1";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("cart:change", { detail: { items } }));
  }

  function add(product) {
    const items = read();
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit,
        qty: 1
      });
    }
    write(items);
  }

  function setQty(id, qty) {
    let items = read();
    if (qty <= 0) {
      items = items.filter((i) => i.id !== id);
    } else {
      const item = items.find((i) => i.id === id);
      if (item) item.qty = qty;
    }
    write(items);
  }

  function remove(id) {
    write(read().filter((i) => i.id !== id));
  }

  function clear() {
    write([]);
  }

  function getItems() {
    return read();
  }

  function getTotal() {
    return read().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function getCount() {
    return read().reduce((sum, i) => sum + i.qty, 0);
  }

  window.Cart = { add, setQty, remove, clear, getItems, getTotal, getCount };
})();
