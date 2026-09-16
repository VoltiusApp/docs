---
icon: lucide/refresh-cw
---

# Building a sync provider

A sync provider is a plugin that moves the user's encrypted data between devices through a
storage backend it owns: GitHub Gist Sync and Cloudflare Sync are two. Voltius shows every
provider in the title bar sync icon, the sync menu, Settings › Sync, the mobile header, and the
MCP `sync_status` tool.

## What makes a plugin a provider

Declare `sync:write` in `manifest.json`. That permission gives access to
`api.sync.exportState` and `api.sync.importStates`, which every provider needs, and it is also
the marker Voltius uses:

- **Installed:** any loaded plugin with `sync:write` is listed as a provider.
- **Not installed:** any catalogue entry whose `permissions` include `sync:write` is listed
  under "More sync providers" with an Install button. The marketplace copies `permissions` from
  your manifest into `plugins.json` and verifies it in CI.

## Publish your state

Publish a `SyncProviderState` under the key `"sync-state"` whenever it changes, and once at
startup:

```typescript
import type { PluginAPI, SyncProviderState } from "@voltius/plugin-types";

function publish(api: PluginAPI, state: SyncProviderState) {
  api.ui.publishState("sync-state", state);
}

publish(api, {
  status: "success",          // "idle" | "syncing" | "success" | "error" | "offline"
  lastSync: new Date(),       // Date, ISO string or epoch ms; null if never synced
  error: null,                // a short, user-readable message when status is "error"
  blobSizeBytes: 48_213,      // size of the last encrypted upload, or null
  configured: true,           // false until the user has finished your setup
});
```

`publishState` is typed: a `"sync-state"` value that does not match `SyncProviderState` fails
to compile. Voltius also validates it at runtime and treats malformed fields as empty.

## Expose Sync now

```typescript
import type { SyncProviderPublicApi } from "@voltius/plugin-types";

api.plugins.expose({ syncNow } satisfies SyncProviderPublicApi);
```

The sync menu's and Settings › Sync's "Sync now" buttons call it. Without it, those buttons are
disabled or hidden for your provider.

## How Voltius shows your provider

| Your plugin | Shown as | Button |
|---|---|---|
| Disabled | Plugin disabled | Enable → (opens Settings › Plugins) |
| Enabled, `configured: false` or nothing published | Not configured | Configure → (opens your first settings page) |
| Enabled, `configured: true` | Your `status`, `lastSync`, `error`, blob size | Sync now |

The label is your manifest `name`. The icon is your first settings page's `icon`. Register a
settings page (`api.ui.registerSettingsPage`) before your `api.isActive()` check so users can
configure the plugin before enabling it.

The title bar icon shows the worst status across every active provider, in this order:
`error`, `offline`, `syncing`, `success`, `idle`. When it is an error, the tooltip names the
provider.

## Notifications

Do not show toasts or banners for background sync: not for success, not for a failed poll, not
for an expired token. Publish the state instead; the title bar icon turns red and the menu shows
your `error`. Keep notifications for replies to something the user just clicked, such as
"Token copied".
