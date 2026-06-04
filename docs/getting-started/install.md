---
icon: lucide/download
---

# Install

Download from **[voltius.app](https://voltius.app#download)** or [GitHub releases](https://github.com/VoltiusApp/voltius/releases).

> Screenshot placeholder — download picker.

=== "Windows"

    - `voltius_x.y.z_x64-setup.exe` — NSIS installer (recommended)
    - `voltius_x.y.z_x64_en-US.msi` — MSI for managed deployments

    ARM64 builds are published with an `aarch64` suffix.

=== "Linux"

    - `.deb` for Debian/Ubuntu: `sudo apt install ./voltius_*.deb`
    - `.AppImage` for everything else: `chmod +x voltius_*.AppImage && ./voltius_*.AppImage`

=== "macOS"

    Download the `.dmg` for your chip:

    - `Voltius_x.y.z_aarch64.dmg` — Apple Silicon (M1 and later)
    - `Voltius_x.y.z_x64.dmg` — Intel

    Open the `.dmg`, then drag `Voltius.app` into `/Applications`. On first launch: **System Settings → Privacy & Security → Open Anyway**.

    !!! warning "Don't download `voltius_darwin_*`"
        The extensionless `voltius_darwin_aarch64` / `voltius_darwin_x64` files are raw binaries for advanced/CLI use, not the app. macOS opens them as text if you double-click them — grab the `.dmg` instead.

## Auto-updates

Voltius checks for updates on launch and prompts you when one is ready. Updates are signed with a bundled minisign key — no opt-out.

## Build from source

AGPLv3. See [CONTRIBUTING.md](https://github.com/VoltiusApp/voltius/blob/main/CONTRIBUTING.md). Requires Node.js 24+, pnpm, Rust, and [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
git clone https://github.com/VoltiusApp/voltius
cd voltius && pnpm install && pnpm tauri build
```
