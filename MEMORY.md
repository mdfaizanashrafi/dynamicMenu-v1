# DynamicMenu — Project Memory

> Living project state.
>
> Read FIRST before development.
>
> Update after meaningful work.
>
> Never invent history or completed work.
>
> This file tracks **actual project state**, not planned architecture. Refer to `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `PHASES.md`, and `RULES.md` for authoritative specifications.

---

# 1. Project Identity

**Product:** DynamicMenu

**Product Type:** Multi-tenant SaaS

**Core Concept:** QR-based digital menu and restaurant ordering platform.

**One-line Description:**

> DynamicMenu helps restaurants replace traditional printed menus with customizable, theme-based, QR-powered digital menus.

**Primary User:**

Restaurant owner / restaurant staff.

**Secondary User:**

Restaurant customer.

---

# 2. Current Project Status

**Current Phase:** Phase 6 — Customer Menu (implemented and verified locally; hosted Clerk account still pending)

**Status:** Phase 6 code complete and verified locally (typecheck/lint/test/build + HTTP smoke of QR scan → published menu → theme → categories → items → offers). Customers can browse a mobile-first, theme-rendered menu with sections, items, variants, add-ons, and active offers; no account is required.

**Current Objective:**

Turn the scanned QR code into a complete table-specific menu experience: restaurant branding, published menu snapshot, theme rendering, category navigation, item details with variants/add-ons, and offers.

### Current State

```text
Documentation
    ↓
PRD
ARCHITECTURE
DESIGN
PHASES
MEMORY
    ↓
Development Foundation
    ↓
Local setup complete & verified
    ↓
Phase 1: Auth & Multi-Tenancy
    ↓
Implemented & verified locally
    ↓
Phase 2: Restaurant Onboarding
    ↓
Implemented & verified locally
    ↓
Phase 3: Menu Management
    ↓
Implemented & verified locally
    ↓
Phase 4: Theme System
    ↓
Implemented & verified locally
    ↓
Phase 5: Tables & QR
    ↓
Implemented & verified locally
    ↓
Phase 6: Customer Menu
    ↓
Implemented & verified locally
(Hosted services pending credentials)
```

No production application functionality should be considered complete unless explicitly recorded in this file.

---

# 3. Product Core

DynamicMenu consists of four major product areas:

```text
RESTAURANT
Create and manage the restaurant

MENU
Create, customize and publish digital menus

CUSTOMER
Scan QR, browse menu and order

BUSINESS
Manage orders, customers, reviews and analytics
```

The core product loop is:

```text
Restaurant Signup
       ↓
Restaurant Setup
       ↓
Menu Creation
       ↓
Theme Selection
       ↓
Table Creation
       ↓
QR Generation
       ↓
Customer Scans QR
       ↓
Customer Views Menu
       ↓
Customer Places Order
       ↓
Restaurant Processes Order
       ↓
Restaurant Marks Order Paid
       ↓
Customer Review Flow
```

---

# 4. Current Development Phase

## Phase 6 — Customer Menu

### Objective

Build the public mobile-first customer experience: scan a QR code, resolve the table, and browse the restaurant's published menu with theme, categories, items, variants, add-ons, and offers (PHASES.md §10).

### Current Completion

```text
Offer model + migration            [x] Done (Offer: restaurantId, title, description, badgeText, imageUrl, isActive, position; migration 20261009141616_phase6_customer_menu_offers)
Public menu endpoint               [x] Done (GET /api/v1/public/qr/:token/menu returns {restaurant, table, menu snapshot, theme, active offers}; no auth)
Published snapshot serving         [x] Done (serves MenuRevision snapshot only; draft edits never leak)
Theme rendering                    [x] Done (published theme config → CSS custom properties via unit-tested themeToTokens)
Mobile-first customer UI           [x] Done (/q/:token: loading/error/empty states, restaurant header, sticky category nav, offers banner, sectioned food cards, item detail dialog with variants/add-ons)
Variants & add-ons                 [x] Done (item detail supports selecting a variant and toggling add-ons; live price calculation)
Availability                       [x] Done (unavailable items are visually disabled and cannot be added)
Dietary tags                       [x] Done (badges rendered on food cards and detail dialog)
Tenant isolation                   [x] Done (token → restaurant; another restaurant's token cannot access this menu)
```

### Key Design Decision

The customer menu is served from a single public endpoint keyed by the QR token. It returns the published `MenuRevision` snapshot (not the draft tree) plus the published theme config and active offers. Theme tokens are applied as CSS custom properties on the page container, so the same menu data renders completely differently per restaurant without touching menu rows. Cart/order persistence is intentionally out of scope — it belongs to Phase 7.

### Verification (2026-10-09, local)

`npm run typecheck`, `npm run lint`, `npm run test` (57 tests: 43 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/customer-menu.test.ts`, 5 tests): published menu snapshot + theme + active offers, default theme fallback, no published menu returns `menu: null`, invalid/inactive QR → 404 `INVALID_QR`, cross-restaurant token isolation.
HTTP smoke: create restaurant → create menu → section → item with variants/add-ons → publish → create table → `GET /public/qr/:token/menu` returns the full payload; web `/q/:token` serves the built app.

---

## Phase 5 — Tables & QR (completed)

### Objective

Create restaurant tables, generate unique QR codes, and build the public resolution layer that maps a scanned QR token to a restaurant + table (PHASES.md §9).

### Current Completion

```text
RestaurantTable model + migration  [x] Done (RestaurantTable: restaurantId, label, qrToken @unique, isActive; migration 20261009101341_phase5_tables_qr)
Unique QR tokens                   [x] Done (crypto.randomBytes(18).toString("base64url"); collision retry; internal IDs never exposed)
Tables API                         [x] Done (CRUD + PATCH {rotateToken: true} under /restaurants/:rid/tables; MANAGER+; tenant-scoped loaders)
Public QR resolution               [x] Done (GET /api/v1/public/qr/:token, no auth, returns {restaurant, table} or 404 INVALID_QR)
QR code generation                 [x] Done (qrcode library; QrImage component; QrViewDialog preview + PNG download)
Dashboard management UI            [x] Done (/dashboard/tables: add, inline rename, activate/deactivate, rotate token, delete, copy menu link)
Customer landing page              [x] Done (/q/:token resolves token and shows restaurant/table or INVALID_QR error)
Onboarding integration             [x] Done ("Active table" step; total now 8)
Tenant security tests              [x] Done (cross-restaurant table access blocked; rotated/deactivated/inactive tokens invalidated)
```

### Key Design Decision

QR URLs are `/q/{qrToken}` where `qrToken` is a 24-byte URL-safe base64 string stored uniquely on `RestaurantTable`. Rotating or deleting a table changes/removed the token, so old printed codes stop resolving with a clear `INVALID_QR` message. The public resolver is unauthenticated and rate-limited; it returns only display fields (name, slug, logoUrl, table label), never internal IDs or business state.

### Verification (2026-10-09, local)

