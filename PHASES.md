# DynamicMenu — PHASES.md

## 1. Purpose

This document defines the implementation roadmap for DynamicMenu.

The roadmap converts the requirements in `PRD.md` into structured development phases so the product can be built incrementally without introducing unnecessary complexity too early.

The primary objective is to launch a reliable MVP first, validate the core restaurant and customer workflows, and then progressively add advanced customization, loyalty, analytics, and integrations.

---

# 2. Product Development Strategy

DynamicMenu should be developed in the following order:

```text
Foundation
    ↓
Authentication & Multi-Tenancy
    ↓
Restaurant Onboarding
    ↓
Menu Management
    ↓
Theme System
    ↓
Tables & QR
    ↓
Customer Menu
    ↓
Cart & Orders
    ↓
Restaurant Order Management
    ↓
Review Workflow
    ↓
Customer Management
    ↓
Analytics
    ↓
Loyalty
    ↓
Advanced SaaS Features
```

The core principle is:

> Build the smallest complete restaurant-to-customer workflow first, then add features around it.

---

# 3. Phase Overview

| Phase | Name | Primary Goal | Priority |
|---|---|---|---|
| 0 | Project Foundation | Establish development infrastructure | Critical |
| 1 | Authentication & Multi-Tenancy | Create secure restaurant accounts | Critical |
| 2 | Restaurant Onboarding | Allow restaurants to create their workspace | Critical |
| 3 | Menu Management | Build the core menu CMS | Critical |
| 4 | Theme System | Allow menu customization | High |
| 5 | Tables & QR | Connect physical tables to digital menus | Critical |
| 6 | Customer Menu | Build the public QR menu | Critical |
| 7 | Cart & Ordering | Allow customers to place orders | Critical |
| 8 | Restaurant Order Management | Allow staff to process orders | Critical |
| 9 | Payment Status & Reviews | Complete the post-order workflow | High |
| 10 | Customer Management | Build restaurant customer profiles | High |
| 11 | Analytics | Provide restaurant insights | High |
| 12 | Loyalty Program | Add repeat-customer functionality | Medium |
| 13 | Advanced Themes & Offers | Expand customization and campaigns | Medium |
| 14 | SaaS & Scaling | Prepare for commercial growth | Medium |
| 15 | Production Hardening | Security, performance, reliability | Critical |

---

# 4. Phase 0 — Project Foundation

## Objective

Create the technical foundation required for the entire DynamicMenu application.

## Scope

Set up:

- Frontend
- Backend
- Database
- ORM
- Authentication provider
- Error monitoring
- Environment configuration
- Git repository
- CI/CD
- Development/staging/production environments

## Technology

```text
Frontend:
React
TypeScript
Vite
Tailwind CSS
Radix UI

Backend:
Node.js
TypeScript
REST API

Database:
PostgreSQL
Neon
Prisma

Authentication:
Clerk

Monitoring:
Sentry

Deployment:
Vercel
Render
```

## Tasks

### Frontend

- Initialize React + TypeScript application.
- Configure Vite.
- Configure Tailwind CSS.
- Configure Radix UI.
- Create application routing.
- Create base layout.
- Create design token system.
- Implement typography.
- Implement responsive foundations.

### Backend

- Initialize Node.js + TypeScript service.
- Configure REST API.
- Configure environment variables.
- Configure Prisma.
- Connect to Neon.
- Add request validation.
- Add centralized error handling.
- Add logging.

### Infrastructure

- Configure GitHub repository.
- Configure Vercel.
- Configure Render.
- Configure Neon.
- Configure Clerk.
- Configure Sentry.
- Configure environment variables.

## Deliverable

A deployed empty DynamicMenu application with:

```text
Frontend → Vercel
Backend  → Render
Database → Neon
Auth     → Clerk
Monitor  → Sentry
```

## Acceptance Criteria

- Frontend loads successfully.
- Backend health endpoint works.
- Backend connects to Neon.
- Clerk authentication infrastructure is configured.
- Sentry receives test errors.
- CI build succeeds.
- Production and development environments are separated.

---

# 5. Phase 1 — Authentication & Multi-Tenancy

## Objective

Allow restaurant owners to create accounts and securely operate independent restaurant workspaces.

## Scope

Implement:

- Signup
- Login
- Logout
- User profile
- Restaurant creation
- Restaurant membership
- Roles
- Tenant isolation

