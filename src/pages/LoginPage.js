/**
 * @fileoverview Login Page
 * @description User authentication page with comprehensive security features including
 * account lockout, password expiry checking, and failed attempt tracking.
 * Implements Sprint 1 security requirements #7-9.
 * 
 * Security Features:
 * - Sprint 1 Req #7: Account locks after 3 failed login attempts
 * - Sprint 1 Req #8: Password expires after 90 days
 * - Sprint 1 Req #9: Warning displayed 3 days before password expiry
 * - Temporary suspension with date range support
 * - Event logging for successful logins
 * 
 * @module pages/LoginPage
 * @requires react
 * @requires react-router-dom
 * @requires firebase/auth
 * @requires firebase/firestore
 * @requires ../firebase
 * @requires ../assets/tabuledge-logo.png
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import logo from "../assets/tabuledge-logo.png";

/**
 * LoginPage Component
 * 
 * @component
 * @description Main authentication page for Tabuledge application.
 * Handles user login with comprehensive security checking and validation.
 * 
 * Features:
 * - Email/username authentication via Firebase
 * - Account status validation (active/suspended/locked)
 * - Failed login attempt tracking (max 3 attempts)
 * - Password expiry detection (90-day policy)
 * - Password expiry warnings (3 days before expiry)
 * - Temporary suspension checking with date ranges
 * - Auto-reactivation after suspension period
 * - Event logging for successful logins
 * - Error messaging with attempt counter
 * - Links to forgot password and registration
 * 
 * Security Requirements:
 * - Sprint 1 #7: Lock account after 3 failed attempts
 * - Sprint 1 #8: Password expires after 90 days
 * - Sprint 1 #9: Warning 3 days before expiry
 * 
 * @returns {JSX.Element} Login page with authentication form
 * 
 * @example
 * <Route path="/" element={<LoginPage />} />
 */
