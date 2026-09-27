# DynamicMenu — DESIGN.md

## 1. Design Vision

DynamicMenu is a premium, modern, mobile-first, multi-tenant SaaS platform for restaurants.

The design must balance three qualities:

- **Simplicity:** Restaurant owners should be able to build and publish a menu without technical knowledge.
- **Customization:** Restaurants should express their identity through branding, imagery, themes, categories, and seasonal campaigns.
- **Conversion:** Customers should find dishes, understand prices and offers, and place orders with minimal friction.

The restaurant dashboard should feel like a professional business application. The customer menu should feel like a beautifully designed restaurant website rather than an administrative interface.

---

## 2. Design References and Visual Direction

Visual references should be maintained in:

```text
/design-references
```

### Restaurant Dashboard

Design direction:

- Clean
- Structured
- Professional
- Spacious
- Minimal
- Data-oriented

Use a neutral application background with selective brand accents, clear cards, simple charts, and prominent actions.

### Customer Menu

Design direction:

- Mobile-first
- Food-focused
- Premium
- Visually rich
- Fast
- Easy to scan

Prioritize:

- Large food photography
- Clear prices
- Category navigation
- Descriptions
- Offers
- Persistent cart access

### Festive Themes

Themes should provide distinct seasonal identities through:

- Color
- Typography
- Decorative elements
- Promotional banners
- Background imagery
- Restaurant branding

Themes must not duplicate or modify the underlying menu data.

---

# 3. Brand Identity

## 3.1 Brand Personality

DynamicMenu should communicate:

- Innovation
- Hospitality
- Convenience
- Creativity
- Reliability
- Modern technology

Avoid making the product look like a generic food-delivery marketplace.

DynamicMenu is a restaurant customization and digital-menu platform.

---

# 4. Color System

## 4.1 Proposed Brand Palette

The exact production palette should follow the approved logo and assets in `/design-references`.

Proposed default:

| Token | Hex | Usage |
|---|---|---|
| `brand-primary` | `#F97316` | Primary actions and brand accents |
| `brand-primary-hover` | `#EA580C` | Hover/active state |
| `brand-primary-soft` | `#FFEDD5` | Soft brand backgrounds |
| `surface-primary` | `#FFFFFF` | Main surfaces |
| `surface-secondary` | `#FAFAFA` | Secondary surfaces |
| `surface-warm` | `#FFF8F1` | Warm food-oriented backgrounds |
| `text-primary` | `#18181B` | Primary text |
| `text-secondary` | `#71717A` | Secondary text |
| `border-default` | `#E4E4E7` | Borders and dividers |

## 4.2 Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `success` | `#16A34A` | Successful operations, paid orders |
| `warning` | `#D97706` | Pending orders, attention |
| `error` | `#DC2626` | Errors and destructive actions |
| `info` | `#2563EB` | Information and processing states |

Never rely on color alone to communicate status, errors, or availability.

---

# 5. Typography

Use a modern sans-serif font for the SaaS interface while allowing restaurant themes to use approved theme-specific typography.

## 5.1 Dashboard Typography

| Element | Font | Size | Weight |
|---|---|---:|---:|
| Page title | Inter | 30px | 700 |
| Section heading | Inter | 22px | 600 |
| Card heading | Inter | 18px | 600 |
| Body text | Inter | 14–16px | 400 |
| Small labels | Inter | 12–14px | 500 |

## 5.2 Customer Menu Typography

| Element | Size | Weight |
|---|---:|---:|
| Restaurant title | 28–36px | 700 |
| Menu section | 22–28px | 700 |
| Menu item title | 16–20px | 600 |
| Description | 13–16px | 400 |
| Price | 16–20px | 700 |

Possible customer theme combinations include:

- Playfair Display + Inter for elegant restaurants
- Poppins for modern cafés
- Theme-specific approved fonts for festive experiences

Typography must remain readable regardless of restaurant customization.

---

# 6. Layout and Spacing

Use a 4px spacing system.

Common spacing values:

```text
4px
8px
12px
16px
24px
32px
48px
64px
```

## Layout Guidelines

| Component | Specification |
|---|---|
| Desktop sidebar | 256px expanded |
| Dashboard max width | 1440px |
| Standard card radius | 12px |
| Large modal radius | 16px |
| Button height | 40–48px |
| Standard input height | 44px |
| Minimum mobile touch target | 44 × 44px |
| Customer menu content width | Up to 600px |

