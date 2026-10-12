import { describe, it, expect } from "vitest";
import {
  calculateSubtotal,
  calculateTax,
  calculateDiscount,
  calculateTotal,
  formatINR,
} from "../cart-utils";
import { CartItem } from "@/types";

describe("Cart Financial Utility Functions", () => {
  const sampleItems: CartItem[] = [
    {
      product: {
        id: "p1",
        name: "Apple 20W Adapter",
        sku: "ELEC-APL-20W",
        barcode: "8901234567890",
        price: 1900,
        costPrice: 1400,
        stock: 10,
        minStockAlert: 5,
        categoryId: "c1",
      },
      quantity: 2,
      unitPrice: 1900,
      totalPrice: 3800,
    },
    {
      product: {
        id: "p2",
        name: "Logitech Mouse",
        sku: "ELEC-LOG-M185",
        barcode: "8901234567891",
        price: 799,
        costPrice: 500,
        stock: 5,
        minStockAlert: 2,
        categoryId: "c1",
      },
      quantity: 1,
      unitPrice: 799,
      totalPrice: 799,
    },
  ];

  it("calculates subtotal correctly for multi-item cart", () => {
    // 2 * 1900 + 1 * 799 = 3800 + 799 = 4599
    const subtotal = calculateSubtotal(sampleItems);
    expect(subtotal).toBe(4599);
  });

  it("returns 0 for empty cart subtotal", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("calculates 5% default GST tax accurately", () => {
    // 4599 * 0.05 = 229.95
    const tax = calculateTax(4599, 5);
    expect(tax).toBe(229.95);
  });

  it("calculates discount percentages correctly", () => {
    // 10% discount on 4599 = 459.90
    const discount = calculateDiscount(4599, 10);
    expect(discount).toBe(459.9);

    // 0% discount
    expect(calculateDiscount(4599, 0)).toBe(0);
  });

  it("computes net payable total with subtotal, tax, and discount", () => {
    const subtotal = 4599;
    const tax = calculateTax(subtotal, 5); // 229.95
    const discount = calculateDiscount(subtotal, 10); // 459.90
    // Total = 4599 + 229.95 - 459.90 = 4369.05
    const total = calculateTotal(subtotal, tax, discount);
    expect(total).toBe(4369.05);
  });

  it("handles floating point precision rounding properly", () => {
    const subtotal = 19.99;
    const tax = calculateTax(subtotal, 5); // 0.9995 -> 1.00
    expect(tax).toBe(1);

    const total = calculateTotal(subtotal, tax, 0);
    expect(total).toBe(20.99);
  });

  it("never returns negative total if discount exceeds payable amount", () => {
    const total = calculateTotal(100, 5, 200);
    expect(total).toBe(0);
  });

  it("formats Indian Rupee currency correctly", () => {
    const formatted = formatINR(4369.05);
    expect(formatted).toContain("4,369.05");
  });
});
