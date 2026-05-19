---
icon: lucide/shield-check
---

# Known hosts

> Screenshot placeholder — Known Hosts list with fingerprints.

The list of remote host fingerprints Voltius has pinned. Equivalent to OpenSSH's `~/.ssh/known_hosts`.

## How entries arrive

The first time you connect to a host, Voltius shows the fingerprint and asks you to accept. The acceptance is saved here.

## What to do here

| Action | Why |
| --- | --- |
| **Edit** | Replace a fingerprint after a legitimate server key change (rebuild, key rotation) |
| **Delete** | Force re-prompt on next connect |
| **Search** | Find by host or fingerprint |

## Mismatch warning

If a connect attempt produces a fingerprint that doesn't match the pinned one, Voltius blocks the connection and shows a comparison. Treat this as **suspicious** — possible MITM. Resolve out-of-band before accepting.

!!! tip
    Known-hosts entries sync with the vault that holds the connection. Team-vault hosts get a shared known-hosts list.
