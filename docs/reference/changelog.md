---
icon: lucide/history
---

# Changelog

Release notes live in **[CHANGELOG.md](https://github.com/VoltiusApp/voltius/blob/main/CHANGELOG.md)** — the source of truth. Each [GitHub release](https://github.com/VoltiusApp/voltius/releases) carries the same notes.

## Subscribe

- **Watch the repo** — GitHub will email release notifications.
- **In-app** — click **What's new** at the bottom of the vault sidebar to read the changelog. When an update is available or ready, the button says so; open it to download or restart. **Settings → About → Show what's new after updates** opens it automatically after each update.

## Versioning

Voltius follows **semver**:

- **Major** — breaking changes (vault format, sync protocol).
- **Minor** — new features.
- **Patch** — fixes.

Pre-1.0 releases (`0.x.y`) may break compatibility between minors — see release notes.

## Breaking-change policy

After 1.0:

- Vault format changes ship with a one-way migration on first launch.
- Sync protocol changes are negotiated — old clients keep working until end-of-life is announced.
