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
| macOS | `/Library/Application Support/Voltius/policy.json`, or a [configuration profile](#macos-configuration-profile) | root |
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
| `enrollment.token` | string | An [enrolment token](../teams/enrollment-tokens.md). Locked only, never under `defaults`. Write it with `voltius-cli enroll`. Voltius asks people on the machine to sign in to the token's team |
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

The token file can be world-readable like the rest of the policy: a token identifies your server and team, but it doesn't decrypt anything, and the server decides who joins. See [Enrol a fleet](../teams/enrollment-tokens.md#enrol-a-fleet).

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

## Android (managed configurations)

On Android, your EMM or MDM sets the machine policy through Voltius's managed configuration (app restrictions). The keys and format are the same as in `policy.json`. There is no file and no `voltius-cli`.

Only the device owner or the work-profile owner, which is your EMM, can set these. Users and other apps can't.

| Restriction | Policy key | Notes |
|---|---|---|
| `enrollment_token` | `enrollment.token` | Signs the app in to your organization on first launch |
| `server_url` | `server.url` | Locked sync server |
| `server_allow_other` | `server.allowOther` | Choice: not set, `true` or `false` |
| `policy` | | A whole `policy.json` document, as text |

An empty value means not set. If a restriction and the `policy` document set the same key, the restriction wins and Voltius reports the conflict.

Paste a policy document into `policy`. This one locks a toggle and caps detached-session lifetime at 24 hours:

```json
{
  "version": 1,
  "policy": {
    "appSettings.toggles.cursor-blink": false,
    "appSettings.detachedTtlHours": { "$range": { "max": 24 } }
  }
}
```

### Feedback in the EMM console

Voltius reports the result to your EMM as app feedback. If the `policy` text isn't valid JSON or a value has the wrong type, it reports an error. Other problems, such as a conflict or an ignored key, are reported as info. When nothing is wrong, it reports one info entry, `policy` = `applied`.

### When changes apply

- Changes apply while Voltius is open, except `server.url` and `server.allowOther`.
- `server.*` changes apply at the next app launch. Android keeps Voltius running in the background, so ask users to force-stop Voltius or restart the device after you change the server.
- An enrollment token pushed after the user opened Voltius switches the first-launch screen to the company sign-in.

## iOS and iPadOS (Managed App Configuration)

On iPhone and iPad, your MDM sets the machine policy through a Managed App Configuration dictionary (Apple's `com.apple.configuration.managed`). It has the same four keys as [Android](#android-managed-configurations): `enrollment_token`, `server_url`, `server_allow_other` and `policy`. The table there lists what each key sets.

- `server_allow_other` is a boolean, or the string `"true"` or `"false"`.
- `policy` is the whole `policy.json` text, as a string.
- An empty string means not set.
- If a key and the `policy` document set the same setting, the key wins and Voltius reports the conflict.

This works on devices or apps managed by an MDM: Intune managed-device app configuration policies, Jamf Pro, Workspace ONE, Kandji, Mosyle, and others that support key/value app configuration. It does not work with Intune app protection without device enrolment (MAM-WE), which needs the Intune App SDK. Target the bundle id `app.voltius`.

```xml
<dict>
  <key>server_url</key>
  <string>https://voltius.example.com</string>
  <key>server_allow_other</key>
  <false/>
  <key>enrollment_token</key>
  <string>vte1.…</string>
  <key>policy</key>
  <string>{"version":1,"policy":{"appSettings.toggles.cursor-blink":false}}</string>
</dict>
```

There is no `voltius-cli` and no policy file on mobile.

### Feedback in the MDM console

Voltius writes `com.apple.feedback.managed`. MDMs that support managed app feedback can read it, for example Workspace ONE, and Jamf through ManagedApplicationFeedback. It has one entry per key:

```json
{ "severity": "error", "message": "…" }
```

`severity` is `error` or `info`. An unreadable `policy` text or a value of the wrong type is an error. Other problems, such as a conflict or an ignored key, are info. When everything applied, `policy` is `{ "severity": "info", "message": "applied" }`. This is the same content as Android's app feedback.

### When changes apply

- A new configuration applies when the MDM pushes it, or at the latest the next time Voltius comes to the foreground.
- `server.*` changes apply at the next app launch. Ask users to swipe Voltius away in the app switcher and open it again.

## macOS (configuration profile)

On a Mac, your MDM can set the machine policy with a configuration profile instead of, or on top of, `policy.json`. The profile's payload domain is `com.voltius.app`. macOS writes it to `/Library/Managed Preferences/com.voltius.app.plist`.

Assign the profile to devices, not users. A user-scoped profile is ignored. Voltius also ignores the file unless it and its folder are owned by root and not writable by group or others.

### Keys

The keys are the same as on [Android](#android-managed-configurations) and [iOS](#ios-and-ipados-managed-app-configuration): `enrollment_token`, `server_url`, `server_allow_other` and `policy`. The table in the Android section lists what each key sets.

- `server_allow_other` is a boolean, or the string `"true"` or `"false"`.
- `policy` is the whole `policy.json` text, as a string.
- Other keys in the plist are ignored.

The profile and `policy.json` both apply. For each key the profile wins. If they set the same key to different values, `voltius-cli policy check` prints a warning and still exits 0:

```text
policy.appSettings.toggles.cursor-blink: set by the configuration profile; the value in policy.json is ignored
```

`voltius-cli policy set` for a key the profile overrides warns that the configuration profile sets it and wins over `policy.json`.

### Example

This is the preference file for Jamf Pro or Intune. In Jamf Pro, go to **Configuration Profiles**, **Application & Custom Settings**, **Upload**, set the preference domain to `com.voltius.app` and upload the plist. In Intune, create a macOS **Templates** profile of type **Preference file**, set the domain to `com.voltius.app`, upload the plist and assign it to device groups.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>server_url</key>
  <string>https://voltius.example.com</string>
  <key>server_allow_other</key>
  <false/>
  <key>policy</key>
  <string>{"version":1,"policy":{"appSettings.toggles.cursor-blink":false}}</string>
</dict>
</plist>
```

For a generic `.mobileconfig`, wrap the same keys in a `com.apple.ManagedClient.preferences` payload. Put them under `PayloadContent`, then `com.voltius.app`, then `Forced`, then `mcx_preference_settings`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadIdentifier</key>
  <string>com.example.voltius</string>
  <key>PayloadUUID</key>
  <string>6F1D2C3A-5B7E-4A19-9C0D-2E8B4F6A1D35</string>
  <key>PayloadDisplayName</key>
  <string>Voltius</string>
  <key>PayloadScope</key>
  <string>System</string>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadType</key>
      <string>com.apple.ManagedClient.preferences</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PayloadIdentifier</key>
      <string>com.example.voltius.preferences</string>
      <key>PayloadUUID</key>
      <string>B2A4E6C8-1D3F-4B5A-8C7E-9F0A1B2C3D4E</string>
      <key>PayloadContent</key>
      <dict>
        <key>com.voltius.app</key>
        <dict>
          <key>Forced</key>
          <array>
            <dict>
              <key>mcx_preference_settings</key>
              <dict>
                <key>server_url</key>
                <string>https://voltius.example.com</string>
                <key>server_allow_other</key>
                <false/>
              </dict>
            </dict>
          </array>
        </dict>
      </dict>
    </dict>
  </array>
</dict>
</plist>
```

### Verify

On a managed Mac, run `voltius-cli policy check` to see the merged result and any warnings, and `voltius-cli config get server.url` to confirm the server.

### When changes apply

- Locks update when the Voltius window regains focus.
- `server.url` and `server.allowOther` apply at the next app launch.
