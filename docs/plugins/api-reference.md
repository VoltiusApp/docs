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
api.keys.addToHost({ keyId, connectionId, location?, filename? })  // Promise<void>
```

`data` for `create`: `{ name?: string; key_type?: string; tags?: string[] }`

`addToHost` appends the key's public half to a host's `authorized_keys` over SSH, using that connection's stored credentials, and requires **both** `keys:read` and `connections:read`. It never accepts a script or a command: `location` is a relative directory under the remote home (default `.ssh`) and `filename` a plain filename (default `authorized_keys`), and a key whose comment or path carries anything shell-significant is refused rather than sent.

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

## `api.vaults` — gated: requires `vaults:read` / `vaults:write`

The **user's** vaults — the containers hosts, keys, snippets and rules are filed in. Note the plural: `api.vault` below is your plugin's own secret storage and is a different thing.

```typescript
api.vaults.list()                       // PluginVault[]  (snapshot, not a Promise)
api.vaults.create(name)                 // PluginVault
api.vaults.rename(id, name)             // void
api.vaults.delete(id, { cascade? })     // Promise<void>
```

```typescript
interface PluginVault {
  id: string;
  name: string;
  /** Backed by a team; every write verb refuses it. */
  team: boolean;
}
```

`delete` refuses the personal vault, a team vault, and a vault that still holds objects — unless `cascade: true`, which deletes its contents with it and cannot be undone. `rename` refuses a team vault.

---

## `api.folders` — gated: requires `folders:read` / `folders:write`

Folders across all four trees. One `keychain` tree holds keys **and** identities.

```typescript
type PluginFolderKind = "connection" | "keychain" | "port_forwarding" | "snippet";

api.folders.list(kind?)                                        // PluginFolder[]  (snapshot)
api.folders.create({ kind, name, vaultId?, parentFolderId? })  // Promise<PluginFolder>
api.folders.rename(id, name)                                   // Promise<void>
api.folders.delete(id, { cascade? })                           // Promise<void>
```

```typescript
interface PluginFolder {
  id: string;
  name: string;
  kind: PluginFolderKind;
  vaultId: string;
  parentFolderId: string | null;
  team: boolean;
}
```

`create` defaults to the personal vault. `rename` changes the name only — kind, vault and parent are preserved. `delete` **cascades by default**. Team vaults are refused throughout.

---

## `api.objects` — requires the write permission of every kind it names

Move and copy vault objects between folders and vaults, through the same paste path the pages themselves use.

```typescript
interface PluginObjectMoveInput {
  ids: string[];
  /** Destination folder, or null for the destination vault's root. */
  folderId: string | null;
  /** Destination vault. null keeps every object in the vault it has. */
  vaultId: string | null;
  /** Authorizes a destination vault other than the objects' own. */
  allowCrossVault?: boolean;
}

interface PluginObjectMoveOutcome {
  moved: number;
  created: number;
  /** Ids that no longer exist, or objects already where the call would put them. */
  skipped: number;
}

api.objects.move(input)   // Promise<PluginObjectMoveOutcome>
api.objects.copy(input)   // Promise<PluginObjectMoveOutcome>
```

All the ids in one call must belong to one tab — hosts, keychain, port forwarding or snippets. Folder ids may travel with them, contents included, which additionally requires `folders:write`.

There is no `objects:*` permission: a call requires the write permission of every kind it names — `connections:write`, `keys:write`, `identities:write`, `snippets:write`, `port_forwarding:write` — so the grant is exactly the one a plugin would need to write those objects directly. Three rules widen that set, and they are deliberate:

- **A folder asks for its whole tab's kinds**, not just `folders:write`, because moving it carries its contents — secrets included — into the destination.
- **A hosts id asks for the keychain's kinds too**, because the paste cascade writes the key and identity a host references into the destination vault.
- **An id that resolves to nothing asks for everything.** A wrong guess must not under-gate the call.

A destination vault adds nothing: a move never creates or destroys a vault, so `vaults:write` is not required to file an object one folder over.

Crossing into a vault other than the objects' own is refused unless `allowCrossVault` is true, and the refusal carries the plan: how many objects, which vault, and what would travel with them. Team vaults are refused as a destination, and `copy` refuses a team vault as a *source*.

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

// Requires "right-panel"
api.ui.registerRightPanelSection({ id, label, icon, component, order?, providesHostMetrics?, providesPanelSearch? })

// Requires "global-panel" — shell-level, not session-scoped
api.ui.registerGlobalPanel({ id, component: React.FC<{ open, onClose }> })   // GlobalPanelHandle

// Requires "right-panel" — a full-screen mobile view for `screen.kind`
api.ui.registerMobileScreen({ id, kind, render })

// Requires "ui"
api.ui.pushMobileScreen(entry)      // push another mobile screen onto the nav stack
api.ui.focusMobileTerminal()        // switch the mobile shell to its terminal tab
api.ui.setActiveNav(id)             // switch the app's active navigation section
api.ui.publishState(key, value)     // publish a serialisable snapshot for host UI

// Requires "ui-contributions"
api.ui.registerContribution(slot, (ctx) => ContributedAction[])
api.ui.registerStatusBarItem(slot, (ctx) => ReactNode)

// No permission — scoped to your own contributions
api.ui.unregister(id)
```

