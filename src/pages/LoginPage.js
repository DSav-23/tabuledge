// src/pages/LoginPage.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // -----------------------------------------------------------
      // AFTER SUCCESSFUL LOGIN: ALWAYS GO TO LANDING DASHBOARD
      // This ensures all users see the financial ratios and messages.
      // -----------------------------------------------------------
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Tabuledge Login</h1>
        <p style={styles.subtitle}>Sign in to view your dashboard and financial reports.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </label>
          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Link to="/register" style={styles.link}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #020617, #0f172a)",
    padding: 16,
  },
  card: {
    maxWidth: 400,
    width: "100%",
    background: "#0b1120",
    borderRadius: 12,
    padding: 24,
    color: "#e5e7eb",
    boxShadow: "0 10px 25px rgba(15,23,42,0.6)",
    border: "1px solid #1e293b",
  },
  title: {
    margin: 0,
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 700,
    textAlign: "center",
  },
  subtitle: {
    margin: 0,
    marginBottom: 16,
    fontSize: 13,
    textAlign: "center",
    color: "#9ca3af",
  },
  error: {
    background: "#7f1d1d",
    borderRadius: 8,
    padding: "8px 10px",
    marginBottom: 12,
    fontSize: 13,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #4b5563",
    background: "#020617",
    color: "#e5e7eb",
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
  },
  footerText: {
    marginTop: 16,
    fontSize: 13,
    textAlign: "center",
    color: "#9ca3af",
  },
  link: {
    color: "#60a5fa",
    textDecoration: "underline",
  },
};

export default LoginPage;
