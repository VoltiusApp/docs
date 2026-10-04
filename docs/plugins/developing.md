---
icon: lucide/code
---

# Developing plugins

A Voltius plugin is a **single bundled JavaScript file** (`index.js`) plus a `manifest.json`. Zero Rust required.

```
my-plugin/
├── manifest.json
├── src/
│   └── index.ts
├── package.json
└── tsconfig.json
```

!!! tip
    For the user-facing side of plugins (installing, enabling, custom repos), see [Installing plugins](installing.md) and [Custom repos](custom-repos.md).

---

## Getting started

The quickest start is the [plugin template](https://github.com/VoltiusApp/voltius-plugin-template): a
working right-panel plugin with the build flags already correct, a `contributes.configuration`
setting, and a check that fails the build if you import something the host can't provide.

Starting from scratch instead, install the API types you compile against:

```sh
npm install --save-dev @voltius/plugin-types
```

Its version tracks the app — `@voltius/plugin-types@0.15.0` describes the API Voltius 0.15.0
exposes. Install the version matching the oldest release you support, and keep `minAppVersion` in
your manifest in step with it. The same install also covers the `@voltius/ui` types.

---

## Manifest

`manifest.json` describes your plugin to the runtime:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What your plugin does.",
  "permissions": ["connections:read", "http", "notifications"],
  "defaultEnabled": false,
  "contributes": {
    "configuration": {
      "apiKey": {
        "type": "string",
        "default": "",
        "description": "Your API key",
        "secret": true
      },
      "pollInterval": {
        "type": "number",
        "default": 30,
        "min": 5,
        "max": 3600,
        "label": "Poll interval (seconds)",
        "description": "How often to poll the upstream API."
      }
    }
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique identifier. Use `kebab-case`. Must match the folder name when installed locally. |
| `name` | yes | Human-readable name shown in the UI. |
| `version` | yes | Semver string. |
| `description` | no | Short description shown in the Installed list. The Browse tab shows the `description` from your `plugins.json` entry instead. |
| `minAppVersion` | no | Oldest Voltius version your plugin runs on. Installs are gated on the `minAppVersion` in your `plugins.json` entry, which is not copied from the manifest, so set the same value in both. Raise it when you start using a newly added API. |
| `permissions` | yes | List of capabilities your plugin needs. See [Permissions](api-reference.md#permissions). |
| `defaultEnabled` | no | Only read for plugins bundled with the app, where unset means enabled. Ignored for marketplace and local plugins: installing one is the opt-in, so it starts enabled. |
| `contributes.configuration` | no | Declarative settings schema. See [Configuration schema](#configuration-schema). |

---

## Configuration schema

`contributes.configuration` is a map of **setting key → field definition**. Declaring it is the **preferred way to expose settings**: the host renders the form itself in **Settings → Plugins**, so spacing, controls, and save behaviour stay consistent across every plugin — you don't build (or style) any UI. Values are stored in plugin-scoped storage under the same key, readable from your code via `api.storage.get(key)` and written by the host's form. Defaults are applied on first load.

Each field:

| Field | Required | Applies to | Description |
|-------|----------|-----------|-------------|
| `type` | yes | all | `"string"`, `"number"`, `"boolean"`, or `"select"`. |
| `default` | yes | all | Initial value, applied on first load. |
| `description` | yes | all | Help text shown under the control. |
| `label` | no | all | Overrides the field label. **By default the host derives a readable label from the key** (`pollInterval` → "Poll Interval", `auto_check` → "Auto Check"), so you only set this when the derived text is wrong — e.g. acronyms or unit hints (`"Poll interval (seconds)"`). |
| `options` | for `select` | `select` | Allowed string values. |
| `secret` | no | `string` | Render as a password input. |
| `min` / `max` | no | `number` | Bounds — enforced as input attributes **and** clamped on save. Omit for an unbounded number. |

Writes through `api.storage.set(key, value)` are type-checked against the declared field.

!!! tip "Prefer this over a custom settings page"
    `ui.registerSettingsPage` still exists for genuinely bespoke UIs, but a custom page is yours to keep consistent with the rest of the app — and it won't track theme or layout changes automatically. Reach for the declarative schema first; only register a page when your settings can't be expressed as a flat list of fields.

---

## Entry point

Export a single `register` function as the default export:

```typescript
import type { PluginAPI } from "@voltius/plugin-types";

export default function register(api: PluginAPI): (() => void) | void {
  // setup...

  return () => {
    // cleanup: called when the plugin is disabled, reloaded or uninstalled (not at app quit — use api.lifecycle.onBeforeQuit for that)
  };
}
```

The cleanup function is optional but recommended if you set up subscriptions, intervals, or event listeners.

---

## Build

Bundle everything into a single `index.js`, externalizing exactly the six modules the host
provides. esbuild is the easiest option:

```bash
npm install --save-dev esbuild
npx esbuild src/index.ts \
  --bundle \
  --platform=browser \
  --format=esm \
  --external:react \
  --external:react/jsx-runtime \
  --external:react-dom \
  --external:@iconify/react \
  --external:@voltius/ui \
  --external:@voltius/api \
  --outfile=dist/index.js
```

### Why each one

Externalizing is not an optimization — the host rewrites these six imports to its own live
instances when it loads your bundle. Shipping your own copy of one is the usual cause of a
plugin that loads without error and then misbehaves.

| Module | What happens if you bundle your own copy |
|---|---|
| `react`, `react/jsx-runtime`, `react-dom` | A second React instance has a null hook dispatcher, so **every hook throws**. `react/jsx-runtime` matters whenever your tsconfig uses the automatic JSX transform — the default in most modern setups. |
| `@iconify/react` | You get your own icon storage, so the host's hand-written collections (`devicon`, `simple-icons`, `custom`) are invisible to you. Those icons render as an **empty `<span>` — no error, no fallback.** |
| `@voltius/ui` | You lose the host's own components, so your UI stops matching the app. |
| `@voltius/api` | Types only at runtime, but keep it external so your bundle carries no stale copy. |

`@voltius/ui` gives you a few host components so your plugin looks native rather than
approximating the app's styling:

```ts
import { Icon, InfoTooltip, BottomSheet, useAutosave } from "@voltius/ui";
```

`Icon` is Iconify's, re-exported against the host's icon storage — prefer it over importing
`@iconify/react` yourself. `BottomSheet` is the mobile sheet, including its drag-to-dismiss and
viewport handling, which is genuinely awkward to reimplement.

### Everything else must be bundled

Those six are the **only** bare imports allowed. Any other bare specifier — `lodash`,
`date-fns`, anything — is rejected at load time and the plugin does not load at all:

```
Plugin bundle imports disallowed specifier: "lodash"
```

Bundle your dependencies (esbuild does this by default) or drop them. Relative `./` and `../`
imports pass this check, but the bundle is loaded from a `blob:` URL with no sibling files, so emit everything into the single `index.js` (no code splitting). A dynamic `import()` whose argument is not a literal string is also rejected,
since a reviewed, hash-verified bundle must not be able to pull in code nobody reviewed.

A minimal `package.json`:

```json
{
  "name": "voltius-plugin-my-plugin",
  "version": "1.0.0",
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=browser --format=esm --external:react --external:react/jsx-runtime --external:react-dom --external:@iconify/react --external:@voltius/ui --external:@voltius/api --outfile=dist/index.js"
  },
  "devDependencies": {
    "esbuild": "^0.21.0"
  }
}
```

---

## Local development

1. Build your plugin: `npm run build` → `dist/index.js`

2. Find your app data directory:
    - **Windows:** `%APPDATA%\voltius\`
    - **macOS:** `~/Library/Application Support/voltius/`
    - **Linux:** `~/.config/voltius/`

3. Create the plugin folder:
   ```
   $APP_DATA/plugins/my-plugin/
   ├── manifest.json
   └── index.js
   ```

4. Start Voltius — your plugin loads automatically on the next startup.

5. To reload after changes: in **Settings → Plugins → Installed**, click **Scan for local plugins** once so the plugin is listed as **Local**, then use its **Reload plugin** button. No restart needed.

---

## Examples

=== "SSH config importer"

    ```typescript
    import type { PluginAPI } from "@voltius/plugin-types";

    export default function register(api: PluginAPI) {
      if (!api.isActive()) return;

      const unregister = api.omni.register({
        id: "import-ssh-config",
        label: "Import ~/.ssh/config",
        icon: "lucide:file-input",
        section: "Import",
        async execute() {
          const raw = await api.fs.readText(".ssh/config");
          const hosts = parseSshConfig(raw);
          const existing = await api.connections.list();

          const toImport = hosts.filter(
            (h) => !existing.some((e) => e.host === h.host && e.username === h.username)
          );

          if (toImport.length === 0) {
            api.notifications.toast("No new hosts found", { severity: "info" });
            return;
          }

          const progress = api.notifications.progress(`Importing ${toImport.length} hosts…`);
          try {
            await api.connections.bulkImport(toImport);
            progress.finish(`Imported ${toImport.length} hosts`);
          } catch (e) {
            progress.error(String(e));
          }
        },
      });

      return () => unregister();
    }
    ```

=== "Theme plugin"

    ```typescript
    import type { PluginAPI } from "@voltius/plugin-types";

    export default function register(api: PluginAPI) {
      if (!api.isActive()) return;

      api.themes.register({
        id: "catppuccin-mocha",
        name: "Catppuccin Mocha",
        builtIn: false,
        uiFontFamily: "'Inter Variable', system-ui, sans-serif",
        uiFontSize: 13,
        terminalFontFamily: "JetBrains Mono",
        terminalFontSize: 13,
        ui: { bgBase: "#1e1e2e", textPrimary: "#cdd6f4" /* ... */ },
        terminal: { background: "#1e1e2e", foreground: "#cdd6f4" /* ... */ },
      });

      return () => api.themes.unregister("catppuccin-mocha");
    }
    ```

=== "Side panel"

    ```typescript
    import type { PluginAPI } from "@voltius/plugin-types";

    export default function register(api: PluginAPI) {
      if (!api.isActive()) return;

      const cleanups: Array<() => void> = [];

      cleanups.push(
        api.ui.registerRightPanelSection({
          id: "docker-panel",
          label: "Docker",
          icon: "logos:docker-icon",
          component: DockerPanel,
        })
      );

      cleanups.push(
        api.lifecycle.onConnectionEstablished((conn) => {
          api.log.info(`Connection established: ${conn.host}`);
        })
      );

      return () => cleanups.forEach((fn) => fn());
    }
    ```

---

## Publishing

1. **Create a GitHub repo** for your plugin (e.g. `acme/voltius-plugin-my-plugin`).

2. **Create a GitHub Release** with two assets attached:
   - `index.js` — your compiled bundle
   - `manifest.json` — your plugin manifest

   The marketplace fetches `https://github.com/{owner}/{repo}/releases/latest/download/index.js` and `manifest.json` automatically.

3. **Submit a PR** to [VoltiusApp/marketplace](https://github.com/VoltiusApp/marketplace) adding an entry to `plugins.json`. Run `node scripts/stamp-hashes.mjs` in the marketplace checkout to fill in `hash` and `permissions`; CI runs it with `--check`:

    ```json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "author": "acme",
      "description": "What it does in one sentence.",
      "repo": "acme/voltius-plugin-my-plugin",
      "version": "1.0.0",
      "hash": "<filled in by node scripts/stamp-hashes.mjs>",
      "permissions": ["connections:read", "http", "notifications"],
      "minAppVersion": "0.1.0",
      "tags": ["productivity", "import"],
      "theme": false
    }
    ```

    For theme plugins, set `"theme": true`.

    | Field | Required | Description |
    |-------|----------|-------------|
    | `id` | yes | Must match `manifest.json` `id` |
    | `name` | yes | Display name |
    | `author` | yes | GitHub username or org |
    | `description` | yes | One sentence |
    | `repo` | yes | `owner/repo` on GitHub, or an `http(s)` base URL that serves `manifest.json` and `index.js` |
    | `version` | yes | Latest release version |
    | `hash` | yes | SHA-256 of the served `index.js`; written by `node scripts/stamp-hashes.mjs` |
    | `permissions` | yes | Must equal the manifest's `permissions`; written by `stamp-hashes.mjs` |
    | `minAppVersion` | no | Minimum Voltius version required |
    | `tags` | yes | 1–5 lowercase tags for filtering |
    | `theme` | no | `true` if this is a theme-only plugin |
    | `icon` | no | Iconify name from a bundled set (`lucide:`, `simple-icons:`, `custom:`, `devicon:`, `devicon-plain:`) |

**Review criteria** (see the marketplace's [CONTRIBUTING.md](https://github.com/VoltiusApp/marketplace/blob/main/CONTRIBUTING.md#reviewer-checklist)): `id` and `version` match `manifest.json`, the `verify` check is green, no third-party trademark in the name, every declared permission is justified by the description and actually used, any gated permission comes with published, readable source, network egress alongside a gated read has a stated reason, and nothing is deceptive or malicious.

!!! note "Content-hash binding"
    Voltius verifies a downloaded bundle against the **content hash** in your marketplace entry, so the reviewed artifact is the one that runs on users' machines; a mismatching bundle is refused. `stamp-hashes.mjs` writes the hash into your entry before you open the PR. An entry without a hash installs as *Unverified*. Because a new release changes the bundle, a `releases/latest` listing stops installing until you re-stamp and re-submit — plan to do that each time you cut a release.

---

## What PluginAPI covers

`PluginAPI` is the **supported, stable** surface — the part we keep working across releases and that the host renders and gates consistently. Its most sensitive parts — terminal output, keystroke injection, port-forward tunnels, the OS keychain, full-state export — sit behind [gated](api-reference.md#gated-permissions) permissions that need the user's explicit consent at install. It never exposes another plugin's `vault` secrets.

These are scope decisions about what the supported API includes — **not a security sandbox**. A plugin is JavaScript in the app's own process, so it runs with the app's privileges, the same as a VS Code or Obsidian extension. What protects a user is the marketplace review and their decision to install, not a runtime boundary. Build against `PluginAPI`: it's the interface we support, it survives upgrades, and its declared permissions are what the user sees at install time. Anything reached outside it is unsupported and may break without notice.

---

## Sync providers

A plugin that syncs the user's data declares `sync:write`, publishes its state under `"sync-state"` and exposes `syncNow`. Several providers can be active at once. See [Building a sync provider](sync-providers.md).
