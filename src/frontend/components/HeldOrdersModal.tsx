import React from "react";
import { usePosStore } from "@/frontend/store/use-pos-store";
import { X, Play, Trash2, Clock, ShoppingBag, Phone } from "lucide-react";

export function HeldOrdersModal() {
  const { heldOrders, isHeldOrdersOpen, setHeldOrdersOpen, resumeHeldOrder, discardHeldOrder } = usePosStore();

  if (!isHeldOrdersOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setHeldOrdersOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", padding: "1.5rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingBag size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
              Parked & Suspended Orders ({heldOrders.length})
            </h3>
          </div>
          <button
            onClick={() => setHeldOrdersOpen(false)}
            className="btn btn-icon btn-sm"
            style={{ border: "none", background: "none" }}
          >
            <X size={18} />
          </button>
        </div>

        {heldOrders.length === 0 ? (
          <div
            style={{
              padding: "3rem 1rem",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <ShoppingBag size={42} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
            <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>No Parked Orders</p>
            <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              Press &ldquo;Hold Cart&rdquo; on the register to park an order while a customer retrieves more items.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "60vh", overflowY: "auto" }}>
            {heldOrders.map((order, idx) => (
              <div
                key={order.id}
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="badge badge-primary mono" style={{ fontSize: "0.75rem" }}>
                      {order.id}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <Clock size={12} /> {order.heldAt}
                    </span>
                  </div>

                  <span className="mono" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--accent-primary)" }}>
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>

                {order.customerPhone && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Phone size={12} /> Phone: {order.customerPhone}
                  </div>
                )}

                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  {order.totalUnits} items:{" "}
                  {order.cart.map((c) => `${c.quantity}x ${c.product.name}`).slice(0, 3).join(", ")}
                  {order.cart.length > 3 ? "..." : ""}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => resumeHeldOrder(idx)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <Play size={14} />
                    <span>Resume to Register</span>
                  </button>
                  <button
                    onClick={() => discardHeldOrder(idx)}
                    className="btn btn-outline btn-sm"
                    style={{ color: "var(--accent-danger)", borderColor: "var(--border-subtle)" }}
                    title="Discard order"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
