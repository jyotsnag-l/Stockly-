# Stockly
> Run your business with clarity

A full-stack monorepo featuring a Node.js + Express + TypeScript backend with Prisma ORM, and a Vite + React + TypeScript frontend styled with Tailwind CSS. It provides role-based authentication, interactive customer relations timeline logs, product catalogs, and transactional sales challans with safety stock checks.

---

## Architecture Explanation

### 1. Why Prisma?
Prisma provides type-safe query interfaces, auto-generated client objects, and automated migration files. This ensures that any changes to our PostgreSQL schema are synced safely and reflected immediately as strict TypeScript definitions across our backend endpoints.

### 2. Why the Transaction Approach for Stock/Challan Confirmation?
Confirming a challan requires subtracting items from product inventory. To avoid race conditions (e.g. two operators confirming dispatches simultaneously for the same limited stock item), we wrap the checks in a **Prisma transaction**. We query the product's active stock *inside* the transaction block. If any item has insufficient quantities, the transaction rolls back, preventing negative inventory counts.

### 3. Why Snapshot Fields on ChallanItem?
Product pricing, names, and SKUs naturally change over time. If we only linked challans to live products, editing a product's price or description would retroactively corrupt old delivery invoices. By capturing a static snapshot of `productNameSnapshot`, `productSkuSnapshot`, and `unitPriceSnapshot` inside `ChallanItem` at creation time, our sales valuation and records remain permanently accurate.

### 4. What Was Skipped / Simplified?
- **User profiles management**: Kept admin-only and bypassed user registration forms, because user roles (Admin, Sales, Warehouse, Accounts) are seeded directly via a script to maintain security.
- **Natural Language Search (nl-search)**: Bypassed to prioritize core transactional operations (atomic stock movements and sequential challans).

---

## Environment Variables

The backend uses a `.env` file containing the following variables:
* `DATABASE_URL`: Connection string for Supabase PostgreSQL (pooled, transaction mode, port 6543) used by the application client.
* `DIRECT_URL`: Connection string for Supabase PostgreSQL (direct, session mode, port 5432) used for running schema migrations.
* `JWT_SECRET`: Random string used to sign and verify authorization tokens.
* `PORT`: Port number the backend server listens on (defaults to `5000`).
* `FRONTEND_URL`: CORS allowed origin (defaults to `http://localhost:5173`).

---

## Local Setup Instructions

Ensure you have **Node.js (v18+)** and **npm** installed.

### 1. Install Dependencies
From the root directory:
```bash
npm install
```

### 2. Configure Environment Files
Navigate to the `backend/` folder, copy `.env.example` to `.env`, and populate it:
```bash
cd backend
cp .env.example .env
```
*(Enter your Supabase database pooled URL under DATABASE_URL, direct URL under DIRECT_URL, and set a JWT_SECRET).*

### 3. Apply Migrations & Seed Data
Generate client models and seed default users, products, and customers into your database:
```bash
# Generate Prisma Client & Run Migrations
npx prisma migrate dev

# Seed Database
npx prisma db seed
```

### 4. Start Development Servers
From the root directory, start the servers:
```bash
# Run Backend (localhost:5000)
npm run dev:backend

# Run Frontend (localhost:5173)
npm run dev:frontend
```

---

## Test Login Credentials

| Role | Email | Password | Allowed Operations |
|---|---|---|---|
| **System Admin** | `admin@erp.com` | `Password123` | Full access to all modules, including Users |
| **Sales Executive** | `sales@erp.com` | `Password123` | Read/Write Customers & Challans, Read-Only Products |
| **Warehouse Manager** | `warehouse@erp.com` | `Password123` | Read/Write Products & Challans, Read-Only Customers |
| **Accountant** | `accounts@erp.com` | `Password123` | Read-Only auditing access across all tables |

---

## Known Limitations & Incomplete Parts
- **No PDF Export**: Challans cannot be downloaded as PDFs (currently viewed on the detail panel UI).
- **Session Expiry Warns**: Token expiry (8h) forces a redirect to the login page without displaying an advance notification.

---

## Deployment Notes
The application is configured to run locally. We skipped cloud hosting for the submission package because serverless database pool connections introduce cold-start latency checks that slow down atomic transactions.
