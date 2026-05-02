# AccountingHub

> A modern, cloud-based accounting and invoicing platform built for small and medium-sized businesses.

AccountingHub is an open-source web application inspired by leading accounting platforms such as **Visma e-conomic**, **Xero**, **QuickBooks Online**, **FreshBooks**, **Wave**, **Zoho Books**, **Sage Business Cloud**, **Holded**, **InvoiceXpress**, **Moloni**, and **PHC Go** — combining their best ideas into a single, warm, and approachable product built with modern technologies.

---

## Features

### 💼 Business Management
- **Customers** — full customer directory with invoice history and open balance
- **Suppliers** — supplier directory linked to expenses
- **Products & Services** — catalogue with VAT rates, units, categories and stock

### 🧾 Invoicing & Documents
- **Invoices** — create Invoices, Quotes, Pro-Formas and Credit Notes
- **Sequential document numbering** — automatic, immutable, per-series (e.g. `FT2026/0001`)
- **Status workflow** — Draft → Issued → Partially Paid → Paid / Overdue → Cancelled
- **Real-time line item calculation** — subtotals, VAT per rate, discount support
- **Payment registration** — Bank Transfer, Card, Cash, MBWay, Check

### 💸 Expenses
- Supplier purchase registration with VAT line breakdown
- Status tracking: Pending → Paid → Cancelled
- One-click mark-as-paid

### 📊 Accounting
- **Chart of Accounts** — SNC (Portuguese Accounting Standards) import with one click
- **Journal** — double-entry bookkeeping with balance validation
- **Bank accounts** — multi-account management with transaction tracking

### 📈 Reports
- **Profit & Loss** — revenue vs expenses with breakdown chart
- **Trial Balance** — debit/credit balance per account with balanced check
- **VAT Report** — output vs input VAT by rate, quarterly or annual, with payable amount

### 🔐 Authentication & Multi-tenancy
- JWT + refresh tokens stored in httpOnly cookies
- Every company's data is fully isolated (multi-tenant)
- Role-based access: **Admin**, **Accountant**, **Viewer**
- Register a new company in seconds

### 🎨 Design
- Warm, modern UI — charcoal + orange + cream palette
- Sidebar navigation with grouped sections
- Responsive data tables with search, sort, pagination and row hover
- Status badges, toast notifications, confirmation dialogs
- Cream page background, white cards, orange focus rings

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Static typing |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** (Radix UI) | Accessible component primitives |
| **react-hook-form** | Form state management |
| **Zod** | Schema validation |
| **Recharts** | Data visualisation (bar charts, pie charts) |
| **Zustand** | Global state management |
| **Axios** | HTTP client with interceptors |
| **React Router v6** | Client-side routing |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Runtime |
| **Express** | HTTP framework |
| **TypeScript** | Static typing |
| **Prisma ORM** | Type-safe database access |
| **PostgreSQL 15** | Primary database |
| **bcryptjs** | Password hashing |
| **jsonwebtoken** | JWT authentication |
| **Nodemailer** | Email delivery |
| **Puppeteer** | PDF generation |
| **Zod** | Request validation |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker & Docker Compose** | Containerisation |
| **PostgreSQL 15** (Docker) | Database container |
| **pgAdmin 4** (Docker) | Database UI (port 5050) |
| **Homebrew PostgreSQL** | Local development alternative |

---

## Project Structure

```
accountinghub/
├── .env.example              ← copy this to backend/.env and fill in values
├── .gitignore
├── docker-compose.yml
├── README.md
│
├── frontend/                 ← React + TypeScript + Vite
│   ├── public/
│   │   └── logo.svg
│   └── src/
│       ├── components/
│       │   ├── layout/       (Sidebar, Header, AppLayout)
│       │   ├── shared/       (DataTable, Toaster)
│       │   └── ui/           (Button, Badge, Card, Input, Dialog…)
│       ├── pages/
│       │   ├── Auth/         (Login, Register)
│       │   ├── Dashboard/
│       │   ├── Customers/
│       │   ├── Suppliers/
│       │   ├── Products/
│       │   ├── Invoices/     (list, create, detail)
│       │   ├── Expenses/
│       │   ├── Payments/
│       │   ├── Accounts/
│       │   ├── Journal/
│       │   ├── Reports/
│       │   ├── Bank/
│       │   └── Settings/
│       ├── services/         (API layer)
│       ├── store/            (Zustand — auth, theme)
│       ├── hooks/            (useToast)
│       ├── lib/              (utils, cn)
│       └── types/            (shared TypeScript types)
│
└── backend/                  ← Node.js + Express + Prisma
    ├── prisma/
    │   ├── schema.prisma     ← all 17 database models
    │   └── migrations/       ← committed migration history
    └── src/
        ├── app.ts
        ├── server.ts
        ├── lib/prisma.ts
        ├── middleware/       (auth, errorHandler)
        └── modules/
            ├── auth/
            ├── companies/
            ├── users/
            ├── customers/
            ├── suppliers/
            ├── products/
            ├── invoices/
            ├── payments/
            ├── expenses/
            ├── accounts/
            ├── journal/
            ├── reports/
            └── bank/
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop **or** PostgreSQL 15 installed locally
- npm

### 1 — Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/accountinghub.git
cd accountinghub
```

