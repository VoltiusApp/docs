---
icon: lucide/cloud
---

# Cloud sync

![The Sync settings panel: cloud sync active with a timestamp, plus per-type sync toggles](../assets/screenshots/cloud-sync.png){ .voltius-shot }
/// caption
Real-time cloud sync keeps every signed-in device in step. The relay only ever sees ciphertext — and you choose exactly which object types sync.
///

Real-time sync over the Voltius relay. Pro and Teams plans.

## How it works

- Sign in with your Voltius account (created on [app.voltius.app](web-portal.md) or in-app).
- The desktop derives `enc_key` (Argon2id + HKDF-SHA256) from your password.
- CRDT payloads are encrypted with `enc_key` and pushed over an SSE channel to the relay.
- Other devices subscribed to your account receive and merge in real time.

The relay sees ciphertext only — see [Security → Sync protocol](../security/sync-protocol.md).

## Sign in

**Settings → Account → Sign in.**

| Field | Notes |
| --- | --- |
| Email | Your Voltius account |
| Password | Used to derive both `auth_key` (server login) and `enc_key` (vault) |

If you don't have an account yet, **Create account** from the same screen.

## What syncs

- Hosts, folders, tags
- Identities, keys, known hosts
- Snippets, port-forwarding rules
- App preferences such as theme, UI scale, list/grid layouts, and sort modes

Most user data and preferences are included in sync. Device-specific runtime state, such as currently open terminals, is not.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Real-time | Paid plan |
| Multi-device, multi-vault | Requires account |
| Audit logs (Teams+) | — |

!!! tip "Self-host the relay"
    Business and Self-Hosting users can run the relay on their own infrastructure. See [Self-Hosting](../self-hosting/index.md).
