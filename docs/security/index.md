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
| Does Voltius listen on my network? | Yes, once you sign in or pair a device: [local network sync](../sync/local-network.md) announces a random name over mDNS and accepts connections on TCP 47391. A device with no account that was never paired listens only while **Pair a device** is open. |
| Can someone on the same Wi-Fi get my data? | No. They can see that a Voltius is there and open a connection, but nothing is sent until they prove they hold your vault key inside an encrypted channel. Your files are reachable only from your own devices, after you turn on **File access** and approve them. See [Sync protocol](sync-protocol.md#4-local-network-sync). |
| What if someone learns my master password? | With [two-factor authentication](../sync/two-factor.md) on, they still can't sign in or download your data without your second factor: a code from your authenticator, or a passkey. |

## Reporting issues

Email **[contact@voltius.app](mailto:contact@voltius.app)** with details. Please don't open a public issue for vulnerabilities.
