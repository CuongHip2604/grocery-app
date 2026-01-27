# Epics and User Stories

## Epic 1: Authentication & User Management

### US-1.1: User Login
**As a** store owner
**I want to** log in with my email and password
**So that** I can securely access my store data

**Acceptance Criteria:**
- [x] Login form with email and password fields
- [x] Form validation (valid email, password min 6 chars)
- [x] Show error message for invalid credentials
- [x] Redirect to dashboard on successful login
- [x] Store JWT tokens in localStorage

### US-1.2: Token Refresh
**As a** logged-in user
**I want to** stay logged in without re-entering credentials
**So that** I can use the app continuously

**Acceptance Criteria:**
- [x] Automatically refresh token before expiry
- [x] Handle concurrent requests during refresh
- [x] Redirect to login if refresh fails

### US-1.3: Logout
**As a** user
**I want to** log out of the application
**So that** I can secure my account on shared devices

**Acceptance Criteria:**
- [x] Logout button in settings menu
- [x] Clear all tokens on logout
- [x] Redirect to login page

---

## Epic 2: Product Management

### US-2.1: View Products List
**As a** store owner
**I want to** see a list of all my products
**So that** I can manage my inventory

**Acceptance Criteria:**
- [x] Display products with name, price, stock quantity
- [x] Show low stock indicator
- [x] Search products by name
- [x] Paginated list

### US-2.2: Add New Product
**As a** store owner
**I want to** add a new product
**So that** I can sell it in my store

**Acceptance Criteria:**
- [x] Form with name, price, cost, category, reorder level
- [x] Auto-generate barcode if not provided
- [x] Set initial stock quantity
- [x] Validation for required fields

### US-2.3: Edit Product
**As a** store owner
**I want to** edit product details
**So that** I can update prices or fix errors

**Acceptance Criteria:**
- [x] Edit all product fields
- [x] Cannot change barcode after creation
- [x] Show current values in form

### US-2.4: View Product Details
**As a** store owner
**I want to** see detailed product information
**So that** I can view stock, sales history

**Acceptance Criteria:**
- [x] Display all product fields
- [x] Show current stock level
- [x] Display QR code for product

### US-2.5: Generate QR Code
**As a** store owner
**I want to** generate QR codes for products
**So that** I can label products without barcodes

**Acceptance Criteria:**
- [x] Generate QR code with product barcode
- [x] Print-friendly display
- [x] Works for custom-labeled products

### US-2.6: Import Products from Excel
**As a** store owner
**I want to** import products from Excel
**So that** I can quickly add many products

**Acceptance Criteria:**
- [x] Upload Excel file (.xlsx, .xls)
- [x] Support required columns: name, price, cost
- [x] Support optional columns: description, reorderLevel, initialStock
- [x] Show import results (success/failed count)
- [x] Display error details for failed rows

### US-2.7: Delete Product
**As a** store owner
**I want to** delete a product
**So that** I can remove discontinued items

**Acceptance Criteria:**
- [x] Delete product from list
- [x] Confirmation before delete
- [x] Cannot delete if product has sales history (soft delete)

---

## Epic 3: Category Management

### US-3.1: View Categories
**As a** store owner
**I want to** see all product categories
**So that** I can organize my products

**Acceptance Criteria:**
- [x] List categories with name and product count
- [x] Add new category
- [x] Edit category name
- [x] Delete empty categories

---

## Epic 4: Inventory Management

### US-4.1: View Inventory
**As a** store owner
**I want to** see current inventory levels
**So that** I can know what's in stock

**Acceptance Criteria:**
- [x] List products with quantities
- [x] Show inventory value (cost × quantity)
- [x] Filter by low stock
- [x] Search by product name

### US-4.2: Inventory Summary
**As a** store owner
**I want to** see inventory summary
**So that** I can understand total stock value

**Acceptance Criteria:**
- [x] Total SKUs
- [x] Total quantity
- [x] Total value at cost
- [x] Total value at retail
- [x] Potential profit
- [x] Low stock count

### US-4.3: Adjust Stock
**As a** store owner
**I want to** adjust stock quantities
**So that** I can correct errors or record losses

**Acceptance Criteria:**
- [x] Add or subtract quantity
- [x] Set absolute quantity
- [x] Optional reason field
- [x] Update inventory immediately

### US-4.4: Restock Product
**As a** store owner
**I want to** record restocking
**So that** I can update inventory when goods arrive

**Acceptance Criteria:**
- [x] Add quantity to existing stock
- [x] Optional notes field
- [x] Show new quantity after restock

### US-4.5: Low Stock Alerts
**As a** store owner
**I want to** see low stock alerts
**So that** I can reorder before running out

**Acceptance Criteria:**
- [x] Dashboard shows low stock count
- [x] List products below reorder level
- [x] Show deficit (reorder level - current)

---

## Epic 5: Point of Sale (POS)

### US-5.1: Scan Barcode
**As a** cashier
**I want to** scan product barcodes
**So that** I can quickly add items to cart

**Acceptance Criteria:**
- [x] Camera-based barcode scanning
- [x] Support common barcode formats (EAN, UPC, QR)
- [x] Auto-add product to cart on scan
- [x] Show error if product not found