## Core Entities

```text
User
Restaurant
RestaurantMembership
```

## Roles

Initial roles:

```text
OWNER
ADMIN
MANAGER
STAFF
```

## Tasks

- Integrate Clerk.
- Create application user record.
- Create restaurant entity.
- Connect users to restaurants.
- Implement restaurant membership.
- Implement role-based authorization.
- Implement tenant middleware.
- Ensure every tenant-specific query is scoped.
- Create protected dashboard routes.

## Deliverable

A restaurant owner can:

```text
Signup
  ↓
Login
  ↓
Create Restaurant
  ↓
Enter Dashboard
```

## Acceptance Criteria

- Users can sign up.
- Users can log in.
- Users can create a restaurant.
- Users can access only authorized restaurants.
- Cross-tenant data access is blocked.
- Unauthorized API calls return appropriate errors.
- Dashboard routes require authentication.

---

# 6. Phase 2 — Restaurant Onboarding

## Objective

Allow a newly registered restaurant to configure its basic identity.

## Scope

Restaurant profile:

- Restaurant name
- Logo
- Address
- Contact information
- Cuisine
- Description
- Google Maps review destination
- Basic branding

## Onboarding Flow

```text
Account
  ↓
Restaurant Profile
  ↓
Branding
  ↓
First Menu
  ↓
Tables
  ↓
Publish
```

The first implementation should allow owners to skip optional information.

## Deliverable

A new restaurant can complete enough setup to begin creating a digital menu.

## Acceptance Criteria

- Restaurant profile can be created.
- Restaurant profile can be edited.
- Logo can be uploaded.
- Google Maps destination can be configured.
- Onboarding progress can be displayed.
- Owner can continue from where they left off.

---

# 7. Phase 3 — Menu Management

## Objective

Build the core restaurant menu CMS.

This is one of the most important phases of the product.

## Scope

Implement:

- Menus
- Sections
- Menu items
- Item images
- Prices
- Descriptions
- Availability
- Variants
- Add-ons
- Ordering/reordering
- Draft state
- Publishing

## Data Structure

```text
Restaurant
    ↓
Menu
    ↓
Menu Section
    ↓
Menu Item
    ├── Variant
    └── Add-on
```

## Tasks

### Menu

- Create menu.
- Edit menu.
- Delete menu.
- Activate/deactivate menu.

### Sections

- Create section.
- Rename section.
- Delete section.
- Reorder section.
- Hide section.

### Items

- Create item.
- Edit item.
- Delete item.
- Upload image.
- Set price.
- Set availability.
- Add description.
- Add dietary information.

### Variants

Examples:

```text
Small
Medium
Large
```

### Add-ons

Examples:

```text
Extra Cheese
Extra Sauce
Extra Chicken
```

## Draft/Publish

Implement:

```text
Draft
   ↓
Validation
   ↓
Publish
```

Customer-facing users should only receive published content.

## Acceptance Criteria

A restaurant owner can create a complete menu without developer intervention.

The owner can:

```text
Create Section
    ↓
Create Item
    ↓
Add Price
    ↓
Add Image
    ↓
Add Description
    ↓
Publish
```

---

# 8. Phase 4 — Theme System

## Objective

Allow restaurants to customize how their customer-facing menu looks.

## Scope

Implement:

- Theme selection
- Theme configuration
- Colors
- Typography
- Cards
- Buttons
- Backgrounds
- Restaurant branding
- Theme preview
- Theme publishing

## Initial Themes

Start with a small number of high-quality themes rather than dozens of incomplete themes.

Recommended initial themes:

```text
Modern Minimal
Midnight Luxury
Traditional Indian
Festive
```

Later add:

```text
Eid
Ramadan
Diwali
Holi
Christmas
Valentine
Contemporary Café
```

## Architecture

Theme data must remain independent from menu data.

```text
Menu Data
    +
Theme
    +
Restaurant Branding
    ↓
Customer Menu
```

## Acceptance Criteria

- Owner can select a theme.
- Owner can preview a theme.
- Owner can customize supported properties.
- Theme can be saved.
- Theme can be published.
- Customer menu reflects the published theme.
- Changing a theme does not modify menu data.

---

# 9. Phase 5 — Tables & QR System

## Objective

Connect physical restaurant tables with the correct digital menu.

