"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/frontend/components/Navbar";
import { ProductItem, SaleSummary } from "@/types";
import { usePosStore } from "@/frontend/store/use-pos-store";
import { CheckoutModal } from "@/frontend/components/CheckoutModal";
import { ThermalReceiptModal } from "@/frontend/components/ThermalReceiptModal";
import { BarcodeRenderer } from "@/frontend/components/BarcodeRenderer";
import { toast } from "sonner";
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
  const [currentTime, setCurrentTime] = useState<string>("");

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Zustand Store
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    discountPercentage,
    setDiscountPercentage,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isCheckoutOpen,
    setCheckoutOpen,
    isReceiptOpen,
    setReceiptOpen,
    completedSale,
    setCompletedSale,
    getSubtotal,
    getTax,
    getDiscount,
    getTotal,
    getTotalUnits,
  } = usePosStore();

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
      toast.error(`No product matching barcode or SKU "${searchQuery}" found.`);
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

  const subtotal = getSubtotal();
  const taxAmount = getTax();
  const discountAmount = getDiscount();
  const totalAmount = getTotal();
  const totalUnits = getTotalUnits();

  // On sale success
  const handleSaleSuccess = (sale: SaleSummary) => {
    setCompletedSale(sale);
    setReceiptOpen(true);
    fetchCatalog(); // Refresh inventory stock immediately
    toast.success(`Transaction Completed! Invoice #${sale.saleNumber}`);
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
                TERMINAL #01 (ZUSTAND STORE)
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
                        minHeight: "160px",
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
                            marginBottom: "0.4rem",
                          }}
                        >
                          {p.name}
                        </h4>
                      </div>

                      <div>
                        {/* Real scannable barcode snippet */}
                        <div style={{ margin: "4px 0", height: "22px", overflow: "hidden" }}>
                          <BarcodeRenderer
                            value={p.barcode}
                            displayValue={false}
                            height={18}
                            width={1}
                            lineColor="var(--text-muted)"
                          />
                        </div>

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
                  {totalUnits} Units
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
                onClick={() => setCheckoutOpen(true)}
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
        onClose={() => setCheckoutOpen(false)}
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
        onClose={() => setReceiptOpen(false)}
        sale={completedSale}
      />
    </div>
  );
}
