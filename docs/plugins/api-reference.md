---
icon: lucide/book-open
---

# Plugin API reference

The `PluginAPI` object is passed to your `register` function and is the only interface to the host app.

---

## `api.pluginId` — `string`

Your plugin's ID as declared in `manifest.json`.

---

## `api.isActive()`

```typescript
isActive(): boolean
```

Returns `true` if the plugin is currently enabled. Use this in `register()` to skip setup when disabled:

```typescript
export default function register(api: PluginAPI) {
  if (!api.isActive()) return;
  // ...
}
```

---

## `api.connections` — requires `connections:read` / `connections:write`

```typescript
api.connections.list()                                // Promise<PluginConnection[]>
api.connections.get(id)                               // Promise<PluginConnection | null>
api.connections.create(data: PluginConnectionInput)   // Promise<PluginConnection>
api.connections.update(id, data)                      // Promise<void>
api.connections.delete(id)                            // Promise<void>
api.connections.bulkImport(items)                     // Promise<PluginConnection[]>
api.connections.subscribe(cb)                         // () => void  (unsubscribe)
```

`PluginConnection`:

```typescript
interface PluginConnection {
  id: string;
  name?: string;
  host: string;
  port: number;
  username: string;
  auth_type: "password" | "key";
  tags: string[];
  identity_id?: string;
  jump_hosts?: JumpHost[];
}
```

`PluginConnectionInput` is the same shape without `id`, with all fields except `host`, `port`, `username`, and `auth_type` being optional.

---

## `api.keys` — requires `keys:read` / `keys:write`

```typescript
api.keys.list()                              // Promise<PluginKey[]>
api.keys.create(data, privateKey, publicKey?) // Promise<PluginKey>
api.keys.delete(id)                          // Promise<void>
```

`data` for `create`: `{ name?: string; key_type?: string; tags?: string[] }`

`PluginKey`:

```typescript
interface PluginKey {
  id: string;
  name?: string;
  key_type?: string;
  tags: string[];
}
```

---

## `api.identities` — requires `identities:read` / `identities:write`

```typescript
api.identities.list()                                          // Promise<PluginIdentity[]>
api.identities.create({ name?, username, key_id?, tags? })     // Promise<PluginIdentity>
api.identities.delete(id)                                      // Promise<void>
```

`PluginIdentity`:

```typescript
interface PluginIdentity {
  id: string;
  name?: string;
  username: string;
  key_id?: string;
  tags: string[];
}
```

---

## `api.vault` — requires `vault:*`

Encrypted key-value store for secrets. Scoped to your plugin — keys are stored as `plugin:<id>:<key>` and are never accessible to other plugins.

```typescript
api.vault.get(key)           // Promise<string | null>
api.vault.set(key, value)    // Promise<void>
api.vault.delete(key)        // Promise<void>
```

!!! tip
    Use `vault` for sensitive data (tokens, passwords). Use `storage` for non-sensitive config.

---

## `api.storage` — always available

JSON key-value store persisted to disk (`$APP_DATA/plugin-data/<id>.json`). Not encrypted.

```typescript
api.storage.get<T>(key)      // Promise<T | null>
api.storage.set<T>(key, val) // Promise<void>
api.storage.delete(key)      // Promise<void>
```

---

## `api.omni` — requires `omni-commands`

Register commands in the Command Palette (++cmd+k++ / ++ctrl+k++):

```typescript
api.omni.register({
  id: "my-cmd",
  label: "Do something",
  icon: "lucide:zap",           // Iconify icon ID
  keywords: ["something", "do"],
  section: "My Plugin",
  keybinding: "ctrl+shift+d",   // optional, first-registered wins on conflict
  execute: async () => { /* ... */ },
})  // returns () => void cleanup

api.omni.unregister(id)
```

---

## `api.ui` — requires matching permission per method

```typescript
// Requires "settings-page"
// For plain settings, prefer the declarative `contributes.configuration` schema
// (see Developing → Configuration schema) — the host renders a consistent form
// with no UI code. Register a page only for bespoke UIs.
api.ui.registerSettingsPage({ id, label, icon, component: React.FC })

// Requires "sidebar-item"
api.ui.registerSidebarItem({ id, label, icon, component: React.FC, position?: "top" | "bottom" })

// Requires "right-panel"
api.ui.registerRightPanelSection({ id, label, icon, component: React.FC })

// Requires "context-menu"
api.ui.registerContextMenuItem({
  id, label, icon?,
  target: "connection" | "session" | "tab" | Array,
  action: (ctx: ContextMenuContext) => void,
})

// Requires "ui-contributions"
api.ui.registerContribution(slot, (ctx) => ContributedAction[])

// Requires "ui-contributions"
api.ui.registerStatusBarItem("terminal.statusBar.right", (ctx) => ReactNode)
```

