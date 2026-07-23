---
icon: lucide/puzzle
---

# Plugins

Extend Voltius with installable JavaScript plugins.

- **[Installing](installing.md)** — browse and install from the marketplace
- **[Managing](managing.md)** — enable, disable, update, remove
- **[Custom repos](custom-repos.md)** — host your own registry
- **[Developing](developing.md)** — link out to the marketplace plugin reference

!!! warning "Plugins run with full app privileges"
    A plugin is JavaScript running in Voltius's own process, so it has the same reach the app does. The permissions a plugin declares are shown before you install and describe what it intends to use — that's disclosure, not a sandbox. Install plugins the way you would a browser or editor extension: only from a source you trust. The supported capability surface is the [`PluginAPI`](api-reference.md); reviewing what a plugin does is the marketplace's responsibility, and deciding to install it is yours.
