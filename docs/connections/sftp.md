---
icon: lucide/folder-tree
---

# SFTP

![The two-pane SFTP file manager, local files on the left and a remote host on the right](../assets/screenshots/sftp-dual-pane.png){ .voltius-shot }
/// caption
Two-pane SFTP — drag files between local and remote, or host to host.
///

Two-pane file manager over SSH. Any pane can be **local** or a **remote host** — drag files between them.

## Opening it

- From a host card → **Open in SFTP**.
- From a live session → the **SFTP** section of the terminal's side panel, or the **SFTP** button in the title bar.
- Files you edit open as tabs inside the SFTP view, next to the **Files** tab.

## Panes

Each pane is independent — click the pane header to swap targets without closing the tab.

## Drag & drop

| From → To | Action |
| --- | --- |
| Local → Remote | Upload |
| Remote → Local | Download |
| Local → Local | Copy (direct filesystem copy) |
| Remote A → Remote B | Host-to-host (streamed via Voltius, never your disk) |
| OS file manager → Voltius | Upload |

## Tar acceleration

Directory and multi-file transfers are slow over plain SFTP — every file is its own open, write, and close round trip. With **SFTP Tar Acceleration** on (the default), Voltius packs a directory or batch selection into a single temporary `.tar.gz`, transfers that, and extracts it on the other side. One stream instead of thousands of round trips, applied to uploads, downloads, and host-to-host transfers alike. Single files always use the direct path.

!!! note "Automatic fallback"
    Tar acceleration needs `tar` on each host it touches. Voltius checks first, so any transfer involving a host without `tar` quietly falls back to plain recursive SFTP — nothing fails, it just runs the per-file way.

Turn it off (**Settings → SFTP → Transfers → Tar acceleration**) if a host has tight temporary space or you want predictable per-file behavior. For the engineering details, see [How Voltius Speeds Up SFTP with Tar Acceleration](https://voltius.app/blog/sftp-tar-acceleration).

## Transfer queue

![The SFTP transfer queue with two downloads in progress and one failed item](../assets/screenshots/sftp-transfer-queue.png){ .voltius-shot }
/// caption
The transfer queue — live progress, speed, and ETA per item, with a failed transfer showing its error. Retry or cancel.
///

Retry or cancel each transfer, cancel all, or clear finished ones. Conflicts open a **File already exists** dialog with **Skip / Skip All / Overwrite / Overwrite All**.

!!! tip "Edit in place"
    Right-click a file → **Edit** (or double-click it). It opens in Voltius's built-in editor; ++ctrl+s++ writes it back to the host (or turn on **Auto-save**).
