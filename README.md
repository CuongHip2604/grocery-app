# Grocery Store Management App

A Progressive Web App (PWA) for managing a small grocery store, featuring barcode scanning for instant price lookup, sales recording, customer credit tracking, inventory management, and basic accounting.

## Tech Stack

- **Monorepo**: Nx Workspace
- **Frontend**: Next.js 16 (PWA) + React 19 + Tailwind CSS + shadcn/ui
- **Backend**: NestJS 11 + Prisma ORM
- **Database**: PostgreSQL 15
- **Authentication**: JWT

## Project Structure

```
grocery-app/
├── apps/
│   ├── api/           # NestJS Backend (port 3001)
│   │   └── prisma/    # Database schema & migrations
│   └── web/           # Next.js Frontend (port 3000)
├── libs/
│   └── shared/        # Shared TypeScript types
├── docs/              # Project documentation
└── docker-compose.yml # PostgreSQL container
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL database
docker-compose up -d

# 3. Generate Prisma client
npm run db:generate

# 4. Run database migrations
npm run db:migrate

# 5. Seed sample data
npm run db:seed

# 6. Start development servers
npm run dev
```

### Access

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **Prisma Studio**: `npm run db:studio`

### Default Login

- **Email**: `owner@store.local`
- **Password**: `grocery123`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both API and Web servers |
| `npm run dev:api` | Start only API server |
| `npm run dev:web` | Start only Web server |
| `npm run build` | Build all projects |
| `npm run lint` | Lint all projects |
| `npm run test` | Run all tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database (drop + migrate + seed) |

## Features

### MVP (3-week timeline)

- [x] Project Setup & Infrastructure
- [ ] JWT Authentication
- [ ] Product Management (CRUD, barcode labels)
- [ ] Barcode Scanning & Price Lookup
- [ ] Sales Recording (cash & credit)
- [ ] Customer Credit Tracking
- [ ] Inventory Management with low-stock alerts
- [ ] Basic Accounting (expenses, profit margins)
- [ ] Reports (sales, inventory, debts)
- [ ] Offline Support with sync

## Documentation

See the `docs/` folder for:
- `product-brief.md` - Product requirements
- `architecture.md` - Technical architecture
- `epics-and-stories.md` - User stories & sprint planning
- `wireframes-guide.md` - UI wireframe descriptions

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="postgresql://grocery:grocery_secret_123@localhost:5432/grocery_store"
JWT_SECRET="your-super-secret-jwt-key"
```

## License

Private - All rights reserved
