---
icon: lucide/building-2
---

# Machine policy

A machine policy lets IT pre-configure Voltius on a computer before anyone signs in. You can use it to point Voltius at your company server, lock settings, and install or block plugins. A locked setting shows **Managed by your organization** in Settings and can't be changed there, or by a sync from another device.

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
| `server.allowOther` | bool | `false` blocks adding accounts on other servers |
| `sshConfig.import` | bool | The `~/.ssh/config` import switch |
| `plugins.install` | list of plugin ids | Locked: installed and can't be removed. Default: installed once, users may remove it |
| `plugins.enabled` / `plugins.disabled` | list of plugin ids | Forced on / off (locked), or turned on / off once (default) |
| `plugins.allowInstall` | bool | `false`: users can only install plugins listed in `plugins.install`. Updates of installed plugins still work |
| `sync.domains.<domain>`, `sync.settings.<id>`, `sync.types.<type>` | bool | Sync switches, e.g. `sync.types.key: false` never syncs SSH keys |
| `appSettings.toggles.<id>` | bool | Every on/off switch in Settings |
| `appSettings.locale`, `appSettings.proxy`, `appSettings.terminal.preferredShell`, `appSettings.terminal.cursorStyle`, `appSettings.terminal.keywordRules`, `appSettings.sftp.autoRefreshIntervalMs`, `appSettings.keepalivePreset`, `appSettings.detachedTtlHours`, `appSettings.plugins.overrides`, `themes.location` | various | Accepted as **defaults**. Locking them is coming in a later version: `voltius-cli` warns if you lock one |

`voltius-cli policy check` rejects unknown keys and wrong types. Voltius itself ignores unknown keys, so a newer policy file still works on an older Voltius.

Plugin keys take the **plugin id** (`plugin-docker`), not the folder name.

In **Settings → Plugins**, a plugin installed through `plugins.install` carries an **Organization** badge. When `plugins.allowInstall` is `false`, the Browse tab says installing is turned off and only the listed plugins can be installed.

## When changes apply

- `server.url` and `server.allowOther`: at the next Voltius launch. **Restart Voltius after changing them.**
- Everything else, plugin locks included: when the Voltius window regains focus.

## Writing the policy

```sh
sudo voltius-cli policy set server.url https://voltius.acme.com
sudo voltius-cli policy set sshConfig.import false
sudo voltius-cli policy set --defaults appSettings.locale fr
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
