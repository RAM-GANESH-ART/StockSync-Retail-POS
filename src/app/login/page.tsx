"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store, ShieldCheck, UserCheck, KeyRound, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error || "Invalid email or password");
    } else {
      router.push("/pos");
      router.refresh();
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setErrorMsg(null);

    const res = await signIn("credentials", {
      redirect: false,
      email: demoEmail,
      password: demoPass,
    });

    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      router.push("/pos");
      router.refresh();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "2.5rem 2rem",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--accent-primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Store size={28} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            StockSync POS Terminal
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Sign in to access real-time inventory and billing register
          </p>
        </div>

        {/* Demo Quick Logins */}
        <div
          style={{
            backgroundColor: "var(--bg-tertiary)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "1.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-secondary)",
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <ShieldCheck size={14} color="var(--accent-primary)" />
            <span>1-Click Demo Profiles</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("admin@stocksync.io", "admin123")}
              className="btn btn-secondary"
              style={{
                width: "100%",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                fontSize: "0.8125rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-primary mono" style={{ fontSize: "0.65rem" }}>
                  ADMIN
                </span>
                <span>Alex Vance (Store Manager)</span>
              </div>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickLogin("cashier@stocksync.io", "cashier123")}
              className="btn btn-secondary"
              style={{
                width: "100%",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                fontSize: "0.8125rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-in-stock mono" style={{ fontSize: "0.65rem" }}>
                  CASHIER
                </span>
                <span>Jordan Lee (POS Operator)</span>
              </div>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: "var(--accent-danger-bg)",
              border: "1px solid var(--accent-danger)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem",
              marginBottom: "1.25rem",
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

        {/* Standard Credentials Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. cashier@stocksync.io"
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "1rem" }}
          >
            {isLoading ? "Signing in..." : "Access Terminal"}
          </button>
        </form>
      </div>
    </div>
  );
}
