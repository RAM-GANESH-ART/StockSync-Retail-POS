import { create } from "zustand";
import { ProductItem, CartItem, SaleSummary } from "@/types";
import { calculateSubtotal, calculateTax, calculateDiscount, calculateTotal } from "@/lib/cart-utils";
import { toast } from "sonner";

interface PosState {
  cart: CartItem[];
  discountPercentage: number;
  searchQuery: string;
  selectedCategory: string;
  isCheckoutOpen: boolean;
  isReceiptOpen: boolean;
  completedSale: SaleSummary | null;

  // Actions
  addToCart: (product: ProductItem) => boolean;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setDiscountPercentage: (pct: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setCheckoutOpen: (open: boolean) => void;
  setReceiptOpen: (open: boolean) => void;
  setCompletedSale: (sale: SaleSummary | null) => void;

  // Computed values
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getTotalUnits: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  discountPercentage: 0,
  searchQuery: "",
  selectedCategory: "ALL",
  isCheckoutOpen: false,
  isReceiptOpen: false,
  completedSale: null,

  addToCart: (product: ProductItem) => {
    if (product.stock <= 0) {
      toast.error(`"${product.name}" is out of stock.`);
      return false;
    }

    const currentCart = get().cart;
    const existing = currentCart.find((i) => i.product.id === product.id);

    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        toast.warning(`Maximum stock limit reached (${product.stock} units).`);
        return false;
      }

      set({
        cart: currentCart.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
            : i
        ),
      });
      toast.success(`+1 ${product.name}`);
      return true;
    }

    set({
      cart: [
        ...currentCart,
        {
          product,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
        },
      ],
    });
    toast.success(`Added ${product.name} to cart`);
    return true;
  },

  updateQuantity: (productId: string, delta: number) => {
    const currentCart = get().cart;
    const updated = currentCart
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            toast.warning(`Only ${item.product.stock} units available.`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    set({ cart: updated });
  },

  removeFromCart: (productId: string) => {
    const item = get().cart.find((i) => i.product.id === productId);
    set({ cart: get().cart.filter((i) => i.product.id !== productId) });
    if (item) toast.info(`Removed ${item.product.name}`);
  },

  clearCart: () => {
    if (get().cart.length === 0) return;
    set({ cart: [], discountPercentage: 0 });
    toast.info("Register cart cleared");
  },

  setDiscountPercentage: (pct: number) => {
    set({ discountPercentage: pct });
    if (pct > 0) toast.success(`Applied ${pct}% store discount`);
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),
  setCheckoutOpen: (open: boolean) => set({ isCheckoutOpen: open }),
  setReceiptOpen: (open: boolean) => set({ isReceiptOpen: open }),
  setCompletedSale: (sale: SaleSummary | null) => set({ completedSale: sale }),

  getSubtotal: () => calculateSubtotal(get().cart),
  getTax: () => calculateTax(get().getSubtotal(), 5),
  getDiscount: () => calculateDiscount(get().getSubtotal(), get().discountPercentage),
  getTotal: () => calculateTotal(get().getSubtotal(), get().getTax(), get().getDiscount()),
  getTotalUnits: () => get().cart.reduce((acc, i) => acc + i.quantity, 0),
}));
