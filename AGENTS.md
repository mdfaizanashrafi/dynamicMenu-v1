# AGENTS.md — AI Development Instructions for DynamicMenu

This file is the operating manual for AI coding agents working on this repository. Read it first, then the project documents listed below. The reader is assumed to know nothing about the project.

---

## 1. Project Overview

**DynamicMenu** is a multi-tenant SaaS platform ("WordPress for restaurant menus") that lets restaurants create, customize, and publish QR-code-based digital menus. Customers scan a table QR code, browse a themed menu on their phone, and place table-specific orders. After the restaurant marks an order paid, the customer is prompted to leave feedback and is redirected to Google Maps for a public review.

There are two user experiences:

- **Restaurant dashboard** (owners/managers/staff): onboarding, menu CMS, themes, offers, tables & QR, orders, customers, loyalty, analytics.
- **Customer menu** (mobile-first, no account required): QR scan → published menu → cart → order → review prompt.

**Current state: Phase 2 — Restaurant Onboarding complete and verified locally; hosted services (Neon, Clerk, Sentry, Vercel, Render) await credentials. See `MEMORY.md` for the authoritative record.** Never assume a framework, file, or service exists until you verify it in the repo.

### Planned technology stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Radix UI | Vercel |
| Backend | Node.js, TypeScript, REST API, Prisma | Render |
| Database | PostgreSQL via Prisma | Neon |
| Auth | Clerk | — |
| Monitoring | Sentry | — |

State management (Zustand / React Query) and caching (Redis) are candidates to be decided during implementation.

---

## 2. Repository Structure

```
dynamicMenu-v1/
├── PRD.md              # Product requirements (what to build)
├── ARCHITECTURE.md     # Technical architecture (how to build it) — authoritative
├── DESIGN.md           # UI/UX and design system
├── PHASES.md           # Development roadmap (phases 0–17)
├── RULES.md            # Development and coding rules — authoritative
├── MEMORY.md           # Actual project state — read FIRST, update after work
├── README.md
├── AGENTS.md           # This file
└── design-references/  # Visual design references (screenshots, logo, sitemap)
    ├── components/     # LOGO, brand identity, favicon
    ├── dashboard/      # menu-management, overview-command-center
    ├── public-menu/    # customer-menu, item-details
    ├── ordering/       # cart-and-checkout, order-status
    └── DESIGN-REFERENCES.md
```

Monorepo layout (created in Phase 0) per `ARCHITECTURE.md`:

```
apps/web/        # React frontend
apps/api/        # Node backend (modules/, middleware/, services/, utils/, config/)
prisma/          # schema.prisma
```

---

## 3. Build and Test Commands

Standard workflow per `ARCHITECTURE.md` §37, run from the repo root (npm workspaces):

```bash
npm install                 # install all workspace dependencies
npm run typecheck           # TypeScript strict checks (web + api)
npm run lint                # ESLint (web + api)
npm run test                # Vitest unit tests (web + api)
npm run build               # build web (Vite) and api (tsc)
```

Individual apps:

```bash
npm run dev -w @dynamicmenu/web   # Vite dev server (localhost:5173)
npm run dev -w @dynamicmenu/api   # tsx watch API (localhost:4000)
npm run db:generate -w @dynamicmenu/api   # Prisma client (schema at prisma/)
```

`DATABASE_URL`, Clerk keys, and Sentry DSNs go in `.env` files (never committed; see `.env.example`). Deployment is via GitHub Actions → Vercel (frontend) and Render (backend); config lives in `vercel.json`, `render.yaml`, and `.github/workflows/ci.yml`.

---

## 4. Development Workflow

