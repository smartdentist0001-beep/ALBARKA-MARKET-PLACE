/**
 * lib/piNetwork.js
 * ─────────────────────────────────────────────────────────────────────────
 * Thin wrapper around the official Pi Platform API (server-to-server calls).
 * Docs: https://github.com/pi-apps/pi-platform-docs
 *
 * All requests are authenticated with the app's Server API Key, which is
 * generated in the Pi Developer Portal and must be kept secret (env var
 * PI_API_KEY, only ever read on the server / inside /api functions).
 */

const PI_API_BASE = "https://api.minepi.com/v2";

function getApiKey() {
  const key = process.env.PI_API_KEY;
  if (!key) {
    throw new Error(
      "PI_API_KEY is not set. Add it in your Vercel project settings or .env file."
    );
  }
  return key;
}

function authHeaders() {
  return {
    Authorization: `Key ${getApiKey()}`,
    "Content-Type": "application/json"
  };
}

async function piRequest(path, options = {}) {
  const res = await fetch(`${PI_API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(
      `Pi Platform API error ${res.status} on ${path}: ${JSON.stringify(json)}`
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

/** GET /payments/:paymentId — fetch the current state of a payment from Pi servers. */
async function getPayment(paymentId) {
  return piRequest(`/payments/${paymentId}`, { method: "GET" });
}

/** POST /payments/:paymentId/approve — required before the user is asked to confirm. */
async function approvePayment(paymentId) {
  return piRequest(`/payments/${paymentId}/approve`, { method: "POST" });
}

/** POST /payments/:paymentId/complete — required after the blockchain transaction is submitted. */
async function completePayment(paymentId, txid) {
  return piRequest(`/payments/${paymentId}/complete`, {
    method: "POST",
    body: JSON.stringify({ txid })
  });
}

/** POST /payments/:paymentId/cancel — mark a payment as cancelled on the server side. */
async function cancelPayment(paymentId) {
  return piRequest(`/payments/${paymentId}/cancel`, { method: "POST" });
}

/** GET /me — resolve a Pi accessToken to the Pi user it belongs to (server-side verification). */
async function getUserFromAccessToken(accessToken) {
  const res = await fetch(`${PI_API_BASE}/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = new Error(`Failed to verify Pi access token (status ${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

module.exports = {
  getPayment,
  approvePayment,
  completePayment,
  cancelPayment,
  getUserFromAccessToken
};
