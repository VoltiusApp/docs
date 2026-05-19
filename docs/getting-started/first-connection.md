---
icon: lucide/plug
---

# First connection

> Screenshot placeholder — empty Hosts page with **Add host** highlighted.

## 1. Add a host

On the **Hosts** tab, click **Add host**. Fill in:

| Field | Default |
| --- | --- |
| **Host** | hostname or IP |
| **Port** | `22` |
| **Username** | `root` |
| **Auth type** | Password or Key |

## 2. Auth

=== "Password"
    Type it in. Stored locally in your AES-256-GCM vault — never sent to a server.

=== "SSH key"
    Pick an **Identity** (key + username bundle) from the dropdown, or click **+ New**. See [SSH keys](../keychain/ssh-keys.md).

## 3. Connect

Click **Save**, then click the host card. First-time hosts prompt for fingerprint approval — see [Known hosts](../keychain/known-hosts.md).

> Screenshot placeholder — first terminal session.

## Next

- [Folders & tags](../organization/folders-tags.md) — before the list gets long.
- [Identities](../keychain/identities.md) — reuse one key across hosts.
- ++ctrl+k++ / ++cmd+k++ — connect from the [command palette](../terminal/command-palette.md).
