/**
 * public/js/pi-sdk.js
 * ─────────────────────────────────────────────────────────────────────────
 * Wraps the official Pi SDK (loaded via <script src="https://sdk.minepi.com/pi-sdk.js">)
 * for Pi Authentication and the full Pi Payments flow:
 *
 *   1. Pi.authenticate()                      → client: sign the user in
 *   2. Pi.createPayment()                     → client: start a payment
 *   3. onReadyForServerApproval(paymentId)     → server: POST /api/payments/approve
 *   4. user confirms in the Pi Browser, tx is submitted to the blockchain
 *   5. onReadyForServerCompletion(id, txid)    → server: POST /api/payments/complete
 *
 * Docs: https://github.com/pi-apps/pi-platform-docs
 */
(function () {
  const STORAGE_KEY = "latcintl.piuser.v1";
  let piInitialized = false;
  let currentAuth = null; // { user: { uid, username }, accessToken }

  async function loadConfig() {
    try {
      const res = await fetch("/api/config");
      return await res.json();
    } catch {
      // Fail safe to sandbox so a misconfigured deploy never touches real Pi.
      return { sandbox: true, appName: "LATCINTL" };
    }
  }

  async function ensureInit() {
    if (piInitialized) return;
    if (typeof Pi === "undefined") {
      throw new Error("Pi SDK failed to load. Open this app inside the Pi Browser.");
    }
    const config = await loadConfig();
    Pi.init({ version: "2.0", sandbox: config.sandbox });
    piInitialized = true;
    window.dispatchEvent(new CustomEvent("pi:config", { detail: config }));
  }

  function restoreSession() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      if (saved) currentAuth = saved;
    } catch {
      /* ignore */
    }
  }

  function persistSession() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentAuth));
  }

  /** Called by Pi.authenticate when a payment from a previous session never finished. */
  async function onIncompletePaymentFound(payment) {
    console.warn("[pi] incomplete payment found, resolving:", payment.identifier);
    try {
      await fetch("/api/payments/incomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.identifier })
      });
    } catch (err) {
      console.error("[pi] failed to resolve incomplete payment:", err);
    }
  }

  async function login() {
    await ensureInit();
    const scopes = ["username", "payments"];
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    currentAuth = { user: auth.user, accessToken: auth.accessToken };
    persistSession();

    // Optional but recommended: verify the token server-side rather than
    // trusting the client-reported username for anything sensitive.
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: auth.accessToken })
      });
      if (res.ok) {
        const verified = await res.json();
        currentAuth.user = { ...currentAuth.user, ...verified };
        persistSession();
      }
    } catch (err) {
      console.warn("[pi] server-side token verification skipped:", err.message);
    }

    return currentAuth;
  }

  function getCurrentUser() {
    return currentAuth ? currentAuth.user : null;
  }

  function logout() {
    currentAuth = null;
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Kicks off Pi.createPayment for the given order and wires every callback
   * to the matching /api/payments/* endpoint. Resolves when the payment is
   * fully completed, rejects on cancel/error.
   */
  function pay(order) {
    return new Promise(async (resolve, reject) => {
      await ensureInit();
      if (!currentAuth) {
        return reject(new Error("Sign in with Pi before checking out."));
      }

      const paymentData = {
        amount: Number(order.total.toFixed(7)),
        memo: `LATCINTL order — ${order.items.length} item(s)`,
        metadata: {
          items: order.items.map((i) => ({ id: i.id, qty: i.qty })),
          customer: order.customer
        }
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId) => {
          try {
            const res = await fetch("/api/payments/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId,
                order: {
                  items: order.items,
                  username: currentAuth.user.username
                }
              })
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || "Server approval failed");
            }
          } catch (err) {
            reject(err);
          }
        },

        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            const res = await fetch("/api/payments/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid })
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || "Server completion failed");
            }
            resolve({ paymentId, txid });
          } catch (err) {
            reject(err);
          }
        },

        onCancel: async (paymentId) => {
          try {
            await fetch("/api/payments/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId })
            });
          } finally {
            reject(new Error("Payment was cancelled."));
          }
        },

        onError: (error, payment) => {
          console.error("[pi] payment error:", error, payment);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };

      try {
        Pi.createPayment(paymentData, callbacks);
      } catch (err) {
        reject(err);
      }
    });
  }

  restoreSession();

  window.LatcintlPi = { ensureInit, login, logout, pay, getCurrentUser };
})();