All register methods return a cleanup `() => void`, except `registerGlobalPanel`, which returns a `GlobalPanelHandle` — callable to dispose, plus `open()`, `close()`, `toggle()`, `isOpen()` and `setDockedWidth(px)`.

Ids are host-prefixed with `<pluginId>:` on registration. `unregister` takes no permission because it only touches ids your plugin registered — a guessed id belonging to another plugin is ignored with a warning.

`registerRightPanelSection`'s `order` fixes the section's rail slot: registration order follows the on-disk read order of the plugin directory and changes after any uninstall/reinstall, so a section that wants a stable position must declare one. Ties break on `id`.

`publishState` is how host surfaces read your state (keyed `<pluginId>::<key>`) without importing your runtime module. It is cleared on unload or disable.

Available `UISlot` values:

```
"connection.contextMenu"        "connection.panelActions"
"key.contextMenu"               "key.panelActions"
"identity.contextMenu"          "identity.panelActions"
"portForwardingRule.contextMenu"
"home.bgContextMenu"            "keychain.bgContextMenu"
"home.toolbar.hostMenu"         "settings.vaults"
```

`UIStatusBarSlot` is `"terminal.statusBar.right"` or `"titlebar.right"`.

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

## `api.i18n` — requires `ui`

Your plugin's own translation catalog. Registered here rather than in the host's locale files, so a third-party plugin ships translations exactly the way a first-party one does. Not gated — resolving UI strings grants no host access.

```typescript
type PluginLocaleCatalog = Record<string, string>;          // values may contain "{{var}}"
type PluginI18nCatalog = Partial<Record<PluginLocale, PluginLocaleCatalog>>;

api.i18n.register(catalog)          // call once at load, before rendering
api.i18n.t(key, vars?)              // string
api.i18n.getLocale()                // PluginLocale
api.i18n.onLocaleChange(cb)         // () => void  (unsubscribe)
```

`t` falls back to the `"en"` entry, then to the key itself — never to a blank. Always ship `"en"`. `onLocaleChange` does **not** trigger a React re-render on its own: re-call `t()` and re-render yourself on each firing.

---

## `api.sftp` — gated: requires `sftp:read` / `sftp:write`

Remote and local file access. A `FileTarget` is a saved connection's id, or the literal `"local"` for this machine; SFTP and FTP connections are addressed the same way and the host opens whichever transport the connection declares.

```typescript
interface FileEndpoint { target: FileTarget; path: string }

api.sftp.list(target, path)              // Promise<PluginFile[]>       — sftp:read
api.sftp.stat(target, path)              // Promise<PluginFile | null>  — sftp:read
api.sftp.readText(target, path, maxBytes?) // Promise<string>           — sftp:read
api.sftp.writeText(target, path, content)  // Promise<void>             — sftp:write
api.sftp.mkdir(target, path)             // Promise<void>               — sftp:write
api.sftp.rename(target, from, to)        // Promise<void>               — sftp:write
api.sftp.delete(target, path)            // Promise<void>               — sftp:write
api.sftp.transfer(src, dst)              // Promise<void>               — sftp:write
api.sftp.disconnect(target)              // Promise<void>
```

