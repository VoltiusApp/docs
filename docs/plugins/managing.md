---
icon: lucide/settings
---

# Managing

![The installed plugins list in Settings](../assets/screenshots/plugins-managing.png){ .voltius-shot }
/// caption
Settings → Plugins → Installed — every plugin with its version and permission scopes.
///

**Settings → Plugins → Installed.**

## Per-plugin actions

| Action | What |
| --- | --- |
| **Toggle** | Enable / disable. Disabling calls the plugin's cleanup hook. |
| **Plugin settings** (gear icon) | Opens the plugin's settings page (or a generated form from `contributes.configuration`). |
| **Reload plugin** | Re-read the plugin's files from disk and re-run its `register` function. Use after editing a local plugin. |
| **Update** | Pull a newer release if available. |
| **Uninstall** | Removes the folder under `$APP_DATA/plugins/`. A **Bundled** plugin is only hidden after a confirmation and can be reinstalled from **Browse**. Per-plugin storage and vault entries are kept. |

## Plugin data locations

| Item | Path |
| --- | --- |
| Code | `$APP_DATA/plugins/<id>/` |
| Storage (`api.storage`) | `$APP_DATA/plugin-data/<id>.json` |
| Vault (`api.vault`) | Inside your Voltius vault, scoped to `plugin:<id>:*` |
| Logs | Messages written with `api.log` are prefixed `[plugin:<id>]` |

`$APP_DATA` is `%APPDATA%\voltius\` (Windows), `~/Library/Application Support/voltius/` (macOS), `~/.config/voltius/` (Linux).
