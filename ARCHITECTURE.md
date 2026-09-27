# DynamicMenu — System Architecture

## 1. Architecture Overview

DynamicMenu is a **multi-tenant SaaS platform** that allows restaurants to create, manage, customize, and publish QR-based digital menus.

The system consists of two primary experiences:

1. **Restaurant Platform**

   * Authentication
   * Restaurant onboarding
   * Menu management
   * Category and item management
   * Offers
   * Themes
   * QR/table management
   * Order management
   * Customer/royalty management
   * Analytics
   * Review workflow

2. **Customer Platform**

   * QR scanning
   * Restaurant identification
   * Table identification
   * Dynamic menu rendering
   * Menu browsing
   * Offers
   * Cart
   * Order placement
   * Order status
   * Post-payment review prompt
   * Google Maps review redirection

The architecture should be designed around **tenant isolation, modularity, API-first communication, and horizontal scalability**.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Customer       │
                         │   Mobile Browser    │
                         └──────────┬──────────┘
                                    │
                              Scan Table QR
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   DynamicMenu Web   │
                         │      Frontend       │
                         │      Vercel         │
                         └──────────┬──────────┘
                                    │
                              HTTPS / API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    API / Backend    │
                         │       Render        │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
      │   Clerk      │      │    Neon      │      │   Sentry     │
      │     Auth     │      │ PostgreSQL   │      │ Monitoring   │
      └──────────────┘      └──────────────┘      └──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ External Services   │
                         │                     │
                         │ Google Maps         │
                         │ Image Storage       │
                         │ Email/SMS/Webhooks  │
                         └─────────────────────┘
```

---

# 3. Architectural Principles

DynamicMenu should follow these principles.

## 3.1 Multi-Tenant by Default

Every restaurant is treated as an independent tenant.

All tenant-owned resources must be associated with a `tenantId` or equivalent restaurant identifier.

Example:

```text
Restaurant A
 ├── Users
 ├── Tables
 ├── Menu
 ├── Categories
 ├── Items
 ├── Offers
 ├── Orders
 ├── Customers
 └── Analytics

Restaurant B
 ├── Users
 ├── Tables
 ├── Menu
 ├── Categories
 ├── Items
 ├── Offers
 ├── Orders
 ├── Customers
 └── Analytics
```

Data belonging to Restaurant A must never be accessible through Restaurant B.

---

## 3.2 API-First Architecture

The frontend should not directly manipulate the database.

```text
Frontend
   ↓
API
   ↓
Service Layer
   ↓
Database
```

Business rules should live in the backend/service layer rather than inside UI components.

---

## 3.3 Modular Architecture

Each major business domain should have its own module.

Recommended backend modules:

```text
auth
restaurants
users
tables
menus
categories
menu-items
offers
themes
qr
orders
customers
royalty
reviews
analytics
notifications
uploads
```

Modules should remain loosely coupled wherever possible.

---

## 3.4 Secure by Default

Security must be enforced at multiple levels:

```text
Authentication
      ↓
Authorization
      ↓
Tenant Validation
      ↓
Resource Validation
      ↓
Business Logic
      ↓
Database
```

Never rely only on frontend checks.

---

# 4. Technology Stack

## 4.1 Frontend

```text
Framework: React / TypeScript
Build Tool: Vite
UI: Tailwind CSS
Components: Radix UI
State: Zustand / React Query
Hosting: Vercel
```

The frontend should be responsive and optimized for both:

* Restaurant dashboard
* Customer mobile menu

---

## 4.2 Backend

```text
Runtime: Node.js
Language: TypeScript
API: REST API
Hosting: Render
ORM: Prisma
```

The backend is responsible for:

* Authentication verification
* Authorization
* Tenant isolation
* Menu operations
* Order processing
* Customer management
* Analytics
* Review workflow
* External service integrations

---

## 4.3 Database

```text
Database: PostgreSQL
Provider: Neon
ORM: Prisma
```

PostgreSQL is the primary source of truth for application data.

---

## 4.4 Authentication

```text
Authentication Provider: Clerk
```

Clerk handles:

* Signup
* Login
* Sessions
* Password/authentication mechanisms
* User identity
* Organization/tenant identity where applicable

The backend must verify Clerk authentication tokens before processing protected requests.

---

## 4.5 Monitoring

```text
Monitoring: Sentry
```

Sentry should monitor:

* Backend exceptions
* Frontend exceptions
* API failures
* Performance issues
* Critical workflows
* Unexpected application states

Sensitive information must not be included in error logs.

---

# 5. Multi-Tenant Architecture

Multi-tenancy is a core architectural requirement.

## 5.1 Tenant Model

The primary tenant is the restaurant.

```text
Tenant
 └── Restaurant
