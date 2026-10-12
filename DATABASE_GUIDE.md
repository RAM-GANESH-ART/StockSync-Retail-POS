# StockSync Retail POS - PostgreSQL Database Guide

This guide explains how to connect and manage the PostgreSQL database for **StockSync Retail POS**.

---

## Why PostgreSQL?

| Feature | SQLite (Previous) | PostgreSQL (Current) |
| :--- | :--- | :--- |
| **Concurrency** | File-level lock (`SQLITE_BUSY` on high checkout volume) | Row-level locking (`SELECT FOR UPDATE`) |
| **Multi-Terminal POS** | Single machine only | Unlimited concurrent retail cashier terminals |
| **Deployment Target** | Single persistent server | Serverless (Vercel, AWS Lambda, Docker, Cloud Run) |
| **Cloud Hosting** | Complex persistence | Instant managed cloud (Neon, Supabase, AWS RDS) |
| **Connection Pooling** | N/A | High-throughput serverless pooler (`pgbouncer`) |

---

## Option 1: Neon Serverless PostgreSQL (Recommended - 60 Seconds)

[Neon](https://neon.tech) is a serverless, autoscaling PostgreSQL database that offers a generous free tier with zero local installation required.

### Step 1: Create a Free Database
1. Go to [https://neon.tech](https://neon.tech) and sign in with GitHub or Google.
2. Click **Create Project**.
3. Name your project: `stocksync-pos`.
4. Choose the cloud region closest to you (e.g., `AWS US East (N. Virginia)` or `AWS Asia Pacific (Singapore)`).

### Step 2: Copy Your Connection String
1. On your Neon dashboard under **Connection Details**, ensure **Pooled connection** is checked.
2. Select **Prisma** or **Node.js** format.
3. Copy the URL, which looks like:
   ```env
   postgresql://neondb_owner:npg_xyz123@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Paste into `.env`
Open `.env` in the root of your project:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_ACTUAL_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Step 4: Push Schema & Seed Data
Run the following terminal commands:
```powershell
# 1. Push schema tables to your Neon database
npm run prisma:push

# 2. Seed default users, categories, and 15 retail catalog products
npm run prisma:seed
```

---

## Option 2: Local Docker PostgreSQL (Offline Development)

If you have Docker Desktop installed and want to run PostgreSQL offline on your local machine:

### Step 1: Start the PostgreSQL Container
```powershell
docker compose up -d
```

### Step 2: Update `.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stocksync_pos?schema=public"
```

### Step 3: Push Schema & Seed Data
```powershell
npm run prisma:push
npm run prisma:seed
```

---

## Option 3: Supabase PostgreSQL

If you prefer Supabase:
1. Create a project at [https://supabase.com](https://supabase.com).
2. Go to **Project Settings** > **Database** > **Connection string**.
3. Choose the **URI** format under **Connection Pooler (Session or Transaction)**.
4. Set in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
5. Run:
   ```powershell
   npm run prisma:push
   npm run prisma:seed
   ```

---

## Available Database Scripts

| Command | Action |
| :--- | :--- |
| `npm run prisma:generate` | Generates the TypeScript Prisma Client code |
| `npm run prisma:push` | Pushes the Prisma schema directly to your PostgreSQL database without migration files |
| `npm run prisma:migrate` | Creates and executes a formal SQL migration (`prisma migrate dev`) |
| `npm run prisma:seed` | Populates sample categories, products, and cashier logins |
| `npm run prisma:studio` | Opens an interactive web GUI at `http://localhost:5555` to inspect and edit database records |

---

## Default Seeded Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Store Manager (Admin)** | `admin@stocksync.io` | `admin123` |
| **POS Cashier** | `cashier@stocksync.io` | `cashier123` |

---

## Troubleshooting

### Error: `Tenant or user not found` / Connection Timeout
- Verify your password does not contain unencoded special characters. If it does, URL-encode them (e.g. `@` -> `%40`).
- Ensure `?sslmode=require` is appended to the connection string for Neon and Supabase.

### Resetting the Database
To clear and re-seed the database:
```powershell
npm run prisma:push -- --force-reset
npm run prisma:seed
```
