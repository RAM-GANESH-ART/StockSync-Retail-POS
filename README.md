# ⚡ StockSync — Retail Inventory & POS Billing Application

[![Next.js 15](https://img.shields.io/badge/Next.js-15.2.0-black?logo=next.js)](https://nextjs.org/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6.4.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?logo=vitest)](https://vitest.dev/)
[![CI Quality Gate](https://img.shields.io/badge/CI-Automated%20Quality%20Gate-success?logo=github-actions)](https://github.com/RAM-GANESH-ART/StockSync-Retail-POS)

StockSync is a full-stack, enterprise-grade retail inventory management and Point-of-Sale (POS) billing web application built with **Next.js 15 (App Router)**, **Prisma 6 (SQLite)**, **NextAuth**, and **Custom Vanilla CSS**.

---

## 🌟 Key Highlights

- **⚡ Fast POS Billing Register**: Instant product lookup by barcode scanner, SKU, or name; keyboard shortcuts; quantity adjustments; tax & discount calculation.
- **💳 Multi-Payment Checkout**: Process payments via Cash (with customer cash tendered & live change return calculator), Card EDC terminal, or Counter UPI QR code scanning.
- **🧾 Thermal Receipt Generator**: Formatted specifically for standard 80mm POS thermal receipt printers with one-click print support, tax breakdowns, and rendered barcodes.
- **📦 Intelligent Stock Synchronization**: Real-time stock decrementing powered by atomic Prisma database transactions to prevent overselling.
- **⚠️ Low-Stock Threshold Badges**: Automatic warnings for products dropping below minimum safety stock levels with 1-click quick replenishment.
- **📊 Executive Analytics Dashboard**: Live sales revenue, 7-day transaction velocity charts (Recharts), top-selling SKUs, and transaction history.
- **🛡️ Role-Based Access Control**: Separate privileges for **Store Manager (Admin)** and **POS Operator (Cashier)** with 1-click demo login buttons.
- **📁 Clean Architecture**: Clear separation between `src/frontend/` (UI components, modals, styles) and `src/backend/` (Prisma DB, services, auth, Zod validation). See [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/RAM-GANESH-ART/StockSync-Retail-POS.git
cd StockSync-Retail-POS
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="stocksync_super_secret_session_key_2026"
NEXTAUTH_URL="http://localhost:3000"
RAZORPAY_KEY_ID="rzp_test_simulator_key"
RAZORPAY_KEY_SECRET="rzp_test_simulator_secret"
```

### 3. Initialize & Seed Database
```bash
# Push Prisma schema to SQLite
npx prisma db push

# Seed realistic catalog products & demo users
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 👥 Demo Login Credentials

The login screen includes **1-Click Demo Profile Switchers**:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Store Manager (Admin)** | `admin@stocksync.io` | `admin123` | Full access: Inventory CRUD, Analytics, POS Billing |
| **POS Cashier** | `cashier@stocksync.io` | `cashier123` | Fast checkout, register cart, thermal receipt printing |

---

## 🧪 Testing & Quality Gates

Run the automated Vitest test suite covering cart math, tax rounding, and discount logic:
```bash
npm test
```

Run TypeScript strict type checking:
```bash
npx tsc --noEmit
```

Build the production bundle:
```bash
npm run build
```

---

## 📂 Codebase Directory Overview

| Directory | Purpose |
|---|---|
| `src/frontend/styles/` | Custom Vanilla CSS design tokens (Enterprise Modern dark/light theme) |
| `src/frontend/components/` | Reusable UI components, checkout modals, receipt layouts, navbar |
| `src/backend/db/` | Prisma Client database singleton |
| `src/backend/services/` | Business logic services (atomic checkout transaction, inventory, analytics) |
| `src/backend/auth/` | NextAuth configuration and credentials handler |
| `src/backend/schemas/` | Zod schemas for input validation |
| `src/app/` | Next.js App Router pages and API routes |
| `.github/workflows/` | GitHub Actions CI/CD automation pipeline |

For in-depth architectural details, refer to [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📄 License
MIT License. Built for modern retail operations.
