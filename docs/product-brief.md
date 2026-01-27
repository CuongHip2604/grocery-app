# Product Brief: Grocery Store Management App

## Overview
A mobile-first Progressive Web App (PWA) for managing small grocery stores in Vietnam. The application helps store owners track inventory, process sales, manage customer credit, and generate business reports.

## Target Users
- Small grocery store owners in Vietnam
- Single-operator stores
- Stores with basic smartphone/tablet access

## Core Problem Statement
Small grocery store owners need a simple, affordable way to:
- Track product inventory and get low-stock alerts
- Process sales quickly with barcode scanning
- Manage customer credit/debt (common practice in Vietnam)
- Understand business performance through reports

## Key Features

### 1. Product Management
- Add/edit products with barcode, name, price, cost
- Barcode scanning for quick product lookup
- QR code generation for products without barcodes
- Category organization
- Excel import for bulk product entry

### 2. Inventory Management
- Real-time stock tracking
- Low stock alerts with configurable reorder levels
- Stock adjustment (add/remove/set)
- Restock functionality
- Inventory value reports

### 3. Point of Sale (POS)
- Barcode scanning for quick checkout
- Manual product search
- Cart management (add, remove, adjust quantities)
- Cash and credit payment options
- Sale receipt generation

### 4. Customer & Credit Management
- Customer database with basic info (name)
- Credit sales (Ghi nợ) for trusted customers
- Payment recording against outstanding balance
- Customer ledger showing transaction history
- Debtors report

### 5. Reporting & Analytics
- Dashboard with daily sales summary
- Sales reports by date range
- Profit/loss reports
- Top-selling products
- Receivables summary

## Technical Requirements

### Platform
- Mobile-first PWA (Progressive Web App)
- Responsive design for phones and tablets
- Works on modern browsers (Chrome, Safari)

### Stack
- **Frontend:** Next.js 16, React 19, TailwindCSS
- **Backend:** NestJS 11, Prisma ORM
- **Database:** PostgreSQL
- **Monorepo:** Nx workspace

### Localization
- Vietnamese language UI
- Vietnamese Dong (VND) currency
- vi-VN locale formatting

## Success Metrics
- Store owner can complete a sale in under 30 seconds
- Inventory accuracy improved vs manual tracking
- Clear visibility into customer debts
- Daily/weekly business performance insights

## Out of Scope (v1)
- Multi-store support
- Employee management
- Supplier management
- Online ordering
- Offline-first PWA capabilities
- Multi-language support
