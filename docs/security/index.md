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
| Can GitHub read them (Gist sync)? | No — separately-derived key. |
| Can my coworkers see other coworkers' team vaults? | Only if they're added to that vault. |
| What if I lose my master password? | The vault is gone. Voltius has no escrow. |

## Reporting issues

Email **[security@voltius.app](mailto:security@voltius.app)** with details. PGP key on the website. We respond within 72 hours.
