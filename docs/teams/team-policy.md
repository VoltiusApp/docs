---
icon: lucide/shield-check
---

# Team policy

!!! info "Business"
    Team policy needs the team's Business plan. A self-hosted server counts as Business.

A team admin imports one `policy.json`-format document, and every member's Voltius applies it while that team's account is active. It uses the same keys and format as the [machine policy](../reference/machine-policy.md).

## Setting it up

Open **Members → Security → Device policy**, click **Import** and pick a `policy.json`-format file. On mobile, open the vault's settings → **Security policy**.

```json
{
  "version": 1,
  "policy": {
    "appSettings.locale": "en",
    "appSettings.detachedTtlHours": { "$range": { "max": 24 } },
    "security.lockTimeoutMinutes": { "$range": { "max": 15 } },
    "security.lockAction": "vault"
  }
}
```

- A fixed value locks the setting.
- `{"$range": {"min", "max", "allowed"}}` limits it. Members can still choose, but only inside the range. Each field is optional, but at least one is required.
- Keys and value formats are listed in the [machine policy reference](../reference/machine-policy.md#keys).

Before saving, Voltius shows a preview. **Errors** block saving. **Warnings** don't. Fix the file and import it again.

**Export** saves the current team policy as `policy.json`. **Clear** removes it, and also removes the app-lock limits shown above it in the same panel, because those are part of the same document.

You need the permission to manage the vault (the same one that lets you rename it). If two admins save at the same time, the second save is refused and the card reloads with a message. Reapply your change on top of theirs.

## App lock

The app-lock settings in the same panel are two keys in this document:

| Key | Value |
|---|---|
| `security.lockTimeoutMinutes` | A maximum, written as `{"$range": {"max": N}}`. `N` is 0 (immediately), 5, 15, 30, 60 or 240. |
| `security.lockAction` | `"vault"` (lock the vault) or `"screen"` (lock the screen). |

Older Voltius versions apply only these app-lock settings, and only a timeout written as a maximum. They ignore every other key.

## What members see

Locked settings show **Managed by** followed by the team name. Range-limited settings stay editable, with options outside the range greyed out.

The policy applies only while that team's account is the active account. It stops when a member switches to a personal account or signs out, and returns when they switch back. On a machine [enrolled with the team's token](enrollment-tokens.md#team-policy-on-enrolled-machines), it applies to every account instead. It keeps applying offline, from the last policy the app received. It applies to everyone in the team, owners and admins included.

## Precedence

A team policy can only tighten a [machine policy](../reference/machine-policy.md), never loosen it.

- If the machine policy locks a setting, a team can't change it.
- If both set a range, the allowed range is the overlap.
- With several teams, the team the member joined first wins a conflict on a fixed value. Ranges from all teams overlap.

## Not allowed in a team policy

These keys are machine-only. Voltius reports them as errors when you import:

- `server.url`, `server.allowOther` and `server.previousUrls`
- `enrollment.token`
- `plugins.install`

A team policy has no `defaults` section.

## If the plan drops below Business

The stored policy stays and keeps applying. Admins can still export or clear it, but can't add or loosen rules until the team is back on Business.
