"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/frontend/components/Navbar";
import { SaleSummary } from "@/types";
import { ThermalReceiptModal } from "@/frontend/components/ThermalReceiptModal";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  RefreshCw,
  Eye,
  BarChart2,
  Package,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    todayRevenue: number;
    totalTransactions: number;
    lowStockCount: number;
  };
  revenueChart: { date: string; revenue: number }[];
  topProducts: { name: string; sku: string; unitsSold: number; totalRevenue: number }[];
  recentSales: (SaleSummary & { itemsCount: number })[];
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SaleSummary | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "2rem 0" }}>
        <div className="container">
          {/* Header */}
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
                Executive Analytics & Sales Reports
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Live revenue metrics, transaction ledger, and inventory velocity
              </p>
            </div>

            <button onClick={() => fetchAnalytics()} className="btn btn-secondary">
              <RefreshCw size={16} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {loading || !data ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
              Loading executive store analytics...
            </div>
          ) : (
            <>
              {/* Top 4 KPI Cards */}
              <div className="grid-cols-4" style={{ marginBottom: "2rem" }}>
                <div className="card">
                  <div className="card-header" style={{ marginBottom: "0.5rem" }}>
                    <span className="card-title" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      Today&apos;s Revenue
                    </span>
                    <TrendingUp size={20} color="var(--accent-primary)" />
                  </div>
                  <div className="mono" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                    ₹{data.metrics.todayRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                    Active sales today
                  </div>
                </div>

                <div className="card">
                  <div className="card-header" style={{ marginBottom: "0.5rem" }}>
                    <span className="card-title" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      Total Store Revenue
                    </span>
                    <DollarSign size={20} color="var(--accent-success)" />
                  </div>
                  <div className="mono" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-success)" }}>
                    ₹{data.metrics.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                    All-time completed sales
                  </div>
                </div>

                <div className="card">
                  <div className="card-header" style={{ marginBottom: "0.5rem" }}>
                    <span className="card-title" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      Total Invoices Processed
                    </span>
                    <Receipt size={20} color="var(--accent-purple)" />
                  </div>
                  <div className="mono" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
                    {data.metrics.totalTransactions}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                    POS checkout transactions
                  </div>
                </div>

                <div className="card">
                  <div className="card-header" style={{ marginBottom: "0.5rem" }}>
                    <span className="card-title" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      Critical Stock Alerts
                    </span>
                    <AlertTriangle size={20} color="var(--accent-warning)" />
                  </div>
                  <div className="mono" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-warning)" }}>
                    {data.metrics.lowStockCount}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                    Items below minimum threshold
                  </div>
                </div>
              </div>

              {/* Chart & Top Products Row */}
              <div className="grid-cols-3" style={{ marginBottom: "2rem" }}>
                {/* 7-Day Revenue Trend Bar Chart (Spans 2 columns) */}
                <div className="card" style={{ gridColumn: "span 2" }}>
                  <div className="card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <BarChart2 size={18} color="var(--accent-primary)" />
                      <h3 className="card-title" style={{ fontSize: "1rem" }}>
                        7-Day Revenue Trajectory
                      </h3>
                    </div>
                  </div>

                  <div style={{ height: "280px", width: "100%", marginTop: "1rem" }}>
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.revenueChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            tickFormatter={(v) => `₹${v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--bg-secondary)",
                              borderColor: "var(--border-strong)",
                              borderRadius: "var(--radius-md)",
                              color: "var(--text-primary)",
                            }}
                            formatter={(value: unknown) => [
                              `₹${Number(value).toFixed(2)}`,
                              "Revenue",
                            ]}
                          />
                          <Bar dataKey="revenue" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Top Selling Products */}
                <div className="card">
                  <div className="card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Package size={18} color="var(--accent-success)" />
                      <h3 className="card-title" style={{ fontSize: "1rem" }}>
                        Top Selling SKUs
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginTop: "1rem" }}>
                    {data.topProducts.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        No product sales recorded yet.
                      </p>
                    ) : (
                      data.topProducts.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid var(--border-subtle)",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.name}</div>
                            <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {p.unitsSold} units sold
                            </div>
                          </div>
                          <div className="mono" style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent-success)" }}>
                            ₹{p.totalRevenue.toFixed(0)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Sales Ledger Table */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title" style={{ fontSize: "1rem" }}>
                    Recent Sales Ledger & Invoices
                  </h3>
                </div>

                <div className="table-container" style={{ border: "none" }}>
                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Date & Time</th>
                        <th>Cashier</th>
                        <th>Items Count</th>
                        <th>Payment Method</th>
                        <th>Total Amount</th>
                        <th style={{ textAlign: "right" }}>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="mono" style={{ fontWeight: 600, color: "var(--accent-primary)" }}>
                            {sale.saleNumber}
                          </td>
                          <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                            {new Date(sale.createdAt).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td>{sale.cashierName}</td>
                          <td className="mono">{sale.itemsCount}</td>
                          <td>
                            <span className="badge badge-primary mono" style={{ fontSize: "0.65rem" }}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="mono" style={{ fontWeight: 700 }}>
                            ₹{sale.totalAmount.toFixed(2)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => setSelectedReceipt(sale)}
                              className="btn btn-outline btn-sm"
                              title="Reprint Receipt"
                            >
                              <Eye size={14} />
                              <span>View Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Thermal Receipt Modal for Re-print */}
      <ThermalReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        sale={selectedReceipt}
      />
    </div>
  );
}