## Scope

Implement:

- Table creation
- Table editing
- Table deletion/deactivation
- Unique QR tokens
- QR generation
- QR preview
- QR download
- Table-specific menu URLs

## QR Flow

```text
Table 01
   ↓
Unique QR Token
   ↓
DynamicMenu URL
   ↓
Restaurant
   ↓
Table
   ↓
Published Menu
```

Example URL:

```text
https://dynamicmenu.app/q/{token}
```

## Requirements

Each QR token must uniquely identify:

```text
Restaurant
+
Table
```

Do not expose unnecessary internal database identifiers.

## Acceptance Criteria

- Owner can create tables.
- Each table gets a unique QR.
- QR can be scanned.
- QR resolves to the correct restaurant.
- QR identifies the correct table.
- Invalid QR codes produce a helpful error.
- QR files can be downloaded.

---

# 10. Phase 6 — Customer Menu

## Objective

Build the public mobile-first customer experience.

## Scope

Implement:

- QR resolution
- Restaurant branding
- Theme rendering
- Menu sections
- Menu items
- Search
- Offers
- Item details
- Add-ons
- Variants
- Availability
- Cart

## Customer Flow

```text
Scan QR
   ↓
Resolve Table
   ↓
Resolve Restaurant
   ↓
Load Published Menu
   ↓
Apply Theme
   ↓
Browse
```

## Requirements

Customer should not need an account to:

- Scan QR
- Browse menu
- View dishes
- View offers

## Acceptance Criteria

A customer can scan a real restaurant QR and see:

```text
Restaurant
    ↓
Table
    ↓
Theme
    ↓
Categories
    ↓
Menu Items
    ↓
Offers
```

The experience must be optimized for mobile.

---

# 11. Phase 7 — Cart & Ordering

## Objective

Allow customers to place orders from their table.

## Scope

Implement:

- Cart
- Quantity management
- Variants
- Add-ons
- Order validation
- Order creation
- Order confirmation
- Order number
- Table association

## Order Flow

```text
Customer
   ↓
Select Item
   ↓
Customize
   ↓
Add to Cart
   ↓
Review
   ↓
Submit
   ↓
Backend Validation
   ↓
Create Order
   ↓
Order Number
```

## Important Rules

The backend must validate:

- Item availability
- Item price
- Variant availability
- Add-on availability
- Offer eligibility
- Restaurant status
- Table validity

Never trust prices submitted by the frontend.

## Acceptance Criteria

A customer can successfully:

```text
Browse
→ Add Item
→ Customize
→ Review
→ Submit Order
→ Receive Order Number
```

---

# 12. Phase 8 — Restaurant Order Management

## Objective

Allow restaurant staff to receive and process customer orders.

## Order States

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

## Dashboard

Provide:

- Live orders
- Table identification
- Order details
- Order status
- Order totals
- Customer information where available
- Order timestamps

## Acceptance Criteria

Restaurant staff can:

```text
Receive Order
    ↓
Confirm
    ↓
Prepare
    ↓
Mark Ready
    ↓
Mark Served
    ↓
Mark Paid
    ↓
Complete
```

Only valid state transitions should be allowed.

---

# 13. Phase 9 — Payment Status & Review Workflow

## Objective

Connect the restaurant's "Paid" action to the customer review experience.

The first version does not need to process payments directly. The restaurant can mark an order as paid from the dashboard.

## Flow

```text
Restaurant
    ↓
Mark Order Paid
    ↓
Backend validates state
    ↓
Order = PAID
    ↓
Review Eligibility
    ↓
Customer Review Prompt
    ↓
Internal Feedback
    ↓
Google Maps Redirect
```

## Scope

Implement:

- Paid status
- Review eligibility
- Review prompt
- Internal feedback
- Google Maps redirect
- Review completion tracking

## Important Constraints

DynamicMenu should not claim that a Google review was successfully posted unless it can actually verify that event.

Do not:

- Require positive reviews
- Reward only positive reviews
- Automatically create reviews
- Misrepresent a redirect as a posted review

## Acceptance Criteria

When a valid order is marked paid:

```text
PAID
 ↓
Customer becomes review-eligible
 ↓
Customer sees review prompt
 ↓
Customer can submit feedback
 ↓
Customer can optionally open Google Maps
```

---

# 14. Phase 10 — Customer Management

