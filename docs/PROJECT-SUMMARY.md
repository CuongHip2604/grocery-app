# Grocery Store Management App - Project Summary

**Status**: Ready for Development
**Created**: January 26, 2026

---

## Project Overview

A Progressive Web App (PWA) for managing a small, owner-operated grocery store with 20-30 SKUs.

### Key Features (MVP)
1. **Barcode Scanning** - UPC/EAN scanning + custom labels
2. **Price Lookup** - Instant price display on scan
3. **Sales Recording** - Cash and credit transactions
4. **Customer Credit** - Track accounts receivable (what customers owe)
5. **Inventory Management** - Stock tracking with low-stock alerts
6. **Basic Accounting** - Expenses, profit margins, tax prep
7. **Reports** - Printable/exportable reports

### Out of Scope (MVP)
- Shipment/delivery management
- Full itemized receipts
- Multi-user support
- Cloud deployment

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Nx Workspace |
| Frontend | Next.js 16 (PWA) + React 19 |
| UI | shadcn/ui + Tailwind CSS |
| Backend | NestJS 11 |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Auth | JWT |
| Offline | IndexedDB + sync queue |
| Barcode | ZXing-js |
| Labels | jspdf (PDF generation) |

---

## Project Structure

```
grocery-app/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Database schema
│   │   │   └── seed.ts          # Sample data
│   │   └── src/
│   └── web/                 # Next.js Frontend
│       ├── app/
│       ├── tailwind.config.js
│       └── postcss.config.js
├── libs/
│   └── shared/              # Shared TypeScript types
│       └── src/lib/types/   # DTOs and interfaces
├── docs/                    # Documentation
├── docker-compose.yml       # PostgreSQL container
├── .env                     # Environment variables
└── package.json
```

---

## Database Entities

- **User** - Single owner authentication
- **Category** - Product categories
- **Product** - Product catalog with barcode
- **Inventory** - Stock levels
- **Customer** - Customer registry
- **Sale** - Transaction records
- **SaleItem** - Line items per sale
- **CreditLedger** - Customer credit tracking
- **Expense** - Business expenses
- **SupplierPayment** - Accounts payable

---

## API Modules

| Module | Endpoints |
|--------|-----------|
| Auth | login, refresh, logout |
| Products | CRUD, barcode lookup, label generation |
| Sales | create, list, void, daily summary |
| Customers | CRUD, search, ledger, payments |
| Inventory | list, low-stock, adjust, restock |
| Accounts | receivable, payable, expenses |
| Reports | sales, inventory, profit-loss, export |
| Sync | push, pull (offline support) |

---

## Getting Started

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Generate Prisma client
npm run db:generate

# 3. Run migrations
npm run db:migrate

# 4. Seed sample data
npm run db:seed

# 5. Start development
npm run dev
```

### Default Login
- Email: `owner@store.local`
- Password: `grocery123`

---

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + Web |
| `npm run dev:api` | Start API only |
| `npm run dev:web` | Start Web only |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Prisma GUI |

---

## Timeline

**3 weeks MVP** - All Priority 1 features

### Week 1: Foundation
- Project setup (Nx, Prisma, Tailwind)
- Authentication (JWT)
- Product management

### Week 2: Core Features
- Barcode scanning
- Sales recording
- Custom label printing

### Week 3: Complete MVP
- Customer credit management
- Inventory tracking
- Basic accounting

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | Database schema |
| `apps/api/prisma/seed.ts` | Sample data |
| `libs/shared/src/lib/types/index.ts` | TypeScript interfaces |
| `apps/web/tailwind.config.js` | Tailwind + shadcn config |
| `apps/web/app/global.css` | Global styles |
| `docker-compose.yml` | PostgreSQL setup |
| `.env` | Environment config |

---

*Full documentation (product-brief.md, architecture.md, epics-and-stories.md) can be regenerated using the BMAD workflows.*