```

A restaurant may have multiple users.

```text
Restaurant
 ├── Owner
 ├── Manager
 ├── Staff
 └── Other authorized users
```

---

## 5.2 Tenant Resolution

For authenticated dashboard requests:

```text
Clerk User
    ↓
User Identity
    ↓
Restaurant Membership
    ↓
tenantId
    ↓
Database Query
```

For customer QR requests:

```text
QR Code
   ↓
QR Token
   ↓
Table
   ↓
Restaurant
   ↓
tenantId
   ↓
Published Menu
```

---

## 5.3 Tenant Isolation

Every tenant-specific query must include tenant context.

Example:

```text
GET /api/restaurants/{restaurantId}/menu
```

The backend must verify:

```text
authenticatedUser
        ↓
belongsToRestaurant
        ↓
restaurantId is valid
```

For customer requests, the QR/table token determines the restaurant context.

---

# 6. Application Architecture

The backend should follow a layered architecture.

```text
┌──────────────────────────────┐
│          API Layer           │
│ Routes / Controllers / DTOs  │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│      Authentication Layer    │
│ Clerk Verification           │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│     Authorization Layer      │
│ Roles / Tenant Validation    │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│       Service Layer          │
│ Business Logic               │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│     Repository / ORM Layer   │
│ Prisma                       │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│       PostgreSQL / Neon      │
└──────────────────────────────┘
```

---

# 7. Frontend Architecture

The frontend should be divided into two major applications/views.

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── restaurant/
│   ├── menu/
│   ├── offers/
│   ├── themes/
│   ├── tables/
│   ├── qr/
│   ├── orders/
│   ├── customers/
│   ├── analytics/
│   └── reviews/
├── hooks/
├── lib/
├── services/
├── stores/
├── types/
└── utils/
```

---

# 8. Customer Application Architecture

The customer experience should be optimized for mobile-first usage.

Typical flow:

```text
Scan QR
   ↓
Resolve QR
   ↓
Identify Restaurant
   ↓
Identify Table
   ↓
Load Published Menu
   ↓
Apply Active Theme
   ↓
Display Menu
   ↓
Browse Items
   ↓
Add to Cart
   ↓
Place Order
   ↓
Track Order
   ↓
Restaurant Marks Paid
   ↓
Review Prompt
   ↓
Google Maps
```

The customer should not need to create an account merely to browse the menu.

---

# 9. QR Code Architecture

Each restaurant table should have a unique QR identity.

Example:

```text
Restaurant
   │
   ├── Table 01
   │     └── QR Token
   │
   ├── Table 02
   │     └── QR Token
   │
   └── Table 03
         └── QR Token
```

A QR code should contain a URL similar to:

```text
https://dynamicmenu.app/q/{token}
```

The token should resolve to:

```text
QR Token
   ↓
Table
   ↓
Restaurant
   ↓
Published Menu
```

Do not expose internal database IDs unnecessarily.

---

# 10. Menu Architecture

The menu should be hierarchical.

```text
Restaurant
   ↓
Menu
   ↓
Sections / Categories
   ↓
Menu Items
   ↓
Add-ons / Variants
```

Example:

```text
Menu
│
├── Must Try
│   ├── Butter Chicken
│   └── Biryani
│
├── Starters
│   ├── Chicken Tikka
│   └── Paneer Tikka
│
├── Main Course
│   ├── Butter Chicken
│   └── Dal Makhani
│
└── Desserts
    ├── Gulab Jamun
    └── Ice Cream
```

