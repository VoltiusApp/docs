---
icon: lucide/folder-tree
---

# SFTP

> Screenshot placeholder — dual-pane SFTP view with a transfer queue.

Two-pane file manager over SSH. Any pane can be **local** or a **remote host** — drag files between them.

## Opening it

- From a host card → **SFTP** action.
- From a live session → **SFTP** button on the terminal tab.
- Multiple SFTP tabs can be open at once.

## Panes

Each pane is independent — click the pane header to swap targets without closing the tab.

## Drag & drop

| From → To | Action |
| --- | --- |
| Local → Remote | Upload |
| Remote → Local | Download |
| Remote A → Remote B | Host-to-host (streamed via Voltius, never your disk) |
| OS file manager → Voltius | Upload |
| Voltius → OS file manager | Download |

## Transfer queue

> Screenshot placeholder — transfer queue with paused / running / failed items.

Pause, resume, retry, cancel. Conflicts open a dialog with **Overwrite / Skip / Rename / Apply to all**.

!!! tip "Edit in place"
    Right-click a remote file → **Open in editor**. Voltius downloads it, watches for changes, and re-uploads on save.
