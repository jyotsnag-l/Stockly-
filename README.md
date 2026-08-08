<div align="center">

# Stockly

**Run your business with clarity.**

</div>

**Stockly** is a full-stack **ERP + CRM operations portal** built for wholesale and distribution businesses.

It brings **Sales, Warehouse, Accounts, and Admin** onto one shared system — replacing disconnected spreadsheets with a single source of truth for customers, inventory, and sales operations.

---

##  What is Stockly?

Stockly connects the complete daily sales workflow:

```text
┌─────────────┐
│   Customer  │
└──────┬──────┘
       ↓
┌─────────────┐
│     CRM     │  → Leads, follow-ups, relationship history
└──────┬──────┘
       ↓
┌─────────────┐
│ Sales Order │
└──────┬──────┘
       ↓
┌─────────────┐
│   Challan   │  → Delivery note with product snapshots
└──────┬──────┘
       ↓
┌─────────────┐
│ Stock Check │  → Prevents overselling
└──────┬──────┘
       ↓
┌─────────────┐
│ Stock Update│  → Atomic inventory movement
└──────┬──────┘
       ↓
┌─────────────┐
│   Audit     │  → Complete stock movement history
└─────────────┘
```

The goal is simple:

> **Sales knows what is in stock. Warehouse knows what is being sold. Accounts sees what actually happened.**

---

# 🚀 Core Features

### 👥 Customer CRM

* Lead and active customer tracking
* Customer relationship timeline
* Follow-up notes and interaction history
* Customer-specific operational context

### 📦 Inventory Management

* Product catalogue
* Real-time stock quantities
* Stock movement tracking
* Complete inventory audit trail
* Protection against negative inventory

### 🧾 Sales Challans

* Create and manage sales challans
* Stock validation before confirmation
* Automatic inventory deduction
* Sequential challan records
* Historical product and pricing snapshots

### 🔐 Role-Based Access

Different teams get access to only the operations they need.

| Role                  | Access                                   |
| --------------------- | ---------------------------------------- |
| **System Admin**      | Full system access + user management     |
| **Sales Executive**   | Customers & Challans, read-only Products |
| **Warehouse Manager** | Products & Challans, read-only Customers |
| **Accountant**        | Read-only auditing access                |

---

# 🛡️ Built for Data Integrity

Stockly isn't just a collection of CRUD screens.

The most critical operations are designed around **transactional safety and historical accuracy**.

### 1. Atomic Stock Transactions

When a challan is confirmed, Stockly needs to:

1. Check available stock
2. Validate every item
3. Deduct inventory
4. Record the stock movement
5. Complete the challan confirmation

These operations run inside a **Prisma database transaction**.

```text
Challan Confirmation
        │
        ▼
┌──────────────────────┐
│ Start Transaction    │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Check Current Stock  │
└──────────┬───────────┘
           │
      ┌────┴────┐
      │ Enough? │
      └────┬────┘
       Yes │ No
           │  └──────────────► ROLLBACK
           ▼
┌──────────────────────┐
│ Deduct Inventory     │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Record Stock Movement│
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Confirm Challan      │
└──────────────────────┘
```

This prevents situations such as:

* Negative stock
* Partial inventory updates
* Inconsistent challans
* Race conditions during simultaneous dispatches

---

### 2. Historical Product Snapshots

Products change.

Prices change.
Names change.
SKUs change.

Historical challans shouldn't.

Instead of relying only on the current Product record, each `ChallanItem` stores:

```text
productNameSnapshot
productSkuSnapshot
unitPriceSnapshot
```

So if a product changes from:

```text
Product: Premium Rice
SKU: RICE-001
Price: ₹1,200
```

to:

```text
Product: Premium Basmati Rice
SKU: RICE-001B
Price: ₹1,450
```

an old challan still retains the original information.

**Result:** historical sales records remain accurate and auditable.

---

# 🏗️ Architecture

Stockly follows a clean full-stack architecture:

```text
                    ┌─────────────────────┐
                    │     React Frontend  │
                    │  Vite + TypeScript  │
                    └──────────┬──────────┘
                               │
                          REST API
                               │
                    ┌──────────▼──────────┐
                    │   Express Backend   │
                    │ Node + TypeScript   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Prisma ORM        │
                    │ Type-safe queries   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ PostgreSQL /        │
                    │ Supabase Database   │
                    └─────────────────────┘
```

### Backend flow

```text
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Prisma
  ↓
PostgreSQL
```

### Frontend structure

```text
Pages
  ↓
Components / Context
  ↓
API Layer
  ↓
Backend REST APIs
```

---

# 🧰 Tech Stack

