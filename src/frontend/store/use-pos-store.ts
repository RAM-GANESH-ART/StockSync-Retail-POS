import { create } from "zustand";
import { ProductItem, CartItem, SaleSummary } from "@/types";
import { calculateSubtotal, calculateTax, calculateDiscount, calculateTotal } from "@/lib/cart-utils";
import { toast } from "sonner";
import { posAudio } from "@/frontend/lib/sound-effects";

export interface HeldOrder {
  id: string;
  heldAt: string;
  customerPhone?: string;
  cart: CartItem[];
  discountPercentage: number;
  total: number;
  totalUnits: number;
}

interface PosState {
  cart: CartItem[];
  discountPercentage: number;
  searchQuery: string;
  selectedCategory: string;
  customerPhone: string;
  isCheckoutOpen: boolean;
  isReceiptOpen: boolean;
  completedSale: SaleSummary | null;
  heldOrders: HeldOrder[];
  isHeldOrdersOpen: boolean;
  isShortcutsOpen: boolean;
  audioEnabled: boolean;
  viewMode: "grid" | "table";

  // Actions
  addToCart: (product: ProductItem) => boolean;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setDiscountPercentage: (pct: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCheckoutOpen: (open: boolean) => void;
  setReceiptOpen: (open: boolean) => void;
  setCompletedSale: (sale: SaleSummary | null) => void;
  setHeldOrdersOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleAudio: () => void;
  setViewMode: (mode: "grid" | "table") => void;

  // Park / Hold Order Actions
  holdCurrentCart: () => boolean;
  resumeHeldOrder: (index: number) => void;
  discardHeldOrder: (index: number) => void;

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
  customerPhone: "",
  isCheckoutOpen: false,
  isReceiptOpen: false,
  completedSale: null,
  heldOrders: [],
  isHeldOrdersOpen: false,
  isShortcutsOpen: false,
  audioEnabled: true,
  viewMode: "grid",

  addToCart: (product: ProductItem) => {
    if (product.stock <= 0) {
      posAudio.playWarningBuzz();
      toast.error(`"${product.name}" is out of stock.`);
      return false;
    }

    const currentCart = get().cart;
    const existing = currentCart.find((i) => i.product.id === product.id);

    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        posAudio.playWarningBuzz();
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
      posAudio.playScanBeep();
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
    posAudio.playScanBeep();
    toast.success(`Added ${product.name}`);
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
            posAudio.playWarningBuzz();
            toast.warning(`Only ${item.product.stock} units available.`);
            return item;
          }
          posAudio.playScanBeep();
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
    if (item) {
      toast.info(`Removed ${item.product.name}`);
    }
  },

  clearCart: () => {
    if (get().cart.length === 0) return;
    set({ cart: [], discountPercentage: 0, customerPhone: "" });
    toast.info("Register cart cleared");
  },

  setDiscountPercentage: (pct: number) => {
    set({ discountPercentage: pct });
    if (pct > 0) toast.success(`Applied ${pct}% store discount`);
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: string) => set({ selectedCategory: category }),
  setCustomerPhone: (phone: string) => set({ customerPhone: phone }),
  setCheckoutOpen: (open: boolean) => set({ isCheckoutOpen: open }),
  setReceiptOpen: (open: boolean) => set({ isReceiptOpen: open }),
  setHeldOrdersOpen: (open: boolean) => set({ isHeldOrdersOpen: open }),
  setShortcutsOpen: (open: boolean) => set({ isShortcutsOpen: open }),

  setViewMode: (mode: "grid" | "table") => set({ viewMode: mode }),

  toggleAudio: () => {
    const nextVal = !get().audioEnabled;
    posAudio.setEnabled(nextVal);
    set({ audioEnabled: nextVal });
    toast.info(nextVal ? "🔊 POS Audio Beep Enabled" : "🔇 POS Audio Muted");
  },

  setCompletedSale: (sale: SaleSummary | null) => {
    if (sale) {
      posAudio.playSuccessChime();
    }
    set({ completedSale: sale });
  },

  // Hold current register cart
  holdCurrentCart: () => {
    const { cart, discountPercentage, customerPhone, getTotal, getTotalUnits } = get();
    if (cart.length === 0) {
      toast.warning("Cannot hold an empty cart.");
      return false;
    }

    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      heldAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      customerPhone: customerPhone || undefined,
      cart: [...cart],
      discountPercentage,
      total: getTotal(),
      totalUnits: getTotalUnits(),
    };

    set((state) => ({
      heldOrders: [newHeld, ...state.heldOrders],
      cart: [],
      discountPercentage: 0,
      customerPhone: "",
    }));

    toast.success(`Order ${newHeld.id} parked! Ready for next customer.`);
    return true;
  },

  resumeHeldOrder: (index: number) => {
    const held = get().heldOrders[index];
    if (!held) return;

    // If current cart has items, warn or auto-hold
    if (get().cart.length > 0) {
      get().holdCurrentCart();
    }

    set((state) => ({
      cart: held.cart,
      discountPercentage: held.discountPercentage,
      customerPhone: held.customerPhone || "",
      heldOrders: state.heldOrders.filter((_, i) => i !== index),
      isHeldOrdersOpen: false,
    }));

    posAudio.playScanBeep();
    toast.success(`Resumed order ${held.id}`);
  },

  discardHeldOrder: (index: number) => {
    const target = get().heldOrders[index];
    set((state) => ({
      heldOrders: state.heldOrders.filter((_, i) => i !== index),
    }));
    toast.info(`Discarded parked order ${target?.id || ""}`);
  },

  getSubtotal: () => calculateSubtotal(get().cart),
  getTax: () => calculateTax(get().getSubtotal(), 5),
  getDiscount: () => calculateDiscount(get().getSubtotal(), get().discountPercentage),
  getTotal: () => calculateTotal(get().getSubtotal(), get().getTax(), get().getDiscount()),
  getTotalUnits: () => get().cart.reduce((acc, i) => acc + i.quantity, 0),
}));
