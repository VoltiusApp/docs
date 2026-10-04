---
icon: lucide/keyboard
---

# Keyboard shortcuts

> Customize the rebindable ones in **Settings → Shortcuts** (++ctrl+space++ opens it).

`Ctrl` on Windows/Linux is `Cmd` on macOS.

## Global

| Shortcut | Action |
| --- | --- |
| ++ctrl+k++ | Open command palette |
| ++ctrl+shift+p++ / ++f1++ | Open command palette (fixed aliases) |
| ++ctrl+comma++ | Open settings |
| ++ctrl+space++ | Keyboard shortcut settings |
| ++ctrl+b++ | Toggle sidebar |
| ++ctrl+z++ | Undo |
| ++ctrl+shift+z++ / ++ctrl+y++ | Redo |

## Navigation

| Shortcut | Action |
| --- | --- |
| ++ctrl+t++ | New tab (opens the Hosts view) |
| ++ctrl+tab++ | Next terminal tab |
| ++ctrl+shift+tab++ | Previous terminal tab |
| ++ctrl+w++ | Close current tab |
| ++ctrl+f++ | Focus the list filter (outside the terminal) |
| ++del++ | Delete selected items |
| ++ctrl+c++ / ++ctrl+x++ / ++ctrl+v++ | Copy / cut / paste items on the Hosts, Keychain, Port Forwarding and Snippets pages |

## Terminal

| Shortcut | Action |
| --- | --- |
| ++ctrl+shift+d++ | Duplicate session (new tab on the same host) |
| ++ctrl+alt+d++ | Duplicate into a split beside the current terminal |
| ++ctrl+shift+enter++ | Maximize / restore the current split pane |
| ++ctrl+shift+arrow-left++ (and the other arrows) | Focus the neighbouring split pane |
| ++ctrl+f++ | Find in terminal |
| ++ctrl+shift+h++ / ++ctrl+shift+s++ / ++ctrl+shift+t++ / ++ctrl+shift+n++ | Open the History / Snippets / Themes / Notes panel |
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
| ++ctrl+s++ | Save (SFTP file editor). Host and key forms save automatically. |
| ++esc++ | Close the side panel (when focus is not in a field). Changes are already saved. |