All register methods return a cleanup `() => void`.

Available `UISlot` values:

```
"connection.contextMenu"    "connection.panelActions"
"key.contextMenu"           "key.panelActions"
"identity.contextMenu"      "identity.panelActions"
"home.bgContextMenu"        "keychain.bgContextMenu"
"home.toolbar.hostMenu"     "settings.vaults"
```

`ContributedAction`:

```typescript
interface ContributedAction {
  label: string;
  icon?: string;
  onClick: () => void;
  divider?: boolean;
  danger?: boolean;
  shortcut?: string;
  when?: (context: unknown) => boolean; // sync only — errors treated as false
}
```

---

## `api.themes` — requires `themes`

```typescript
api.themes.register(theme: PluginTheme)  // same shape as AppTheme
api.themes.unregister(id: string)
```

---

## `api.sessions` — requires `sessions:read` / `sessions:write`

```typescript
api.sessions.list()                          // PluginSession[]  (snapshot)
api.sessions.onConnected(cb)                 // () => void
api.sessions.onDisconnected(cb)              // () => void
api.sessions.onActivated(cb)                 // () => void  (tab switch)
api.sessions.open(connectionId)              // Promise<string>  — requires sessions:write
api.sessions.close(sessionId)                // Promise<void>   — requires sessions:write
api.sessions.sendCommand(sessionId, cmd)     // Promise<void>   — requires terminal:write (gated)
```

