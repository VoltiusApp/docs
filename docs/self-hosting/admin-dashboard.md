---
icon: lucide/shield-alert
---

# Admin dashboard

> Screenshot placeholder — admin dashboard in the web portal.

A web console for operators — shipped as part of the Next.js portal (`web/portal`).

## Access

Set `ADMIN_SECRET` to the **same** 32-byte hex value in both:

- `server/.env` — used to verify the `X-Admin-Key` header on admin routes.
- `web/portal/.env.local` (or your Vercel env) — sent by the portal on every admin request.

Hit `https://app.voltius.app/admin` and sign in.

## What you can do

- View user accounts, sessions, devices.
- View teams, vaults, member counts.
- Inspect audit logs across all tenants.
- Manually issue / revoke a license token.
- Trigger a member offboarding if a user is locked out.

## What you can't do

- Read vault contents — they're ciphertext.
- Reset a user's password — Voltius doesn't escrow the KDF salt or password. Users use the desktop client's recovery flows.

!!! warning
    `ADMIN_SECRET` grants god-mode read across all tenants. Rotate it like any other production secret, and don't share it across environments.
