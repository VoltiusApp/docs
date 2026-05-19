---
icon: lucide/life-buoy
---

# Troubleshooting

## "Connection refused" / hangs

- Is the host reachable? Try `ping` or `nc -zv host port` outside Voltius.
- Some networks drop ICMP — toggle **Disable ping** in the connection form.
- Behind a corporate proxy? SSH won't traverse HTTP proxies; you'll need a [jump host](../connections/jump-hosts.md) or SOCKS via [port forwarding](../terminal/port-forwarding.md).

## "Host key verification failed"

The remote's host key changed since you last connected. Either:

- Legitimate change (rebuild, key rotation) → **Known Hosts → Edit** the entry.
- Suspicious → resolve out-of-band before accepting.

See [Known hosts](../keychain/known-hosts.md).

## Vault won't unlock

- **OS keychain** — your OS user may have changed (different account, fresh install). Restore the keychain entry or re-import the vault.
- **Master password** — there is no recovery. If you have a sync target, restore from there.

## Plugin doesn't show up

- Check `$APP_DATA/plugins/<id>/` — `index.js` and `manifest.json` must both exist.
- **Settings → Plugins → Installed → Reload** to retry without restarting.
- Console shows `[plugin:<id>] ...` messages — open the dev console with ++ctrl+shift+i++.

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
| Windows | `%LOCALAPPDATA%\Voltius\logs\` |
| macOS | `~/Library/Logs/Voltius/` |
| Linux | `~/.local/share/Voltius/logs/` |

Attach the most recent log to bug reports.

## Still stuck

- [GitHub issues](https://github.com/VoltiusApp/voltius/issues) — bugs and feature requests.
- [Discussions](https://github.com/VoltiusApp/voltius/discussions) — questions, share-your-setup.
