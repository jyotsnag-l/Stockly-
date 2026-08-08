<div align="center">

# Stockly

### **Run your business with clarity.**

**A unified ERP + CRM operations platform for wholesale and distribution businesses.**

<br/>

[Features](#features) · [Architecture](#architecture) · [Engineering](#engineering-decisions) · [Setup](#local-development) · [Project Structure](#project-structure)

</div>

---

## Overview

**Stockly** is a full-stack ERP + CRM operations portal designed to bring **Sales, Warehouse, Accounts, and Administration** onto a single operational platform.

Wholesale businesses often depend on disconnected spreadsheets and manually reconciled information. Stockly addresses this by connecting customer management, inventory, and sales execution through a shared transactional system.

### The core workflow

```text
Customer & CRM
      │
      ▼
Sales Challan
      │
      ▼
Stock Validation
      │
      ├── Insufficient Stock ──► Reject
      │
      ▼
Atomic Inventory Update
      │
      ▼
Stock Movement Audit
      │
      ▼
PDF Challan / Historical Record
```

The objective is simple:

> **Every team works from the same operational truth.**

---

# Features

## Customer Relationship Management

Stockly provides a lightweight CRM layer for managing customer relationships alongside day-to-day sales operations.

* Lead and active customer tracking
* Customer follow-up notes
* Relationship timeline
* Customer-specific operational context
* Role-controlled customer access

---

## Inventory Management

Inventory is treated as a transactional system rather than a manually maintained quantity field.

* Product catalogue
* SKU and pricing management
* Current stock visibility
* Stock movement history
* Inventory audit trail
* Negative-stock prevention
* Warehouse-specific access controls

---

## Sales Challans

The challan module connects sales execution directly with inventory.

* Create and manage sales challans
* Product and quantity validation
* Real-time stock availability checks
* Transaction-safe stock deduction
* Historical product and pricing snapshots
* Sequential challan records
* **PDF challan export**
* Complete challan detail and audit information

---

## Role-Based Access Control

Access is separated according to operational responsibilities.

| Role          | Access                                                  |
| :------------ | :------------------------------------------------------ |
| **Admin**     | Full system access, including user management           |
| **Sales**     | Customers & Challans — read/write; Products — read-only |
| **Warehouse** | Products & Challans — read/write; Customers — read-only |
| **Accounts**  | Read-only access for operational auditing               |

This ensures that users only interact with the areas required for their role.

---

# Architecture

Stockly follows a layered architecture designed to keep frontend concerns, business logic, and persistence separated.

```text
┌──────────────────────────────────────────────┐
│                  FRONTEND                    │
│             React + TypeScript               │
│                  Vite                        │
│              Tailwind CSS                    │
└──────────────────────┬───────────────────────┘
                       │
                    REST API
                       │
┌──────────────────────▼───────────────────────┐
│                  BACKEND                     │
│          Node.js + Express + TypeScript      │
│                                              │
│  Routes → Middleware → Controllers → DB      │
└──────────────────────┬───────────────────────┘
                       │
                    Prisma
                       │
┌──────────────────────▼───────────────────────┐
│                 DATABASE                     │
│             PostgreSQL / Supabase            │
└──────────────────────────────────────────────┘
```

### Request lifecycle

```text
HTTP Request
     │
     ▼
Route
     │
     ▼
Authentication / Authorization
     │
     ▼
Controller
     │
     ▼
Business Logic
     │
     ▼
Prisma ORM
     │
     ▼
PostgreSQL
     │
     ▼
Response
```

This separation allows the frontend to remain focused on presentation and user interaction while transactional rules remain enforced on the server.

---

# Engineering Decisions

The most important design decisions in Stockly are centered around **data integrity, concurrency, and historical accuracy**.

## 1. Transaction-Safe Stock Confirmation

Confirming a challan is not a single database update.

The system needs to:

1. Read the current inventory
2. Validate requested quantities
3. Reject insufficient stock
4. Deduct inventory
5. Record the stock movement
6. Confirm the challan

These operations are executed inside a **Prisma database transaction**.

```text
BEGIN TRANSACTION
       │
       ├── Read current stock
       │
       ├── Validate quantities
       │
       ├── Insufficient?
       │      └── YES → ROLLBACK
       │
       ├── Deduct stock
       │
       ├── Record stock movement
       │
       └── Confirm challan
              │
              ▼
           COMMIT
```

This protects the system from:

* Negative inventory
* Partial updates
* Inconsistent challan states
* Race conditions during concurrent dispatch operations

The transaction boundary is deliberately placed around the complete inventory-changing operation rather than treating each database update independently.

---

## 2. Immutable Product Snapshots

Product information is mutable.

Prices change.
Names change.
SKUs may change.

Historical transactions should not.

For this reason, every `ChallanItem` stores its own product snapshot:

```text
productNameSnapshot
productSkuSnapshot
unitPriceSnapshot
```

### Example

Current product:

```text
Premium Rice
SKU: RICE-001
Price: ₹1,200
```

Later changed to:

```text
Premium Basmati Rice
SKU: RICE-001B
Price: ₹1,450
```

An existing challan still retains:

```text
Premium Rice
SKU: RICE-001
Price: ₹1,200
```

This prevents changes to the product catalogue from silently modifying historical sales records.

---

## 3. Prisma as the Data Access Layer

Prisma was selected to provide a strongly typed interface between the TypeScript backend and PostgreSQL.

Key benefits:

* Type-safe database queries
* Generated TypeScript client
* Schema-driven development
* Migration management
* Compile-time feedback for database interactions
* Consistent data access patterns

The Prisma schema serves as the central representation of the application's relational data model.

---

## 4. Role-Based Authorization

Authentication and authorization are handled independently from the frontend UI.

The frontend controls what users see, while backend middleware is responsible for enforcing access to protected resources.

```text
User
 │
 ▼
JWT Authentication
 │
 ▼
Role Resolution
 │
 ▼
Authorization Middleware
 │
 ├── Admin
 ├── Sales
 ├── Warehouse
 └── Accounts
 │
 ▼
Protected Controller
```

This ensures that hiding a UI element is not the only layer protecting privileged operations.

---

# Data Integrity Model

Stockly treats inventory as an auditable sequence of movements rather than relying solely on the current stock number.

Conceptually:

```text
Opening Stock
      │
      ├── Purchase / Addition
      │
      ├── Sales / Deduction
      │
      ├── Adjustment
      │
      ▼
Current Stock
```

This makes it possible to reason about **how a quantity changed**, rather than only knowing its latest value.

---

# Technology Stack

| Layer                 | Technology         |
| :-------------------- | :----------------- |
| **Frontend**          | React + TypeScript |
| **Build**             | Vite               |
| **Styling**           | Tailwind CSS       |
| **Backend**           | Node.js + Express  |
| **Language**          | TypeScript         |
| **ORM**               | Prisma             |
| **Database**          | PostgreSQL         |
| **Database Platform** | Supabase           |
| **Authentication**    | JWT                |
| **API Testing**       | Postman            |

---

# Project Structure

```text
Stockly/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   └── src/
│       ├── controllers/
│       │   ├── auth.ts
│       │   ├── challan.ts
│       │   ├── customer.ts
│       │   ├── dashboard.ts
│       │   └── product.ts
│       │
│       ├── middleware/
│       │   └── auth.ts
│       │
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── challan.ts
│       │   ├── customer.ts
│       │   ├── dashboard.ts
│       │   ├── health.ts
│       │   └── product.ts
│       │
│       ├── services/
│       │   ├── cache.ts
│       │   └── db.ts
│       │
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── challans.ts
│       │   ├── client.ts
│       │   ├── customers.ts
│       │   ├── dashboard.ts
│       │   └── products.ts
│       │
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── App.tsx
│       └── main.tsx
│
├── postman_collection.json
├── postman_environment.json
├── package.json
└── README.md
```

---

# Environment Configuration


| Variable       | Purpose                                                       |
| :------------- | :------------------------------------------------------------ |
| `DATABASE_URL` | Pooled Supabase PostgreSQL connection used by the application |
| `DIRECT_URL`   | Direct PostgreSQL connection used for migrations              |
| `JWT_SECRET`   | Secret used to sign and verify JWTs                           |
| `PORT`         | Backend server port                                           |
| `FRONTEND_URL` | Allowed frontend origin for CORS                              |

> **Never commit `.env` files or credentials to the repository.**

---

# Local Development

## Prerequisites

* Node.js 18+
* npm
* PostgreSQL / Supabase database

## 1. Install dependencies

From the repository root:

```bash
npm install
```

## 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Populate the environment variables with your database credentials and JWT secret.

## 3. Generate Prisma Client and apply migrations

```bash
npx prisma migrate dev
```

## 4. Seed the database

```bash
npx prisma db seed
```

The seed script creates the initial users, products, and customers.

## 5. Start the backend

From the repository root:

```bash
npm run dev:backend
```

Backend:

```text
http://localhost:5000
```

## 6. Start the frontend

In a separate terminal:

```bash
npm run dev:frontend
```

Frontend:

```text
http://localhost:5173
```

---

# Demo Accounts

The following accounts are created by the seed script.

| Role      | Email               | Password      |
| :-------- | :------------------ | :------------ |
| Admin     | `admin@erp.com`     | `Password123` |
| Sales     | `sales@erp.com`     | `Password123` |
| Warehouse | `warehouse@erp.com` | `Password123` |
| Accounts  | `accounts@erp.com`  | `Password123` |

> These credentials are intended for local demonstration only.

---

# API Testing

The repository includes ready-to-import Postman configuration:

```text
postman_collection.json
postman_environment.json
```

Import both files into Postman to test the backend API endpoints.

---

# Security & Operational Considerations

Stockly currently implements several baseline controls relevant to an internal business application:

* JWT-based authentication
* Role-based authorization
* Protected backend routes
* Database transactions for inventory-changing operations
* Historical transaction snapshots
* Controlled user creation through seeded roles
* CORS configuration
* Environment-based secret management

The application intentionally keeps authorization enforcement on the backend rather than relying exclusively on frontend route protection.

---

# Simplified / Deferred Features

Some functionality has intentionally been deferred to keep the implementation focused on the core operational workflow.

### User Registration

Public registration is not implemented.

Users and roles are seeded through Prisma to prevent uncontrolled creation of privileged accounts.

### Natural Language Search

Natural-language search was considered but deferred in favor of strengthening the core transactional workflow:

* Inventory integrity
* Atomic stock operations
* Challan consistency
* Role-based access

---

# Known Limitations

* **Session Expiry Notification**
  JWT sessions expire after 8 hours and redirect the user to the login screen without an advance warning.

* **Cloud Deployment**
  The current submission is configured primarily for local execution. Cloud deployment was intentionally omitted to avoid serverless database connection overhead affecting transactional operations.

---

# Roadmap

Potential future improvements include:

* [ ] Low-stock alerts
* [ ] PDF invoice generation
* [ ] Purchase order management
* [ ] Supplier management
* [ ] Payment tracking
* [ ] Advanced sales analytics
* [ ] Automated customer follow-up reminders
* [ ] Email / WhatsApp notifications
* [ ] Advanced reporting
* [ ] Natural-language business search
* [ ] Production cloud deployment

---

# Product Principle

Stockly is built around one operational principle:

<div align="center">

### **One business. One source of truth.**

Sales should know what is available.
Warehouse should know what is being dispatched.
Accounts should know what actually happened.

**Stockly connects all three.**

<br/>

### **Run your business with clarity.**

</div>

---

<div align="center">

**Stockly**

*ERP + CRM Operations Platform for Wholesale & Distribution*

</div>
