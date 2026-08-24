---
icon: lucide/download
---

# Install

Download from **[voltius.app](https://voltius.app#download)** or [GitHub releases](https://github.com/VoltiusApp/voltius/releases).

=== "Windows"

    **winget** (auto-updating):

    ```powershell
    winget install --id Voltius.Voltius -e
    ```

    SmartScreen may warn that the publisher is unverified (the app is not yet code-signed) — choose **More info → Run anyway**.

    **Or download an installer:**

    - `voltius_x.y.z_x64-setup.exe` — NSIS installer (recommended)
    - `voltius_x.y.z_x64_en-US.msi` — MSI for managed deployments

    ARM64 builds are published with an `aarch64` suffix.

=== "Linux"

    **Recommended — apt / dnf repository** (signed, and updated through your package manager):

    ```bash
    curl -fsSL https://repo.voltius.app/setup.sh | sudo bash
    ```

    This adds the Voltius repo and installs the app; afterwards it stays current via `sudo apt upgrade` / `sudo dnf upgrade`. Per-distro and manual steps are in the [README](https://github.com/VoltiusApp/voltius#-install). `amd64`/`x86_64` and `arm64`/`aarch64` are both provided.

    **Or download a single package:**

    - `.deb` (Debian/Ubuntu): `sudo apt install ./voltius_*.deb`
    - `.rpm` (Fedora/RHEL): `sudo dnf install ./voltius_*.rpm`
    - `.AppImage` (portable): `chmod +x voltius_*.AppImage && ./voltius_*.AppImage`

=== "macOS"

    **Recommended — Homebrew:**

    ```bash
    brew install --cask voltiusapp/voltius/voltius
    ```

    The app is ad-hoc signed but not notarized (no Apple Developer account yet), so macOS Gatekeeper warns on first launch — Control-click (right-click) `Voltius.app` and choose **Open**, then confirm. You only need to do this once.

    **Or download the `.dmg` for your chip:**

    - `Voltius_x.y.z_aarch64.dmg` — Apple Silicon (M1 and later)
    - `Voltius_x.y.z_x64.dmg` — Intel

    Open the `.dmg`, then drag `Voltius.app` into `/Applications`. On first launch, right-click `Voltius.app` → **Open**, or use **System Settings → Privacy & Security → Open Anyway**.

    !!! warning "\"Voltius.app is damaged and cannot be opened\""
        If macOS calls the app *damaged* (rather than showing the normal "unidentified developer" prompt), the copy picked up the quarantine flag — this applies to a Homebrew install as well as a downloaded `.dmg`. Strip the quarantine metadata and launch again:

        ```bash
        xattr -dr com.apple.quarantine /Applications/Voltius.app
        ```

    !!! warning "Don't download `voltius_darwin_*`"
        The extensionless `voltius_darwin_aarch64` / `voltius_darwin_x64` files are raw binaries for advanced/CLI use, not the app. macOS opens them as text if you double-click them — grab the `.dmg` instead.

## Auto-updates

Voltius checks for updates on launch and prompts you when one is ready. Updates are signed with a bundled minisign key — no opt-out.

Linux packages installed from the apt/dnf repository update through your system package manager instead (`apt upgrade` / `dnf upgrade`, including unattended upgrades).

## Build from source

AGPLv3. See [CONTRIBUTING.md](https://github.com/VoltiusApp/voltius/blob/main/CONTRIBUTING.md). Requires Node.js 24+, pnpm, Rust, and [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
git clone https://github.com/VoltiusApp/voltius
cd voltius && pnpm install && pnpm tauri build
```
