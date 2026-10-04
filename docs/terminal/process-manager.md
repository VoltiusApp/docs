---
icon: lucide/cpu
---

# Process manager

![The process manager listing remote processes](../assets/screenshots/process-manager.png){ .voltius-shot }
/// caption
The process manager — filter and sort remote processes by CPU or memory, and signal them.
///

A live `ps` table with a UI.

## Where

Right-side panel on any active session (Local, SSH, Docker exec). The panel auto-targets the session's host.

## Columns

| Column | Notes |
| --- | --- |
| Name | Process name |
| User | Owner |
| CPU | Percent of one core |
| MEM | Resident memory (K / M / G) |

Click any column to sort. The list refreshes every few seconds.

## Actions

Hover a row and click its ✕ button, then confirm with **Kill** (SIGTERM).

On mobile, tap a process for **Kill (SIGTERM)** or **Force kill (SIGKILL)**.

!!! warning
    The Process panel runs commands as the connected user. You can only kill what your user owns (unless you connected as `root`).
