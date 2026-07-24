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
| `description` | no | Short description shown in the marketplace. |
| `permissions` | yes | List of capabilities your plugin needs. See [Permissions](api-reference.md#permissions). |
| `defaultEnabled` | no | `true` only for first-party bundled plugins. Leave unset or `false` for marketplace plugins. |
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
    // cleanup: called when plugin is disabled or app closes
  };
}
```

The cleanup function is optional but recommended if you set up subscriptions, intervals, or event listeners.

---

## Build

Bundle everything into a single `index.js`. esbuild is the easiest option:

```bash
npm install --save-dev esbuild
npx esbuild src/index.ts \
  --bundle \
  --platform=browser \
  --format=esm \
  --external:react \
  --external:react-dom \
  --outfile=dist/index.js
```

React is externalized because it's provided by the host app.

A minimal `package.json`:

```json
{
  "name": "voltius-plugin-my-plugin",
  "version": "1.0.0",
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=browser --format=esm --external:react --external:react-dom --outfile=dist/index.js"
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
    - **Windows:** `%APPDATA%\Voltius\`
    - **macOS:** `~/Library/Application Support/Voltius/`
    - **Linux:** `~/.config/Voltius/`

3. Create the plugin folder:
   ```
   $APP_DATA/plugins/my-plugin/
   ├── manifest.json
   └── index.js
   ```

4. Start Voltius — your plugin loads automatically on the next startup.

5. To reload after changes: go to **Settings → Plugins → Installed** and click **Reload**. No restart needed.

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
        fontFamily: "JetBrains Mono",
        fontSize: 13,
        ui: { background: "#1e1e2e", foreground: "#cdd6f4" /* ... */ },
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

3. **Submit a PR** to [VoltiusApp/marketplace](https://github.com/VoltiusApp/marketplace) adding an entry to `plugins.json`:

    ```json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "author": "acme",
      "description": "What it does in one sentence.",
      "repo": "acme/voltius-plugin-my-plugin",
      "version": "1.0.0",
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
    | `repo` | yes | `owner/repo` on GitHub, or a direct URL to the bundle |
    | `version` | yes | Latest release version |
    | `minAppVersion` | no | Minimum Voltius version required |
    | `tags` | yes | 1–5 lowercase tags for filtering |
    | `theme` | yes | `true` if this is a theme-only plugin |

**Review criteria:** manifest `id` matches `plugins.json` entry, plugin loads without errors, declared permissions match what the code uses, description is accurate and in English, no malicious or deceptive behavior.

!!! note "Content-hash binding (rolling out)"
    Voltius verifies a downloaded bundle against a **content hash** recorded in the marketplace listing, so the reviewed artifact is the one that runs on users' machines. The hash is bound by the marketplace at review time — you don't add it yourself. Until a listing has one, its installs show as *Unverified* in the app. Because a new release changes the bundle, shipping an update means the hash is re-bound through the same review — plan to re-submit when you cut a release.

---

## What PluginAPI covers

`PluginAPI` is the **supported, stable** surface — the part we keep working across releases and that the host renders and gates consistently. It deliberately does **not** expose:

- Active SSH session I/O or terminal output streams
- Keystroke injection into a terminal channel
- SSH tunnels (`direct-tcpip`)
- Another plugin's vault secrets, or the core vault directly

These are scope decisions about what the supported API includes — **not a security sandbox**. A plugin is JavaScript in the app's own process, so it runs with the app's privileges, the same as a VS Code or Obsidian extension. What protects a user is the marketplace review and their decision to install, not a runtime boundary. Build against `PluginAPI`: it's the interface we support, it survives upgrades, and its declared permissions are what the user sees at install time. Anything reached outside it is unsupported and may break without notice.

---

## Sync plugin exclusivity

Only one sync plugin can be active at a time. If your plugin implements sync, declare `"syncPlugin": true` in `manifest.json`. The runtime enforces that at most one sync plugin is enabled — activating yours automatically disables the currently active sync plugin after exporting its data.
