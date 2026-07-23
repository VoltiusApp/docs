---
icon: lucide/network
---

# Architecture

```mermaid
flowchart TD
    classDef local fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000;
    classDef secure fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000;
    classDef remote fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000;
    classDef wasm fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#000;
    classDef plugin fill:#ede7f6,stroke:#4527a0,stroke-width:2px,color:#000;

    subgraph Device ["Your machine — full trust"]
        direction TB
        Client["Desktop client\n(Tauri · Rust + React)\nDecryption keys + plaintext\nvault in memory only"]:::secure
        Vault[("Local vault file\n$APP_DATA/voltius/secrets.enc\nXChaCha20-Poly1305 ciphertext")]:::local
        subgraph Sandbox ["Plugin sandbox (renderer)"]
            Plugins["Bundled ESM plugins\nHost access only via the\npermission-gated PluginAPI"]:::plugin
        end
        Client <==>|"enc_key over Tauri IPC\nencrypt / decrypt"| Vault
        Client -->|"PluginAPI only — no secrets,\nno SSH, no direct Tauri cmds"| Plugins
    end

    subgraph Cloud ["Remote services — zero knowledge"]
        direction TB
        Auth[("Auth server\nauth.voltius.app\nauth_key hashes · JWTs")]:::remote
        Relay[("Sync relay\nsync.voltius.app\nEncrypted CRDT payloads")]:::remote
        Portal["Web portal\napp.voltius.app (Next.js)\nvoltius-crypto → WASM"]:::wasm
        Gist[("GitHub Gist\ngist.github.com\nEncrypted app-state blobs")]:::remote
    end

    Client -->|"email + auth_key + JWT\n(never password or enc_key)"| Auth
    Client <==>|"ciphertext only"| Relay
    Client <==>|"encrypted blobs + your PAT"| Gist
    Portal -.->|"same crate, same account —\nWASM, no local vault"| Auth
```

Voltius runs as three independent components plus the optional sync layer.

## Components

| Component | Where it runs | What it holds |
| --- | --- | --- |
| **Desktop client** | Your machine (Tauri / Rust + React) | Decryption keys, plaintext vault in memory only |
| **Local vault file** | `$APP_DATA/voltius/secrets.enc` | XChaCha20-Poly1305 ciphertext, on disk |
| **Auth server** | `auth.voltius.app` (or your self-host) | `auth_key` hashes, account metadata, JWTs |
| **Sync relay** | `sync.voltius.app` (or your self-host) | Encrypted CRDT payloads |
| **Web portal** | `app.voltius.app` (Next.js) | Same `voltius-crypto` crate, compiled to WASM |
| **Gist host** (Gist sync only) | `gist.github.com` (your account) | Encrypted per-device app-state blobs |

## Trust boundaries

- **Inside the Tauri process** — full trust. The Rust backend never exposes raw secrets to the JS frontend except via Tauri IPC, and even then only when explicitly needed (e.g. to display a password in the UI).
- **The auth server** — sees `auth_key` (an Argon2id derivation), email, machine fingerprints, JWTs. Never sees the password or `enc_key`.
- **The sync relay** — sees encrypted blobs. Cannot decrypt them.
- **GitHub Gist** — same: encrypted blobs only, plus the PAT you provided.

## Key separation

Three independent keys are derived from the same password:

| Key | Use |
| --- | --- |
| `auth_key` | Sent to the auth server for login. Server stores a hash of this — not the password. |
| `enc_key` | Encrypts the local vault. Never leaves the device. |
| `gist_enc_key` | Encrypts Gist-sync blobs. Derived from a passphrase + manifest salt; distinct from `enc_key`. |

```mermaid
flowchart LR
    classDef cleartext fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#000;
    classDef secure fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000;
    classDef remote fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000;
    classDef local fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000;

    Pass["Password"]:::cleartext
    KDF["Argon2id + HKDF-SHA256"]:::secure

    Pass --> KDF
    KDF -->|"login only"| AuthKey(("auth_key")):::secure
    KDF -->|"vault only"| EncKey(("enc_key")):::secure
    KDF -->|"+ manifest salt"| GistKey(("gist_enc_key")):::secure

    AuthKey -->|"hash stored"| Server[("Auth server")]:::remote
    EncKey -->|"never leaves device"| Disk[("secrets.enc")]:::local
    GistKey -->|"never leaves device"| Blobs[("Gist blobs")]:::local
```

Compromise of one does not yield the others.

## Plugin sandbox

Plugins run as bundled ESM modules in the renderer process. They access the host only through `PluginAPI`, which is permission-gated. Plugins **cannot**:

- Read terminal output or inject keystrokes.
- Read another plugin's vault keys.
- Call Tauri commands directly.
- Open SSH tunnels.

See the [marketplace docs](https://github.com/VoltiusApp/marketplace#what-plugins-cannot-do) for the full list.
