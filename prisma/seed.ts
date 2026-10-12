import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting StockSync database seeding...");

  // Clear existing records
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const cashierPassword = await bcrypt.hash("cashier123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Alex Vance (Manager)",
      email: "admin@stocksync.io",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: "Jordan Lee (Cashier)",
      email: "cashier@stocksync.io",
      password: cashierPassword,
      role: "CASHIER",
    },
  });

  console.log(`✅ Seeded users: ${admin.email}, ${cashier.email}`);

  // Create Categories
  const catElectronics = await prisma.category.create({
    data: { name: "Electronics & Tech", slug: "electronics" },
  });

  const catSnacks = await prisma.category.create({
    data: { name: "Beverages & Snacks", slug: "beverages-snacks" },
  });

  const catCare = await prisma.category.create({
    data: { name: "Personal Care", slug: "personal-care" },
  });

  const catStationery = await prisma.category.create({
    data: { name: "Office & Stationery", slug: "stationery" },
  });

  console.log("✅ Seeded categories");

  // Create Products
  const products = [
    {
      name: "Apple 20W USB-C Power Adapter",
      sku: "ELEC-APL-20W",
      barcode: "8901234567890",
      price: 1900,
      costPrice: 1450,
      stock: 24,
      minStockAlert: 5,
      categoryId: catElectronics.id,
    },
    {
      name: "Logitech Wireless Mouse M185",
      sku: "ELEC-LOG-M185",
      barcode: "8901234567891",
      price: 799,
      costPrice: 550,
      stock: 15,
      minStockAlert: 5,
      categoryId: catElectronics.id,
    },
    {
      name: "Sony WH-CH520 Wireless Headphones",
      sku: "ELEC-SNY-520",
      barcode: "8901234567892",
      price: 4490,
      costPrice: 3300,
      stock: 8,
      minStockAlert: 4,
      categoryId: catElectronics.id,
    },
    {
      name: "SanDisk 64GB Ultra Dual Flash Drive",
      sku: "ELEC-SND-64G",
      barcode: "8901234567893",
      price: 649,
      costPrice: 420,
      stock: 3, // Low stock!
      minStockAlert: 5,
      categoryId: catElectronics.id,
    },
    {
      name: "Anker Powerline III USB-C Cable",
      sku: "ELEC-ANK-CBL",
      barcode: "8901234567904",
      price: 899,
      costPrice: 580,
      stock: 19,
      minStockAlert: 5,
      categoryId: catElectronics.id,
    },
    {
      name: "Red Bull Energy Drink 250ml",
      sku: "BEV-RBL-250",
      barcode: "8901234567894",
      price: 125,
      costPrice: 90,
      stock: 48,
      minStockAlert: 10,
      categoryId: catSnacks.id,
    },
    {
      name: "Starbucks Frappuccino Mocha 281ml",
      sku: "BEV-SBUX-281",
      barcode: "8901234567895",
      price: 295,
      costPrice: 210,
      stock: 18,
      minStockAlert: 6,
      categoryId: catSnacks.id,
    },
    {
      name: "Ferrero Rocher 16 Pieces Box",
      sku: "SNK-FER-16P",
      barcode: "8901234567896",
      price: 549,
      costPrice: 390,
      stock: 12,
      minStockAlert: 5,
      categoryId: catSnacks.id,
    },
    {
      name: "Pringles Sour Cream & Onion 107g",
      sku: "SNK-PRN-107",
      barcode: "8901234567897",
      price: 115,
      costPrice: 80,
      stock: 2, // Low stock!
      minStockAlert: 8,
      categoryId: catSnacks.id,
    },
    {
      name: "Nivea Men Deep Impact Shower Gel",
      sku: "CARE-NIV-SGW",
      barcode: "8901234567898",
      price: 260,
      costPrice: 180,
      stock: 30,
      minStockAlert: 5,
      categoryId: catCare.id,
    },
    {
      name: "Dettol Original Liquid Handwash 200ml",
      sku: "CARE-DTL-200",
      barcode: "8901234567899",
      price: 99,
      costPrice: 65,
      stock: 50,
      minStockAlert: 10,
      categoryId: catCare.id,
    },
    {
      name: "Oral-B Pro Expert Toothbrush Soft",
      sku: "CARE-ORB-SFT",
      barcode: "8901234567900",
      price: 140,
      costPrice: 95,
      stock: 22,
      minStockAlert: 6,
      categoryId: catCare.id,
    },
    {
      name: "Moleskine Classic Notebook Hard Cover",
      sku: "STAT-MLK-NBK",
      barcode: "8901234567901",
      price: 1250,
      costPrice: 850,
      stock: 14,
      minStockAlert: 4,
      categoryId: catStationery.id,
    },
    {
      name: "Pilot G2 0.7mm Retractable Gel Pen",
      sku: "STAT-PLT-G2",
      barcode: "8901234567902",
      price: 110,
      costPrice: 75,
      stock: 65,
      minStockAlert: 15,
      categoryId: catStationery.id,
    },
    {
      name: "Post-it Super Sticky Notes 3x3 Canary",
      sku: "STAT-3M-PST",
      barcode: "8901234567903",
      price: 85,
      costPrice: 50,
      stock: 4, // Low stock!
      minStockAlert: 6,
      categoryId: catStationery.id,
    },
  ];

  for (const prod of products) {
    await prisma.product.create({ data: prod });
  }

  console.log(`✅ Seeded ${products.length} catalog products`);

  // Create initial demo sales for analytics
  const sampleSale = await prisma.sale.create({
    data: {
      saleNumber: "SS-2026-1001",
      subtotal: 2699,
      taxAmount: 134.95,
      discountAmount: 0,
      totalAmount: 2833.95,
      paymentMethod: "UPI",
      paymentStatus: "COMPLETED",
      cashierId: cashier.id,
      items: {
        create: [
          {
            productId: (await prisma.product.findUnique({ where: { sku: "ELEC-APL-20W" } }))!.id,
            quantity: 1,
            unitPrice: 1900,
            totalPrice: 1900,
          },
          {
            productId: (await prisma.product.findUnique({ where: { sku: "ELEC-LOG-M185" } }))!.id,
            quantity: 1,
            unitPrice: 799,
            totalPrice: 799,
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded baseline sale: ${sampleSale.saleNumber}`);
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
