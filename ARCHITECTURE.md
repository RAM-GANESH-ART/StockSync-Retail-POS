# StockSync Architecture & Directory Organization Guide

This document explains the codebase separation between **Frontend** and **Backend** in **StockSync Retail POS**.

---

## 📁 High-Level Architecture & Folder Tree

```text
stocksync-retail-pos/
├── ci/
│   └── ci.yml                   # Automated CI Quality Gate (Lint, Types, Vitest, Build)
├── prisma/
│   ├── schema.prisma            # PostgreSQL database schema (User, Product, Category, Sale, SaleItem)
│   └── seed.ts                  # Retail inventory seed data & demo accounts (Admin & Cashier)
│
├── src/
│   ├── frontend/                # 🎨 ALL FRONTEND (UI & CLIENT LOGIC)
│   │   ├── styles/
│   │   │   └── globals.css      # Custom Vanilla CSS Design System, dark/light theme tokens, 80mm print rules
│   │   ├── store/
│   │   │   └── use-pos-store.ts # Zustand high-speed POS cart and terminal state store
│   │   └── components/
│   │       ├── Navbar.tsx             # Main navigation bar with role badge & dark/light theme toggle
│   │       ├── CheckoutModal.tsx      # Payment dialog (Cash change calculator, Card EDC, Counter UPI QR)
│   │       ├── ThermalReceiptModal.tsx  # Printable 80mm thermal receipt with authentic JsBarcode & window.print()
│   │       ├── BarcodeRenderer.tsx    # JsBarcode real scannable Code128 / EAN13 barcode component
│   │       ├── ProductFormModal.tsx   # Add / Edit inventory item modal with field validation
│   │       └── Providers.tsx          # NextAuth SessionProvider and Sonner Toaster wrapper
│   │
│   ├── backend/                 # ⚙️ ALL BACKEND (DATABASE, SERVICES & LOGIC)
│   │   ├── db/
│   │   │   └── prisma.ts        # PrismaClient global singleton for PostgreSQL connection
│   │   ├── auth/
│   │   │   └── auth.ts          # NextAuth configuration, credentials provider, bcrypt hash checks
│   │   ├── schemas/
│   │   │   └── validation.ts    # Zod runtime schemas for product creation, updates, and checkout payloads
│   │   └── services/
│   │       ├── product-service.ts   # Inventory catalog queries, stock adjustments, and search filters
│   │       ├── checkout-service.ts  # Atomic Prisma transaction: stock decrement + invoice creation
│   │       └── analytics-service.ts # KPI calculations, 7-day revenue trend, and top-selling SKUs
│   │
│   ├── app/                     # 🌐 APP ROUTER CONTROLLERS & PAGES
│   │   ├── layout.tsx           # Root HTML layout with Google Fonts (Inter + JetBrains Mono)
│   │   ├── page.tsx             # Store landing page
│   │   ├── login/page.tsx       # Authentication terminal with 1-click demo login buttons
│   │   ├── pos/page.tsx         # Real-time POS Billing Register with barcode scanner & live cart
│   │   ├── inventory/page.tsx   # Stock manager with low-stock badges and restock actions
│   │   ├── dashboard/page.tsx   # Executive analytics dashboard with Recharts visualizations
│   │   └── api/                 # REST API endpoints (thin controllers delegating to backend services)
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── products/route.ts
│   │       ├── products/[id]/route.ts
│   │       ├── checkout/route.ts
│   │       └── analytics/route.ts
│   │
│   ├── lib/                     # 📦 SHARED UTILITIES & COMPUTATIONS
│   │   ├── cart-utils.ts        # Pure calculation functions (Subtotal, GST Tax, Discount, Grand Total)
│   │   └── __tests__/
│   │       └── cart-utils.test.ts # Vitest automated unit test suite
│   │
│   └── types/
│       └── index.ts             # Central TypeScript interfaces & NextAuth session types
```

---

## 🎨 How Frontend Works (`src/frontend/`)

1. **Styles (`src/frontend/styles/globals.css`)**:
   - Contains pure, customized modern Vanilla CSS (no Tailwind).
   - Enterprise Modern theme tokens for dual dark/light modes.
   - High-contrast alert badges (`.badge-in-stock`, `.badge-low-stock`, `.badge-out-of-stock`).
   - Thermal POS printer CSS (`@media print`) targeting standard 80mm paper widths.
2. **Components (`src/frontend/components/`)**:
   - Pure UI presentation components and modals.
   - Client interactivity (state toggles, print handlers, QR visualizers, quantity steppers).

---

## ⚙️ How Backend Works (`src/backend/`)

1. **Database Layer (`src/backend/db/prisma.ts`)**:
   - Connects to SQLite (`prisma/dev.db`) using Prisma 6 Rust query engine.
2. **Services (`src/backend/services/`)**:
   - **`checkout-service.ts`**: Implements an atomic interactive transaction (`prisma.$transaction`). Validates inventory in real-time, decrements product stock, generates an invoice number (e.g., `SS-2026-1002`), and saves the sale items. If any product is out of stock, the transaction rolls back safely.
   - **`product-service.ts`**: Handles CRUD, barcode deduplication, and low-stock queries.
   - **`analytics-service.ts`**: Aggregates total sales, today's sales, daily trend series, and best-selling items.
3. **Authentication (`src/backend/auth/auth.ts`)**:
   - NextAuth credentials provider comparing salted bcrypt passwords with role-based claims (`ADMIN` vs `CASHIER`).

---

## 🌐 The Controller Layer (`src/app/`)

The `src/app/` folder connects the frontend views and backend services:
- **Pages** render frontend UI components and handle user input.
- **API routes** (`/api/...`) receive HTTP requests, validate request bodies via `src/backend/schemas/validation.ts`, call the corresponding service in `src/backend/services/`, and return JSON responses.
