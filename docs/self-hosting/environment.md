---
icon: lucide/settings-2
---

# Environment

The server is configured through `.env`. Only one variable is strictly required.

## Required

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Signs session tokens. Generate with `openssl rand -hex 32`. |

The bundled `compose.yml` provides a Postgres database and sensible defaults for everything else. You can override any of them in `.env` — see below.

## Self-hosted mode is automatic

The server runs in self-hosted mode whenever `LEMONSQUEEZY_API_KEY` is unset (which is the default). In that mode:

- Every paid feature is unlocked for every user — teams, team vaults, terminal sharing, audit logs.
- No 14-day trial countdown on new accounts.
- All `/v1/billing/*` endpoints return `503 BILLING_DISABLED`.
- The Lemon Squeezy webhook is disabled.
- `GET /v1/meta` reports `{"self_hosted": true, "billing_enabled": false}` so the [admin dashboard](admin-dashboard.md) (if you run it) can hide its billing widgets.

There is no `SELF_HOSTED` flag to set. The absence of Lemon Squeezy configuration *is* the signal.

## Optional

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | bundled Postgres | Postgres connection string. |
| `HOST_PORT` | `14372` | Host port to expose. |
| `RESEND_API_KEY` | unset | Enables email verification + team invitation emails via [Resend](https://resend.com). Without it, those emails silently no-op; accounts still work. |
| `CORS_ORIGINS` | allow all | Comma-separated allow-list. Set to your domain in public deployments. |
| `TRUSTED_PROXIES` | unset | Comma-separated IPs or CIDRs of your reverse proxy. Required for rate limiting to see real client IPs behind a proxy — a container proxy needs its network's subnet, e.g. `172.22.0.0/16`, not a single address. The older single-address name `TRUSTED_PROXY_IP` still works. |
| `SYNC_RATE_LIMIT` | `60` | Sync operations per hour per IP. |
| `REGISTER_RATE_LIMIT` | `20` | New registrations per day per IP. |
| `INVITE_RATE_LIMIT` | `20` | Team invitations per hour per IP. |
| `ADMIN_SECRET` | unset | Required only if you run the optional [admin dashboard](admin-dashboard.md). Must match the same value in the dashboard's `.env`. |

!!! tip "Production database & backups"
    The bundled Postgres is convenient but has no backup story — if its volume is lost, so is your data. For a durable setup, point `DATABASE_URL` at a Postgres you run yourself. [`server/compose.db.yml`](https://github.com/VoltiusApp/server/blob/main/compose.db.yml) is the stack Voltius' own production database runs on: pinned Postgres, WAL-G continuous archiving and base backups to S3-compatible storage, `pg_dump` rotation mirrored off-box, a freshness watchdog, and an optional Supabase Studio profile for browsing tables. Configure it from [`.env.db.example`](https://github.com/VoltiusApp/server/blob/main/.env.db.example); the [restore runbook](https://github.com/VoltiusApp/server/blob/main/docs/runbooks/restore-database.md) covers point-in-time recovery.

## Migrations

Run automatically on every server start. No manual step.

## Full reference

The complete annotated file lives at [`server/.env.example`](https://github.com/VoltiusApp/server/blob/main/.env.example).