function LoginPage() {
  // ==================== Router Hooks ====================
  
  /** Navigation hook for redirecting after login */
  const navigate = useNavigate();
  
  // ==================== State Management ====================
  
  /** @type {[string, Function]} User's email or username input */
  const [email, setEmail] = useState("");
  
  /** @type {[string, Function]} User's password input */
  const [password, setPassword] = useState("");
  
  /** @type {[string, Function]} Error message to display */
  const [error, setError] = useState("");
  
  /** @type {[boolean, Function]} Loading state during authentication */
  const [loading, setLoading] = useState(false);
  
  /** @type {[boolean, Function]} Whether password is expiring soon */
  const [passwordExpirySoon, setPasswordExpirySoon] = useState(false);
  
  /** @type {[number, Function]} Days until password expires */
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(0);

  // ==================== Event Handlers ====================
  
  /**
   * Handles login form submission with comprehensive security checks
   * 
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submit event
   * @returns {Promise<void>}
   * 
   * @description Complete login flow:
   * 1. Validates user exists in Firestore
   * 2. Checks if account is suspended (temporary or permanent)
   * 3. Auto-reactivates if suspension period has passed
   * 4. Checks for account lockout (3 failed attempts)
   * 5. Attempts Firebase authentication
   * 6. On success: Resets failed attempts, logs event, checks password expiry
   * 7. On failure: Increments failed attempts, locks at 3 attempts
   * 8. Redirects to dashboard or shows expiry warning
   * 
   * Security Features:
   * - Failed attempt tracking with lockout at 3 attempts
   * - Password expiry detection (90 days)
   * - Expiry warnings (3 days before)
   * - Suspension period checking
   * - Event logging
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Check if user exists and retrieve user document
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.trim()));
      const userSnapshot = await getDocs(q);

      if (userSnapshot.empty) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Step 2: Check if account is suspended
      if (userData.active === false) {
        // Check if suspension is temporary with date range
        const now = Date.now();
        if (userData.suspendedFrom && userData.suspendedTo) {
          const suspendStart = new Date(userData.suspendedFrom).getTime();
          const suspendEnd = new Date(userData.suspendedTo).getTime();
          
          // If currently within suspension period
          if (now >= suspendStart && now <= suspendEnd) {
            setError(`Account suspended until ${new Date(userData.suspendedTo).toLocaleDateString()}`);
            setLoading(false);
            return;
          } else if (now > suspendEnd) {
            // Suspension period has passed - auto-reactivate
            await updateDoc(doc(db, "users", userId), {
              active: true,
              suspendedFrom: null,
              suspendedTo: null
            });
          }
        } else {
          // Permanent deactivation
          setError("Account is deactivated. Please contact administrator.");
          setLoading(false);
          return;
        }
      }

      // Step 3: Check for account lockout (3 failed attempts)
      const failedAttempts = userData.failedAttempts || 0;
      if (failedAttempts >= 3) {
        setError("Account locked due to multiple failed login attempts. Please contact administrator.");
        setLoading(false);
        return;
      }

      // Step 4: Attempt to sign in with Firebase Authentication
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);

        // Step 5: Successful login - reset failed attempts
        await updateDoc(doc(db, "users", userId), {
          failedAttempts: 0,
          lastLogin: serverTimestamp()
        });

        // Step 6: Log successful login event
        await addDoc(collection(db, "eventLogs"), {
          action: "login",
          user: email.trim(),
          timestamp: Date.now(),
          createdBy: email.trim(),
          at: serverTimestamp()
        });

        // Step 7: Check password expiry (90 days)
        const passwordSetAt = userData.passwordSetAt || userData.createdAt || Date.now();
        const daysSinceSet = (Date.now() - passwordSetAt) / (1000 * 60 * 60 * 24);
        const daysUntilExpiry = 90 - daysSinceSet;

        // Show warning if expiring within 3 days
        if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
          setPasswordExpirySoon(true);
          setDaysUntilExpiry(Math.ceil(daysUntilExpiry));
          // Give user time to read warning before redirecting
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        } else if (daysUntilExpiry <= 0) {
          // Password has expired
          setError("Password has expired. Please contact administrator to reset.");
          setLoading(false);
          return;
        } else {
          // Password valid - redirect immediately
          navigate("/dashboard");
        }

      } catch (authError) {
        // Step 8: Login failed - increment failed attempts
        const newFailedAttempts = failedAttempts + 1;
        await updateDoc(doc(db, "users", userId), {
          failedAttempts: newFailedAttempts
        });

        // Lock account if 3 failed attempts reached
        if (newFailedAttempts >= 3) {
          setError("Account locked due to multiple failed login attempts. Please contact administrator.");
        } else {
          setError(`Invalid password. ${3 - newFailedAttempts} attempt(s) remaining.`);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== Render ====================
  
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img src={logo} alt="Tabuledge Logo" style={styles.logo} />
        </div>

        {/* Page Title and Subtitle */}
        <h1 style={styles.title}>Tabuledge Login</h1>
        <p style={styles.subtitle}>Sign in to view your dashboard and financial reports.</p>

        {/* Error Display */}
        {error && <div style={styles.error}>{error}</div>}
        
        {/* Password Expiry Warning */}
        {passwordExpirySoon && (
          <div style={styles.warning}>
            ⚠️ Your password will expire in {daysUntilExpiry} day(s). Please update it soon.
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* Email/Username Field */}
          <label style={styles.label}>
            Email / Username
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter your email"
              required
            />
          </label>
          
          {/* Password Field */}
          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              required
            />
          </label>

          {/* Submit Button */}
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

        {/* Forgot Password Link */}
        <div style={styles.linkContainer}>
          <Link to="/forgot-password" style={styles.link}>
            Forgot Password?
          </Link>
        </div>

        {/* Registration Link */}
        <p style={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Request Access
          </Link>
        </p>
      </div>
    </div>
  );
}

// ==================== Styles ====================

/**
 * Component styles object
 * @constant {Object} styles
 * @description CSS-in-JS styles for login page with dark gradient theme
 */
const styles = {
  /** Full-screen wrapper with gradient background */
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #020617, #0f172a)",
    padding: 16,
  },
  
  /** Login card container */
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
  
  /** Logo container - centered */
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  
  /** Logo image - white inverted */
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
  },
  
  /** Page title */
  title: {
    margin: 0,
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 1,
  },
  
  /** Subtitle text */
  subtitle: {
    margin: 0,
    marginBottom: 20,
    fontSize: 13,
    textAlign: "center",
    color: "#9ca3af",
  },
  
  /** Error message box - red background */
  error: {
    background: "#7f1d1d",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 16,
    fontSize: 13,
    color: "#fecaca",
  },
  
  /** Warning message box - orange background */
  warning: {
    background: "#78350f",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 16,
    fontSize: 13,
    color: "#fde68a",
  },
  
  /** Form container */
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 8,
  },
  
  /** Form label */
  label: {
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 500,
  },
  
  /** Input field */
  input: {
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #4b5563",
    background: "#020617",
    color: "#e5e7eb",
    fontSize: 14,
  },
  
  /** Submit button */
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
  
  /** Link container for forgot password */
  linkContainer: {
    marginTop: 12,
    textAlign: "center",
  },
  
  /** Footer text */
  footerText: {
    marginTop: 20,
    fontSize: 13,
    textAlign: "center",
    color: "#9ca3af",
  },
  
  /** Link styling */
  link: {
    color: "#60a5fa",
    textDecoration: "underline",
    cursor: "pointer",
  },
};

export default LoginPage;