Use subtle borders and shadows to establish hierarchy.

Avoid excessive:

- Glassmorphism
- Gradients
- Decorative animations
- Heavy shadows
- Visual noise

---

# 7. Responsive Design

DynamicMenu must be responsive across:

- Desktop
- Laptop
- Tablet
- Mobile

## 7.1 Customer

The customer menu is **mobile-first**.

Mobile should use:

- Single-column layouts
- Sticky category navigation
- Large touch targets
- Persistent cart action
- Safe-area-aware bottom navigation
- Optimized food images

## 7.2 Dashboard

Desktop:

```text
Sidebar + Main Content
```

Tablet:

```text
Collapsible Sidebar + Main Content
```

Mobile:

```text
Top Navigation / Drawer
+
Single-column Content
```

Tables should use responsive layouts or controlled horizontal scrolling.

---

# 8. Restaurant Owner Dashboard

The dashboard is the primary workspace for restaurant owners.

## 8.1 Navigation

Primary navigation:

```text
Overview
Menus
Orders
Offers
Themes
QR & Tables
Customers
Loyalty
Reviews
Analytics
Settings
```

Only display features permitted by the user's restaurant role.

If a user belongs to multiple restaurants, provide a restaurant switcher.

## 8.2 Dashboard Overview

Display:

- Today's orders
- Revenue
- Pending orders
- Average order value
- Menu scans
- Recent orders

Provide quick actions:

- Create menu
- Add item
- Create offer
- Generate QR
- Change theme

Analytics cards must always display their measurement period.

Revenue based on manually marked paid orders should be labeled appropriately and should not be presented as independently verified payment revenue.

---

# 9. Restaurant Onboarding

The onboarding flow should take a restaurant from signup to published menu.

## Flow

```text
Create Account
      ↓
Restaurant Profile
      ↓
Create Menu
      ↓
Choose Theme
      ↓
Configure Tables
      ↓
Preview
      ↓
Publish
```

## Steps

### Step 1 — Account

Use Clerk for authentication.

### Step 2 — Restaurant Profile

Collect:

- Restaurant name
- Address
- Cuisine
- Contact information
- Logo
- Google Maps review URL

### Step 3 — First Menu

Allow the owner to:

- Create categories
- Add dishes
- Add descriptions
- Add prices
- Upload photographs

### Step 4 — Theme

Select a theme and customize:

- Colors
- Branding
- Presentation

### Step 5 — Tables

Add table names/numbers and generate QR codes.

### Step 6 — Preview and Publish

Show the customer experience before publishing.

Optional information should not block the first menu publication.

---

# 10. Menu Builder

The menu builder is the core restaurant-management interface.

It should provide website-builder-level flexibility without requiring technical knowledge.

## 10.1 Desktop Layout

Use three principal areas:

```text
┌──────────────┬─────────────────────┬───────────────────┐
│ Menu         │ Editing Workspace   │ Live Preview      │
│ Structure    │                     │                   │
│              │                     │                   │
│ Sections     │ Item Editor         │ Customer Menu     │
│ Items        │ Forms               │ Preview           │
└──────────────┴─────────────────────┴───────────────────┘
```

## 10.2 Menu Sections

Support custom sections such as:

- Restaurant's Choice
- Must Try
- People's Choice
- Starters
- Main Course
- Desserts
- Beverages
- Seasonal Specials

Owners can:

- Add
- Rename
- Reorder
- Duplicate
- Hide
- Delete

A menu item may appear in multiple curated sections without duplicating the underlying item record.

## 10.3 Menu Item Editor

Each menu item should support:

- Name
- Description
- Photograph
- Price
- Category
- Availability
- Dietary indicators
- Variants
- Add-ons
- Offer associations

Show a live customer-facing preview.

## 10.4 Draft and Publishing

Support:

```text
Draft
Published
Unpublished
```

Editing a draft must not unexpectedly change the live customer menu.

Publishing should include:

1. Preview
2. Validation
3. Change summary
4. Publish confirmation

---

# 11. Customer QR Menu

The customer menu must load directly in a mobile browser.

No app installation should be required.

No customer account should be required merely to browse the menu.

