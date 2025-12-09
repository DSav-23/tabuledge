/**
 * @fileoverview Navigation Bar Component
 * @description Primary navigation header for the Tabuledge accounting application.
 * Provides role-based menu access, user authentication display, and global navigation.
 * 
 * @module components/NavBar
 * @requires react
 * @requires react-router-dom
 * @requires firebase/auth
 * @requires ../firebase
 * @requires ../assets/tabuledge-logo.png
 * @requires ../hooks/useUserRole
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/tabuledge-logo.png";
import useUserRole from "../hooks/useUserRole";

/**
 * NavBar Component
 * 
 * @component
 * @description Renders the application's main navigation bar with role-based menu items,
 * user authentication status, date picker, and logout functionality.
 * 
 * Features:
 * - Role-based navigation (Admin, Manager, Accountant)
 * - Active page highlighting
 * - User avatar with initials
 * - Date selection
 * - Logout functionality
 * 
 * @param {Object} props - Component props
 * @param {string} props.userEmail - Currently authenticated user's email address
 * @param {string} props.selectedDate - Currently selected date in YYYY-MM-DD format
 * @param {Function} props.onDateChange - Callback function when date changes
 * @param {boolean} [props.showNav=true] - Whether to display navigation menu
 * @param {boolean} [props.showLogout=true] - Whether to display logout button
 * 
 * @returns {JSX.Element} Rendered navigation bar
 * 
 * @example
 * <NavBar 
 *   userEmail="user@example.com"
 *   selectedDate="2025-12-09"
 *   onDateChange={(date) => console.log(date)}
 *   showNav={true}
 *   showLogout={true}
 * />
 */
