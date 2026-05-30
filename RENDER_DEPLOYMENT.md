# Render Deployment

This app requires PostgreSQL. A Render Web Service does not include PostgreSQL on `localhost`, so the service must receive a real `DATABASE_URL`.

## Why The Deploy Failed

If the logs show:

```text
Server failed to start: DATABASE_URL is missing or pointing to local PostgreSQL.
```

Render did not provide the database connection string. This usually means the service was created manually as a Web Service. Manual Web Services do not apply the `envVars` from `render.yaml`.

## Recommended: Deploy As A Blueprint

1. Open the Render Dashboard.
2. Go to **Blueprints**.
3. Click **New Blueprint Instance**.
4. Select this repository.
5. Confirm the plan and create the instance.
6. When Render asks for `ADMIN_PASSWORD`, enter the first admin password.

The repository `render.yaml` creates:

- the Node web service
- a PostgreSQL database
- `DATABASE_URL` from the database internal connection string
- a generated `JWT_SECRET`

## Existing Manual Web Service Fix

If you want to keep the Web Service that already exists:

1. Create a Render PostgreSQL database.
2. Open the database **Info** page.
3. Copy the **Internal Database URL**.
4. Open the Web Service **Environment** tab.
5. Add these environment variables:

```text
DATABASE_URL=<paste the Internal Database URL>
DATABASE_SSL=false
JWT_SECRET=<long random string, at least 32 characters>
ADMIN_EMAIL=ndimihboclair4@gmail.com
ADMIN_PASSWORD=<first admin password>
NODE_ENV=production
SHOP_NAME=MyShop
```

6. Redeploy the Web Service.

## Web Service Settings

Use these commands if setting up the service manually:

```text
Build Command: npm install && npm run build
Start Command: npm run start
Health Check Path: /api/health
```

## Important Notes

- Do not use `localhost`, `127.0.0.1`, or `::1` for `DATABASE_URL` on Render.
- Do not commit real passwords or database URLs to GitHub.
- `ADMIN_PASSWORD` is used during migration to create/update the super admin, then the app stores a bcrypt hash in PostgreSQL.
- After the first successful deploy, you can replace `ADMIN_PASSWORD` with `ADMIN_PASSWORD_HASH` if you prefer.
