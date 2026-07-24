---
icon: lucide/download
---

# Installing

![The plugin marketplace Browse tab](../assets/screenshots/plugins-installing.png){ .voltius-shot }
/// caption
Browse the marketplace and install plugins with a single click.
///

**Settings → Plugins → Browse** is the marketplace.

## Browsing

- **Search** — filter by name or tag.
- **Tags** — productivity, theme, import, sync…
- **Theme toggle** — show themes only / hide themes.

Each card lists the plugin's declared permissions before install — review them before clicking **Install**. Treat that list as disclosure, not a guarantee: a plugin runs with the app's full privileges (see [What plugins can do](index.md)), so installing one is a matter of trusting its source.

## Installing a plugin

Click **Install**. Voltius fetches `index.js` + `manifest.json` from the plugin's GitHub release, verifies the manifest, and writes them under `$APP_DATA/plugins/<id>/`. If the marketplace listing carries a **content hash** of the bundle, Voltius checks the downloaded `index.js` against it and blocks the install on mismatch.

The plugin appears in **Installed** but is **disabled by default** for marketplace installs. Toggle it on after reviewing what it does.

## Verified vs. unverified

An installed plugin shows an **Unverified** badge when the listing it came from didn't carry a bound content hash — Voltius downloaded and wrote the bundle but couldn't confirm it matches a specific reviewed artifact. This is expected today: content-hash binding is being rolled out across the marketplace, so until a listing publishes one, its installs are unverified by design. Local (developer) plugins are never badged.

When a listing *does* carry a hash, a mismatch is refused outright — the reviewed bytes and the executed bytes must agree.

## Updating

Voltius doesn't yet detect or apply plugin updates automatically. To move to a newer release, **uninstall** the plugin and **install** it again — the reinstall re-fetches the latest `index.js` + `manifest.json` (and re-checks the content hash, if the listing has one). Your plugin settings are stored separately from the bundle, so they survive the reinstall.

!!! warning "Re-review on reinstall"
    A reinstall pulls whatever the source currently publishes, including any change to declared permissions or code. Voltius does **not** yet prompt on permission changes, so re-read the permissions on the plugin card before re-enabling. Marketplace reinstalls land disabled by default.
