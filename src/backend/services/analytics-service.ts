import { prisma } from "@/backend/db/prisma";

export async function getStoreAnalytics() {
  // 1. Database-level aggregation for total revenue & transaction count
  const allSalesAgg = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    _count: true,
  });

  const totalRevenue = allSalesAgg._sum.totalAmount || 0;
  const totalTransactions = allSalesAgg._count || 0;

  // 2. Today's Revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAgg = await prisma.sale.aggregate({
    where: { createdAt: { gte: today } },
    _sum: { totalAmount: true },
  });
  const todayRevenue = todayAgg._sum.totalAmount || 0;

  // 3. Low Stock Alert Count (from 500 catalog items)
  const products = await prisma.product.findMany({
    select: { stock: true, minStockAlert: true },
  });
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  // 4. Optimized 7-Day Revenue Trend (only querying sales in the 7-day window)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const daysMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    daysMap[key] = 0;
  }

  const recentWindowSales = await prisma.sale.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { totalAmount: true, createdAt: true },
  });

  recentWindowSales.forEach((s) => {
    const d = new Date(s.createdAt);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (daysMap[key] !== undefined) {
      daysMap[key] += s.totalAmount;
    }
  });

  const revenueChart = Object.entries(daysMap).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));

  // 5. Optimized Top 5 Products by Revenue (using groupBy aggregation)
  const topItemGroups = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    orderBy: {
      _sum: {
        totalPrice: "desc",
      },
    },
    take: 5,
  });

  const productIds = topItemGroups.map((g) => g.productId);
  const topProductRecords = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const productMetaMap = new Map(topProductRecords.map((p) => [p.id, p]));

  const topProducts = topItemGroups.map((g) => {
    const meta = productMetaMap.get(g.productId);
    return {
      name: meta?.name || "Product",
      sku: meta?.sku || "SKU",
      unitsSold: g._sum.quantity || 0,
      totalRevenue: Math.round((g._sum.totalPrice || 0) * 100) / 100,
    };
  });

  // 6. Recent 10 Sales Ledger (Indexed lookup)
  const recentSales = await prisma.sale.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      cashier: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  });

  return {
    metrics: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      totalTransactions,
      lowStockCount,
    },
    revenueChart,
    topProducts,
    recentSales: recentSales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      subtotal: s.subtotal,
      taxAmount: s.taxAmount,
      discountAmount: s.discountAmount,
      totalAmount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      createdAt: s.createdAt.toISOString(),
      cashierName: s.cashier?.name || "Terminal Operator",
      itemsCount: s.items.reduce((acc, it) => acc + it.quantity, 0),
      items: s.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productName: it.product?.name || "Item",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      })),
    })),
  };
}
