LATCINTL - Pi Marketplace dApp (Next.js + Vercel Serverless)

Overview
- Next.js React storefront for fabrics/clothing.
- Serverless API routes for product, order, and Pi Payments integration.
- MongoDB Atlas used for products and orders.
- Pi integration skeleton: client-side Pi Auth hooks and server-side payment API routes (createPayment, serverApproval, paymentCallback webhook).
- Ready for Vercel deployment (serverless functions).

What I built
- Frontend pages: home (catalog), product detail, cart, checkout, admin UI.
- API routes: /api/products, /api/seed (dev), /api/createPayment, /api/serverApproval, /api/paymentCallback, /api/orders/[id]
- MongoDB connection helper (lib/db.js)
- Pi Payments helper (lib/piClient.js) with env-switched endpoints (testnet/mainnet). Replace placeholders with actual Pi API endpoints/SDK calls as needed.

Quick start (local)
1) Copy files into a new folder.
2) npm install
3) Create a .env.local from .env.example and fill values.
4) Start dev server: npm run dev
5) Seed sample products (optional): npm run seed

Pi Integration notes
- Client-side: use NEXT_PUBLIC_PI_CLIENT_ID to integrate Pi SDK in the browser.
- Server-side: PI_MERCHANT_SECRET and PI_MERCHANT_ID must remain secret. Provide them in Vercel as environment variables.
- Webhook: configure Pi to POST to NEXT_PUBLIC_APP_URL + /api/paymentCallback. Set PI_WEBHOOK_SECRET and validate signature.

Payment flow (high level)
1) User logs in with Pi (Pi Auth) — client obtains pi user identifier/token.
2) Client posts order to /api/createPayment (server creates order, calls Pi Payments create payment endpoint).
3) Server returns payment_id / approval_url / client token; client uses Pi wallet SDK or redirect to approve.
4) Pi calls your webhook (paymentCallback) on status changes; server validates signature and updates order.
5) Optionally serverApproval endpoint used for any merchant-side approval required by Pi workflow.

Security
- Never put PI_MERCHANT_SECRET in the client.
- Use PI_WEBHOOK_SECRET to verify incoming webhook requests.
- Admin UI is protected by ADMIN_TOKEN (simple approach for MVP). In production use proper auth.

Deploy to Vercel
- Create a Vercel project, connect to GitHub repo, set the environment variables shown in .env.example.
- Deploy. Ensure the webhook URL in Pi console points to https://<your-vercel-domain>/api/paymentCallback

Next steps & customization
- Replace mock/no-op Pi API calls with official Pi SDK or documented endpoints.
- Add shipping, taxes, inventory, image uploads (Cloudinary/S3).
- Harden admin auth (OAuth, session-based).
- Add email notifications and fulfillment flows.

If you want, I can:
- Output a ZIP-ready set of files,
- Or push this scaffold to a GitHub repo (you must create the repo and provide owner/repo).
