import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(3, "SKU is required"),
  barcode: z.string().min(4, "Barcode is required"),
  price: z.number().positive("Selling price must be positive"),
  costPrice: z.number().nonnegative("Cost price cannot be negative"),
  stock: z.number().int().nonnegative("Stock quantity cannot be negative"),
  minStockAlert: z.number().int().nonnegative().default(5),
  categoryId: z.string().min(1, "Category is required"),
});

export const productUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().min(3).optional(),
  barcode: z.string().min(4).optional(),
  price: z.number().positive().optional(),
  costPrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  minStockAlert: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional(),
});

export const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive("Quantity must be at least 1"),
      unitPrice: z.number().positive(),
    })
  ).min(1, "Cart cannot be empty"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "RAZORPAY_SIM"]),
  discountPercentage: z.number().min(0).max(100).default(0),
  taxRatePercentage: z.number().min(0).max(50).default(5),
  cashTendered: z.number().optional(),
});