```typescript
interface PluginFile {
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  isSymlink: boolean;
  /** Unix seconds, or null when the transport does not report one. */
  modified: number | null;
}
```

`stat` returns `null` for a missing path — that is not an error. `transfer` copies one path between any two targets in any direction, files or directories; host→host streams directly and never lands on this machine.

---

## `api.audit` — requires `audit`; reading requires the gated `audit:read`

```typescript
api.audit.record(connectionId, action, metadata?, localMetadata?)  // void  — requires "audit"
api.audit.query(filters)  // Promise<{ logs: PluginAuditRow[]; total: number }> — audit:read
```

`record` logs an action against the connection it targets. A team-vault connection additionally posts to that team's server; `"local"`, unknown and deleted ids fail closed to the on-device sink. `localMetadata` never leaves the device.

!!! warning
    Never pass captured terminal output to either channel.

`query` returns **this device's local rows only** — team-vault rows are server-backed and are not returned here.

```typescript
interface PluginAuditQuery {
  actions?: string[];
  from?: string;    // ISO 8601
  to?: string;
  page?: number;
  perPage?: number; // clamped to 100
}

interface PluginAuditRow {
  action: string;
  actor_name: string;
  source: "server" | "client";
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
```

Rows are projected: the internal id, actor id, team/vault ids and IP are dropped.

---

## `api.mcp` — gated: requires `mcp:contribute`

Contribute your own tools to the [Voltius MCP server](../integrations/mcp.md), so an AI agent grows with the app.

```typescript
interface McpToolContribution {
  /** Unqualified, matching /^[a-z0-9_]+$/. The host adds the "<pluginId>__" prefix. */
  name: string;
  description: string;
  /** Plain JSON Schema — converted host-side, so no zod instance crosses the bundle boundary. */
  inputSchema: Record<string, unknown>;
  /** Whether a call changes state. Defaults to true. */
  mutating?: boolean;
  execute(args: Record<string, unknown>): Promise<unknown>;
}

api.mcp.registerTools(tools)   // () => void  (removes the whole set)
```

Registration is all-or-nothing: an invalid tool throws and none of the set is registered. The host writes the audit row for a mutating call, so a plugin cannot forget to — and `mutating` defaults to `true` precisely so that forgetting the field audits rather than silently not auditing. The user gets a per-plugin toggle in **Settings → Integrations → Plugin tools exposed to clients**.

---

## `api.streams` — gated per stream kind

The primitive `metrics`, `processes` and `docker.logs` are built on. Prefer those wrappers; reach for `streams` only when you need a kind they do not cover.

```typescript
api.streams.start(kind, opts)   // Promise<string>  (streamId)
api.streams.stop(streamId)      // Promise<void>    (no-op for an unknown id)
api.streams.on<T>(streamId, cb) // Promise<() => void>  (unsubscribe)
```

`start` requires the permission its kind maps to — `metrics` → `metrics:read`, `processes` → `processes:read`, `docker-logs` and `docker-stack-logs` → `docker:read` — so `streams` is not a way around the domain gates. `stop` and `on` act on a streamId you already hold and take no permission.

---

## `api.metrics` — gated: requires `metrics:read`

Live host metrics, over `api.streams`' `"metrics"` kind.

```typescript
api.metrics.start(sessionId, isRemote)       // Promise<string>  (streamId)
api.metrics.stop(streamId)                   // Promise<void>
api.metrics.onSnapshot<T>(streamId, cb)      // Promise<() => void>
api.metrics.getSystemInfo(sessionId, sessionType, sessionName?)  // Promise<unknown>
```

---

## `api.processes` — gated: requires `processes:read` / `processes:manage`

```typescript
api.processes.start(sessionId, isRemote)     // Promise<string>  — processes:read
api.processes.stop(streamId)                 // Promise<void>    — processes:read
api.processes.onSnapshot<T>(streamId, cb)    // Promise<() => void> — processes:read
api.processes.kill(sessionId, pid, isRemote, force)  // Promise<void> — processes:manage
```

---

## `api.docker` — gated: requires `docker:read` / `docker:manage`