function NavBar({
  userEmail,
  selectedDate,
  onDateChange,
  showNav = true,
  showLogout = true,
}) {
  // ==================== Hooks ====================
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useUserRole();

  // ==================== Event Handlers ====================
  
  /**
   * Handles user logout
   * 
   * @async
   * @function handleLogout
   * @description Signs out the user via Firebase Auth and redirects to login page.
   * Displays alert on error.
   * 
   * @returns {Promise<void>}
   * @throws {Error} If Firebase signOut fails
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (e) {
      console.error("Logout failed:", e);
      alert("Logout failed. Please try again.");
    }
  };

  /**
   * Navigates to specified path if not already there
   * 
   * @function go
   * @param {string} path - Target route path
   * @returns {void}
   */
  const go = (path) => {
    if (location.pathname !== path) navigate(path);
  };

  /**
   * Navigates to dashboard home page
   * 
   * @function goHome
   * @returns {void}
   */
  const goHome = () => {
    go("/dashboard");
  };

  /**
   * Checks if given path matches current location
   * 
   * @function isActive
   * @param {string} path - Path to check against current location
   * @returns {boolean} True if path is currently active
   */
  const isActive = (path) => location.pathname === path;

  // ==================== Render ====================
  
  return (
    <header style={styles.header}>
      {/* ==================== Left Section: Logo & Brand ==================== */}
      <div
        style={styles.leftGroup}
        onClick={goHome}
        title="Go to Dashboard"
      >
        <img src={logo} alt="Tabuledge" style={styles.logoWhite} />
        <div style={styles.brandBlock}>
          <div style={styles.brand}>TABULEDGE</div>
        </div>
      </div>

      {/* ==================== Right Section: Date, Nav, User, Logout ==================== */}
      <div style={styles.rightGroup}>
        
        {/* Date Picker */}
        {onDateChange && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            title="Pick a date"
            style={styles.date}
          />
        )}

        {/* ==================== Navigation Menu (Role-Based) ==================== */}
        {showNav && (
          <nav style={styles.nav}>
            
            {/* Admin Menu Item */}
            {role === "admin" && (
              <button
                onClick={() => go("/admin")}
                title="Admin home"
                style={isActive("/admin") ? { ...styles.navBtn, ...styles.navBtnActive } : styles.navBtn}
              >
                Admin
              </button>
            )}

            {/* Chart of Accounts - Available to Admin, Manager, Accountant */}
            {(role === "admin" || role === "manager" || role === "accountant") && (
              <button
                onClick={() => go("/accounts")}
                title="Chart of Accounts"
                style={isActive("/accounts") ? { ...styles.navBtn, ...styles.navBtnActive } : styles.navBtn}
              >
                Chart of Accounts
              </button>
            )}

            {/* Journal - Available to Admin and Accountant */}
            {(role === "admin" || role === "accountant") && (
              <button
                onClick={() => go("/accountant")}
                title="Journalizing & posting"
                style={isActive("/accountant") ? { ...styles.navBtn, ...styles.navBtnActive } : styles.navBtn}
              >
                Journal
              </button>
            )}

            {/* Reports - Available to Admin and Manager */}
            {(role === "admin" || role === "manager") && (
              <button
                onClick={() => go("/manager")}
                title="Reports & approvals"
                style={isActive("/manager") ? { ...styles.navBtn, ...styles.navBtnActive } : styles.navBtn}
              >
                Reports
              </button>
            )}

            {/* Event Logs - Available to Admin, Manager, and Accountant */}
            {(role === "admin" || role === "manager" || role === "accountant") && (
              <button
                onClick={() => go("/event-logs")}
                title="System change history"
                style={isActive("/event-logs") ? { ...styles.navBtn, ...styles.navBtnActive } : styles.navBtn}
              >
                Event Logs
              </button>
            )}
          </nav>
        )}

        {/* ==================== User Display ==================== */}
        {userEmail && (
          <div style={styles.userBox}>
            {/* User Avatar with Initial */}
            <div style={styles.userAvatar}>
              {userEmail.charAt(0).toUpperCase()}
            </div>
            {/* User Email */}
            <span style={styles.userEmail}>{userEmail}</span>
          </div>
        )}

        {/* ==================== Logout Button ==================== */}
        {showLogout && (
          <button
            onClick={handleLogout}
            title="Sign out"
            style={styles.logout}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

// ==================== Styles ====================

/**
 * Component styles object
 * @constant {Object} styles
 * @description CSS-in-JS styles for NavBar component following Material Design principles
 */
const styles = {
  /** Main header container - sticky positioned dark gradient */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    background: "linear-gradient(90deg, #0b1220 0%, #0f172a 60%, #0b1220 100%)",
    color: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  
  /** Left group container - logo and brand */
  leftGroup: { 
    display: "flex", 
    alignItems: "center", 
    gap: 10, 
    cursor: "pointer" 
  },
  
  /** Logo image - inverted to white for dark background */
  logoWhite: { 
    width: 40, 
    height: 40, 
    objectFit: "contain", 
    filter: "brightness(0) invert(1)" 
  },
  
  /** Brand text container */
  brandBlock: { 
    display: "flex", 
    flexDirection: "column", 
    lineHeight: 1 
  },
  
  /** Main brand text "TABULEDGE" */
  brand: { 
    fontWeight: 800, 
    letterSpacing: 2, 
    fontSize: 14 
  },
  
  /** Right group container - date, nav, user, logout */
  rightGroup: { 
    display: "flex", 
    alignItems: "center", 
    gap: 12 
  },
  
  /** Date picker input - modern styled */
  date: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #475569",
    background: "rgba(30, 41, 59, 0.6)",
    color: "#fff",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  },
  
  /** User info box with pill-shaped border */
  userBox: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 50, // Pill/ellipse shape
    height: "28px",
  },
  
  /** Circular avatar with user initial */
  userAvatar: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    color: "#fff",
  },
  
  /** User email text */
  userEmail: { 
    fontSize: 11.5, 
    opacity: 0.95,
    fontWeight: 500,
    lineHeight: 1,
  },
  
  /** Navigation container */
  nav: { 
    display: "flex", 
    gap: 4, 
    alignItems: "center" 
  },
  
  /** Navigation button base style - transparent with hover/active states */
  navBtn: {
    padding: "8px 14px",
    background: "transparent",
    color: "rgba(255, 255, 255, 0.7)",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.2s ease",
    position: "relative",
  },
  
  /** Active navigation button - highlighted with blue background */
  navBtnActive: {
    color: "#fff",
    background: "rgba(59, 130, 246, 0.15)",
    fontWeight: 600,
  },
  
  /** Logout button - red themed with border */
  logout: { 
    padding: "8px 16px",
    background: "#7f1d1d", 
    borderColor: "#991b1b",
    border: "1px solid #991b1b",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    height: "36px",
    transition: "all 0.2s ease",
  },
};

// ==================== Dynamic Styles ====================

/**
 * Injects hover and focus styles into document head
 * @description Adds CSS for interactive states that can't be defined inline
 * Runs only in browser environment
 */
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    /* Button hover effects */
    header button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    /* Date input hover state */
    header input[type="date"]:hover {
      border-color: #64748b;
      background: rgba(30, 41, 59, 0.8);
    }
    
    /* Date input focus state */
    header input[type="date"]:focus {
      border-color: #3b82f6;
      background: rgba(30, 41, 59, 0.9);
    }
    
    /* Calendar picker icon styling */
    header input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
      cursor: pointer;
      opacity: 0.8;
    }
    
    /* Calendar picker hover */
    header input[type="date"]::-webkit-calendar-picker-indicator:hover {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

export default NavBar;