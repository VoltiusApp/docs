---
icon: lucide/terminal
---

# Command line (`voltius-cli`)

`voltius-cli` ships with the desktop app. It sets up Voltius from a terminal or a script (Ansible, a shell provisioning script, an MDM run script) without anyone opening Settings. It works whether the app is running or not.

## Getting `voltius-cli` on your PATH

| Install | Where `voltius-cli` is |
|---|---|
| `.deb`, `.rpm`, AUR | `/usr/bin/voltius-cli` |
| AppImage | No separate file. Run the AppImage with a command: `./Voltius.AppImage policy show` |
| Homebrew (`brew install --cask voltius`) | On your PATH |
| `.dmg` without Homebrew | `sudo ln -s "/Applications/Voltius.app/Contents/MacOS/voltius-cli" /usr/local/bin/voltius-cli` |
| Windows installer (`.exe`, winget, Scoop) | The install folder is added to your user PATH. Open a new terminal after installing. |
| Windows `.msi` | The install folder is added to the system PATH |

The Microsoft Store and Flatpak builds don't include `voltius-cli`.

## Global options

| Option | Effect |
|---|---|
| `--json` | Machine-readable output on stdout |
| `-q`, `--quiet` | Print only errors |
| `--no-color` | No colours. `NO_COLOR` is honoured too |
| `-y`, `--yes` | Never prompt. Answers yes where a confirmation is needed |

Without `--yes`, a command that needs a confirmation fails when it isn't run from a terminal, and says which flag to add.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 2 | Usage error, or a per-user command run as root / SYSTEM |
| 3 | Validation error, or the setting is locked by your organization |
| 4 | Permission denied (run as root / Administrator) |
| 5 | File, network or catalogue error |

## Per-user changes and when they apply

`config set`, `config import`, `server set` and `plugins …` without `--lock` or `--defaults` change **your own** Voltius, the same as using Settings. They are queued and Voltius applies them the next time it opens, or when its window regains focus. Changed settings sync to your other devices like any change made in Settings.

These commands refuse to run as root or as Windows SYSTEM, because the change would land in root's own profile and never reach anyone. To set something for every user of a machine, use `--defaults` (a starting value people can change) or `--lock` (enforced). With Ansible, use `become_user` to make a real per-user change.

## Commands

### `policy`

Manages the machine policy file. See [Machine policy](machine-policy.md). Writing needs root (sudo) or Administrator.

| Command | What it does |
|---|---|
| `policy set <key> <value> [--defaults]` | Lock a setting, or with `--defaults` set a default users may change |
| `policy set <key> --min <n> --max <n> --allow <value>` | Limit a setting to a range instead of fixing it. Give any of the three, and repeat `--allow` for several values. Not combined with a value, and not with `--defaults` |
| `policy unset <key> [--defaults]` | Remove it |
| `policy show` | Each setting's effective value and where it comes from |
| `policy check [file]` | Validate a policy file (default: the machine file) |
| `policy import <file> [--replace]` | Merge a policy file in. With `--replace`, the machine file becomes exactly this file. Nothing is written if the file has any problem |
| `policy export` | Print the machine file |
| `policy path` | Print where the machine file lives |

