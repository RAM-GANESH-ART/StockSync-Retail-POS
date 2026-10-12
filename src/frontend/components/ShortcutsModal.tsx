import React from "react";
import { usePosStore } from "@/frontend/store/use-pos-store";
import { X, Keyboard } from "lucide-react";

export function ShortcutsModal() {
  const { isShortcutsOpen, setShortcutsOpen } = usePosStore();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: "F1 or /", description: "Focus Barcode Scanner / SKU Search Bar" },
    { key: "Enter", description: "Quick add matched barcode / SKU into cart" },
    { key: "F2", description: "Clear current register cart" },
    { key: "F4", description: "Park / Hold current order" },
    { key: "F9 or Space", description: "Proceed to Checkout Dialog" },
    { key: "Escape", description: "Close any open dialog or clear search focus" },
    { key: "M", description: "Toggle POS Audio Scanner Beep ON/OFF" },
    { key: "V", description: "Toggle Product View (Grid vs. Dense Table)" },
  ];

  return (
    <div className="modal-backdrop" onClick={() => setShortcutsOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", padding: "1.5rem" }}
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
            <Keyboard size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Cashier Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="btn btn-icon btn-sm"
            style={{ border: "none", background: "none" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.6rem 0.75rem",
                backgroundColor: "var(--bg-tertiary)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {s.description}
              </span>
              <kbd
                className="mono"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
