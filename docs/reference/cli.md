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
| `policy unset <key> [--defaults]` | Remove it |
| `policy show` | Each setting's effective value and where it comes from |
| `policy check [file]` | Validate a policy file (default: the machine file) |
| `policy import <file> [--replace]` | Merge a policy file in. With `--replace`, the machine file becomes exactly this file. Nothing is written if the file has any problem |
| `policy export` | Print the machine file |
| `policy path` | Print where the machine file lives |

### `config`

| Command | What it does |
|---|---|
| `config get <key>` | Print a setting's effective value and where it comes from |
| `config set <key> <value>` | Queue a change for your own Voltius |
| `config import <file>` or `config import --data '<json>'` | Queue several settings from a JSON object of key to value. Nothing is queued if any value is invalid |

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
