import { prisma } from "@/backend/db/prisma";

export async function getStoreAnalytics() {
  const totalSales = await prisma.sale.findMany({
    select: {
      totalAmount: true,
      createdAt: true,
    },
  });

  const totalRevenue = totalSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalTransactions = totalSales.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = totalSales.filter((s) => new Date(s.createdAt) >= today);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);

  const products = await prisma.product.findMany({
    select: { stock: true, minStockAlert: true },
  });
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

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

  totalSales.forEach((s) => {
    const d = new Date(s.createdAt);
    if (d >= sevenDaysAgo) {
      const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      if (daysMap[key] !== undefined) {
        daysMap[key] += s.totalAmount;
      }
    }
  });

  const revenueChart = Object.entries(daysMap).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));

  const saleItems = await prisma.saleItem.findMany({
    include: {
      product: { select: { name: true, sku: true } },
    },
  });

  const productSalesMap: Record<string, { name: string; sku: string; unitsSold: number; totalRevenue: number }> = {};

  saleItems.forEach((item) => {
    const pId = item.productId;
    if (!productSalesMap[pId]) {
      productSalesMap[pId] = {
        name: item.product.name,
        sku: item.product.sku,
        unitsSold: 0,
        totalRevenue: 0,
      };
    }
    productSalesMap[pId].unitsSold += item.quantity;
    productSalesMap[pId].totalRevenue += item.totalPrice;
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

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
      totalRevenue,
      todayRevenue,
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
        productName: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      })),
    })),
  };
}