Every call takes a `DockerTarget` — one object instead of a `(sessionId, isRemote, localShell)` triple, so a transposed boolean is a type error rather than a silent one.

```typescript
interface DockerTarget { sessionId: string; isRemote: boolean; localShell: string | null }

api.docker.containers.list(t)                          // docker:read
api.docker.containers.action(t, containerId, action)   // docker:manage
api.docker.containers.runCommand(t, containerId, command)
api.docker.images.list(t)                              // docker:read
api.docker.images.checkUpdate(t, imageId)              // docker:read
api.docker.images.remove(t, imageId) / pull(t, image) / update(t, imageId, recreate)
api.docker.images.recreateContainers(t, imageId) / prune(t)
api.docker.volumes.list(t) / remove(t, name) / prune(t)
api.docker.networks.list(t) / remove(t, id) / prune(t)
api.docker.stacks.list(t) / services(t, stack)         // docker:read
api.docker.stacks.action(t, stack, action) / update(t, stack)
api.docker.logs.start(t, containerId, tail) / startStack(t, stack, tail)  // docker:read
api.docker.logs.stop(streamId) / on<T>(streamId, cb)   // docker:read
api.docker.system.prune(t)                             // docker:manage
api.docker.exec.open(t, containerId, containerName?)   // docker:manage — returns a session id
```

`docker:read` covers every `list`/`services`/`checkUpdate` verb and all of `logs.*`. Everything that mutates or destroys is `docker:manage` — including `exec.open`, because an interactive shell inside a container is full control, not a read.

---

## `api.proxmox` — gated: requires `proxmox:read` / `proxmox:manage`

Proxmox VE LXC management. Only functions against SSH sessions.

```typescript
api.proxmox.lxc.list(sessionId)                          // proxmox:read
api.proxmox.lxc.action(sessionId, vmid, action)          // proxmox:manage
api.proxmox.lxc.openShell(sessionId, vmid, vmName?)      // proxmox:manage — returns a session id
api.proxmox.lxc.snapshots.list(sessionId, vmid)          // proxmox:read
api.proxmox.lxc.snapshots.create(sessionId, vmid, name, description?)
api.proxmox.lxc.snapshots.rollback(sessionId, vmid, name)
api.proxmox.lxc.snapshots.remove(sessionId, vmid, name)
```

`proxmox:read` covers `list` and `snapshots.list`; everything else is `proxmox:manage`.

---

## `api.ports` — gated: requires `ports:forward`

One verb: make a published port reachable from this machine and act on it.

```typescript
interface ReachPortRequest {
  sessionId: string;
  isRemote: boolean;
  /** Published host port on the Docker host. */
  hostPort: number;
  /** The publish's bind address; wildcard binds collapse to loopback. */
  hostIp?: string | null;
  scheme?: "http" | "https";
  action: "browser" | "copy";
}

interface ReachPortResponse {
  /** Full URL for "browser", bare host:port for "copy". */
  address: string;
  localPort: number;
  /** True when this call opened a new tunnel, as opposed to reusing or not needing one. */
  tunneled: boolean;
}

api.ports.reach(req)   // Promise<ReachPortResponse>
```

Deliberately host-executed. A plugin never receives a raw URL-opener or raw tunnel control — both are larger grants than this needs.

---

## `api.crypto` — requires `crypto:derive`

```typescript
api.crypto.deriveKey(passphrase, saltHex)   // Promise<string>  (32-byte key, hex)
```

Not gated: a pure KDF over caller-supplied input, granting no access to host secrets.

---

## Permissions

