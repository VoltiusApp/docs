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

In this release, admins can create tokens and decide join requests. The ways to use a token arrive in a later release: `voltius-cli enroll <token>` to enrol a machine from the command line, and a first-launch screen in the app. Until then, keep the token for your rollout and invite people individually.

With a token, sign-up works even when the server has sign-up closed. Each token allows up to 500 sign-ups a day, so rolling out from one office address is fine.

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
