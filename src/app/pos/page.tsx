"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/frontend/components/Navbar";
import { ProductItem, CartItem, SaleSummary } from "@/types";
import { calculateSubtotal, calculateTax, calculateDiscount, calculateTotal } from "@/lib/cart-utils";
import { CheckoutModal } from "@/frontend/components/CheckoutModal";
import { ThermalReceiptModal } from "@/frontend/components/ThermalReceiptModal";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Barcode,
  ArrowRight,
  RotateCcw,
  Tag,
  Clock,
  Layers,
} from "lucide-react";

export default function PosRegisterPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleSummary | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Defer time calculation with useEffect to guarantee zero hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        if (data.categories) setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error loading POS products:", err);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Cart operations
  const addToCart = (product: ProductItem) => {
    if (product.stock <= 0) {
      alert(`"${product.name}" is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const item = prev[existingIdx];
        if (item.quantity + 1 > product.stock) {
          alert(`Cannot add more. Only ${product.stock} units available in inventory.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...item,
          quantity: item.quantity + 1,
          totalPrice: (item.quantity + 1) * item.unitPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.price,
            totalPrice: product.price,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Maximum stock limit reached (${item.product.stock} units).`);
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
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm("Are you sure you want to clear the active register cart?")) {
      setCart([]);
      setDiscountPercentage(0);
    }
  };

  // Barcode / Fast search enter handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const trimmed = searchQuery.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === trimmed ||
        p.sku.toLowerCase() === trimmed ||
        p.name.toLowerCase().includes(trimmed)
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery("");
    } else {
      alert(`No product matching barcode or SKU "${searchQuery}" found.`);
    }
  };

  // Filtered products for UI
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const subtotal = calculateSubtotal(cart);
  const taxAmount = calculateTax(subtotal, 5);
  const discountAmount = calculateDiscount(subtotal, discountPercentage);
  const totalAmount = calculateTotal(subtotal, taxAmount, discountAmount);

  // On sale success
  const handleSaleSuccess = (sale: SaleSummary) => {
    setCompletedSale(sale);
    setCart([]);
    setDiscountPercentage(0);
    setIsReceiptOpen(true);
    fetchCatalog(); // Refresh inventory stock immediately
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "1.25rem 0" }}>
        <div className="container">
          {/* POS Terminal Sub-header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>POS Billing Register</h1>
              <span className="badge badge-primary mono" style={{ fontSize: "0.7rem" }}>
                TERMINAL #01
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {currentTime && (
                <div
                  className="mono"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    backgroundColor: "var(--bg-secondary)",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Clock size={14} color="var(--accent-primary)" />
                  <span>{currentTime}</span>
                </div>
              )}

              {cart.length > 0 && (
                <button onClick={clearCart} className="btn btn-outline btn-sm">
                  <RotateCcw size={14} />
                  <span>Clear Cart</span>
                </button>
              )}
            </div>
          </div>

          {/* Main POS Register Split Layout */}
          <div className="pos-layout">
            {/* Left Column: Catalog Search, Category Tabs, and Product Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflow: "hidden" }}>
              {/* Barcode & Search Input Bar */}
              <form onSubmit={handleBarcodeSubmit}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Barcode
                      size={18}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--accent-primary)",
                      }}
                    />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Scan Barcode or search name / SKU (Press Enter to add)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                      style={{ paddingLeft: "40px", fontSize: "0.95rem" }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <Search size={16} />
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Category Filter Chips */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  overflowX: "auto",
                  paddingBottom: "4px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`btn btn-sm ${
                    selectedCategory === "ALL" ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  <Layers size={14} />
                  <span>All Categories</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`btn btn-sm ${
                      selectedCategory === cat.id ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Products Card Grid */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingRight: "4px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "0.875rem",
                  alignContent: "start",
                }}
              >
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock === 0;
                  const isLowStock = p.stock <= p.minStockAlert && p.stock > 0;

                  return (
                    <div
                      key={p.id}
                      className="card"
                      onClick={() => !isOutOfStock && addToCart(p)}
                      style={{
                        padding: "1rem",
                        cursor: isOutOfStock ? "not-allowed" : "pointer",
                        opacity: isOutOfStock ? 0.5 : 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "150px",
                        position: "relative",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            marginBottom: "0.25rem",
                          }}
                          className="mono"
                        >
                          {p.sku}
                        </div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            lineHeight: 1.3,
                            marginBottom: "0.5rem",
                          }}
                        >
                          {p.name}
                        </h4>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span
                            className="mono"
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: 700,
                              color: "var(--accent-primary)",
                            }}
                          >
                            ₹{p.price.toFixed(0)}
                          </span>

                          <span
                            className={
                              isOutOfStock
                                ? "badge badge-out-of-stock"
                                : isLowStock
                                ? "badge badge-low-stock"
                                : "badge badge-in-stock"
                            }
                            style={{ fontSize: "0.65rem" }}
                          >
                            {isOutOfStock ? "Out" : `${p.stock} left`}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          className="btn btn-secondary btn-sm"
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          <Plus size={14} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Register Cart & Checkout Pane */}
            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.25rem",
                height: "100%",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div
                className="card-header"
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShoppingCart size={18} color="var(--accent-primary)" />
                  <span className="card-title" style={{ fontSize: "1rem" }}>
                    Active Order
                  </span>
                </div>
                <span className="badge badge-primary mono">
                  {cart.reduce((a, b) => a + b.quantity, 0)} Units
                </span>
              </div>

              {/* Cart Items List */}
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                {cart.length === 0 ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    <ShoppingCart size={40} style={{ marginBottom: "0.75rem", opacity: 0.5 }} />
                    <p style={{ fontSize: "0.9rem", fontWeight: 500 }}>Register is empty</p>
                    <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      Scan barcode or click items to begin billing
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          borderRadius: "var(--radius-md)",
                          padding: "0.75rem",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "0.35rem",
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "0.85rem", maxWidth: "230px" }}>
                            {item.product.name}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                            }}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {/* Quantity stepper */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              backgroundColor: "var(--bg-card)",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="btn btn-icon btn-sm"
                              style={{ padding: "2px", height: "auto" }}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="mono" style={{ fontSize: "0.85rem", fontWeight: 600, minWidth: "20px", textAlign: "center" }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="btn btn-icon btn-sm"
                              style={{ padding: "2px", height: "auto" }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="mono" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                            ₹{item.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Selector */}
              {cart.length > 0 && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    <Tag size={12} />
                    <span>Apply Quick Discount:</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    {[0, 5, 10, 15].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercentage(pct)}
                        className={`btn btn-sm ${discountPercentage === pct ? "btn-primary" : "btn-secondary"}`}
                        style={{ flex: 1, padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                      >
                        {pct === 0 ? "0%" : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Calculation Summary */}
              <div
                style={{
                  marginTop: "0.75rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid var(--border-subtle)",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
                  <span>Subtotal</span>
                  <span className="mono">₹{subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
                  <span>GST (5%)</span>
                  <span className="mono">₹{taxAmount.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", color: "var(--accent-success)" }}>
                    <span>Discount ({discountPercentage}%)</span>
                    <span className="mono">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px dashed var(--border-strong)",
                  }}
                >
                  <span>Grand Total</span>
                  <span className="mono" style={{ color: "var(--accent-primary)" }}>
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "1rem" }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={subtotal}
        taxAmount={taxAmount}
        discountPercentage={discountPercentage}
        discountAmount={discountAmount}
        totalAmount={totalAmount}
        onCheckoutComplete={handleSaleSuccess}
      />

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
      />
    </div>
  );
}
