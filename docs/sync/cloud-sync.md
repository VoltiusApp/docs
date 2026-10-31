---
icon: lucide/cloud
---

# Cloud sync

![The Sync settings panel: cloud sync active with a timestamp, plus per-type sync toggles](../assets/screenshots/cloud-sync.png){ .voltius-shot }
/// caption
Real-time cloud sync keeps every signed-in device in step. The relay only ever sees ciphertext — and you choose exactly which object types sync.
///

Real-time sync over the Voltius relay. Pro, Teams and Business plans (including the 14-day Pro trial).

Your devices already sync with each other for free over [local network sync](local-network.md) when they are on the same network or Tailscale. Cloud sync adds what local sync can't do: devices stay in sync even when they are never online at the same time, and the server keeps an encrypted copy of your data.

## How it works

- Sign in with your Voltius account (created on [app.voltius.app](web-portal.md) or in-app).
- The desktop derives `enc_key` (Argon2id + HKDF-SHA256) from your password.
- CRDT payloads are encrypted with your account's vault key (unwrapped by `enc_key`) and uploaded to the relay over HTTPS.
- An SSE stream tells your other devices a new payload is ready; they fetch and merge it in real time.

The relay sees ciphertext only — see [Security → Sync protocol](../security/sync-protocol.md).

## Sign in

**Settings → Sync → Sign in** (under *Voltius Cloud*), or **Sign in / Sign up** in the account menu.

| Field | Notes |
| --- | --- |
| Email | Your Voltius account |
| Master password | Used to derive both `auth_key` (server login) and `enc_key` (vault) |

If you don't have an account yet, **Create account** from the same screen.

If the account has [two-factor authentication](two-factor.md) on, a code from your authenticator app or a passkey is asked for next.

## What syncs

- Hosts, folders, tags
- Identities, SSH keys
- Snippets, port-forwarding rules
- App preferences such as theme, UI scale, list/grid layouts, and sort modes

Most user data and preferences are included in sync. Device-specific runtime state, such as currently open terminals, is not.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Real-time | Paid plan |
| Multi-device, multi-vault | Requires account |
| Works wherever your devices are | — |
| Encrypted copy on the server, a backup if you lose a device | — |
| Team audit logs (Teams+) | — |

## Cloud sync and local network sync

Both run at the same time. When two devices are near each other, local network sync carries changes directly; when they are apart, Cloud sync carries them through the server. A change that arrives both ways is merged once.

!!! tip "Self-host the relay"
    Anyone can run the relay on their own infrastructure — accounts on a self-hosted server get every paid feature, and Business customers also get a commercial license exception. See [Self-Hosting](../self-hosting/index.md).
