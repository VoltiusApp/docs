---
icon: lucide/lock-keyhole
---

# Encryption

## Primitives

| Use | Algorithm | Parameters |
| --- | --- | --- |
| Key derivation | **Argon2id** | 128 MB memory, 3 iterations, 4 parallelism |
| Subkey separation | **HKDF-SHA256** | Distinct info strings per derived key |
| Vault encryption | **XChaCha20-Poly1305** | 192-bit random nonce per record |
| Public-key wrap (team vaults) | **X25519 + XChaCha20-Poly1305** | Vault key wrapped per member |
| Sync payload | **XChaCha20-Poly1305** | Same key, distinct nonce per payload |

All implementations are pure-Rust crates: [`argon2`](https://docs.rs/argon2), [`hkdf`](https://docs.rs/hkdf), [`chacha20poly1305`](https://docs.rs/chacha20poly1305), [`x25519-dalek`](https://docs.rs/x25519-dalek). No platform-specific crypto.

## Key tree

```text
password + account_id
    │
    ├── Argon2id(salt = account_id) ──► master
    │       │
    │       ├── HKDF("auth") ──► auth_key   → server login
    │       └── HKDF("enc")  ──► enc_key    → XChaCha20-Poly1305, local vault + SSE payloads
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
    └── per-record { nonce (24B), ciphertext, tag (16B) }
```

Each record encrypts independently. Corruption of one record doesn't take down the file.

## Crate

The implementation is open and shared between Tauri (native) and web portal (WASM) via [`voltius-crypto`](https://github.com/VoltiusApp/voltius/tree/main/crates/voltius-crypto). The core logic lives in [`crates/voltius-crypto/src/lib.rs`](https://github.com/VoltiusApp/voltius/blob/main/crates/voltius-crypto/src/lib.rs).
