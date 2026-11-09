---
icon: lucide/building-2
---

# Machine policy

A machine policy lets IT pre-configure Voltius on a computer before anyone signs in. You can use it to point Voltius at your company server, lock settings, and install or block plugins. A locked setting shows **Managed by your organization** in Settings and can't be changed there, or by a sync from another device.

Teams on the Business plan can apply the same format to their members with a [team policy](../teams/team-policy.md), which can only tighten what the machine policy sets.

Machine policy is free. It stops accidental changes and keeps a fleet consistent. It is not tamper-proof against someone who is an administrator of their own computer.

## Where the file lives

| Platform | File | Who can write it |
|---|---|---|
| Linux | `/etc/voltius/policy.json` | root |
| macOS | `/Library/Application Support/Voltius/policy.json` | root |
| Windows | `%ProgramData%\Voltius\policy.json` | Administrators |

`voltius-cli policy path` prints it. A broken or partly invalid file never stops Voltius from starting. The valid keys still apply and a notice explains the problem.

On Windows, Voltius ignores the file if a standard user could have written it. Always write it with `voltius-cli` (below), not by copying a file into the folder: `voltius-cli` makes the folder writable by Administrators only. Policy files copied in by an older Voltius or by hand are ignored until you import them again with `voltius-cli policy import --replace`.

## File format

```json
{
  "version": 1,
  "policy":   { "server.url": "https://voltius.acme.com", "sshConfig.import": false },
  "defaults": { "appSettings.locale": "fr", "appSettings.toggles.cursor-blink": false }
}
```

- `policy` keys are **locked**.
- `defaults` keys are **starting values**. They apply once for each user who hasn't set that key on this computer. After that the user's choice stands, and a default never overwrites a choice synced from the user's other devices.

When several layers set a key, the first of these wins: machine policy, then the user's own value, then the machine default, then Voltius's built-in default. `voltius-cli policy show` prints each key's effective value and which of these it came from.

## Keys

