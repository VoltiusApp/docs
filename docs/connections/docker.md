---
icon: lucide/container
---

# Docker

> Screenshot placeholder — Docker side panel with containers listed.

Manage containers and `exec` into them as terminals — locally or on a remote host.

## Where

The **Docker** panel sits in the right-side rail on any active session. It auto-connects to:

- **Local** — your machine's Docker daemon.
- **Remote** — the connected host's Docker, over the existing SSH channel (no extra port forward).

## What you can do

| Action | How |
| --- | --- |
| Exec a shell in a container | Click row → **Exec** |
| Start / stop / restart | Right-click → action |
| Tail logs | Click → **Logs** |
| Scope | Header dropdown — All / Running / Stopped |

Exec terminals open as normal tabs — same split, broadcast, snippets.

!!! tip
    For remote hosts, no Docker context switching needed — Voltius proxies the Docker API over SSH.