Restaurant owners should be able to:

* Create sections
* Rename sections
* Reorder sections
* Create items
* Edit items
* Add images
* Set prices
* Add descriptions
* Enable/disable items
* Configure add-ons
* Configure variants
* Publish/unpublish content

---

# 11. Menu Publishing Architecture

Menu editing and customer-facing menu rendering should be separated conceptually.

```text
Draft Menu
    ↓
Validation
    ↓
Publish
    ↓
Published Menu
    ↓
Customer
```

Customers should primarily receive published data.

This prevents partially edited menus from being exposed to customers.

A restaurant should be able to modify its draft without immediately affecting the live menu unless changes are published.

---

# 12. Theme Architecture

Themes should be treated as configurable presentation layers rather than separate menu systems.

```text
Menu Data
    +
Theme Configuration
    +
Restaurant Branding
    ↓
Customer Menu UI
```

Example:

```text
Theme
├── Colors
├── Typography
├── Background
├── Card Style
├── Button Style
├── Header Style
├── Section Style
├── Decorations
└── Seasonal Elements
```

The menu content should remain independent from the theme.

This allows the same menu to use:

```text
Normal Theme
    ↓
Diwali Theme
    ↓
Eid Theme
    ↓
Christmas Theme
    ↓
Valentine Theme
```

without duplicating menu data.

---

# 13. Offer Architecture

Offers should be independent entities connected to menu items, categories, or the restaurant.

Example:

```text
Restaurant
   │
   └── Offer
        ├── Title
        ├── Description
        ├── Discount
        ├── Start Date
        ├── End Date
        ├── Conditions
        └── Status
```

Offer lifecycle:

```text
Draft
 ↓
Scheduled
 ↓
Active
 ↓
Expired
```

The customer application should only display offers that are currently active.

---

# 14. Restaurant Dashboard Architecture

The dashboard should provide centralized restaurant management.

```text
Dashboard
│
├── Overview
├── Menu
│   ├── Sections
│   ├── Items
│   ├── Add-ons
│   └── Publishing
│
├── Design
│   ├── Themes
│   ├── Branding
│   └── Customization
│
├── Offers
│
├── Tables
│   ├── Create
│   ├── Edit
│   ├── QR Codes
│   └── Download/Print
│
├── Orders
│
├── Customers
│
├── Royalty
│
├── Reviews
│
└── Analytics
```

---

# 15. Order Architecture

The order system should maintain a clear state machine.

Recommended states:

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

Additional failure states may include:

```text
CANCELLED
REJECTED
```

The exact state transitions must be controlled by backend business rules.

Example:

```text
Customer
   ↓
Create Order
   ↓
PENDING
   ↓
Restaurant confirms
   ↓
CONFIRMED
   ↓
Kitchen prepares
   ↓
READY
   ↓
Food served
   ↓
SERVED
   ↓
Payment completed
   ↓
PAID
   ↓
Review workflow
```

---

# 16. Table Architecture

Tables belong to restaurants.

```text
Restaurant
│
├── Table 1
├── Table 2
├── Table 3
├── Table 4
└── Table 5
```

Each table should have:

```text
tableId
restaurantId
name/number
qrToken
status
createdAt
updatedAt
```

The table QR establishes the customer's restaurant/table context.

---

# 17. Customer Architecture

Customers should be tracked without requiring mandatory account creation.

Customer identity can be associated with information voluntarily provided during ordering.

Potential customer information:

```text
Customer
├── Name
├── Phone
├── Email
├── Restaurant
├── Order History
├── Total Orders
├── Total Spend
└── Royalty Information
```

Customer data must always be scoped to the restaurant.

A customer associated with Restaurant A must not automatically become visible to Restaurant B.

---

# 18. Royalty Program Architecture

The royalty system should associate customer activity with a restaurant.

```text
Customer Phone
      ↓
Restaurant
      ↓
Customer Profile
      ↓
Order History
      ↓
Royalty Points / Rewards
```

Recommended architecture:

```text
Customer
   │
   └── RestaurantCustomer
          │
          ├── Total Orders
          ├── Total Spend
          ├── Points
          ├── Rewards
          └── Last Visit
```

