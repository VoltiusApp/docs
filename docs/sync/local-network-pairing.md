---
icon: lucide/link
---

# Pair devices without an account

Devices that are not signed in to a Voltius account can still sync with each other over the local network. You pair them once by comparing a 6-digit code on both screens. After that they stay in step whenever they are on the same network.

Pairing is **free on every plan**. If your devices are signed in to a Voltius account, you do not need it: they [sync automatically](local-network.md) with the other devices on the account.

## Pair two devices

**Pair a device** is shown only on installs without a Voltius account. You find it in two places:

- the **Local network** section of the title-bar sync menu
- **Settings → Sync**

1. Put both devices on the same network.
2. Open **Pair a device** on both. A device can be paired only while this sheet is open, and the window closes by itself after 5 minutes. Outside it, a device without an account is invisible to other Voltius installs.
3. Both screens show the same 6-digit code. Compare them. You never type it.
4. If the codes match, tap **Codes match** on both devices. Each screen shows when the other has confirmed.
5. The first sync starts straight away.

If the codes differ, or either side taps **Cancel**, the attempt ends on both screens. After 5 failed attempts the pairing window closes with a "too many attempts" message. Open **Pair a device** again to retry.

!!! tip "The other device is signed in?"
    A device with a Voltius account cannot be paired. Sign in on this device with the same account instead and the two sync automatically.

## What pairing does to your data

Paired devices form one **group** that shares one vault. Pairing makes the joining device use the group's vault.

- **The joining device is empty.** It takes the group's data without asking.
- **The joining device already has data.** It asks what to do:
    - **Combine both** (the default) merges the two vaults. If you added the same server separately on each device, it shows up twice.
    - **Use *name*'s data** replaces the joining device's vault with the other device's.

If you use a master password, the joining device keeps its own. It does not take over the other device's password.

### Groups of more than two devices

A device that pairs with any member of a group is trusted by all of them. If A pairs with B and B pairs with C, A and C sync with each other too, with no extra pairing.

Two devices that already belong to different groups cannot be paired with each other. Forget one of them from its group first, then pair again.

## Forget a device

Every device in the **Local network** list has a **Forget** button. What it does depends on how the devices are linked.

| Devices are... | Forget does |
| --- | --- |
| On the same Voltius account | Stops local sync with that device, **on this device only**. It keeps syncing through Voltius Cloud. To remove it fully, sign out on that device. |
| Paired without an account | Removes the device from the group and rotates the group's secret. The device keeps what it already has and receives nothing new. |

Forgetting a paired device cannot be undone. To sync with it again, pair it again.

The other members of the group get the new secret the next time they are reachable from any member.

### "Can't verify this device"

A device showing **Can't verify this device** has changed its identity since you last paired. Voltius stops syncing with it until you forget it.

Forgetting it lets whichever device now holds that name pair with you again. Do this only if you recognise the device, for example after you reinstalled Voltius on it.

## Moving a device to a Voltius account

Creating a Voltius account or signing in to one takes that device out of its group. The other devices list it as **Moved to a Voltius account — sign in there to keep syncing**, and stop sending it changes. To keep syncing, sign in to the same account on the remaining devices.

If the sign-in fails, the device stays in its group.

## Paused devices

A device that paused local sync shows **Paused** on the other devices in the group. See [Pause local network sync](local-network.md#pause-local-network-sync).

## Troubleshooting

| Message | What to do |
| --- | --- |
| The other device is signed in to a Voltius account | Sign in here with the same account instead. |
| Both devices are already paired with other devices | Forget the devices on one of them first, then pair again. |
| These devices are already paired | Nothing to do. |
| Pairing timed out | The window closes after 5 minutes. Open **Pair a device** on both and start again. |
| The other device is already pairing with someone else | Try again in a moment. |
| Too many failed attempts | Pairing is switched off. Open **Pair a device** again to retry. |
| Pairing didn't finish | Check both devices are on the same network, then try again. |

If your devices never find each other, see [the one-time system prompt](local-network.md#the-one-time-system-prompt) for the macOS and Windows permissions.