## 11.1 Customer Menu Structure

```text
Restaurant Header
      ↓
Table Information
      ↓
Hero / Branding
      ↓
Offers
      ↓
Category Navigation
      ↓
Featured Items
      ↓
Menu Sections
      ↓
Cart
```

## 11.2 Header

Display:

- Restaurant logo
- Restaurant name
- Optional tagline
- Table number
- Optional location information

## 11.3 Category Navigation

Use a horizontally scrollable sticky category navigation on mobile.

Example:

```text
Must Try | Starters | Main Course | Desserts | Drinks
```

## 11.4 Food Cards

Prioritize:

1. Food image
2. Item name
3. Price
4. Short description
5. Availability
6. Add button

Optional labels:

- Bestseller
- Must Try
- Restaurant's Choice
- New
- Offer

Labels must be based on actual restaurant configuration or measurable data.

## 11.5 Dish Details

Selecting an item should open either:

- A detail page
- A bottom sheet
- A modal

Include:

- Large image
- Complete description
- Variants
- Add-ons
- Quantity
- Final price
- Add-to-cart action

Required options must be selected before adding the item.

---

# 12. Theme Builder

Themes are a major DynamicMenu feature.

Themes modify presentation without modifying menu content.

## 12.1 Theme Architecture

```text
Menu Data
    +
Restaurant Branding
    +
Theme Configuration
    ↓
Customer Menu
```

## 12.2 Theme Controls

Allow restaurant owners to configure:

- Primary color
- Secondary color
- Background
- Typography
- Card style
- Button style
- Header
- Decorative elements
- Promotional banners
- Background imagery

## 12.3 Theme Editor

The editor should support:

```text
Live Preview
Desktop Preview
Mobile Preview
Save Draft
Publish
Reset
Undo
```

## 12.4 Initial Theme Concepts

Suggested themes:

```text
Modern Minimal
Eid Celebration
Diwali Festive
Midnight Luxury
Christmas
Valentine
Ramadan
Holi
Traditional Indian
Contemporary Café
```

New themes must be addable without rewriting the menu system.

## 12.5 Custom Images

Allow:

- Image upload
- Crop
- Position
- Overlay opacity
- Preview

The system must maintain sufficient text contrast over background images.

---

# 13. Offers and Campaign Builder

The offer builder should make seasonal and promotional campaigns simple.

## Offer Fields

- Campaign name
- Discount type
- Discount value
- Eligible items
- Eligible categories
- Start date
- End date
- Conditions
- Optional coupon code
- Status

## Offer Lifecycle

```text
Draft
  ↓
Scheduled
  ↓
Active
  ↓
Expired
```

Possible additional state:

```text
Paused
```

Only active offers should appear on the customer menu.

---

# 14. QR Code and Table Management

Each restaurant table has a unique QR code.

## Table Management

Each table card should show:

- Table number/name
- QR status
- Latest order status
- QR actions

Actions:

```text
View
Download
Print
Regenerate
Deactivate
```

## QR Design

QR cards should contain:

```text
Restaurant Logo
Restaurant Name
QR Code
"Scan to Explore Our Menu"
Table Number
Optional Branding
```

Production QR codes must be generated from real table URLs and tested for scanning.

Support:

- PNG
- SVG
- Print-ready PDF
- Individual downloads
- Bulk printing

QR codes must maintain sufficient quiet space and contrast.

---

# 15. Ordering and Cart Experience

The ordering process must be short and predictable.

## Customer Flow

```text
Browse
  ↓
Select Item
  ↓
Customize
  ↓
Add to Cart
  ↓
Review Cart
  ↓
Submit Order
  ↓
Confirmation
  ↓
Track Status
```

## Cart

Display:

- Restaurant
- Table
- Items
- Quantities
- Variants
- Add-ons
- Offers
- Itemized total

Do not require a phone number solely for browsing.

Before submission, show the final order amount.

The backend must validate prices, availability, variants, and offers.

## Order Confirmation

After a successful order, display:

- Order number
- Table
- Items
- Total
- Current status

Never show successful order confirmation before backend confirmation.

---

# 16. Restaurant Order Management

The restaurant dashboard should have a dedicated live orders screen.

## Desktop

Use either:

```text
Kanban Board
```

or:

```text
Filterable Order Table
```

## Mobile

