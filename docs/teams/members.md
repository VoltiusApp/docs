---
icon: lucide/user-plus
---

# Members

![The Members tab of a team vault: the owner and one member, each with a role badge](../assets/screenshots/teams-members.png){ .voltius-shot }
/// caption
The Members tab lists everyone with access to the team vault and their role. Invite by email, filter by role, and manage seats from here.
///

## Inviting

**Members tab → Invite.**

Enter an email. The invitee receives a sign-up link (via Resend). When they create an account, your vault keys are wrapped under their public key and pushed to them.

Pending invites appear at the top of the Members list until accepted or revoked.

## Removing

In the Members tab, right-click a member → **Kick**, or select them and click **Remove from team** under **Danger Zone** in the side panel. Select several members and right-click to kick them all at once. A confirmation spells out what happens before anyone is removed.

The **×** next to a person in the vault's **Share** popover removes them too, without that confirmation.

You need the permission to manage members, and the owner can't be removed.

When a member is removed:

- Their copy of every vault key is deleted server-side.
- The vault's contents are wiped from their devices, and the vault key is rotated automatically — see [Team vaults](team-vaults.md#leaving-removing).
- They keep anything they already saw: change those credentials on the real systems.
- The seat is freed in your subscription.

## Seats

The Members tab shows seat usage in the header (e.g. `3 / 5 used`). When you hit the cap, **Buy more seats** in the same header opens checkout. See [Billing](billing.md).

!!! tip
    Invites stay open for 7 days. After that, revoke and re-invite.
