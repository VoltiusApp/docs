---
icon: lucide/braces
---

# Snippets

> Screenshot placeholder — snippet form with variables panel.

Saved commands you can run from the command palette, a context menu, or a keyboard shortcut.

## Create

**Snippets tab → +**, or from the omni search → **Create snippet from clipboard**.

| Field | Notes |
| --- | --- |
| **Name** | Display label |
| **Content** | The command(s). Multi-line is supported — runs as one paste. |
| **Description** | Optional. Surfaces in the command palette. |
| **Tags** | Filter in the Snippets list |
| **Targets** | Which hosts/tags this snippet appears on (context menu) |
| **Shortcut** | Optional keybinding |

## Variables

Embed dynamic values with `{{name}}` syntax:

| Built-in | Value |
| --- | --- |
| `{{connection.host}}` | Active SSH hostname / IP |
| `{{connection.username}}` | Active SSH username |
| `{{connection.name}}` | Active connection name |
| `{{date}}` | `YYYY-MM-DD` |
| `{{datetime}}` | `YYYY-MM-DD HH:MM:SS` |
| `{{timestamp}}` | Unix timestamp |
| `{{clipboard}}` | Current clipboard contents |

User variables — any other `{{name}}` — prompt for input before execution.

## Multi-exec

> Screenshot placeholder — multi-exec picker with several hosts selected.

From the Snippets toolbar → **Run on…** to pick multiple hosts. Voltius opens a tab per host (or runs in the background) with the snippet executed.

!!! tip "Startup snippets"
    Set a snippet as the **Pre-command** on a host (connection form → Advanced) to run it every time you connect.
