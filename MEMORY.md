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

**Current Phase:** Phase 17 — Production Hardening (implemented and verified locally; hosted Clerk account still pending)

**Status:** Phase 17 complete — the full development roadmap (Phases 1–17) is now implemented and verified locally. The hardening pass closed real findings: bearer tokens were being written to request logs (now redacted), oversized/malformed JSON bodies returned 500 (now 413/400), public write endpoints had no dedicated abuse limit (now 30/min/IP), `DATABASE_URL` was optional in production (now fail-fast), and the customer QR experience shipped inside a 670 KB bundle (now code-split into a ~19 KB lazy chunk). A 13-checkpoint end-to-end validation of the entire product loop passes. Deployment to hosted environments awaits user-provided credentials (Neon, Clerk, Sentry, Vercel, Render).

**Current Objective:**

Finish production readiness: security/tenant audits, error-handling and logging hygiene, performance, deployment configuration, and a complete end-to-end validation — then hand off to real provisioning.

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
    ↓
Phase 7: Cart & Ordering
    ↓
Implemented & verified locally
    ↓
Phase 8: Restaurant Order Management
    ↓
Implemented & verified locally
    ↓
Phase 9: Payment Status & Reviews
    ↓
Implemented & verified locally
    ↓
Phase 10: Customer Management
    ↓
Implemented & verified locally
    ↓
Phase 11: Analytics
    ↓
Implemented & verified locally
    ↓
Phase 12: Loyalty Program
    ↓
Implemented & verified locally
    ↓
Phase 13: Advanced Themes & Offers
    ↓
Implemented & verified locally
    ↓
Phase 14: SaaS & Commercial Features
    ↓
Implemented & verified locally
    ↓
Phase 15: Multi-Branch Restaurants
    ↓
Implemented & verified locally
    ↓
Phase 16: Integrations
    ↓
Implemented & verified locally
    ↓
Phase 17: Production Hardening
    ↓
Implemented & verified locally
(Hosted services pending credentials — deployment is the remaining step)
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

## Phase 17 — Production Hardening

### Objective

Final production pass across security, tenant isolation, performance, error handling, monitoring/logging, SEO, deployment configuration, and a complete end-to-end validation (PHASES.md §21).

### Current Completion

```text
Security audit                     [x] Done (helmet CSP/HSTS verified per-response; public write endpoints got a dedicated 30/min/IP limiter on top of the global 120/min; audit found + fixed the items below)
Tenant-isolation audit             [x] Done (every tenant router still resolves membership/ownership server-side; cross-tenant 404 behavior re-verified by the full suite incl. branches/orgs)
Logging fix                        [x] Done (audit found bearer + dev-auth tokens were written to request logs; pino serializers now redact authorization / x-dev-* headers — verified live)
Error handling fix                 [x] Done (oversized JSON bodies were 500 → now 413 PAYLOAD_TOO_LARGE; malformed JSON → 400 INVALID_JSON; consistent error envelope re-tested)
Production configuration         [x] Done (env boot now fails fast when NODE_ENV=production lacks DATABASE_URL; render.yaml build runs prisma migrate deploy; ESLint project cap raised for the growing suite)
Performance                        [x] Done (customer QR routes lazy-loaded: the scanned-menu chunk is ~19 KB instead of the 670 KB dashboard bundle — matters on restaurant Wi-Fi/mobile)
SEO                                [x] Done (customer menu + order pages set document.title to the restaurant name)
Monitoring                         [~] Sentry wired (web + api), DSN pending credentials; health endpoint reports DB status; structured pino logs with redaction
Accessibility                      [~] Radix-based dialogs with titles/descriptions, labeled form controls, keyboard-navigable flows (dashboard + customer menu); no new a11y regressions in the suite
Database optimization              [~] Indexes in place on all hot paths (tenant FKs, order status/date, token lookups); no slow-query evidence at current volume — revisit with real data
Backup/recovery                    [~] Not configured locally: Neon (target provider) offers PITR/backups on paid plans; document a pg_dump schedule before production launch
Deployment                         [~] vercel.json + render.yaml ready (migrations in build); provisioning awaits user credentials
End-to-end validation              [x] Done (13-checkpoint live chain: restaurant → plan upgrade → menu+items+variants+addons+publish → theme publish → offer → branch → QR → discounted order → lifecycle to PAID → loyalty points → review → Google redirect → org analytics → customer profile → redemption — all PASS)
```

### Key Decisions

Hardening fixed four concrete findings rather than inventing new features: credential redaction in request logs, 413/400 for body errors, per-IP write limits, and fail-fast production env. Performance work was limited to the highest-leverage split (the customer QR bundle). Items marked `~` are documented as pending rather than faked: Sentry DSN, hosted provisioning, backup automation, and deeper a11y/DB work all require credentials, real data, or explicit requirements.

### Verification (2026-10-12, local)

