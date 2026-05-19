---
icon: lucide/shield
---

# Roles

> Screenshot placeholder — role assignment matrix.

## Built-in roles

| Role | Read | Write | Admin |
| --- | --- | --- | --- |
| **Viewer** | ✓ | | |
| **Editor** | ✓ | ✓ | |
| **Admin** | ✓ | ✓ | ✓ |

Scope:

- **Read** — list and connect.
- **Write** — create, edit, delete entries.
- **Admin** — manage members + roles on this vault.

## Custom roles (Business)

> Screenshot placeholder — custom role editor with granular permissions.

Business plans add a role builder. Mix and match per-resource, per-action permissions:

- Connections — read / write / connect / SFTP
- Identities — read / write
- Keys — read / write / export
- Snippets — read / write / execute
- Audit logs — read

Assign custom roles per vault, per member.

!!! tip "Org-wide owner"
    A separate **Owner** role at the team level governs billing and member management — independent of per-vault roles.
