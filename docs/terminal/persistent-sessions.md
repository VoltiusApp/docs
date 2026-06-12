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

If the host rebooted in the meantime, the session is gone — its tab is
closed rather than silently reconnected to a fresh empty shell.

!!! warning
    Scrollback replay requires `tmux` on the host. Sessions using `screen`
    will re-attach but the terminal buffer will not be pre-filled.

## Live on other devices

Because the running process lives on the SSH host, any of your devices can
attach to it. With cloud sync active (Pro) and **Cross-Device Sessions**
enabled (Settings, on by default), the hosts page shows a **Live on other
devices** section listing live persistent sessions your other devices have
open — including devices that crashed or are powered off.

- Clicking a session joins it: the tab opens with scrollback replayed and
  the live process attached. The session stays open on the other device too
  — both terminals mirror each other in real time, and both can type.
- The terminal renders at the size of whichever device typed last (tmux
  3.1+; older tmux and screen share the smallest attached size).
- Closing the tab on one device never interrupts the others: the session is
  ended on the host only when the last device using it closes it.

Sessions appear only for hosts whose connection config exists on the joining
device.

Prefer to keep sessions private? Turn off **Cross-Device Sessions** in
Settings: every device stops sharing its live sessions and stops listing the
others' — persistence and workspace restore keep working unchanged.

## Cleanup

Closing a tab kills its multiplexer session on the host — unless the session
is still open on another of your devices, in which case closing only detaches
this device. Sessions are named `voltius_<id>` on a dedicated tmux socket —
run `tmux -L voltius ls` to inspect them manually.
