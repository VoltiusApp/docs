---
icon: lucide/refresh-cw
---

# Persistent sessions

Voltius can keep your remote shell alive across network drops *and* full app
restarts by wrapping it in a tmux (or screen) session on the host.

## Enabling

Persistence is a per-host setting (edit host → **Persist session**), with a
global default in Settings → **Persistent Sessions**. The host needs `tmux`
(preferred) or `screen` installed; without either, the session opens normally
but won't survive disconnects.

## Surviving disconnects

When the connection drops, the remote process keeps running. Voltius
reconnects with backoff and re-attaches to the same multiplexer session.

## Surviving app restarts

With **Restore Workspace on Launch** enabled (Settings, on by default),
quitting or crashing the app does not lose your workspace: on the next launch
all tabs and split layouts reappear and reconnect automatically.

- Persistent SSH tabs re-attach to their still-running process, and recent
  scrollback is replayed into the terminal (tmux hosts only).
- Non-persistent SSH and local tabs come back as fresh shells (local shells
  reopen in their last working directory); serial tabs reopen their port.
- Closing a tab normally ends its remote session — only tabs that were open
  at quit time are restored.

If the host rebooted in the meantime, the tab reconnects to a fresh shell.

!!! warning
    Scrollback replay requires `tmux` on the host. Sessions using `screen`
    will re-attach but the terminal buffer will not be pre-filled.

## Cleanup

Disconnecting a tab kills its multiplexer session on the host. Sessions are
named `voltius_<id>` on a dedicated tmux socket — run `tmux -L voltius ls`
to inspect them manually.
