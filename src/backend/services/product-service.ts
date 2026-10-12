import { prisma } from "@/backend/db/prisma";

export async function getProducts(options: {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}) {
  const where: Record<string, unknown> = {};

  if (options.search) {
    where.OR = [
      { name: { contains: options.search } },
      { sku: { contains: options.search } },
      { barcode: { contains: options.search } },
    ];
  }

  if (options.category && options.category !== "ALL") {
    where.categoryId = options.category;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: { name: "asc" },
  });

  const filtered = options.lowStockOnly
    ? products.filter((p) => p.stock <= p.minStockAlert)
    : products;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return { products: filtered, categories };
}

export async function createProduct(data: {
  name: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockAlert: number;
  categoryId: string;
}) {
  const existing = await prisma.product.findFirst({
    where: {
      OR: [{ sku: data.sku }, { barcode: data.barcode }],
    },
  });

  if (existing) {
    throw new Error("A product with this SKU or barcode already exists.");
  }

  return await prisma.product.create({
    data,
    include: { category: true },
  });
}

export async function getProductById(id: string) {
  return await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    sku?: string;
    barcode?: string;
    price?: number;
    costPrice?: number;
    stock?: number;
    minStockAlert?: number;
    categoryId?: string;
  }
) {
  return await prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });
}

export async function deleteProduct(id: string) {
  return await prisma.product.delete({
    where: { id },
  });
}
