---
icon: lucide/globe
---

# Web portal

**[app.voltius.app](https://app.voltius.app)** — for account-level things you don't need the desktop client for.

## What it does

- **Create accounts** — sign up, verify email.
- **Sign in / out** — sign in to this browser; change your handle and password.
- **Plans** — upgrade or start a trial, change Teams/Business seats, cancel or resume a Pro subscription; **Manage billing →** opens the billing portal for invoices and payment details.
- **Team invitations** — accept an invitation to join a team.

## What it does **not** do

It does **not** display your vault. The portal can't decrypt anything — your password derives `enc_key` only client-side, in WASM, and the portal discards it immediately.

## Security

The portal uses the **same `voltius-crypto` Rust crate** as the desktop, compiled to WebAssembly. Argon2id + HKDF-SHA256 run in your browser before any network request. The auth server only ever receives an opaque `auth_key`.

See [Security → Sync protocol](../security/sync-protocol.md) for the full diagram.
