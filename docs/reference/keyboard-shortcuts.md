---
icon: lucide/keyboard
---

# Keyboard shortcuts

> Customize any of these in **Settings → Keybindings**.

`Ctrl` on Windows/Linux is `Cmd` on macOS.

## Global

| Shortcut | Action |
| --- | --- |
| ++ctrl+k++ | Open command palette |
| ++ctrl+comma++ | Open settings |
| ++ctrl+t++ | New local terminal |
| ++ctrl+n++ | New host |
| ++ctrl+shift+p++ | Plugins → Browse |
| ++ctrl+z++ | Undo |
| ++ctrl+shift+z++ / ++ctrl+y++ | Redo |

## Navigation

| Shortcut | Action |
| --- | --- |
| ++ctrl+1++ … ++ctrl+7++ | Switch to NavBar tab 1–7 |
| ++ctrl+tab++ | Next terminal tab |
| ++ctrl+shift+tab++ | Previous terminal tab |
| ++ctrl+w++ | Close current tab |

## Terminal

| Shortcut | Action |
| --- | --- |
| ++ctrl+shift+d++ | Split horizontal |
| ++ctrl+shift+e++ | Split vertical |
| ++ctrl+shift+b++ | Toggle broadcast |
| ++ctrl+shift+f++ | Find in terminal |
| ++ctrl+c++ | Copy selection — or send interrupt (see below) |
| ++ctrl+shift+c++ | Copy selection |
| ++ctrl+v++ / ++ctrl+shift+v++ | Paste |

### Copy & paste in the terminal

The terminal treats the clipboard differently from a text editor, so the usual
shortcuts keep working the way a shell expects:

- **++ctrl+c++ is context-aware.** With text selected, it copies the selection.
  With **no** selection, it falls through to the shell as the interrupt signal
  (`SIGINT`) — the same as pressing ++ctrl+c++ in any terminal. Use
  ++ctrl+shift+c++ when you always want to copy and never interrupt.
- **Copy on select.** Highlighting text with the mouse copies it automatically.
  Toggle this in **Settings → Terminal**.
- **Right-click pastes** the clipboard at the cursor.

## Undo & redo

Voltius keeps an undo history for changes you make to your data — hosts,
folders, SSH keys, identities, snippets, and team members. Press ++ctrl+z++ to
undo the last change and ++ctrl+shift+z++ (or ++ctrl+y++) to redo it. Up to 50
recent actions are remembered.

Text fields have their own undo stack: while typing in an input or text area,
++ctrl+z++ / ++ctrl+shift+z++ undo and redo your edits there instead.

> The terminal itself has no undo — ++ctrl+z++ inside a session is passed
> straight to the remote shell (job control / `SIGTSTP`).

## Within forms

| Shortcut | Action |
| --- | --- |
| ++ctrl+s++ | Save |
| ++esc++ | Close panel without saving |
| ++ctrl+enter++ | Save and connect |
