---
icon: lucide/arrow-left-right
---

# Port forwarding

![The Ports panel listing active port forwards in a live SSH session](../assets/screenshots/port-forwarding.png){ .voltius-shot }
/// caption
The Ports panel — auto-detected and manually created forwards, live. Type a port to forward one.
///

Three tunnel types, mapped to the OpenSSH equivalents.

## Tunnel types

=== "Local (`-L`)"

    **Open something from the SSH server on your machine.**

    `localhost:3000` on your computer → `127.0.0.1:3000` on the server.

    Use case: reach a service that only listens on the server's loopback.

=== "Remote (`-R`)"

    **Expose something from your machine on the SSH server.**

    The server listens on a port and forwards traffic back to you.

    Use case: share a local dev server with a teammate via a bastion.

=== "Dynamic (`-D`)"

    **SOCKS5 proxy on your machine.**

    Point a browser or app at `localhost:1080` to route all its traffic through the SSH server.

    Use case: browse as if from inside the server's network.

## Creating a rule

**Port Forwarding** page → **+ New Rule**. Pick a type and the ports, then under **Scope** → **Apply to** choose **All connections** or **Specific connections**.

## Running

Each rule card has a play/pause button (**Resume forwarding** / **Pause forwarding**) and a live status dot. Auto-detected and ad-hoc forwards appear per host in the **Active session forwards** section at the top of the page.

!!! tip "Rules start automatically"
    Every rule comes up whenever an SSH session to a host in its scope connects. Use the card's pause button to stop a running rule.
