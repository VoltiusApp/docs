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
- **Master password** — there is no recovery, and your Voltius Cloud data is encrypted with the same password. Use **Reset vault (deletes all local data)**, then restore from a Gist, S3 or Cloudflare sync target whose own passphrase you still know. If another of your devices without an account still has the data, [pair](../sync/local-network-pairing.md) the reset device with it: an empty device takes the group's data.

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

## Other devices never show as nearby

When [local network sync](../sync/local-network.md) lists your other devices as offline while they sit next to each other:

- **Same account or same group.** Both devices are signed into the same Voltius account, or [paired](../sync/local-network-pairing.md) into the same group. A device without an account that was never paired does not take part.
- **Not paused.** The **Local network** section of the sync menu says *Local sync paused* if this device is paused, and other devices show **Paused** for it.
- **macOS.** Allow Voltius under *System Settings → Privacy & Security → Local Network*. See [the one-time system prompt](../sync/local-network.md#the-one-time-system-prompt).
- **Windows.** Allow Voltius through *Windows Defender Firewall* for private networks. On a network Windows marks as *public*, it stays blocked: switch the network to private, or ask an administrator for a firewall rule.
- **Linux firewall.** A host firewall can block discovery and the connection. Allow UDP 5353 (mDNS) and TCP 47391, for example `sudo ufw allow 5353/udp && sudo ufw allow 47391/tcp`, or `sudo firewall-cmd --permanent --add-service=mdns --add-port=47391/tcp && sudo firewall-cmd --reload`.
- **Guest or hotel Wi-Fi.** Many guest networks isolate clients from each other, so no device can reach another. Use another network, or Tailscale.
- **VPN.** mDNS does not cross a VPN. Over Tailscale or another VPN, allow TCP 47391 between your devices. See [Tailscale and other VPNs](../sync/local-network.md#tailscale-and-other-vpns).
- **Android.** Local sync runs only while Voltius is open.

For pairing errors, see [Pair devices → Troubleshooting](../sync/local-network-pairing.md#troubleshooting).

## Device not listed or unreachable in SFTP

For [My devices](../connections/sftp.md#my-devices):

- Both devices are on the same Wi-Fi or LAN, or reach each other over Tailscale or another VPN.
- Voltius is open and signed into the same account on both, with the vault unlocked.
- **File access** is on in **Settings → Devices** on the computer you want to browse.
- On macOS, allow Voltius under *System Settings → Privacy & Security → Local Network*.
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