### US-5.2: Manual Product Search
**As a** cashier
**I want to** search for products manually
**So that** I can find items without barcodes

**Acceptance Criteria:**
- [x] Search by product name
- [x] Show search results
- [x] Add to cart from results

### US-5.3: Manage Cart
**As a** cashier
**I want to** manage items in cart
**So that** I can adjust the order

**Acceptance Criteria:**
- [x] View cart items with quantities and prices
- [x] Adjust item quantities
- [x] Remove items from cart
- [x] Show running total

### US-5.4: Complete Cash Sale
**As a** cashier
**I want to** complete a cash sale
**So that** I can process customer payments

**Acceptance Criteria:**
- [x] Select cash payment
- [x] Complete sale
- [x] Reduce inventory
- [x] Clear cart after sale

### US-5.5: Complete Credit Sale
**As a** cashier
**I want to** sell on credit
**So that** trusted customers can pay later

**Acceptance Criteria:**
- [x] Select credit payment
- [x] Enter or select customer name
- [x] Create customer if doesn't exist
- [x] Record debt in customer ledger
- [x] Complete sale and reduce inventory

---

## Epic 6: Sales History

### US-6.1: View Sales History
**As a** store owner
**I want to** see past sales
**So that** I can review transactions

**Acceptance Criteria:**
- [x] List sales with date, total, payment type
- [x] Filter by date range
- [x] Show customer name for credit sales
- [x] Paginated list

### US-6.2: View Sale Details
**As a** store owner
**I want to** see sale details
**So that** I can review what was sold

**Acceptance Criteria:**
- [x] Show all items in sale
- [x] Show quantities and prices
- [x] Show payment type and customer

### US-6.3: Void Sale
**As a** store owner
**I want to** void a sale
**So that** I can correct mistakes

**Acceptance Criteria:**
- [x] Void completed sale
- [x] Restore inventory quantities
- [x] Reverse credit ledger entry if credit sale
- [x] Mark sale as voided (not deleted)

---

## Epic 7: Customer Management

### US-7.1: View Customers
**As a** store owner
**I want to** see all customers
**So that** I can manage customer relationships

**Acceptance Criteria:**
- [x] List customers with name and balance
- [x] Sort by debt amount (highest first)
- [x] Search by name

### US-7.2: Add Customer
**As a** store owner
**I want to** add a new customer
**So that** I can track their purchases

**Acceptance Criteria:**
- [x] Add customer with name
- [x] Optional phone, email, address, notes
- [x] Auto-create during credit sale

### US-7.3: View Customer Ledger
**As a** store owner
**I want to** see customer transaction history
**So that** I can track their debt

**Acceptance Criteria:**
- [x] Show all charges and payments
- [x] Running balance after each entry
- [x] Current total balance

### US-7.4: Record Payment
**As a** store owner
**I want to** record customer payments
**So that** I can track debt repayment

**Acceptance Criteria:**
- [x] Enter payment amount
- [x] Optional description
- [x] Update customer balance
- [x] Show in ledger

### US-7.5: Debtors Report
**As a** store owner
**I want to** see all customers with outstanding debt
**So that** I can follow up on collections

**Acceptance Criteria:**
- [x] List customers with positive balance
- [x] Total outstanding amount
- [x] Customer count
- [x] Link to customer details

---

## Epic 8: Reports & Analytics

### US-8.1: Dashboard
**As a** store owner
**I want to** see a dashboard overview
**So that** I can quickly understand business status

**Acceptance Criteria:**
- [x] Today's sales count and revenue
- [x] Total receivables
- [x] Low stock count
- [x] Quick access to main features

### US-8.2: Sales Report
**As a** store owner
**I want to** see sales reports
**So that** I can analyze revenue trends

**Acceptance Criteria:**
- [x] Select date range
- [x] Total revenue
- [x] Order count
- [x] Cash vs credit breakdown
- [x] Top selling products

### US-8.3: Profit & Loss Report
**As a** store owner
**I want to** see profit/loss report
**So that** I can understand profitability

**Acceptance Criteria:**
- [x] Select date range
- [x] Revenue
- [x] Cost of goods sold
- [x] Gross profit
- [x] Expenses by category
- [x] Net profit

---

## Epic 9: Expenses

### US-9.1: Record Expense
**As a** store owner
**I want to** record business expenses
**So that** I can track costs

**Acceptance Criteria:**
- [x] Enter amount, category, description, date
- [x] Common categories (Rent, Utilities, etc.)
- [x] Show in expense list

### US-9.2: View Expenses
**As a** store owner
**I want to** see expense history
**So that** I can review spending

**Acceptance Criteria:**
- [x] List expenses with date, category, amount
- [x] Filter by date range
- [x] Total amount for period

---

## Technical Stories

### TS-1: API Proxy Configuration
- [x] Configure Next.js rewrites for API proxy
- [x] Handle all /api/* routes

### TS-2: Error Handling
- [x] Global error handling in API
- [x] User-friendly error messages in UI
- [x] Form validation errors

### TS-3: Database Seeding
- [x] Seed script for development data
- [x] Default user account
- [x] Sample products and categories

### TS-4: Vietnamese Localization
- [x] All UI text in Vietnamese
- [x] VND currency formatting
- [x] vi-VN date formatting
