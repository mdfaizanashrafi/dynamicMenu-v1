
---

### 4. `Phases.md`

```md
# DynamicMenu — Development Phases

## Phase 0 — Discovery & Foundation

### Goal

Understand the repository and establish the technical foundation.

### Tasks

- [ ] Audit repository
- [ ] Use Graphify for dependency analysis
- [ ] Establish architecture
- [ ] Configure development environment
- [ ] Configure database
- [ ] Establish application structure
- [ ] Establish design system

### Exit Criteria

- Project runs locally
- Architecture is documented
- Database connection works
- Base application works
- No major architectural uncertainty remains

---

## Phase 1 — Authentication

### Goal

Secure user authentication.

### Tasks

- [ ] Signup
- [ ] Login
- [ ] Logout
- [ ] Sessions
- [ ] Password/account recovery
- [ ] Protected routes

### Exit Criteria

- Users authenticate securely
- Protected resources work
- Unauthorized access is blocked

---

## Phase 2 — Multi-Tenancy

### Goal

Secure restaurant/tenant isolation.

### Tasks

- [ ] Tenant model
- [ ] Tenant creation
- [ ] Tenant membership
- [ ] Roles/permissions
- [ ] Tenant-aware API
- [ ] Tenant-aware queries
- [ ] Isolation tests

### Exit Criteria

- Restaurant data is isolated
- Users access only authorized tenants
- Cross-tenant access is prevented

---

## Phase 3 — Restaurant Dashboard

### Goal

Provide the restaurant management interface.

### Tasks

- [ ] Dashboard
- [ ] Restaurant profile
- [ ] Settings
- [ ] Navigation
- [ ] User/role management

---

## Phase 4 — Menu Management

### Goal

Allow restaurants to create and manage menus.

### Tasks

- [ ] Categories
- [ ] Menu items
- [ ] Prices
- [ ] Images
- [ ] Availability
- [ ] Menu ordering
- [ ] Menu naming

---

## Phase 5 — Themes & Offers

### Goal

Allow restaurant customization and promotions.

### Tasks

- [ ] Themes
- [ ] Menu customization
- [ ] Seasonal themes
- [ ] Offers
- [ ] Offer scheduling
- [ ] Promotional content

---

## Phase 6 — Tables & QR

### Goal

Connect physical tables to digital menus.

### Tasks

- [ ] Table management
- [ ] QR generation
- [ ] QR identification
- [ ] Public menu routing

---

## Phase 7 — Public Menu & Ordering

### Goal

Allow customers to browse and order.

### Tasks

- [ ] Public menu
- [ ] Mobile experience
- [ ] Item details
- [ ] Cart
- [ ] Table context
- [ ] Order creation
- [ ] Order status

---

## Phase 8 — Payment & Review

### Goal

Complete the order lifecycle.

### Tasks

- [ ] Payment/order status
- [ ] Mark order paid
- [ ] Review eligibility
- [ ] Review prompt
- [ ] Google Maps redirection

---

## Phase 9 — Billing & SaaS

### Goal

Enable commercial SaaS operation.

### Tasks

- [ ] Plans
- [ ] Subscriptions
- [ ] Billing
- [ ] Usage limits
- [ ] Subscription management

---

## Phase 10 — Production Hardening

### Goal

Prepare for production.

### Tasks

- [ ] Security audit
- [ ] Tenant isolation audit
- [ ] Performance audit
- [ ] Error handling
- [ ] Monitoring
- [ ] Backup/recovery
- [ ] Accessibility
- [ ] SEO
- [ ] Production deployment

---

## Phase 11 — Cleanup & Optimization

### Goal

Remove unnecessary complexity and technical debt.

### Tasks

- [ ] Graphify codebase
- [ ] Find dead code
- [ ] Find duplicate code
- [ ] Remove unused dependencies
- [ ] Simplify unnecessary abstractions
- [ ] Optimize critical paths
- [ ] Regression testing

---

## Phase Rules

- Complete exit criteria before advancing.
- Do not skip security or tenant-isolation requirements.
- Update `Memory.md` when phase status changes.
- Do not implement future-phase features early unless required by the current architecture.