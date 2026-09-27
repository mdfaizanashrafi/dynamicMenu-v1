# Product Requirements Document (PRD)

## 1. Product Overview
- Product name: DynamicMenu
- One-line description: It helps generate QR code based menu for restaurant.
- Problem being solved: It will replace the old traditional printed Menus with new themed, festivities inspired, offer creation dynamic menu instantly.
- Proposed solution: A multi-tenant website, where different restaurants can enroll and start creating their QR menu, with complete editing features, from themes, offers, menu-naming, etc. It will be wordpress for Restaurant, or Shopify but for menu QR creation.

## 2. Goals
- Goal 1: The web-app will be multi-tenant. Restaurant owners can go and signup and get their dashboard, where they can edit menu, create offers, design the menu, etc.
- Goal 2: The customer can scan the QR and get the menu delivered on the phone, and from their they can place the order, based on the numbering of the QR, like table 1 QR, table 2 QR, etc.
- Goal 3: Once meal is complete and the restaurant owner mark it as paid on his dashboard, customer should be able the review the food from pop-up he will receive, and then it should redirect it to the google maps for posting the review thus increasing the social trust.

## 3. Target Audience
### Primary Users
- Who they are: The restaurant owners.
- Their needs: Restaurant owners, who wants a dynamic menu for their needs, for variable offers during festive seasons, for menu categories, for ease of business, and for increasing their social profile on google maps.
- Their pain points: Traditional printed menu is limiting, they can't create any offers, festive theme, no google maps review system.

### Secondary Users
- Who they are: Customers of the restaurant.
- Their needs: They face problem like which food to eat so that their money is not wasted, no way to upload their reviews on google map, they need modern interactive menus.

## 5. Features

### Feature 1: [Customer Menu]
**Description:**  
Customer visits the restaurant, there he sees the QR on the table, he scans it, and interactive menu appears which multiple sections like, restaurant choice, must try, people choice, etc, along with add ons, offer details, festive theme.

**Requirements:**
- Requirement 1: QR Scan -> Theme based Menu Appears.
- Requirement 2: Menu have multiple sections based on the list created by the owner.
- Requirement 3: Shows offers.

### Feature 2: [Restaurant Owner Dashboard]
**Description:**  
Restaurant owner can signup and create a menu, with complete flexibility, choose from wide range of indian festive menu, with picture upload to make menu theme like picture. Get analytics of the orders, can get the customer details for royalty program. 

**Requirements:**
- Requirement 1: Dashboard to manage the entire menu.
- Requirement 2: Royalty program for customer if they order with the same phone number. Also after eating, when restaurant marks order as paid, it will send webhook to the customer to review on google map for visibility.

## 6. User Flow
1. User opens the application
2. User signs up/logs in
3. User reaches the dashboard
4. User performs the main action
5. User receives the result


## 7. Non-Functional Requirements
- Performance
- Security
- Reliability
- Accessibility
- Scalability

## 8. Technical Requirements
- Frontend: Vercel
- Backend: Render
- Database: Neon
- Authentication: Clerk
- Error and Monitoring: Sentry

## 9. Design Requirements
- UI style: refer DESIGN.md and /design-references folder
- Colors: refer DESIGN.md and /design-references folder
- Typography: refer DESIGN.md and /design-references folder
- Responsive behavior: refer DESIGN.md and /design-references folder
- Mobile requirements: refer DESIGN.md and /design-references folder

## 10. Success Metrics
- Metric 1: Goals achieved
- Metric 2: Features achieved