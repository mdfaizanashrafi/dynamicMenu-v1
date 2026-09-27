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

**Current Phase:** Phase 0 — Project Foundation

**Status:** In Progress (local development setup complete and verified; hosted service accounts pending)

**Current Objective:**

Establish the development foundation and verify the project structure before implementing product features.

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

## Phase 0 — Project Foundation

### Objective

Establish the technical foundation before implementing the product.

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
[ ] Database setup — Prisma configured; awaiting Neon DATABASE_URL
[ ] Clerk authentication — SDK wired; awaiting Clerk account keys
[ ] Sentry monitoring — SDK wired; awaiting DSN
[ ] Vercel deployment — vercel.json ready; not provisioned
[ ] Render deployment — render.yaml ready; not provisioned
[ ] CI/CD — workflow file created; not yet run on GitHub
```

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

1. Create Neon database → add `DATABASE_URL` to `apps/api/.env` → run `npm run db:migrate -w @dynamicmenu/api` to verify connectivity.
2. Create Clerk application → set `VITE_CLERK_PUBLISHABLE_KEY` (web) and `CLERK_SECRET_KEY` (api).
3. Create Sentry projects (web + api) → set `VITE_SENTRY_DSN` and `SENTRY_DSN`, then send a test error.
4. Commit the foundation and push to GitHub; confirm the CI workflow passes.
5. Provision Vercel (root `vercel.json`) and Render (`render.yaml`) projects with env vars; verify health check.
6. Mark Phase 0 complete and begin Phase 1 — Authentication & Multi-Tenancy.

## After Foundation

Begin:

```text
Phase 1 — Authentication & Multi-Tenancy
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

None recorded.

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

None yet.

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

**Status:** Prisma configured; no domain models yet

`prisma/schema.prisma` exists at the repo root (PostgreSQL datasource, client generation verified). Domain entities (User, Restaurant, Menu, ...) are intentionally deferred to their own phases. The API health endpoint reports `database: "unconfigured"` until `DATABASE_URL` (Neon) is provided.

Planned core entities (none implemented yet):

```text
User
Restaurant
RestaurantMembership

Menu
MenuSection
MenuItem
MenuItemVariant
MenuItemAddon

Theme
Offer

Table
QRCode

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

**Status:** Foundation implemented

Express 5 + TypeScript API exists at `apps/api` with:
`/api/v1/health` (200 ok / 503 degraded), consistent error envelope per ARCHITECTURE.md §33, zod validation middleware, helmet/cors/rate-limit, pino logging, Sentry error handler (activates with SENTRY_DSN). Domain endpoints (auth, restaurants, menus, orders, ...) are future phases.

```text
/api/v1/
```

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
Status: @clerk/clerk-react wired into apps/web (ClerkProvider activates with VITE_CLERK_PUBLISHABLE_KEY); Clerk application not yet created
```

## Monitoring

```text
Provider: Sentry
Status: @sentry/node and @sentry/react wired (activate with SENTRY_DSN / VITE_SENTRY_DSN); Sentry projects not yet created
```

---

# 22. Recent Work

Project documentation has been initialized.

Current documentation set:

```text
PRD.md
ARCHITECTURE.md
DESIGN.md
PHASES.md
MEMORY.md
```

No application implementation should be assumed from the existence of these documents.

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
Inspect repository
        ↓
Understand existing code
        ↓
Compare implementation against PRD
        ↓
Compare implementation against ARCHITECTURE.md
        ↓
Verify DESIGN.md and design references
        ↓
Begin Phase 0
```

No implementation task should be marked complete before inspection.

---

# 26. Current Blocker Status

```text
No blockers recorded.
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
Database (Prisma)      → Configured; awaiting Neon URL
Authentication (Clerk) → Wired; awaiting Clerk keys
Monitoring (Sentry)    → Wired; awaiting DSN
Deployment             → Config files ready; not provisioned
Production system      → Not started
```

---

# 28. Last Updated

```text
2026-09-27 — Phase 0 local foundation implemented and verified (typecheck/lint/test/build + API and web smoke tests). Awaiting user-provided credentials for Neon, Clerk, Sentry, Vercel, Render to finish hosted Phase 0 acceptance criteria.
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