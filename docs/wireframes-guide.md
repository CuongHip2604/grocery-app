# Wireframes Guide: Grocery Store Management App

## Document Info
- **Version**: 1.0
- **Created**: 2026-01-26
- **Status**: Approved

---

## Overview

Mobile-first PWA wireframes for the Grocery Store Management App, designed for smartphone use (375px width).

**Design System**: shadcn/ui with Tailwind CSS

**Color Palette**:
- Primary: Blue (#1971c2)
- Success: Green (#2f9e44)
- Warning: Orange (#e8590c)
- Danger: Red (#e03131)

---

## Screen Inventory

| # | Screen | Route | Priority |
|---|--------|-------|----------|
| 1 | Login | `/login` | P0 |
| 2 | Dashboard | `/` | P1 |
| 3 | Scan/Price Lookup | `/scan` | P1 |
| 4 | New Sale | `/sale` | P1 |
| 5 | Products List | `/products` | P1 |
| 6 | Customer Credit | `/customers/[id]` | P1 |
| 7 | Payment Modal | (modal) | P1 |
| 8 | Add/Edit Product | `/products/new` | P1 |
| 9 | Inventory | `/inventory` | P2 |

---

## Navigation Structure

### Bottom Navigation Bar
| Icon | Label | Route |
|------|-------|-------|
| Home | Home | `/` |
| Box | Products | `/products` |
| Users | Customers | `/customers` |
| Chart | Reports | `/reports` |

### Floating Action Button (FAB)
- Quick scan button on all pages
- Opens scanner modal

---

## Key Screen Descriptions

### 1. Login Screen
- App logo
- Email and password inputs
- Login button

### 2. Dashboard
- Today's sales summary card
- Outstanding debts card
- Low stock alert banner
- Quick action buttons (Scan, New Sale, Products)

### 3. Scan/Price Lookup
- Camera preview with scan overlay
- Product result card showing name, price, stock
- Add to Sale / View Details buttons

### 4. New Sale
- Scan/Search buttons
- Item list with quantities
- Running total
- Complete Sale button

### 5. Products List
- Search bar
- Product cards with name, price, stock
- Low stock indicators (red)

### 6. Customer Credit
- Customer info header
- Balance card with Record Payment button
- Credit history ledger

### 7. Payment Modal
- Total amount
- Cash / On Credit selection
- Confirm button

### 8. Add/Edit Product
- Form fields: barcode (with scan), name, price, cost
- Stock and reorder level
- Category dropdown
- Custom label checkbox

### 9. Inventory
- Total inventory value summary
- Product list with stock levels
- Adjust links
- Low stock highlighting

---

## Responsive Considerations

- **Phone** (375px): Primary target
- **Tablet** (768px): Same layout, larger touch targets
- **Desktop** (1024px+): Centered container, max-width 480px

---

*Wireframes follow shadcn/ui component patterns for consistent implementation.*
