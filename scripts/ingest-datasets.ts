import fs from "fs";
import path from "path";
import readline from "readline";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  console.log("🚀 Starting Full Dataset Ingestion into StockSync POS...");
  const startTime = Date.now();

  // Enable SQLite WAL mode & performance optimizations
  await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
  await prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
  await prisma.$queryRawUnsafe("PRAGMA temp_store = MEMORY;");

  // Get Cashier & Admin users
  const cashier = await prisma.user.findFirst({ where: { role: "CASHIER" } });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const cashierId = cashier?.id || admin?.id || "demo-cashier-id";
  const adminId = admin?.id || cashierId;

  // -------------------------------------------------------------
  // PHASE 1: Ingest 500 Inventory Products
  // -------------------------------------------------------------
  console.log("\n📦 Phase 1: Ingesting 500 Inventory Catalog Products...");
  const inventoryCsvPath = path.join(process.cwd(), "data", "updated_inventory_500_items.csv");
  if (!fs.existsSync(inventoryCsvPath)) {
    throw new Error(`Inventory CSV not found at: ${inventoryCsvPath}`);
  }

  const inventoryContent = fs.readFileSync(inventoryCsvPath, "utf-8");
  const invLines = inventoryContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const invHeader = invLines[0].split(",");

  const categoriesMap = new Map<string, string>(); // Name -> ID
  const rawProducts: Array<{
    name: string;
    sku: string;
    categoryName: string;
    price: number;
    stock: number;
  }> = [];

  // Parse inventory rows
  for (let i = 1; i < invLines.length; i++) {
    const line = invLines[i].trim();
    if (!line) continue;
    // Handle CSV comma splitting safely
    const match = line.match(/^"?(.*?)"?,([A-Z0-9]+),"?([^",]+)"?,(\d+(?:\.\d+)?),(\d+)/);
    if (!match) continue;

    const [, name, sku, categoryName, priceStr, stockStr] = match;
    rawProducts.push({
      name: name.trim(),
      sku: sku.trim(),
      categoryName: categoryName.trim(),
      price: parseFloat(priceStr),
      stock: parseInt(stockStr, 10),
    });
  }

  // Upsert Categories
  const distinctCategories = Array.from(new Set(rawProducts.map((p) => p.categoryName)));
  for (const catName of distinctCategories) {
    const slug = slugify(catName);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      categoriesMap.set(catName, existing.id);
    } else {
      const created = await prisma.category.create({
        data: { name: catName, slug },
      });
      categoriesMap.set(catName, created.id);
    }
  }
  console.log(`✅ Ensured ${categoriesMap.size} product categories`);

  // Upsert Products
  const skuToProductIdMap = new Map<string, string>();
  let productUpsertCount = 0;

  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const catId = categoriesMap.get(p.categoryName)!;
    const barcode = `890${String(1000000000 + i + 1).slice(1)}`;
    const costPrice = Math.round(p.price * 0.72 * 100) / 100;
    const minAlert = Math.max(5, Math.floor(p.stock * 0.15));

    const upserted = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        price: p.price,
        costPrice,
        stock: p.stock,
        minStockAlert: minAlert,
        categoryId: catId,
      },
      create: {
        name: p.name,
        sku: p.sku,
        barcode,
        price: p.price,
        costPrice,
        stock: p.stock,
        minStockAlert: minAlert,
        categoryId: catId,
      },
    });

    skuToProductIdMap.set(p.sku, upserted.id);
    productUpsertCount++;
  }
  console.log(`✅ Ingested ${productUpsertCount} products into database catalog`);

  // -------------------------------------------------------------
  // PHASE 2: Ingest 500,000 Sales History Records
  // -------------------------------------------------------------
  console.log("\n📈 Phase 2: Ingesting 500,000 Historical Sales Records...");
  const salesCsvPath = path.join(process.cwd(), "data", "sales_history_500k.csv");
  if (!fs.existsSync(salesCsvPath)) {
    throw new Error(`Sales history CSV not found at: ${salesCsvPath}`);
  }

  // Clear existing sales to avoid duplicates
  console.log("🧹 Clearing old sales records for clean import...");
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();

  const fileStream = fs.createReadStream(salesCsvPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let batchSales: any[] = [];
  let batchSaleItems: any[] = [];
  const BATCH_SIZE = 2500;
  let totalImported = 0;

  const paymentMethods = ["CASH", "UPI", "CASH", "CARD", "UPI"]; // realistic store distribution

  for await (const line of rl) {
    if (lineCount++ === 0) continue; // Skip header
    if (!line.trim()) continue;

    // CSV Format: Transaction ID,Date & Time,Type,SKU,Product Name,Category,Quantity,Unit Price (₹),Total Amount (₹)
    const parts = line.split(",");
    if (parts.length < 9) continue;

    const txnId = parts[0].trim();
    const dateStr = parts[1].trim();
    const sku = parts[3].trim();
    const quantity = parseInt(parts[6].trim(), 10) || 1;
    const unitPrice = parseFloat(parts[7].trim()) || 0;
    const totalAmount = parseFloat(parts[8].trim()) || quantity * unitPrice;

    const productId = skuToProductIdMap.get(sku);
    if (!productId) continue;

    const saleId = `sale_${txnId}`;
    const saleItemId = `item_${txnId}`;
    const createdAt = new Date(dateStr);
    const taxAmount = Math.round(totalAmount * 0.05 * 100) / 100;
    const subtotal = totalAmount;
    const finalTotal = Math.round((subtotal + taxAmount) * 100) / 100;

    const assignedCashierId = lineCount % 5 === 0 ? adminId : cashierId;
    const paymentMethod = paymentMethods[lineCount % paymentMethods.length];

    batchSales.push({
      id: saleId,
      saleNumber: txnId,
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount: finalTotal,
      paymentMethod,
      paymentStatus: "COMPLETED",
      cashierId: assignedCashierId,
      createdAt,
    });

    batchSaleItems.push({
      id: saleItemId,
      saleId,
      productId,
      quantity,
      unitPrice,
      totalPrice: totalAmount,
    });

    if (batchSales.length >= BATCH_SIZE) {
      await prisma.sale.createMany({ data: batchSales });
      await prisma.saleItem.createMany({ data: batchSaleItems });

      totalImported += batchSales.length;
      batchSales = [];
      batchSaleItems = [];

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const percent = ((totalImported / 500000) * 100).toFixed(1);
      process.stdout.write(
        `\r⚡ Ingested: ${totalImported.toLocaleString()} / 500,000 (${percent}%) | Elapsed: ${elapsedSec}s`
      );
    }
  }

  // Flush remaining batch
  if (batchSales.length > 0) {
    await prisma.sale.createMany({ data: batchSales });
    await prisma.saleItem.createMany({ data: batchSaleItems });
    totalImported += batchSales.length;
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n🎉 Full Ingestion Complete!`);
  console.log(`📊 Total Products: ${productUpsertCount}`);
  console.log(`💰 Total Sales Transactions: ${totalImported.toLocaleString()}`);
  console.log(`⏱️ Total Time: ${totalTimeSec} seconds`);

  // Final count check
  const saleCount = await prisma.sale.count();
  const prodCount = await prisma.product.count();
  console.log(`✅ Verified Database Counts: ${prodCount} Products | ${saleCount.toLocaleString()} Sales Records.`);
}

run()
  .catch((err) => {
    console.error("❌ Ingestion error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
