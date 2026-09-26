# DynamicMenu — Design System

## 1. Principles

- Modern
- Clean
- Fast
- Mobile-first
- Accessible
- Restaurant-focused
- Simple
- Low visual clutter

## 2. Interfaces

### SaaS Dashboard

For restaurant owners.

Priorities:

- Productivity
- Clear navigation
- Fast management
- Data visibility
- Simple workflows

### Public Restaurant Menu

For customers.

Priorities:

- Mobile-first
- Fast loading
- Food discovery
- Clear pricing
- Easy ordering
- Restaurant branding

Do not force both interfaces into the same visual style.

## 3. Branding

Product:
DynamicMenu

Primary color:
[Define]

Secondary color:
[Define]

Success:
[Define]

Warning:
[Define]

Error:
[Define]

## 4. Typography

Primary font:
[Define]

Heading:
[Define]

Body:
[Define]

Use a consistent type scale.

## 5. Spacing

Use a consistent spacing system.

Avoid arbitrary spacing values.

## 6. Core Components

Use when required:

- Button
- Input
- Select
- Modal
- Dialog
- Dropdown
- Card
- Table
- Tabs
- Toast
- Navigation
- Form
- Badge
- Loading state
- Empty state
- Error state

Reuse components instead of creating visual duplicates.

## 7. Dashboard

Prioritize:

- Clear navigation
- Important actions
- Menu management
- Orders
- Offers
- Restaurant configuration

## 8. Public Menu

Prioritize:

- Mobile usability
- Fast loading
- Categories
- Food imagery
- Item name
- Description
- Price
- Offers
- Cart/order action

## 9. Responsive Design

Use mobile-first design.

Support:

- Mobile
- Tablet
- Desktop

Do not simply shrink desktop layouts for mobile.

## 10. Accessibility

- Keyboard accessible
- Sufficient contrast
- Visible focus states
- Semantic HTML
- Accessible labels
- Appropriate ARIA when necessary
- Do not rely on color alone

## 11. Animation

Animations should:

- Communicate state
- Improve interaction
- Be subtle
- Respect reduced-motion preferences

Avoid decorative animation that harms performance.

## 12. Tenant Customization

Restaurants may customize:

- Colors
- Logo
- Restaurant name
- Menu theme
- Promotional presentation

Customization must preserve usability, accessibility, and layout integrity.

## 13. Design Rules

- Follow existing patterns.
- Avoid one-off styles.
- Avoid unnecessary effects.
- Avoid inconsistent spacing.
- Avoid excessive cards, shadows, gradients, or animations.
- Prioritize usability over decoration.

## 14. Permanent Design Decisions

Record important permanent design decisions here.

## 15. Visual References

Reference screenshots are stored in:

`/design-references/`

### Dashboard

`/design-references/dashboard/`

Use these to understand:
- Layout
- Navigation
- Spacing
- Hierarchy
- Component patterns

### Public Menu

`/design-references/public-menu/`

Use these to understand:
- Mobile layout
- Food presentation
- Categories
- Offers
- Menu navigation

### Ordering

`/design-references/ordering/`

Use these to understand:
- Cart
- Ordering flow
- Order status
- Customer interactions

### Components

`/design-references/components/`

Use these to understand:
- Buttons
- Forms
- Cards
- Dialogs
- Tables
- Other reusable UI patterns

## Reference Rule

Screenshots are visual references, not exact implementation instructions.

Use their:
- Layout principles
- Visual hierarchy
- Spacing
- Typography ideas
- Interaction patterns

Do not copy:
- Branding
- Logos
- Proprietary assets
- Text
- Source code

Adapt the useful design principles to DynamicMenu.

## DynamicMenu — Color Palette

### Primary Colors

| Color                 | HEX       | RGB             | Usage                        |
| --------------------- | --------- | --------------- | ---------------------------- |
| 🟠 **Primary Orange** | `#FF6A00` | `255, 106, 0`   | Main brand, CTA, highlights  |
| 🟤 **Bowl Brown**     | `#4E2E1B` | `78, 46, 27`    | Bowl, secondary branding     |
| 🟢 **Leaf Green**     | `#7CB342` | `124, 179, 66`  | Leaf, success, active states |
| 🟡 **Light Cream**    | `#FFF7EE` | `255, 247, 238` | Main background              |

### Secondary Colors

| Color              | HEX       | RGB             | Usage                   |
| ------------------ | --------- | --------------- | ----------------------- |
| 🔴 **Accent Red**  | `#F44300` | `244, 67, 0`    | Hover, alerts, emphasis |
| 🟡 **Warm Yellow** | `#FFB300` | `255, 179, 0`   | Secondary highlights    |
| ⚫ **Text Dark**    | `#1A1A1A` | `26, 26, 26`    | Primary text            |
| 🔘 **Text Gray**   | `#6B7280` | `107, 114, 128` | Secondary text          |

### Supporting Colors

| Color           | HEX       | Usage                 |
| --------------- | --------- | --------------------- |
| **Soft Green**  | `#E8F5E9` | Success backgrounds   |
| **Soft Orange** | `#FFEDD6` | Highlight backgrounds |
| **Neutral**     | `#F5F5F5` | Cards, surfaces       |
| **White**       | `#FFFFFF` | Clean backgrounds     |

### Gradients

**Primary Gradient**

```css
linear-gradient(135deg, #FF6A00 0%, #F44300 100%)
```

**Bowl Gradient**

```css
linear-gradient(135deg, #6B3A1E 0%, #2E1A0F 100%)
```

### Dark Theme

```text
Primary Orange   #FF6A00
Bowl Brown       #4E2E1B
Leaf Green       #7CB342
Surface Dark     #121212
Text Primary     #FFFFFF
Text Secondary   #BDBDBD
```

### Light Theme

```text
Primary Orange   #FF6A00
Bowl Brown       #4E2E1B
Leaf Green       #7CB342
Background       #FFF7EE
Surface          #FFFFFF
Text Primary     #1A1A1A
Text Secondary   #6B7280
```

### Brand Core

```text
#FF6A00  — Primary Orange
#4E2E1B  — Bowl Brown
#7CB342  — Leaf Green
#FFF7EE  — Light Cream
#1A1A1A  — Text Dark
#6B7280  — Text Gray
#F44300  — Accent Red
#FFB300  — Warm Yellow
#FFFFFF  — White
```

**Core identity:** 🟠 Orange + 🟤 Brown + 🟢 Green + 🟡 Cream.
