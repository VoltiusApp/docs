---
icon: lucide/server-cog
---

# Deploying the infrastructure too

The [quickstart](quickstart.md) assumes you already have a host and run `docker compose up -d` on
it by hand. If you would rather describe the whole thing — the machine, the host setup, and moving
to a bigger machine later — the server repository ships what Voltius' own production runs on:
[`infra/`](https://github.com/VoltiusApp/server/tree/main/infra) for OpenTofu and
[`ansible/`](https://github.com/VoltiusApp/server/tree/main/ansible) for everything on the host.

This is the harder path, and worth it for one reason: replacing the machine stops being a project.

## What is and is not tied to a provider

Only creating the machine is provider-specific. `infra/oci` describes Oracle Cloud because that is
where the hosted service runs, on the free tier. Ansible never mentions a cloud: it takes any
Ubuntu 24.04 host reachable over SSH.

So on Hetzner, a VPS, or a machine in your house, you skip the OpenTofu part, or write the
equivalent for your provider, and the rest is unchanged. What the host has to satisfy:

| | |
|---|---|
| OS | Ubuntu 24.04, aarch64 or x86-64 — the server image is multi-arch |
| RAM | 4 GB or more |
| Disk | your database, its WAL and one base backup, with room to grow |
| Network | SSH from wherever you run the playbooks, and outbound to your registry and object storage |
| Inbound | none, if you reach the server through a tunnel |

No Hetzner configuration ships with it, because none has been tested. Untested infrastructure code
reads as a supported path and fails in the middle of a rebuild.

## Preparing a host

```bash
ansible-playbook site.yml -l newhost
```

Installs Docker, `age` and `rclone`, creates the container network on a fixed subnet — the one
`TRUSTED_PROXIES` names, so client addresses survive the proxy — lays out the compose files, and
builds the Postgres and WAL-G images. It starts nothing, and it tells you which secret files are
still missing.

## Rehearsing before you need it

```bash
ansible-playbook rehearse.yml -e voltius_target=throwaway
```

Restores your database into a throwaway volume on a throwaway host, counts the tables and
migrations, and deletes the copy. It runs with archiving **off** and starts nothing that writes to
your object storage, so it cannot disturb the backups it reads.

A rebuild path nobody has run is a guess. Voltius' own first rehearsal found four faults that
linting had not: the whole thing aborted before its first task, a package came back "unavailable"
on a host where it was available, an image build demanded credentials that do not exist yet, and a
config parse silently produced nothing. Run it before you are relying on it.

## Moving to a bigger machine

```bash
ansible-playbook migrate.yml -e voltius_source=old -e voltius_target=new
```

Eight phases, of which four are the outage, usually around five minutes:

1. Preflight: source healthy, backups fresh, target prepared and idle.
2. Restore the secrets onto the target from your encrypted bundle.
3. Copy the local dump directory across.
4. Stop the server, close the current WAL segment, wait for it to be archived, then stop the source
   database **for good**.
5. Restore the newest base plus WAL onto the target and promote it.
6. Start the server there.
7. Point DNS at the new host.
8. Wait for the backup watchdog to pass a full round.

Three things in there are easy to get wrong by hand, and are the reason this is a playbook:

- **The source database must never come back.** Once the target is promoted, both would archive
  diverging timelines into the same prefix.
- **The dumps have to be copied before the mirror starts.** It runs `rclone sync`, so a first run
  against an empty directory deletes every mirrored dump you have.
- **The last WAL segment has to be archived before the restore**, or the move loses whatever was
  written in the final minute.

## Scaling up is not the same as scaling out

This gets you a bigger machine. It does not get you two servers behind a load balancer: the sync
notifier, terminal sessions, rate limiters and presence all live in one process's memory today, so
a second server would disagree with the first, silently. One larger host handles a great deal —
measure before assuming you need more.
