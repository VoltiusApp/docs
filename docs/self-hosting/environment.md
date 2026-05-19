---
icon: lucide/settings-2
---

# Environment

The server is configured through `.env`. The single source of truth for every variable, its default, and whether it is required is [`server/.env.example`](https://github.com/VoltiusApp/voltius/blob/main/server/.env.example) — the file is embedded in full at the bottom of this page. This document only explains the *deployment modes* and when to use which block of that file.

## How to configure

You are running your own instance for yourself, your team, or your homelab.

- Set the **Required** block and the **Self-hosting mode** flag.
- Leave the **Billing** block alone — it is for the hosted service operated by the project maintainer and is not relevant to self-hosters. Billing endpoints return `503` whenever the self-hosting flag is set.
- Every tier-gated feature (teams, team sync, terminal sharing) is unlocked for every user. No caps are enforced by default.
- New accounts skip the 14-day Pro trial; tiers stored in the database are not enforced.
- The [admin dashboard](admin-dashboard.md) still works for manual per-user tier overrides if you want to track them for reporting, but those values have no effect on access while self-hosting is enabled. The dashboard surfaces a banner to make this clear.

If you are running on a small VPS and want a safety bound on resource use, look at the optional cap variables in the **Self-hosting mode** section of `.env.example` — they let you re-introduce specific limits without giving up the rest.

## Email, CORS, rate limits

All optional. The relevant blocks in `.env.example` document when each is worth setting. Without an email provider, verification and team-invitation emails silently no-op; accounts still work. CORS and reverse-proxy hardening matter only in public-facing production deployments.

## Migrations

Run automatically on every server start. No manual step.

## Full reference

The block below is the live `server/.env.example` from the repository. Section comments mark which variables are required, which switch deployment modes, and which are tunables.