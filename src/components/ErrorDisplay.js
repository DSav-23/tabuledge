/**
 * @fileoverview Error Display Components
 * @description Consistent error display components for the Tabuledge application.
 * Provides three variants: full banner, inline field errors, and error lists.
 * All errors are displayed in red color as per Sprint 3 Requirement #38.
 * 
 * @module components/ErrorDisplay
 * @requires react
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React from "react";

/**
 * ErrorDisplay Component (Full Banner)
 * 
 * @component
 * @description Main error display component showing errors as a prominent banner
 * with shake animation. Requirement #38: Error messages must be displayed in red color.
 * 
 * Features:
 * - Red-themed banner with border
 * - Warning icon
 * - Optional dismiss button
 * - Shake animation on appear
 * - Customizable styling via style prop
 * 
 * @param {Object} props - Component props
 * @param {string|null} props.error - Error message to display (null to hide)
 * @param {Function} [props.onDismiss] - Optional callback to dismiss error
 * @param {Object} [props.style={}] - Additional inline styles to merge
 * 
 * @returns {JSX.Element|null} Rendered error banner or null if no error
 * 
 * @example
 * // Simple error display
 * <ErrorDisplay error="Invalid account number" />
 * 
 * @example
 * // Dismissible error
 * <ErrorDisplay 
 *   error={errorMessage} 
 *   onDismiss={() => setErrorMessage(null)}
 * />
 */
function ErrorDisplay({ error, onDismiss, style = {} }) {
  // ==================== Early Return ====================
  
  /** If no error, render nothing */
  if (!error) return null;

  // ==================== Render ====================
  
  return (
    <div style={{ ...styles.container, ...style }}>
      {/* Warning Icon */}
      <div style={styles.icon}>⚠</div>
      
      {/* Error Message */}
      <div style={styles.message}>{error}</div>
      
      {/* Optional Dismiss Button */}
      {onDismiss && (
        <button onClick={onDismiss} style={styles.dismissBtn} title="Dismiss error">
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * InlineError Component
 * 
 * @component
 * @description Smaller inline error display for form fields.
 * Appears below input fields with red text and icon.
 * 
 * @param {Object} props - Component props
 * @param {string|null} props.error - Error message to display
 * 
 * @returns {JSX.Element|null} Rendered inline error or null if no error
 * 
 * @example
 * <input type="text" {...} />
 * <InlineError error={fieldError} />
 */
export function InlineError({ error }) {
  // ==================== Early Return ====================
  
  /** If no error, render nothing */
  if (!error) return null;

  // ==================== Render ====================
  
  return (
    <div style={styles.inline}>
      <span style={styles.inlineIcon}>⚠</span>
      <span style={styles.inlineText}>{error}</span>
    </div>
  );
}

/**
 * ErrorList Component
 * 
 * @component
 * @description Displays multiple errors as a bulleted list within a red banner.
 * Useful for form validation showing all errors at once.
 * 
 * @param {Object} props - Component props
 * @param {Array<string>|null} props.errors - Array of error messages
 * 
 * @returns {JSX.Element|null} Rendered error list or null if no errors
 * 
 * @example
 * <ErrorList errors={[
 *   "Account number must be digits only",
 *   "Account name is required",
 *   "Balance must be positive"
 * ]} />
 */
export function ErrorList({ errors }) {
  // ==================== Early Return ====================
  
  /** If no errors or empty array, render nothing */
  if (!errors || errors.length === 0) return null;

  // ==================== Render ====================
  
  return (
    <div style={styles.list}>
      {/* List Title */}
      <div style={styles.listTitle}>
        <span style={styles.icon}>⚠</span>
        Please correct the following errors:
      </div>
      
      {/* Error Items */}
      <ul style={styles.ul}>
        {errors.map((error, index) => (
          <li key={index} style={styles.li}>
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==================== Styles ====================

/**
 * Component styles object
 * @constant {Object} styles
 * @description CSS-in-JS styles for error display components.
 * All use red color scheme (#dc2626, #991b1b) --Requirement #38.
 */
const styles = {
  /** Full error banner container with shake animation */
  container: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "#fee2e2", // Light red background
    border: "2px solid #dc2626", // Red border
    borderRadius: 8,
    color: "#991b1b", // Dark red text
    marginBottom: 16,
    animation: "shake 0.3s ease-in-out",
  },
  
  /** Warning icon styling */
  icon: {
    fontSize: 20,
    fontWeight: "bold",
    flexShrink: 0,
  },
  
  /** Main error message text */
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 600,
  },
  
  /** Dismiss button styling */
  dismissBtn: {
    background: "transparent",
    border: "none",
    color: "#991b1b",
    fontSize: 20,
    cursor: "pointer",
    padding: 4,
    flexShrink: 0,
  },
  
  /** Inline error container (for form fields) */
  inline: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    fontSize: 13,
    color: "#dc2626", // Red text
  },
  
  /** Inline error icon */
  inlineIcon: {
    fontSize: 14,
  },
  
  /** Inline error text */
  inlineText: {
    fontWeight: 600,
  },
  
  /** Error list banner container */
  list: {
    background: "#fee2e2",
    border: "2px solid #dc2626",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  
  /** Error list title */
  listTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 15,
    fontWeight: 700,
    color: "#991b1b",
    marginBottom: 12,
  },
  
  /** Unordered list styling */
  ul: {
    margin: 0,
    paddingLeft: 20,
    color: "#991b1b",
  },
  
  /** List item styling */
  li: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 500,
  },
};

// ==================== Dynamic Styles ====================

/**
 * Injects shake animation keyframes into document head
 * @description Adds CSS animation for error banner entrance effect.
 * Runs only in browser environment.
 */
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-5px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(5px);
      }
    }
  `;
  document.head.appendChild(style);
}

export default ErrorDisplay;