# Global Grace Activation

Server-rendered Express app — public site, admin CMS, shop, and API all in one process, backed by MongoDB.

## Stack

- **Express 5** + **EJS** (server-rendered views, `src/views/`) + **express-ejs-layouts**
- **MongoDB / Mongoose**
- **Socket.io** for live-stream chat (attached to the same HTTP server as the Express app — see `src/server.js`)
- Static assets served from `public/`
- No frontend build step — plain HTML/EJS/CSS/vanilla JS throughout, including the admin dashboard

## Local setup

```bash
npm install
cp .env.example .env   # then fill in real values, see below
npm run seed:admin     # creates the first admin account, one time only
npm run seed:content   # optional — populates the CMS with the real site copy
npm run dev            # nodemon, http://localhost:5000
```

`npm run seed:admin` reads `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` from `.env`. It's idempotent — safe to re-run, it no-ops if an admin already exists. Registration through the API (`POST /api/auth/register`) is intentionally **not public** — new accounts are created by an existing admin from the dashboard (or by re-running the seed script for the very first one).

## Required environment variables

See `.env.example` for the full list with placeholder values. Notable ones:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Database connection string |
| `JWT_SECRET` | Must be a real random secret — never the literal placeholder |
| `FRONTEND_URL` | The production origin (drives CORS + Socket.io CORS) — set this to the real deployed domain |
| `PAYMENT_MODE` | `mock` (default) simulates Paystack/Flutterwave with no real keys needed, for testing the full checkout flow. Set to anything else once real gateway keys are supplied below |
| `PAYSTACK_SECRET_KEY` / `FLUTTERWAVE_SECRET_KEY` / `FLUTTERWAVE_SECRET_HASH` | Real payment gateway credentials — leave blank while `PAYMENT_MODE=mock` |
| `PAYMENT_PROVIDERS` | Gateways accepted for giving and the shop. Defaults to `flutterwave` (the only account set up); add `paystack` once it has keys |
| `PAYMENT_CALLBACK_BASE_URL` | The public site origin Flutterwave sends customers back to after paying (e.g. `https://globalgraceactivation.com`) |
| `EXPORT_FEED_TOKEN` | Optional secret for the live spreadsheet link on Admin > Event Registrations. If blank, one is derived from `JWT_SECRET` |
| `TRUST_PROXY` | Number of reverse proxies in front of the app. Defaults to `1` in production so rate limiting sees each visitor's real IP |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Used once by `npm run seed:admin` |

### Giving with Flutterwave

Set `PAYMENT_MODE=live` (anything except `mock`) with the Flutterwave keys. In the Flutterwave dashboard, point the webhook at `https://<your-domain>/api/payments/webhook/flutterwave` and set its **secret hash** to the same value as `FLUTTERWAVE_SECRET_HASH`. Donors choose their currency on the Give page (`src/config/currencies.js`) — only currencies enabled on the Flutterwave account will actually settle. A donation is confirmed by the webhook, or on the donor's return to the confirmation page (the transaction is re-verified with Flutterwave, including amount and currency).

### Admin records, exports and the spreadsheet link

Admin lists can be filtered by date and downloaded as Excel (`.xlsx`, with a Summary sheet of totals for donations, orders and registrations) or CSV. Admin > Event Registrations also shows a private live link that Excel (Data > From Web) or Google Sheets (`=IMPORTDATA(...)`) can read, so a connected sheet picks up new registrations whenever it refreshes. Treat that link like a password.

**Before this goes anywhere near production:** the MongoDB Atlas database password and Cloudinary API secret that were previously committed to git history must be rotated at their respective dashboards. Removing them from tracking (already done) does not undo that exposure — only rotating the actual credentials does.

## Deployment notes

- This app needs a **persistent Node process** — it's no longer static files, and Socket.io specifically needs a hosting environment that supports long-lived WebSocket (or polling-fallback) connections. Confirm whatever host is chosen supports that before relying on live chat in production.
- `NODE_ENV=production` gates `morgan` request logging off and marks the auth cookie `Secure` (HTTPS-only) — make sure it's actually set in the production environment.
- `PORT` defaults to 5000 if unset; most hosts inject their own via the `PORT` env var, which this app already respects.

**Deliberately not included yet** — specifics depend on which hosting tier is chosen (GoDaddy shared/cPanel vs VPS, or elsewhere): a `Procfile`, reverse-proxy config, cPanel Node.js App Manager setup, TLS termination, and process manager choice (pm2 / systemd / Passenger). These are the last piece once the hosting decision is final.

