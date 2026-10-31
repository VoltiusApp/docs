---
icon: lucide/refresh-cw
---

# Sync & Accounts

Voltius is local-first, and every sync option is zero-knowledge. [Local network sync](local-network.md) is on by default once you sign in or pair a device, and you can pause it. Everything else is opt-in.

- **[OS keychain](os-keychain.md)** — most convenient, single device
- **[Master password](master-password.md)** — passphrase-locked vault
- **[Gist sync](gist-sync.md)** — free multi-device via your own GitHub Gist
- **[Cloudflare sync](cloudflare-sync.md)** — free multi-device via your own Cloudflare Worker + R2
- **[S3 sync](s3-sync.md)** — free multi-device via any S3-compatible bucket you own
- **[Local network sync](local-network.md)** — free, automatic sync between your devices on the same network or over Tailscale, with or without an account
- **[Pair devices without an account](local-network-pairing.md)** — link two devices with a 6-digit code so they sync over the local network
- **[Cloud sync](cloud-sync.md)** — real-time sync on any paid plan (Pro, Teams, Business). Works wherever your devices are, and keeps an encrypted copy on the server
- **[Two-factor authentication](two-factor.md)** — optional authenticator code or passkey when your account signs in on a new device
- **[Web portal](web-portal.md)** — `app.voltius.app` for account management

For the cryptography behind all of this, see [Security → Sync protocol](../security/sync-protocol.md).