## Objective

Create restaurant-scoped customer profiles.

## Scope

Implement:

- Customer creation
- Customer lookup
- Customer history
- Order history
- Visit history
- Total spend
- Last visit

## Customer Identity

Customer information can be associated with voluntarily provided information such as:

```text
Name
Phone
Email
```

Customer data must be restaurant-scoped.

## Architecture

```text
Customer
    ↓
Restaurant Customer Profile
    ↓
Orders
    ↓
Visits
    ↓
Loyalty
```

## Acceptance Criteria

Restaurant owners can view customer information associated with their own restaurant without accessing another restaurant's customer records.

---

# 15. Phase 11 — Analytics

## Objective

Give restaurant owners useful business insights.

## Core Metrics

### Orders

- Total orders
- Orders per day
- Orders per table
- Orders per item
- Average order value

### Menu

- Most viewed items
- Most ordered items
- Category performance
- Offer performance

### Customers

- New customers
- Returning customers
- Repeat order rate
- Customer spend

### QR

- QR scans
- Table activity
- Menu sessions

## Architecture

Start with database-derived analytics.

Later introduce:

```text
Analytics Events
      ↓
Event Processing
      ↓
Analytics Store
      ↓
Dashboard
```

## Acceptance Criteria

Restaurant owners can filter analytics by a time period and understand basic restaurant performance.

---

# 16. Phase 12 — Loyalty Program

## Objective

Add repeat-customer functionality.

## Scope

Implement:

- Customer points
- Rewards
- Reward rules
- Points history
- Redemption
- Customer loyalty dashboard

## Flow

```text
Customer
    ↓
Order
    ↓
Eligible Activity
    ↓
Points
    ↓
Reward
    ↓
Redemption
```

## Acceptance Criteria

A restaurant can define a loyalty rule and customers can accumulate and redeem eligible rewards.

The system must clearly explain the reward conditions.

---

# 17. Phase 13 — Advanced Themes & Offers

## Objective

Make DynamicMenu's customization capabilities a major product differentiator.

## Theme Expansion

Add:

```text
Eid
Ramadan
Diwali
Holi
Christmas
Valentine
New Year
Traditional Indian
Fine Dining
Café
Street Food
```

## Theme Features

Potential capabilities:

- Seasonal decorations
- Animated backgrounds
- Custom banners
- Promotional hero sections
- Custom typography
- Custom section layouts
- Restaurant-specific branding
- Background images

Animations must remain optional and performance-conscious.

## Offer Expansion

Add:

- Scheduled campaigns
- Combo offers
- Category discounts
- Item discounts
- Time-based offers
- Promotional banners
- Seasonal campaigns

---

# 18. Phase 14 — SaaS & Commercial Features

## Objective

Prepare DynamicMenu to operate as a commercial SaaS platform.

## Scope

Potential features:

- Subscription plans
- Billing
- Feature entitlements
- Usage limits
- Trial periods
- Upgrade/downgrade
- Subscription management
- Invoice management

## Suggested Plans

Initial commercial structure can be defined later:

```text
FREE
STARTER
PRO
ENTERPRISE
```

Do not implement plan restrictions until the core product has been validated.

---

# 19. Phase 15 — Multi-Branch Restaurants

## Objective

Allow restaurant organizations to manage multiple physical branches.

## Architecture

```text
Organization
    │
    ├── Branch A
    │    ├── Tables
    │    ├── Menus
    │    └── Orders
    │
    ├── Branch B
    │    ├── Tables
    │    ├── Menus
    │    └── Orders
    │
    └── Branch C
         ├── Tables
         ├── Menus
         └── Orders
```

This should influence the initial database design, but implementation can be deferred until the single-restaurant/single-branch workflow is stable.

---

# 20. Phase 16 — Integrations

Potential future integrations:

```text
Payment Gateways
POS Systems
Kitchen Display Systems
WhatsApp
SMS
Email
Google Business integrations
Inventory Systems
Accounting Systems
CRM
```

Integrations should be isolated behind service modules.

Example:

```text
Order Service
     ↓
Integration Layer
     ├── POS
     ├── WhatsApp
     ├── SMS
     └── Email
```

Do not tightly couple core order logic to a specific external provider.

---

# 21. Phase 17 — Production Hardening

## Objective

Prepare the application for real-world usage at scale.

