# LIVE.md — Putting DynamicMenu on the Internet

Step-by-step guide to deploy DynamicMenu to production:

```text
                 https://dynamicmenu.store
                ┌──────────────┐
   browser ───▶ │    Vercel    │  apps/web (React + Vite, static + SPA)
                └──────────────┘
                       │  https://api.dynamicmenu.store
                       ▼
                ┌──────────────┐
                │    Render    │  apps/api (Express + Prisma)
                └──────────────┘
                       │  DATABASE_URL (pooled)
                       ▼
                ┌──────────────┐
                │     Neon     │  Postgres — project "dynamicMenu",
                │  (production)│  branch "production"
                └──────────────┘
        Clerk (auth) · Sentry (monitoring) · S3/R2 (images, before launch)
```

**Status:** the codebase is production-complete (Phases 1–17, 125 tests green). This guide covers everything that requires *your* accounts: Neon, Clerk, Sentry, GitHub, Render, Vercel, DNS.

---

## 0. Accounts checklist

| Service | You need | Already have |
|---|---|---|
| GitHub | repo `mdfaizanashrafi/dynamicmenu-v1` pushed with latest code | ✅ |
| Neon | org `admin@dynamicmenu.store`, project **dynamicMenu** (`orange-mouse-04524950`), branch **production** (`br-holy-cloud-b4g9yeot`) | ✅ |
| Clerk | app **dynamicMenu** (`app_3KbRCULxOTHWLBN7qK1LmlJUeDw`) — development instance live; **production instance must be enabled** | ⚠️ partial |
| Sentry | two projects (web + api) | ❌ |
| Render | account connected to GitHub | ❌ |
| Vercel | account connected to GitHub | ❌ |
| DNS | control of `dynamicmenu.store` | ❌ (you own the domain) |

---

## 1. Neon (Postgres) — 15 min

Everything below uses the Neon CLI (installed: `npm i -g neon`, signed in as `admin@dynamicmenu.store`).

### 1.1 Link this repo to the project and production branch

```bash
# from the repo root — --no-env-pull protects your local dev .env
neon link --org-id org-polished-shadow-38475910 --project-id orange-mouse-04524950 -y --no-env-pull
neon checkout production --no-env-pull
```

This writes org/project/branch IDs to `.neon` (git-ignored).

### 1.2 Get the connection string

