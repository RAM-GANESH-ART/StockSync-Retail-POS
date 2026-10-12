import React from "react";
import Link from "next/link";
import { Navbar } from "@/frontend/components/Navbar";
import { ShoppingCart, Package, BarChart3, ShieldCheck, Zap, Receipt, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "3rem 0" }}>
        <div className="container">
          {/* Hero Banner */}
          <div
            className="card"
            style={{
              padding: "3.5rem 2.5rem",
              background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-xl)",
              marginBottom: "3rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ maxWidth: "720px", position: "relative", zIndex: 1 }}>
              <span
                className="badge badge-primary mono"
                style={{ marginBottom: "1.25rem", padding: "0.3rem 0.8rem" }}
              >
                StockSync v1.0 • Enterprise POS & Inventory
              </span>
              <h1
                style={{
                  fontSize: "2.75rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  marginBottom: "1.25rem",
                }}
              >
                High-Speed Retail Billing & Intelligent Stock Synchronization
              </h1>
              <p
                style={{
                  fontSize: "1.125rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "2rem",
                }}
              >
                Designed for retail counter speed. Real-time barcode scanning, atomic PostgreSQL stock depletion, multi-payment support (Cash, Card, Counter UPI), and thermal receipt printing.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                <Link href="/pos" className="btn btn-primary btn-lg">
                  <ShoppingCart size={18} />
                  <span>Launch POS Register</span>
                  <ArrowRight size={16} />
                </Link>

                <Link href="/inventory" className="btn btn-secondary btn-lg">
                  <Package size={18} />
                  <span>Manage Inventory</span>
                </Link>

                <Link href="/dashboard" className="btn btn-outline btn-lg">
                  <BarChart3 size={18} />
                  <span>Live Analytics</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Feature Pillars */}
          <div className="grid-cols-3">
            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--accent-primary-light)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <Zap size={22} />
              </div>
              <h3 className="card-title" style={{ marginBottom: "0.5rem" }}>
                Instant POS Checkout
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                Sub-second item lookup by SKU, barcode, or name. Keyboard-navigable cart, tax calculations, and discount toggles.
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--accent-success-bg)",
                  color: "var(--accent-success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <Receipt size={22} />
              </div>
              <h3 className="card-title" style={{ marginBottom: "0.5rem" }}>
                Multi-Payment & Thermal Receipts
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                Instant checkout supporting Cash (with change calculator), Card EDC, and Counter UPI QR scanning with 80mm thermal receipt printing.
              </p>
            </div>

            <div className="card">
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--accent-warning-bg)",
                  color: "var(--accent-warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <h3 className="card-title" style={{ marginBottom: "0.5rem" }}>
                Low-Stock Threshold Alerts
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                Automated inventory guardrails prevent overselling with atomic transactions and flag replenishment requirements instantly.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
