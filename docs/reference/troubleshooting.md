---
icon: lucide/life-buoy
---

# Troubleshooting

## "The host refused the connection" / "Host still unreachable"

- Is the host reachable? Try `ping` or `nc -zv host port` outside Voltius.
- A grey or red status dot only means the TCP probe of the SSH port failed; it never blocks connecting. Turn it off per host with **Disable reachability check** in the host's right-click menu.
- Behind a corporate proxy? Set it in **Settings → Hosts → Proxy** (System, SOCKS5, HTTP or HTTPS), or per host under **Proxy** in the connection form. A [jump host](../connections/jump-hosts.md) also works.

## "HOST KEY CHANGED"

The remote's host key changed since you last connected. Either:

- Legitimate change (rebuild, key rotation) → click **Replace** in the prompt, or delete the entry under **Known Hosts** and reconnect.
- Suspicious → resolve out-of-band before accepting.

See [Known hosts](../keychain/known-hosts.md).

## Vault won't unlock

- **OS keychain** — if the key stored on this machine no longer matches (different OS user, fresh install), the unlock screen offers **Set aside and start fresh** (keeps a backup copy) or restoring one of the listed backups.
- **Master password** — there is no recovery, and your Voltius Cloud data is encrypted with the same password. Use **Reset vault (deletes all local data)**, then restore from a Gist, S3 or Cloudflare sync target whose own passphrase you still know.

## Plugin doesn't show up

- Check the plugin folder — `~/.config/voltius/plugins/<id>/` (Linux), `~/Library/Application Support/voltius/plugins/<id>/` (macOS), `%APPDATA%\voltius\plugins\<id>\` (Windows). `index.js` and `manifest.json` must both exist.
- **Settings → Plugins → Installed → Scan for local plugins** to pick it up without restarting (or **Reload plugin** on its row once it is listed).
- Plugin `api.log` messages are written to the app log prefixed `[plugin:<id>]` — see [Logs](#logs) below.

## SFTP transfer fails partway

Voltius retries idempotent operations. Repeated failures usually mean:

- Disk full on the destination.
- Server side TCP RST (firewall idle timeout) — split into smaller batches.

## "Permission denied" on Linux serial port

```bash
sudo usermod -aG dialout $USER
```

Log out and back in.

## Logs

The desktop client writes logs to:

| OS | Path |
| --- | --- |
| Windows | `%LOCALAPPDATA%\com.voltius.app\logs\voltius.log` |
| macOS | `~/Library/Logs/com.voltius.app/voltius.log` |
| Linux | `~/.local/share/com.voltius.app/logs/voltius.log` |

Attach the most recent log to bug reports, or use **Settings → Diagnostics → Create bug report**, which bundles the logs and system info (with sensitive values removed) into a file you can share.

## Still stuck

- [GitHub issues](https://github.com/VoltiusApp/voltius/issues) — bugs and feature requests.
- [Discussions](https://github.com/VoltiusApp/voltius/discussions) — questions, share-your-setup.
