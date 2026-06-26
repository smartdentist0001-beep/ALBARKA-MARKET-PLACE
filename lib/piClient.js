/**
 * lib/piClient.js
 *
 * Server-side helper for Pi Payments integration.
 *
 * Functions:
 *  - createPayment({ amount, currency, orderId, metadata })
 *  - approvePayment({ paymentId, approve })
 *  - getPayment(paymentId)
 *  - verifyWebhookSignature(req)   // simple HMAC verification using body JSON string
 *
 * NOTES:
 *  - Replace endpoint paths and request/response shapes with the official Pi Payments REST/SDK spec.
 *  - Keep PI_MERCHANT_SECRET and PI_WEBHOOK_SECRET OUT OF CLIENT CODE and only in server env vars.
 *  - For reliable webhook signature verification you should compute the HMAC over the raw request body
 *    (not JSON.stringify(req.body)) — Next.js can provide raw body by disabling bodyParser or using a middleware.
 */

const axios = require("axios");
const crypto = require("crypto");

const PI_ENV = process.env.PI_ENV || "testnet";
const PI_MERCHANT_ID = process.env.PI_MERCHANT_ID;
const PI_MERCHANT_SECRET = process.env.PI_MERCHANT_SECRET;
const PI_WEBHOOK_SECRET = process.env.PI_WEBHOOK_SECRET;
const PI_PAYMENTS_BASE = process.env.PI_PAYMENTS_BASE || "https://api.minepi.com/v2/merchant";

if (!PI_MERCHANT_ID || !PI_MERCHANT_SECRET) {
  // Don't throw here to keep dev flow flexible, but warn loudly.
  console.warn("PI_MERCHANT_ID or PI_MERCHANT_SECRET not set. Pi Payments calls will fail until set.");
}

/**
 * computeHmac(payload)
 * Compute HMAC-SHA256 hex signature of payload string using merchant secret.
 * Caller should stringify payload deterministically (e.g. JSON.stringify with stable key order)
 */
function computeHmac(payloadString, secret = PI_MERCHANT_SECRET) {
  return crypto.createHmac("sha256", secret).update(payloadString, "utf8").digest("hex");
}

/**
 * createPayment
 * Server-side: create a payment object with Pi Payments.
 *
 * Input:
 *  - amount (number) required
 *  - currency (string) default "USD"
 *  - orderId (string) optional merchant order id
 *  - metadata (object) optional
 *
 * Returns:
 *  - { payment_id, approval_url, raw }  (adjust fields to match Pi API)
 */
async function createPayment({ amount, currency = "USD", orderId = undefined, metadata = {} }) {
  if (!amount) throw new Error("amount is required");

  const payload = {
    merchantId: PI_MERCHANT_ID,
    amount,
    currency,
    orderId,
    metadata,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/paymentCallback`
  };

  // For deterministic signature, stringify payload with stable key order.
  const payloadString = JSON.stringify(payload);

  const signature = computeHmac(payloadString);

  const url = `${PI_PAYMENTS_BASE.replace(/\/$/, "")}/payments`;

  try {
    const resp = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": PI_MERCHANT_ID,
        "X-Signature": signature
      },
      timeout: 10000
    });

    // Adjust these lines to match Pi's actual response schema
    const data = resp.data || {};
    return {
      payment_id: data.payment_id || data.id || null,
      approval_url: data.approval_url || data.approve_url || null,
      raw: data
    };
  } catch (err) {
    // Normalize error for callers
    const msg = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    const error = new Error(`createPayment failed: ${msg}`);
    error.original = err;
    throw error;
  }
}

/**
 * approvePayment
 * Optional: call a merchant-side approve endpoint if Pi requires explicit approval.
 *
 * Input:
 *  - paymentId (string) required
 *  - approve (boolean) optional (default true)
 *
 * Returns:
 *  - response data
 */
async function approvePayment({ paymentId, approve = true }) {
  if (!paymentId) throw new Error("paymentId is required");

  const payload = { merchantId: PI_MERCHANT_ID, paymentId, approve };
  const payloadString = JSON.stringify(payload);
  const signature = computeHmac(payloadString);

  const url = `${PI_PAYMENTS_BASE.replace(/\/$/, "")}/payments/${encodeURIComponent(paymentId)}/approve`;

  try {
    const resp = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": PI_MERCHANT_ID,
        "X-Signature": signature
      },
      timeout: 10000
    });
    return resp.data;
  } catch (err) {
    const msg = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    const error = new Error(`approvePayment failed: ${msg}`);
    error.original = err;
    throw error;
  }
}

/**
 * getPayment
 * Retrieve payment details from Pi merchant API.
 */
async function getPayment(paymentId) {
  if (!paymentId) throw new Error("paymentId is required");

  const url = `${PI_PAYMENTS_BASE.replace(/\/$/, "")}/payments/${encodeURIComponent(paymentId)}`;
  // Optionally add auth headers — here we HMAC the empty string or timestamp if required by Pi.
  const timestamp = Date.now().toString();
  const signature = computeHmac(paymentId + "|" + timestamp);

  try {
    const resp = await axios.get(url, {
      headers: {
        "X-Merchant-Id": PI_MERCHANT_ID,
        "X-Signature": signature,
        "X-Timestamp": timestamp
      },
      timeout: 8000
    });
    return resp.data;
  } catch (err) {
    const msg = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    const error = new Error(`getPayment failed: ${msg}`);
    error.original = err;
    throw error;
  }
}

/**
 * verifyWebhookSignature(req)
 *
 * Very common webhook verification pattern is HMAC-SHA256 over raw request body using PI_WEBHOOK_SECRET.
 * This helper currently uses JSON.stringify(req.body) which works if the sender signs their JSON
 * canonical representation the same way. For robust verification, capture raw body bytes and compute HMAC.
 *
 * Return: boolean
 */
function verifyWebhookSignature(req) {
  // Try common header names
  const header = req.headers["x-signature"] || req.headers["x-pi-signature"] || req.headers["x-merchant-signature"] || "";
  if (!header) return false;

  // WARNING: In Next.js, req.body is parsed JSON. For strict verification use the raw body.
  // For now we mirror earlier project behavior:
  const bodyString = JSON.stringify(req.body || {});
  const computed = crypto.createHmac("sha256", PI_WEBHOOK_SECRET || "").update(bodyString, "utf8").digest("hex");
  return computed === header;
}

module.exports = {
  createPayment,
  approvePayment,
  getPayment,
  verifyWebhookSignature,
  // expose computeHmac if you need custom signing elsewhere
  computeHmac
};