A range limits what users may pick, see [Ranges](machine-policy.md#ranges):

```sh
sudo voltius-cli policy set appSettings.detachedTtlHours --max 24
sudo voltius-cli policy set appSettings.locale --allow en --allow fr
```

`policy show` prints the range next to the effective value. If the user's own value is outside it, the effective value is the bounded one:

```text
  appSettings.detachedTtlHours = 24 (machine policy range: max 24; user value 72 is outside it)
  appSettings.toggles.detached-session-ttl = true (machine policy, forced on by appSettings.detachedTtlHours)
```

When the user's value is inside the range, it stands: `12 (app, machine policy range: max 24)`. A locked shell that isn't installed on this computer is reported as a warning, for example `locked shell fish not found; new terminals use the system default`.

`policy set appSettings.plugins.overrides` fails with exit code 3: it can't be locked, use `plugins.enabled` and `plugins.disabled`. A range with nothing allowed (`--min 25 --max 30` on the lifetime) fails with exit code 3 and `leaves no allowed value`.

### `enroll`

Enrols this machine in a company's Voltius team. It writes the [enrolment token](../teams/enrollment-tokens.md) into the machine policy, and Voltius asks people to sign in to the team at the next launch. Writing needs root (sudo) or Administrator.

| Command | What it does |
|---|---|
| `enroll <token>` | Check the token with its server, then write it |
| `enroll <token> --no-verify` | Write it without asking the server. For image builds with no network |
| `enroll --show` | Print the team, server and the first 8 characters of the token id, never the secret. Checks the server unless you add `--no-verify` |
| `enroll --remove` | Remove this machine's enrolment |

```text
$ sudo voltius-cli enroll "vte1.…"
Enrolled this machine in Acme (voltius.acme.com). Voltius asks people to sign in at next launch.
```

- Running it again with the same token writes nothing and prints `Already enrolled in Acme (voltius.acme.com).`
- If the server can't be reached and the token is already set, it prints `Already enrolled`, says it couldn't check, and exits 0. With a new token, an unreachable server is exit code 5.
- A token that isn't recognised, was revoked or has expired, or whose team's plan has lapsed fails with exit code 3 and writes nothing. So does a token for a server other than the one `server.url` locks this machine to. A malformed token is exit code 2.
- With `--json`, `enroll <token>` prints `{"changed": true, "team": "Acme", "server": "https://voltius.acme.com"}`. `team` is `null` with `--no-verify`. Use `changed` for Ansible's `changed_when`, see [Enrolment tokens](../teams/enrollment-tokens.md#enrol-a-fleet).

### `config`

| Command | What it does |
|---|---|
| `config get <key>` | Print a setting's effective value and where it comes from |
| `config set <key> <value>` | Queue a change for your own Voltius |
| `config import <file>` or `config import --data '<json>'` | Queue several settings from a JSON object of key to value. Nothing is queued if any value is invalid |

`config set` and `config import` refuse a value outside a range your organization set, with exit code 3, and queue nothing:

```text
$ voltius-cli config set appSettings.detachedTtlHours 72
appSettings.detachedTtlHours: outside the range your organization allows (max 24)
```

Keys are setting ids such as `appSettings.terminal.cursorStyle` or `appSettings.toggles.cursor-blink`. `voltius-cli policy show --json` lists them.

### `server`

| Command | What it does |
|---|---|
| `server show` | The sync server URL and where it comes from |
| `server set <url>` | Use this server at your next sign-in |
| `server set <url> --lock` | Lock every user of this machine to this server (admin) |
| `server set <url> --defaults` | Pre-fill this server for every user (admin) |

Restart Voltius after changing the server lock.

### `plugins`

Plugins are named by their **plugin id**, for example `plugin-docker`, not their folder name.

| Command | What it does |
|---|---|
| `plugins list [--catalog]` | Installed plugins, their state, organization policy and queued changes. `--catalog` lists what can be installed |
| `plugins install <id>` | Install from the plugin catalogue |
| `plugins enable <id>` / `plugins disable <id>` | Turn a plugin on or off |
| `plugins remove <id>` | Uninstall it |

Add `--lock` to enforce it for every user of the machine, or `--defaults` to apply it once for every user and let them change it (admin).

When you install a plugin for yourself, `voltius-cli` shows the permissions it asks for and waits for you to confirm, like the app does. `--yes` confirms. Installs set by your organization with `--lock` or `--defaults` don't ask. An install for yourself needs the catalogue to be reachable, so the permissions can be shown.

### `completions`

`voltius-cli completions bash|zsh|fish|powershell|elvish` prints a shell completion script.

### `mcp`

Connects an MCP client to the running app over stdio. `voltius mcp` keeps working too. See [MCP server](../integrations/mcp.md).