## Security

Verify:

- Authentication
- Authorization
- Tenant isolation
- Input validation
- Rate limiting
- XSS protection
- CSRF protection where applicable
- Secure secrets
- API abuse protection
- File upload security

## Performance

Optimize:

- Initial customer menu load
- Image delivery
- API latency
- Database queries
- Menu caching
- Dashboard rendering
- Mobile performance

## Reliability

Implement:

- Idempotent webhook processing
- Retry mechanisms
- Error tracking
- Health checks
- Database backups
- Graceful failure
- Monitoring alerts

## Acceptance Criteria

The production system should remain usable during expected traffic spikes and should provide enough observability to diagnose failures.

---

# 22. MVP Definition

The first MVP should not attempt to implement every feature in the PRD.

The MVP should contain:

```text
Authentication
        ↓
Restaurant
        ↓
Menu Management
        ↓
Basic Theme
        ↓
Tables
        ↓
QR Codes
        ↓
Customer Menu
        ↓
Cart
        ↓
Orders
        ↓
Restaurant Order Dashboard
        ↓
Mark Paid
        ↓
Review Prompt
        ↓
Google Maps Redirect
```

This represents the first complete value loop.

---

# 23. MVP User Journey

## Restaurant Owner

```text
Signup
 ↓
Create Restaurant
 ↓
Create Menu
 ↓
Add Categories
 ↓
Add Items
 ↓
Choose Theme
 ↓
Create Tables
 ↓
Generate QR
 ↓
Publish
```

## Customer

```text
Scan QR
 ↓
View Menu
 ↓
Browse Items
 ↓
Customize
 ↓
Add to Cart
 ↓
Place Order
 ↓
Track Order
```

## Restaurant Staff

```text
Receive Order
 ↓
Confirm
 ↓
Prepare
 ↓
Serve
 ↓
Mark Paid
```

## Customer

```text
Receive Review Prompt
 ↓
Provide Feedback
 ↓
Optional Google Maps Review
```

---

# 24. Feature Dependency Graph

```text
                    ┌───────────────┐
                    │   Foundation  │
                    └───────┬───────┘
                            ↓
                 ┌────────────────────┐
                 │ Auth + Multi-Tenant │
                 └─────────┬──────────┘
                           ↓
                  ┌─────────────────┐
                  │ Restaurant Setup│
                  └────────┬────────┘
                           ↓
                  ┌─────────────────┐
                  │ Menu Management │
                  └───────┬─────────┘
                          ↓
                  ┌─────────────────┐
                  │ Theme System    │
                  └───────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Tables + QR      │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Customer Menu    │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Cart + Ordering  │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Order Management │
                 └────────┬─────────┘
                          ↓
                 ┌──────────────────┐
                 │ Paid + Reviews   │
                 └────────┬─────────┘
                          ↓
             ┌────────────┴────────────┐
             ↓                         ↓
       Customer Data               Analytics
             ↓                         ↓
          Loyalty               Advanced Features
```

---

# 25. Parallel Development Opportunities

After Phase 2 is stable, some work can proceed in parallel.

```text
                Authentication
                      │
                Restaurant Setup
                      │
               ┌──────┴──────┐
               ↓             ↓
        Menu Management    Table/QR
               │             │
               ↓             │
          Theme System       │
               │             │
               └──────┬──────┘
                      ↓
                Customer Menu
                      ↓
                Cart + Orders
```

Analytics foundations can also be developed alongside ordering once the core event model is established.

---

# 26. What Should NOT Be Built Early

Avoid premature implementation of:

- Complex AI recommendations
- Advanced POS integrations
- Inventory management
- Multi-branch management
- Complex subscription billing
- Advanced CRM
- Large theme marketplace
- Complex loyalty rules
- Custom domain management
- Native mobile applications

These features can consume significant development effort before the core product is validated.

---

# 27. Testing Strategy

Every phase must include testing.

## Unit Tests

Test:

- Business rules
- Validation
- Order state transitions
- Offer calculations
- Loyalty calculations
- Authorization

## Integration Tests

Test:

```text
Frontend
 ↓
API
 ↓
Database
```

Important flows:

- Signup
- Restaurant creation
- Menu creation
- QR resolution
- Order creation
- Order status changes
- Review eligibility

## End-to-End Tests

Critical customer flow:

