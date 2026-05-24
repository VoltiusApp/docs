---
icon: lucide/shield-alert
---

# Admin dashboard

An optional web console for self-hosters who want to manage users, inspect audit logs, and watch signups. It is a **separate container** ([`VoltiusApp/admin-dashboard`](https://github.com/VoltiusApp/admin-dashboard)) and is not required to run the server.

!!! note "Designed for private networks"
    The dashboard ships behind a shared email+password login and is meant to be exposed only on a private network (Tailscale, VPN, LAN). Do not put it on the public internet.

## What you can do

- View user accounts, devices, and presence.
- Search, filter, ban/unban, and soft-delete users.
- Extend trials and set per-user feature flags.
- Inspect the admin audit log.
- Track signups and churn over time.

When the dashboard detects the backend is self-hosted (via `GET /v1/meta`), all Lemon Squeezy widgets — MRR, paying subscribers, revenue, recent orders — are hidden automatically. You only see operational metrics that actually apply to a self-hosted setup.

## Run it

The backend needs `ADMIN_SECRET` set so it accepts admin requests:

```bash
# server/.env
JWT_SECRET=...
ADMIN_SECRET=<32-byte hex, same value as the dashboard>
```

Then in a separate directory:

```bash
git clone https://github.com/VoltiusApp/admin-dashboard
cd admin-dashboard

cat > .env <<EOF
ADMIN_API_URL=http://voltius-server:8080
ADMIN_SECRET=<same value as server/.env>
ADMIN_EMAILS=you@example.com
ADMIN_PASSWORD=$(openssl rand -hex 16)
COOKIE_SECURE=false
EOF

docker compose up -d
```

The dashboard binds to host port `3001`. Open `http://<tailscale-ip>:3001/admin/login` and sign in with one of the emails in `ADMIN_EMAILS` plus the shared `ADMIN_PASSWORD`.

## Required environment

| Variable | Purpose |
|---|---|
| `ADMIN_API_URL` | URL of the Voltius backend (e.g. `http://voltius-server:8080`) |
| `ADMIN_SECRET` | Shared secret sent to the backend as `X-Admin-Key`. Must match the server's `ADMIN_SECRET`. |
| `ADMIN_EMAILS` | Comma-separated list of emails allowed to log in |
| `ADMIN_PASSWORD` | Shared password for all admin emails |
| `COOKIE_SECURE` | `true` if you serve the dashboard over HTTPS, otherwise `false` |

!!! warning
    `ADMIN_SECRET` grants god-mode read across all data on your server. Treat it like any other production secret, never commit it, and don't expose port `3001` to the internet.
