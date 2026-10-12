"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Navbar } from "@/frontend/components/Navbar";
import { ProductItem, SaleSummary } from "@/types";
import { usePosStore } from "@/frontend/store/use-pos-store";
import { CheckoutModal } from "@/frontend/components/CheckoutModal";
import { ThermalReceiptModal } from "@/frontend/components/ThermalReceiptModal";
import { HeldOrdersModal } from "@/frontend/components/HeldOrdersModal";
import { ShortcutsModal } from "@/frontend/components/ShortcutsModal";
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
  PauseCircle,
  Volume2,
  VolumeX,
  Keyboard,
  LayoutGrid,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  Phone,
  Sparkles,
  Zap,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function PosRegisterPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  // Filters & Pagination State
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "price_asc" | "price_desc" | "stock">("name");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(24);
  const [customDiscountInput, setCustomDiscountInput] = useState<string>("");
  const [showCustomDiscount, setShowCustomDiscount] = useState<boolean>(false);

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
    customerPhone,
    setCustomerPhone,
    isCheckoutOpen,
    setCheckoutOpen,
    isReceiptOpen,
    setReceiptOpen,
    heldOrders,
    setHeldOrdersOpen,
    holdCurrentCart,
    setShortcutsOpen,
    audioEnabled,
    toggleAudio,
    viewMode,
    setViewMode,
    completedSale,
    setCompletedSale,
    getSubtotal,
    getTax,
    getDiscount,
    getTotal,
    getTotalUnits,
  } = usePosStore();

  // Defer clock calculation for zero hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
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

  // Focus barcode input on mount and on 'F1'
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs, except for function keys
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";

      if (e.key === "F1") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === "F2") {
        e.preventDefault();
        clearCart();
      } else if (e.key === "F4") {
        e.preventDefault();
        holdCurrentCart();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0) setCheckoutOpen(true);
      } else if (e.key === "Escape") {
        setCheckoutOpen(false);
        setReceiptOpen(false);
        setHeldOrdersOpen(false);
        setShortcutsOpen(false);
        barcodeInputRef.current?.focus();
      } else if (!isInput) {
        if (e.key === "/" || e.key === "s") {
          e.preventDefault();
          barcodeInputRef.current?.focus();
        } else if (e.key === "v") {
          e.preventDefault();
          setViewMode(viewMode === "grid" ? "table" : "grid");
        } else if (e.key === "m") {
          e.preventDefault();
          toggleAudio();
        } else if (e.key === "?" || e.key === "h") {
          e.preventDefault();
          setShortcutsOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cart.length,
    clearCart,
    holdCurrentCart,
    setCheckoutOpen,
    setHeldOrdersOpen,
    setReceiptOpen,
    setShortcutsOpen,
    toggleAudio,
    viewMode,
    setViewMode,
  ]);

  // Barcode / Fast search enter handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const trimmed = searchQuery.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === trimmed ||
        p.sku.toLowerCase() === trimmed ||
        p.name.toLowerCase() === trimmed
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery("");
    } else {
      // Fuzzy search first match if exact didn't hit
      const fuzzy = products.find((p) => p.name.toLowerCase().includes(trimmed));
      if (fuzzy) {
        addToCart(fuzzy);
        setSearchQuery("");
      } else {
        toast.error(`No item matching barcode or SKU "${searchQuery}" found.`);
      }
    }
  };

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStock = true;
        if (stockFilter === "IN_STOCK") matchesStock = p.stock > 0;
        if (stockFilter === "LOW_STOCK") matchesStock = p.stock <= p.minStockAlert && p.stock > 0;

        return matchesCategory && matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "stock") return b.stock - a.stock;
        return 0;
      });
  }, [products, selectedCategory, searchQuery, stockFilter, sortBy]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, stockFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Category counts map
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Cart item quantities map for quick badges on cards
  const cartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cart]);

  const subtotal = getSubtotal();
  const taxAmount = getTax();
  const discountAmount = getDiscount();
  const totalAmount = getTotal();
  const totalUnits = getTotalUnits();

  // On sale completion
  const handleSaleSuccess = (sale: SaleSummary) => {
    setCompletedSale(sale);
    setReceiptOpen(true);
    fetchCatalog(); // Refresh stock counts
    toast.success(`Transaction Completed! Invoice #${sale.saleNumber}`);
  };

  const handleApplyCustomDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customDiscountInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setDiscountPercentage(val);
      setShowCustomDiscount(false);
      setCustomDiscountInput("");
    } else {
      toast.error("Please enter a valid discount percentage between 0 and 100.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-primary)" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "1rem 0" }}>
        <div className="container">
          {/* POS Terminal Status Ribbon */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.75rem",
              padding: "0.6rem 1rem",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {/* Left Status Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-success)",
                    boxShadow: "0 0 8px var(--accent-success)",
                    display: "inline-block",
                  }}
                />
                <h1 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Register Terminal #01</h1>
              </div>

              <span
                className="badge badge-primary mono"
                style={{ fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <Zap size={10} />
                <span>Laser Gun Scanner Ready</span>
              </span>

              {products.length > 0 && (
                <span
                  className="badge mono"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                    fontSize: "0.7rem",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {products.length} Products In Database
                </span>
              )}
            </div>

            {/* Right Action Tools & Clock */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              {/* Parked Orders Trigger */}
              <button
                type="button"
                onClick={() => setHeldOrdersOpen(true)}
                className={`btn btn-sm ${heldOrders.length > 0 ? "btn-primary" : "btn-outline"}`}
                style={{ position: "relative" }}
                title="View Parked / Suspended Orders"
              >
                <PauseCircle size={14} />
                <span>Parked Orders</span>
                {heldOrders.length > 0 && (
                  <span
                    className="badge badge-warning mono"
                    style={{
                      padding: "0.1rem 0.4rem",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                    }}
                  >
                    {heldOrders.length}
                  </span>
                )}
              </button>

              {/* Audio Beep Toggle */}
              <button
                type="button"
                onClick={toggleAudio}
                className="btn btn-outline btn-sm"
                title={audioEnabled ? "Audio Scanner Beep: ON (Click to mute)" : "Audio Scanner Beep: OFF (Click to unmute)"}
              >
                {audioEnabled ? <Volume2 size={14} color="var(--accent-success)" /> : <VolumeX size={14} color="var(--text-muted)" />}
                <span style={{ fontSize: "0.75rem" }}>{audioEnabled ? "Sound ON" : "Muted"}</span>
              </button>

              {/* Shortcuts Modal Trigger */}
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                className="btn btn-outline btn-sm"
                title="View Keyboard Shortcuts (F1, F2, F4, F9...)"
              >
                <Keyboard size={14} />
                <span>Keys (?)</span>
              </button>

              {/* Live Clock */}
              {currentTime && (
                <div
                  className="mono"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    backgroundColor: "var(--bg-tertiary)",
                    padding: "0.35rem 0.65rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Clock size={13} color="var(--accent-primary)" />
                  <span>{currentDate} • {currentTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main 2-Column POS Layout */}
          <div className="pos-layout">
            {/* LEFT COLUMN: Catalog Barcode Scanner, Filter Bar, Category Pills, Product Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflow: "hidden" }}>
              {/* High-Visibility Laser Barcode Scanner Input */}
              <form onSubmit={handleBarcodeSubmit}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Barcode
                      size={20}
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--accent-primary)",
                      }}
                    />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Scan Barcode gun or search by name / SKU (Press Enter to ring up)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                      style={{
                        paddingLeft: "44px",
                        fontSize: "0.95rem",
                        height: "44px",
                        backgroundColor: "var(--bg-card)",
                        borderColor: searchQuery ? "var(--accent-primary)" : "var(--border-strong)",
                        boxShadow: searchQuery ? "0 0 0 2px var(--accent-primary-light)" : "none",
                      }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: "0 1.25rem", height: "44px" }}>
                    <Search size={16} />
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Horizontal Category Carousel with Item Counts */}
              <div
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  overflowX: "auto",
                  paddingBottom: "4px",
                  scrollbarWidth: "thin",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`btn btn-sm ${selectedCategory === "ALL" ? "btn-primary" : "btn-secondary"}`}
                  style={{ whiteSpace: "nowrap", borderRadius: "var(--radius-full)", padding: "0.35rem 0.85rem" }}
                >
                  <Layers size={13} />
                  <span>All ({products.length})</span>
                </button>
                {categories.map((cat) => {
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`btn btn-sm ${selectedCategory === cat.id ? "btn-primary" : "btn-secondary"}`}
                      style={{ whiteSpace: "nowrap", borderRadius: "var(--radius-full)", padding: "0.35rem 0.85rem" }}
                    >
                      <span>{cat.name}</span>
                      <span
                        className="mono"
                        style={{
                          fontSize: "0.65rem",
                          opacity: 0.8,
                          backgroundColor: selectedCategory === cat.id ? "rgba(255,255,255,0.2)" : "var(--bg-tertiary)",
                          padding: "1px 6px",
                          borderRadius: "999px",
                          marginLeft: "4px",
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Catalog Controls: Stock Filter, Sort Dropdown, View Toggle, Item Counter */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  padding: "0.4rem 0.75rem",
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.8rem",
                }}
              >
                {/* Stock filter pills */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Filter:</span>
                  <button
                    type="button"
                    onClick={() => setStockFilter("ALL")}
                    className={`btn btn-sm ${stockFilter === "ALL" ? "btn-primary" : "btn-outline"}`}
                    style={{ padding: "0.15rem 0.5rem", fontSize: "0.7rem", height: "24px" }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter("IN_STOCK")}
                    className={`btn btn-sm ${stockFilter === "IN_STOCK" ? "btn-primary" : "btn-outline"}`}
                    style={{ padding: "0.15rem 0.5rem", fontSize: "0.7rem", height: "24px" }}
                  >
                    In Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter("LOW_STOCK")}
                    className={`btn btn-sm ${stockFilter === "LOW_STOCK" ? "btn-primary" : "btn-outline"}`}
                    style={{ padding: "0.15rem 0.5rem", fontSize: "0.7rem", height: "24px" }}
                  >
                    Low Stock Alert
                  </button>
                </div>

                {/* Sort, View Toggle & Count */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      style={{
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        padding: "2px 6px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      <option value="name">Name (A-Z)</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="stock">Highest Stock</option>
                    </select>
                  </div>

                  {/* View Mode Toggle: Grid vs Table */}
                  <div
                    style={{
                      display: "flex",
                      backgroundColor: "var(--bg-card)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      padding: "1px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className="btn btn-icon btn-sm"
                      style={{
                        height: "22px",
                        width: "24px",
                        padding: 0,
                        backgroundColor: viewMode === "grid" ? "var(--accent-primary)" : "transparent",
                        color: viewMode === "grid" ? "#fff" : "var(--text-secondary)",
                        borderRadius: "3px",
                      }}
                      title="Grid Card View (V)"
                    >
                      <LayoutGrid size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className="btn btn-icon btn-sm"
                      style={{
                        height: "22px",
                        width: "24px",
                        padding: 0,
                        backgroundColor: viewMode === "table" ? "var(--accent-primary)" : "transparent",
                        color: viewMode === "table" ? "#fff" : "var(--text-secondary)",
                        borderRadius: "3px",
                      }}
                      title="Dense Table View (V)"
                    >
                      <ListFilter size={13} />
                    </button>
                  </div>

                  <span className="mono" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    Showing {paginatedProducts.length} of {filteredProducts.length}
                  </span>
                </div>
              </div>

              {/* PRODUCTS CONTAINER: Grid View or Dense Supermarket Table View */}
              {viewMode === "grid" ? (
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: "4px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                    gap: "0.75rem",
                    alignContent: "start",
                  }}
                >
                  {paginatedProducts.map((p) => {
                    const isOutOfStock = p.stock === 0;
                    const isLowStock = p.stock <= p.minStockAlert && p.stock > 0;
                    const qtyInCart = cartQuantities.get(p.id) || 0;

                    return (
                      <div
                        key={p.id}
                        className="card"
                        onClick={() => !isOutOfStock && addToCart(p)}
                        style={{
                          padding: "0.85rem",
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                          opacity: isOutOfStock ? 0.5 : 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          minHeight: "165px",
                          position: "relative",
                          border: qtyInCart > 0 ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                          backgroundColor: qtyInCart > 0 ? "var(--bg-card-hover)" : "var(--bg-card)",
                          transition: "var(--transition-fast)",
                        }}
                      >
                        {/* Active Cart Counter Badge */}
                        {qtyInCart > 0 && (
                          <span
                            className="badge badge-primary mono"
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                            }}
                          >
                            {qtyInCart} in cart
                          </span>
                        )}

                        <div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              marginBottom: "0.2rem",
                            }}
                            className="mono"
                          >
                            {p.sku}
                          </div>
                          <h4
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              lineHeight: 1.35,
                              marginBottom: "0.35rem",
                              paddingRight: qtyInCart > 0 ? "40px" : "0",
                            }}
                          >
                            {p.name}
                          </h4>
                        </div>

                        <div>
                          {/* Real Scannable Barcode SVG */}
                          <div style={{ margin: "2px 0 6px", height: "20px", overflow: "hidden" }}>
                            <BarcodeRenderer
                              value={p.barcode}
                              displayValue={false}
                              height={16}
                              width={1}
                              lineColor="var(--text-muted)"
                            />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.4rem",
                            }}
                          >
                            <span
                              className="mono"
                              style={{
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                color: "var(--accent-success)",
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
                            className={`btn btn-sm ${qtyInCart > 0 ? "btn-primary" : "btn-secondary"}`}
                            style={{ width: "100%", justifyContent: "center", height: "30px", fontSize: "0.75rem" }}
                          >
                            <Plus size={13} />
                            <span>{qtyInCart > 0 ? `Add Another (+1)` : "Add to Cart"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* DENSE SUPERMARKET TABLE VIEW */
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          color: "var(--text-secondary)",
                          textAlign: "left",
                          borderBottom: "1px solid var(--border-strong)",
                        }}
                      >
                        <th style={{ padding: "8px 12px" }}>SKU</th>
                        <th style={{ padding: "8px 12px" }}>Product Name</th>
                        <th style={{ padding: "8px 12px" }}>Barcode</th>
                        <th style={{ padding: "8px 12px" }}>Stock</th>
                        <th style={{ padding: "8px 12px", textAlign: "right" }}>Price</th>
                        <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((p) => {
                        const isOutOfStock = p.stock === 0;
                        const isLowStock = p.stock <= p.minStockAlert && p.stock > 0;
                        const qtyInCart = cartQuantities.get(p.id) || 0;

                        return (
                          <tr
                            key={p.id}
                            onClick={() => !isOutOfStock && addToCart(p)}
                            style={{
                              borderBottom: "1px solid var(--border-subtle)",
                              cursor: isOutOfStock ? "not-allowed" : "pointer",
                              backgroundColor: qtyInCart > 0 ? "var(--bg-card-hover)" : "transparent",
                              transition: "background-color 150ms",
                            }}
                          >
                            <td className="mono" style={{ padding: "8px 12px", color: "var(--text-muted)" }}>
                              {p.sku}
                            </td>
                            <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                              {p.name}
                              {qtyInCart > 0 && (
                                <span className="badge badge-primary mono" style={{ marginLeft: "6px", fontSize: "0.6rem" }}>
                                  {qtyInCart} in cart
                                </span>
                              )}
                            </td>
                            <td className="mono" style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>
                              {p.barcode}
                            </td>
                            <td style={{ padding: "8px 12px" }}>
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
                            </td>
                            <td className="mono" style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--accent-success)" }}>
                              ₹{p.price.toFixed(2)}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              <button
                                type="button"
                                disabled={isOutOfStock}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "2px 8px", height: "26px", fontSize: "0.7rem" }}
                              >
                                <Plus size={12} />
                                <span>Add</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer Controls */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.4rem 0.75rem",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="btn btn-outline btn-sm"
                    style={{ padding: "0.2rem 0.6rem", height: "28px" }}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredProducts.length} items)
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="btn btn-outline btn-sm"
                    style={{ padding: "0.2rem 0.6rem", height: "28px" }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Real-Time Cashier Cart & Invoice Ledger */}
            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1rem",
                height: "100%",
                boxShadow: "var(--shadow-md)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              {/* Cart Top Header with Customer Phone Field */}
              <div
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "0.6rem",
                  marginBottom: "0.6rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <ShoppingCart size={17} color="var(--accent-primary)" />
                    <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>Active Order</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span className="badge badge-primary mono" style={{ fontSize: "0.7rem" }}>
                      {totalUnits} Units
                    </span>

                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={holdCurrentCart}
                        className="btn btn-outline btn-sm"
                        style={{ padding: "2px 6px", height: "24px", fontSize: "0.7rem" }}
                        title="Park this cart to ring up another customer (F4)"
                      >
                        <PauseCircle size={12} />
                        <span>Hold (F4)</span>
                      </button>
                    )}

                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={clearCart}
                        className="btn btn-outline btn-sm"
                        style={{ padding: "2px 6px", height: "24px", fontSize: "0.7rem", color: "var(--accent-danger)" }}
                        title="Clear cart (F2)"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Customer Mobile Input */}
                <div style={{ position: "relative" }}>
                  <Phone
                    size={13}
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Customer Mobile (Optional, prints on receipt)..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.35rem 0.5rem 0.35rem 30px",
                      fontSize: "0.75rem",
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              {/* Cart Items Scroll Area */}
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
                      padding: "2rem 1rem",
                    }}
                  >
                    <ShoppingBag size={40} style={{ marginBottom: "0.75rem", opacity: 0.3 }} />
                    <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>Register is Empty</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.3rem", maxWidth: "220px" }}>
                      Scan barcode gun or click items in catalog to start billing.
                    </p>
                    <div
                      style={{
                        marginTop: "1.25rem",
                        backgroundColor: "var(--bg-tertiary)",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "0.7rem",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                        ⚡ Quick Keys:
                      </div>
                      <div><strong>F1</strong>: Focus barcode search</div>
                      <div><strong>F4</strong>: Park / Hold current order</div>
                      <div><strong>F9</strong>: Instant checkout modal</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          borderRadius: "var(--radius-md)",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "0.825rem", maxWidth: "220px", lineHeight: 1.3 }}>
                            {item.product.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "2px",
                            }}
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {/* Quantity Stepper with Stock Limit Guard */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              backgroundColor: "var(--bg-card)",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="btn btn-icon btn-sm"
                              style={{ padding: "2px", height: "auto" }}
                            >
                              <Minus size={11} />
                            </button>
                            <span className="mono" style={{ fontSize: "0.8rem", fontWeight: 700, minWidth: "22px", textAlign: "center" }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="btn btn-icon btn-sm"
                              style={{ padding: "2px", height: "auto" }}
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div className="mono" style={{ fontWeight: 700, fontSize: "0.925rem" }}>
                              ₹{item.totalPrice.toFixed(2)}
                            </div>
                            <div className="mono" style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                              @ ₹{item.unitPrice.toFixed(0)} ea
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Selector Engine */}
              {cart.length > 0 && (
                <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <Tag size={12} color="var(--accent-primary)" />
                      <span>Store Discount:</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCustomDiscount(!showCustomDiscount)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-primary)",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {showCustomDiscount ? "Hide Custom" : "Custom %"}
                    </button>
                  </div>

                  {showCustomDiscount ? (
                    <form onSubmit={handleApplyCustomDiscount} style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                      <input
                        type="number"
                        placeholder="Discount % (0-100)"
                        min={0}
                        max={100}
                        value={customDiscountInput}
                        onChange={(e) => setCustomDiscountInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "0.2rem 0.5rem",
                          fontSize: "0.75rem",
                          backgroundColor: "var(--bg-secondary)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" style={{ padding: "0 0.5rem", fontSize: "0.75rem" }}>
                        Apply
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {[0, 5, 10, 15].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPercentage(pct)}
                          className={`btn btn-sm ${discountPercentage === pct ? "btn-primary" : "btn-secondary"}`}
                          style={{ flex: 1, padding: "0.2rem 0.35rem", fontSize: "0.725rem", height: "26px" }}
                        >
                          {pct === 0 ? "0%" : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Financial Calculation Ledger (Receipt Style) */}
              <div
                style={{
                  marginTop: "0.5rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--border-subtle)",
                  fontSize: "0.825rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem", color: "var(--text-secondary)" }}>
                  <span>Subtotal ({totalUnits} items)</span>
                  <span className="mono">₹{subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem", color: "var(--text-secondary)" }}>
                  <span>GST Tax (5%)</span>
                  <span className="mono">₹{taxAmount.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem", color: "var(--accent-success)" }}>
                    <span>Store Discount ({discountPercentage}%)</span>
                    <span className="mono">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Grand Total Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: "1.3rem",
                    fontWeight: 800,
                    marginTop: "0.4rem",
                    paddingTop: "0.4rem",
                    borderTop: "1px dashed var(--border-strong)",
                  }}
                >
                  <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontWeight: 600 }}>Total Payable</span>
                  <span className="mono" style={{ color: "var(--accent-success)" }}>
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setCheckoutOpen(true)}
                className="btn btn-primary btn-lg"
                style={{
                  width: "100%",
                  marginTop: "0.75rem",
                  height: "48px",
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: 700,
                  boxShadow: cart.length > 0 ? "0 4px 12px var(--accent-primary-light)" : "none",
                }}
              >
                <span>Proceed to Payment (F9)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Payment Dialog */}
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

      {/* 80mm Thermal Receipt Dialog */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setReceiptOpen(false)}
        sale={completedSale}
      />

      {/* Parked / Suspended Orders Drawer */}
      <HeldOrdersModal />

      {/* Keyboard Shortcuts Cheatsheet */}
      <ShortcutsModal />
    </div>
  );
}
