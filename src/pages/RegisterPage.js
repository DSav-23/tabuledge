/**
 * @fileoverview RegisterPage Page
 * 
 * 
 * @module pages/RegisterPage
 * @requires react
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import logo from "../assets/tabuledge-logo.png";
import PasswordChecklist from "react-password-checklist";

function RegisterPage() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    dob: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [error, setError] = useState("");
  const [passwordValid, setPasswordValid] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Generate username: first initial + last name + MMYY
  const generateUsername = (firstName, lastName) => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    return `${firstName[0].toLowerCase()}${lastName.toLowerCase()}${mm}${yy}`;
  };

  // Validate password manually (in addition to react-password-checklist)
  const validatePassword = (pwd) => {
    // Must start with a letter
    if (!/^[a-zA-Z]/.test(pwd)) {
      return "Password must start with a letter.";
    }
    
    // Must be at least 8 characters
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    
    // Must contain a letter
    if (!/[a-zA-Z]/.test(pwd)) {
      return "Password must contain at least one letter.";
    }
    
    // Must contain a number
    if (!/\d/.test(pwd)) {
      return "Password must contain at least one number.";
    }
    
    // Must contain a special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return "Password must contain at least one special character.";
    }
    
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate all required fields
    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }
    
    if (!form.lastName.trim()) {
      setError("Last name is required.");
      return;
    }
    
    if (!form.address.trim()) {
      setError("Address is required.");
      return;
    }
    
    if (!form.dob) {
      setError("Date of birth is required.");
      return;
    }
    
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    // Validate password
    const pwdError = validatePassword(form.password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (!passwordValid) {
      setError("Please ensure all password requirements are met.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate age (must be 18+)
    const birthDate = new Date(form.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setError("You must be at least 18 years old to register.");
      return;
    }

    try {
      // Generate username
      const username = generateUsername(form.firstName, form.lastName);

      // Create user request (NOT a user) - admin must approve
      await addDoc(collection(db, "userRequests"), {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        address: form.address.trim(),
        dob: form.dob,
        email: form.email.trim(),
        password: form.password, // Will be hashed when approved
        username,
        status: "pending",
        requestedAt: serverTimestamp(),
        createdAt: Date.now(),
      });

      // Send notification to admin (in a real app, this would send an email)
      await addDoc(collection(db, "notifications"), {
        type: "new_user_request",
        recipient: "admin@example.com",
        message: `New user request from ${form.firstName} ${form.lastName} (${form.email})`,
        username,
        email: form.email.trim(),
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);

      // Redirect to login after showing success message
      setTimeout(() => {
        navigate("/");
      }, 5000);

    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred during registration. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <img src={logo} alt="Tabuledge Logo" style={styles.logo} />
          </div>
          
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Request Submitted!</h2>
            <p style={styles.successMessage}>
              Your account request has been submitted for administrator approval.
            </p>
            <p style={styles.successSubtext}>
              You will receive an email notification once your account has been reviewed.
              This typically takes 1-2 business days.
            </p>
            <p style={styles.successSubtext}>
              Redirecting to login in 5 seconds...
            </p>
          </div>
          
          <p style={styles.footerText}>
            <Link to="/" style={styles.link}>
              Return to Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <img src={logo} alt="Tabuledge Logo" style={styles.logo} />
        </div>

        <h1 style={styles.title}>Request Access</h1>
        <p style={styles.subtitle}>
          Submit your information to request a Tabuledge account.
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Personal Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            
            <div style={styles.row}>
              <label style={styles.label}>
                First Name *
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  style={styles.input}
                  placeholder="John"
                  required
                />
              </label>

              <label style={styles.label}>
                Last Name *
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  style={styles.input}
                  placeholder="Doe"
                  required
                />
              </label>
            </div>

            <label style={styles.label}>
              Address *
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={styles.input}
                placeholder="123 Main St, City, State ZIP"
                required
              />
            </label>

            <label style={styles.label}>
              Date of Birth *
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                style={styles.input}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </label>
          </div>

          {/* Account Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Account Information</h3>
            
            <label style={styles.label}>
              Email Address *
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={styles.input}
                placeholder="john.doe@example.com"
                required
              />
            </label>

            <label style={styles.label}>
              Password *
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setShowPasswordRules(true)}
                style={styles.input}
                placeholder="Enter a strong password"
                required
              />
            </label>

            {showPasswordRules && form.password && (
              <div style={styles.passwordRulesContainer}>
                <PasswordChecklist
                  rules={["minLength", "specialChar", "number", "letter"]}
                  minLength={8}
                  value={form.password}
                  onChange={(isValid) => setPasswordValid(isValid)}
                  messages={{
                    minLength: "Password must be at least 8 characters long",
                    specialChar: "Password must contain a special character",
                    number: "Password must contain a number",
                    letter: "Password must contain a letter",
                  }}
                  iconSize={12}
                  style={{ fontSize: 12 }}
                />
                {form.password && !/^[a-zA-Z]/.test(form.password) && (
                  <p style={styles.customRule}>✗ Password must start with a letter</p>
                )}
              </div>
            )}

            <label style={styles.label}>
              Confirm Password *
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                style={styles.input}
                placeholder="Re-enter your password"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            style={styles.button}
          >
            Submit Request
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/" style={styles.link}>
            Login here
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
    maxWidth: 540,
    width: "100%",
    background: "#0b1120",
    borderRadius: 12,
    padding: 32,
    color: "#e5e7eb",
    boxShadow: "0 10px 25px rgba(15,23,42,0.6)",
    border: "1px solid #1e293b",
    margin: "20px auto",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
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
    marginBottom: 24,
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  section: {
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: 16,
    background: "#0a0f1a",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: 16,
    fontWeight: 600,
    color: "#e5e7eb",
    borderBottom: "1px solid #1e293b",
    paddingBottom: 8,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: {
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontWeight: 500,
    marginBottom: 12,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #4b5563",
    background: "#020617",
    color: "#e5e7eb",
    fontSize: 14,
  },
  passwordRulesContainer: {
    background: "#0a0f1a",
    border: "1px solid #374151",
    borderRadius: 6,
    padding: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  customRule: {
    fontSize: 12,
    margin: "4px 0",
    color: "#ef4444",
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
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "#059669",
    color: "#fff",
    fontSize: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
    color: "#e5e7eb",
  },
  successMessage: {
    fontSize: 15,
    marginBottom: 12,
    color: "#d1d5db",
    lineHeight: 1.6,
  },
  successSubtext: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 8,
    lineHeight: 1.5,
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

export default RegisterPage;