`npm run typecheck`, `npm run lint`, `npm run test` (52 tests: 38 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/tables.test.ts`, 6 tests): unique tokens, public resolution, invalid/rotated/deactivated QR handling, tenant scoping, role boundaries.
Web tests: `table-label` unit tests (suggested labels for first/empty tables).
HTTP smoke: create restaurant → create table → public QR resolves → list tables → rotate token → old QR 404 `INVALID_QR`; web `/q/:token` and `/dashboard/tables` routes serve via built app.

---

## Phase 4 — Theme System (completed)

### Objective

Allow restaurants to customize how their customer-facing menu looks (PHASES.md §8): theme selection, configuration, preview, publishing.

### Current Completion

```text
Theme model + migration       [x] Done (RestaurantTheme: draftConfig/publishedConfig JSON + publishedAt, migration phase4_theme_system)
Theme presets                 [x] Done (4 built-ins: Modern Minimal, Midnight Luxury, Traditional Indian, Festive — themes/themes.presets.ts)
Theme APIs                    [x] Done (GET/PUT /theme, POST /theme/publish, GET /theme/preview, POST /theme/image; MANAGER+)
Draft/publish split           [x] Done (same pattern as menus; published theme stays stable while draft is edited)
Menu data integrity           [x] Done (integration test: theme save+publish leaves menu rows AND revision snapshot byte-identical)
Builder UI                    [x] Done (/dashboard/themes: preset gallery, color/typography/card/button/background/header/decorations controls, cover upload, sticky live preview w/ real published menu or sample dishes)
Design tokens                 [x] Done (themeToTokens maps config → CSS custom properties; unit-tested; reused by Phase 6 customer menu)
```

### Key Design Decision

Themes are presentation-only config JSON (ARCHITECTURE.md §12). The customer menu renderer (Phase 6) applies theme tokens to menu data at render time; menu rows and MenuRevision snapshots are never written by theme operations. Cover images get a dark overlay to protect text contrast (DESIGN.md §12.5).

### Verification (2026-10-08, local)

`npm run typecheck`, `npm run lint`, `npm run test` (45 tests), `npm run build` all pass.
New API tests (`apps/api/test/themes.test.ts`, 6 tests): preset defaults, save/validation/publish stability, menu-data integrity (rows + snapshot unchanged), preview payload, role/tenant boundaries.
Web tests: `theme-to-tokens` unit tests (colors/fonts/radii, solid/gradient/pattern/cover backgrounds).
HTTP smoke: default presets → save midnight-luxury draft → publish → preview → edit draft to festive → published still midnight-luxury.

---

## Phase 3 — Menu Management (completed)

### Objective

Build the core restaurant menu CMS (PHASES.md §7): menus, sections, items, variants, add-ons, images, pricing, availability, draft/publish.

### Current Completion

```text
Menu model + migration        [x] Done (Menu/MenuSection/MenuItem/MenuItemVariant/MenuItemAddon/MenuRevision, 20261004073613_phase3_menu_management)
Menu CRUD + activate/archive  [x] Done (archive is soft-delete; revisions preserved)
Section CRUD + reorder + hide [x] Done (PUT sections/order)
Item CRUD                     [x] Done (variants/add-ons nested, wholesale replace on update)
Item images                   [x] Done (shared upload-image middleware, local-disk storage)
Availability + dietary tags   [x] Done (item/variant/add-on level; VEG/NON_VEG/VEGAN/SPICY/GLUTEN_FREE)
Draft/publish                 [x] Done (publish validates + writes MenuRevision snapshot; draft stays editable; unpublish supported; revision history endpoint)
Builder UI                    [x] Done (/dashboard/menus list; /dashboard/menus/:id builder with section cards, item dialog, publish dialog)
Onboarding integration        [x] Done ("First menu published" step; total now 7)
```

### Key Design Decision

Draft/publish uses **snapshot revisions** (ARCHITECTURE.md §11): the draft tree is the editable working copy; publishing validates it (≥1 section, ≥1 item) and stores a self-contained JSON snapshot in `MenuRevision`, which `Menu.currentRevisionId` points at. Customer endpoints (Phase 6) must serve snapshots only — draft edits never leak to the live menu (verified by an integration test that edits the draft after publishing and asserts the snapshot is unchanged).

### Verification (2026-10-04, local)

`npm run typecheck`, `npm run lint`, `npm run test` (36 tests), `npm run build` all pass.
New API tests (`apps/api/test/menus.test.ts`, 7 tests): menu/section/item CRUD, reorder, validation (bad price, bad dietary tag), item image upload + type rejection, publish of incomplete menu → 400 `MENU_INCOMPLETE`, publish + republish + unpublish, **draft-edit-after-publish does not change the live snapshot**, STAFF → 403, outsider and cross-restaurant menu access → 404.
HTTP smoke: create menu → section → item with variants/add-ons → publish → draft item added → live snapshot still lists only the published item.

---

## Phase 2 — Restaurant Onboarding (completed)

### Objective

Allow a newly registered restaurant to configure its basic identity.

### Current Completion

```text
Restaurant profile fields    [x] Done (migration 20261003132614_phase2_restaurant_profile)
Profile edit API             [x] Done (PATCH accepts all profile fields, zod-validated)
Profile detail API           [x] Done (GET /:id with full profile)
Onboarding progress          [x] Done (derived 6-step checklist in detail response)
Logo upload                  [x] Done (POST /:id/logo, multipart, JPEG/PNG/WebP ≤ 2 MB, local-disk storage)
Dashboard settings page      [x] Done (/dashboard/settings, section anchors, ADMIN+ edit)
Onboarding dashboard UI      [x] Done (progress card on overview, links back to settings)
Branding                     [x] Done (primary color field + color picker)
```

### Verification (2026-10-03, local)

`npm run typecheck`, `npm run lint`, `npm run test` (27 tests), `npm run build` all pass.
New API tests (`apps/api/test/onboarding.test.ts`): profile PATCH + progress reflection, validation errors, logo upload persistence, invalid file type/size/missing rejections, STAFF read-only vs ADMIN edit, outsider → 404.
Web tests: OnboardingCard (count, progressbar, deep links, 100% state), AuthGuard.
HTTP smoke test with dev-auth bypass: create restaurant → patch profile → upload logo → onboarding 6/6 → uploaded file byte-identical and served at its URL.

---

## Phase 1 — Authentication & Multi-Tenancy (completed)

### Objective

Allow restaurant owners to create accounts and securely operate independent restaurant workspaces.

### Current Completion

```text
Clerk SDK integration       [x] Done (web provider + sign-in/up pages; backend JWT verification in lib/clerk.ts)
Application user record     [x] Done (User synced from Clerk identity on first request)
Restaurant entity           [x] Done (create/list/update, slug uniqueness)
Restaurant membership       [x] Done (OWNER membership created atomically with restaurant)
Roles/permissions           [x] Done (OWNER/ADMIN/MANAGER/STAFF hierarchy, backend-enforced)
Tenant middleware           [x] Done (requireMembership; non-members get 404, wrong role gets 403)
Protected APIs              [x] Done (/me, /restaurants/* behind requireAuth)
Protected dashboard routes  [x] Done (AuthGuard gates /dashboard; /sign-in /sign-up public)
Tenant isolation tests      [x] Done (cross-tenant read/write blocked — integration-tested against real Postgres)
```

### Verification (2026-10-03, local)

`npm run typecheck`, `npm run lint`, `npm run test` (17 tests), `npm run build` all pass.
API integration tests (`apps/api/test/authorization.test.ts`, `phase1-flow.test.ts`) run migrations against a real local PostgreSQL and verify: cross-tenant reads/writes → 404, insufficient role → 403, missing credentials → 401, user sync, restaurant creation with OWNER membership, and tenant-scoped listing.
Web tests include AuthGuard behavior (redirect to /sign-in when signed out, loading state, not-configured state).
Built API smoke test: `/api/v1/health` → 200; unauthenticated `/me` and `/restaurants` → 401.

### Not Yet Verified

Real Clerk sign-in (requires a Clerk application + keys). Token verification code path is tested with a stub verifier; `ENABLE_DEV_AUTH` header bypass exists for local development without keys.

---

## Phase 0 — Project Foundation (completed)

### Planned Work

* Repository inspection
* Documentation review
* Codebase analysis
* Development environment
* Frontend foundation
* Backend foundation
* Database foundation
* Authentication foundation
* Monitoring foundation
* Deployment foundation
* CI/CD foundation

### Current Completion

```text
Repository Audit        [x] Done (2026-09-27)
Architecture            [x] Done (monorepo scaffold per ARCHITECTURE.md §38)
Development Environment [x] Done (npm workspaces, .env.example, Node 20+)
Database                [~] Prisma configured, client generated; Neon connection pending DATABASE_URL
Authentication          [~] Clerk SDK wired (frontend provider, backend env); pending Clerk keys/account
Monitoring              [~] Sentry SDK wired in web + api; pending DSN
Frontend Foundation     [x] Done (React 19 + TS + Vite + Tailwind v4 + tokens, routing, base layout)
Backend Foundation      [x] Done (Express 5 + TS + zod validation, error shape, logging, health endpoint)
Deployment              [~] vercel.json + render.yaml created; deployments not yet provisioned
CI/CD                   [x] GitHub Actions workflow created; runs on push to GitHub remote
```

---

# 5. Completed Work

```text
[x] Repository audit — docs + design-references reviewed; no prior app code existed
[x] Codebase analysis — repo was documentation-only before Phase 0
[x] Architecture implementation — npm-workspaces monorepo: apps/web, apps/api, prisma/
[x] Frontend foundation — verified (typecheck, lint, test, build, vite preview smoke test)
[x] Backend foundation — verified (typecheck, lint, test, build, health endpoint smoke test)
[x] Phase 1 tenant core — Prisma models (User, Restaurant, RestaurantMembership, Role enum) + migration 20260927181123_phase1_tenant_core
[x] Phase 1 Clerk auth — backend JWT verification + user sync; web sign-in/up pages; token path tested with stub verifier
[x] Phase 1 roles & tenant isolation — requireMembership middleware, role hierarchy, 404/403/401 enforcement, integration-tested against real Postgres
[x] Phase 1 protected dashboard — AuthGuard gates /dashboard; /sign-in /sign-up routes; web tests for guard behavior
[x] Phase 2 restaurant profile — 13 new Restaurant fields + migration 20261003132614_phase2_restaurant_profile (dev + test DBs migrated)
[x] Phase 2 onboarding APIs — GET /:id detail with derived 6-step progress; PATCH profile; POST /:id/logo (multipart, type/size validated)
[x] Phase 2 dashboard UI — /dashboard/settings (profile form, logo uploader, branding color), onboarding progress card on overview
[x] Phase 3 menu domain — Menu/MenuSection/MenuItem/MenuItemVariant/MenuItemAddon/MenuRevision + migration 20261004073613_phase3_menu_management (dev + test DBs migrated)
[x] Phase 3 menu APIs — full CRUD, section reorder/hide, item images, availability, dietary tags, publish/unpublish with snapshot revisions (draft edits never leak to the live snapshot)
[x] Phase 3 builder UI — /dashboard/menus + /dashboard/menus/:menuId (section cards, item editor dialog with variants/add-ons, publish dialog with change summary)
[x] Phase 4 theme system — RestaurantTheme (draft/published config JSON) + migration phase4_theme_system; 4 built-in presets; theme APIs with publish + preview; /dashboard/themes gallery + editor + live preview; menu-data integrity tested
[x] Phase 5 tables & QR — RestaurantTable schema + migration 20261009101341_phase5_tables_qr; unique URL-safe qrToken; tables CRUD + rotate API; public /api/v1/public/qr/:token resolution; /dashboard/tables management + QR preview/download; /q/:token customer landing page; onboarding "Active table" step; tenant-security tested
[x] Phase 6 customer menu — Offer model + migration 20261009141616_phase6_customer_menu_offers; public `/api/v1/public/qr/:token/menu` endpoint; published MenuRevision snapshot + published theme + active offers served to mobile-first /q/:token page; category navigation, item cards, item detail dialog with variants/add-ons; loading/error/empty states
[ ] Database setup — Prisma configured; local dev + test Postgres verified; awaiting Neon DATABASE_URL for hosted environments
[ ] Clerk authentication — code complete; awaiting Clerk application keys to verify real sign-in
[ ] Sentry monitoring — SDK wired; awaiting DSN
[ ] Vercel deployment — vercel.json ready; not provisioned
[ ] Render deployment — render.yaml ready; not provisioned
[ ] CI/CD — workflow updated with Postgres service for tests; not yet run on GitHub
```

Verification evidence (2026-10-09, local):
`npm run typecheck`, `npm run lint`, `npm run test` (57 tests: 43 API + 14 web), `npm run build` all pass.
HTTP smoke: create restaurant → create menu → section → item (variants/add-ons) → publish → create table → `GET /api/v1/public/qr/:token/menu` returns restaurant + table + published snapshot + theme + offers; web `/q/:token` serves the built customer menu app.

Verification evidence (2026-10-09, local):
`npm run typecheck`, `npm run lint`, `npm run test` (52 tests: 38 API + 14 web), `npm run build` all pass.
HTTP smoke: create restaurant → create table → public QR resolves → list tables → rotate token → old QR 404 `INVALID_QR`; web `/q/:token` and `/dashboard/tables` routes serve via built app.

Verification evidence (2026-10-08, local):
`npm run typecheck`, `npm run lint`, `npm run test` (45 tests), `npm run build` all pass.
HTTP smoke: theme defaults → save draft → publish → preview → draft edit → published stable; theme save+publish leaves menu rows + snapshot byte-identical.

Verification evidence (2026-10-04, local):
`npm run typecheck`, `npm run lint`, `npm run test` (36 tests), `npm run build` all pass.
HTTP smoke: menu create → section → item (variants/add-ons) → publish → draft edit → live snapshot unchanged.

Verification evidence (2026-10-03, local):
`npm run typecheck`, `npm run lint`, `npm run test` (27 tests), `npm run build` all pass.
API integration tests verify tenant isolation against a real local PostgreSQL.
HTTP smoke test: create restaurant → patch profile → logo upload → onboarding 6/6 → uploaded file served byte-identical.

Verification evidence (2026-09-27, local):
`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass.
Built API answered `GET /api/v1/health` → 200 and unknown routes → consistent 404 error shape.
Built web app served index at `/` via `vite preview`.

Only move an item to completed after it has actually been implemented and verified.

---

# 6. In Progress

None.

When work begins, record it using:

```text
Task:
Started:
Owner:
Current State:
Expected Output:
```

---

# 7. Next Tasks

## Immediate

1. Create Neon database → point `DATABASE_URL` in `apps/api/.env` at it → run `npm run db:migrate -w @dynamicmenu/api`.
2. Create Clerk application → set `VITE_CLERK_PUBLISHABLE_KEY` (apps/web/.env) and `CLERK_SECRET_KEY` (apps/api/.env), then verify real sign-up → sign-in → dashboard → menu builder end-to-end in a browser.
3. Create Sentry projects (web + api) → set `VITE_SENTRY_DSN` and `SENTRY_DSN`, then send a test error.
4. Commit Phase 4 and push to GitHub; confirm the CI workflow passes (it spins up a Postgres service for tests).
5. Provision Vercel (root `vercel.json`) and Render (`render.yaml`) projects with env vars; verify health check. Before launch: swap local-disk image storage for an object-storage provider (S3/Cloudinary/R2).
6. Begin Phase 5 — Tables & QR (table creation, unique QR tokens, QR preview/download, table-specific menu URLs; public `/q/{token}` resolution is part of Phase 6).

## After Foundation

Begin:

```text
Phase 5 — Tables & QR
```

---

# 8. Planned Product Phases

The project follows the roadmap defined in `PHASES.md`.

```text
Phase 0  → Project Foundation
Phase 1  → Authentication & Multi-Tenancy
Phase 2  → Restaurant Onboarding
Phase 3  → Menu Management
Phase 4  → Theme System
Phase 5  → Tables & QR
Phase 6  → Customer Menu
Phase 7  → Cart & Ordering
Phase 8  → Restaurant Order Management
Phase 9  → Payment Status & Reviews
Phase 10 → Customer Management
Phase 11 → Analytics
Phase 12 → Loyalty Program
Phase 13 → Advanced Themes & Offers
Phase 14 → SaaS & Commercial Features
Phase 15 → Multi-Branch Restaurants
Phase 16 → Integrations
Phase 17 → Production Hardening
```

Do not mark future phases as completed until their work is actually finished.

---

# 9. Important Product Decisions

## 9.1 Multi-Tenant Architecture

DynamicMenu is a multi-tenant SaaS platform.

Each restaurant is an independent tenant.

```text
Platform
 ├── Restaurant A
 │    ├── Menu
 │    ├── Tables
 │    ├── Orders
 │    ├── Customers
 │    └── Analytics
 │
 └── Restaurant B
      ├── Menu
      ├── Tables
      ├── Orders
      ├── Customers
      └── Analytics
```

Tenant isolation is a fundamental requirement.

---

## 9.2 Customer Authentication

Customers should not need to create an account merely to:

* Scan a QR
* Browse a menu
* View dishes
* View offers

Customer identity may be collected when required for ordering, loyalty, or other legitimate functionality.

---

## 9.3 Menu Architecture

Menu structure:

```text
Restaurant
    ↓
Menu
    ↓
Sections
    ↓
Menu Items
    ├── Variants
    └── Add-ons
```

Menu content must remain independent from visual themes.

---

## 9.4 Menu Publishing

Menu editing uses a draft/publish model.

```text
Draft
  ↓
Validation
  ↓
Published
```

Customer-facing users should receive published menu data rather than unfinished draft changes.

---

## 9.5 QR Architecture

Each restaurant table receives a unique QR identity.

```text
Restaurant
    ↓
Table
    ↓
QR Token
    ↓
Customer Menu
```

The QR must identify both:

* Restaurant
* Table

---

## 9.6 Order Architecture

Initial order lifecycle:

```text
PENDING
   ↓
CONFIRMED
   ↓
PREPARING
   ↓
READY
   ↓
SERVED
   ↓
PAID
   ↓
COMPLETED
```

Additional states:

```text
CANCELLED
REJECTED
```

State transitions must be validated by the backend.

---

## 9.7 Review Architecture

The review flow begins after the restaurant marks an order as paid.

```text
Order Paid
    ↓
Review Eligibility
    ↓
Customer Feedback
    ↓
Optional Google Maps Redirect
```

DynamicMenu must not claim that a Google review was successfully posted unless that can actually be verified.

---

## 9.8 Loyalty Terminology

The PRD refers to a "royalty program."

The product-facing terminology should be:

> **Loyalty Program**

This better communicates the intended customer reward functionality.

---

# 10. Technology Stack

The planned stack is:

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
Radix UI
```

## Backend

```text
Node.js
TypeScript
REST API
Prisma
```

## Database

```text
PostgreSQL
Neon
```

## Authentication

```text
Clerk
```

## Monitoring

```text
Sentry
```

## Deployment

```text
Frontend → Vercel
Backend  → Render
Database → Neon
```

These are planned/selected technologies. They must not be marked as operational until verified in the project.

---

# 11. Active Files

Current project documentation:

```text
PRD.md
ARCHITECTURE.md
DESIGN.md
PHASES.md
MEMORY.md
```

Potential future documentation:

```text
RULES.md
```

Additional implementation files should be added here when they become important to the active development state.

---

# 12. Active Documentation Responsibilities

| File              | Responsibility                 |
| ----------------- | ------------------------------ |
| `PRD.md`          | Product requirements and goals |
| `ARCHITECTURE.md` | Technical architecture         |
| `DESIGN.md`       | UI/UX and design system        |
| `PHASES.md`       | Development roadmap            |
| `RULES.md`        | Development and project rules  |
| `MEMORY.md`       | Actual current project state   |

Do not duplicate large sections of these documents in `MEMORY.md`.

---

# 13. Known Issues

```text
Issue: npm audit reports 3 high-severity vulnerabilities (deepmerge-ts stack exhaustion, via @prisma/config in the prisma CLI).
Detected: 2026-10-03 (during Phase 2 dependency install).
Impact: Local tooling only — the vulnerable package is part of the prisma CLI dev dependency chain, not the running API.
Status: Open.
Workaround: None needed locally.
Resolution: Upgrade prisma when a patched 6.x/7.x line is available; do NOT run the suggested breaking downgrade.
```

```text
Issue: Vitest 5.0.2 silently ignores the `setupFiles` config in apps/api — setup code never executed (env vars leaked between .env and .env.test, tests once ran against the wrong database).
Detected: 2026-10-03.
Impact: Would have kept integration tests pointed at the dev database instead of the test database.
Status: Mitigated.
Workaround: .env.test is now loaded in test/global-setup.ts (main thread, before workers spawn); setupFiles removed from vitest.config.ts.
Resolution: Revisit when upgrading Vitest; verify a canary log line from the setup file runs.
```

New issues must be recorded here with:

```text
Issue:
Detected:
Impact:
Status:
Workaround:
Resolution:
```

---

# 14. Blockers

None recorded.

A blocker should only be recorded if it prevents meaningful progress.

Format:

```text
Blocker:
Impact:
Since:
Required Action:
Status:
```

---

# 15. Architecture Changes

```text
Date: 2026-10-03
Change: Image storage provider
Previous: ARCHITECTURE.md §28 recommends external object storage (S3/Cloudinary/R2) selected during implementation; no provider credentials exist yet.
New: `apps/api/src/services/storage.ts` defines an ImageStorage interface; the active provider writes to local disk (UPLOAD_DIR, default apps/api/uploads, gitignored) and files are served from /uploads via express.static. The logo URL stored in PostgreSQL is absolute (API_BASE_URL-based).
Reason: Logo upload is required by Phase 2 acceptance criteria but no object-storage credentials exist locally.
Affected Components: restaurants logo endpoint, app.ts static serving, .env.example (UPLOAD_DIR), .gitignore (uploads/).
Note: Swap the provider (implement ImageStorage) before production; Render's filesystem is ephemeral.
```

```text
Date: 2026-10-09
Change: Production domain selected for QR links and deployment config
Previous: No production domain configured; WEB_BASE_URL default was localhost only.
New: Project domain is `dynamicmenu.store`. `.env.example` now documents `WEB_BASE_URL=https://dynamicmenu.store` for production and `render.yaml` sets `WEB_BASE_URL=https://dynamicmenu.store` and `CORS_ORIGIN=https://dynamicmenu.store` on the Render service. API_BASE_URL remains user-provided per deployment.
Reason: Customer-facing QR codes and CORS need a stable public domain before Phase 6 customer-menu work.
Affected Components: .env.example, render.yaml, QR menuUrl generation (uses WEB_BASE_URL).
```

Record actual architectural changes here.

Example:

```text
Date:
Change:
Previous:
New:
Reason:
Affected Components:
```

Do not record proposed architecture as an architecture change.

---

# 16. Important Technical Notes

## Local Auth Without Clerk Keys

`ENABLE_DEV_AUTH=true` (apps/api/.env, non-production only) makes `requireAuth` trust `x-dev-clerk-id` + `x-dev-email` headers instead of verifying a Clerk JWT. Without it and without `CLERK_SECRET_KEY`, protected endpoints return 401 `AUTH_NOT_CONFIGURED`. Tests inject a stub verifier via `createApp(verifier)` and never use the bypass.

## Test Database

API integration tests get their env from `apps/api/.env.test` (gitignored), which `test/global-setup.ts` loads into `process.env` in the main thread before workers spawn; the same file drives `prisma migrate deploy`. Tests run sequentially (`fileParallelism: false`). CI recreates the same setup with a Postgres service container. The local dev database (`dynamicmenu_dev`, from `apps/api/.env`) is migrated with `npm run db:deploy -w @dynamicmenu/api` — keep it in sync when adding migrations.

## Local Image Storage

Uploaded logos land in `apps/api/uploads/` (gitignored), served at `GET /uploads/:file`. Limits: JPEG/PNG/WebP only, 2 MB. Validation happens in multer (mimetype, size) and errors map to 400 `INVALID_FILE_TYPE` / `FILE_TOO_LARGE`.

## Tenant Isolation

Every restaurant-owned resource must be tenant-scoped.

## Backend Validation

Never trust frontend-provided:

* Prices
* Availability
* Restaurant IDs
* Table IDs
* Offer eligibility
* Order totals

The backend must validate important business operations.

## Customer Menu

The customer experience must be:

```text
Mobile-first
Fast
Responsive
Accessible
Low-friction
```

## Restaurant Dashboard

The dashboard should prioritize:

```text
Menu
Orders
Tables
Offers
Customers
Analytics
```

## Images

Large images should not be stored directly inside PostgreSQL.

Use external object storage and store metadata/URLs in the database.

---

# 17. Current Design Direction

The product has two distinct design experiences.

## Restaurant Dashboard

```text
Professional
Minimal
Structured
Data-oriented
Powerful
```

## Customer Menu

```text
Premium
Food-focused
Visual
Mobile-first
Fast
Easy to navigate
```

Themes may change the customer-facing visual identity but should not alter the core dashboard design system.

Refer to `DESIGN.md` for the authoritative design specification.

---

# 18. Security Priorities

Security priorities include:

```text
Authentication
      ↓
Authorization
      ↓
Tenant Isolation
      ↓
Input Validation
      ↓
Business Logic Validation
      ↓
Database
```

Important security requirements:

* No cross-tenant access
* Protected dashboard APIs
* Backend authorization
* Input validation
* Secure secrets
* Rate limiting
* Secure file uploads
* Safe error handling
* Monitoring

---

# 19. Current Database State

**Status:** Tenant core + restaurant profile + menu + themes + tables + offers implemented; dev + test databases migrated

`prisma/schema.prisma` (PostgreSQL) contains the tenant core, restaurant profile, Phase 3 menu domain, Phase 4 theme config, Phase 5 tables, and Phase 6 offers:

```text
User                     (id, clerkId unique, email unique, name)
Restaurant               (id, name, slug unique, status,
                          description, cuisine, phone, email, websiteUrl,
                          addressLine1/2, city, state, postalCode, country,
                          logoUrl, primaryColor, googleMapsUrl)
RestaurantMembership     (userId + restaurantId unique, role, cascade deletes)
Role enum                OWNER | ADMIN | MANAGER | STAFF

Menu                     (restaurantId, name, status DRAFT/PUBLISHED, isActive,
                          archivedAt soft-delete, currentRevisionId)
MenuRevision             (menuId, JSON snapshot, section/item counts, publishedAt)
MenuSection              (menuId, name, position, isHidden)
MenuItem                 (sectionId, name, price Decimal(10,2), imageUrl,
                          isAvailable, dietaryTags[], position)
MenuItemVariant          (itemId, name, price, isAvailable, position)
MenuItemAddon            (itemId, name, price, isAvailable, position)
MenuStatus enum          DRAFT | PUBLISHED
DietaryTag enum          VEG | NON_VEG | VEGAN | SPICY | GLUTEN_FREE

RestaurantTheme          (restaurantId unique, draftConfig Json,
                          publishedConfig Json, publishedAt)
RestaurantTable          (restaurantId, label, qrToken unique, isActive)
Offer                    (restaurantId, title, description, badgeText,
                          imageUrl, isActive, position)
```

Migrations under `prisma/migrations/`:

```text
20260927181123_phase1_tenant_core
20261003132614_phase2_restaurant_profile
20261004073613_phase3_menu_management
20261008031054_phase4_theme_system
20261009101341_phase5_tables_qr
20261009141616_phase6_customer_menu_offers
```

Applied to the local test database (via `test/global-setup.ts`) and the local dev database (`dynamicmenu_dev`). Onboarding progress is NOT stored — it is derived from profile fields plus published-menu existence plus at least one active table (see `computeOnboarding` in restaurants.service.ts). Published menu data lives ONLY in MenuRevision snapshots; the draft tree is the editable working copy. Theme config is presentation-only JSON; theme writes never touch menu tables (integration-tested). QR tokens live on `RestaurantTable`; there is no separate `QRCode` entity.

Remaining planned entities (none implemented yet):

```text
Order
OrderItem

Customer
CustomerRestaurantProfile

RoyaltyAccount
Reward

Review

AnalyticsEvent
Notification
```

Do not mark entities as implemented until the actual Prisma schema and database have been created and verified.

---

# 20. Current API State

**Status:** Phases 1–6 implemented (auth/tenancy, onboarding, menus, themes, tables & QR, customer menu)

Express 5 + TypeScript API at `apps/api` with the Phase 0 foundation (health, error envelope per ARCHITECTURE.md §33, zod validation, helmet/cors/rate-limit, pino, Sentry handler) plus:

```text
GET    /api/v1/me                     → current profile (requireAuth)
GET    /api/v1/restaurants            → caller's memberships only (requireAuth)
POST   /api/v1/restaurants            → create restaurant + OWNER membership (transaction)
GET    /api/v1/restaurants/:id        → full profile + derived onboarding progress (any member)
PATCH  /api/v1/restaurants/:id        → edit profile/settings, ADMIN+ (zod-validated, all fields optional)
POST   /api/v1/restaurants/:id/logo   → multipart logo upload, ADMIN+ (JPEG/PNG/WebP ≤ 2 MB)
GET    /api/v1/restaurants/:id/members→ ADMIN+ membership required

GET    /api/v1/restaurants/:rid/menus                → menu list with counts (MANAGER+)
POST   /api/v1/restaurants/:rid/menus                → create menu
GET    /api/v1/restaurants/:rid/menus/:menuId        → draft tree + currentRevision (MANAGER+)
PATCH  /api/v1/restaurants/:rid/menus/:menuId        → rename/desc/activate
DELETE /api/v1/restaurants/:rid/menus/:menuId        → archive (soft delete)
POST   /api/v1/restaurants/:rid/menus/:menuId/publish   → validate + snapshot revision
POST   /api/v1/restaurants/:rid/menus/:menuId/unpublish → back to DRAFT
GET    /api/v1/restaurants/:rid/menus/:menuId/revisions → publish history
POST   .../menus/:menuId/sections                    → create section (appended last)
PATCH/DELETE .../menus/:menuId/sections/:sectionId   → rename/hide/delete
PUT    .../menus/:menuId/sections/order              → reorder { sectionIds }
POST   .../sections/:sectionId/items                 → create item (+variants/add-ons)
PATCH/DELETE .../sections/:sectionId/items/:itemId   → edit (variants/add-ons replaced wholesale)/delete
POST   .../items/:itemId/image                       → multipart item photo

GET    /api/v1/restaurants/:rid/theme                → draft/published config + presets (MANAGER+)
PUT    /api/v1/restaurants/:rid/theme                → save draft config (zod-validated)
POST   /api/v1/restaurants/:rid/theme/publish        → copy draft onto published slot
GET    /api/v1/restaurants/:rid/theme/preview        → draft theme + restaurant + published menu snapshot
POST   /api/v1/restaurants/:rid/theme/image          → cover image upload → { url }

GET    /api/v1/restaurants/:rid/tables               → list tables (MANAGER+)
POST   /api/v1/restaurants/:rid/tables               → create table with unique QR token (MANAGER+)
PATCH  /api/v1/restaurants/:rid/tables/:tableId      → update label / activate / deactivate / rotate QR token (MANAGER+)
DELETE /api/v1/restaurants/:rid/tables/:tableId      → delete table (MANAGER+)

GET    /api/v1/public/qr/:token                     → resolve QR token → { restaurant, table } (public, rate-limited, 404 INVALID_QR if missing/inactive)
GET    /api/v1/public/qr/:token/menu               → full customer payload: restaurant + table + published menu snapshot + published theme + active offers (public, rate-limited)
```

Request pipeline per RULES.md §6: `requireAuth` (Clerk JWT verification or injected test verifier) → `syncUser` (upsert local User) → `requireMembership(minimumRole)` (tenant lookup server-side; non-member → 404, insufficient role → 403) → entity loaders walk the item → section → menu → restaurant chain so cross-tenant ids 404. Local-dev bypass: `ENABLE_DEV_AUTH=true` trusts `x-dev-clerk-id` / `x-dev-email` headers (never in production, never with a verifier injected).

Expected domains:

```text
auth
restaurants
menus
categories
menu-items
offers
themes
tables
qr
orders
customers
loyalty
reviews
analytics
notifications
```

Public customer functionality should be separated from protected restaurant-management APIs.

---

# 21. Current Deployment State

## Frontend

```text
Provider: Vercel
Status: vercel.json created (root: apps/web, SPA rewrites); project not yet provisioned on Vercel
```

## Backend

```text
Provider: Render
Status: render.yaml created (healthCheckPath /api/v1/health); service not yet provisioned on Render
```

## Database

```text
Provider: Neon
Status: Prisma schema ready; DATABASE_URL not yet provided
```

## Authentication

```text
Provider: Clerk
Status: Backend JWT verification (apps/api/src/lib/clerk.ts) + user sync; web ClerkProvider, sign-in/up pages, AuthGuard on /dashboard — all verified locally with stub/test verifiers; Clerk application not yet created
```

## Monitoring

```text
Provider: Sentry
Status: @sentry/node and @sentry/react wired (activate with SENTRY_DSN / VITE_SENTRY_DSN); Sentry projects not yet created
```

---

# 22. Recent Work

2026-10-09 — Completed and verified Phase 6 (Customer Menu) locally:

* Prisma: `Offer` model (`restaurantId`, `title`, `description`, `badgeText`, `imageUrl`, `isActive`, `position`) + migration `20261009141616_phase6_customer_menu_offers` on dev + test databases.
* API: public `/api/v1/public/qr/:token/menu` endpoint (no auth, rate-limited) resolves the QR token and returns `{restaurant, table, menu, theme, offers}`; menu is the published `MenuRevision` snapshot (draft never served), theme falls back to the default preset, and only active offers are included.
* Web: rebuilt `/q/:token` into a mobile-first customer menu with loading, error, and empty states; restaurant header with logo/name/table; horizontally scrollable sticky category navigation; offer banner cards; sectioned food cards with image, price, dietary tags, and availability; item detail dialog with variants (radio), add-ons (checkbox), live price calculation, and add-to-order button. Theme tokens from `themeToTokens` drive all colors, fonts, radii, and backgrounds.
* Tenant isolation: API tests verify that a QR token only exposes its own restaurant's published menu and that internal IDs do not leak in the public payload.
* Verified: typecheck, lint, 57 tests (43 API + 14 web), build, HTTP smoke (create menu → publish → create table → `/public/qr/:token/menu` returns full payload), web `vite preview` on `/q/:token`.

2026-10-09 — Completed and verified Phase 5 (Tables & QR) locally:

* Prisma: `RestaurantTable` (`restaurantId`, `label`, `qrToken` unique, `isActive`) + migration `20261009101341_phase5_tables_qr` on dev + test databases.
* API: tables module at `/api/v1/restaurants/:restaurantId/tables` (MANAGER+, mergeParams router) — list, create with unique URL-safe `qrToken`, update label/activation/rotate token, delete; public `/api/v1/public/qr/:token` resolver (unauthenticated, rate-limited) returns `{restaurant, table}` or `INVALID_QR` 404 for missing/inactive/rotated/deleted tokens.
* Web: `/dashboard/tables` — add table, inline rename, activate/deactivate, rotate QR token with confirm, delete, copy menu link, QR preview dialog with PNG download (`qrcode` library); `/q/:token` customer landing page resolves token and shows restaurant/table or a helpful invalid-QR error.
* Onboarding: added an 8th step "Active table" (≥1 active `RestaurantTable`); `computeOnboarding` and tests updated.
* Tenant security: API tests verify unique tokens, public resolution, invalid/rotated/deactivated QR handling, tenant scoping, and role boundaries; cross-restaurant table access blocked.
* Verified: typecheck, lint, 52 tests (38 API + 14 web), build, HTTP smoke (create table → resolve QR → rotate → old QR 404), web `vite preview` on `/q/:token` and `/dashboard/tables`.

2026-10-08 — Completed and verified Phase 4 (Theme System) locally:

* Prisma: `RestaurantTheme` (restaurantId unique, draftConfig/publishedConfig JSON, publishedAt) + migration `20261008031054_phase4_theme_system` on dev + test databases.
* API: themes module at `/api/v1/restaurants/:restaurantId/theme` (MANAGER+, mergeParams router) — GET state (draft + published + 4 presets), PUT draft (zod-validated: 5 hex colors, font/card/button/background/header enums, decoration booleans, cover URL), POST publish (draft → published slot), GET preview (draft theme + restaurant + latest published menu snapshot), POST image (cover upload).
* Presets (themes/themes.presets.ts): Modern Minimal, Midnight Luxury, Traditional Indian, Festive — static defaults; new themes are addable without touching the menu system.
* Web: `/dashboard/themes` — preset gallery with swatches, full customization controls, cover image upload with contrast overlay note, sticky live preview rendering a customer-menu frame from the real published menu snapshot (or sample dishes) via `themeToTokens` CSS custom properties (unit-tested).
* Menu-data integrity: integration test saves + publishes a theme and asserts menu rows AND the MenuRevision snapshot stay byte-identical; draft edits after theme publish leave the published theme stable.
* Verified: typecheck, lint, 45 tests, build, HTTP smoke (defaults → save → publish → preview → draft edit → published stable), web `vite preview` on `/dashboard/themes`.

2026-10-03 — Completed and verified Phase 2 (Restaurant Onboarding) locally:

* Prisma: added 13 profile fields to Restaurant (description, cuisine, phone, email, websiteUrl, address line1/2, city, state, postalCode, country, logoUrl, primaryColor, googleMapsUrl) + migration `20261003132614_phase2_restaurant_profile`; migrated both local dev and test databases.
* API: `GET /restaurants/:id` (full profile + derived 6-step onboarding progress), extended `PATCH` (all profile fields, zod-validated, optional so owners can skip), `POST /restaurants/:id/logo` (multipart via multer, JPEG/PNG/WebP ≤ 2 MB, `ImageStorage` interface with local-disk provider, files served from `/uploads`).
* Web: dashboard split into layout (header/nav) + nested routes; new `/dashboard/settings` page (profile form with section anchors, LogoUploader with empty/uploading/preview/error states, branding color picker; ADMIN+ edit, read-only below); onboarding progress card on the overview with deep links back to settings; apiFetch supports FormData.
* Fixed a latent test-infra bug: Vitest silently ignored `setupFiles`, so tests were running against the dev database (`dynamicmenu_dev`) instead of the test one; env now loads in `test/global-setup.ts` and `setup.ts` was removed (recorded in Known Issues).
* Verified: typecheck, lint, 27 tests, build, and a full HTTP smoke of the onboarding flow (create → patch → logo upload → 6/6 progress → uploaded file byte-identical and served).

2026-10-04 — Completed and verified Phase 3 (Menu Management) locally:

* Prisma: Menu, MenuSection, MenuItem, MenuItemVariant, MenuItemAddon, MenuRevision models + MenuStatus/DietaryTag enums; migration `20261004073613_phase3_menu_management` applied to dev + test databases.
* Draft/publish via snapshot revisions: publishing validates the draft (≥1 section, ≥1 item → else 400 `MENU_INCOMPLETE`) and stores a self-contained JSON snapshot in MenuRevision pointed to by `Menu.currentRevisionId`; the draft tree stays editable afterwards, so draft changes never leak to the live menu (integration-tested and HTTP-smoke-tested).
* API: menus module under `/api/v1/restaurants/:restaurantId/menus` (MANAGER+), tenant-scoped loaders walking item → section → menu → restaurant (cross-tenant ids → 404), section reorder/hide, item images via a shared `upload-image` middleware (refactored out of the restaurants logo route), availability toggles, dietary tags.
* Web: `/dashboard/menus` list (create, activate/deactivate, archive with confirm) and `/dashboard/menus/:menuId` builder (section cards with rename/reorder/hide/delete, item editor dialog with variants/add-ons editors and image upload, publish dialog with live-vs-draft change summary); onboarding checklist gained a "First menu published" step (now 7 total).
* Fixed en route: child routers need `mergeParams: true` to see `:restaurantId` from the mount path; `noUncheckedIndexedAccess` nits in the reorder swap and snapshot assertions.
* Verified: typecheck, lint, 36 tests, build, HTTP smoke (create menu → publish → draft edit → live snapshot unchanged), web `vite preview` on `/dashboard/menus`.

2026-10-03 — Completed and verified Phase 1 (Authentication & Multi-Tenancy) locally:

* Fixed broken module paths in `apps/api/src/routes/index.ts` (committed Phase 1 code did not compile) and added `apps/api/tsconfig.test.json` + ESLint test-file config from the prior uncommitted work.
* Web: wired `/sign-in` and `/sign-up` routes and gated `/dashboard` behind `AuthGuard` (previously a no-op stub); fixed Clerk-hook-before-config-check crash in sign-in/up pages; fixed import path in `auth-guard.tsx`.
* Added `apps/web/src/components/layout/auth-guard.test.tsx` (4 tests: not-configured, loading, redirect when signed out, render when signed in).
* CI: added a Postgres service to `.github/workflows/ci.yml` and generate `apps/api/.env.test` so `npm run test` can run in GitHub Actions (previously it would fail without a database).
* Verified: typecheck, lint, 17 tests, build, built-API smoke test, web `vite preview`.

Current documentation set:

```text
PRD.md
ARCHITECTURE.md
DESIGN.md
PHASES.md
MEMORY.md
RULES.md
```

---

# 23. Development Rules for Memory

This file must remain factual.

## Never

* Claim unfinished work is complete.
* Invent decisions.
* Invent bugs.
* Invent deployments.
* Invent database migrations.
* Invent tests.
* Claim an integration works without verification.
* Rewrite historical events without evidence.

## Always

* Update after meaningful implementation work.
* Record important architectural decisions.
* Record blockers.
* Record current phase.
* Record active tasks.
* Record changes to important technical decisions.
* Keep obsolete information clearly marked or removed.

---

# 24. Update Format

After meaningful work, update the relevant sections.

Recommended format:

```text
Date:
Phase:
Work Completed:
Current Status:
Next Task:
Issues:
Decisions:
```

Example:

```text
Date: YYYY-MM-DD

Phase: Phase 1 — Authentication & Multi-Tenancy

Work Completed:
- Clerk authentication configured.
- Restaurant model created.
- Tenant middleware implemented.

Current Status:
Authentication and tenant isolation are functional.

Next Task:
Implement restaurant membership roles.

Issues:
None.

Decisions:
Restaurant is the primary tenant boundary.
```

---

# 25. Current Next Action

The immediate next action is:

```text
Phase 6 complete locally
        ↓
Obtain hosted credentials (Neon, Clerk, Sentry)
        ↓
Verify real sign-in + database connectivity in a browser
        ↓
Commit, push, confirm CI passes
        ↓
Begin Phase 7 — Cart & Ordering
```

---

# 26. Current Blocker Status

```text
No blockers recorded.
```

Hosted credentials (Neon, Clerk) are pending user action but do not block local Phase 7 development.
```

---

# 27. Current Project Truth

As of the last update:

```text
Product concept        → Defined
PRD                    → Defined
Architecture          → Defined
Design specification  → Defined
Development phases    → Defined
Project memory        → Defined

Monorepo scaffold      → Implemented & verified (local)
Frontend foundation    → Implemented & verified (local)
Backend foundation     → Implemented & verified (local)
Phase 1 auth + tenancy → Implemented & verified (local; stub/test verifiers)
Phase 2 onboarding     → Implemented & verified (local; full HTTP smoke test)
Phase 3 menu mgmt      → Implemented & verified (local; publish-snapshot model tested)
Phase 4 themes         → Implemented & verified (local; menu-data integrity tested)
Phase 5 tables & QR    → Implemented & verified (local; QR token security tested)
Phase 6 customer menu  → Implemented & verified (local; published-snapshot + theme rendering tested)
Database (Prisma)      → Six migrations applied on local dev + test Postgres; awaiting Neon URL
Authentication (Clerk) → Code complete; awaiting Clerk application keys
Monitoring (Sentry)    → Wired; awaiting DSN
Deployment             → Config files ready; not provisioned
Project domain         → dynamicmenu.store (production web base URL; env + render.yaml updated)
Image storage          → Local-disk provider behind ImageStorage interface; swap before production
Production system      → Not started
```

---

# 28. Last Updated

```text
2026-10-09 — Phase 6 (Customer Menu) implemented and verified locally: Offer model (restaurantId, title, description, badgeText, imageUrl, isActive, position) + migration 20261009141616_phase6_customer_menu_offers, public `/api/v1/public/qr/:token/menu` endpoint returning restaurant + table + published MenuRevision snapshot + published theme + active offers, mobile-first `/q/:token` customer menu with loading/error/empty states, sticky category nav, offer banners, food cards, and item detail dialog with variants/add-ons/price calculation, theme rendering via unit-tested `themeToTokens`, tenant-isolation and no-ID-leak tests, 57 tests passing (43 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-09 — Phase 5 (Tables & QR) implemented and verified locally: RestaurantTable schema (restaurantId, label, qrToken unique, isActive) + migration 20261009101341_phase5_tables_qr, tables CRUD + rotate-token API (MANAGER+), public `/api/v1/public/qr/:token` resolver (unauthenticated, 404 `INVALID_QR` for missing/inactive/rotated tokens), `/dashboard/tables` management UI with QR preview/download, `/q/:token` customer landing page, onboarding "Active table" step (8 total), tenant-security and QR-invalidation tests, 52 tests passing (38 API + 14 web). Production domain set to dynamicmenu.store; .env.example and render.yaml updated. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-08 — Phase 4 (Theme System) implemented and verified locally: RestaurantTheme schema (draft/published config JSON) + migration 20261008031054_phase4_theme_system, 4 built-in presets (Modern Minimal, Midnight Luxury, Traditional Indian, Festive), theme APIs (GET/PUT/publish/preview/image, MANAGER+), /dashboard/themes gallery + editor + live customer-menu preview via unit-tested themeToTokens CSS variables, theme save+publish proven byte-identical to menu rows + MenuRevision snapshots, 45 tests passing. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-04 — Phase 3 (Menu Management) implemented and verified locally: Menu/MenuSection/MenuItem/Variant/Addon/Revision schema + migration 20261004073613_phase3_menu_management, full menu CRUD APIs (MANAGER+, tenant-scoped loaders), section reorder/hide, item images via shared upload middleware, availability + dietary tags, draft/publish via MenuRevision snapshots (draft edits after publish proven invisible to the live snapshot in integration + HTTP smoke tests), /dashboard/menus list + builder UI with publish dialog, onboarding "First menu published" step (7 total). 36 tests passing. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-04 — Phase 2 (Restaurant Onboarding) implemented and verified locally: 13 restaurant profile fields + migration 20261003132614_phase2_restaurant_profile (dev + test DBs), GET /restaurants/:id with derived onboarding progress, PATCH profile (all-optional zod validation), multipart logo upload (JPEG/PNG/WebP ≤ 2 MB, ImageStorage interface w/ local-disk provider), dashboard settings page + onboarding progress card, 27 tests passing, full HTTP smoke of the onboarding flow. Fixed test-infra bug where Vitest ignored setupFiles and tests ran against the dev DB.
2026-10-03 — Phase 1 (Authentication & Multi-Tenancy) implemented and verified locally: Clerk token verification + user sync, User/Restaurant/RestaurantMembership schema + migration, role-based tenant isolation (404/403/401), protected APIs, AuthGuard-protected dashboard routes, CI workflow given a Postgres test service.
```

---

# 29. Final Rule

> **MEMORY.md describes what has actually happened.**
>
> **PRD.md describes what the product should do.**
>
> **ARCHITECTURE.md describes how the system should be built.**
>
> **DESIGN.md describes how the product should look and behave.**
>
> **PHASES.md describes how the product should be developed.**
>
> Keep these responsibilities separate.