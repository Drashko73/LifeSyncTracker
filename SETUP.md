# LifeSync Tracker — Setup Guide

Everything needed to run LifeSync Tracker locally for development and to host it in
production. If you only want to *use* the app on a server, jump to
[Production / Hosting](#production--hosting).

---

## 1. How the pieces fit together

| Component | Tech | Dev port | Prod port |
|---|---|---|---|
| Frontend | Angular 21 (standalone + signals), PrimeNG 21, Tailwind v4 | `4200` (`ng serve`) | `${APP_PORT:-8088}` → nginx :80 in the container |
| Backend | .NET 8 Web API (`backend/LifeSyncTracker.API`) | `5555` | internal `8080`, reached through nginx `/api/` |
| Database | PostgreSQL 16 | `5432` | internal only (not published) |
| Mail | SMTP (verification codes) | Mailpit `1025` / UI `8025` | your real SMTP provider |

Key facts that drive the setup:

- **PostgreSQL is required even in development.** `Program.cs` always calls
  `UseNpgsql(...)`; the SQLite package is a leftover and is not wired up.
- **Migrations run automatically on startup** (`dbContext.Database.Migrate()` in
  [Program.cs](backend/LifeSyncTracker.API/Program.cs:131)), followed by seeding of default
  categories and promotion of the configured admin account. You normally never run
  `dotnet ef database update` by hand.
- **The app refuses to start without `Jwt:Key` and `Encryption:Key`.** Both throw
  `InvalidOperationException` at boot if empty. `appsettings.json` ships them blank on
  purpose — secrets come from user-secrets (dev) or environment variables (prod).
- **Registration requires a working SMTP server.** There is no dev bypass: a code is
  emailed, and the code is stored SHA-256-hashed, so you cannot read it out of the
  database. Use Mailpit locally (see below).
- **In dev the browser talks to the API cross-origin** (`http://localhost:5555/api`,
  allowed by the `AllowAngular` CORS policy). In prod the Angular build uses `/api` and
  nginx proxies it to the backend container — same origin, so CORS never applies.

### Account flow

```
register (email + code) → account created with Status = PendingApproval
                        → admin approves in /admin
                        → login allowed
```

Login of a non-approved account returns **403**. The account whose email matches
`Admin:Email` / `ADMIN_EMAIL` is the exception: it is created as `Admin` + `Approved`
automatically, and is also promoted on every startup if it already exists.

---

## 2. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| .NET SDK | 8.0+ | Project targets `net8.0`. A newer SDK (9/10) builds it fine, but the **.NET 8 runtime must be installed** to run it. Check with `dotnet --list-runtimes`. |
| Node.js | 20.19+ / 22.12+ / 24+ | Angular 21 requirement. |
| Docker Desktop | any recent | For Postgres + Mailpit locally, and for the whole stack in prod. |
| `dotnet-ef` | 8.0+ | Only needed when creating new migrations: `dotnet tool install --global dotnet-ef`. |

---

## 3. Fastest path: run the whole stack in Docker

Good for "does it work end to end", not for iterating on code.

```bash
cp .env.example .env
```

Fill in `.env` (see [section 5.2](#52-fill-in-env) for how to generate the keys), then:

```bash
docker compose up -d --build
```

- App: <http://localhost:8088> (or whatever `APP_PORT` you set)
- API (published for the dev server's benefit): <http://localhost:5555/api/health/healthcheck>

Note that Swagger is **not** available here — the compose file sets
`ASPNETCORE_ENVIRONMENT=Production`, and Swagger is registered only in Development.

---

## 4. Development setup (hot reload)

### 4.1 Start the dev infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts Postgres on `localhost:5432` (user/password/db default to
`postgres` / `postgres` / `lifesynctracker`) and Mailpit on `localhost:1025` with a
web UI at <http://localhost:8025>. It uses its own compose project name and volume, so
it never collides with the production stack in `docker-compose.yml`.

> Already have a Postgres on your machine? Skip the `db` service and point the
> connection string below at it instead.

### 4.2 Configure backend secrets (user-secrets)

Run once, from `backend/LifeSyncTracker.API`. These values live outside the repo
(`%APPDATA%\Microsoft\UserSecrets\09e14134-4ac4-46de-bab4-5be53474413d`) and can never be
committed by accident.

```bash
cd backend/LifeSyncTracker.API
dotnet user-secrets set "ConnectionStrings:PostgresConnection" "Host=localhost;Port=5432;Database=lifesynctracker;Username=postgres;Password=postgres"
dotnet user-secrets set "Jwt:Key" "<at least 32 characters of random text>"
dotnet user-secrets set "Encryption:Key" "<base64 of exactly 32 random bytes>"
dotnet user-secrets set "Email:Host" "localhost"
dotnet user-secrets set "Email:Port" "1025"
dotnet user-secrets set "Email:EnableSsl" "false"
dotnet user-secrets set "Email:FromEmail" "noreply@lifesync.local"
dotnet user-secrets set "Email:FromName" "LifeSync Tracker"
```

Generating the keys — pick whichever shell you're in:

```bash
openssl rand -base64 48   # Jwt:Key
openssl rand -base64 32   # Encryption:Key  (must decode to exactly 32 bytes)
```

```powershell
# PowerShell, no OpenSSL needed
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Fill($b); [Convert]::ToBase64String($b)  # Jwt:Key
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Fill($b); [Convert]::ToBase64String($b)  # Encryption:Key
```

Mailpit needs no credentials — leave `Email:Username`/`Email:Password` unset; the code
only attaches credentials when a username is present.

`Admin:Email` is already set to `radovandk@gmail.com` in
[appsettings.Development.json](backend/LifeSyncTracker.API/appsettings.Development.json:11).
Change it there if you want a different local admin.

Verify what's stored at any time with `dotnet user-secrets list`.

> ⚠️ **`Encryption:Key` is not just an encryption key.** The same 32 bytes drive the
> AES-GCM field encryption *and* the HMAC blind index used to look up users at login.
> Change it and every encrypted column becomes unreadable and nobody can log in. Use a
> throwaway key for dev, and never point a dev key at production data.

### 4.3 Run the backend

```bash
cd backend/LifeSyncTracker.API
dotnet restore
dotnet run
```

- API base: <http://localhost:5555/api>
- Swagger: <http://localhost:5555/swagger>
- Health: <http://localhost:5555/api/health/healthcheck>

On first run it creates the schema (all migrations) and seeds default transaction
categories.

### 4.4 Run the frontend

```bash
cd frontend
npm install
npm start
```

<http://localhost:4200>, talking to `http://localhost:5555/api` per
[environment.ts](frontend/src/environments/environment.ts).

(Inside Claude Code you can instead use the preview: the `lifesync-frontend`
configuration in `.claude/launch.json` runs the same `npm start`.)

### 4.5 Create your first (admin) account

1. Go to <http://localhost:4200/register>.
2. Enter the email that matches `Admin:Email` and request a verification code.
3. Open Mailpit at <http://localhost:8025> and read the code out of the email.
4. Finish registration. Because the email matches `Admin:Email`, the account is
   created as **Admin + Approved** and you're logged straight in.
5. Any other account you register lands in **PendingApproval** — approve it from
   `/admin` while signed in as the admin.

Gotchas:

- Only **one active code per email** at a time; requesting another before the previous
  one expires returns **429** with the number of seconds to wait. Codes expire after
  15 minutes (`EmailVerification:ExpirationMinutes`).
- If the SMTP send fails, the code record is rolled back and the request errors — so a
  misconfigured `Email:*` section looks like "registration is broken". Check the backend
  logs for `Failed to send verification email`.

### 4.6 Database migrations

Only needed when you change entities:

```bash
cd backend/LifeSyncTracker.API
dotnet ef migrations add <Name>
```

Do **not** commit a migration without checking it into the snapshot as well (EF does
this for you). Applying happens automatically on next startup; `dotnet ef database update`
is available if you want to apply it without running the app.

To reset your local database entirely:

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### 4.7 Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Encryption:Key is not configured` / `Jwt:Key is not configured` at startup | user-secrets missing — see 4.2. |
| `Key must be 256 bits (32 bytes)` | `Encryption:Key` isn't base64 of exactly 32 bytes. |
| `Npgsql...Connection refused` | dev Postgres isn't running, or the port differs. |
| Registration returns a 400 and nothing appears in Mailpit | `Email:*` not configured, or Mailpit not running. |
| CORS errors in the browser | Frontend isn't on `http://localhost:4200`; the allowed origins are hardcoded in [Program.cs](backend/LifeSyncTracker.API/Program.cs:72). |
| 401s that never recover | The interceptor refreshes only on 401 and always sends `X-Device-Id`; clearing site storage forces a clean login. |

---

## 5. Production / Hosting

The production stack is a single `docker compose up -d --build` on a Linux host:
Postgres + backend + nginx-served Angular build, with nginx also proxying `/api/` to the
backend. Nothing but the frontend port needs to be reachable from outside.

### 5.1 Server prerequisites

- A Linux VM with Docker Engine + Compose plugin.
- A DNS name pointing at it (needed for HTTPS).
- Outbound SMTP access to your mail provider.

```bash
git clone <your-repo-url> lifesynctracker
cd lifesynctracker
cp .env.example .env
```

### 5.2 Fill in `.env`

`.env` is gitignored and is the only place production secrets live. Every variable is
consumed by [docker-compose.yml](docker-compose.yml).

```bash
POSTGRES_USER=lifesync
POSTGRES_PASSWORD=<long random password>
POSTGRES_DB=lifesynctracker

JWT_KEY=<openssl rand -base64 48>
ENCRYPTION_KEY=<openssl rand -base64 32>   # NEVER change once data exists

ADMIN_EMAIL=you@example.com                # this account becomes Admin + Approved

EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_ENABLE_SSL=true
EMAIL_USERNAME=<smtp user>
EMAIL_PASSWORD=<smtp password / app password>
EMAIL_FROM_EMAIL=noreply@yourdomain.com
EMAIL_FROM_NAME=LifeSync Tracker

APP_PORT=8088
```

`chmod 600 .env`. Note that Gmail requires an **app password** (not the account
password) with 2FA enabled, host `smtp.gmail.com`, port `587`, SSL on.

### 5.3 Launch

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

The backend applies migrations and seeds on startup, so a fresh database needs no manual
step. Then register `ADMIN_EMAIL` through the UI — it is auto-approved — and approve
everyone else from `/admin`.

Health check: `curl http://localhost:8088/api/health/healthcheck`.

### 5.4 Harden the compose file before exposing the host

Two things in `docker-compose.yml` are tuned for local development and should be changed
on a public server:

1. **The backend publishes `5555:8080`.** That exists so `ng serve` can reach the API
   directly. In production it exposes the API on the host, bypassing nginx and any rate
   limiting or headers it adds. Either delete the `ports:` block from the `backend`
   service (nginx reaches it over the internal network as `backend:8080`, which is all
   it needs), or bind it to loopback: `- "127.0.0.1:5555:8080"`.
2. **The frontend publishes `${APP_PORT}:80` on all interfaces.** If you terminate TLS
   with a reverse proxy on the same host, bind it to loopback too:
   `- "127.0.0.1:${APP_PORT:-8088}:80"`.

Then make sure the firewall only allows 22/80/443.

### 5.5 TLS / reverse proxy

The app container speaks plain HTTP on `APP_PORT`. Put a TLS terminator in front.

**Caddy** (easiest — automatic Let's Encrypt certificates):

```
lifesync.yourdomain.com {
    reverse_proxy 127.0.0.1:8088
}
```

**nginx** on the host, if you prefer certbot:

```nginx
server {
    listen 443 ssl http2;
    server_name lifesync.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/lifesync.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lifesync.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name lifesync.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

No backend CORS change is needed: the production Angular build calls `/api`, which the
container's own nginx ([frontend/nginx.conf](frontend/nginx.conf)) proxies to
`http://backend:8080/api/` — same origin from the browser's point of view.

### 5.6 Updating a running deployment

```bash
cd lifesynctracker
git pull
docker compose up -d --build
docker compose logs -f backend   # watch migrations apply
```

Compose recreates only what changed; the `db-data` volume is untouched. Take a backup
first (5.7) whenever the update contains a migration.

**Alternative — prebuilt images.** [.github/workflows/build.yml](.github/workflows/build.yml)
pushes `drashkko/lifesync-tracker-backend` and `…-frontend` to Docker Hub on every
published GitHub release. To deploy those instead of building on the server, replace the
`build:` blocks in `docker-compose.yml` with `image: drashkko/lifesync-tracker-backend:<tag>`
(and the frontend equivalent), then `docker compose pull && docker compose up -d`.

### 5.7 Backups

The whole state is the `db-data` volume. Dump it regularly:

```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "backup-$(date +%F).sql.gz"
```

Restore into a fresh stack:

```bash
gunzip -c backup-2026-08-06.sql.gz | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

> 🔑 **A database backup is worthless without `ENCRYPTION_KEY`.** Usernames, emails,
> project names and category names are stored encrypted, and the login lookup uses an
> HMAC blind index derived from the same key. Store the key somewhere separate from the
> dumps (a password manager), and back it up as carefully as the data.

### 5.8 Migrating an existing production database to this version

If you are upgrading a deployment that already holds real data:

1. `ENCRYPTION_KEY` in `.env` **must** be byte-for-byte the key that database was
   created with. Anything else and every encrypted field is garbage and login fails.
2. `JWT_KEY` may be rotated freely — it only invalidates existing sessions.
3. The `AddUserAccessControlAndEmailVerification` migration is additive and backfills
   existing users to `Status=Approved` / `Role=User`, so the upgrade is non-destructive.
4. Rehearse it anyway: restore the latest dump into a throwaway Postgres container, run
   this build against it with the real key, and confirm you can log in as an existing
   user before touching production.

### 5.9 Operations checklist

- [ ] `.env` filled, `chmod 600`, never committed
- [ ] `ENCRYPTION_KEY` backed up separately from the database dumps
- [ ] Backend `ports:` removed or bound to `127.0.0.1`
- [ ] TLS terminating in front of `APP_PORT`
- [ ] Firewall limited to 22/80/443
- [ ] Automated `pg_dump` on a schedule, restore tested at least once
- [ ] `ADMIN_EMAIL` account registered and admin approval flow verified
- [ ] Verification email actually delivered from the production SMTP account
