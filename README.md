# 🍽️ DynamicMenu

### The modern QR menu platform for restaurants.

DynamicMenu helps restaurants replace traditional printed menus with **dynamic, interactive, QR-powered digital menus**.

Restaurants can manage menus, categories, offers, themes, tables, QR codes, orders, and customer interactions from one centralized dashboard.

> **One restaurant. One dashboard. One dynamic menu.**

---

## ✨ Why DynamicMenu?

Traditional restaurant menus are static.

Changing a price, adding an offer, creating a festive menu, or updating an unavailable item often means printing new menus.

DynamicMenu turns the menu into a **living digital experience**.

With one QR code, restaurants can continuously update their menu without replacing printed materials.

### Instead of:

```text
Printed Menu
     ↓
Price changes
     ↓
Reprint
     ↓
Replace
```

### DynamicMenu:

```text
QR Code
   ↓
Digital Menu
   ↓
Update Anytime
   ↓
Customers See Changes Instantly
```

---

## 🚀 Core Features

### 🏪 Restaurant Dashboard

A centralized workspace for restaurant owners to manage their digital presence.

* Restaurant profile
* Menu management
* Categories
* Menu items
* Pricing
* Availability
* Offers
* Themes
* Tables
* QR codes
* Orders
* Reviews
* Analytics
* Settings

---

### 📱 QR-Powered Menus

Every restaurant can create QR codes that open its digital menu.

QR codes can be associated with specific restaurant tables.

```text
Table 1 → QR → Menu
Table 2 → QR → Menu
Table 3 → QR → Menu
```

Customers simply scan and start browsing.

---

### 🎨 Dynamic Themes

Restaurants can customize their digital menu experience.

Create menus for:

* Everyday dining
* Festivals
* Seasonal campaigns
* Special events
* Promotions
* Limited-time offers

The menu can evolve without replacing the physical QR code.

---

### 🏷️ Offers & Promotions

Restaurants can create and manage dynamic offers.

Examples:

```text
Weekend Special
Festival Offer
Lunch Deal
Buy 1 Get 1
Limited-Time Discount
Chef's Special
```

---

### 🍔 Interactive Menu

Customers can browse:

* Categories
* Food items
* Descriptions
* Prices
* Images
* Offers
* Availability

The experience is designed primarily for mobile devices.

---

### 🛒 Customer Ordering

Customers can order directly from the digital menu.

```text
Scan QR
   ↓
Browse Menu
   ↓
Select Food
   ↓
Customize
   ↓
Cart
   ↓
Place Order
   ↓
Restaurant Receives Order
```

---

### 🪑 Table-Aware Ordering

QR codes can identify the customer's table.

```text
Restaurant
│
├── Table 1
│   └── QR Code
│
├── Table 2
│   └── QR Code
│
└── Table 3
    └── QR Code
```

This allows orders to be associated with the appropriate table.

---

### ⭐ Customer Reviews

After an eligible completed and paid order, customers can receive a review prompt.

The flow can guide customers toward the restaurant's Google Maps review destination.

```text
Order
 ↓
Completed
 ↓
Paid
 ↓
Review Prompt
 ↓
Google Maps
```

The goal is to make genuine customer feedback easier to provide.

---

## 🏗️ Multi-Tenant Architecture

DynamicMenu is designed as a **multi-tenant SaaS platform**.

Each restaurant operates as an isolated tenant.

```text
                    DynamicMenu
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Restaurant A     Restaurant B     Restaurant C
        │                │                │
     Menu A           Menu B           Menu C
     Orders A         Orders B         Orders C
     Tables A         Tables B         Tables C
     Offers A         Offers B         Offers C
```

Tenant isolation is a fundamental security requirement.

A restaurant must never be able to access another restaurant's data.

---

## 🧩 Product Architecture

DynamicMenu consists of several major areas:

```text
DynamicMenu
│
├── Platform
│   ├── Authentication
│   ├── Tenant Management
│   └── Billing
│
├── Restaurant Dashboard
│   ├── Menu
│   ├── Offers
│   ├── Themes
│   ├── Tables
│   ├── QR Codes
│   ├── Orders
│   └── Reviews
│
└── Customer Experience
    ├── QR Menu
    ├── Food Discovery
    ├── Cart
    ├── Ordering
    ├── Order Status
    └── Review Flow
```

---

## 📚 Project Documentation

The repository contains dedicated documentation for both humans and AI development agents.

