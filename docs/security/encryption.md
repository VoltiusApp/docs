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
| Local network channel | **Noise_NN_25519_ChaChaPoly_BLAKE2s** | Fresh ephemeral keys per connection |
| Local network proof | **HMAC-SHA256** over the Noise handshake hash | Keyed by HKDF-SHA256 of the vault key, or of the pairing group secret |
| Device identity (local network) | **Ed25519** | One key per device, kept in the OS keychain; signs the handshake hash |
| Pairing code | **HKDF-SHA256** of the handshake hash and both sides' nonces | 6 digits, compared on both screens |

All implementations are pure-Rust crates: [`argon2`](https://docs.rs/argon2), [`hkdf`](https://docs.rs/hkdf), [`chacha20poly1305`](https://docs.rs/chacha20poly1305), [`x25519-dalek`](https://docs.rs/x25519-dalek), [`ed25519-dalek`](https://docs.rs/ed25519-dalek), [`hmac`](https://docs.rs/hmac), [`snow`](https://docs.rs/snow) (Noise). No platform-specific crypto.

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
    ├── (Gist sync)
    │   sync passphrase (or PAT) + manifest_salt
    │       └── Argon2id → HKDF("enc") ──► gist_enc_key
    │
    └── (Local network sync)
        vault key, or a random 32-byte group secret for paired devices
            └── HKDF("voltius-lan-sync-auth-v1") ──► proof key → HMAC over the Noise handshake hash

device key (random Ed25519, one per device, in the OS keychain) → signs the Noise handshake hash
```

Paired devices without an account share a group: a random vault key and a numbered group secret, handed over inside the Noise channel once both screens confirm the code. **Forget** on a paired device adds a new group secret and drops the forgotten device from the member list.

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
