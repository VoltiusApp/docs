---
icon: lucide/refresh-cw
---

# Persistent sessions

Voltius can keep your remote shell alive across network drops *and* full app
restarts by wrapping it in a tmux (or screen) session on the host.

## Enabling

Persistence is a per-host setting (edit host → **Advanced** → **Persistent
session**: Inherit / On / Off), with a global default in Settings → **Hosts** →
**Persistent sessions** (on by default). The host needs `tmux`
(preferred) or `screen` installed; without either, the session opens normally
but won't survive disconnects.

## Surviving disconnects

When the connection drops, the remote process keeps running. Voltius
reconnects with backoff and re-attaches to the same multiplexer session.

## Surviving app restarts

With **Restore Workspace on Launch** enabled (on by default; toggle it from the
command palette — press ++ctrl+k++ and type "restore"),
quitting or crashing the app does not lose your workspace: on the next launch
all tabs and split layouts reappear and reconnect automatically.

- Persistent SSH tabs re-attach to their still-running process, and recent
  scrollback is replayed into the terminal.
- Non-persistent SSH and local tabs come back as fresh shells (local shells
  reopen in their last working directory); serial tabs reopen their port.
- Closing a tab normally ends its remote session — only tabs that were open
  at quit time are restored.

If the host rebooted in the meantime, the session is gone — its tab is
closed rather than silently reconnected to a fresh empty shell.

!!! note
    On hosts using `screen`, replayed scrollback is plain text — screen's dump
    drops colours. `tmux` replays it with colours.

## Live on other devices

Because the running process lives on the SSH host, any of your devices can
attach to it. With cloud sync active (Pro) and **Cross-Device Sessions**
enabled (on by default; toggle it from the command palette — press ++ctrl+k++
and type "cross-device"), the hosts page shows a **Live on other
devices** section listing live persistent sessions your other devices have
open — including devices that crashed or are powered off.

- Clicking a session joins it: the tab opens with scrollback replayed and
  the live process attached. The session stays open on the other device too
  — both terminals mirror each other in real time, and both can type.
- On tmux 3.2+ the terminal is sized to the smallest attached device
  (Voltius sets `window-size smallest`); older tmux and screen follow their
  own defaults.
- Closing the tab on one device never interrupts the others: the session is
  ended on the host only when the last device using it closes it.

Sessions appear only for hosts whose connection config exists on the joining
device.

Prefer to keep sessions private? Turn off **Cross-Device Sessions** from the
command palette: every device stops sharing its live sessions and stops listing the
others' — persistence and workspace restore keep working unchanged.

## Cleanup

Closing a tab kills its multiplexer session on the host — unless the session
is still open on another of your devices, in which case closing only detaches
this device. Sessions are named `voltius_<id>` on a dedicated tmux socket —
run `tmux -L voltius ls` to inspect them manually.
