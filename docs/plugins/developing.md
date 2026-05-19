---
icon: lucide/code
---

# Developing plugins

The plugin developer reference — manifest format, the full `PluginAPI` surface, permissions, and publishing — lives alongside the registry itself.

[Open the marketplace README →](https://github.com/VoltiusApp/marketplace#for-plugin-authors){ .md-button .md-button--primary }

## What you'll find there

- **Quickstart** — minimum viable plugin structure (`manifest.json` + `index.js`)
- **`PluginAPI` reference** — connections, keys, identities, vault, storage, omni, ui, themes, sessions, lifecycle, http, fs, notifications, sync, events, plugins, log
- **Permissions table** — every capability your manifest can request
- **Worked examples** — SSH config importer, theme plugin, Docker side panel
- **Publishing** — releasing on GitHub and submitting to `plugins.json`

## Why it lives in the marketplace repo

The reference ships next to the registry so the docs stay in lockstep with the published `plugins.json` schema and any breaking API changes are visible in the same PR.

!!! tip
    For the user-facing side of plugins (installing, enabling, custom repos), see [Installing plugins](installing.md) and [Custom repos](custom-repos.md).
