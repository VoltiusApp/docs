---
icon: simple/cloudflare
---

# Cloudflare sync

Zero-knowledge multi-device sync through a **Cloudflare Worker and R2 bucket you own**. Voltius never sees your data, and neither does anyone else — the Worker stores ciphertext and device metadata, nothing more.

Cloudflare Sync is a marketplace plugin: **Settings → Plugins → Marketplace → Cloudflare Sync**, or install it straight from the sync menu.

## How it works

1. A Worker on your Cloudflare account exposes a small sync API backed by an R2 bucket.
2. Voltius derives an encryption key from your **passphrase** plus a manifest salt, on-device.
3. The vault is exported as encrypted per-device blobs and pushed to the Worker.
4. Each device polls for changes and merges remote records into local state. ETags settle concurrent writes.

Two secrets, and they are not interchangeable: the **sync token** is transport auth (a Bearer token the Worker checks), the **passphrase** is what encrypts your data. Never reuse one as the other.

## Setup

**Settings → Cloudflare Sync** walks through three steps.

1. **Where is your sync Worker?** *Deploy one for me*, or *I already have one* for a second device or a Worker you deployed yourself.
2. **Deploy the Worker.** Enter your Account ID — in the Cloudflare dashboard press ++ctrl+k++ and search *Account ID* — and an API token. The *Create a token* link opens Cloudflare's token page with Workers Scripts Edit, Workers R2 Storage Edit and Account Settings Read preselected. Voltius creates the R2 bucket if it is missing, uploads the Worker, and sets a freshly generated sync token. With an existing Worker, enter its URL and sync token instead.
3. **Passphrase.** A new vault asks for a passphrase twice and creates it; an existing one asks for its passphrase and links this device.

Nothing is saved until step 3 succeeds, and the Cloudflare API token is never stored. Afterwards the settings page shows the Worker URL and copies the sync token for your other devices.

On the second device, install the plugin, choose *I already have one*, and paste the Worker URL, the sync token and the same passphrase.

## Trade-offs

| Pros | Cons |
| --- | --- |
| Storage you own and can inspect | Needs a Cloudflare account |
| Generous free tier | You manage the Worker and token rotation |
| End-to-end encrypted | Polling-based (~30s lag) |
| No GitHub account or PAT | More moving parts than Gist sync |

## Cloudflare sync or Gist sync?

Both are free, both are end-to-end encrypted, and both can run at the same time. Pick **Gist sync** if you already have GitHub and want the shortest setup. Pick **Cloudflare sync** when you want the storage to be yours — a bucket you can list, back up and delete — or when you would rather not hand a PAT to a sync client.

!!! tip "Multiple sync providers"
    Cloudflare sync runs alongside Cloud sync, Gist sync and any other sync provider plugin — Voltius shows each one separately in the sync menu and title bar. See [Building a sync provider](../plugins/sync-providers.md).
