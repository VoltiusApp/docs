---
icon: lucide/globe
---

# Web portal

The web portal is the small website behind the links in Voltius emails. It serves:

- `/invite/<token>`: accepting a team invitation, including creating an account for it
- `/verify-email`: confirming an email address
- `/2fa/passkey`: using a passkey as a second factor
- `/signin`, `/signup` and `/account`: managing an account from a browser

The server does not serve these pages. Without a portal of your own, `VOLTIUS_APP_URL` points at the hosted one, which cannot reach your server, so invitation and verification links do not work.

## Run it

The portal is published as a multi-arch image (`linux/amd64`, `linux/arm64`) at `ghcr.io/voltiusapp/voltius-portal`. Add it next to the server in the server's `compose.yml`, or in a `compose.override.yml` beside it:

```yaml
services:
  portal:
    image: ghcr.io/voltiusapp/voltius-portal:latest
    container_name: voltius-portal
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      VOLTIUS_API_URL: https://voltius.example.com
```

Then set the server's side in `.env` and restart both:

```bash
VOLTIUS_APP_URL=https://app.voltius.example.com
CORS_ORIGINS=https://app.voltius.example.com
```

```bash
docker compose up -d
curl http://127.0.0.1:3000/runtime-config
# → {"apiUrl":"https://voltius.example.com"}
```

| Variable | Where | Purpose |
|---|---|---|
| `VOLTIUS_API_URL` | portal | The server's public URL, as browsers reach it. Read when the portal starts, so one image works for any server. |
| `PORT` | portal | Port the portal listens on inside the container. Default `3000`. |
| `VOLTIUS_APP_URL` | server | The portal's public URL. Emails link to it. |
| `CORS_ORIGINS` | server | Must include the portal's origin, since browsers call the API from the portal's pages. Not needed when both share one domain (below). |
| `WEBAUTHN_RP_ID` | server | Only for passkeys: see [Two-factor authentication](environment.md#two-factor-authentication). |

`NEXT_PUBLIC_API_URL` is only for building the portal from source. A running image ignores it when `VOLTIUS_API_URL` is set.

The portal reads `GET /v1/meta` from your server and adapts to it: with `REGISTRATION_ENABLED=false` it hides public sign-up, and on a self-hosted server it shows no plans, prices or billing actions.

## Tags

| Tag | Meaning |
|---|---|
| `latest` | The newest build of the portal's `main` branch. Moves on every change. |
| `sha-<short>` | One exact build. Pin this in production so a restart never changes what runs. |
| `<version>` | A tagged portal release, when there is one. |

A newer portal works with an older server: what the server does not support yet, such as creating an account from an invitation, it refuses with a message the portal shows. Upgrade by changing the tag and running `docker compose up -d portal`; roll back the same way.

## One domain for both

You can serve the portal and the API from one domain. Send `/v1/` and the health checks to the server and everything else to the portal:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    server_name voltius.example.com;
    # listen and TLS settings omitted

    # Shared terminals use WebSockets and sync uses a long-lived stream, both under /v1/.
    location /v1/ {
        proxy_pass http://127.0.0.1:14372;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_read_timeout 1h;
    }

    location ~ ^/health {
        proxy_pass http://127.0.0.1:14372;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

With Caddy:

```caddy
voltius.example.com {
    @api path /v1/* /health /health/*
    reverse_proxy @api localhost:14372
    reverse_proxy localhost:3000
}
```

Then `VOLTIUS_API_URL` and `VOLTIUS_APP_URL` are both `https://voltius.example.com`, and `CORS_ORIGINS` can stay empty. The desktop app keeps using the same URL as its custom server.

## Invitations with registration closed

With `REGISTRATION_ENABLED=false`, people can still join by email invitation. The invitation link opens the portal, which offers **Sign in to accept** and **Create an account**. Creating an account works only for the address the invitation was sent to, only while the invitation is pending and the person who sent it can still invite, and the new account joins the team with the role in the invitation. Nobody else can register.

This needs `TEAM_INVITES_ENABLED=true` and a working [email setup](environment.md#email).

Invitees can also create the account in the Voltius app, which works with or without a portal of your own: choose **Cloud account**, enter your server, open **Have an invitation link?** and paste the link from the email. The app checks it against that server, fills in the invited address and creates the account in the team. If the server refuses an open sign-up, the app opens that field itself.

Without a portal of your own, invitation emails link to the hosted portal (the default `VOLTIUS_APP_URL`), which cannot see invitations on your server. Its "Invitation not found" page points invitees to the app, but tell them up front to paste the link there.

## Build it yourself

```bash
git clone https://github.com/VoltiusApp/web
cd web
docker build -f portal/Dockerfile -t voltius-portal .
```
