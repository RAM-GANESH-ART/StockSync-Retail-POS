import { prisma } from "@/backend/db/prisma";
import { calculateSubtotal, calculateTax, calculateDiscount, calculateTotal } from "@/lib/cart-utils";

export async function processCheckout(params: {
  items: { productId: string; quantity: number; unitPrice: number }[];
  paymentMethod: "CASH" | "CARD" | "UPI" | "RAZORPAY_SIM";
  discountPercentage?: number;
  taxRatePercentage?: number;
  cashTendered?: number;
  cashierId?: string;
}) {
  const {
    items,
    paymentMethod,
    discountPercentage = 0,
    taxRatePercentage = 5,
    cashierId: inputCashierId,
  } = params;

  let cashierId = inputCashierId;
  if (!cashierId) {
    const defaultUser = await prisma.user.findFirst({
      where: { role: "CASHIER" },
    });
    cashierId = defaultUser?.id || (await prisma.user.findFirst())?.id;
  }

  if (!cashierId) {
    throw new Error("No cashier account configured");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Validate & decrement stock atomically
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`
        );
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 2. Financial calculation
    const subtotal = calculateSubtotal(
      items.map((i) => ({
        product: { id: i.productId } as any,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.quantity * i.unitPrice,
      }))
    );
    const taxAmount = calculateTax(subtotal, taxRatePercentage);
    const discountAmount = calculateDiscount(subtotal, discountPercentage);
    const totalAmount = calculateTotal(subtotal, taxAmount, discountAmount);

    // 3. Generate sequential invoice ID
    const count = await tx.sale.count();
    const year = new Date().getFullYear();
    const saleNumber = `SS-${year}-${String(1001 + count).padStart(5, "0")}`;

    // 4. Record sale
    const sale = await tx.sale.create({
      data: {
        saleNumber,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod,
        paymentStatus: "COMPLETED",
        cashierId: cashierId as string,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: Math.round(i.quantity * i.unitPrice * 100) / 100,
          })),
        },
      },
      include: {
        cashier: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, barcode: true } },
          },
        },
      },
    });

    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      subtotal: sale.subtotal,
      taxAmount: sale.taxAmount,
      discountAmount: sale.discountAmount,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      createdAt: sale.createdAt.toISOString(),
      cashierName: sale.cashier?.name || "Cashier",
      items: sale.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productName: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      })),
    };
  });
}
