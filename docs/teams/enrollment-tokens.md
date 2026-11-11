---
icon: lucide/ticket
---

# Enrolment tokens

!!! info "Business"
    Creating an enrolment token needs the team's Business plan. A self-hosted server counts as Business.

An enrolment token lets people join your team by signing up with a string you give them, instead of an individual invite. Use it to onboard a whole office or fleet of machines. One team has one live token.

Anyone who holds the token can ask to join. What happens next depends on the guards you set: the email domain, admin approval, or both.

## Creating a token

Open the vault's **Share** sheet, go to the **Links** tab and find **Device enrolment**. You need the permission to invite members.

| Field | Meaning |
|---|---|
| Role | The role new members get. Any built-in role except Owner. Defaults to Member. |
| Allowed email domains | Up to 50. A person's email must match one exactly. |
| An admin approves each join | Every request waits for an admin to approve it. |
| Expiry | Optional. Without one, the token works until you rotate or revoke it. |

Set at least one of the domains and the approval switch.

Domains match exactly on the part after the last `@`. `acme.com` does not admit `eu.acme.com`; list each one.

!!! warning
    The token is shown once, right after you create it. Copy it then. Voltius can't show it again.

The token looks like `vte1.<server>.<id>.<secret>`. It identifies your server and team, but it doesn't contain any encryption key.

### Self-hosted servers without email

If the server can't send email, it can't confirm that a person owns an address. Domain-only tokens are refused there, and the form turns **An admin approves each join** on and locks it.

## Rotating and revoking

Creating a token again rotates it. The old token stops working at once, so update wherever you handed it out. Requests already waiting stay open and you can still decide them. Rotating keeps a future expiry.

**Revoke** removes the token without replacing it. Revoking works even if the team's plan has lapsed.

The section also shows when the token was last used and how many people are waiting or have joined through it.

## Using a token

There are three ways to hand a token to people. With a token, sign-up works even when the server has sign-up closed. Each token allows up to 500 sign-ups a day, so rolling out from one office address is fine.

- **Machines you manage.** Run `voltius-cli enroll` on each one. See [Enrol a fleet](#enrol-a-fleet).
- **A link.** Next to the token, shown once after you create it, **Copy link** copies a link you can email or post. Opening it in Voltius starts the join. Anyone who has the link can ask to join, as with the token itself.
- **The token itself.** People paste it into Voltius. See [What people see](#what-people-see).

## Enrol a fleet

Run `voltius-cli enroll` as root or Administrator on each machine. It writes the token into the [machine policy](../reference/machine-policy.md) as `enrollment.token`. The next time Voltius starts on that machine, it asks the person to sign in to your team.

```sh
sudo voltius-cli enroll "vte1.…"
```

By default the command asks your server to check the token first and prints the team name. Running it again with the same token changes nothing. See [`enroll` in the command line reference](../reference/cli.md#enroll) for the options and exit codes.

With Ansible, `--json` reports whether the file changed:

```yaml
- name: Enrol this machine in the company Voltius team
  ansible.builtin.command: voltius-cli enroll "{{ voltius_enrollment_token }}" --json
  become: true
  register: voltius_enroll
  changed_when: (voltius_enroll.stdout | from_json).changed
```

Keep `voltius_enrollment_token` in Ansible Vault or your secrets store. The token can't decrypt anything, but anyone who has it can ask to join.

When you build a machine image without network access, add `--no-verify` to write the token without asking the server. The server checks it when someone first uses it.

If the machine's policy locks `server.url` to a different server than the token's, the command refuses. Use the token from the locked server.

To enrol every machine and also lock your server, set both:

```sh
sudo voltius-cli policy set server.url https://voltius.acme.com
sudo voltius-cli enroll "vte1.…"
```

Rotating or revoking the token doesn't remove it from machines. Run `voltius-cli enroll` with the new token, or `voltius-cli enroll --remove`.

## What people see

**First launch.** On a machine with a token, a new person sees **Sign in to <your team>** instead of the generic welcome screen. The server is your organization's and can't be changed here. They create an account or sign in with their email, and the join request is sent. If the token has domains, the form says which email to use. **Skip for now** is always there.

**A link.** Opening the link shows the team and the server, and asks first: *Only continue if your company sent you this link.* Nothing is sent until they continue. Then they get the same form. People who are already signed in to that server can join with the account they have, or use another one.

**A pasted token.** On the first-launch screen, **Have an enrolment token?** opens a field for it. The same confirm step appears. Tokens written by `voltius-cli enroll` don't ask, because an administrator of the machine put them there.

If a person skipped, or you enrol a machine later, a notification says **Your organization uses <team> on Voltius**, with **Sign in**.

After they submit, the screen says what happens next:

| Result | What they see |
|---|---|
| Admitted | **You're in <team>.** Team vaults appear once an admin's Voltius is online. |
| Waiting for approval | **Request sent.** An admin approves it and they get a notification. |
| Email not verified | **Verify your email to join.** They join automatically once they click the link, and can use **Resend email**. |
| No free seat | **<team> has no free seat.** An admin has been notified. |

The same status stays in their notifications until it resolves: waiting for approval, verify your email, or **You joined <team>** once an admin approves. If an admin denies the request, the notification says the team declined it. On a machine with a token, **Ask again** sends a new request.

## How people are admitted

- **Domain rule only.** A person is admitted automatically when their email matches a listed domain and they have confirmed it by clicking the link in the verification email.
- **Admin approval.** The person waits in the join requests list until an admin decides.
- **Both.** The email must match a listed domain, and an admin must still approve.

A seat is used only when someone is admitted, not while they wait.

Accounts verified before this release, and accounts on servers that verify automatically, have to confirm their email again. They use **Resend email** in the "Verify your email" notice, which is limited to 5 per hour.

A person without an encryption key can't join. They need to sign in to the Voltius app once first.

## Join requests

Open **Members → Join requests** to see who is waiting. Admins with the invite-members permission see it. Each request shows why it is waiting:

- **Waiting for approval**
- **Waiting for email verification**: they admit themselves once they confirm.
- **No seat left**: add seats in [Billing](billing.md), then approve.

Click **Approve** to admit the person with the token's role, or **Deny** to refuse. A denied person can ask again with the token.

## If the plan lapses

While the team's plan is below Business, the token can't be resolved or redeemed and requests can't be approved. You can still deny requests and revoke the token.

See also [Members](members.md) and [Roles & permissions](roles.md).
