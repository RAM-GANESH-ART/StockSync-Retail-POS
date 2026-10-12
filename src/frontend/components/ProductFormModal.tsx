"use client";

import React, { useState, useEffect } from "react";
import { ProductItem } from "@/types";
import { X, Save, AlertCircle } from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingProduct?: ProductItem | null;
  categories: { id: string; name: string }[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  categories,
}: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStockAlert, setMinStockAlert] = useState("5");
  const [categoryId, setCategoryId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setBarcode(editingProduct.barcode);
      setPrice(editingProduct.price.toString());
      setCostPrice(editingProduct.costPrice.toString());
      setStock(editingProduct.stock.toString());
      setMinStockAlert(editingProduct.minStockAlert.toString());
      setCategoryId(editingProduct.categoryId);
    } else {
      setName("");
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setPrice("");
      setCostPrice("");
      setStock("10");
      setMinStockAlert("5");
      setCategoryId(categories[0]?.id || "");
    }
    setErrorMsg(null);
  }, [editingProduct, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const payload = {
      name,
      sku,
      barcode,
      price: parseFloat(price),
      costPrice: parseFloat(costPrice || "0"),
      stock: parseInt(stock, 10),
      minStockAlert: parseInt(minStockAlert, 10),
      categoryId,
    };

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      onSave();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: "560px" }}>
        <div className="card-header" style={{ marginBottom: "1.25rem" }}>
          <h2 className="card-title">
            {editingProduct ? "Edit Product" : "Add New Inventory Item"}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-outline btn-icon"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: "var(--accent-danger-bg)",
              border: "1px solid var(--accent-danger)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--accent-danger)",
              fontSize: "0.8125rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="prod-name">
              Product Name *
            </label>
            <input
              id="prod-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Logitech Wireless Mouse M185"
            />
          </div>

          <div className="grid-cols-2" style={{ gap: "0.75rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="prod-sku">
                SKU Code *
              </label>
              <input
                id="prod-sku"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="input mono"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-barcode">
                Barcode (EAN/UPC) *
              </label>
              <input
                id="prod-barcode"
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="input mono"
              />
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: "0.75rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="prod-category">
                Category *
              </label>
              <select
                id="prod-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="select"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-price">
                Selling Price (₹) *
              </label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input mono"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid-cols-3" style={{ gap: "0.75rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="prod-cost">
                Cost Price (₹)
              </label>
              <input
                id="prod-cost"
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="input mono"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-stock">
                Current Stock *
              </label>
              <input
                id="prod-stock"
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="input mono"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-min">
                Min Stock Alert *
              </label>
              <input
                id="prod-min"
                type="number"
                required
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="input mono"
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "1.5rem",
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              <Save size={16} />
              <span>{isSubmitting ? "Saving..." : "Save Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
