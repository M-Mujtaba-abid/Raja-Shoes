# 👟 Raja Shoes — Business Management System

A complete, production-grade Next.js application for managing the Raja Shoes retail business.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Database** | Neon DB (PostgreSQL) |
| **ORM** | Prisma 5 |
| **Styling** | Tailwind CSS |
| **Auth** | JWT via `jose` (httpOnly cookies) |
| **Language** | TypeScript |

---

## 📋 Modules

1. **Authentication** — Simple hardcoded login (no NextAuth)
2. **Inventory Management** — Full CRUD with search & filters
3. **POS / Invoicing** — Multi-item billing with automatic stock deduction
4. **Profit Dashboard** — Per-item profit breakdown with date filters
5. **Khata (Ledger)** — Credit customer management & payment tracking
6. **Expenses** — Cost tracking with net profit calculation
7. **Dashboard** — Real-time KPI overview

---

## ⚡ Quick Start

### 1. Clone / Copy this project

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Neon DB
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the connection string

### 4. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-super-secret-32-char-key-here"
```

Generate a JWT secret:
```bash
openssl rand -base64 32
```

### 5. Push database schema
```bash
npx prisma generate
npx prisma db push
```

### 6. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Login Credentials

| Field | Value |
|-------|-------|
| Username | `rajaShows` |
| Password | `muneebraja` |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/login/     → POST login
│   │   ├── auth/logout/    → POST logout
│   │   ├── products/       → CRUD inventory
│   │   ├── invoices/       → POS + stock deduction
│   │   ├── khata/          → Ledger + payments
│   │   ├── expenses/       → Expense CRUD
│   │   └── dashboard/      → Stats aggregation
│   ├── dashboard/          → KPI overview
│   ├── inventory/          → Stock management
│   ├── pos/                → Point of Sale
│   ├── profit/             → Profit analysis
│   ├── khata/              → Credit ledger
│   ├── expenses/           → Cost tracking
│   └── login/              → Auth page
├── components/
│   └── Sidebar.tsx         → Navigation
└── lib/
    ├── prisma.ts           → DB client
    ├── auth.ts             → JWT utilities
    └── utils.ts            → Helpers
```

---

## 🗄️ Database Schema

```
Product         → Inventory items (costPrice, salePrice, quantity, status)
Invoice         → Sales records (grandTotal, grossProfit, customerName)
InvoiceItem     → Line items per invoice (itemProfit auto-calculated)
KhataAccount    → Credit customer profiles (remainingBalance)
KhataPayment    → Payment history per customer
Expense         → Business costs (SALARY, TAYA_JEE, MUNEEB, CZN, OTHER)
```

---

## 💡 Key Business Logic

### POS Stock Deduction (Atomic Transaction)
When an invoice is created:
1. Validates stock availability for all items
2. Creates invoice + line items
3. Deducts quantities from inventory
4. Updates stock status (IN_STOCK/OUT_OF_STOCK)
5. Optionally creates Khata entry — all in **one Prisma transaction**

### Profit Calculation
```
Item Profit  = (Sale Price − Cost Price) × Quantity
Gross Profit = Sum of all Item Profits
Net Profit   = Gross Profit − Total Expenses
```

### Khata Balance
```
Remaining Balance = Total Bill Amount − Sum of all Payments
Status: PENDING → PARTIAL → CLEARED
```

---

## 🌐 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard:
# DATABASE_URL = your Neon connection string
# JWT_SECRET   = your secret key
```

After deploy, run:
```bash
npx prisma db push
```

---

## 🛠️ Useful Commands

```bash
npm run dev          # Start dev server
npm run db:push      # Push schema to Neon DB
npm run db:studio    # Open Prisma Studio (visual DB editor)
npm run build        # Production build
```
