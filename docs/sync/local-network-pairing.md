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
4. If the code screen shows **This replaces *name***, pairing would give that existing device's name a new device key. Check that the device in front of you really is that device before you continue.
5. If the codes match, tap **Codes match** on both devices. Each screen shows when the other has confirmed.
6. The first sync starts straight away.

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

Two devices that already belong to different groups cannot be paired with each other. [Leave the group](#leave-a-group) on one of them first, then pair again.

## Forget a device

Every device in the **Local network** list has a **Forget** button. What it does depends on how the devices are linked.

| Devices are... | Forget does |
| --- | --- |
| On the same Voltius account | Stops local sync with that device, **on this device only**. It keeps syncing through Voltius Cloud. To remove it fully, sign out on that device. |
| Paired without an account | Removes the device from the group and rotates the group's secret. The device keeps what it already has and receives nothing new until you pair it again. |

A forgotten device is refused automatically, and nothing reconnects by itself. To bring it back, [pair it again](#pair-two-devices): confirm the 6-digit code on both devices. It then syncs normally with every member of the group, and no vault reset is needed.

The other members of the group get the new secret the next time they are reachable from any member. Until your other devices have synced the Forget, a modified copy of the app on the forgotten device that still holds the group's keys could reconnect through a device that hasn't heard about it yet.

### "Can't verify this device"

A device showing **Can't verify this device · Pair again to verify it** has changed its identity since you last paired. This happens, for example, on a Linux PC whose keyring regenerates its device key at reboot. Voltius refuses it until you pair again.

The pairing screen asks you to check the new identity with the code. Pair again only if you recognise the device: whichever device now holds that name could otherwise pair with you. Once the code is confirmed on both devices, the device syncs normally again.

A reinstalled device that keeps its device key replaces its old row instead of adding a second one.

## Leave a group

On a device in a no-account group, the **Local network** section of the sync menu has **Leave this group**. After you confirm, the device stops syncing with your other devices over the local network and drops the group's local-sync secrets. It keeps the data it already has.

The prompt reads: "This device stops syncing with your other devices over the local network. It keeps what it already has, and they remove it from their list. You can pair it again later."

The other devices remove it from their list immediately if one of them is nearby. If none was reachable when it left, they remove it the next time they are nearby.

Afterwards the device can [pair](#pair-two-devices) into another group, or back into the same one.

## Moving a device to a Voltius account

Creating a Voltius account or signing in to one takes that device out of its group. The other devices list it as **Moved to a Voltius account — sign in there to keep syncing**, and stop sending it changes. To keep syncing, sign in to the same account on the remaining devices.

If the sign-in fails, the device stays in its group.

## Paused devices

A device that paused local sync shows **Paused** on the other devices in the group. See [Pause local network sync](local-network.md#pause-local-network-sync).

## Troubleshooting

| Message | What to do |
| --- | --- |
| The other device is signed in to a Voltius account | Sign in here with the same account instead. |
| Both devices are already paired with other devices | Leave the group on one of them, then pair again. |
| These devices are already paired | Nothing to do. |
| Pairing timed out | The window closes after 5 minutes. Open **Pair a device** on both and start again. |
| The other device is already pairing with someone else | Try again in a moment. |
| Too many failed attempts | Pairing is switched off. Open **Pair a device** again to retry. |
| Pairing didn't finish | Check both devices are on the same network, then try again. |

If your devices never find each other, see [the one-time system prompt](local-network.md#the-one-time-system-prompt) for the macOS and Windows permissions.