This prevents global customer data from being unnecessarily exposed across restaurants.

---

# 19. Review Architecture

The review workflow begins after the restaurant marks an order as paid.

```text
Order
 ↓
PAID
 ↓
Review Eligibility
 ↓
Customer Review Prompt
 ↓
Customer submits internal feedback
 ↓
Google Maps redirect
```

The review system should distinguish between:

```text
Internal Feedback
```

and

```text
External Google Review
```

DynamicMenu should not claim that a Google review was successfully posted unless that can actually be verified through an authorized integration.

The initial implementation can simply redirect the customer to the restaurant's Google Maps review destination.

---

# 20. Webhook / Event Architecture

Important application events should be represented as backend events.

Example:

```text
ORDER_PAID
    ↓
Review Workflow
    ↓
Notification
```

Other possible events:

```text
ORDER_CREATED
ORDER_CONFIRMED
ORDER_READY
ORDER_SERVED
ORDER_PAID
MENU_PUBLISHED
OFFER_ACTIVATED
CUSTOMER_CREATED
```

A future event-driven architecture can process these events asynchronously.

---

# 21. Analytics Architecture

Analytics should be derived from application events and database records.

Possible metrics:

### Orders

```text
Total Orders
Orders Per Day
Orders Per Table
Orders Per Item
Average Order Value
```

### Menu

```text
Most Viewed Items
Most Ordered Items
Category Performance
Offer Performance
```

### Customers

```text
New Customers
Returning Customers
Repeat Order Rate
Customer Spend
```

### Restaurant

```text
Revenue
Orders
Average Order Value
Customer Retention
Popular Items
```

Analytics queries should be optimized separately from transactional queries as the platform scales.

---

# 22. API Architecture

Recommended API structure:

```text
/api/v1/
```

Example:

```text
/api/v1/auth
/api/v1/restaurants
/api/v1/restaurants/:restaurantId
/api/v1/menus
/api/v1/categories
/api/v1/menu-items
/api/v1/offers
/api/v1/tables
/api/v1/qr
/api/v1/orders
/api/v1/customers
/api/v1/royalty
/api/v1/reviews
/api/v1/analytics
```

Customer-specific routes:

```text
/api/v1/public/qr/:token
/api/v1/public/menu/:restaurantSlug
/api/v1/public/orders
```

Protected routes must require authentication and authorization.

Public routes must expose only data explicitly intended for public consumption.

---

# 23. Database Architecture

A conceptual database structure:

```text
User
 │
 └── RestaurantMembership
          │
          ▼
      Restaurant
          │
          ├── Menu
          │    ├── MenuSection
          │    │    └── MenuItem
          │    │          ├── AddOn
          │    │          └── Variant
          │    │
          │    └── Theme
          │
          ├── Table
          │     └── QR
          │
          ├── Offer
          │
          ├── Order
          │     └── OrderItem
          │
          ├── Customer
          │
          ├── RoyaltyAccount
          │
          └── Review
```

---

# 24. Core Database Entities

The initial schema should include at least:

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

Exact fields should be defined during database/schema design.

---

# 25. Database Rules

Every tenant-owned table should have a tenant relationship directly or indirectly available.

Prefer explicit tenant identifiers where appropriate for important queries.

Example:

```text
Menu
├── id
├── restaurantId
├── name
├── status
└── createdAt
```

This makes tenant-scoped queries straightforward and reduces accidental cross-tenant access.

Recommended indexes include:

```text
restaurantId
restaurantId + status
restaurantId + createdAt
restaurantId + updatedAt
qrToken
order status
customer phone + restaurantId
```

---

# 26. Authentication and Authorization

Authentication is handled by Clerk.

Authorization remains an application responsibility.

Recommended roles:

```text
OWNER
ADMIN
MANAGER
STAFF
```

Example permissions:

| Capability          | Owner | Admin | Manager |   Staff |
| ------------------- | ----: | ----: | ------: | ------: |
| Restaurant settings |     ✓ |     ✓ |       — |       — |
| Menu management     |     ✓ |     ✓ |       ✓ |       — |
| Theme management    |     ✓ |     ✓ |       ✓ |       — |
| Offers              |     ✓ |     ✓ |       ✓ |       — |
| Orders              |     ✓ |     ✓ |       ✓ |       ✓ |
| Customers           |     ✓ |     ✓ |       ✓ | Limited |
| Analytics           |     ✓ |     ✓ |       ✓ | Limited |
| User management     |     ✓ |     ✓ |       — |       — |

Permissions should be enforced on the backend.

---

# 27. Security Architecture

Security requirements include:

## Authentication

All dashboard APIs require valid authentication.

## Authorization

Users can only access resources they are authorized to access.

## Tenant Isolation

Every tenant-specific request must validate restaurant ownership/membership.

## Input Validation

All API inputs must be validated before business logic execution.

## Rate Limiting

Public endpoints should be protected against abuse.

Particularly:

```text
QR resolution
Order creation
Review submission
Authentication-related endpoints
```

## SQL Injection

Use Prisma parameterized queries and avoid unsafe raw SQL wherever possible.

## XSS

Sanitize user-controlled content before rendering where HTML content is supported.

## CSRF

Use appropriate protections depending on the authentication/session architecture.

## Secrets

API keys and credentials must never be stored in frontend code or committed to Git.

Use environment variables/secrets management.

---

# 28. Image Architecture

Restaurants will upload menu images and potentially theme assets.

Images should not be stored directly in PostgreSQL.

Recommended architecture:

```text
Restaurant Dashboard
       ↓
Upload API
       ↓
Object Storage
       ↓
Image URL
       ↓
PostgreSQL
```

The database stores metadata and URLs rather than large binary image files.

Potential future storage providers:

```text
Cloudinary
AWS S3
Cloudflare R2
UploadThing
```

The storage provider can be selected during implementation.

---

# 29. Caching Architecture

Customer menus are highly read-heavy.

Potential caching layer:

```text
Customer
   ↓
Cache
   ↓
Published Menu
```

Candidate caching technology:

```text
Redis
```

Caching should be introduced when database load justifies it.

Cache invalidation should occur when:

```text
Menu Published
Menu Updated
Theme Updated
Offer Activated/Expired
Item Availability Changed
```

---

# 30. Performance Architecture

Performance priorities:

### Customer

The QR menu should load extremely quickly because the customer is standing at a restaurant table.

Priorities:

```text
Fast initial page load
Optimized images
Minimal JavaScript
Lazy loading
CDN delivery
Caching
Mobile-first rendering
```

### Dashboard

Dashboard performance should prioritize:

```text
Fast navigation
Optimistic UI where appropriate
Pagination
Debounced search
Efficient API queries
```

---

# 31. Scalability

The architecture should support horizontal scaling.

Initial architecture:

```text
Vercel
   ↓
Single Backend Service
   ↓
Neon PostgreSQL
```

Future architecture:

```text
                    ┌── Backend Instance 1
                    │
Vercel → Load Balancer├── Backend Instance 2
                    │
                    └── Backend Instance 3
                           │
                           ▼
                        Redis
                           │
                           ▼
                    PostgreSQL / Neon
```

Stateless backend services should be preferred so additional instances can be added without requiring session state on individual servers.

---

# 32. Reliability Architecture

Critical operations should be designed to be idempotent where possible.

For example:

```text
Order creation
Payment status update
Webhook processing
Review workflow
```

Webhook handlers should safely handle duplicate events.

Example:

```text
Webhook
   ↓
Check event ID
   ↓
Already processed?
   ├── Yes → Ignore
   └── No
         ↓
      Process
         ↓
      Record Event
```

---

# 33. Error Handling

API errors should use consistent responses.

Example:

```json
{
  "success": false,
  "error": {
    "code": "MENU_NOT_FOUND",
    "message": "The requested menu could not be found."
  }
}
```

Do not expose:

```text
Database errors
Stack traces
Secrets
Internal implementation details
```

to customers.

Internal details should be captured by Sentry.

---

# 34. Observability

The system should track three major observability areas:

```text
Logs
Metrics
Errors
```

### Errors

Sentry:

```text
Frontend errors
Backend errors
API failures
Unhandled exceptions
```

### Application Metrics

Track:

```text
Request latency
Error rate
Order creation rate
Menu load performance
QR resolution success
```

### Business Events

Track:

```text
Restaurant signup
Menu created
Menu published
QR scanned
Order created
Order completed
Customer returned
Review prompt shown
```

---

# 35. Deployment Architecture

## Production

```text
                    Internet
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
         Vercel CDN           Render API
             │                   │
             │                   ├── Clerk
             │                   │
             │                   ├── Neon
             │                   │
             │                   └── Sentry
             │
             ▼
        Customer / Dashboard
```

---

# 36. Environment Architecture

Maintain separate environments:

```text
Development
Staging
Production
```

Environment-specific configuration:

```text
DATABASE_URL
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
SENTRY_DSN
IMAGE_STORAGE_KEY
GOOGLE_MAPS_CONFIGURATION
API_BASE_URL
```

Production secrets must never be committed to Git.

---

# 37. CI/CD Architecture

Recommended workflow:

```text
Developer
   ↓
Git Push
   ↓
GitHub
   ↓
CI
   ├── Type Check
   ├── Lint
   ├── Unit Tests
   ├── Integration Tests
   └── Build
   ↓
Deployment
   ├── Vercel
   └── Render
```

Pull requests should pass automated checks before merging into protected branches.

---

# 38. Recommended Repository Structure

A monorepo can be used for the initial implementation.

```text
dynamicmenu/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   └── ...
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   ├── middleware/
│       │   ├── services/
│       │   ├── utils/
│       │   └── config/
│       └── ...
│
├── packages/
│   ├── types/
│   ├── validation/
│   ├── ui/
│   └── config/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│
├── docs/
│
├── DESIGN.md
├── PRD.md
├── ARCHITECTURE.md
├── RULES.md
├── PHASES.md
└── MEMORY.md
```

---

# 39. Data Flow: Customer Menu

```text
Customer scans QR
        ↓
GET /q/{token}
        ↓
Resolve QR token
        ↓
Find Table
        ↓
Find Restaurant
        ↓
Validate restaurant status
        ↓
Fetch published menu
        ↓
Fetch active offers
        ↓
Fetch active theme
        ↓
Render customer menu
```

---

# 40. Data Flow: Order

```text
Customer
   ↓
Select Item
   ↓
Add to Cart
   ↓
Validate Cart
   ↓
Validate Prices
   ↓
Validate Availability
   ↓
Create Order
   ↓
Create Order Items
   ↓
Assign Restaurant + Table
   ↓
Order Status = PENDING
   ↓
Restaurant Dashboard
```

The backend must never blindly trust prices or item information received from the client.

Prices and availability must be resolved from server-side data.

---

# 41. Data Flow: Paid Order → Review

```text
Restaurant
    ↓
Marks Order as PAID
    ↓
Backend validates transition
    ↓
Order becomes PAID
    ↓
Review eligibility created
    ↓
Customer receives review prompt
    ↓
Customer provides feedback
    ↓
Customer chooses Google Review
    ↓
Redirect to Google Maps
```

---

# 42. Data Flow: Menu Publishing

```text
Restaurant Owner
       ↓
Edit Menu
       ↓
Draft Changes
       ↓
Validation
       ↓
Publish
       ↓
Published Version
       ↓
Cache Invalidation
       ↓
Customer Menu
```

---

# 43. Future Architecture

The initial architecture should avoid unnecessary complexity while allowing future expansion.

Potential future modules:

```text
Kitchen Display System
POS Integration
Payment Gateway
WhatsApp Notifications
SMS Notifications
Email Marketing
Customer Loyalty
Advanced CRM
AI Menu Recommendations
AI Menu Generation
Inventory Management
Staff Management
Multi-Branch Restaurants
Franchise Management
Subscription Billing
Restaurant Marketplace
```

---

# 44. Multi-Branch Architecture

Future restaurants may operate multiple branches.

The architecture should eventually support:

```text
Organization
   │
   ├── Branch 1
   │    ├── Tables
   │    ├── Menu
   │    ├── Orders
   │    └── Customers
   │
   ├── Branch 2
   │    ├── Tables
   │    ├── Menu
   │    ├── Orders
   │    └── Customers
   │
   └── Branch 3
```

This should be considered when designing the initial database relationships.

---

# 45. Subscription Architecture

DynamicMenu is intended to operate as a SaaS platform.

A future subscription system can follow:

```text
Restaurant
    ↓
Subscription
    ↓
Plan
    ↓
Feature Entitlements
```

Example:

```text
FREE
STARTER
PRO
ENTERPRISE
```

Feature access should eventually be controlled through entitlements rather than hard-coded plan checks.

---

# 46. Architectural Constraints

The following constraints must be maintained:

1. Customer menu must work without mandatory customer signup.
2. Restaurant data must remain tenant-isolated.
3. Frontend must never directly access the database.
4. Backend must validate all important business operations.
5. Published menu data must be distinguishable from draft data.
6. QR codes must resolve to the correct restaurant and table.
7. Orders must maintain controlled state transitions.
8. Customer prices must always be validated server-side.
9. Sensitive credentials must remain server-side.
10. Large images should not be stored directly in PostgreSQL.
11. External integrations must be isolated behind service modules.
12. Critical events should be idempotent.
13. The system should remain horizontally scalable.
14. Monitoring must be implemented from the beginning.
15. Architecture should support future multi-branch restaurants.

---

# 47. Architecture Decision Summary

| Area                    | Decision                               |
| ----------------------- | -------------------------------------- |
| Product Type            | Multi-tenant SaaS                      |
| Frontend                | React + TypeScript                     |
| Frontend Hosting        | Vercel                                 |
| Backend                 | Node.js + TypeScript                   |
| Backend Hosting         | Render                                 |
| Database                | PostgreSQL                             |
| Database Provider       | Neon                                   |
| ORM                     | Prisma                                 |
| Authentication          | Clerk                                  |
| Monitoring              | Sentry                                 |
| API Style               | REST                                   |
| Tenant Model            | Restaurant-based                       |
| Customer Authentication | Optional                               |
| QR Identity             | Unique table QR token                  |
| Menu Model              | Menu → Sections → Items                |
| Menu Publishing         | Draft → Published                      |
| Orders                  | State-machine based                    |
| Themes                  | Data-independent presentation layer    |
| Images                  | External object storage                |
| Caching                 | Redis when required                    |
| CI/CD                   | GitHub → CI → Vercel/Render            |
| Scalability             | Stateless backend + horizontal scaling |
| Architecture Style      | Modular layered architecture           |

---

# 48. Architecture Priority

Implementation should prioritize the following order:

```text
1. Authentication
       ↓
2. Multi-Tenant Restaurant System
       ↓
3. Menu Management
       ↓
4. Theme System
       ↓
5. Table + QR System
       ↓
6. Customer Menu
       ↓
7. Cart + Orders
       ↓
8. Order Management
       ↓
9. Customer Management
       ↓
10. Review Workflow
       ↓
11. Analytics
       ↓
12. Royalty Program
       ↓
13. Advanced Integrations
```

The architecture should remain simple during the initial MVP while preserving clean boundaries for future expansion.

---

# 49. Definition of Architectural Success

The architecture is considered successful when:

* Multiple restaurants can operate independently on the same platform.
* One restaurant cannot access another restaurant's private data.
* Restaurant owners can independently manage their menus.
* Customers can scan a table QR and immediately access the correct menu.
* Menu themes can change without duplicating menu content.
* Customers can place table-specific orders.
* Restaurants can manage order lifecycle from the dashboard.
* Paid orders can trigger the review workflow.
* Customer and restaurant data can scale without major architectural redesign.
* Failures can be detected through monitoring.
* New modules can be added without rewriting the existing system.

**Core architectural principle:**

> **DynamicMenu should treat restaurant data, customer experience, menu content, presentation themes, orders, and integrations as separate but connected domains inside a secure multi-tenant SaaS architecture.**