`npm run typecheck`, `npm run lint`, `npm run test` (125 tests: 111 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/hardening.test.ts`, 6 tests): security headers, error-shape consistency without internals, rate-limit headers, 413 oversized body, 400 malformed JSON, 401 unauthenticated dashboard.
E2E validation: 13/13 checkpoints over the complete product loop (see above). Log redaction verified live against a running server.

---

## Phase 16 — Integrations (completed)

### Objective

Integrate with external services **as specified by the project requirements only**, keeping every integration isolated behind a service module (PHASES.md §20, ARCHITECTURE.md §46 constraint 11).

### Current Completion

```text
Requirements audit                 [x] Done (PRD/PHASES/ARCHITECTURE reviewed: the ONLY specified external integration is Google Maps review redirection; PHASES.md §20's payment gateways / POS / KDS / WhatsApp / SMS / email / Google Business / inventory / accounting / CRM are explicitly "potential future" — none implemented, per instructions)
Integration layer                  [x] Done (apps/api/src/integrations/google-maps.ts — the convention: one module per provider; domain services call the module, never the provider)
Google Maps extraction             [x] Done (reviews.service now routes its redirect through reviewRedirectUrl(); redirect-only semantics unchanged — we never claim a posted review)
Open-redirect hardening            [x] Done (normalizeGoogleMapsUrl allows only https on Google-owned hosts; a stored non-Google URL yields a null redirect instead of an open redirect)
Already-integrated (earlier phases) [x] Clerk auth (Phase 1), Sentry monitoring wiring (Phase 0, DSN pending credentials), Google Maps (Phase 9, now behind the integration layer)
```

### Key Design Decision

PHASES.md §20 lists eight integration categories but marks every one as "potential future". The instruction "only implement integrations that are actually specified or approved" therefore reduces Phase 16 to architecture, not new providers: the Google Maps integration (the one specified integration, from the review workflow) was extracted from the review domain into `integrations/google-maps.ts` with a hostname allow-list that closes an open-redirect hole on the stored `googleMapsUrl` profile field. When a future phase specifies a provider (e.g. a payment gateway), it gets its own module under `integrations/` and core logic stays untouched.

### Verification (2026-10-12, local)

`npm run typecheck`, `npm run lint`, `npm run test` (119 tests: 105 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/integrations.test.ts`, 5 tests): Google-host allow-list unit tests (accept maps.google.com / maps.app.goo.gl; reject foreign hosts, subdomain spoofing, http, malformed), redirect-only semantics, and end-to-end proof that a restaurant storing a non-Google `googleMapsUrl` gets a null redirect (no open redirect) while legitimate URLs still redirect.

---

## Phase 15 — Multi-Branch Restaurants (completed)

### Objective

Let restaurant organizations manage multiple physical branches: branch management, branch-specific menus/tables/orders, staff access across branches, and organization analytics (PHASES.md §19).

### Current Completion

```text
Branch model + migration           [x] Done (Restaurant.parentId self-relation, one level deep; migration 20261011171552_phase15_multi_branch)
Branch management                  [x] Done (GET/POST /restaurants/:rid/branches — MANAGER+/OWNER; branch-of-branch rejected with BRANCH_OF_BRANCH; slug uniqueness enforced)
Branch resources                   [x] Done (branches are full tenants: own menus, tables, QR tokens, orders, customers, reviews — everything existing works per branch unchanged)
Staff access                       [x] Done (requireMembership falls back to the parent restaurant's membership, so org members manage every branch with their role; GET /restaurants includes accessible branches in the workspace list, deduped)
Organization plan                  [x] Done (subscription resolves to the root restaurant — one plan per organization; usage limits still count per branch)
Organization analytics             [x] Done (GET /analytics?scope=org aggregates root + branches with a byBranch breakdown; branch cards on the dashboard)
Dashboard                          [x] Done (/dashboard/branches list + create form; branch rows show menu/table counts; workspace picker switches between root and branches)
Tenant isolation                   [x] Done (outsiders and unrelated members get 404 on branch routes; workspaces of other orgs never list foreign branches — integration-tested)
```

### Key Design Decision

A branch is a child `Restaurant`, not a new entity type: every existing feature (menus, QR ordering, loyalty, analytics, entitlements) works on branches unchanged, and tenant isolation is preserved because each branch remains an independent tenant. The only cross-branch mechanism is the membership fallback in `requireMembership` (one level up), which gives org staff access without duplicating memberships, plus the root subscription and the `scope=org` analytics aggregation. Everything else treats a branch exactly like any restaurant.

### Verification (2026-10-11, local)

`npm run typecheck`, `npm run lint`, `npm run test` (114 tests: 100 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/branches.test.ts`, 7 tests): branch create/list, branch-of-branch rejection, slug conflicts, inherited staff access (MANAGER creates branch tables, STAFF reads branch orders), outsider/anonymous isolation, org analytics totals + per-branch breakdown + restaurant-scope exclusion, root-subscription entitlement inheritance.
HTTP smoke: root → created "Uptown" branch → workspace list deduped (root + branch) → inherited table create on branch → org analytics `byBranch` spanning both after plan upgrade; web `/dashboard/branches` serves via built app.

---

## Phase 14 — SaaS & Commercial Features (completed)

### Objective

Operate DynamicMenu as a commercial SaaS: subscriptions, plans, usage limits, feature entitlements, and account management (PHASES.md §18, ARCHITECTURE.md §45).

### Current Completion

```text
Subscription architecture          [x] Done (Restaurant → Subscription (restaurantId unique, plan, status) → Plan → Entitlements; migration 20261011074336_phase14_subscriptions with FREE backfill for existing restaurants)
Plans                              [x] Done (static catalog modules/billing/plans.ts: FREE / STARTER / PRO / ENTERPRISE with monthly prices, usage limits, and feature flags; entitlements checked via billing.service, never hard-coded in routes)
Usage limits                       [x] Done (tables/menus/offers counts enforced pre-create; over limit → 402 PLAN_LIMIT_REACHED; usage tracked live on the subscription view)
Feature gating                     [x] Done (analytics + Loyalty Program gated; locked → 403 PLAN_FEATURE_LOCKED; loyalty point earning silently skips when not entitled)
Account management                 [x] Done (GET /subscription with usage + plan catalog — MANAGER+; PUT /subscription/plan self-serve change — OWNER; /dashboard/billing page with usage bars and plan cards)
Billing integration                [x] Deliberately NOT implemented — project requirements define no billing provider; prices are display-only and plan changes collect no payment
```

### Key Design Decision

Per the user's constraint ("do not introduce billing behavior not defined by the project requirements") and PHASES.md ("initial commercial structure can be defined later"), this phase builds the entitlement architecture without any payment collection. Subscriptions auto-provision as FREE (one per restaurant, upserted on first access), plans are a static catalog, and enforcement is centralized in `billing.service` (`assertCanCreate`, `assertFeature`) so future billing webhooks only need to flip `Subscription.plan`/`status`. PHASES.md's caution against plan restrictions is noted: FREE limits are generous (3 tables / 2 menus / 2 offers) and the two premium features are the only gates.

### Verification (2026-10-11, local)

`npm run typecheck`, `npm run lint`, `npm run test` (107 tests: 93 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/billing.test.ts`, 6 tests): auto-provisioning + usage view, table/menu/offer limit enforcement, feature gates unlocking after upgrade, OWNER-only plan changes, tenant isolation. analytics/loyalty suites updated to provision PRO subscriptions for their entitlement-gated endpoints.
HTTP smoke: FREE restaurant → 4th table `402 PLAN_LIMIT_REACHED`, analytics `403 PLAN_FEATURE_LOCKED` → PUT plan PRO → analytics 200, 4th table 201; web `/dashboard/billing` serves via built app.

---

## Phase 13 — Advanced Themes & Offers (completed)

### Objective

Seasonal/festive themes with deeper customization, and a real offers engine: promotional campaigns with discounts and scheduling (PHASES.md §17).

### Current Completion

```text
Offer schema + migration           [x] Done (Offer: +discountType PERCENT/FLAT, discountValue, startsAt, endsAt; Order: +subtotal w/ backfill, discount, offerId; migration 20261011055617_phase13_themes_offers)
Offers engine                      [x] Done (schedule-aware listActiveOffers; bestActiveDiscount picks the largest live discount; CRUD with OFFER_INVALID_DISCOUNT / OFFER_INVALID_SCHEDULE validation)
Auto-discounts                     [x] Done (createOrder applies the best live offer server-side; subtotal/discount/offerId stored on the order; cart + order detail show the saving)
Campaign scheduling                [x] Done (startsAt/endsAt window enforced for both menu display and discount application)
Offers dashboard                   [x] Done (/dashboard/offers — create/edit form with discount + schedule, activate/deactivate, delete; MANAGER+; nav link)
Seasonal themes                    [x] Done (4 new presets: Diwali Lights, Christmas Eve, Eid Celebration, Halloween Night with garlands/hero text)
Advanced customization           [x] Done (ThemeConfig +layoutStyle list|grid and heroText; zod defaults keep pre-Phase-13 saved configs valid; editor controls; customer menu renders both)
```

### Key Design Decision

Offers are campaigns, not coupons: any live discount-bearing offer applies automatically to every new order, and the largest discount wins. All discount math happens in `bestActiveDiscount` at order creation — the client never sends prices or discounts (RULES.md §9). Scheduling is a single `withinSchedule` check shared by the public menu display and the discount selector, so a campaign can never discount while hidden (or vice versa).

### Verification (2026-10-11, local)

`npm run typecheck`, `npm run lint`, `npm run test` (101 tests: 87 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/offers.test.ts`, 6 tests): CRUD + validation, schedule filtering on the public menu, best-discount selection, banner/expired exclusion, roles + tenant isolation.
HTTP smoke: live 10% offer auto-applied (500 → 450, `offerId` set) while a 2030-dated campaign stays hidden from the public menu; web `/dashboard/offers` and `/q/:token` serve via built app.

---

## Phase 12 — Loyalty Program (completed)

### Objective

Reward repeat visits with points: automatic earning on paid orders, restaurant-scoped loyalty accounts with history, and counter redemption (PHASES.md §16).

### Current Completion

```text
Loyalty models + migration         [x] Done (LoyaltyAccount: customerId unique, points, lifetimeEarned/Redeemed; LoyaltyTransaction: EARN/REDEEM/ADJUST, reason, orderId; migration 20261010161555_phase12_loyalty_program)
Earning rules                      [x] Done (1 point per 100 spent, floored; awarded inside the PAID order transition)
Idempotent earning                 [x] Done (one EARN transaction per order; retries and PAID→COMPLETED never double-award)
Redemption                         [x] Done (POST /loyalty/redeem by customerId or phone; atomic balance check; over-redemption → 400 LOYALTY_INSUFFICIENT_POINTS)
Restaurant management            [x] Done (GET /loyalty/accounts with search — MANAGER+; /dashboard/loyalty with redeem form for STAFF+ and searchable account list for MANAGER+)
Customer loyalty history           [x] Done (customer detail returns balance + last 20 transactions; order tracking page shows the customer's points)
```

### Key Design Decision

Points are a side effect of the order state machine, not the order flow: `transitionOrder` calls `awardPointsForOrder` only when entering `PAID`, and the award checks for an existing EARN transaction for that order first. Balances live on `LoyaltyAccount` (one per customer, restaurant-scoped) with a full `LoyaltyTransaction` ledger, so history is auditable and balances are recomputable.

### Verification (2026-10-10, local)

`npm run typecheck`, `npm run lint`, `npm run test` (95 tests: 81 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/loyalty.test.ts`, 7 tests): earning rule (floor), idempotency (duplicate call + PAID→COMPLETED), redemption + over-redemption, account list search + STAFF restrictions, loyalty on customer status/detail payloads, tenant isolation, payload validation.
HTTP smoke: 900-spend order marked paid → 9 points → redeem 3 → balance 6 visible on the customer tracking page; web `/dashboard/loyalty` serves via built app.

---

## Phase 11 — Analytics (completed)

### Objective

Turn order, customer, and review data into restaurant insights: revenue/order metrics, time-based trends, item/customer/table performance (PHASES.md §15).

### Current Completion

```text
Analytics API                      [x] Done (GET /restaurants/:rid/analytics?days=N — MANAGER+; N clamped 1–90)
Overview metrics                   [x] Done (all-time counted orders, revenue from PAID/COMPLETED orders, average order value, total/repeat customers, review count + average rating)
Time-based trends                  [x] Done (zero-filled orders + revenue per day series, UTC-aligned)
Popular items                      [x] Done (top 8 by quantity sold in range, with revenue)
Customer activity                  [x] Done (top 5 customers by lifetime spend + repeat-customer count)
Menu/table performance             [x] Done (orders per table, in-range order status breakdown)
Dashboard UI                       [x] Done (/dashboard/analytics: range selector 7/14/30 days, stat cards, per-day bar chart, item/customer/table/status list cards)
Tenant isolation                   [x] Done (every query filtered by restaurantId; cross-tenant test proves other restaurants see zeros, never foreign data)
```

### Key Design Decision

Analytics are computed live from tenant-scoped rows rather than a separate analytics store — volume is low and correctness matters more than query cost at this stage (an `AnalyticsEvent` table remains a future optimization). Revenue is counted only from `PAID`/`COMPLETED` orders and cancelled/rejected orders are excluded from every metric except the raw status breakdown. Daily buckets are aligned to UTC so the series is stable regardless of server timezone.

### Verification (2026-10-10, local)

`npm run typecheck`, `npm run lint`, `npm run test` (88 tests: 74 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/analytics.test.ts`, 5 tests): metric correctness across pending/paid/cancelled orders, daily bucket count and values, popular-item ordering, top customers, review aggregates, MANAGER+/STAFF/outsider/anonymous access, tenant isolation (other restaurant sees zeros), days-parameter validation.
HTTP smoke: two orders + one paid + one review → analytics returns revenue 300, avg rating 5, popular item "Thali" ×3; web `/dashboard/analytics` serves via built app.

---

## Phase 10 — Customer Management (completed)

### Objective

Give restaurants a customer directory: restaurant-scoped customer profiles derived from orders, with search, order history, and basic insights (PHASES.md §14).

### Current Completion

```text
Customer model + migration         [x] Done (Customer: restaurantId, name, phone, email; @@unique([restaurantId, phone]); Order.customerId; migration 20261010063716_phase10_customer_management incl. backfill of existing orders)
Auto-linking on order              [x] Done (order creation upserts the customer by restaurant+phone and sets order.customerId)
Customers API                      [x] Done (GET list w/ ?q= search on name/phone/email — STAFF+; GET detail w/ order history + insights — MANAGER+)
Search/filter                      [x] Done (case-insensitive substring search)
Customer insights                  [x] Done (order count, total spent, average order value, favorite item, first/last order dates, recent 20 orders)
Role limits                        [x] Done (STAFF see the list without emails per ARCHITECTURE.md §26 "Limited"; full details require MANAGER+)
Dashboard UI                       [x] Done (/dashboard/customers: debounced search, customer cards with spend/orders/last-visit, detail dialog with insight stats + order history)
```

### Key Design Decision

Customers are restaurant-scoped and identified by phone number — the same person dining at two restaurants is two customers, matching the multi-tenant model (ARCHITECTURE.md §4). Profiles are never created by hand; order creation upserts them. Aggregates (order count, spend, favorite item) are computed from the orders/order items tables, so insights stay correct even if a profile is updated.

### Verification (2026-10-10, local)

`npm run typecheck`, `npm run lint`, `npm run test` (83 tests: 69 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/customers.test.ts`, 6 tests): profile creation/aggregation from orders, search by name/phone, detail insights (favorite item, average order value, recent orders), STAFF list-only limitation, outsider/anonymous rejection, tenant scoping.
HTTP smoke: two orders from the same phone → one customer with aggregated spend → detail returns favorite item and order history → search narrows results; web `/dashboard/customers` serves via built app.

---

## Phase 9 — Payment Status & Reviews (completed)

### Objective

Close the loop after payment: when the restaurant marks an order PAID, the customer becomes eligible to leave feedback and is offered a Google Maps review redirect (PHASES.md §13).

### Current Completion

```text
Review model + migration           [x] Done (Review: orderId unique, restaurantId, rating 1-5, comment, googleMapsOpenedAt; migration 20261009155801_phase9_payment_reviews)
Customer order status endpoint     [x] Done (GET /public/qr/:token/orders/:orderId — token → table → order scoped; returns status, total, restaurant Google URL, reviewEligible, existing review)
Review eligibility                 [x] Done (eligible only when order status is PAID or COMPLETED; enforced server-side)
Review submission                  [x] Done (POST .../review; one review per order via idempotent upsert; rating 1-5 validated)
Google Maps redirect               [x] Done (POST .../review/google records googleMapsOpenedAt and returns the restaurant's URL; redirect-only, never claims a posted review)
Customer order page                [x] Done (/q/:token/order/:orderId: status polling every 5s, star-rating form when eligible, Google button after feedback, explicit "we cannot confirm a posted review" note)
Order confirmation link            [x] Done (cart drawer links to the tracking page)
```

### Key Design Decision

A review is attached 1:1 to an order and can only exist after `PAID`. Google review tracking is limited to recording that the customer opened the Google Maps link (`googleMapsOpenedAt`) — Google does not provide a way to verify a review was actually posted, so the product copy and API only ever claim the redirect (PRD §reviews, ARCHITECTURE.md §18).

### Verification (2026-10-10, local)

`npm run typecheck`, `npm run lint`, `npm run test` (77 tests: 63 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/reviews.test.ts`, 6 tests): status payload with eligibility + Google URL, rejection before PAID, submit-after-paid, idempotent one-per-order upsert, rating range validation, Google-click tracking (before/after review, timestamp stability), token→table→order scoping.
HTTP smoke: full dashboard lifecycle to PAID → status endpoint shows `reviewEligible: true` → review submitted → Google click returns URL and records `googleMapsOpenedAt`; web `/q/:token/order/:orderId` serves via built app.

---

## Phase 8 — Restaurant Order Management (completed)

### Objective

Give restaurants a dashboard for incoming orders: view order details, and drive the order state machine with backend-validated transitions (PHASES.md §12, ARCHITECTURE.md §15).

### Current Completion

```text
Order management API               [x] Done (GET list w/ optional status filter, GET detail, PATCH status under /restaurants/:rid/orders; STAFF+ per ARCHITECTURE.md §26)
State machine validation           [x] Done (ALLOWED_TRANSITIONS map; PENDING→CONFIRMED→PREPARING→READY→SERVED→PAID→COMPLETED; CANCELLED/REJECTED terminal; REJECTED only from PENDING)
Dashboard orders page              [x] Done (/dashboard/orders: status filter tabs, order cards with table/customer/total/status)
Order details                      [x] Done (detail dialog: items, variants, add-ons, customer info, notes, timestamps)
Transition actions                 [x] Done (buttons for allowed next states; destructive CANCELLED/REJECTED styled differently)
Polling updates                    [x] Done (5-second auto-refresh while the page is open)
Tenant isolation & roles           [x] Done (STAFF can manage; outsiders 404; unauthenticated 401; cross-restaurant order access blocked)
```

### Key Design Decision

The state machine lives in one backend map (`ALLOWED_TRANSITIONS` in orders.service.ts). The dashboard renders action buttons from a mirror of that map, but every transition is re-validated server-side — invalid moves return `ORDER_INVALID_TRANSITION` (400), and terminal states (`COMPLETED`, `CANCELLED`, `REJECTED`) accept no further changes.

### Verification (2026-10-09, local)

`npm run typecheck`, `npm run lint`, `npm run test` (71 tests: 57 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/order-management.test.ts`, 7 tests): full lifecycle walk, invalid transition rejection, terminal states, reject-from-pending, list + status filter + item details, tenant scoping, STAFF/outsider/anonymous access, payload validation.
HTTP smoke: public order → `GET /restaurants/:rid/orders` lists it → `PATCH` to CONFIRMED succeeds → PENDING rollback rejected; web `/dashboard/orders` serves via built app.

---

## Phase 7 — Cart & Ordering (completed)

### Objective

Let customers add menu items (with variants and add-ons) to a cart, adjust quantities, and place a table-specific order (PHASES.md §11). Prices and totals must be computed on the backend.

### Current Completion

```text
Order models + migration           [x] Done (Order/OrderItem/OrderItemAddon + OrderStatus enum; migration 20261009143004_phase7_cart_ordering)
Order creation API                 [x] Done (POST /api/v1/public/qr/:token/orders; public, rate-limited)
Server-side price recomputation    [x] Done (base + variant + add-on prices come from the published MenuRevision snapshot; frontend prices/totals ignored)
Live availability checks           [x] Done (item/variant/add-on isAvailable validated against the database, not just the snapshot)
Table association                  [x] Done (order.tableId set from the QR token's RestaurantTable)
Customer information               [x] Done (name + phone required; email and notes optional)
Cart state (web)                   [x] Done (CartProvider + useCart; add/merge, quantity update, remove, clear, totals)
Cart UI                            [x] Done (cart button with count/total, bottom-sheet drawer, per-line quantities, order summary, checkout form, confirmation screen)
Validation & tests                 [x] Done (7 API tests: recomputed prices, ignored frontend totals, unavailable/foreign items, missing customer info, no published menu, inactive token)
```

### Key Design Decision

The frontend sends only item IDs, variant ID, add-on IDs, and quantities. The backend resolves the QR token to a table, loads the published menu snapshot for pricing, checks live availability from the menu tables, and recomputes the total before writing the order. This satisfies "never trust frontend business values" (RULES.md §9) — a tampered price field cannot affect the stored total.

### Verification (2026-10-09, local)

`npm run typecheck`, `npm run lint`, `npm run test` (64 tests: 50 API + 14 web), `npm run build` all pass.
New API tests (`apps/api/test/orders.test.ts`, 7 tests): recomputed prices with variant + add-on, table/restaurant association, ignored frontend price, unavailable item/variant/add-on rejection, foreign item rejection, required customer fields, no published menu, inactive QR token.
HTTP smoke: create menu → publish → table → POST `/public/qr/:token/orders` returns a PENDING order with correct total; web `/q/:token` serves the cart-enabled customer app.

---

## Phase 6 — Customer Menu (completed)

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
[x] Phase 7 cart & ordering — Order/OrderItem/OrderItemAddon schema + migration 20261009143004_phase7_cart_ordering; POST /api/v1/public/qr/:token/orders; server-side price recomputation from published snapshot + live availability checks; table association from QR token; web CartProvider, cart button, bottom-sheet drawer, quantity controls, checkout form with name/phone
[x] Phase 8 order management — order list/detail/transition APIs under /restaurants/:rid/orders (STAFF+); ALLOWED_TRANSITIONS state machine with terminal CANCELLED/REJECTED; /dashboard/orders page with status filters, order detail dialog, transition buttons, 5-second polling; tenant isolation tested
[x] Phase 9 payment & reviews — Review model + migration 20261009155801_phase9_payment_reviews; customer order status endpoint scoped token→table→order; review eligibility at PAID/COMPLETED; one-review-per-order upsert; Google Maps redirect tracked as open-event only; /q/:token/order/:orderId tracking page with review prompt
[x] Phase 10 customer management — Customer model (restaurant-scoped, unique by restaurant+phone) + Order.customerId + migration 20261010063716_phase10_customer_management with backfill; auto-upsert on order creation; customers list w/ search (STAFF+) and detail w/ order history + insights (MANAGER+); /dashboard/customers page with search, cards, and detail dialog
[x] Phase 11 analytics — GET /restaurants/:rid/analytics (MANAGER+) computing overview (orders, revenue, AOV, customers, reviews), UTC-aligned daily orders/revenue trends, popular items, top customers, orders-by-table, and status breakdowns; /dashboard/analytics page with range selector, stat cards, bar chart, and list cards; tenant-isolated queries
[x] Phase 12 loyalty program — LoyaltyAccount + LoyaltyTransaction models + migration 20261010161555_phase12_loyalty_program; earning rule 1 pt per 100 spent awarded idempotently on PAID transition; counter redemption endpoint (STAFF+) with atomic balance checks; accounts list (MANAGER+); /dashboard/loyalty page; points on customer tracking page + loyalty history in customer detail
[x] Phase 13 themes & offers — Offer discount fields (PERCENT/FLAT) + scheduling + Order subtotal/discount/offerId + migration 20261011055617_phase13_themes_offers (subtotal backfilled); server-side best-discount auto-application at order creation; schedule-aware menu display; /dashboard/offers CRUD (MANAGER+); 4 seasonal theme presets + heroText + list/grid layoutStyle
[x] Phase 14 SaaS foundations — Subscription model (one per restaurant, auto-FREE) + Plan enum + migration 20261011074336_phase14_subscriptions (FREE backfill); static plan catalog (FREE/STARTER/PRO/ENTERPRISE) with limits + feature flags; usage limits enforced pre-create (402 PLAN_LIMIT_REACHED); analytics/loyalty feature gates (403 PLAN_FEATURE_LOCKED); GET /subscription + OWNER plan change; /dashboard/billing page; no billing provider integrated (not defined by requirements)
[x] Phase 15 multi-branch — Restaurant.parentId self-relation (branch = child restaurant, one level) + migration 20261011171552_phase15_multi_branch; GET/POST branches (OWNER); parent-membership inheritance in requireMembership; branches in workspace list (deduped); root subscription shared per organization; analytics ?scope=org with byBranch breakdown; /dashboard/branches page
[x] Phase 16 integrations — requirements audit found only Google Maps specified (all others "potential future" in PHASES.md §20, not implemented); integration layer established at apps/api/src/integrations/google-maps.ts with Google-host allow-list closing an open-redirect hole on the stored googleMapsUrl; reviews domain routed through the module
[x] Phase 17 production hardening — log redaction of auth tokens; 413/400 for body errors; 30/min/IP write limiter; fail-fast production env (DATABASE_URL); render build runs migrations; customer QR routes code-split (~19 KB chunk); per-page document titles; hardening test suite; 13-checkpoint E2E validation; 125 tests passing
[ ] Database setup — Prisma configured; local dev + test Postgres verified; awaiting Neon DATABASE_URL for hosted environments
[ ] Clerk authentication — code complete; awaiting Clerk application keys to verify real sign-in
[ ] Sentry monitoring — SDK wired; awaiting DSN
[ ] Vercel deployment — vercel.json ready; not provisioned
[ ] Render deployment — render.yaml ready; not provisioned
[ ] CI/CD — workflow updated with Postgres service for tests; not yet run on GitHub
```

Verification evidence (2026-10-12, local):
`npm run typecheck`, `npm run lint`, `npm run test` (125 tests: 111 API + 14 web), `npm run build` all pass.
New hardening tests cover security headers, error shapes, rate-limit headers, 413/400 body handling; E2E validation 13/13; log redaction verified live.

Verification evidence (2026-10-12, local):
`npm run typecheck`, `npm run lint`, `npm run test` (119 tests: 105 API + 14 web), `npm run build` all pass.
New integration tests prove Google-host allow-listing and the null-redirect behavior for non-Google stored URLs.

Verification evidence (2026-10-11, local):
`npm run typecheck`, `npm run lint`, `npm run test` (114 tests: 100 API + 14 web), `npm run build` all pass.
HTTP smoke: root → created "Uptown" branch → workspace list deduped (root + branch) → inherited table create on branch → org analytics `byBranch` spanning both after plan upgrade; web `/dashboard/branches` serves via built app.

Verification evidence (2026-10-11, local):
`npm run typecheck`, `npm run lint`, `npm run test` (107 tests: 93 API + 14 web), `npm run build` all pass.
HTTP smoke: FREE restaurant → 4th table `402 PLAN_LIMIT_REACHED`, analytics `403 PLAN_FEATURE_LOCKED` → PUT plan PRO → analytics 200, 4th table 201; web `/dashboard/billing` serves via built app.

Verification evidence (2026-10-11, local):
`npm run typecheck`, `npm run lint`, `npm run test` (101 tests: 87 API + 14 web), `npm run build` all pass.
HTTP smoke: live 10% offer auto-applied (500 → 450, `offerId` set) while a 2030-dated campaign stays hidden from the public menu; web `/dashboard/offers` and `/q/:token` serve via built app.

Verification evidence (2026-10-10, local):
`npm run typecheck`, `npm run lint`, `npm run test` (95 tests: 81 API + 14 web), `npm run build` all pass.
HTTP smoke: 900-spend order marked paid → 9 points → redeem 3 → balance 6 visible on the customer tracking page; web `/dashboard/loyalty` serves via built app.

Verification evidence (2026-10-10, local):
`npm run typecheck`, `npm run lint`, `npm run test` (88 tests: 74 API + 14 web), `npm run build` all pass.
HTTP smoke: two orders + one paid + one review → analytics returns revenue 300, avg rating 5, popular item "Thali" ×3; web `/dashboard/analytics` serves via built app.

Verification evidence (2026-10-10, local):
`npm run typecheck`, `npm run lint`, `npm run test` (83 tests: 69 API + 14 web), `npm run build` all pass.
HTTP smoke: two orders from the same phone → one customer with aggregated spend → detail returns favorite item and order history → search narrows results; web `/dashboard/customers` serves via built app.

Verification evidence (2026-10-10, local):
`npm run typecheck`, `npm run lint`, `npm run test` (77 tests: 63 API + 14 web), `npm run build` all pass.
HTTP smoke: full dashboard lifecycle to PAID → status endpoint shows `reviewEligible: true` → review submitted → Google click returns URL and records `googleMapsOpenedAt`; web `/q/:token/order/:orderId` serves via built app.

Verification evidence (2026-10-09, local):
`npm run typecheck`, `npm run lint`, `npm run test` (71 tests: 57 API + 14 web), `npm run build` all pass.
HTTP smoke: public order → `GET /restaurants/:rid/orders` lists it → PATCH to CONFIRMED succeeds → PENDING rollback rejected with `ORDER_INVALID_TRANSITION`; web `/dashboard/orders` serves via built app.

Verification evidence (2026-10-09, local):
`npm run typecheck`, `npm run lint`, `npm run test` (64 tests: 50 API + 14 web), `npm run build` all pass.
HTTP smoke: create menu → publish → table → POST `/api/v1/public/qr/:token/orders` returns a PENDING order with server-computed total; web `/q/:token` serves the cart-enabled customer app.

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

```text
Issue: Prisma migrate refused to run because the phase10 migration file was edited after application (SQL backfill appended), forcing a reset of the local dev database.
Detected: 2026-10-10 (Phase 12).
Impact: Local dev data (smoke-test rows in dynamicmenu_dev) was dropped; schema and migrations unaffected.
Status: Resolved.
Workaround: `npx prisma migrate reset --force` re-applied all migrations including the backfill.
Resolution: Avoid editing applied migration files; append data backfills as NEW migrations in future.
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

```text
Date: 2026-10-12
Change: Integration layer for external providers
Previous: The Google Maps review redirect was embedded in the review domain (reviews.service) and any https URL stored in Restaurant.googleMapsUrl was returned to the customer — an open-redirect risk.
New: `apps/api/src/integrations/<provider>.ts` is the convention — one module per external provider, domain services call the module only. Google Maps lives at integrations/google-maps.ts with `normalizeGoogleMapsUrl` (https + Google-owned hosts only) and `reviewRedirectUrl` (redirect-only, never claims a posted review).
Reason: ARCHITECTURE.md §46 constraint 11 (isolate external integrations) + the Phase 16 instruction to only implement specified integrations.
Affected Components: reviews.service (recordGoogleMapsOpen), new integrations/ directory, integrations tests.
Note: Future specified providers (payment gateways, SMS, email, …) get their own module under integrations/; core logic must stay provider-agnostic.
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

**Status:** Tenant core + restaurant profile + menu + themes + tables + offers + orders + reviews + customers + loyalty implemented; dev + test databases migrated

`prisma/schema.prisma` (PostgreSQL) contains the tenant core, restaurant profile, Phase 3 menu domain, Phase 4 theme config, Phase 5 tables, Phase 6 offers, Phase 7 orders, Phase 9 reviews, Phase 10 customers, and Phase 12 loyalty:

```text
User                     (id, clerkId unique, email unique, name)
Restaurant               (id, name, slug unique, status, parentId?,
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
                          imageUrl, discountType PERCENT/FLAT?, discountValue,
                          startsAt/endsAt schedule window, isActive, position)

Order                    (restaurantId, tableId, status, customerName/Phone/Email,
                          notes, subtotal, discount, total Decimal(10,2), offerId)
OrderItem                (orderId, menuItemId, name, quantity, basePrice,
                          variantId/Name/Price, subtotal)
OrderItemAddon           (orderItemId, addonId, name, price)
OrderStatus enum         PENDING | CONFIRMED | PREPARING | READY | SERVED |
                          PAID | COMPLETED | CANCELLED | REJECTED

Review                   (orderId unique, restaurantId, rating, comment,
                          googleMapsOpenedAt)

Customer                 (restaurantId, name, phone, email;
                          @@unique([restaurantId, phone]); Order.customerId)

LoyaltyAccount           (customerId unique, points, lifetimeEarned/Redeemed)
LoyaltyTransaction       (accountId, EARN/REDEEM/ADJUST, points, reason, orderId)

Subscription             (restaurantId unique, plan FREE/STARTER/PRO/ENTERPRISE,
                          status ACTIVE/CANCELLED; auto-provisioned as FREE)
```

Migrations under `prisma/migrations/`:

```text
20260927181123_phase1_tenant_core
20261003132614_phase2_restaurant_profile
20261004073613_phase3_menu_management
20261008031054_phase4_theme_system
20261009101341_phase5_tables_qr
20261009141616_phase6_customer_menu_offers
20261009143004_phase7_cart_ordering
20261009155801_phase9_payment_reviews
20261010063716_phase10_customer_management
20261010161555_phase12_loyalty_program
20261011055617_phase13_themes_offers
20261011074336_phase14_subscriptions
20261011171552_phase15_multi_branch
```

Applied to the local test database (via `test/global-setup.ts`) and the local dev database (`dynamicmenu_dev`). Onboarding progress is NOT stored — it is derived from profile fields plus published-menu existence plus at least one active table (see `computeOnboarding` in restaurants.service.ts). Published menu data lives ONLY in MenuRevision snapshots; the draft tree is the editable working copy. Theme config is presentation-only JSON; theme writes never touch menu tables (integration-tested). QR tokens live on `RestaurantTable`; there is no separate `QRCode` entity. The Phase 10 migration backfills `Customer` rows from existing orders (identity = restaurantId + phone) and links `Order.customerId`; new orders upsert the customer automatically.

Remaining planned entities (none implemented yet):

```text
AnalyticsEvent
Notification
```

Do not mark entities as implemented until the actual Prisma schema and database have been created and verified.

---

# 20. Current API State

**Status:** Phases 1–14 implemented (auth/tenancy, onboarding, menus, themes, tables & QR, customer menu, cart & ordering, restaurant order management, payment status & reviews, customer management, analytics, loyalty program, advanced themes & offers, SaaS subscriptions)

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
POST   /api/v1/public/qr/:token/orders             → create table order from cart (public; server recomputes all prices from the published snapshot and checks live availability)
GET    /api/v1/public/qr/:token/orders/:orderId    → customer order status + review eligibility (public; token → table → order scoped)
POST   /api/v1/public/qr/:token/orders/:orderId/review → submit/update in-app review; only when order is PAID/COMPLETED (public)
POST   /api/v1/public/qr/:token/orders/:orderId/review/google → record Google Maps redirect open; returns the restaurant's googleMapsUrl (public)

GET    /api/v1/restaurants/:rid/orders             → list orders w/ optional ?status= filter (STAFF+)
GET    /api/v1/restaurants/:rid/orders/:orderId    → order detail with items/add-ons/table (STAFF+)
PATCH  /api/v1/restaurants/:rid/orders/:orderId    → transition order status; validated against ALLOWED_TRANSITIONS map (STAFF+)

GET    /api/v1/restaurants/:rid/customers          → list customers w/ optional ?q= search; STAFF see list without emails
GET    /api/v1/restaurants/:rid/customers/:cid     → customer detail: order history + insights (favorite item, avg order value); MANAGER+

GET    /api/v1/restaurants/:rid/analytics          → tenant-scoped analytics: overview, daily orders/revenue trends, popular items, top customers, orders by table, status breakdown (?days=1–90); MANAGER+

GET    /api/v1/restaurants/:rid/loyalty/accounts   → loyalty accounts w/ optional ?q= search (MANAGER+)
POST   /api/v1/restaurants/:rid/loyalty/redeem     → redeem points by customerId or phone; atomic balance check (STAFF+)

GET    /api/v1/restaurants/:rid/offers             → all offers/campaigns (MANAGER+)
POST   /api/v1/restaurants/:rid/offers             → create offer (discountType/discountValue/startsAt/endsAt optional) (MANAGER+)
PATCH  /api/v1/restaurants/:rid/offers/:offerId    → edit / activate / deactivate (MANAGER+)
DELETE /api/v1/restaurants/:rid/offers/:offerId    → delete campaign (MANAGER+)

GET    /api/v1/restaurants/:rid/subscription       → plan, status, usage vs limits, plan catalog (MANAGER+)
PUT    /api/v1/restaurants/:rid/subscription/plan  → self-serve plan change, no payment collected (OWNER)

GET    /api/v1/restaurants/:rid/branches           → branch list w/ menu+table counts (MANAGER+)
POST   /api/v1/restaurants/:rid/branches           → create branch (OWNER; root restaurants only)
GET    /api/v1/restaurants/:rid/analytics?scope=org → organization analytics incl. per-branch breakdown (MANAGER+, analytics feature)
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

2026-10-12 — Completed and verified Phase 17 (Production Hardening) locally — the full roadmap (Phases 1–17) is now done:

* Security/logging: audit found request logs were writing full bearer/dev-auth tokens — pino serializers now redact `authorization` and `x-dev-*` headers (verified live against a running server). Public order/review writes got a dedicated 30/min/IP limiter. `NODE_ENV=production` without `DATABASE_URL` now fails fast at boot.
* Error handling: oversized JSON bodies were surfacing as 500 → now `413 PAYLOAD_TOO_LARGE`; malformed JSON → `400 INVALID_JSON` (error-handler maps body-parser error types).
* Performance/SEO: customer QR routes lazy-loaded (`/q/*` chunks ≈ 19 KB + 5 KB + 1 KB vs the 670 KB main bundle); customer pages set `document.title` to the restaurant name.
* Deployment: render.yaml build now runs `prisma migrate deploy`; ESLint default-project cap raised 20 → 40 for the 21-file test suite.
* Validation: new `hardening.test.ts` (6 tests: security headers, error envelope, rate-limit headers, 413/400 bodies, 401s); full suite at 125 tests; 13-checkpoint end-to-end chain across the entire product loop all PASS.
* Documented as pending (not faked): Sentry DSN, hosted provisioning, backup automation, deeper a11y/DB tuning.

2026-10-12 — Completed and verified Phase 16 (Integrations) locally:

* Requirements audit: PRD.md/PHASES.md/ARCHITECTURE.md reviewed for specified integrations. The only specified external integration is Google Maps review redirection (ARCHITECTURE.md review flow); PHASES.md §20's payment gateways, POS, KDS, WhatsApp, SMS, email, Google Business, inventory, accounting, and CRM are listed as "potential future" — none were implemented, per the instruction to only build specified/approved integrations.
* Integration layer established at `apps/api/src/integrations/google-maps.ts`: one module per provider, domain services call the module (ARCHITECTURE.md §46 constraint 11). The review domain's redirect now flows through `reviewRedirectUrl()`.
* Security hardening: `normalizeGoogleMapsUrl` allows only https on Google-owned hosts — a restaurant storing a non-Google `googleMapsUrl` can no longer turn the review redirect into an open redirect; the API returns `googleMapsUrl: null` instead.
* Verified: typecheck, lint, 119 tests (105 API + 14 web), build; new `apps/api/test/integrations.test.ts` covers the allow-list (incl. subdomain-spoof and http rejection) and the end-to-end null-redirect behavior.

2026-10-11 — Completed and verified Phase 15 (Multi-Branch Restaurants) locally:

* Prisma: `Restaurant.parentId` self-relation (a branch is a child restaurant, one level deep) + migration `20261011171552_phase15_multi_branch`.
* Branches: `GET/POST /restaurants/:rid/branches` (MANAGER+ list with menu/table counts; OWNER create; `BRANCH_OF_BRANCH` guards nesting; slug uniqueness enforced). The creating owner gets explicit branch membership.
* Staff access: `requireMembership` falls back to the parent restaurant's membership — org members manage every branch with their own role; `GET /restaurants` includes accessible branches (deduped against explicit memberships) so the workspace picker switches between root and branches.
* Organization plan & analytics: the subscription resolves to the root (one plan per org, usage still per branch); `GET /analytics?scope=org` aggregates root + branches with a `byBranch` breakdown (dashboard renders a "By branch" card).
* Dashboard: `/dashboard/branches` list + create form (nav link); branch page redirects context when opened on a branch.
* Verified: typecheck, lint, 114 tests (100 API + 14 web), build, HTTP smoke (branch create → deduped workspace list → inherited branch table create → org `byBranch` analytics after upgrade), web `vite preview` on `/dashboard/branches`.

2026-10-11 — Completed and verified Phase 14 (SaaS & Commercial Features) locally:

* Prisma: `Subscription` model (restaurantId unique, plan, status) + Plan/SubscriptionStatus enums + migration `20261011074336_phase14_subscriptions` with FREE backfill for existing restaurants. Subscriptions auto-provision as FREE on first access.
* Entitlements: static plan catalog (`modules/billing/plans.ts` — FREE/STARTER/PRO/ENTERPRISE with limits + feature flags) enforced centrally via `billing.service` (`assertCanCreate` → 402 `PLAN_LIMIT_REACHED` on tables/menus/offers; `assertFeature` → 403 `PLAN_FEATURE_LOCKED` on analytics and Loyalty Program; loyalty earning silently skips when not entitled).
* Account management: `GET /subscription` (usage + plan catalog, MANAGER+) and `PUT /subscription/plan` (OWNER, instant self-serve); `/dashboard/billing` page with usage bars and plan cards; nav link.
* Billing: intentionally NOT integrated — the project requirements define no billing provider, so plan changes collect no payment and prices are display-only.
* Verified: typecheck, lint, 107 tests (93 API + 14 web), build, HTTP smoke (FREE → 402 on 4th table + 403 analytics → upgrade PRO → both unblocked), web `vite preview` on `/dashboard/billing`. analytics/loyalty test suites updated to provision PRO subscriptions at the entitlement gates.

2026-10-11 — Completed and verified Phase 13 (Advanced Themes & Offers) locally:

* Prisma: `Offer` gains `discountType` (PERCENT/FLAT), `discountValue`, `startsAt`/`endsAt`; `Order` gains `subtotal` (backfilled via migration SQL added before first application), `discount`, `offerId`; migration `20261011055617_phase13_themes_offers`.
* Offers engine: schedule-aware public listing, `bestActiveDiscount` (largest live discount wins), full MANAGER+ CRUD with discount/schedule validation; order creation auto-applies the best campaign server-side and stores `subtotal`/`discount`/`offerId`.
* Web: `/dashboard/offers` campaign manager (create/edit form with discount + datetime schedule, activate/deactivate, delete confirm); nav "Offers" link; offer banners show discount text; cart drawer and order detail show the applied saving.
* Themes: 4 seasonal presets (Diwali Lights, Christmas Eve, Eid Celebration, Halloween Night); `ThemeConfig` gains `heroText` + `layoutStyle` (list/grid) with zod defaults so older saved configs still validate; editor controls; customer menu renders hero text and grid layout.
* Verified: typecheck, lint, 101 tests (87 API + 14 web), build, HTTP smoke (10% offer auto-applied 500 → 450; 2030-dated campaign hidden from the public menu), web `vite preview` on `/dashboard/offers`.

2026-10-10 — Completed and verified Phase 12 (Loyalty Program) locally:

* Prisma: `LoyaltyAccount` (customerId unique, points, lifetimeEarned/Redeemed) + `LoyaltyTransaction` (EARN/REDEEM/ADJUST, reason, orderId) + migration `20261010161555_phase12_loyalty_program`. The migrate run required a dev-DB reset because the phase10 migration file had been edited after application (recorded in Known Issues).
* Earning: 1 point per 100 spent (floored), awarded inside `transitionOrder` when an order enters `PAID`; `awardPointsForOrder` is idempotent per order (existing EARN transaction check), so retries and PAID→COMPLETED never double-award.
* API: `GET /loyalty/accounts` (MANAGER+, optional `?q=` search) and `POST /loyalty/redeem` (STAFF+, by customerId or phone, atomic balance check, `LOYALTY_INSUFFICIENT_POINTS` on over-redemption).
* Web: `/dashboard/loyalty` — counter redemption form for staff, searchable account list with balances for managers; customer order tracking page shows the customer's points; customer detail dialog shows balance + transaction history.
* Verified: typecheck, lint, 95 tests (81 API + 14 web), build, HTTP smoke (900-spend order → 9 pts → redeem 3 → 6 pts on tracking page), web `vite preview` on `/dashboard/loyalty`.

2026-10-10 — Completed and verified Phase 11 (Analytics) locally:

* API: `GET /restaurants/:rid/analytics?days=N` (MANAGER+, N clamped 1–90) computing live from tenant-scoped rows — overview (counted orders, revenue from PAID/COMPLETED, average order value, total/repeat customers, review count + average rating), a zero-filled UTC-aligned daily orders/revenue series, top 8 items by quantity, top 5 customers by spend, orders per table, and in-range status breakdown. Cancelled/rejected orders are excluded from every metric except the raw status breakdown.
* Web: `/dashboard/analytics` — 7/14/30-day range selector, overview stat cards, per-day bar chart, and list cards for popular items, top customers, orders by table, and status breakdown. Dashboard nav "Analytics" is now live.
* Tenant isolation: every query is filtered by `restaurantId`; the cross-tenant test proves another restaurant sees zeros, never foreign rows.
* Verified: typecheck, lint, 88 tests (74 API + 14 web), build, HTTP smoke (orders + paid + review → correct revenue/rating/item metrics), web `vite preview` on `/dashboard/analytics`.

2026-10-10 — Completed and verified Phase 10 (Customer Management) locally:

* Prisma: `Customer` model (restaurant-scoped, `@@unique([restaurantId, phone])`), `Order.customerId`, and migration `20261010063716_phase10_customer_management` — including a SQL backfill that creates customer profiles from existing orders and links `Order.customerId` (also applied manually to the dev DB).
* API: `GET /restaurants/:rid/customers` (STAFF+, optional `?q=` search over name/phone/email, emails hidden from STAFF) and `GET /restaurants/:rid/customers/:cid` (MANAGER+) returning order count, total spent, average order value, favorite item, first/last order dates, and the 20 most recent orders. Order creation now upserts the customer by restaurant + phone inside the same transaction.
* Web: `/dashboard/customers` — debounced search, customer cards (name, phone, spend, order count, last visit), and a detail dialog with insight stats and order history; STAFF see a read-only list without detail access.
* Verified: typecheck, lint, 83 tests (69 API + 14 web), build, HTTP smoke (two orders from one phone → aggregated customer profile with favorite item; search narrows results), web `vite preview` on `/dashboard/customers`.

2026-10-10 — Completed and verified Phase 9 (Payment Status & Reviews) locally:

* Prisma: `Review` model (`orderId` unique, `restaurantId`, `rating` 1–5, `comment`, `googleMapsOpenedAt`) + migration `20261009155801_phase9_payment_reviews` on dev + test databases.
* API: customer order status at `GET /public/qr/:token/orders/:orderId` (token → table → order scoped, returns status/total/restaurant Google URL/review eligibility/existing review); `POST .../review` submits feedback (eligible only when order is PAID or COMPLETED, one review per order via idempotent upsert); `POST .../review/google` records that the customer opened the Google Maps link and returns the URL — it never claims a review was posted.
* Web: `/q/:token/order/:orderId` order tracking page with 5-second polling, human-readable status, star-rating + comment form shown only after payment, Google Maps button after feedback, and explicit copy that a posted Google review cannot be confirmed; cart drawer now links to the tracking page.
* Verified: typecheck, lint, 77 tests (63 API + 14 web), build, HTTP smoke (lifecycle to PAID → status shows eligible → review submitted → Google click tracked), web `vite preview` on the order page.

2026-10-09 — Completed and verified Phase 8 (Restaurant Order Management) locally:

* API: order management endpoints under `/api/v1/restaurants/:restaurantId/orders` (STAFF+ per ARCHITECTURE.md §26): GET list with optional `?status=` filter, GET detail with items/add-ons/table, PATCH status with a backend `ALLOWED_TRANSITIONS` state machine (PENDING→CONFIRMED→PREPARING→READY→SERVED→PAID→COMPLETED; CANCELLED/REJECTED terminal; REJECTED only from PENDING). Invalid moves return 400 `ORDER_INVALID_TRANSITION`.
* Web: `/dashboard/orders` — status filter tabs, order cards (table, customer, item count, total, status badge), order detail dialog with item lines, variants, add-ons, customer info, and buttons for each allowed next state; auto-refresh polling every 5 seconds. Dashboard nav "Orders" is now live.
* Verified: typecheck, lint, 71 tests (57 API + 14 web), build, HTTP smoke (public order → list → confirm → invalid rollback rejected), web `vite preview` on `/dashboard/orders`.

2026-10-09 — Completed and verified Phase 7 (Cart & Ordering) locally:

* Prisma: `Order`, `OrderItem`, `OrderItemAddon` models + `OrderStatus` enum + migration `20261009143004_phase7_cart_ordering` on dev + test databases.
* API: `POST /api/v1/public/qr/:token/orders` (public, rate-limited). The frontend sends only item/variant/add-on IDs, quantities, and customer info; the backend resolves the QR token to a table, loads the published `MenuRevision` snapshot for pricing, validates live `isAvailable` flags against the menu tables, recomputes every line subtotal and the order total, and writes the order as `PENDING`.
* Web: `CartProvider`/`useCart` state with add/merge, quantity update, remove, and clear; floating cart button with item count and total; bottom-sheet cart drawer with per-line quantities, order summary, and a checkout form (name + phone required); order confirmation screen that clears the cart. Item detail dialog now adds selections to the cart instead of just acknowledging.
* Verified: typecheck, lint, 64 tests (50 API + 14 web), build, HTTP smoke (create menu → publish → table → POST `/public/qr/:token/orders` returns correct total), web `vite preview` on `/q/:token`.

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
Phases 1–17 complete locally (full roadmap)
        ↓
Obtain hosted credentials (Neon, Clerk, Sentry)
        ↓
Provision Vercel + Render, run migrations on Neon
        ↓
Swap local-disk image storage for object storage (S3/R2)
        ↓
Configure backups (Neon PITR / scheduled pg_dump)
        ↓
Verify real sign-in + full flows in the browser, confirm CI
        ↓
Production launch on dynamicmenu.store
```

---

# 26. Current Blocker Status

```text
No blockers recorded.
```

Hosted credentials (Neon, Clerk, Sentry) are now the only blocker between the completed local build and production launch.
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
Phase 7 cart/ordering  → Implemented & verified (local; server-recomputed prices + live availability tested)
Phase 8 order mgmt     → Implemented & verified (local; state machine + dashboard order board tested)
Phase 9 pay & reviews  → Implemented & verified (local; review eligibility + redirect-only Google tracking)
Phase 10 customers     → Implemented & verified (local; auto-linked profiles, insights, role-limited access)
Phase 11 analytics     → Implemented & verified (local; tenant-isolated metrics, trends, item/customer/table stats)
Phase 12 loyalty       → Implemented & verified (local; idempotent earning, atomic redemption, full ledger)
Phase 13 themes/offers → Implemented & verified (local; seasonal presets, scheduled campaigns, server-side discounts)
Phase 14 SaaS          → Implemented & verified (local; subscriptions, plan limits, feature gates, self-serve plan changes)
Phase 15 multi-branch  → Implemented & verified (local; branches as child tenants, inherited staff access, org analytics)
Phase 16 integrations  → Implemented & verified (local; integration layer + Google Maps behind module, open-redirect closed)
Phase 17 hardening     → Implemented & verified (local; 125 tests, E2E 13/13 — full roadmap complete)
Production system      → Ready for provisioning; awaits Neon/Clerk/Sentry credentials + object storage
Database (Prisma)      → Thirteen migrations applied on local dev + test Postgres; awaiting Neon URL
Authentication (Clerk) → Code complete; awaiting Clerk application keys
Monitoring (Sentry)    → Wired; awaiting DSN
Deployment             → Config files ready; not provisioned
Project domain         → dynamicmenu.store (production web base URL; env + render.yaml updated)
Image storage          → Local-disk provider behind ImageStorage interface; swap before production
```

---

# 28. Last Updated

```text
2026-10-12 — Phase 17 (Production Hardening) implemented and verified locally — full roadmap (Phases 1–17) complete: request logs no longer write auth tokens (pino redaction, verified live); public writes rate-limited 30/min/IP; production boot fails fast without DATABASE_URL; oversized/malformed JSON return 413/400; customer QR routes code-split (~19 KB chunk vs 670 KB main); per-page document titles; render build runs migrations; hardening test suite added; 125 tests passing (111 API + 14 web); 13-checkpoint end-to-end validation all PASS. Pending (documented, not faked): hosted credentials, object storage, backup automation. Production domain remains dynamicmenu.store.
2026-10-12 — Phase 16 (Integrations) implemented and verified locally: requirements audit confirmed Google Maps review redirection is the only specified external integration (all PHASES.md §20 categories are "potential future" — none built); integration layer established at apps/api/src/integrations/google-maps.ts with Google-host allow-list closing an open-redirect hole on the stored googleMapsUrl (non-Google URLs now yield a null redirect); reviews domain routed through the module; 119 tests passing (105 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-11 — Phase 15 (Multi-Branch Restaurants) implemented and verified locally: Restaurant.parentId self-relation (branch = child restaurant, one level) + migration 20261011171552_phase15_multi_branch; GET/POST branches with BRANCH_OF_BRANCH + slug guards; parent-membership inheritance in requireMembership for cross-branch staff access; deduped branch entries in GET /restaurants; root subscription shared per organization; analytics ?scope=org with byBranch breakdown; /dashboard/branches page; 114 tests passing (100 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-11 — Phase 14 (SaaS & Commercial Features) implemented and verified locally: Subscription model (one per restaurant, auto-FREE) + Plan enum + migration 20261011074336_phase14_subscriptions with FREE backfill; static plan catalog FREE/STARTER/PRO/ENTERPRISE with usage limits (tables/menus/offers → 402 PLAN_LIMIT_REACHED) and feature gates (analytics/loyalty → 403 PLAN_FEATURE_LOCKED); GET /subscription (MANAGER+) + OWNER self-serve plan change; /dashboard/billing page; no billing provider integrated (not defined by project requirements); 107 tests passing (93 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-11 — Phase 13 (Advanced Themes & Offers) implemented and verified locally: Offer discount fields (PERCENT/FLAT) + startsAt/endsAt scheduling + Order subtotal/discount/offerId + migration 20261011055617_phase13_themes_offers with subtotal backfill; server-side best-discount auto-application at order creation; schedule-aware public menu display; /dashboard/offers CRUD (MANAGER+); 4 seasonal theme presets (Diwali, Christmas, Eid, Halloween) + heroText + list/grid layoutStyle; 101 tests passing (87 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-10 — Phase 12 (Loyalty Program) implemented and verified locally: LoyaltyAccount + LoyaltyTransaction models + migration 20261010161555_phase12_loyalty_program; earning rule 1 point per 100 spent awarded idempotently inside the PAID order transition (per-order EARN transaction guard); counter redemption endpoint (STAFF+) with atomic balance checks; accounts list (MANAGER+); /dashboard/loyalty page; points on customer tracking page and loyalty history in customer detail; 95 tests passing (81 API + 14 web). Dev DB reset during migration (edited phase10 migration file) — recorded in Known Issues. Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-10 — Phase 11 (Analytics) implemented and verified locally: GET /restaurants/:rid/analytics (MANAGER+, days 1–90) computing tenant-isolated overview metrics (counted orders, PAID/COMPLETED revenue, average order value, repeat customers, review averages), UTC-aligned daily orders/revenue trends, popular items, top customers, orders-by-table, and status breakdowns; /dashboard/analytics page with range selector, stat cards, bar chart, and list cards; 88 tests passing (74 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-10 — Phase 10 (Customer Management) implemented and verified locally: Customer model (restaurant-scoped, unique by restaurant+phone) + Order.customerId + migration 20261010063716_phase10_customer_management with SQL backfill from existing orders; customer upsert on order creation; customers list API with ?q= search (STAFF+, emails hidden) and detail API with order history + insights (MANAGER+); /dashboard/customers page with debounced search, customer cards, and detail dialog; 83 tests passing (69 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-10 — Phase 9 (Payment Status & Reviews) implemented and verified locally: Review schema (orderId unique, rating 1-5, comment, googleMapsOpenedAt) + migration 20261009155801_phase9_payment_reviews, customer order status endpoint scoped token→table→order, review eligibility at PAID/COMPLETED, one-review-per-order upsert, Google Maps redirect tracked as open-event only (never claiming a posted review), /q/:token/order/:orderId tracking page with review prompt; 77 tests passing (63 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-09 — Phase 8 (Restaurant Order Management) implemented and verified locally: order list/detail/transition APIs under `/restaurants/:rid/orders` (STAFF+) with a backend ALLOWED_TRANSITIONS state machine (PENDING→CONFIRMED→PREPARING→READY→SERVED→PAID→COMPLETED, CANCELLED/REJECTED terminal), /dashboard/orders order board with status filters, detail dialog, transition buttons, and 5-second polling; 71 tests passing (57 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
2026-10-09 — Phase 7 (Cart & Ordering) implemented and verified locally: Order/OrderItem/OrderItemAddon schema + OrderStatus enum + migration 20261009143004_phase7_cart_ordering, public POST `/api/v1/public/qr/:token/orders` that recomputes all prices from the published MenuRevision snapshot and validates live availability, table association from the QR token, customer name/phone required; web CartProvider with cart button, bottom-sheet drawer, quantity controls, checkout form, and order confirmation; 64 tests passing (50 API + 14 web). Production domain remains dynamicmenu.store. Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render.
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