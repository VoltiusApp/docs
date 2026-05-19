---
icon: lucide/download
---

# Installing

> Screenshot placeholder — Settings → Plugins → Browse tab.

**Settings → Plugins → Browse** is the marketplace.

## Browsing

- **Search** — filter by name or tag.
- **Tags** — productivity, theme, import, sync…
- **Theme toggle** — show themes only / hide themes.

Each card lists the plugin's permissions before install — review them before clicking **Install**.

## Installing a plugin

Click **Install**. Voltius fetches `index.js` + `manifest.json` from the plugin's GitHub release, verifies the manifest, and writes them under `$APP_DATA/plugins/<id>/`.

The plugin appears in **Installed** but is **disabled by default** for marketplace installs. Toggle it on after reviewing what it does.

## Updating

The Browse tab shows an **Update** badge when a newer release is available. Click to fetch and replace; settings persist.

!!! warning "Permission scope"
    Permissions in `manifest.json` are declared up front. If a plugin update adds a permission, Voltius prompts before enabling — explicitly accept or skip the update.
