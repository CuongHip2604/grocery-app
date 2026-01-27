# Architecture Document: Grocery Store Management App

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js 16 (PWA)                        │   │
│  │  - React 19 with Server Components                   │   │
│  │  - TailwindCSS for styling                           │   │
│  │  - React Query for data fetching                     │   │
│  │  - Barcode scanning (@zxing/browser)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                     HTTP/REST API                            │
│                            │                                 │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                         Server                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              NestJS 11 API                           │   │
│  │  - JWT Authentication                                │   │
│  │  - RESTful endpoints                                 │   │
│  │  - Validation (class-validator)                      │   │
│  │  - File upload (Multer)                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                      Prisma ORM                              │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure (Nx Monorepo)

```
grocery-app/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # Database migrations
│   │   │   └── seed.ts         # Seed data
│   │   └── src/
│   │       ├── app/            # App module
│   │       ├── auth/           # Authentication
│   │       ├── products/       # Products & categories
│   │       ├── inventory/      # Inventory management
│   │       ├── sales/          # Sales/POS
│   │       ├── customers/      # Customers & credit
│   │       ├── accounting/     # Reports & expenses
│   │       └── prisma/         # Prisma service
│   │
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── (protected)/    # Authenticated routes
│       │   │   ├── dashboard/
│       │   │   ├── products/
│       │   │   ├── inventory/
│       │   │   ├── scan/       # POS
│       │   │   ├── sales/
│       │   │   ├── customers/
│       │   │   ├── categories/
│       │   │   └── reports/
│       │   ├── login/
│       │   └── api/            # API proxy routes
│       ├── components/
│       │   ├── ui/             # Reusable UI components
│       │   ├── barcode-scanner.tsx
│       │   ├── bottom-nav.tsx
│       │   └── settings-drawer.tsx
│       └── lib/
│           ├── api.ts          # API client
│           ├── hooks.ts        # React Query hooks
│           ├── auth-context.tsx
│           └── utils.ts
│
├── libs/
│   └── shared/                 # Shared types
│       └── src/lib/types/
│
└── docs/                       # Documentation
```

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │   Category   │     │   Product    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │◄────│ id (PK)      │
│ email        │     │ name         │     │ barcode      │
│ passwordHash │     │ description  │     │ name         │
│ createdAt    │     │ createdAt    │     │ description  │
│ updatedAt    │     │ updatedAt    │     │ price        │
└──────────────┘     └──────────────┘     │ cost         │
                                          │ categoryId   │
                                          │ reorderLevel │
┌──────────────┐     ┌──────────────┐     │ isCustomLabel│
│   Customer   │     │    Sale      │     └──────┬───────┘
├──────────────┤     ├──────────────┤            │
│ id (PK)      │◄────│ id (PK)      │            │
│ name         │     │ customerId   │     ┌──────┴───────┐
│ phone        │     │ totalAmount  │     │  Inventory   │
│ email        │     │ paymentType  │     ├──────────────┤
│ address      │     │ status       │     │ id (PK)      │
│ notes        │     │ createdAt    │     │ productId    │
│ createdAt    │     └──────┬───────┘     │ quantity     │
└──────┬───────┘            │             │ lastUpdated  │
       │             ┌──────┴───────┐     └──────────────┘
       │             │   SaleItem   │
┌──────┴───────┐     ├──────────────┤
│CreditLedger  │     │ id (PK)      │
├──────────────┤     │ saleId       │
│ id (PK)      │     │ productId    │
│ customerId   │     │ quantity     │
│ saleId       │     │ unitPrice    │
│ type         │     │ subtotal     │
│ amount       │     └──────────────┘
│ balance      │
│ description  │     ┌──────────────┐
│ createdAt    │     │   Expense    │
└──────────────┘     ├──────────────┤
                     │ id (PK)      │
                     │ category     │
                     │ amount       │
                     │ description  │
                     │ date         │
                     │ createdAt    │
                     └──────────────┘
```

## API Design

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - List products (with pagination, search)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/barcode/:barcode` - Get product by barcode
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk-import` - Bulk import products
- `POST /api/products/import-excel` - Import from Excel file

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Inventory
- `GET /api/inventory` - List inventory
- `GET /api/inventory/summary` - Inventory summary
- `GET /api/inventory/low-stock` - Low stock items
- `PUT /api/inventory/product/:id/adjust` - Adjust stock
- `POST /api/inventory/product/:id/restock` - Restock product

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/void` - Void sale
- `GET /api/sales/today` - Today's sales
- `GET /api/sales/summary` - Daily summary

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer
- `GET /api/customers/:id/ledger` - Customer ledger
- `POST /api/customers/:id/payments` - Record payment
- `GET /api/customers/debtors` - Debtors report
- `GET /api/customers/search` - Search customers

### Accounting
- `GET /api/accounting/dashboard` - Dashboard data
- `GET /api/accounting/expenses` - List expenses
- `POST /api/accounting/expenses` - Create expense
- `GET /api/accounting/reports/profit-loss` - P&L report
- `GET /api/accounting/reports/sales` - Sales report

## Authentication Flow

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Client  │                    │   API   │                    │   DB    │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │  POST /auth/login            │                              │
     │  {email, password}           │                              │
     │─────────────────────────────►│                              │
     │                              │  Find user by email          │
     │                              │─────────────────────────────►│
     │                              │◄─────────────────────────────│
     │                              │  Verify password             │
     │                              │  Generate JWT tokens         │
     │  {accessToken, refreshToken, │                              │
     │   expiresIn}                 │                              │
     │◄─────────────────────────────│                              │
     │                              │                              │
     │  Store tokens in localStorage│                              │
     │                              │                              │
     │  GET /api/products           │                              │
     │  Authorization: Bearer token │                              │
     │─────────────────────────────►│                              │
     │                              │  Validate JWT                │
     │                              │  Process request             │
     │◄─────────────────────────────│                              │
     │                              │                              │
     │  [Token expired]             │                              │
     │  POST /auth/refresh          │                              │
     │  {refreshToken}              │                              │
     │─────────────────────────────►│                              │
     │                              │  Validate refresh token      │
     │  {accessToken, expiresIn}    │                              │
     │◄─────────────────────────────│                              │
     │                              │                              │
```

## Frontend State Management

### React Query
- All API data fetching uses React Query
- Automatic caching and refetching
- Query invalidation on mutations

### Auth Context
- Manages user authentication state
- Handles login/logout
- Stores tokens in localStorage

### Token Refresh Strategy
- Request interceptor checks token expiry before each request
- If token expired, all requests wait for single refresh
- Multiple concurrent requests share same refresh promise
- Response interceptor handles 401 as fallback

## Security Considerations

1. **Authentication**
   - JWT tokens with 1-day expiry
   - Refresh tokens with 7-day expiry
   - Passwords hashed with bcrypt (12 rounds)

2. **API Security**
   - All routes (except auth) require JWT
   - Input validation with class-validator
   - CORS configured for frontend origin

3. **Data Protection**
   - Environment variables for secrets
   - .env files excluded from git
   - No sensitive data in logs

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │   NestJS     │  │  PostgreSQL  │      │
│  │   (web)      │  │   (api)      │  │   (db)       │      │
│  │   :4200      │  │   :3001      │  │   :5432      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Future Considerations

1. **Offline Support**
   - Service worker for PWA
   - IndexedDB for offline data
   - Sync queue for offline mutations

2. **Multi-store Support**
   - Store entity with user relationships
   - Data isolation per store

3. **Performance**
   - Redis caching for frequent queries
   - Database indexing optimization
   - Image optimization for product photos
