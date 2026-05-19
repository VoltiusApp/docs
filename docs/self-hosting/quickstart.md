---
icon: lucide/play
---

# Quickstart

> Screenshot placeholder — terminal with `docker compose up` and the server healthy.

## Prerequisites

- Docker + Compose
- A domain pointing at the host (for the desktop client to reach you)
- A reverse proxy that terminates TLS (Caddy, Nginx, Cloudflare Tunnel)

## Run

```bash
git clone https://github.com/VoltiusApp/voltius
cd voltius/server

cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_SECRET.
# Generate JWT_SECRET with:
openssl rand -hex 32

# Lemon Squeezy variables in .env.example are for the hosted SaaS only.
# Leave them unset — auth, sync, teams, and audit work without them.
# See: ../environment/#billing-only-if-you-sell-subscriptions

docker compose up -d
```

The server listens on `http://0.0.0.0:8080` (mapped to `14372` in the default compose). Migrations run automatically on first start.

## Verify

```bash
curl http://localhost:14372/health
# → {"status":"ok"}
```

## Point the desktop at it

The desktop client expects the production endpoint. To point at your self-host, build with `VITE_API_URL` set to your domain — see [`CONTRIBUTING.md`](https://github.com/VoltiusApp/voltius/blob/main/CONTRIBUTING.md).

!!! tip "Cloudflare Tunnel"
    The default `compose.yml` joins an external `cloudflare` network — handy if you run `cloudflared` next to it for zero-config TLS.