Use the **pooled** endpoint (Neon serverless driver / PgBouncer — right for Render's ephemeral connections):

```bash
# writes Neon vars to a SEPARATE file — does not touch apps/api/.env
neon env pull --file apps/api/.env.neon
grep -c '^DATABASE_URL' apps/api/.env.neon   # should print 1
```

Add `apps/api/.env.neon` to `.gitignore` if it isn't covered by an existing `.env*` rule.

### 1.3 Create the schema (run all 13 migrations)

```bash
cd apps/api
DATABASE_URL=$(grep '^DATABASE_URL' .env.neon | cut -d'"' -f2) \
  npx prisma migrate deploy --schema ../../prisma/schema.prisma
cd ../..
```

Expect `All migrations have been applied successfully` (13 migrations).

### 1.4 Verify from your machine

```bash
DATABASE_URL=$(grep '^DATABASE_URL' apps/api/.env.neon | cut -d'"' -f2) \
  npx prisma db execute --schema prisma/schema.prisma --stdin <<'SQL'
SELECT count(*) AS migrations FROM _prisma_migrations;
SQL
```

Should print 13. **Leave your local `apps/api/.env` pointing at local Postgres** — local dev keeps working.

> **Note (free plan):** Neon free has no PITR backups. Set up a backup before real data exists (§10).

---

## 2. Clerk (auth) — 15 min

Your app already uses Clerk end-to-end (web: `@clerk/clerk-react` provider, sign-in/up pages, `AuthGuard`; API: `@clerk/backend` JWT verification). You only need **production keys + URLs**.

1. Open <https://dashboard.clerk.com/> → app **dynamicMenu** → you'll see a
   **"Production instance"** setup prompt → follow it (choose the domain
   `dynamicmenu.store` when asked).
2. In the production instance, open **API Keys** and copy:
   - **Publishable key** (`pk_live_…`)
   - **Secret key** (`sk_live_…`) — shown once
3. In **Domains → Allowed origins / redirect URLs**, add exactly:
   ```
   https://dynamicmenu.store
   https://www.dynamicmenu.store
   https://api.dynamicmenu.store
   ```
4. Keep the **development** keys in your local `.env` files as they are —
   you'll use the **live** keys only in Render/Vercel (§8 table).

> `clerk doctor` currently reports "production not configured" — that's the step above.

---

## 3. Sentry (monitoring) — 10 min

1. <https://sentry.io> → create two projects:
   - `dynamicmenu-web` (platform: React)
   - `dynamicmenu-api` (platform: Express)
2. Copy each **DSN** (looks like `https://xxxxx@o000000.ingest.sentry.io/0000000`).

The SDKs are already wired in code (`apps/web/src/lib/sentry.ts`, `apps/api/src/lib/sentry.ts`) — they activate the moment a DSN is present.

---

## 4. Image storage — REQUIRED before launch (code change)

⚠️ **Do not skip.** Uploaded logos/item photos currently go to **local disk** (`apps/api/uploads`), which is **ephemeral on Render** — files vanish on every redeploy/restart.

1. Create a bucket: **AWS S3** or **Cloudflare R2** (R2 has zero egress — recommended).
2. Implement the existing provider interface in `apps/api/src/services/storage.ts`
   (replace the local-disk provider; the interface is already isolated):
   ```ts
   // env additions (set in Render): S3_ENDPOINT, S3_REGION, S3_BUCKET,
   //   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL
   ```
   Upload via `@aws-sdk/client-s3` (or `aws4fetch` on R2); store/serve public URLs.
3. Set `API_BASE_URL`-joined public URLs as today, so existing rows keep working.
4. Run the suite (`npm run typecheck && npm run test && npm run build`) and commit.

> Until this lands, everything else works — just don't upload images in production.

---

## 5. Push to GitHub & verify CI — 10 min

```bash
git add -A
git commit -m "production hardening + deployment config (LIVE.md)"
git push origin main
```

Watch **Actions** on the repo: the `CI` workflow (`.github/workflows/ci.yml`) spins up a Postgres service and runs typecheck → lint → 125 tests → build. **Deploy nothing until this is green.**

---

## 6. Render (API) — 20 min

### 6.1 Create the service from the blueprint

The repo root `render.yaml` describes the service (build runs install → prisma generate → **migrate deploy** → build; health check `/api/v1/health`).

1. <https://dashboard.render.com> → **New +** → **Blueprint** → connect repo `mdfaizanashrafi/dynamicmenu-v1`.
2. Render detects `render.yaml` → shows `dynamicmenu-api` → **Apply**.
3. It provisions immediately **but the first deploy will fail** — env vars aren't set yet. That's expected.

### 6.2 Set environment variables

**Render → dynamicmenu-api → Environment → Add/override** each of these (values from §8):

| Key | Source |
|---|---|
| `DATABASE_URL` | Neon **pooled** URL from §1.2 (wrap in quotes; contains `?sslmode=require`) |
| `CLERK_SECRET_KEY` | `sk_live_…` from §2 |
| `SENTRY_DSN` | api DSN from §3 |
| `API_BASE_URL` | `https://api.dynamicmenu.store` (your final API origin) |
| `WEB_BASE_URL` | already set by blueprint: `https://dynamicmenu.store` |
| `CORS_ORIGIN` | already set by blueprint: `https://dynamicmenu.store` |
| `ENABLE_DEV_AUTH` | **must NOT be set** (blank/absent — dev bypass is production-disabled) |

> `NODE_ENV`, `API_PORT`, `UPLOAD_DIR` come from the blueprint; leave them.

**Save → Manual Deploy → Clear build cache & deploy.** Watch the logs:
`migrate deploy` must print all migrations applied, then `DynamicMenu API listening`.

### 6.3 Verify

```bash
curl https://dynamicmenu-api.onrender.com/api/v1/health
# {"success":true,"data":{"status":"ok","database":"ok",...}}
curl -i https://dynamicmenu-api.onrender.com/api/v1/me
# HTTP/2 401  +  {"success":false,"error":{"code":"AUTH_REQUIRED",...}}
# (401 = good: Clerk verification is live, no dev bypass)
```

### 6.4 Attach the custom domain

Render → dynamicmenu-api → **Settings → Custom Domains → Add** `api.dynamicmenu.store` → Render gives you a `xxx.onrender.com` CNAME target → add it in DNS (§7), then wait for the ✅ certificate.

---

## 7. Vercel (web) — 15 min

### 7.1 Import the project

1. <https://vercel.com/new> → import `mdfaizanashrafi/dynamicmenu-v1`.
2. Vercel reads the root `vercel.json` automatically:
   - Framework: **Vite** · Build Command: `npm run build -w @dynamicmenu/web` · Output: `apps/web/dist`
   - SPA rewrites to `/index.html` are already declared.
3. **Environment Variables** (Production) — from §8:

   | Key | Value |
   |---|---|
   | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_…` (§2) |
   | `VITE_API_BASE_URL` | `https://api.dynamicmenu.store` |
   | `VITE_SENTRY_DSN` | web DSN (§3) |

   > These are **build-time** vars for Vite — every change requires a redeploy.

4. **Deploy.** Smoke-test the `.vercel.app` URL (§9) *before* attaching the domain.

### 7.2 Attach the domain

Vercel → project → **Settings → Domains** → add `dynamicmenu.store` (+ `www.dynamicmenu.store`, redirect to apex). Vercel shows the DNS records to create (§7 table) and issues TLS automatically.

---

## 8. Complete environment variable reference

### API — Render (`dynamicmenu-api`)

| Variable | Example / source | Required |
|---|---|---|
| `DATABASE_URL` | Neon pooled: `postgresql://…-pooler…/neondb?sslmode=require` | ✅ |
| `CLERK_SECRET_KEY` | `sk_live_…` — Clerk production instance | ✅ |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_…` — only if you later add Clerk webhooks | ➖ |
| `API_BASE_URL` | `https://api.dynamicmenu.store` (drives absolute image/logo URLs) | ✅ |
| `WEB_BASE_URL` | `https://dynamicmenu.store` (drives QR code URLs `/q/{token}`) | ✅ |
| `CORS_ORIGIN` | `https://dynamicmenu.store` | ✅ |
| `NODE_ENV` | `production` (blueprint) | ✅ |
| `API_PORT` | `4000` (blueprint) | ✅ |
| `UPLOAD_DIR` | `uploads` (until §4 lands; after S3 it's unused) | ✅ |
| `SENTRY_DSN` | `https://…@o….ingest.sentry.io/…` (api project) | ➖ |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_PUBLIC_BASE_URL` | after §4 | ➖ |
| `ENABLE_DEV_AUTH` | **absent** — never set in production | 🚫 |
| `SENTRY_AUTH_TOKEN` / `CLERK_WEBHOOK_SECRET` | reserved; not read by code today | ➖ |

### Web — Vercel

| Variable | Example / source | Required |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_…` | ✅ |
| `VITE_API_BASE_URL` | `https://api.dynamicmenu.store` | ✅ |
| `VITE_SENTRY_DSN` | web project DSN | ➖ |

### DNS records (at your registrar)

| Host | Type | Value |
|---|---|---|
| `dynamicmenu.store` | `A` | `76.76.21.21` (Vercel apex) |
| `www` | `CNAME` | `cname.vercel-dns.com` |
| `api` | `CNAME` | `<service>.onrender.com` (from Render dashboard) |

---

## 9. Production smoke test — 15 min

Run this whole list against the live domain; every line is a real assertion:

```bash
BASE=https://api.dynamicmenu.store
WEB=https://dynamicmenu.store

# 1. API health + DB
curl -s $BASE/api/v1/health        # → "status":"ok","database":"ok"

# 2. Auth enforced (401s, no dev bypass)
curl -s -o /dev/null -w '%{http_code}\n' $BASE/api/v1/me            # → 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/api/v1/restaurants  # → 401

# 3. Web serves + SPA fallback
curl -s -o /dev/null -w '%{http_code}\n' $WEB/                      # → 200
curl -s -o /dev/null -w '%{http_code}\n' $WEB/sign-in               # → 200
curl -s -o /dev/null -w '%{http_code}\n' $WEB/q/some-token          # → 200

# 4. Security headers present
curl -sI $BASE/api/v1/health | grep -i 'strict-transport-security\|content-security-policy'

# 5. Real sign-up → dashboard
#    Open $WEB in a browser, sign up (first user), create a restaurant,
#    then: add a table, build+publish a menu, open the table's /q/<token>
#    link from Tables & QR, place an order, confirm it in /dashboard/orders,
#    walk it to PAID, check analytics + loyalty.
```

Then open `https://dynamicmenu.store` → sign-up → dashboard. **You are live.** 🎉

---

## 10. Operations after launch

| Concern | What to do |
|---|---|
| **Backups** | Neon free has no PITR. Schedule a nightly `pg_dump` (GitHub Action cron → artifact, or `neon branches create` snapshot-style copies). Upgrade to a paid Neon plan for PITR when revenue justifies it. |
| **Migrations** | They're already in the Render build (`db:deploy`). To run one manually: set `DATABASE_URL` locally to the Neon pooled URL, `npm run db:deploy -w @dynamicmenu/api`. |
| **Preview environments** | `neon checkout preview-x --create` gives a copy-on-write DB per PR; point a Render preview service's `DATABASE_URL` at it. |
| **Logs** | Render → Logs (pino, auth headers redacted). Sentry for errors. |
| **Rollback** | Vercel/Render keep previous deploys (instant "redeploy previous"). DB rollbacks: restore a Neon branch/snapshot — test this once before you need it. |
| **Clerk** | Add `https://api.dynamicmenu.store` to allowed origins if you add webhooks later. |
| **QR codes** | QR URLs are `https://dynamicmenu.store/q/{token}` — reprinting only needed if the domain ever changes. |

---

## 11. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| API 503 on cold start | Render free tier sleeps — first request takes ~30–60 s (health check keeps it warm-ish); upgrade or accept it. |
| CORS errors in browser | `CORS_ORIGIN` must exactly match the web origin (`https://dynamicmenu.store`, no trailing slash). |
| `AUTH_NOT_CONFIGURED` | `CLERK_SECRET_KEY` missing — API loads its own `.env` only from the process env; check the Render env list. |
| Clerk sign-in loop | Add the exact origin to Clerk **Allowed origins/redirect URLs** (§2.3). |
| Images 404 after redeploy | §4 not done — local disk is ephemeral. Implement S3/R2 provider. |
| `migrate deploy` fails in build | `DATABASE_URL` wrong/unreachable — must be the **pooled** Neon URL with `sslmode=require`. |
| `PRISMA P2002` / migration drift | Someone changed the DB by hand — never do that; all schema via `prisma/migrations`. |
| Web works, API 401s everything | You're testing with dev-bypass expectations — production has no bypass by design; sign in via Clerk. |

---

*Last updated: 2026-10-13 — matches repo state at Phase 17 complete (13 Prisma migrations, `render.yaml` with in-build migrations, Clerk live keys in local dev, Neon MCP/skills configured).*
