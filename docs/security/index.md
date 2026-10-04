---
icon: lucide/shield
---

# Security

Voltius is built on a **local-first, zero-knowledge** model.

- **[Architecture](architecture.md)** — components and trust boundaries
- **[Encryption](encryption.md)** — the cryptographic primitives
- **[Sync protocol](sync-protocol.md)** — full diagram of account creation, vault unlock, and remote sync

## TL;DR

| Question | Answer |
| --- | --- |
| Where do my secrets live? | Encrypted on your disk. |
| Can Voltius read them? | No — the server only sees ciphertext. |
| Can GitHub read them (Gist sync)? | No, if you set a Sync Passphrase. Without one, the key is derived from your PAT, which GitHub receives on every request. |
| Can my coworkers see other coworkers' team vaults? | Only if they're added to that vault. |
| What if I lose my master password? | The vault is gone. Voltius has no escrow. |

## Reporting issues

Email **[contact@voltius.app](mailto:contact@voltius.app)** with details. Please don't open a public issue for vulnerabilities.