1. **Read `MEMORY.md` first** — it records what has actually been done.
2. Read the phase-relevant sections of `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `PHASES.md`, and `DESIGN.md`.
3. Inspect the existing code before creating or modifying files.
4. Identify the current phase and keep work scoped to it (see `PHASES.md`).
5. Plan the smallest correct change, implement, then verify.
6. Update `MEMORY.md` after meaningful work.

Source-of-truth precedence: if documents conflict, **stop and flag the conflict** instead of guessing. Do not ask questions whose answer is in the repo or docs.

### Code style (`RULES.md`)

- Strict TypeScript; avoid `any`; type important boundaries; keep domain types near their domain.
- Reuse existing components/patterns; no speculative files, duplicate logic, or unnecessary abstractions/dependencies.
- Keep state local where possible; don't duplicate server state in client state; no global state without a clear requirement.
- UI must follow `DESIGN.md`, reuse design-system components, be responsive, keyboard-accessible, and include loading/empty/error states. No one-off styling or gratuitous animations.

---

## 5. Testing Strategy

No tests exist yet. Per `PHASES.md` §27, each phase must include:

- **Unit tests**: business rules, validation, order state transitions, offer/loyalty calculations, authorization.
- **Integration tests**: signup → restaurant creation → menu creation → QR resolution → order creation → status changes → review eligibility (frontend → API → database).
- **E2E tests**: the critical customer flow — scan QR → menu → add item → cart → order → dashboard → mark paid → review.

A phase is complete only when core functionality, backend validation, verified tenant isolation, responsive UI, loading/empty/error states, critical-flow tests, and doc updates are all done. Never claim tests passed unless you actually ran them and checked the output.

---

## 6. Security Considerations (Critical)

Multi-tenant isolation is the top security requirement. Every tenant (restaurant)-owned operation must verify authentication → authorization → tenant identity → tenant ownership. Never trust client-provided tenant IDs, prices, availability, roles, or order totals — always resolve and validate server-side.

Additional requirements (`RULES.md` §9, `ARCHITECTURE.md` §27):

- Never hardcode or commit secrets; keep credentials server-side (env vars).
- Validate all untrusted input (bodies, params, headers, uploads, webhooks) at the server boundary.
- Rate-limit public endpoints (QR resolution, order creation, review submission, auth).
- Sanitize user-generated content; protect against XSS/SQL injection (use Prisma parameterized queries).
- Return consistent error shapes without exposing stack traces, DB errors, or internals (Sentry captures them).
- Never claim a Google review was posted unless verifiable — redirect-only initially.
- Validate uploaded files; store images in external object storage, not PostgreSQL.
- Enforce roles (OWNER/ADMIN/MANAGER/STAFF) on the backend per the permission matrix in `ARCHITECTURE.md` §26.

---

## 7. Key Architectural Decisions to Follow

- **Multi-tenancy**: restaurant = tenant; every tenant-owned row has an explicit tenant relationship; customers are restaurant-scoped, never global.
- **API-first**: frontend never touches the database; business rules live in the backend service layer.
- **Draft/publish**: customers only receive published menu data.
- **Themes are data-independent presentation layers** — changing a theme never duplicates or modifies menu data.
- **Orders are a state machine**: PENDING → CONFIRMED → PREPARING → READY → SERVED → PAID → COMPLETED (+ CANCELLED/REJECTED); transitions validated by the backend; critical operations idempotent.
- **QR tokens** (not internal IDs) identify restaurant + table via `/q/{token}`.
- Keep the backend stateless for horizontal scaling; add Redis caching only when load justifies it.

---

## 8. AI Boundaries

- Do not invent requirements, completed work, decisions, bugs, deployments, migrations, or test results.
- Inspect before modifying; make the smallest reasonable change; verify consequential changes.
- Do not delete code, refactor unrelated areas, change unrelated files, or replace working architecture without justification.
- Ask before proceeding when requirements conflict or a decision is materially ambiguous.
- After any change: sweep for comments/docstrings describing old behavior and update them; update `MEMORY.md`; keep `AGENTS.md` accurate if project guidance changes.

Last reviewed: 2026-10-04 (project at Phase 2 complete locally — restaurant onboarding implemented and verified; hosted credentials pending).