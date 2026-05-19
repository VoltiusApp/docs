---
icon: lucide/scroll-text
---

# Audit logs

> Screenshot placeholder — Logs tab with filters.

Every privileged action on a team or business vault produces a log entry.

## What's recorded

| Event | Fields |
| --- | --- |
| Vault unlock | user, vault, timestamp, machine fingerprint |
| Connection open | user, host, vault, jump chain, timestamp |
| Connection edit / delete | user, target, old/new metadata |
| Identity / key write | user, target |
| Member invite / remove | user, target, role |
| Role change | user, target, before / after |
| Terminal share | user, session, guests, timestamp |
| Guest keystrokes (Business) | session, keystrokes, timestamp |

## Where

- **Logs** tab in the app (Teams/Business).
- **Web portal** → Logs (mirror view, same data).
- **Export** — CSV / JSON via the toolbar.

## Filters

- Date range
- User
- Vault
- Event type
- Free-text search

## Retention

| Plan | Default retention |
| --- | --- |
| Teams | 90 days |
| Business | 365 days (configurable) |

!!! note "Webhook stream"
    Business plans can stream events to an external SIEM via webhook. **Settings → Audit → Webhooks**.
