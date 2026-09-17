---
icon: lucide/database
---

# S3 sync

Zero-knowledge multi-device sync through **any S3-compatible bucket you own** — AWS S3, Cloudflare R2,
Backblaze B2, Wasabi, Hetzner, Scaleway, MinIO, or anything else that speaks the S3 API. There is no
server to deploy: the plugin talks to your bucket directly with SigV4-signed requests.

S3 Sync is a marketplace plugin: **Settings → Plugins → Marketplace → S3 Sync**, or install it
straight from the sync menu.

## How it works

Everything lives under the folder you choose in the wizard (`voltius/` by default; the folder can be
empty to use the bucket root):

```
<folder>/vault.json            {"schema":1,"salt":"<32 hex chars>"}
<folder>/devices/<id>.b64      this device's encrypted state, base64
<folder>/devices/<id>.json     {"label":"…","pushedAt":"…"}   (plaintext metadata only)
<folder>/.voltius-probe        written, read back and deleted by "Test and connect"
```

There is no manifest object. The device list comes from listing `<folder>/devices/`, and each
device's version is the ETag S3 already returns for its `.b64` object — nothing has to be kept in
sync with the directory listing, and two devices pushing at once cannot clobber a shared index.

Each device writes only its own `devices/<id>.*` pair and reads everyone else's. The passphrase you
choose derives the encryption key locally; `vault.json` holds the salt so another device can derive
the same key from the same passphrase. The passphrase itself is never sent anywhere.

Deletes (the probe object, and a removed device's two files) go through S3 multi-object delete, not a
single-object `DELETE` — a storage service without multi-object delete fails at the **Delete** step of
*Test and connect*.

## Setup

1. **Create a bucket** in your provider's console. Any name and region works; the plugin does not
   create it for you.
2. **Create an access key limited to that bucket.** On AWS, or any provider with IAM-style policies,
   that is:
      - `s3:ListBucket` on the bucket (`arn:aws:s3:::<bucket>`)
      - `s3:GetObject`, `s3:PutObject` and `s3:DeleteObject` on `arn:aws:s3:::<bucket>/<folder>/*`

      A key without `s3:ListBucket` shows up as *credentials rejected*, not as a missing permission:
      S3 answers `AccessDenied` both to the device listing and to reading a file that does not exist
      yet. Step 2 of the wizard links to your provider's key documentation.
3. **Run the wizard** in **Settings → S3 Sync**:
      1. **Which storage provider?** Pick a preset, which fills in the endpoint pattern, the default
         region and the right addressing style. Pick *Other* for anything not listed.
      2. **Connect to your bucket.** Endpoint, region, bucket, folder and the key pair. *Test and
         connect* writes, reads back and deletes a probe object, so a wrong key or a missing bucket is
         reported here rather than on the first sync.
      3. **Passphrase.** A new bucket asks for a passphrase twice and creates the vault; a bucket that
         already holds one asks for its passphrase and links this device to it.

Settings are saved only once step 3 succeeds. The access key and secret go into this device's vault,
not into plugin storage.

## Providers

| Preset | Endpoint | Region | Addressing |
|---|---|---|---|
| AWS S3 | `https://s3.{region}.amazonaws.com` | e.g. `eu-west-3` | virtual-hosted |
| Cloudflare R2 | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | `auto` | path |
| Backblaze B2 | `https://s3.{region}.backblazeb2.com` | e.g. `eu-central-003` | path |
| Wasabi | `https://s3.{region}.wasabisys.com` | e.g. `eu-central-1` | path |
| MinIO | `http://localhost:9000` | usually `us-east-1` | path |
| Hetzner | `https://{region}.your-objectstorage.com` | `fsn1`, `nbg1` or `hel1` | virtual-hosted |
| Scaleway | `https://s3.{region}.scw.cloud` | `fr-par`, `nl-ams` or `pl-waw` | path |
| Other | whatever you enter | blank means `us-east-1` | path (a checkbox switches it) |

A preset only prefills the form — every field stays editable, so any S3 API works through *Other*.
`http://` endpoints are accepted only for `localhost`, private and link-local addresses, single-label
hostnames and names ending in `.local`, `.lan`, `.home.arpa` or `.internal` — everything else must be
`https://`.

A bucket name containing dots cannot be used with virtual-hosted addressing over `https://` (the
provider's wildcard certificate does not cover `a.b.s3.…`): the wizard refuses that combination, so use
path-style addressing or a bucket name without dots.

## Key scoping

Scope the access key to the one bucket — the plugin needs nothing account-wide, and the key never
needs to reach any other bucket or service. Never reuse the secret access key as your sync
passphrase: one is transport auth for the bucket, the other derives the encryption key, and they must
stay independent.

## Adding another device

On the second device, install the plugin, point it at the same endpoint, bucket and folder, and enter
the same passphrase when asked. Each device gets its own access key if you want per-device revocation,
or all devices can share one key scoped to the bucket.

Removing a device from the settings page deletes its two files from the bucket, but a device that is
still running and connected pushes them again on its next sync — disconnect or uninstall the plugin on
that device first.

## Bucket layout

One bucket folder per vault. If you sync more than one vault, give each its own folder (or its own
bucket) — do not point two vaults at the same folder.

## Troubleshooting

- **Credentials rejected** — the access key or secret is wrong, or the key cannot access this bucket.
  This is also what a key missing `s3:ListBucket` looks like, since S3 answers `AccessDenied` to both
  cases.
- **Bucket not found** — check the bucket name, region and endpoint; a bucket in the wrong region or
  behind the wrong endpoint shows the same error.
- **Device clock is off** — "This device's clock is off, so the storage provider rejected the
  request." Fix the system time and try again.
- **Write/Read/Delete test failed** — *Test and connect* runs three steps in order; the message names
  which one failed. A **Delete** failure on an otherwise-working bucket usually means the service
  does not support S3 multi-object delete.

## S3 sync, Gist sync or Cloudflare sync?

All three are free and end-to-end encrypted, and any combination can run at the same time. Pick
**Gist sync** if you already have GitHub and want the shortest setup. Pick **Cloudflare sync** if you
want Voltius to deploy the Worker and bucket for you. Pick **S3 sync** if you already have a bucket —
on AWS, R2, B2, Wasabi, Hetzner, Scaleway, MinIO or elsewhere — and would rather point Voltius at it
directly than deploy a Worker.

!!! tip "Multiple sync providers"
    S3 sync runs alongside Cloud sync, Gist sync, Cloudflare sync and any other sync provider plugin —
    Voltius shows each one separately in the sync menu and title bar. See
    [Building a sync provider](../plugins/sync-providers.md).
