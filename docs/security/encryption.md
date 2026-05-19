---
icon: lucide/lock-keyhole
---

# Encryption

## Primitives

| Use | Algorithm | Parameters |
| --- | --- | --- |
| Key derivation | **Argon2id** | 32 MB memory, 2 iterations, 1 parallelism |
| Subkey separation | **HKDF-SHA256** | Distinct info strings per derived key |
| Vault encryption | **AES-256-GCM** | 96-bit random nonce per record |
| Public-key wrap (team vaults) | **X25519 + AES-256-GCM** | Vault key wrapped per member |
| Sync payload | **AES-256-GCM** | Same key, distinct nonce per payload |

All implementations are pure-Rust crates: [`argon2`](https://docs.rs/argon2), [`hkdf`](https://docs.rs/hkdf), [`aes-gcm`](https://docs.rs/aes-gcm), [`x25519-dalek`](https://docs.rs/x25519-dalek). No platform-specific crypto.

## Key tree

```text
password + account_id
    │
    ├── Argon2id(salt = account_id) ──► master
    │       │
    │       ├── HKDF("auth")  ──► auth_key   → server login
    │       ├── HKDF("vault") ──► enc_key    → AES-256-GCM, local vault
    │       └── HKDF("sync")  ──► sync_key   → AES-256-GCM, SSE payloads
    │
    └── (Gist sync)
        passphrase + manifest_salt
            └── Argon2id → HKDF("gist") ──► gist_enc_key
```

## What's encrypted vs. metadata

| Field | Encrypted? |
| --- | --- |
| Passwords | ✓ |
| Private keys | ✓ |
| Snippet contents | ✓ |
| Hostnames, ports, usernames | metadata (not encrypted in the local file) |
| Tags, folders | metadata |
| Notes | ✓ |

For sync, **everything** in the payload is encrypted — including metadata. The split above is only on the local vault file, optimized for fast list rendering.

## Vault file format

```text
voltius.vault.v1
├── header (cleartext)
│   ├── version
│   ├── kdf params (Argon2id memory / iters / salt)
│   ├── HKDF info strings
│   └── metadata index
└── records
    └── per-record { nonce (12B), ciphertext, tag (16B) }
```

Each record encrypts independently. Corruption of one record doesn't take down the file.

## Crate

The implementation is open and shared between Tauri (native) and web portal (WASM) via [`voltius-crypto`](https://github.com/VoltiusApp/voltius/tree/main/crates/voltius-crypto).
