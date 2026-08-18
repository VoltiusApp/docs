---
icon: lucide/play
---

# Quickstart

## Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/voltius-server?referralCode=_euqa6&utm_medium=integration&utm_source=template&utm_campaign=voltius-server)

Provisions the server + a Postgres database, generates `JWT_SECRET` for you. No local Docker needed.

## Prerequisites

- Docker + Compose
- A way to reach the host from your desktop client — `localhost`, a Tailscale IP, or a public domain behind a reverse proxy

## Run

```bash
git clone https://github.com/VoltiusApp/server voltius-server
cd voltius-server

# Generate the only required secret
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

docker compose up -d
```

That's it. The server is now running on port `14372` with a bundled Postgres. Every paid feature is unlocked — no `SELF_HOSTED=true` flag to set, no Lemon Squeezy keys, no tier configuration. Migrations run automatically on first start.

## Verify

```bash
curl http://localhost:14372/health
# → ok

curl http://localhost:14372/v1/meta
# → {"self_hosted":true,"billing_enabled":false}
```

## Point the desktop at it

The desktop client talks to the hosted Voltius service by default, but you can point it at your self-host at runtime — no rebuild needed.

On the **sign-in** and **register** screens, expand **Custom server URL** and enter your server (e.g. `https://voltius.example.com` or `http://localhost:14372` for a local test). The URL is persisted in the OS keychain and reused for every subsequent request. You can switch back to a different server or the hosted service at any time by logging out and entering a different URL on the sign-in screen.

## Behind a reverse proxy

Run any TLS-terminating proxy (Caddy, Nginx, Cloudflare Tunnel) in front of port `14372`. A minimal Caddyfile:

```caddy
voltius.example.com {
    reverse_proxy localhost:14372
}
```

If you put it behind Cloudflare Tunnel, set `TRUSTED_PROXY_IP=127.0.0.1` in `.env` so the server trusts forwarded headers from the local tunnel container.

## Updating

```bash
docker compose pull
docker compose up -d
```
