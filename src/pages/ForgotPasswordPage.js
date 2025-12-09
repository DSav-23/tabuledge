/**
 * @fileoverview ForgotPasswordPage Page
 * 
 * 
 * @module pages/ForgotPasswordPage
 * @requires react
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import logo from "../assets/tabuledge-logo.png";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email/username, 2: success message
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // If username provided, look up email
      let userEmail = email.trim();

      if (username.trim()) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username.trim()));
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
          setError("Username not found in system.");
          setLoading(false);
          return;
        }

        userEmail = userSnapshot.docs[0].data().email;
      }

      if (!userEmail) {
        setError("Please provide either email or username.");
        setLoading(false);
        return;
      }

      // Verify user exists in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", userEmail));
      const userSnapshot = await getDocs(q);

      if (userSnapshot.empty) {
        setError("Email not found in system.");
        setLoading(false);
        return;
      }

      // Send password reset email via Firebase
      await sendPasswordResetEmail(auth, userEmail);

      setSuccess(
        `Password reset email sent to ${userEmail}. Please check your inbox and follow the instructions.`
      );
      setStep(2);

      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate("/");
      }, 5000);
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("Email not found in authentication system.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError("An error occurred. Please try again or contact administrator.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img src={logo} alt="Tabuledge Logo" style={styles.logo} />
        </div>

        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>
          {step === 1
            ? "Enter your email or username to receive a password reset link."
            : "Check your email for reset instructions."}
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Email Address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="Enter your email"
              />
            </label>

            <div style={styles.divider}>
              <span style={styles.dividerText}>OR</span>
            </div>

            <label style={styles.label}>
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                placeholder="Enter your username"
              />
            </label>

            <button
              type="submit"
              disabled={loading || (!email && !username)}
              style={{
                ...styles.button,
                opacity: loading || (!email && !username) ? 0.7 : 1,
                cursor: loading || (!email && !username) ? "default" : "pointer",
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.successMessage}>
              Password reset instructions have been sent to your email.
            </p>
            <p style={styles.successSubtext}>
              Redirecting to login in 5 seconds...
            </p>
          </div>
        )}

        <p style={styles.footerText}>
          Remember your password?{" "}
          <Link to="/" style={styles.link}>
            Back to Login
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
    maxWidth: 420,
    width: "100%",
    background: "#0b1120",
    borderRadius: 12,
    padding: 32,
    color: "#e5e7eb",
    boxShadow: "0 10px 25px rgba(15,23,42,0.6)",
    border: "1px solid #1e293b",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
  },
  title: {
    margin: 0,
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    margin: 0,
    marginBottom: 20,
    fontSize: 13,
    textAlign: "center",
    color: "#9ca3af",
    lineHeight: 1.5,
  },
  error: {
    background: "#7f1d1d",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 16,
    fontSize: 13,
    color: "#fecaca",
  },
  success: {
    background: "#064e3b",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 16,
    fontSize: 13,
    color: "#6ee7b7",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 500,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #4b5563",
    background: "#020617",
    color: "#e5e7eb",
    fontSize: 14,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "8px 0",
  },
  dividerText: {
    padding: "0 12px",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 500,
  },
  button: {
    marginTop: 8,
    padding: "12px 16px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  successContainer: {
    textAlign: "center",
    padding: "20px 0",
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#059669",
    color: "#fff",
    fontSize: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    fontWeight: "bold",
  },
  successMessage: {
    fontSize: 14,
    marginBottom: 8,
    color: "#d1d5db",
  },
  successSubtext: {
    fontSize: 12,
    color: "#9ca3af",
  },
  footerText: {
    marginTop: 20,
    fontSize: 13,
    textAlign: "center",
    color: "#9ca3af",
  },
  link: {
    color: "#60a5fa",
    textDecoration: "underline",
    cursor: "pointer",
  },
};

export default ForgotPasswordPage;