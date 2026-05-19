---
icon: lucide/settings-2
---

# Environment

The server is configured through `.env`. Source of truth: [`server/.env.example`](https://github.com/VoltiusApp/voltius/blob/main/server/.env.example).

!!! note "TL;DR for community self-hosters"
    Set the four **Required** variables and `SELF_HOSTED=true`. The server starts, accepts logins, syncs vaults, and unlocks every tier-gated feature (teams, team sync, terminal sharing) with no caps. Everything else (email, billing, proxy hardening, per-cap overrides) is opt-in.

## Required

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, e.g. `postgres://user:pass@db/voltius` |
| `JWT_SECRET` | At least 32 bytes of random. `openssl rand -hex 32`. |
| `PORT` | Default `8080`. |
| `ADMIN_SECRET` | Required only if you also deploy the [admin dashboard](admin-dashboard.md). Skip if you're sync-only. |

That's it. The server boots, runs migrations, and serves auth + sync.

## Self-hosting mode

| Variable | Notes |
| --- | --- |
| `SELF_HOSTED` | Set to `true` if you're running your own instance and not selling subscriptions. |

When `SELF_HOSTED=true`:

- Every user is treated as having unlimited entitlements. Teams, team sync, and terminal session sharing are unlocked regardless of what `subscription_tier` says in the database.
- Tier-based caps are removed by default — no max concurrent terminal sessions per owner, no guest cap per session, no team seat minimum.
- The JWT `tier` claim is forced to `business`, so the web and desktop clients unlock their full UI without any client-side configuration.
- Billing endpoints (`POST /v1/billing/checkout`, `POST /v1/billing/portal`, the LS webhook) return `503 Service Unavailable` **unconditionally**, even if `LEMONSQUEEZY_*` variables are set. This is a safety net against a misconfigured instance accidentally hitting your Lemon Squeezy store.
- New accounts skip the 14-day Pro trial; `trial_ends_at` stays null.

The [admin dashboard](admin-dashboard.md) still lets you set per-user `subscription_tier` values manually if you want to track them for your own reporting, but those values are not enforced while `SELF_HOSTED=true`. The dashboard will surface a banner reminding you.

### Optional caps

If you're running on a small VPS and want a safety bound on resource use, you can opt back into specific caps. These are only consulted when `SELF_HOSTED=true`; otherwise the paid-tier caps apply.

| Variable | Notes |
| --- | --- |
| `MAX_CONCURRENT_TERMINAL_SESSIONS_PER_USER` | Hard cap on simultaneously active terminal sessions per host. Unset = unlimited. |
| `MAX_TERMINAL_GUESTS_PER_SESSION` | Hard cap on guest participants per terminal session (host always allowed). Unset = unlimited. |

## Email — optional, recommended

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key |

Without it, **email verification** and **team invitations** silently no-op. Accounts can still be created; users just won't receive verification mails. Fine for a single-user or trusted-team setup.

## CORS + reverse proxy

| Variable | Notes |
| --- | --- |
| `CORS_ORIGINS` | Comma-separated allowed origins. Default: open (don't use in prod). For Tauri clients include `tauri://localhost`. |
| `TRUSTED_PROXY_IP` | IP of your reverse proxy. Only that peer's `X-Forwarded-For` is honored for rate-limiting. Leave unset in local dev. |

## Rate limits — optional

Defaults are sensible. Override only if you know why.

| Variable | Default |
| --- | --- |
| `SYNC_RATE_LIMIT` | 60 ops / hour / IP |
| `REGISTER_RATE_LIMIT` | 20 accounts / day / IP |
| `INVITE_RATE_LIMIT` | 20 invites / hour / IP |

## Billing — only if you sell subscriptions

!!! warning "You almost certainly don't need this"
    Lemon Squeezy is **only** for operators running a paid hosted service. If you set `SELF_HOSTED=true` above, every `LEMONSQUEEZY_*` and `LS_VARIANT_*` variable is ignored and billing endpoints return 503 regardless. Skip this whole section.

If `SELF_HOSTED` is unset *and* you leave these variables unset (the default for an unconfigured paid-SaaS deployment):

- `POST /v1/billing/checkout` → `503 Service Unavailable`
- `POST /v1/billing/portal` → `503 Service Unavailable`
- `POST /v1/webhooks/lemonsqueezy` → rejected (signing secret missing)
- Auth and sync still work, but tier-gated features (teams, team sync, terminal sharing) will be locked for users on the `free` tier. This mode is rarely what you want — pick either `SELF_HOSTED=true` or a full billing config.

If you *do* want to sell subscriptions, set:

| Variable | Notes |
| --- | --- |
| `LEMONSQUEEZY_SIGNING_SECRET` | Webhook signing secret |
| `LEMONSQUEEZY_STORE_ID` | Numeric store ID |
| `LEMONSQUEEZY_API_KEY` | API key from LS → Settings → API |
| `LS_VARIANT_PRO_MONTHLY` | Variant ID for Pro monthly |
| `LS_VARIANT_PRO_YEARLY` | Variant ID for Pro yearly |
| `LS_VARIANT_TEAMS_MONTHLY` | Variant ID for Teams monthly |
| `LS_VARIANT_TEAMS_YEARLY` | Variant ID for Teams yearly |
| `LS_TEST_MODE` | `true` for test-mode checkouts |

## Migrations

Run automatically on every server start. No manual step.
