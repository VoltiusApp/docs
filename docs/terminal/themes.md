---
icon: lucide/palette
---

# Themes

> Screenshot placeholder — Theme Creator with color groups visible.

Both the **UI** and the **terminal** are themable from one place.

## Switching themes

**Settings → Appearance → Theme.** Bundled themes ship with the app; more come from [theme plugins](../plugins/index.md) in the marketplace.

## Theme creator

> Screenshot placeholder — Theme Creator opened to the terminal section.

**Settings → Appearance → Edit theme** (or duplicate an existing one):

- **UI section** — background, foreground, borders, accent, panel chrome.
- **Terminal section** — background, foreground, cursor, 16 ANSI colors.
- **Typography** — font family + size.

Changes preview live. Export creates a JSON file you can share.

## Distributing a theme

Themes are a plugin type. See [Developing plugins → theme example](https://github.com/VoltiusApp/marketplace#complete-example-theme-plugin) and submit to the marketplace.

!!! tip
    Drop a `.json` theme into `$APP_DATA/themes/` to load it without packaging as a plugin — handy for iterating.