Use stacked order cards.

Each order should show:

- Order number
- Table
- Items
- Quantities
- Notes
- Total
- Creation time
- Current status

## Order State

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

Possible failure states:

```text
CANCELLED
REJECTED
```

Only show actions that are valid for the current state.

---

# 17. Customer Loyalty Program

Use **Loyalty Program** as the product-facing terminology.

The loyalty interface should explain:

- Current points
- Available rewards
- Points required
- Redemption rules
- Reward history

Dashboard metrics:

- Returning customers
- Eligible customers
- Points issued
- Points redeemed
- Repeat order rate

Customer phone numbers should only be collected when necessary or voluntarily provided.

Explain how the information is used and protect it from exposure to unrelated restaurants.

---

# 18. Reviews and Google Maps

The review workflow starts after an order is marked as paid.

## Flow

```text
Order Paid
   ↓
Review Eligibility
   ↓
Customer Prompt
   ↓
Internal Feedback
   ↓
Optional Google Maps Action
```

Example UI:

```text
How was your meal?

Your feedback helps us improve.

[ Write your feedback ]

[ Submit feedback ]

Share your experience on Google Maps
[ Leave a Google Review ]
```

The Google Maps action should redirect the customer to the restaurant's configured review destination.

DynamicMenu must not claim that a Google review was successfully posted unless this can actually be verified.

Do not:

- Require a positive rating before showing Google Maps
- Offer rewards only for positive reviews
- Automatically post reviews
- Misrepresent a redirect as a successful review

Provide a dismiss option and avoid repeatedly prompting customers who already responded or declined.

---

# 19. Analytics Design

Analytics should be actionable without overwhelming restaurant owners.

## Core Areas

### Sales and Orders

- Total orders
- Orders per day
- Average order value
- Order status distribution

### Menu Performance

- Most viewed items
- Most ordered items
- Category performance
- Offer performance

### Customer Activity

- New customers
- Returning customers
- Repeat order rate
- Customer spend

### QR Engagement

- QR scans
- Unique sessions
- Table activity

Use:

- Date filters
- Comparison periods
- Clear chart legends
- Empty states
- Loading states

Do not display metrics that cannot be reliably measured.

---

# 20. Shared Component Library

Build reusable components rather than independent components for every screen.

| Component | Variants |
|---|---|
| Button | Primary, secondary, outline, destructive, loading |
| Input | Default, focused, error, disabled |
| Card | Standard, interactive, selected |
| Badge | Status, promotional, informational |
| Modal | Confirmation, editing, destructive |
| Drawer | Navigation, cart, dish customization |
| Table | Sortable, filterable, paginated |
| Toast | Success, error, warning, information |
| Tabs | Underline, segmented |
| Image uploader | Empty, uploading, preview, error |
| Empty state | No menu, no orders, no customers |
| Skeleton | Dashboard, food card, menu page |

Use shared design tokens across the dashboard and customer menu.

Restaurant themes may override customer-facing theme tokens without changing the dashboard design system.

---

# 21. Interaction and Motion

Animations should communicate state changes rather than serve as decoration.

Use subtle transitions for:

- Opening drawers
- Switching tabs
- Adding items to cart
- Saving changes
- Notifications
- Loading states

Recommended durations:

```text
Small interactions: 150–250ms
Large transitions: 200–350ms
```

Respect `prefers-reduced-motion`.

Do not delay essential content or ordering actions with animation.

---

# 22. Accessibility

Target:

```text
WCAG 2.2 AA
```

Requirements:

- Sufficient color contrast
- Visible keyboard focus
- Semantic HTML
- Screen-reader-friendly controls
- Descriptive form labels
- Accessible error messages
- Keyboard navigation
- Minimum 44 × 44px touch targets
- Do not rely on color alone
- Do not rely exclusively on hover
- Do not rely exclusively on gestures

Restaurant-created themes should be checked for contrast and readability before publication.

---

# 23. Loading, Error, and Empty States

Every major screen must define:

```text
Loading
Empty
Success
Error
```

## Empty State Example

```text
No menu yet

Create your first menu and start serving
your customers digitally.

[ Create Menu ]
```

## Error State

```text
Something went wrong.

We couldn't load your menu.

[ Try Again ]
```

## Invalid QR

```text
This QR code is unavailable.

Please ask restaurant staff for a new QR code.
```

