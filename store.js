/**
 * lib/store.js
 * ─────────────────────────────────────────────────────────────────────────
 * Order persistence.
 *
 * IMPORTANT — read before you go to production:
 * Vercel Serverless Functions have a read-only filesystem except for /tmp,
 * and /tmp is wiped whenever the function's execution environment recycles.
 * The file-based store below is perfectly fine for local development
 * (`vercel dev`, plain `node`) but is NOT durable once deployed — treat it
 * as a working demo, not a database.
 *
 * For production, swap this module's implementation for a real store:
 *   • Vercel KV (Redis) — fastest to wire up, see the commented block below.
 *   • Postgres / Supabase / PlanetScale / MongoDB Atlas — for full querying.
 * Every function below is exported with the same signature, so callers in
 * /api never need to change when you swap the backing implementation.
 */

const fs = require("fs");
const path = require("path");

const isServerless = !!process.env.VERCEL;
const ORDERS_FILE = isServerless
  ? "/tmp/latcintl-orders.json"
  : path.join(__dirname, "..", "data", "orders.local.json");

function readAll() {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(orders) {
  try {
    fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
  } catch (err) {
    // On some serverless environments even /tmp writes can be flaky across
    // instances. We log and continue rather than failing the request, since
    // the Pi payment itself has already been approved/completed at this point.
    console.error("[store] failed to persist orders:", err.message);
  }
}

async function saveOrder(order) {
  const orders = readAll();
  orders[order.paymentId] = { ...orders[order.paymentId], ...order, updatedAt: Date.now() };
  writeAll(orders);
  return orders[order.paymentId];
}

async function getOrder(paymentId) {
  const orders = readAll();
  return orders[paymentId] || null;
}

async function listOrdersForUser(username) {
  const orders = readAll();
  return Object.values(orders)
    .filter((o) => o.username === username)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

module.exports = { saveOrder, getOrder, listOrdersForUser };

/* ── Production alternative: Vercel KV ─────────────────────────────────────
   1. In the Vercel dashboard: Storage → Create → KV, then connect it to
      this project (this injects KV_REST_API_URL / KV_REST_API_TOKEN).
   2. `npm install @vercel/kv`
   3. Replace the body of this file with:

      const { kv } = require('@vercel/kv');

      async function saveOrder(order) {
        const existing = (await kv.get(`order:${order.paymentId}`)) || {};
        const merged = { ...existing, ...order, updatedAt: Date.now() };
        await kv.set(`order:${order.paymentId}`, merged);
        if (order.username) await kv.sadd(`user-orders:${order.username}`, order.paymentId);
        return merged;
      }

      async function getOrder(paymentId) {
        return (await kv.get(`order:${paymentId}`)) || null;
      }

      async function listOrdersForUser(username) {
        const ids = await kv.smembers(`user-orders:${username}`);
        const orders = await Promise.all(ids.map((id) => kv.get(`order:${id}`)));
        return orders.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
      }

      module.exports = { saveOrder, getOrder, listOrdersForUser };
   ──────────────────────────────────────────────────────────────────────── */
