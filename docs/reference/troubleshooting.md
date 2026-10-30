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

## Two-factor code is refused

- **Wait for the next code.** A code is accepted once; one you just used won't work again.
- **Check your phone's clock.** Codes depend on the time. Set date and time to automatic.
- **"Too many wrong codes"** means five in a row were wrong. The code step unlocks after 15 minutes.
- **Lost the authenticator?** Use a recovery code. See [Two-factor authentication](../sync/two-factor.md#if-you-lose-your-authenticator-or-passkey).

## Passkey step does not finish

- **The browser page says the request has expired.** The page works once and for five minutes. Go back to Voltius, choose **Cancel**, and start again.
- **The browser finished but Voltius is still waiting.** The browser sends the result back to Voltius on this device. Run the browser on the same computer as the app, not on another machine or through a remote desktop. A strict browser profile or extension that blocks pages from opening `127.0.0.1` can stop it too.
- **No passkey prompt appears, or the browser says it cannot use passkeys.** Use another browser, or sign in with a code or a recovery code instead.
- **"That passkey was not accepted."** The passkey you picked belongs to another account, or was removed from this one. Pick the right one or use another factor.
- **"Use a passkey" is not offered.** The account has no passkey, or the server does not offer them. See [Two-factor authentication](../sync/two-factor.md#turn-it-on-with-a-passkey).

## "Server error (428)" when signing in

The account has two-factor authentication on and this copy of Voltius is too old to ask for the code. Update to 0.54.0 or later.

## Plugin doesn't show up

- Check the plugin folder — `~/.config/voltius/plugins/<id>/` (Linux), `~/Library/Application Support/voltius/plugins/<id>/` (macOS), `%APPDATA%\voltius\plugins\<id>\` (Windows). `index.js` and `manifest.json` must both exist.
- **Settings → Plugins → Installed → Scan for local plugins** to pick it up without restarting (or **Reload plugin** on its row once it is listed).
- Plugin `api.log` messages are written to the app log prefixed `[plugin:<id>]` — see [Logs](#logs) below.

## SFTP transfer fails partway

Voltius retries idempotent operations. Repeated failures usually mean:

- Disk full on the destination.
- Server side TCP RST (firewall idle timeout) — split into smaller batches.

## Device not listed or unreachable in SFTP

For [My devices](../connections/sftp.md#my-devices):

- Both devices are on the same Wi-Fi or LAN, or both are on Tailscale.
- Voltius is open and signed into the same account on both, with the vault unlocked.
- **File access** is on in **Settings → Devices** on the computer you want to browse.
- On Windows, allow Voltius through the firewall on private networks when prompted.
- A newly started device can take a few seconds to show up.

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
