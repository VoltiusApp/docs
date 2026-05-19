---
icon: lucide/id-card
---

# Identities

> Screenshot placeholder — identity form with username + key selector.

An **identity** = a username + an SSH key. Bind many hosts to one identity, and a key rotation is one edit.

## Create one

**Keychain → Identities → +**, or **+ New** from the identity picker in a connection form.

| Field | Notes |
| --- | --- |
| **Name** | Display label (e.g. `ops-ed25519`) |
| **Username** | Usually `root`, `admin`, `ec2-user`, your handle… |
| **Key** | Pick from [SSH keys](ssh-keys.md) |

## Using one

In a connection: **Auth type → Key → Identity →** pick. Voltius fills in username from the identity. Override per-connection by typing in the Username field.

!!! tip
    Identities scope to a vault. A team vault's identity is shared with everyone who can decrypt that vault.
