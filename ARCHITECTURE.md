# Application Architecture

## 1. Architecture Overview

DynamicMenu is a multi-tenant SaaS application.

Each restaurant is a tenant.

The system contains:

* SaaS application
* Restaurant dashboard
* Tenant data layer
* Public QR menu
* Customer ordering flow
* Payment/order status flow
* Review flow
* Platform administration

## 2. Tenant Model

Restaurant = Tenant.

Each tenant must have isolated:

* Users
* Restaurant profile
* Menu
* Categories
* Menu items
* Offers
* Themes
* Tables
* QR codes
* Orders
* Customers
* Reviews
* Settings

Global platform data must be explicitly identified as global.

**Never rely only on frontend routing for tenant isolation.**

Tenant ownership and access must be enforced server-side.

## 3. Application Areas

### SaaS

Handles:

* Signup
* Login
* Tenant creation
* Account management
* Subscription/billing
* Platform settings

### Restaurant Dashboard

Handles:

* Restaurant settings
* Menu management
* Categories
* Items
* Offers
* Themes
* Tables
* QR codes
* Orders
* Reviews
* Analytics

### Public Menu

Handles:

* QR access
* Restaurant branding
* Menu browsing
* Offers
* Item details
* Table identification
* Ordering

### Customer Flow

```text
QR Scan
  ↓
Public Menu
  ↓
Select Items
  ↓
Cart
  ↓
Order
  ↓
Restaurant Receives Order
  ↓
Restaurant Completes Order
  ↓
Payment/Order Marked Paid
  ↓
Review Prompt
  ↓
Google Maps Review
```

## 4. Database Architecture

```text
Tenant
├── Users
├── Restaurant
├── Categories
├── MenuItems
├── Offers
├── Themes
├── Tables
├── QR Codes
├── Orders
└── Reviews
```

All tenant-owned records must have an explicit relationship to their tenant.

Global records must be explicitly modeled as global.

Never infer ownership from client-provided IDs alone.

## 5. Authentication & Authorization

Authentication identifies the user.

Authorization determines:

* User role
* Tenant membership
* Resource ownership
* Allowed actions

Authentication does **not** replace tenant authorization.

Every protected operation involving tenant-owned resources must verify:

```text
Authenticated User
        ↓
Tenant Membership
        ↓
User Role
        ↓
Resource Ownership
        ↓
Permission
        ↓
Allowed Action
```

Authorization must be enforced server-side.

The frontend may hide unavailable actions for usability, but frontend checks must never be treated as a security boundary.

## 6. User Roles & Permissions

Users belong to a tenant and have an explicit role.

Roles are scoped to a tenant unless the role is explicitly defined as a platform/global role.

### 6.1 Platform Roles

Platform roles operate outside individual restaurant tenants.

#### Platform Admin

Platform Admin can:

* Manage tenants
* View tenant accounts
* Manage platform settings
* Manage subscriptions/billing
* Manage platform-wide configuration
* Manage platform users
* Access platform analytics
* Perform administrative support actions

Platform Admin access must not implicitly bypass audit, authorization, or data-access controls.

### 6.2 Tenant Roles

Each restaurant tenant should support the following roles.

#### Owner

Full administrative access to the tenant.

Permissions:

* Manage restaurant profile
* Manage tenant settings
* Manage users
* Assign and change tenant roles
* Manage menu
* Manage categories
* Manage menu items
* Manage offers
* Manage themes
* Manage tables
* Manage QR codes
* View and manage orders
* Manage payment/order status where permitted
* View and manage reviews
* View analytics
* Manage billing/subscription settings
* Delete or deactivate tenant resources where permitted

#### Manager

Operational and management access without ownership-level controls.

Permissions:

* View restaurant profile
* Update operational restaurant settings
* Manage menu
* Manage categories
* Manage menu items
* Manage offers
* Manage themes
* Manage tables
* Manage QR codes
* View and manage orders
* Update order status
* Manage reviews
* View analytics

Manager cannot:

* Transfer tenant ownership
* Manage tenant ownership
* Delete the tenant
* Change billing ownership unless explicitly granted
* Manage Owner accounts

#### Staff

Day-to-day restaurant operations.

Permissions:

* View menu
* View menu items
* View tables
* View QR/table context
* View orders
* Update allowed order statuses
* View relevant customer/order information required for fulfillment

Staff cannot:

* Manage users
* Change roles
* Manage billing
* Change tenant ownership
* Modify sensitive tenant settings
* Delete core tenant resources
* Modify permissions

#### Viewer

Read-only access.

Permissions:

* View restaurant information
* View menu
* View categories
* View menu items
* View offers
* View themes
* View tables
* View QR codes
* View orders
* View reviews
* View analytics

Viewer cannot modify tenant data or perform operational actions.

### 6.3 Permission Model

Permissions should be explicit rather than relying only on role-name checks throughout the application.

Example permission naming:

```text
restaurant.read
restaurant.update

users.read
users.invite
users.update
users.remove
users.assign_role

menu.read
menu.create
menu.update
menu.delete

categories.read
categories.create
categories.update
categories.delete

menu_items.read
menu_items.create
menu_items.update
menu_items.delete

offers.read
offers.create
offers.update
offers.delete

themes.read
themes.create
themes.update
themes.delete

tables.read
tables.create
tables.update
tables.delete

qr_codes.read
qr_codes.create
qr_codes.update
qr_codes.delete

orders.read
orders.create
orders.update
orders.update_status
orders.cancel

reviews.read
reviews.manage

analytics.read

billing.read
billing.manage

tenant.settings.read
tenant.settings.update
```

The exact permission list may evolve with the application.

New permissions should be added when a new protected capability requires a distinct authorization boundary.

### 6.4 Role-to-Permission Rules

Roles should map to permissions centrally.

Avoid scattering authorization rules such as:

```text
if user.role === "owner"
```

throughout the codebase.

Prefer a centralized permission model:

```text
User
  ↓
Tenant Membership
  ↓
Role
  ↓
Permissions
  ↓
Authorization Check
```

Authorization checks should answer questions such as:

```text
Can this user perform "menu_items.update"
on this resource
within this tenant?
```

### 6.5 Tenant-Scoped Authorization

A user's role in one tenant must not automatically grant permissions in another tenant.

For every tenant-owned request:

```text
User
  ↓
Authenticated?
  ↓
Member of Requested Tenant?
  ↓
Role Active?
  ↓
Has Required Permission?
  ↓
Owns/Can Access Resource?
  ↓
Allow
```

A user must never gain access to another tenant's resources by changing:

* Tenant ID
* Restaurant ID
* Resource ID
* URL parameters
* Request body
* Query parameters
* QR parameters

### 6.6 Permission Enforcement

Permissions must be enforced on the server for:

* API endpoints
* Server actions
* Database mutations
* Sensitive reads
* Administrative operations
* Background jobs that act on tenant resources

Frontend permission checks are for user experience only.

They must not replace server-side authorization.

### 6.7 Role Changes

Role changes are security-sensitive operations.

Only users with the appropriate permission may:

* Invite users
* Remove users
* Change user roles
* Grant elevated permissions

A user must not be able to elevate their own role.

The system should prevent accidental removal or demotion of the final tenant Owner unless an explicit ownership-transfer flow exists.

## 7. API Flow

Protected requests should follow:

```text
Request
  ↓
Authentication
  ↓
Tenant Resolution
  ↓
Tenant Membership
  ↓
Role Resolution
  ↓
Permission Check
  ↓
Resource Ownership Check
  ↓
Validation
  ↓
Business Logic
  ↓
Database
  ↓
Response
```

Never skip authorization for tenant-owned resources.

Client-provided tenant IDs, resource IDs, roles, prices, permissions, or status values must not be trusted without server-side validation.

## 8. Frontend Architecture

Separate:

* Pages/routes
* Layouts
* UI components
* Feature components
* Data/API access
* State
* Validation
* Utilities

Reuse existing components and patterns.

Prefer feature-based organization when project size requires it.

Avoid unnecessary abstraction.

Avoid duplicating existing functionality.

The frontend may use permissions to:

* Hide unavailable actions
* Disable controls
* Prevent unnecessary requests
* Display appropriate navigation

However, these checks are not security controls.

## 9. QR Architecture

A QR code identifies:

* Restaurant
* Optional table/context

QR parameters provide context only.

They are **not authorization**.

The server determines what the customer can access.

QR data must not grant access to protected restaurant resources.

## 10. Ordering Architecture

Orders must retain:

* Tenant
* Table/context
* Items
* Quantities
* Price snapshot
* Order status
* Payment status
* Timestamps

Historical order prices must not change when menu prices change.

Order records must preserve the relevant item and pricing information at the time the order was created.

Order status and payment status should be treated as separate concepts.

## 11. Review Architecture

Review eligibility must be tied to a valid completed/paid order.

The system must prevent arbitrary review prompts.

Review eligibility must be validated server-side.

Google Maps redirection uses the restaurant's configured review destination.

A customer must not be able to fabricate an order or completion state to unlock a review flow.

## 12. File Structure

Follow the actual repository structure.

Do not create theoretical folders without a real requirement.

Before introducing a new architectural pattern or directory:

1. Check the existing repository.
2. Reuse an existing pattern when appropriate.
3. Introduce new structure only when it provides a clear benefit.

Update this document when architecture materially changes.

## 13. Architecture Principles

1. **Tenant isolation first**
2. **Server-side authorization**
3. **Explicit ownership**
4. **Explicit roles and permissions**
5. **Least-privilege access**
6. **Secure defaults**
7. **Strong validation**
8. **Simple abstractions**
9. **Reusable components**
10. **Minimal dependencies**
11. **Observable failures**
12. **Maintainable code**