| Key | Type | Notes |
|---|---|---|
| `server.url` | string | Sync server. Locked: users can only sign in to this server |
| `server.allowOther` | bool | `false` blocks accounts on any other server. Scheme, host, port and path must match `server.url`, so `https://api.acme.com` does not admit `http://acme.com` or `https://www.acme.com` |
| `server.previousUrls` | list of URLs | Addresses `server.url` used to have. Locked only. See [Moving the server](#moving-the-server) |
| `sshConfig.import` | bool | The `~/.ssh/config` import switch |
| `plugins.install` | list of plugin ids | Locked: installed and can't be removed. Default: installed once, users may remove it |
| `plugins.enabled` / `plugins.disabled` | list of plugin ids | Forced on / off (locked), or turned on / off once (default) |
| `plugins.allowInstall` | bool | `false`: users can only install plugins listed in `plugins.install`. Updates of installed plugins still work |
| `sync.domains.<domain>`, `sync.settings.<id>`, `sync.types.<type>` | bool | Sync switches, e.g. `sync.types.key: false` never syncs SSH keys |
| `appSettings.toggles.<id>` | bool | Every on/off switch in Settings |
| `appSettings.locale` | string | One of the supported language codes: `en`, `fr`, `ru`, `zh`, `tr`, `cs`, `pt`, `pt-BR`, `pt-PT`. Range: `allowed` |
| `appSettings.terminal.cursorStyle` | string | `bar`, `block` or `underline`. Range: `allowed` |
| `appSettings.keepalivePreset` | string | `fast`, `balanced`, `tolerant` or `off`. Also applies to hosts that set their own preset. Range: `allowed` |
| `appSettings.detachedTtlHours` | number | `1`, `6`, `12`, `24`, `72` or `168`. Range: `min`, `max`, `allowed`. Locking or bounding it also turns detached-session expiry on |
| `appSettings.sftp.autoRefreshIntervalMs` | number | Milliseconds, at least 500. Range: `min`, `max` |
| `appSettings.terminal.preferredShell` | string | A shell path or name. Range: `allowed` (a list of shell paths or names) |
| `appSettings.proxy` | object | `mode` (`none`, `system`, `socks5`, `http`, `https`), plus `host` and `port` unless the mode is `none` or `system`. Optional `username`. Never a password |
| `appSettings.terminal.keywordRules` | list of rules | Admin rules added on top of the user's own. Locking forces keyword highlighting on |
| `themes.location` | object | `{"lat": 48.85, "lng": 2.35}`. Used for sunrise and sunset themes |
| `appSettings.plugins.overrides` | object | **Defaults only.** It can't be locked: use `plugins.enabled` and `plugins.disabled` |

Only the keys with a Range entry accept a [range](#ranges). `voltius-cli policy check` rejects unknown keys, wrong types, values outside a key's domain (a locale that doesn't exist, a TTL of 5) and `appSettings.plugins.overrides` under `policy`. Voltius itself ignores unknown keys, so a newer policy file still works on an older Voltius.

Plugin keys take the **plugin id** (`plugin-docker`), not the folder name.

In **Settings → Plugins**, a plugin installed through `plugins.install` carries an **Organization** badge. When `plugins.allowInstall` is `false`, the Browse tab says installing is turned off and only the listed plugins can be installed.

## Ranges

A range limits a setting instead of fixing it. The user can still choose, but only inside the range. Write it under `policy` as a `$range` object. Each of `min`, `max` and `allowed` is optional, but at least one is required, and each key accepts only the fields listed in the Keys table.

```json
{
  "version": 1,
  "policy": {
    "appSettings.detachedTtlHours": { "$range": { "max": 24 } },
    "appSettings.locale": { "$range": { "allowed": ["en", "fr"] } },
    "appSettings.sftp.autoRefreshIntervalMs": { "$range": { "min": 5000 } }
  }
}
```

- A range sets nothing by itself. If the user's value is inside it, that value stands.
- If the user's value is outside it, Voltius uses the first of these that fits: the machine default for that key, then Voltius's built-in default. If neither fits, it uses the nearest allowed value (for numbers, the nearest bound) or, for a list, the first entry of `allowed`.
- Voltius never overwrites the user's own value. When you remove the range, their choice applies again.
- A range on `keepalivePreset` also bounds the preset of every host that sets its own.
- Ranges only go under `policy`, not `defaults`. A range that leaves nothing allowed (`min` above `max`, or `allowed` with no valid value) is rejected by `voltius-cli`, and Voltius ignores it if it finds one in a file.

Settings with a range stay editable. Options outside the range are greyed out, and a line under the control says what the limit is, for example "Your organization allows up to 24".

## Locked settings in the app

A fixed lock shows **Managed by your organization** and the control is disabled. A sync from another device can't change it, and the user's own value comes back if you remove the lock. These settings have extra rules:

- **Proxy.** The locked fields are read-only. If the lock leaves `username` out, each user keeps their own username, and the password always comes from the user's own global proxy password. The policy file never carries one. A locked proxy also applies to every host, so a per-host proxy is ignored. Users set their username in Settings; `voltius-cli config set appSettings.proxy` is refused while the proxy is locked.
- **Keyword rules.** A lock adds to the user's list instead of replacing it. Your rules come first, as read-only rows at the top of the keyword editor, and the user keeps their own rules below. If both match the same text, your colour wins. Locking them forces keyword highlighting on.
- **Preferred shell.** Lock one shell, or give `allowed` a list. A shell matches by its path, or by its name ignoring case. In the shell menu of the Hosts page, shells outside the list are hidden. If the locked shell isn't installed on a computer, new local tabs use the system default shell. If none of the allowed shells is installed, only the system default is offered.
- **Detached session lifetime.** A lock or range on `detachedTtlHours` forces session expiry on, because the limit only works while expiry is on. Don't lock `appSettings.toggles.detached-session-ttl` to `false` at the same time: `voltius-cli policy check` reports the conflict and the TTL lock wins.
- **Theme location.** A locked `themes.location` also hides the "use my location" button.

## Moving the server

When the sync server gets a new address, lock the new one in `server.url` and list the old one in `server.previousUrls`:

```sh
sudo voltius-cli policy set server.url https://voltius.acme.com
sudo voltius-cli policy set server.previousUrls https://api.acme.com
```

At its next launch, Voltius moves every signed-in or saved account on an old address to the new one. Users stay signed in and don't see a prompt. This only works when both addresses reach the same server, with the same accounts. Accounts on any other server are left alone.

Without `server.previousUrls`, an account on the old address counts as another server. With `server.allowOther` set to `false`, its user has to sign in again.

## When changes apply

- `server.url`, `server.allowOther` and `server.previousUrls`: at the next Voltius launch. **Restart Voltius after changing them.**
- Everything else, plugin locks included: when the Voltius window regains focus.

## Writing the policy

```sh
sudo voltius-cli policy set server.url https://voltius.acme.com
sudo voltius-cli policy set sshConfig.import false
sudo voltius-cli policy set --defaults appSettings.locale fr
sudo voltius-cli policy set appSettings.detachedTtlHours --max 24
sudo voltius-cli policy set appSettings.locale --allow en --allow fr
sudo voltius-cli plugins install plugin-docker --lock
sudo voltius-cli policy check
```

Or write a whole file and import it. `--replace` makes the machine file exactly this file:

```sh
sudo voltius-cli policy import --replace ./policy.json
```

## Ansible

Linux and macOS: template the file, then validate it.

```yaml
- name: Voltius machine policy
  ansible.builtin.template:
    src: voltius-policy.json.j2
    dest: /etc/voltius/policy.json
    mode: "0644"

- name: Validate it
  ansible.builtin.command: voltius-cli policy check
  changed_when: false

- name: Detached sessions live at most 24 hours
  ansible.builtin.command: voltius-cli policy set appSettings.detachedTtlHours --max 24
  changed_when: false

- name: Install the Docker plugin for everyone
  ansible.builtin.command: voltius-cli plugins install plugin-docker --lock
  register: docker_plugin
  changed_when: "'Unchanged' not in docker_plugin.stdout"
```

Windows: template to a temporary file, then import it with `voltius-cli`. Don't write `policy.json` directly, or Voltius will ignore it.

```yaml
- name: Voltius policy (staging copy)
  ansible.windows.win_template:
    src: voltius-policy.json.j2
    dest: C:\Windows\Temp\voltius-policy.json

- name: Import it as the machine policy
  ansible.windows.win_command: voltius-cli policy import --replace C:\Windows\Temp\voltius-policy.json
```

To change something for one user instead of the whole machine, run the per-user command as that user (`become_user`). See [Command line](cli.md#per-user-changes-and-when-they-apply).