### 2 — Configure environment variables
```bash
cp .env.example backend/.env
```
Open `backend/.env` and fill in:
```env
DATABASE_URL=postgresql://YOUR_USER@localhost:5432/accountinghub
JWT_SECRET=generate_a_long_random_string
JWT_REFRESH_SECRET=generate_another_long_random_string
```

### 3 — Start the database

**Option A — Docker:**
```bash
docker compose up -d postgres
```

**Option B — Homebrew (macOS):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb accountinghub
```

### 4 — Install dependencies and run migrations
```bash
# Backend
cd backend
npm install
npx prisma migrate dev
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 5 — Start the development servers
```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and register your company.

---

## Database Models

The schema contains 17 models:

`Company` · `User` · `Customer` · `Supplier` · `Product` · `TaxRate` · `DocumentSeries` · `Invoice` · `InvoiceLine` · `Payment` · `Expense` · `ExpenseLine` · `Account` · `JournalEntry` · `JournalLine` · `BankAccount` · `BankTransaction`

All amounts are stored as `Decimal(10,2)`. Soft deletes use `deletedAt`. Every record is scoped to a `companyId`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create company + admin user |
| POST | `/api/auth/login` | Authenticate |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Clear cookies |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/customers` | List / create |
| GET/PUT/DELETE | `/api/customers/:id` | Detail / update / soft delete |
| GET/POST | `/api/suppliers` | List / create |
| GET/POST | `/api/products` | List / create |
| GET/POST | `/api/invoices` | List / create |
| POST | `/api/invoices/:id/issue` | Issue a draft |
| POST | `/api/invoices/:id/cancel` | Cancel |
| POST | `/api/invoices/:id/payment` | Register payment |
| GET/POST | `/api/expenses` | List / create |
| POST | `/api/expenses/:id/pay` | Mark as paid |
| GET | `/api/accounts` | Chart of accounts |
| POST | `/api/accounts/seed-snc` | Import SNC standard accounts |
| GET/POST | `/api/journal` | List / create entries |
| GET | `/api/reports/dashboard` | KPI data + chart |
| GET | `/api/reports/profit-loss` | P&L statement |
| GET | `/api/reports/trial-balance` | Trial balance |
| GET | `/api/reports/vat` | VAT report |
| GET/POST | `/api/bank/accounts` | Bank accounts |
| GET/POST | `/api/bank/accounts/:id/transactions` | Transactions |
| GET | `/api/tax-rates` | VAT rates |

---

## Business Rules

1. Invoice numbers are **sequential, immutable and unique** per document series
2. Issued invoices **cannot be edited** — cancel and re-issue or raise a credit note
3. VAT is **calculated per line** and summarised by rate in totals
4. Every API call is **scoped to the authenticated company** (multi-tenant isolation)
5. **Soft deletes** — records are never hard-deleted; `deletedAt` is set instead
6. All amounts stored as `Decimal(10,2)` — no floating-point rounding errors
7. Journal entries must **balance**: `Σ debits === Σ credits`
8. **Role permissions**: ADMIN (full), ACCOUNTANT (read/write), VIEWER (read only)

---

## Roadmap

- [ ] PDF invoice generation (Puppeteer)
- [ ] Email delivery of invoices (Nodemailer)
- [ ] CSV / OFX bank statement import for reconciliation
- [ ] Excel export for reports
- [ ] Company logo upload
- [ ] Dark mode
- [ ] Multi-currency support
- [ ] AT (Autoridade Tributária) SAFT-PT export

---

## License

Copyright © 2026 **João Vilas-Boas Correia** ([joaopns3@gmail.com](mailto:joaopns3@gmail.com))

**All rights reserved.**

This software and its source code are provided for **personal, educational and portfolio purposes only**.

You may **not**:
- Copy, reproduce or distribute this software or any substantial portion of it
- Use this software or any part of it for **commercial or for-profit purposes**
- Sub-license, sell or offer this software as a service
- Remove or alter this copyright notice

You **may**:
- View and study the source code
- Fork the repository for personal, non-commercial learning purposes
- Submit pull requests to improve the project

> **No warranties are given.** This software is provided "as is" without warranty of any kind.
>
> For licensing enquiries, contact [joaopns3@gmail.com](mailto:joaopns3@gmail.com).
