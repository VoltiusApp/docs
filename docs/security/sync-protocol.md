---
icon: lucide/git-merge
---

# Sync protocol

Voltius follows a **Zero-Knowledge** protocol for every sync path. All data leaving your device is strictly ciphertext — the auth server, the SSE relay, and GitHub all have zero knowledge of your vault contents.

## Architecture

```mermaid
flowchart TD
    classDef cleartext fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#000;
    classDef secure fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#000;
    classDef local fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000;
    classDef remote fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000;
    classDef wasm fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#000;
    classDef note fill:#f9f9f9,stroke:#666,stroke-width:1px,stroke-dasharray: 5 5,color:#333;

    subgraph RegLayer ["0. Account Creation (one-time)"]
        direction LR

        subgraph PortalReg ["Web Portal — app.voltius.app"]
            PortalCreds["Email + Password"]:::cleartext
            WasmKDF["voltius-crypto-wasm\n(Argon2id + HKDF-SHA256\nsame crate · WASM target)"]:::wasm
            AuthKeyPortal(("auth_key")):::secure
            PortalCreds -->|"password + generated account_id"| WasmKDF
            WasmKDF -->|"enc_key discarded\n(no vault in portal)"| WasmKDF
            WasmKDF --> AuthKeyPortal
        end

        subgraph DesktopReg ["Desktop Client (Tauri)"]
            DesktopCreds["Email + Password"]:::cleartext
            NativeKDF["voltius-crypto · native Rust\n(Argon2id + HKDF-SHA256)"]:::secure
            AuthKeyDesktop(("auth_key")):::secure
            DesktopCreds -->|"password + generated account_id"| NativeKDF
            NativeKDF -->|"enc_key → vault unlock\n(proceeds to step 1)"| NativeKDF
            NativeKDF --> AuthKeyDesktop
        end

        RegServer[("Auth Server")]:::remote
        AuthKeyPortal -->|"email + auth_key + account_id"| RegServer
        AuthKeyDesktop -->|"email + auth_key + account_id\n+ public_key + machine_fingerprint"| RegServer
        RegServer -->|"JWT + account_id"| PortalCreds
        RegServer -->|"JWT + account_id"| DesktopCreds
    end

    subgraph AuthLayer ["1. Vault Unlock (Tauri Desktop — voltius-crypto · native Rust)"]
        direction TB
        subgraph Methods ["Vault Unlock Methods"]
            direction LR
            OS["OS Keychain"]:::local
            MP["Master Password"]:::local
            Cloud["Cloud Account\n(Email & Password)"]:::remote
        end

        KDF["Argon2id + HKDF-SHA256\n(32 MB mem · 2 iters)"]:::secure
        EncKey(("enc_key\n(AES-256-GCM key)")):::secure
        AuthKey(("auth_key\n→ server login")):::secure

        Cloud -->|"password + account_id"| KDF
        MP -->|"password + account_id"| KDF
        OS -->|"retrieves enc_key directly\n(stored after prior login)"| EncKey
        KDF --> EncKey
        KDF --> AuthKey
        AuthKey -->|"POST /v1/auth/login"| AuthServer[("Auth Server")]:::remote
        AuthServer -->|"JWT"| Cloud
    end

    RegLayer -.->|"account created — use same\ncredentials in desktop Cloud Account"| Cloud

    subgraph VaultLayer ["2. Local Vault (Rust · aes-gcm crate)"]
        AesGcm{"AES-256-GCM\n(Rust, via Tauri IPC)"}:::secure
        LocalStore[("secrets.enc\n(disk)")]:::local
        AesGcm <==>|"encrypt / decrypt"| LocalStore
    end

    EncKey -->|"enc_key passed over Tauri IPC"| AesGcm

    subgraph SyncLayer ["3. Zero-Knowledge Remote Sync"]
        direction LR

        subgraph GistSync ["Gist Sync (free · polling)"]
            direction TB
            GistKDF["derive_gist_key (Tauri cmd)\nArgon2id + HKDF-SHA256\npassphrase/PAT + manifest salt"]:::secure
            GistAes{"AES-256-GCM\n(Rust)"}:::secure
            Gist[("GitHub Gists\n(Bring-Your-Own)")]:::remote
            GistKDF -->|"gist_enc_key"| GistAes
            GistAes <==>|"Encrypted app-state blobs"| Gist
        end

        subgraph CloudSync ["Cloud Sync (Pro/Teams · SSE)"]
            direction TB
            SseAes{"AES-256-GCM\n(Rust · encrypt_payload)"}:::secure
            SSE[("Voltius SSE Server")]:::remote
            SseAes <==>|"Encrypted CRDT payloads"| SSE
        end
    end

    EncKey -->|"enc_key"| SseAes
```

## Layers explained

### 0. Account creation

A one-time step. Both the web portal and desktop client derive an `auth_key` from your email + password using **Argon2id + HKDF-SHA256**. The portal discards the `enc_key` (it has no vault); the desktop client keeps it for vault unlock.

### 1. Vault unlock

The desktop client unlocks your local vault via one of three methods:

- **OS Keychain** — retrieves `enc_key` directly from your system's secure storage.
- **Master Password** — re-derives `enc_key` via Argon2id (32 MB mem, 2 iters) + HKDF-SHA256.
- **Cloud Account** — same derivation, plus posts `auth_key` to the auth server to receive a JWT.

### 2. Local vault

Secrets are stored on disk in `secrets.enc`, encrypted with AES-256-GCM via the `aes-gcm` Rust crate. The `enc_key` never leaves the Tauri Rust process.

### 3. Remote sync

Two zero-knowledge transports:

- **Gist Sync** (free) — encrypted per-device app-state blobs polled to/from your private GitHub Gist using a separately-derived `gist_enc_key`; entity records are merged locally on import.
- **Cloud Sync** (Pro/Teams) — encrypted CRDT payloads over SSE to the Voltius relay server.

!!! note "What the server never sees"
    Your password, your `enc_key`, your decrypted vault, or any plaintext connection metadata. The server only sees an opaque `auth_key` for login and ciphertext for sync.
