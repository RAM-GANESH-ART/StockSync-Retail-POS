"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductItem } from "@/types";
import { ProductFormModal } from "@/components/ProductFormModal";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  PlusCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (showLowStockOnly) params.append("lowStock", "true");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        if (data.categories) setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, showLowStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Quick Restock (+5 units)
  const handleQuickRestock = async (product: ProductItem) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: product.stock + 5 }),
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Error restocking:", err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // Metrics
  const totalSKUs = products.length;
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;
  const totalValuation = products.reduce((acc, p) => acc + p.stock * p.price, 0);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "2rem 0" }}>
        <div className="container">
          {/* Top Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.75rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Inventory Management
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Real-time stock catalog, threshold alerts, and SKU tracking
              </p>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="btn btn-primary btn-lg"
            >
              <Plus size={18} />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid-cols-3" style={{ marginBottom: "2rem" }}>
            <div className="card">
              <div className="card-header" style={{ marginBottom: "0.5rem" }}>
                <span className="card-title" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Total Catalog SKUs
                </span>
                <Package size={20} color="var(--accent-primary)" />
              </div>
              <div className="mono" style={{ fontSize: "2rem", fontWeight: 700 }}>
                {totalSKUs}
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ marginBottom: "0.5rem" }}>
                <span className="card-title" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Low Stock Warnings
                </span>
                <AlertTriangle size={20} color="var(--accent-warning)" />
              </div>
              <div className="mono" style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent-warning)" }}>
                {lowStockCount}
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ marginBottom: "0.5rem" }}>
                <span className="card-title" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Total Stock Valuation
                </span>
                <TrendingUp size={20} color="var(--accent-success)" />
              </div>
              <div className="mono" style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent-success)" }}>
                ₹{totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div
            className="card"
            style={{
              padding: "1rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "280px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by name, SKU, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                  style={{ paddingLeft: "36px" }}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select"
                style={{ width: "auto", minWidth: "180px" }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`btn ${showLowStockOnly ? "btn-danger" : "btn-secondary"}`}
              >
                <AlertTriangle size={15} />
                <span>Low Stock Only ({lowStockCount})</span>
              </button>

              <button onClick={() => fetchProducts()} className="btn btn-outline btn-icon" title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Product Table */}
          <div className="table-container">
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                Loading inventory catalog...
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <Package size={48} color="var(--text-muted)" style={{ margin: "0 auto 1rem auto" }} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>No products found</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                  Try adjusting your search criteria or add a new product.
                </p>
              </div>
            ) : (
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Product & Details</th>
                    <th>SKU / Barcode</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Cost Price</th>
                    <th>Stock Level</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLowStock = p.stock <= p.minStockAlert && p.stock > 0;
                    const isOutOfStock = p.stock === 0;

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Min alert threshold: {p.minStockAlert} units
                          </div>
                        </td>
                        <td>
                          <div className="mono" style={{ fontSize: "0.8125rem" }}>
                            {p.sku}
                          </div>
                          <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {p.barcode}
                          </div>
                        </td>
                        <td>{p.category?.name || "General"}</td>
                        <td className="mono" style={{ fontWeight: 600 }}>
                          ₹{p.price.toFixed(2)}
                        </td>
                        <td className="mono" style={{ color: "var(--text-muted)" }}>
                          ₹{p.costPrice.toFixed(2)}
                        </td>
                        <td className="mono" style={{ fontWeight: 700, fontSize: "1rem" }}>
                          {p.stock}
                        </td>
                        <td>
                          {isOutOfStock ? (
                            <span className="badge badge-out-of-stock">Out of Stock</span>
                          ) : isLowStock ? (
                            <span className="badge badge-low-stock">Low Stock</span>
                          ) : (
                            <span className="badge badge-in-stock">In Stock</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                            <button
                              onClick={() => handleQuickRestock(p)}
                              className="btn btn-outline btn-sm"
                              title="Restock +5 units"
                            >
                              <PlusCircle size={14} color="var(--accent-success)" />
                              <span>+5</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsModalOpen(true);
                              }}
                              className="btn btn-outline btn-sm btn-icon"
                              title="Edit product"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="btn btn-outline btn-sm btn-icon"
                              title="Delete product"
                              style={{ color: "var(--accent-danger)" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchProducts}
        editingProduct={editingProduct}
        categories={categories}
      />
    </div>
  );
}