| Layer                 | Technology         |
| --------------------- | ------------------ |
| **Frontend**          | React + TypeScript |
| **Build Tool**        | Vite               |
| **Styling**           | Tailwind CSS       |
| **Backend**           | Node.js + Express  |
| **Language**          | TypeScript         |
| **ORM**               | Prisma             |
| **Database**          | PostgreSQL         |
| **Database Platform** | Supabase           |
| **Authentication**    | JWT                |
| **API Testing**       | Postman            |

---

# 📁 Project Structure

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
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── api/
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

# 🔐 Role-Based Access

Stockly uses role-based authentication to keep operational responsibilities separated.

### System Admin

**Full access**

* Users
* Customers
* Products
* Challans
* Dashboard

### Sales Executive

**Customer & sales focused**

* Create/update customers
* Manage follow-ups
* Create/manage challans
* View products

### Warehouse Manager

**Inventory focused**

* Manage products
* Manage stock
* Process challans
* View customers

### Accountant

**Audit focused**

* Read-only access
* View customers
* View products
* Audit challans and operational records

---

# 🧠 Why Prisma?

Prisma provides:

* Type-safe database queries
* Auto-generated TypeScript client
* Schema-driven development
* Migration management
* Better consistency between the database and backend types

This means database changes can be reflected safely across the backend rather than relying on loosely typed SQL queries.

---

### Variable purpose

| Variable       | Purpose                                   |
| -------------- | ----------------------------------------- |
| `DATABASE_URL` | Pooled Supabase PostgreSQL connection     |
| `DIRECT_URL`   | Direct database connection for migrations |
| `JWT_SECRET`   | Signs and verifies JWT tokens             |
| `PORT`         | Backend server port                       |
| `FRONTEND_URL` | Allowed frontend origin for CORS          |

> **Never commit your actual `.env` file or database credentials to GitHub.**

---

# 💻 Local Setup

### Prerequisites

* Node.js **18+**
* npm
* PostgreSQL / Supabase database

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Stockly
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cd backend
cp .env.example .env
```

Add your database credentials and JWT secret.

### 4. Generate Prisma Client & run migrations

```bash
npx prisma migrate dev
```

### 5. Seed the database

```bash
npx prisma db seed
```

This creates the default users, products, and customers.

### 6. Start the backend

From the root:

```bash
npm run dev:backend
```

Backend:

```text
http://localhost:5000
```

### 7. Start the frontend

In another terminal:

```bash
npm run dev:frontend
```

Frontend:

```text
http://localhost:5173
```

---

# 🔑 Test Accounts

| Role      | Email               | Password      |
| --------- | ------------------- | ------------- |
| Admin     | `admin@erp.com`     | `Password123` |
| Sales     | `sales@erp.com`     | `Password123` |
| Warehouse | `warehouse@erp.com` | `Password123` |
| Accounts  | `accounts@erp.com`  | `Password123` |

> These credentials are intended for local/demo use only.

---

# 📮 API Testing

A ready-to-use Postman collection and environment are included:

```text
postman_collection.json
postman_environment.json
```

Import both into Postman to test the backend APIs.

---

# 📌 Simplifications

To keep the project focused on its core transactional workflow, some features were intentionally simplified.

### User Management

User accounts are seeded through Prisma rather than allowing public registration.

This prevents uncontrolled creation of privileged roles such as:

* Admin
* Warehouse
* Accounts

### Natural Language Search

An experimental natural-language search feature was intentionally left out of the final implementation to prioritize:

* Atomic stock operations
* Challan integrity
* Role-based access
* Core ERP workflows

---

# ⚠️ Known Limitations

* **Session Expiry Notification**
  JWT tokens expire after 8 hours. The application redirects users to login after expiry but does not currently provide an advance warning.

* **Local Deployment**
  The submission is configured primarily for local execution rather than cloud deployment.

---

# 🔮 Future Improvements

Potential extensions include:

* Low-stock alerts
* Advanced sales analytics
* Invoice generation
* Payment tracking
* Supplier management
* Purchase order workflows
* Email/WhatsApp follow-up reminders
* Advanced reporting dashboards
* Natural-language business search
* Cloud deployment

---

# 🎯 Design Philosophy

Stockly is built around one principle:

> **Every team should work from the same operational truth.**

Instead of:

```text
Sales → Spreadsheet
Warehouse → Spreadsheet
Accounts → Spreadsheet
        ↓
   Manual Reconciliation
```

Stockly provides:

```text
             ┌───────────┐
             │  Stockly  │
             └─────┬─────┘
       ┌───────────┼───────────┐
       ↓           ↓           ↓
    Sales      Warehouse    Accounts
       │           │           │
       └───────────┼───────────┘
                   ↓
          One Source of Truth
```

**Stockly — Run your business with clarity.**
