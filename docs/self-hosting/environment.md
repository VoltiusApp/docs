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
| `POSTGRES_IMAGE_TAG` | `16-alpine` | Tag of the bundled `postgres` image. Changing the major version does not upgrade an existing data volume — Postgres refuses to start on it. |
| `HOST_PORT` | `14372` | Host port to expose. |
| `CORS_ORIGINS` | allow all | Comma-separated allow-list. Set to your domain in public deployments. |
| `TRUSTED_PROXIES` | unset | Comma-separated IPs or CIDRs of your reverse proxy. Required for rate limiting to see real client IPs behind a proxy — a container proxy needs its network's subnet, e.g. `172.22.0.0/16`, not a single address. The older single-address name `TRUSTED_PROXY_IP` still works. |
| `SYNC_BLOB_RETENTION_DAYS` | `90` | Days to keep a sync blob once a newer one from the same account supersedes it. The latest blob is never deleted. |
| `TEAM_OBJECTS_MIN_CLIENT_VERSION` | unset | Minimum desktop version allowed to write team vault objects, e.g. `0.33.0`. Older clients get `426 Upgrade Required` on writes; reads are never gated. Set it only once your users have updated. |
| `ADMIN_SECRET` | unset | Required only if you run the optional [admin dashboard](admin-dashboard.md). Must match the same value in the dashboard's `.env`. |

### Email

| Variable | Default | Purpose |
|---|---|---|
| `RESEND_API_KEY` | unset | Enables email verification + team invitation emails via [Resend](https://resend.com). Without it, those emails silently no-op; accounts still work. |
| `RESEND_FROM` | `Voltius <noreply@voltius.app>` | Sender address. **Set this if you set `RESEND_API_KEY`**: Resend only sends from a domain you have verified, so the default fails for every self-host and no email arrives. |
| `VOLTIUS_APP_URL` | `https://app.voltius.app` | Base URL of the links in verification and invitation emails. Point it at your deployment, or those links lead to the hosted service. |
| `VOLTIUS_MARKETING_URL` | `https://voltius.app` | Website link in the email footer. |
| `RESEND_LOGO_URL` | `https://voltius.app/logo.png` | Logo shown in email headers. |

### Rate limits

The defaults are fine for most deployments. Limits keyed per IP depend on `TRUSTED_PROXIES` being right behind a proxy.

| Variable | Default | Purpose |
|---|---|---|
| `AUTH_RATE_LIMIT` | `10` | Login, refresh and challenge requests per minute per IP. |
| `REGISTER_RATE_LIMIT` | `20` | New registrations per day per IP. |
| `WAITLIST_RATE_LIMIT` | `10` | Waitlist submissions per hour per IP. |
| `SYNC_RATE_LIMIT` | `60` | Sync operations per hour per user. |
| `INVITE_RATE_LIMIT` | `20` | Team invitations per hour per user. |
| `USER_SEARCH_RATE_LIMIT` | `60` | User directory searches per minute per user. |
| `STRANGER_KNOCK_RATE_LIMIT` | `20` | Terminal-sharing invites to people outside your teams, per hour per sender. |

!!! tip "Production database & backups"
    The bundled Postgres is convenient but has no backup story — if its volume is lost, so is your data. For a durable setup, point `DATABASE_URL` at a Postgres you run yourself. [`server/compose.db.yml`](https://github.com/VoltiusApp/server/blob/main/compose.db.yml) is the stack Voltius' own production database runs on: pinned Postgres, WAL-G continuous archiving and base backups to S3-compatible storage, `pg_dump` rotation mirrored off-box, a freshness watchdog, and an optional Supabase Studio profile for browsing tables. Configure it from [`.env.db.example`](https://github.com/VoltiusApp/server/blob/main/.env.db.example); the [restore runbook](https://github.com/VoltiusApp/server/blob/main/docs/runbooks/restore-database.md) covers point-in-time recovery.

## Migrations

Run automatically on every server start. No manual step.

## Full reference

The complete annotated file lives at [`server/.env.example`](https://github.com/VoltiusApp/server/blob/main/.env.example).
