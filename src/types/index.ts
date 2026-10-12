import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockAlert: number;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleSummary {
  id: string;
  saleNumber: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  cashierName?: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}
