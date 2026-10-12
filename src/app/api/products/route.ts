import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/backend/services/product-service";
import { productCreateSchema } from "@/backend/schemas/validation";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category") || undefined;
    const lowStockOnly = searchParams.get("lowStock") === "true";

    const result = await getProducts({ search, category, lowStockOnly });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = productCreateSchema.parse(body);
    const created = await createProduct(validated);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
