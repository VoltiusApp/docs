---
icon: lucide/lock-keyhole
---

# Encryption

## Primitives

| Use | Algorithm | Parameters |
| --- | --- | --- |
| Key derivation | **Argon2id** | 128 MB memory, 3 iterations, 4 parallelism |
| Subkey separation | **HKDF-SHA256** | Distinct info strings per derived key |
| Vault encryption | **XChaCha20-Poly1305** | 192-bit random nonce, fresh on every write of the vault file |
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
    │       └── HKDF("enc")  ──► enc_key    → local accounts: XChaCha20-Poly1305 on the local vault
    │                                       → cloud accounts: KEK, wraps { DEK, X25519 private }
    │                                                       DEK → local vault + sync blobs
    │
    └── (Gist sync)
        sync passphrase (or PAT) + manifest_salt
            └── Argon2id → HKDF("enc") ──► gist_enc_key
```

## What's encrypted vs. metadata

| Field | Encrypted? |
| --- | --- |
| Passwords | ✓ |
| Private keys | ✓ |
| Snippet contents | metadata (plain JSON on disk) |
| Hostnames, ports, usernames | metadata (not encrypted in the local file) |
| Tags, folders | metadata |
| Notes | metadata (plain JSON on disk) |

For sync, everything in the payload is encrypted, metadata included; only a small header (format version, account id, device id, timestamp) is in the clear. The split above is on disk: secrets live in the encrypted `secrets.enc`, everything else in plain JSON files in the config directory.

## Vault file format

```text
secrets.enc
├── nonce (24 B, random per write)
└── XChaCha20-Poly1305( JSON { secrets, clocks } ) + tag (16 B)
```

The whole file is one authenticated message: any corruption makes it unreadable rather than partly readable. Writes go through a staged file and an atomic rename, and an unreadable vault can be set aside as a backup instead of being deleted.

## Crate

The implementation is open and shared between Tauri (native) and web portal (WASM) via [`voltius-crypto`](https://github.com/VoltiusApp/voltius/tree/main/crates/voltius-crypto). The crate holds key derivation and user-key wrapping ([`lib.rs`](https://github.com/VoltiusApp/voltius/blob/main/crates/voltius-crypto/src/lib.rs)); vault-file, sync-blob and team-key wrapping code lives in the Tauri backend (`src-tauri/src/storage/secrets.rs`, `src-tauri/src/commands/sync.rs`, `src-tauri/src/commands/team_crypto.rs`).
