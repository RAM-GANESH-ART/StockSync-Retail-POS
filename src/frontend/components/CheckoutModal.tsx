"use client";

import React, { useState } from "react";
import { CartItem, SaleSummary } from "@/types";
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  Receipt,
  Smartphone,
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number;
  onCheckoutComplete: (sale: SaleSummary) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  subtotal,
  taxAmount,
  discountPercentage,
  discountAmount,
  totalAmount,
  onCheckoutComplete,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">("CASH");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const tenderedVal = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedVal - totalAmount);

  const executeCheckout = async () => {
    if (paymentMethod === "CASH" && tenderedVal < totalAmount) {
      setErrorMsg(`Cash tendered (₹${tenderedVal}) is less than total payable (₹${totalAmount.toFixed(2)})`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
        paymentMethod,
        discountPercentage,
        taxRatePercentage: 5,
        cashTendered: paymentMethod === "CASH" ? tenderedVal : undefined,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process sale.");
      }

      onCheckoutComplete(data.sale);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment processing error";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: "520px" }}>
        {/* Header */}
        <div className="card-header" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Receipt size={20} color="var(--accent-primary)" />
            <h2 className="card-title">Complete Checkout</h2>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-icon" aria-label="Close">
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

        {/* Bill Summary Banner */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Items Count:</span>
            <span className="mono" style={{ fontWeight: 600 }}>
              {cart.reduce((a, b) => a + b.quantity, 0)} units ({cart.length} items)
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Subtotal:</span>
            <span className="mono">₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>GST Tax (5%):</span>
            <span className="mono">₹{taxAmount.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem", color: "var(--accent-success)" }}>
              <span>Discount ({discountPercentage}%):</span>
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
            <span>Net Payable:</span>
            <span className="mono" style={{ color: "var(--accent-primary)" }}>
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
            Choose Payment Method
          </label>
          <div className="grid-cols-3" style={{ gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              className={`btn ${paymentMethod === "CASH" ? "btn-primary" : "btn-secondary"}`}
              style={{ flexDirection: "column", padding: "0.75rem 0.5rem", height: "auto" }}
            >
              <Banknote size={20} />
              <span style={{ fontSize: "0.8rem", marginTop: "4px" }}>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              className={`btn ${paymentMethod === "CARD" ? "btn-primary" : "btn-secondary"}`}
              style={{ flexDirection: "column", padding: "0.75rem 0.5rem", height: "auto" }}
            >
              <CreditCard size={20} />
              <span style={{ fontSize: "0.8rem", marginTop: "4px" }}>Card / EDC</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("UPI")}
              className={`btn ${paymentMethod === "UPI" ? "btn-primary" : "btn-secondary"}`}
              style={{ flexDirection: "column", padding: "0.75rem 0.5rem", height: "auto" }}
            >
              <QrCode size={20} />
              <span style={{ fontSize: "0.8rem", marginTop: "4px" }}>Counter UPI</span>
            </button>
          </div>
        </div>

        {/* Cash Tendered Calculator */}
        {paymentMethod === "CASH" && (
          <div
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <div className="form-group" style={{ marginBottom: "0.5rem" }}>
              <label className="form-label" htmlFor="cash-tendered">
                Cash Tendered by Customer (₹)
              </label>
              <input
                id="cash-tendered"
                type="number"
                step="1"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder={`e.g. ${Math.ceil(totalAmount / 100) * 100}`}
                className="input mono"
                style={{ fontSize: "1.1rem" }}
                autoFocus
              />
            </div>

            {tenderedVal > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>Change to Return:</span>
                <span className="mono" style={{ color: tenderedVal >= totalAmount ? "var(--accent-success)" : "var(--accent-danger)" }}>
                  ₹{changeDue.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Card Instructions */}
        {paymentMethod === "CARD" && (
          <div
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              marginBottom: "1.25rem",
              textAlign: "center",
            }}
          >
            <CreditCard size={28} color="var(--accent-primary)" style={{ margin: "0 auto 0.5rem auto" }} />
            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>Swipe or Tap Card on Store EDC Terminal</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Amount: ₹{totalAmount.toFixed(2)} • Visa / MasterCard / RuPay
            </div>
          </div>
        )}

        {/* Counter UPI QR View */}
        {paymentMethod === "UPI" && (
          <div
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              marginBottom: "1.25rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "120px",
                height: "120px",
                margin: "0 auto 0.75rem auto",
                backgroundColor: "#ffffff",
                padding: "8px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--accent-primary)",
              }}
            >
              <QrCode size={104} color="#000000" />
            </div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <Smartphone size={16} color="var(--accent-success)" />
              <span>Customer scans via any UPI App</span>
            </div>
            <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              UPI ID: stocksync@upi • ₹{totalAmount.toFixed(2)}
            </div>
          </div>
        )}

        {/* Submit Action */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Back to Register
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={executeCheckout}
            className="btn btn-success btn-lg"
            style={{ flex: 2 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Confirm Payment (₹{totalAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