`sessions:write` covers session **lifecycle** — opening and closing sessions. Injecting
input is a separate, more dangerous capability: `sendCommand` requires the **gated**
`terminal:write` permission (see [Gated permissions](#gated-permissions)), not
`sessions:write`. It writes to the terminal and the runtime appends `\n`; it works for
SSH sessions and local shells.

---

## `api.terminal` — gated: requires `terminal:read` / `terminal:stream`

Reading terminal I/O touches your own sessions' visible output. These verbs are on the
[gated tier](#gated-permissions) — a plugin may hold them, but only behind explicit,
danger-styled install-time consent.

```typescript
api.terminal.readSnapshot(sessionId, maxLines?)  // string  — requires terminal:read
api.terminal.readSelection(sessionId)            // string  — requires terminal:read
api.terminal.onOutput(sessionId, cb)             // Promise<() => void> — requires terminal:stream
```

`readSnapshot` returns the last `maxLines` (default 200) of scrollback; `readSelection`
returns the current selection; `onOutput` streams output as it is printed and returns a
cleanup function. A consented plugin may read any session's I/O.

---

## `api.keychain` — gated: requires `keychain:read` / `keychain:write`

OS-local, unsynced secret storage. Keys are **namespaced per plugin** — a plugin only ever
sees its own secrets; it cannot read or overwrite another plugin's. On the
[gated tier](#gated-permissions).

```typescript
api.keychain.get(key)          // Promise<string | null>  — requires keychain:read
api.keychain.set(key, value)   // Promise<void>           — requires keychain:write
api.keychain.delete(key)       // Promise<void>           — requires keychain:write
```

---

## `api.lifecycle` — always available

```typescript
api.lifecycle.onConnectionEstablished(cb)   // fires when a session becomes "connected"
api.lifecycle.onConnectionClosed(cb)        // fires on disconnect / removal
api.lifecycle.onSessionActivated(cb)        // fires on active tab change
api.lifecycle.onSettingsChanged(cb)         // fires when storage.set() is called for this plugin
api.lifecycle.onBeforeQuit(cb)              // max 5s before app force-quits
api.lifecycle.waitForLoginSync()            // Promise<void> — resolves after login-time sync
```

All event hooks return a cleanup `() => void`.

---

## `api.http` — requires `http`

```typescript
api.http.get<T>(url, opts?)         // Promise<T>  — throws on non-2xx
api.http.post<T>(url, body, opts?)  // Promise<T>  — sets Content-Type: application/json
```

---

## `api.fs` — requires `fs`

Paths are relative to the user's home directory (`~`).

```typescript
api.fs.readText(path)                           // Promise<string>
api.fs.writeText(path, content)                 // Promise<void>
api.fs.exists(path)                             // Promise<boolean>
api.fs.watch(path, cb, { intervalMs?: number }) // () => void  (polling-based)
```

---

## `api.notifications` — requires `notifications`

```typescript
api.notifications.toast(message, {
  severity?: "info" | "success" | "warning" | "error",
  duration?: number,   // ms, default 2500
  action?: { label: string; onClick: () => void },
})

const progress = api.notifications.progress("Uploading...", {
  indeterminate?: boolean,   // default true
  cancellable?: boolean,
})
progress.update(50, "Halfway there")
progress.finish("Done!")
progress.error("Something went wrong")

const banner = api.notifications.banner("Update available", {
  severity?: "info" | "success" | "warning" | "error",
  actions?: Array<{ label: string; onClick: () => void }>,
  dismissable?: boolean,
  flashToast?: boolean,  // also shows a toast, default true
})
banner.dismiss()
banner.update("New message")
```

---

## `api.sync` — requires `sync:read` / `sync:write`

Binary blob storage for sync scenarios. Max 1 MB per blob.

```typescript
api.sync.getBlob(key)                  // Promise<Uint8Array | null>
api.sync.setBlob(key, data)            // Promise<void>  — throws if > 1 MB
api.sync.onRemoteChange(key, cb)       // () => void  — fires after sync if blob changed
api.sync.triggerReload(storeKey)       // Promise<void>
api.sync.exportState(encKey, deviceId) // Promise<string>  — base64 encrypted blob
api.sync.importStates(encKey, blobs)   // Promise<void>  — CRDT-merge remote blobs
```

`triggerReload` accepts: `"connections"`, `"identities"`, `"keys"`, `"snippets"`, `"folders"`.

---

## `api.events` — always available

Shared event bus. Emitted events are automatically prefixed with the plugin ID (`<pluginId>:<event>`). Listen to another plugin's events using the full prefixed name.

```typescript
// Plugin A emits
api.events.emit("synced", { count: 5 })
// → fires handlers for "plugin-a:synced"

// Plugin B listens
api.events.on("plugin-a:synced", (data) => { /* ... */ })
```

---

## `api.plugins` — always available

```typescript
api.plugins.expose({ doThing: () => {} })   // publish your public API
api.plugins.getApi("other-plugin-id")       // unknown | null
```

---

## `api.log` — always available

Console output scoped to your plugin (`[plugin:<id>]` prefix):

```typescript
api.log.info("message", ...args)
api.log.warn("message", ...args)
api.log.error("message", ...args)
```

---

## Permissions

Declare these in `manifest.json` under `"permissions"`. Calling a `PluginAPI` method without its permission throws, and the declared list is what the user sees before installing. This gates the supported API and drives install-time disclosure — it is not a security sandbox (see [Developing → What PluginAPI covers](developing.md#what-pluginapi-covers)).

| Permission | Unlocks |
|------------|---------|
| `connections:read` | `connections.list/get/subscribe` |
| `connections:write` | `connections.create/update/delete/bulkImport` |
| `keys:read` | `keys.list` |
| `keys:write` | `keys.create/delete` |
| `identities:read` | `identities.list` |
| `identities:write` | `identities.create/delete` |
| `vault:read` | `vault.get` |
| `vault:write` | `vault.set/delete` |
| `http` | `http.get/post` |
| `fs` | `fs.readText/writeText/exists/watch` |
| `themes` | `themes.register/unregister` |
| `omni-commands` | `omni.register/unregister` |
| `settings-page` | `ui.registerSettingsPage` |
| `sidebar-item` | `ui.registerSidebarItem` |
| `right-panel` | `ui.registerRightPanelSection` |
| `context-menu` | `ui.registerContextMenuItem` |
| `ui-contributions` | `ui.registerContribution` / `ui.registerStatusBarItem` |
| `notifications` | `notifications.toast/progress/banner` |
| `sessions:read` | `sessions.list/onConnected/onDisconnected/onActivated` |
| `sessions:write` | `sessions.open/close` (session lifecycle) |
| `sync:read` | `sync.getBlob/onRemoteChange/triggerReload` |
| `sync:write` | `sync.setBlob/exportState/importStates` |

`api.storage`, `api.events`, `api.log`, `api.plugins`, and `api.lifecycle` are **always available** — no permission needed.

### Gated permissions

A small set of permissions unlock capabilities powerful enough that they get a distinct,
danger-styled treatment in the install/update consent dialog. They are **grantable to any
plugin**, but the user is always shown, in plain language, exactly what they allow — and a
plugin that declares one **always** prompts for consent, even if install review is turned
off. Declare them the same way as any other permission.

| Permission | Unlocks |
|------------|---------|
| `terminal:read` | `terminal.readSnapshot/readSelection` — read a session's visible output and scrollback |
| `terminal:stream` | `terminal.onOutput` — watch a session's output live |
| `terminal:write` | `sessions.sendCommand` — send input / run commands in a session |
| `keychain:read` | `keychain.get` — read this plugin's own stored secrets |
| `keychain:write` | `keychain.set/delete` — store secrets in the OS keychain (namespaced per plugin) |

A consented plugin may read/watch/inject **any** session's I/O — the gate is honest consent
and the read-vs-write split, not per-session scoping. Reading terminal I/O and injecting
commands are separate permissions, so a plugin can ask to watch output without also asking
to type.