| File                                 | Purpose                        |
| ------------------------------------ | ------------------------------ |
| [`PRD.md`](PRD.md)                   | Product requirements and scope |
| [`Architecture.md`](Architecture.md) | Technical architecture         |
| [`Rules.md`](Rules.md)               | Coding and development rules   |
| [`Phases.md`](Phases.md)             | Development roadmap            |
| [`Design.md`](Design.md)             | UI/UX and design system        |
| [`Memory.md`](Memory.md)             | Current project state          |
| [`AGENTS.md`](AGENTS.md)             | AI development instructions    |

### AI Development Workflow

```text
Memory.md
    ↓
Project Documentation
    ↓
Repository Inspection
    ↓
Graphify
    ↓
Implementation
    ↓
Testing
    ↓
Cleanup
    ↓
Memory.md
```

---

## 🛠️ Technology

The exact implementation should follow `Architecture.md`.

The project is designed around a modern web application architecture with:

* Modern frontend framework
* TypeScript
* API/backend layer
* Relational database
* Authentication
* Multi-tenant data isolation
* Responsive UI
* QR code generation
* Production-ready infrastructure

> The architecture document is the authoritative source for the current technology stack.

---

## 🎯 Development Roadmap

DynamicMenu is being developed incrementally.

```text
Phase 0  → Discovery & Foundation
Phase 1  → Authentication
Phase 2  → Multi-Tenancy
Phase 3  → Restaurant Dashboard
Phase 4  → Menu Management
Phase 5  → Themes & Offers
Phase 6  → Tables & QR
Phase 7  → Public Menu & Ordering
Phase 8  → Payment & Review
Phase 9  → Billing & SaaS
Phase 10 → Production Hardening
Phase 11 → Cleanup & Optimization
```

See [`Phases.md`](Phases.md) for detailed requirements and exit criteria.

---

## 🔐 Security Principles

Security is especially important because DynamicMenu handles data belonging to multiple restaurants.

The project prioritizes:

* Tenant isolation
* Server-side authorization
* Secure authentication
* Input validation
* Protected APIs
* Safe database queries
* Secure secrets management
* Resource ownership validation
* Safe file handling
* Error isolation

### Core rule

> **Never trust the client to determine what data a user is allowed to access.**

---

## 🎨 Design Philosophy

DynamicMenu has two distinct experiences.

### Restaurant Dashboard

Designed around:

**Clarity · Speed · Control · Productivity**

### Customer Menu

Designed around:

**Discovery · Food · Simplicity · Speed · Ordering**

The customer-facing menu is mobile-first because the primary interaction begins with a smartphone scanning a QR code.

---

## 📂 Repository Structure

```text
DynamicMenu/
│
├── AGENTS.md
├── PRD.md
├── Architecture.md
├── Rules.md
├── Phases.md
├── Design.md
├── Memory.md
├── README.md
│
├── design-references/
│   ├── dashboard/
│   ├── public-menu/
│   ├── ordering/
│   └── components/
│
├── src/
├── public/
└── ...
```

The actual source structure may evolve as the architecture develops.

---

## 🤖 AI-Assisted Development

DynamicMenu is developed with AI-assisted engineering workflows.

The AI agent must:

1. Read `Memory.md` first.
2. Understand the relevant project documentation.
3. Inspect existing code.
4. Use Graphify when appropriate.
5. Plan before making significant changes.
6. Implement the smallest correct solution.
7. Verify the implementation.
8. Remove unnecessary code.
9. Update `Memory.md`.

AI-generated code is treated as **code that must be reviewed and verified**, not as automatically correct code.

---

## 🧹 Clean Code Philosophy

DynamicMenu intentionally avoids unnecessary complexity.

### We prefer

```text
Simple
   ↓
Reusable
   ↓
Explicit
   ↓
Maintainable
```

### We avoid

```text
Duplicate code
Unnecessary abstractions
Unused dependencies
Dead code
Speculative architecture
Unnecessary files
Premature optimization
```

The goal is not to build the largest codebase.

The goal is to build the **smallest maintainable system that solves the problem correctly**.

---

## 📈 Long-Term Vision

DynamicMenu aims to become more than a digital menu.

The long-term direction is a restaurant operating platform built around the digital menu:

```text
Digital Menu
     ↓
QR
     ↓
Ordering
     ↓
Restaurant Operations
     ↓
Customer Interaction
     ↓
Reviews
     ↓
Analytics
     ↓
Restaurant Growth
```

The product should progressively reduce the operational friction between a restaurant and its customers.

---

## 📌 Project Status

**Status:** 🚧 In Development

**Current Phase:** See [`Memory.md`](Memory.md)

DynamicMenu is actively being built. Features, architecture, and implementation details may change as development progresses.

---

## 📄 License

License information will be added when the project's licensing model is finalized.

---

<div align="center">

### 🍽️ DynamicMenu

**Turn every table into a digital experience.**

Built for modern restaurants.

</div>
