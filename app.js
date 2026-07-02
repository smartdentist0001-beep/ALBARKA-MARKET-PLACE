/**
 * public/js/app.js
 * Renders products, wires category filters, the cart drawer, and checkout.
 */
(function () {
  const el = (id) => document.getElementById(id);

  const productGrid = el("productGrid");
  const emptyState = el("emptyState");
  const categoryChips = el("categoryChips");
  const cartBtn = el("cartBtn");
  const cartCloseBtn = el("cartCloseBtn");
  const cartOverlay = el("cartOverlay");
  const cartDrawer = el("cartDrawer");
  const cartItemsEl = el("cartItems");
  const cartEmptyEl = el("cartEmpty");
  const cartTotalEl = el("cartTotal");
  const cartCountEl = el("cartCount");
  const loginBtn = el("loginBtn");
  const userChip = el("userChip");
  const checkoutForm = el("checkoutForm");
  const checkoutBtn = el("checkoutBtn");
  const checkoutStatus = el("checkoutStatus");
  const networkBadge = el("networkBadge");
  const toast = el("toast");

  let allProducts = [];
  let activeCategory = "all";
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 3500);
  }

  function money(n) {
    return `π ${Number(n).toFixed(2)}`;
  }

  /* ── Products ─────────────────────────────────────────────────────── */
  async function loadProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      allProducts = data.products || [];
      renderProducts();
    } catch (err) {
      console.error("Failed to load products:", err);
      productGrid.innerHTML = `<p class="empty-state">Could not load the catalog. Pull to refresh and try again.</p>`;
    }
  }

  function renderProducts() {
    const items =
      activeCategory === "all"
        ? allProducts
        : allProducts.filter((p) => p.category === activeCategory);

    productGrid.innerHTML = "";
    emptyState.classList.toggle("hidden", items.length > 0);

    for (const p of items) {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <div class="card-body">
          <span class="card-cat">${p.category}</span>
          <h3 class="card-name">${p.name}</h3>
          <p class="card-desc">${p.description}</p>
          <div class="card-footer">
            <span class="price-mono">${money(p.price)} / ${p.unit}</span>
            <button class="add-btn" type="button" aria-label="Add ${p.name} to cart">+</button>
          </div>
        </div>
      `;
      card.querySelector(".add-btn").addEventListener("click", () => {
        Cart.add(p);
        showToast(`Added “${p.name}” to your cart.`);
      });
      productGrid.appendChild(card);
    }
  }

  categoryChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeCategory = btn.dataset.category;
    categoryChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderProducts();
  });

  /* ── Cart drawer ──────────────────────────────────────────────────── */
  function openCart() {
    renderCart();
    cartOverlay.classList.remove("hidden");
    cartDrawer.classList.add("is-open");
    cartDrawer.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    cartOverlay.classList.add("hidden");
    cartDrawer.classList.remove("is-open");
    cartDrawer.setAttribute("aria-hidden", "true");
  }

  cartBtn.addEventListener("click", openCart);
  cartCloseBtn.addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  function renderCart() {
    const items = Cart.getItems();
    cartItemsEl.innerHTML = "";
    cartEmptyEl.classList.toggle("hidden", items.length > 0);
    checkoutForm.classList.toggle("hidden", items.length === 0);

    for (const item of items) {
      const line = document.createElement("div");
      line.className = "cart-line";
      line.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <div class="cart-line-name">${item.name}</div>
          <div class="cart-line-price">${money(item.price)} / ${item.unit}</div>
          <div class="qty-row">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
            <button type="button" class="remove-link">Remove</button>
          </div>
        </div>
        <div class="price-mono">${money(item.price * item.qty)}</div>
      `;
      line.querySelector(".qty-minus").addEventListener("click", () => {
        Cart.setQty(item.id, item.qty - 1);
      });
      line.querySelector(".qty-plus").addEventListener("click", () => {
        Cart.setQty(item.id, item.qty + 1);
      });
      line.querySelector(".remove-link").addEventListener("click", () => {
        Cart.remove(item.id);
      });
      cartItemsEl.appendChild(line);
    }

    cartTotalEl.textContent = money(Cart.getTotal());
    cartCountEl.textContent = Cart.getCount();
  }

  document.addEventListener("cart:change", renderCart);

  /* ── Auth ─────────────────────────────────────────────────────────── */
  function refreshUserUI() {
    const user = window.LatcintlPi.getCurrentUser();
    if (user) {
      loginBtn.classList.add("hidden");
      userChip.textContent = `@${user.username}`;
      userChip.classList.remove("hidden");
    } else {
      loginBtn.classList.remove("hidden");
      userChip.classList.add("hidden");
    }
  }

  loginBtn.addEventListener("click", async () => {
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in…";
    try {
      await window.LatcintlPi.login();
      showToast("Signed in with Pi.");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Sign-in failed. Open this app inside the Pi Browser.");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign in with Pi";
      refreshUserUI();
    }
  });

  window.addEventListener("pi:config", (e) => {
    networkBadge.textContent = e.detail.sandbox
      ? "Connected to Pi Testnet (sandbox)"
      : "Connected to Pi Mainnet";
  });

  /* ── Checkout ─────────────────────────────────────────────────────── */
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    checkoutStatus.textContent = "";
    checkoutStatus.className = "checkout-status";

    const user = window.LatcintlPi.getCurrentUser();
    if (!user) {
      checkoutStatus.textContent = "Sign in with Pi before checking out.";
      checkoutStatus.classList.add("is-error");
      try {
        await window.LatcintlPi.login();
        refreshUserUI();
      } catch (err) {
        return;
      }
    }

    const items = Cart.getItems();
    if (items.length === 0) {
      checkoutStatus.textContent = "Your cart is empty.";
      checkoutStatus.classList.add("is-error");
      return;
    }

    const order = {
      items,
      total: Cart.getTotal(),
      customer: {
        name: el("custName").value.trim(),
        address: el("custAddress").value.trim(),
        phone: el("custPhone").value.trim()
      }
    };

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Waiting for Pi confirmation…";
    checkoutStatus.textContent = "Confirm the payment in the Pi Browser.";

    try {
      await window.LatcintlPi.pay(order);
      Cart.clear();
      checkoutStatus.textContent = "Order placed — LATCINTL is preparing your cloth.";
      checkoutStatus.classList.add("is-success");
      checkoutForm.reset();
      showToast("Payment complete. Thank you for shopping LATCINTL.");
      setTimeout(closeCart, 1800);
    } catch (err) {
      console.error(err);
      checkoutStatus.textContent = err.message || "Payment did not complete.";
      checkoutStatus.classList.add("is-error");
    } finally {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Pay with Pi";
    }
  });

  /* ── Boot ─────────────────────────────────────────────────────────── */
  (async function init() {
    await window.LatcintlPi.ensureInit().catch((err) => {
      networkBadge.textContent = "Open LATCINTL inside the Pi Browser to shop.";
      console.warn(err.message);
    });
    refreshUserUI();
    renderCart();
    loadProducts();
  })();
})();