```text
Scan QR
 ↓
Menu
 ↓
Add Item
 ↓
Cart
 ↓
Order
 ↓
Restaurant Dashboard
 ↓
Mark Paid
 ↓
Review
```

---

# 28. Phase Completion Rules

A phase is considered complete only when:

1. Core functionality is implemented.
2. Backend validation exists.
3. Tenant isolation is verified.
4. Responsive UI is implemented.
5. Loading states exist.
6. Empty states exist.
7. Error states exist.
8. Critical flows are tested.
9. Monitoring is configured where appropriate.
10. Documentation is updated.

A feature should not be considered complete merely because the UI exists.

---

# 29. Definition of Done

A DynamicMenu feature is considered **Done** when:

```text
Requirements
    ↓
UX/UI
    ↓
Frontend
    ↓
Backend
    ↓
Database
    ↓
Validation
    ↓
Authorization
    ↓
Testing
    ↓
Error Handling
    ↓
Monitoring
    ↓
Documentation
```

All applicable layers must be complete.

---

# 30. Release Strategy

Use incremental releases.

## Release 0 — Foundation

```text
Infrastructure
Authentication
Database
Deployment
Monitoring
```

## Release 1 — Restaurant MVP

```text
Restaurant
Menu
Sections
Items
Basic Theme
Tables
QR
```

## Release 2 — Customer MVP

```text
QR Menu
Food Details
Cart
Orders
```

## Release 3 — Operations

```text
Order Dashboard
Order States
Mark Paid
Review Workflow
```

## Release 4 — Growth

```text
Customers
Analytics
Offers
Loyalty
```

## Release 5 — Scale

```text
Subscriptions
Multi-Branch
Integrations
Advanced Themes
Performance
```

---

# 31. Launch Readiness Checklist

Before public launch:

## Product

- [ ] Restaurant signup works
- [ ] Restaurant onboarding works
- [ ] Menu creation works
- [ ] Menu publishing works
- [ ] Theme system works
- [ ] Table creation works
- [ ] QR generation works
- [ ] Customer menu works
- [ ] Cart works
- [ ] Order creation works
- [ ] Restaurant order management works
- [ ] Paid status works
- [ ] Review flow works

## Security

- [ ] Tenant isolation tested
- [ ] Authorization tested
- [ ] API validation implemented
- [ ] Rate limiting implemented
- [ ] Secrets secured
- [ ] File uploads secured

## Performance

- [ ] Mobile menu optimized
- [ ] Images optimized
- [ ] API latency reviewed
- [ ] Database indexes reviewed
- [ ] Slow queries investigated

## Reliability

- [ ] Sentry configured
- [ ] Health checks configured
- [ ] Error handling implemented
- [ ] Database backups verified
- [ ] Critical workflows tested

## UX

- [ ] Mobile responsive
- [ ] Desktop responsive
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Accessibility review
- [ ] QR scanning tested on real devices

---

# 32. Post-Launch Priorities

After the MVP is launched, prioritize improvements based on actual restaurant and customer behavior.

Potential order:

```text
Real User Feedback
       ↓
Bug Fixes
       ↓
Performance
       ↓
Menu UX
       ↓
Order UX
       ↓
Analytics
       ↓
Offers
       ↓
Loyalty
       ↓
Themes
       ↓
Integrations
       ↓
SaaS Expansion
```

Do not assume that every feature in the original PRD needs to be equally prioritized after launch.

---

# 33. Core Product Loop

DynamicMenu's core product loop is:

```text
Restaurant Signs Up
        ↓
Creates Menu
        ↓
Chooses Theme
        ↓
Creates Tables
        ↓
Generates QR Codes
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
Customer Gives Feedback
        ↓
Customer Can Visit Google Maps
        ↓
Restaurant Gains Repeat Customers
        ↓
Restaurant Improves Menu
        ↓
Customer Returns
```

This loop should remain the primary product focus.

---

# 34. Final Development Principle

> **Do not build DynamicMenu as a collection of isolated features. Build it as one connected restaurant operating loop.**

Every phase should strengthen one of four core areas:

```text
RESTAURANT
    ↓
Create & Manage

MENU
    ↓
Design & Publish

CUSTOMER
    ↓
Discover & Order

BUSINESS
    ↓
Manage & Grow
```

The MVP should prove that these four areas work together reliably before advanced features are introduced.
