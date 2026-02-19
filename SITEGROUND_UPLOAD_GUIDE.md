# SiteGround Upload Guide

This project can be deployed to SiteGround in two ways, depending on your hosting plan.

## 1) Static-only upload (fastest)

Use this for storefront pages only.

1. Run:
   - `npm install`
   - `npm run package:siteground`
2. Open the generated folder:
   - `deploy/siteground/static/public_html`
3. In SiteGround File Manager, upload everything inside that folder to `public_html`.

### Important
- Static pages work immediately.
- Payment and order endpoints (`/api/*`) require the Node backend and environment variables.
- If backend is not hosted, secure checkout calls will fail.

## 2) Full stack deployment (Node backend required)

Use this for Stripe/PayPal processing and order APIs.

1. Run:
   - `npm install`
   - `npm run package:siteground`
2. Use folder:
   - `deploy/siteground/fullstack`
3. Upload to a Node-capable environment (SiteGround Cloud/VPS or another Node host).
4. Create `.env` from `.env.example` and set production values.
5. Install dependencies and start app:
   - `npm install`
   - `npm start`

## 3) Domain and CORS settings

Update these before production launch:

- `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
- `CLIENT_URL=https://yourdomain.com`

## 4) Pre-upload checklist

- Stripe live keys configured
- PayPal live credentials configured
- `JWT_SECRET` set to a strong random value
- `ADMIN_PASSWORD_HASH` set (bcrypt hash)
- SSL enabled on your domain