Never display a blank screen when an actionable error message is possible.

---

# 24. Image Guidelines

Food photography should be:

- Sharp
- Natural
- Appetizing
- Consistently framed
- Properly compressed

Recommended ratios:

| Asset | Ratio |
|---|---|
| Food card | 1:1 or 4:3 |
| Food detail | 4:3 |
| Restaurant cover | 16:9 |
| Offer banner | 2:1 |
| Restaurant logo | 1:1 |
| Theme background | Responsive |

Use optimized image formats where supported.

Provide meaningful alternative text.

Avoid excessive filters that misrepresent the food.

---

# 25. Design Tokens

Design values must be centralized.

Example:

```css
:root {
  /* Brand */
  --brand-primary: #F97316;
  --brand-primary-hover: #EA580C;
  --brand-primary-soft: #FFEDD5;

  /* Surfaces */
  --surface-primary: #FFFFFF;
  --surface-secondary: #FAFAFA;
  --surface-warm: #FFF8F1;

  /* Text */
  --text-primary: #18181B;
  --text-secondary: #71717A;

  /* Borders */
  --border-default: #E4E4E7;

  /* Status */
  --status-success: #16A34A;
  --status-warning: #D97706;
  --status-error: #DC2626;
  --status-info: #2563EB;

  /* Typography */
  --font-dashboard: "Inter", sans-serif;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
}
```

These values are defaults. The final brand palette should follow the approved DynamicMenu brand assets.

---

# 26. Design File Structure

Recommended design documentation:

```text
design/
├── foundations/
│   ├── colors.md
│   ├── typography.md
│   ├── spacing.md
│   └── accessibility.md
│
├── components/
│   ├── buttons.md
│   ├── forms.md
│   ├── cards.md
│   ├── navigation.md
│   └── modals.md
│
├── dashboard/
│   ├── overview.md
│   ├── menu-builder.md
│   ├── orders.md
│   └── analytics.md
│
├── customer/
│   ├── menu.md
│   ├── cart.md
│   ├── order-tracking.md
│   └── reviews.md
│
└── themes/
    ├── modern-minimal.md
    ├── eid.md
    ├── diwali.md
    └── midnight-luxury.md

design-references/
├── brand/
├── dashboard/
├── customer-menu/
├── themes/
└── inspiration/
```

`DESIGN.md` remains the authoritative high-level design specification.

---

# 27. Design Implementation Priorities

## Phase 1 — Foundation

Establish:

- Brand tokens
- Typography
- Spacing
- Responsive grid
- Shared component library
- Accessibility rules

## Phase 2 — Restaurant Experience

Design:

- Onboarding
- Dashboard
- Menu builder
- Menu publishing
- Table management
- QR generation

## Phase 3 — Customer Experience

Design:

- QR landing page
- Mobile menu
- Dish details
- Cart
- Order placement
- Order tracking

## Phase 4 — Customization and Growth

Design:

- Theme gallery
- Theme editor
- Offers
- Loyalty
- Reviews

## Phase 5 — Optimization

Add:

- Advanced analytics
- Accessibility refinements
- Performance improvements
- Usability testing
- Additional themes

---

# 28. Design Acceptance Criteria

The design is ready for implementation when:

- A new restaurant owner can create a menu without technical assistance.
- A restaurant owner can preview and publish a menu.
- Customers can scan a table QR and immediately access the correct menu.
- Customers can comfortably browse the menu on a mobile phone.
- Customers can customize dishes and place orders with minimal friction.
- Restaurant staff can manage orders without navigating through unrelated settings.
- Restaurant owners can create and activate offers.
- Restaurant owners can switch themes without rebuilding their menu.
- Customers can access the post-payment review flow.
- All major screens have responsive designs.
- All major interactions have loading, success, error, and empty states.
- Accessibility requirements are considered throughout the product.
- New festive themes can be introduced without rebuilding the core menu system.

---

# 29. Core Design Principle

> **DynamicMenu should make restaurant owners feel in control of their digital identity while making the customer experience effortless.**

The dashboard should provide **power without complexity**.

The customer menu should provide **beauty without friction**.

The theme system should provide **creativity without breaking consistency**.

The entire product should feel like **a premium digital restaurant platform rather than a generic SaaS dashboard.**
