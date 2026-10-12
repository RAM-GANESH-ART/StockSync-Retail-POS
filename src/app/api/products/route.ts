import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(3, "SKU is required"),
  barcode: z.string().min(4, "Barcode is required"),
  price: z.number().positive("Selling price must be positive"),
  costPrice: z.number().nonnegative("Cost price cannot be negative"),
  stock: z.number().int().nonnegative("Stock quantity cannot be negative"),
  minStockAlert: z.number().int().nonnegative().default(5),
  categoryId: z.string().min(1, "Category is required"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category");
    const lowStockOnly = searchParams.get("lowStock") === "true";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (category && category !== "ALL") {
      where.categoryId = category;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    const filtered = lowStockOnly
      ? products.filter((p) => p.stock <= p.minStockAlert)
      : products;

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products: filtered, categories });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = productSchema.parse(body);

    // Check for duplicate SKU or Barcode
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ sku: validated.sku }, { barcode: validated.barcode }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A product with this SKU or barcode already exists." },
        { status: 400 }
      );
    }

    const created = await prisma.product.create({
      data: validated,
      include: { category: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
