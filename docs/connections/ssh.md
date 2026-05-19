---
icon: lucide/terminal
---

# SSH

> Screenshot placeholder — connection form with SSH fields filled.

Voltius speaks SSH via [russh](https://github.com/Eugeny/russh) — pure-Rust, no OpenSSH binary required.

## Required

| Field | Default |
| --- | --- |
| **Host** | hostname or IP |
| **Port** | `22` |
| **Username** | `root` |
| **Auth** | Password or Key |

## Optional

- **Identity** — share an SSH key across many hosts. See [Identities](../keychain/identities.md).
- **Folder / Tags** — organize. See [Folders & tags](../organization/folders-tags.md).
- **Jump hosts** — chain through bastions. See [Jump hosts](jump-hosts.md).
- **Env vars** — exported into the remote shell.
- **Agent forwarding** — toggle to forward your SSH agent.
- **Disable ping** — skip pre-connect TCP check for hosts that drop ICMP.
- **Pre/post command** — run locally before/after the session.
- **Terminal encoding** — override if remote isn't UTF-8.
- **Distro / icon** — cosmetic; auto-detect after first connect.

## What gets stored

| Where | What |
| --- | --- |
| Vault (encrypted) | Password, private key |
| Vault metadata | Everything else |
| Outside vault | Nothing |

See [Security](../security/index.md).
