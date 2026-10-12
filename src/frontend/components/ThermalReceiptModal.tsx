"use client";

import React from "react";
import { SaleSummary } from "@/types";
import { BarcodeRenderer } from "./BarcodeRenderer";
import { Printer, CheckCircle, X, ShoppingBag } from "lucide-react";

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleSummary | null;
}

export function ThermalReceiptModal({
  isOpen,
  onClose,
  sale,
}: ThermalReceiptModalProps) {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          maxWidth: "420px",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Modal Top Bar */}
        <div className="card-header no-print" style={{ margin: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle size={20} color="var(--accent-success)" />
            <h2 className="card-title" style={{ fontSize: "1rem" }}>
              Sale Completed Successfully
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-icon" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Printable 80mm Thermal Receipt Layout */}
        <div className="thermal-receipt">
          <div className="receipt-header">
            <div className="receipt-title">STOCKSYNC RETAIL</div>
            <div className="receipt-meta">Store #104 • Flagship Express Terminal</div>
            <div className="receipt-meta">GSTIN: 36AAACS1429B1Z8</div>
            <div className="receipt-meta">Ph: +91 98765 43210</div>
          </div>

          <div style={{ fontSize: "11px", marginBottom: "8px" }}>
            <div>
              <strong>Invoice #:</strong> {sale.saleNumber}
            </div>
            <div>
              <strong>Date:</strong> {formattedDate}
            </div>
            <div>
              <strong>Cashier:</strong> {sale.cashierName || "Terminal 01"}
            </div>
            <div>
              <strong>Payment:</strong> {sale.paymentMethod}
            </div>
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Item</th>
                <th style={{ textAlign: "center", width: "15%" }}>Qty</th>
                <th style={{ textAlign: "right", width: "17%" }}>Price</th>
                <th style={{ textAlign: "right", width: "18%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ wordBreak: "break-word" }}>{item.productName}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>₹{item.unitPrice.toFixed(0)}</td>
                  <td style={{ textAlign: "right" }}>₹{item.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider"></div>

          <div style={{ fontSize: "11px", display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal:</span>
            <span>₹{sale.subtotal.toFixed(2)}</span>
          </div>

          <div style={{ fontSize: "11px", display: "flex", justifyContent: "space-between" }}>
            <span>Taxes (GST 5%):</span>
            <span>₹{sale.taxAmount.toFixed(2)}</span>
          </div>

          {sale.discountAmount > 0 && (
            <div
              style={{
                fontSize: "11px",
                display: "flex",
                justifyContent: "space-between",
                color: "#000",
              }}
            >
              <span>Discount:</span>
              <span>-₹{sale.discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="receipt-divider"></div>

          <div className="receipt-total">
            <span>TOTAL AMOUNT:</span>
            <span>₹{sale.totalAmount.toFixed(2)}</span>
          </div>

          <div className="receipt-footer">
            {/* Real scannable barcode rendered by JsBarcode */}
            <div style={{ margin: "6px 0" }}>
              <BarcodeRenderer
                value={sale.saleNumber}
                format="CODE128"
                width={1.4}
                height={32}
                fontSize={10}
              />
            </div>
            <div>THANK YOU FOR SHOPPING WITH US!</div>
            <div>Goods once sold can be exchanged within 7 days.</div>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden when printing) */}
        <div className="no-print" style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1 }}>
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>

          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            <ShoppingBag size={16} />
            <span>Next Transaction</span>
          </button>
        </div>
      </div>
    </div>
  );
}
