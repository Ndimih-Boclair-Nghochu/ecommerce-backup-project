# MyShop — Ecommerce Platform

Production-ready ecommerce platform for a shop based in Bamenda, Cameroon. The app uses a Node.js/Express API, PostgreSQL database, and React/Vite/Tailwind frontend.

## Requirements

- Node.js 18+
- PostgreSQL 14+

## Setup

1. Clone the repository.
2. Copy `server/.env.example` to `server/.env` and fill in the real values.
3. Copy `client/.env.example` to `client/.env`.
4. Create the PostgreSQL database:

```bash
createdb shopdb
```

5. Install dependencies and run migrations:

```bash
npm run setup
```

6. Start development:

```bash
npm run dev
```

7. Start production:

```bash
npm run build
npm start
```

## Render Deployment

Use `RENDER_DEPLOYMENT.md` for Render setup. The short version: deploy this repo as a Render Blueprint so `render.yaml` creates the PostgreSQL database, `DATABASE_URL`, and `JWT_SECRET` together.

If you already created a manual Render Web Service, add `DATABASE_URL`, `DATABASE_SSL=false`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the Web Service environment variables before redeploying.

## Admin Access

Navigate to `/admin` and log in with the admin email and password configured in `server/.env`.

The super admin is created by `server/migrate.js` from:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`

No admin password is hardcoded in the source code.

## Environment Variables

See `server/.env.example` and `client/.env.example` for all required variables.

## Database

Run migrations manually with:

```bash
npm run migrate
```

The migration creates production PostgreSQL tables and seeds only real shop configuration:

- Main shop town: Bamenda
- Free shipping threshold: 100,000 XAF
- Store phone: +237 6 52 882 753
- Store email: ndimihboclair4@gmail.com
- Main Store at mile 4, Bamenda
- Buea Branch at mile 5, Buea
- Cameroon city shipping fees

## Cleanup

To remove prototype/demo business data from an existing database while preserving real settings, shipping fees, locations, and the super admin, run:

```bash
node server/cleanup.js
```

This removes orders, POS receipts, products, categories, chat messages, admin activity logs, and demo sub-admins using `@example.com` emails.

## Payments

No payment gateway is integrated. Checkout records the order as `pending`, then the shop contacts the customer to confirm payment and delivery.
