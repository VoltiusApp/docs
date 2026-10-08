---
icon: lucide/user-plus
---

# Members

![The Members tab of a team vault: the owner and one member, each with a role badge](../assets/screenshots/teams-members.png){ .voltius-shot }
/// caption
The Members tab lists everyone with access to the team vault and their role. Invite by email, filter by role, and manage seats from here.
///

## Inviting

Click **Invite** in the Members tab toolbar. In the panel that opens:

- **Search handle or enter email** — custom handles match on part of a name; a generated handle like `rapid-violet-8884` has to be typed in full, or use their email.
- **Name in this team** — optional. Teammates see it instead of the handle, and only admins can change it.
- **Initial Roles** — pick at least one before inviting. See [Roles](roles.md).

The panel also shows your seat usage, counted across every team you own.

You can invite from the vault itself too: **Invite** (or **Share**) in the vault header opens the same search on its **Invite** tab, with **Manager**, **Editor**, **Member** or **Connect-Only** as the role they join with. The **Links** tab creates a join link instead.

What the invitee sees:

- **They already have an account** — the vault appears in their sidebar with a pending marker, plus a notification. Clicking it shows who invited them and as what role, with **Accept** and **Decline**.
- **They don't have one yet** — they get an email with a link to accept, and sign up from there. A self-hosted server only sends it when [email is configured](../self-hosting/environment.md#email).

Once they accept, a teammate who holds the vault key wraps a copy under their public key automatically. Until then the **People** tab of the vault's **Share** popover shows them as *Waiting for a key*, and anyone who can manage members can click **Grant now** there.

Pending invites appear at the top of the Members list until accepted or revoked, with how long they have left; revoke one there, or send an expired one again. The **People** tab of the **Share** popover can also copy a pending invite's link.

## Removing

In the Members tab, right-click a member → **Kick**, or select them and click **Remove from team** under **Danger Zone** in the side panel. Select several members and right-click to kick them all at once. A confirmation spells out what happens before anyone is removed.

The **×** next to a person in the vault's **Share** popover removes them too, without that confirmation.

You need the permission to manage members, and the owner can't be removed.

When a member is removed:

- Their copy of every vault key is deleted server-side.
- The vault's contents are wiped from their devices, and the vault key is rotated automatically — see [Team vaults](team-vaults.md#leaving-removing).
- They keep anything they already saw: change those credentials on the real systems.
- Their seat is free for your next invite right away. Your bill only drops if you lower the seat count — see [Billing](billing.md#seats).

## Seats

Seat usage shows in the **Invite** panel (e.g. `3 used · 2 available · 5 total`) and on the **Invite** tab of the vault's **Share** popover. It's counted across every team you own, not just this one. During a trial, the cap can sit below the seats you bought until the trial ends; the panel says so when it does.

**Buy seats** in the Invite panel adds seats to your subscription. If you invite someone while you're out of seats, the same dialog opens with that person attached: pick how many seats to add and click **Buy N seats & Invite**. The prorated charge for the current billing period is applied immediately. See [Billing](billing.md).

!!! tip
    Invites stay open for 7 days. An expired one can be sent again from the Members list.

## Lock policy

!!! info "Business"
    Lock policies need the team's Business plan. A self-hosted server counts as Business.

A lock policy makes every member's app lock on a schedule you choose. Open **Members → Security**, or **Security policy…** in the vault menu, and turn on **Enforce auto-lock**:

- **Lock after at most** — members can pick this time or a shorter one in **Settings → Account → Session security**, never a longer one or **Never**. **Immediately** locks as soon as they leave Voltius.
- **Require Lock vault** — locking always removes the vault key from memory and closes open sessions. **Lock screen** is unavailable.

Changes apply within seconds on every member's devices. You need the permission to manage the vault (the same one that lets you rename it).

What members see:

- Their Session security settings show the policy's values, with a line saying which team set them.
- Their own choices are kept. Removing the policy, or leaving the team, brings them back.
- In several teams with policies, the strictest one applies: the shortest time, and **Lock vault** if any team requires it.
- The policy keeps applying offline, from the last one the app received.

The policy applies to everyone in the team, owners and admins included. Voltius versions older than the one that introduced lock policies ignore it.

If the team's Business plan lapses, an existing policy stays in force and can only be removed.