Declare these in `manifest.json` under `"permissions"`. Calling a `PluginAPI` method without its permission throws, and the declared list is what the user sees before installing. This gates the supported API and drives install-time disclosure — it is not a security sandbox (see [Developing → What PluginAPI covers](developing.md#what-pluginapi-covers)).

| Permission | Unlocks |
|------------|---------|
| `connections:read` | `connections.list/get/subscribe` |
| `connections:write` | `connections.create/update/delete/bulkImport` |
| `keys:read` | `keys.list`; with `connections:read`, `keys.addToHost` |
| `keys:write` | `keys.create/delete` |
| `identities:read` | `identities.list` |
| `identities:write` | `identities.create/delete` |
| `snippets:write` | filing snippets via `objects.move/copy` |
| `port_forwarding:write` | filing port forwarding rules via `objects.move/copy` |
| `vault:read` | `vault.get` |
| `vault:write` | `vault.set/delete` |
| `http` | `http.get/post` |
| `fs` | `fs.readText/writeText/exists/watch` |
| `crypto:derive` | `crypto.deriveKey` |
| `themes` | `themes.register/unregister` |
| `omni-commands` | `omni.register/unregister` |
| `settings-page` | `ui.registerSettingsPage` |
| `right-panel` | `ui.registerRightPanelSection` / `ui.registerMobileScreen` |
| `global-panel` | `ui.registerGlobalPanel` |
| `ui` | `ui.pushMobileScreen/focusMobileTerminal/setActiveNav/publishState`, `i18n.*` |
| `ui-contributions` | `ui.registerContribution` / `ui.registerStatusBarItem` |
| `notifications` | `notifications.toast/progress/banner` |
| `sessions:read` | `sessions.list/onConnected/onDisconnected/onActivated` |
| `sessions:write` | `sessions.open/close` (session lifecycle) |
| `audit` | `audit.record` |
| `sync:read` | `sync.getBlob/onRemoteChange/triggerReload` |
| `sync:write` | `sync.setBlob/exportState/importStates` |

`api.storage`, `api.events`, `api.log`, `api.plugins`, and `api.lifecycle` are **always available** — no permission needed.

### Gated permissions

A set of permissions unlock capabilities powerful enough that they need explicit install
consent. They are **grantable to any plugin**, but the user is always shown, in plain
language, exactly what they allow — and a plugin that declares one **always** prompts for
consent, even if install review is turned off. Declare them the same way as any other
permission.

They come in two tiers. The line is what the grant *exposes*, not whether the verb is a
read: `terminal:read` reads your content and `keychain:read` your secrets, while
`docker:read` reads a container list.

**Danger tier** — destructive, or exposes secrets and content:

| Permission | Unlocks |
|------------|---------|
| `terminal:read` | `terminal.readSnapshot/readSelection` — read a session's visible output and scrollback |
| `terminal:stream` | `terminal.onOutput` — watch a session's output live |
| `terminal:write` | `sessions.sendCommand` — send input / run commands in a session |
| `keychain:read` | `keychain.get` — read this plugin's own stored secrets |
| `keychain:write` | `keychain.set/delete` — store secrets in the OS keychain (namespaced per plugin) |
| `sftp:read` | `sftp.list/stat/readText` — read files on any host and on this machine |
| `sftp:write` | `sftp.writeText/mkdir/rename/delete/transfer` — write, move and delete those files |
| `vaults:write` | `vaults.create/rename/delete` — including a cascading delete of a vault's contents |
| `folders:write` | `folders.create/rename/delete` — folder deletion cascades |
| `audit:read` | `audit.query` — read this device's audit log |
| `mcp:contribute` | `mcp.registerTools` — expose tools to any connected AI agent |
| `ports:forward` | `ports.reach` — open a local tunnel to a published port |
| `processes:manage` | `processes.kill` |
| `docker:manage` | every mutating Docker verb, including `exec.open` |
| `proxmox:manage` | every mutating Proxmox verb, including `lxc.openShell` |

**Read-only tier** — still consented, but exposes only inventory and telemetry, and cannot change anything:

| Permission | Unlocks |
|------------|---------|
| `vaults:read` | `vaults.list` |
| `folders:read` | `folders.list` |
| `metrics:read` | `metrics.start/stop/onSnapshot/getSystemInfo` |
| `processes:read` | `processes.start/stop/onSnapshot` |
| `docker:read` | every Docker `list`/`services`/`checkUpdate` verb and all of `logs.*` |
| `proxmox:read` | `proxmox.lxc.list` and `snapshots.list` |

A consented plugin may read/watch/inject **any** session's I/O — the gate is honest consent
and the read-vs-write split, not per-session scoping. Reading terminal I/O and injecting
commands are separate permissions, so a plugin can ask to watch output without also asking
to type.
