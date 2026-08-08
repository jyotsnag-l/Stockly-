<div align="center">

# Stockly
### Run your business with clarity

A full-stack ERP + CRM operations portal for wholesale/distribution businesses — built to unify sales, warehouse, and accounts teams around one source of truth.
</div>

---

## Overview

Stockly is a full-stack monorepo — a **Node.js + Express + TypeScript** backend with **Prisma ORM**, and a **Vite + React + TypeScript** frontend styled with **Tailwind CSS**. It provides role-based authentication, an interactive customer relations timeline, product and inventory tracking, and transactional sales challans with built-in stock-safety checks.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Explanation](#architecture-explanation)
- [Environment Variables](#environment-variables)
- [Local Setup Instructions](#local-setup-instructions)
- [Test Login Credentials](#test-login-credentials)
- [Known Limitations & Incomplete Parts](#known-limitations--incomplete-parts)
- [Deployment Notes](#deployment-notes)

## Features

- **Role-based authentication** — JWT-secured access for Admin, Sales, Warehouse, and Accounts roles, each with scoped read/write permissions
- **Customer CRM** — customer records with lead/active/inactive status, search and filtering, and a follow-up notes timeline
- **Product & inventory management** — product catalog with SKU tracking, low-stock alerts, and a full stock movement audit log (IN/OUT, reason, actor, timestamp)
- **Sales challans** — multi-product challans with auto-generated challan numbers, draft/confirm/cancel states, and atomic stock deduction on confirmation
- **Stock safety checks** — inventory can never go negative; insufficient-stock attempts are rejected with a clear error before any data is written

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| ORM / DB | Prisma, PostgreSQL (Supabase) |
| Auth | JWT |
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |

## Architecture Explanation

### 1. Why Prisma?
Prisma provides type-safe query interfaces, an auto-generated client, and managed migration files. Any change to the PostgreSQL schema is synced safely and reflected immediately as strict TypeScript definitions across the backend endpoints.

### 2. Why the Transaction Approach for Stock/Challan Confirmation?
Confirming a challan requires subtracting items from product inventory. To avoid race conditions — e.g. two operators confirming dispatches simultaneously for the same limited-stock item — the checks are wrapped in a **Prisma transaction**. Each product's active stock is queried *inside* the transaction block. If any item has insufficient quantity, the whole transaction rolls back, preventing negative inventory counts.

### 3. Why Snapshot Fields on ChallanItem?
Product pricing, names, and SKUs naturally change over time. Linking challans only to live products would let a later product edit retroactively corrupt old delivery records. Capturing a static snapshot — `productNameSnapshot`, `productSkuSnapshot`, `unitPriceSnapshot` — inside `ChallanItem` at creation time keeps sales valuation and historical records permanently accurate.

### 4. What Was Skipped / Simplified?
- **User profile management** — kept admin-only, no self-service registration; roles are seeded directly via script to keep the user set controlled for this submission.
- **Natural-language search** — deprioritized in favor of the core transactional operations (atomic stock movements and sequential challans).

## Environment Variables

The backend reads the following from `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (pooled, transaction mode, port 6543) — used by the app client |
| `DIRECT_URL` | Supabase PostgreSQL connection string (direct, session mode, port 5432) — used for running migrations |
| `JWT_SECRET` | Random string used to sign and verify auth tokens |
| `PORT` | Port the backend listens on (default `5000`) |
| `FRONTEND_URL` | CORS-allowed origin (default `http://localhost:5173`) |

## Local Setup Instructions

Requires **Node.js v18+** and **npm**.

**1. Install dependencies** (from the root directory)
```bash
npm install
```

**2. Configure environment files**
```bash
cd backend
cp .env.example .env
```
Populate `.env` with your Supabase pooled URL under `DATABASE_URL`, direct URL under `DIRECT_URL`, and a `JWT_SECRET`.

**3. Apply migrations & seed data**
```bash
# Generate Prisma Client & run migrations
npx prisma migrate dev

# Seed default users, products, and customers
npx prisma db seed
```

**4. Start development servers** (from the root directory)
```bash
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173
```

## Test Login Credentials

| Role | Email | Password | Allowed Operations |
|---|---|---|---|
| System Admin | `admin@erp.com` | `Password123` | Full access to all modules, including Users |
| Sales Executive | `sales@erp.com` | `Password123` | Read/write Customers & Challans, read-only Products |
| Warehouse Manager | `warehouse@erp.com` | `Password123` | Read/write Products & Challans, read-only Customers |
| Accountant | `accounts@erp.com` | `Password123` | Read-only auditing access across all tables |

## Known Limitations & Incomplete Parts

- **No PDF export** — challans are viewable on the detail panel UI only, not downloadable as PDF
- **Silent session expiry** — token expiry (8h) redirects to login without an advance-warning notification

## Deployment Notes

The application is configured to run locally. Cloud hosting was skipped for this submission because serverless database pool connections introduce cold-start latency that can interfere with the atomic transaction checks in the challan-confirmation flow.
