---
icon: lucide/history
---

# Changelog

Release notes live on **[github.com/VoltiusApp/voltius/releases](https://github.com/VoltiusApp/voltius/releases)** — the source of truth.

## Subscribe

- **Watch the repo** — GitHub will email release notifications.
- **In-app** — the updater prompts you on every release. Click **What's new** in the prompt to see the notes.

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
