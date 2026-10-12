import { CartItem } from "@/types";

export function calculateSubtotal(items: CartItem[]): number {
  const sum = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  return Math.round(sum * 100) / 100;
}

export function calculateTax(subtotal: number, taxRatePercentage: number = 5): number {
  const tax = subtotal * (taxRatePercentage / 100);
  return Math.round(tax * 100) / 100;
}

export function calculateDiscount(subtotal: number, discountPercentage: number = 0): number {
  if (discountPercentage <= 0) return 0;
  const discount = subtotal * (discountPercentage / 100);
  return Math.round(discount * 100) / 100;
}

export function calculateTotal(
  subtotal: number,
  taxAmount: number,
  discountAmount: number = 0
): number {
  const total = subtotal + taxAmount - discountAmount;
  return Math.max(0, Math.round(total * 100) / 100);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
