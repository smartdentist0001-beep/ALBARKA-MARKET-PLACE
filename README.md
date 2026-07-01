# LATCINTL — Pi Network Marketplace dApp

LATCINTL is a marketplace dApp for atamfa (wax-print fabric), fabric by the
yard, and tailored clothing for men, women and children, priced and paid for
in **Pi**. It's built to run inside the **Pi Browser**, deploy to **Vercel**,
and use the official **Pi SDK** for authentication and payments.

- Frontend: plain HTML / CSS / JavaScript (no build step — loads directly in the Pi Browser webview)
- Backend: Node.js Vercel Serverless Functions (`/api`)
- Payments: official Pi SDK (`Pi.authenticate`, `Pi.createPayment`) + server-side `approve` / `complete` / `cancel` against the Pi Platform API
- Ready for both **Testnet (sandbox)** and **Mainnet** via a single environment variable

```
latcintl/
├── public/                 Static frontend served to the Pi Browser
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── cart.js         Cart state (localStorage)
│   │   ├── pi-sdk.js       Pi.init / authenticate / createPayment wiring
│   │   └── app.js          UI: catalog, filters, cart drawer, checkout
│   └── validation-key.txt  Pi domain-validation placeholder (see below)
├── api/                    Vercel Serverless Functions
│   ├── config.js           Exposes sandbox/mainnet flag to the client
│   ├── products/index.js   GET product catalog
│   ├── payments/
│   │   ├── approve.js      onReadyForServerApproval → Pi /payments/:id/approve
│   │   ├── complete.js     onReadyForServerCompletion → Pi /payments/:id/complete
│   │   ├── cancel.js       onCancel → Pi /payments/:id/cancel
│   │   └── incomplete.js   onIncompletePaymentFound handler
│   ├── auth/verify.js      Server-side verification of a Pi accessToken
│   └── orders/index.js     List a signed-in user's past orders
├── lib/
│   ├── piNetwork.js        Server-to-server Pi Platform API client
│   ├── store.js            Order persistence (file-based demo + KV notes)
│   └── products.json       Seed catalog (fabrics, atamfa, men/women/children)
└── data/                   Local dev order storage
```

## 1. Register the app in the Pi Developer Portal

1. Open the **Pi Browser** → **Develop** tab → **Pi Developer Portal**.
2. Create a new app called **LATCINTL**.
3. Under **Keys**, generate a **Server API Key** — this becomes `PI_API_KEY`.
4. Under **Domain Validation**, copy the validation key string shown there.

## 2. Configure environment variables

Copy `.env.example` to `.env` for local dev, and add the same values in
**Vercel → Project → Settings → Environment Variables** for deployment:

| Variable      | Purpose                                                        |
|---------------|------------------------------------------------------------------|
| `PI_API_KEY`  | Server API key from the Developer Portal. **Never** expose client-side. |
| `PI_SANDBOX`  | `"true"` = Pi Testnet (default, safe). `"false"` = Pi Mainnet, real Pi. |

## 3. Domain validation

Open `public/validation-key.txt` and replace the placeholder line with the
exact key string from the Developer Portal, then deploy. Pi validates domain
ownership by fetching `https://your-domain.com/validation-key.txt`.

## 4. Run locally

```bash
npm install -g vercel   # if you don't already have the Vercel CLI
npm run dev              # runs `vercel dev`, serving both /public and /api
```

Open the local URL in a regular browser to check layout/logic — but
`Pi.authenticate` / `Pi.createPayment` only work **inside the Pi Browser**,
so for real auth/payment testing you need step 5.

## 5. Test inside the Pi Browser (Testnet)

1. Deploy to Vercel (`vercel` or push to a connected Git repo) with `PI_SANDBOX=true`.
2. In the Developer Portal, set your app's URL to the Vercel deployment URL.
3. Open the app from the **Develop** tab in the Pi Browser using a **sandbox
   test account** (Pi Browser → Settings → sandbox mode, or the "Test in Sandbox"
   button in the Developer Portal).
4. Sign in, add products to the cart, and check out — payments will use
   test-Pi and hit the Pi **Testnet**, so nothing of real value moves.

## 6. Go to Mainnet

1. Complete Pi's app review / production checklist for your app in the Developer Portal.
2. Set `PI_SANDBOX=false` in Vercel's environment variables and redeploy.
3. Re-confirm `validation-key.txt` still matches the production app's key.
4. Swap the order store (see `lib/store.js`) for a real database before
   launch — the built-in file store is a working demo, not durable storage.

## Payment flow implemented here

```
Browser (public/js/pi-sdk.js)              Server (api/payments/*.js)         Pi Platform API
────────────────────────────              ─────────────────────────         ────────────────
Pi.authenticate()  ───────────────────────────────────────────────────────▶  verifies user
Pi.createPayment(data, callbacks)
  onReadyForServerApproval(id)  ─────────▶ POST /api/payments/approve
                                              recompute total from
                                              trusted price list,
                                              compare to Pi's amount   ─────▶ POST /payments/:id/approve
  user confirms in Pi Browser, tx is broadcast to the Pi blockchain
  onReadyForServerCompletion(id, txid) ──▶ POST /api/payments/complete ────▶ POST /payments/:id/complete
  onCancel(id)                  ─────────▶ POST /api/payments/cancel  ────▶ POST /payments/:id/cancel
Pi.authenticate's onIncompletePaymentFound ▶ POST /api/payments/incomplete  (resolves orphaned payments)
```

Server-side, every approval **recomputes the order total from
`lib/products.json`** and compares it against the amount Pi reports for that
`paymentId` — the client-submitted cart is never trusted for pricing.

## Notes on data & catalog

- `lib/products.json` is the source of truth for prices — edit it directly,
  or swap `api/products/index.js` to read from a real database/CMS.
- Product images use placeholder URLs (`placehold.co`) — replace with real
  product photography before launch.
- `lib/store.js` explains exactly how to swap the demo file store for
  Vercel KV or a full database; do this before accepting real Mainnet orders.

## Security checklist before Mainnet launch

- [ ] `PI_API_KEY` set only in Vercel env vars, never committed or shipped to the client
- [ ] `validation-key.txt` matches the production app in the Developer Portal
- [ ] Real database wired into `lib/store.js`
- [ ] Server-side price verification in `api/payments/approve.js` left intact
- [ ] HTTPS enforced (Vercel does this by default)
- [ ] Order/customer data handled per your applicable privacy regulations
