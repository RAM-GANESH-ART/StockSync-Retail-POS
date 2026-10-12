"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Boxes,
  ShoppingCart,
  Package,
  BarChart3,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Store,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("stocksync-theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("stocksync-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const navItems = [
    { label: "POS Terminal", href: "/pos", icon: ShoppingCart },
    { label: "Inventory", href: "/inventory", icon: Package },
    { label: "Analytics", href: "/dashboard", icon: BarChart3 },
  ];

  return (
    <nav
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              fontWeight: 700,
              fontSize: "1.125rem",
              letterSpacing: "-0.02em",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Store size={20} />
            </div>
            <span>StockSync</span>
            <span
              className="badge badge-primary mono"
              style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}
            >
              POS v1.0
            </span>
          </Link>

          {/* Navigation links */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="btn"
                  style={{
                    backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent",
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                    borderColor: isActive ? "var(--border-strong)" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Section: Theme Toggle & User Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Theme switcher */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-icon"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle visual theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}

          {/* User state */}
          {session?.user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  lineHeight: 1.2,
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  {session.user.name || "Operator"}
                </span>
                <span
                  className={
                    session.user.role === "ADMIN"
                      ? "badge badge-primary mono"
                      : "badge badge-in-stock mono"
                  }
                  style={{ fontSize: "0.6rem", marginTop: "2px" }}
                >
                  {session.user.role || "CASHIER"}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="btn btn-outline btn-sm"
                title="Sign out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              <UserCheck size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
