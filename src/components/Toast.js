/**
 * @fileoverview Toast Notification System
 * @description Non-intrusive notification component for displaying temporary
 * messages to users. Supports multiple types (success, error, warning, info)
 * with auto-dismiss functionality.
 * 
 * @module components/Toast
 * @requires react
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useEffect } from "react";

/**
 * Toast Component
 * 
 * @component
 * @description Individual toast notification that auto-dismisses after specified duration.
 * Can be manually dismissed by clicking anywhere on the toast.
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Message text to display
 * @param {('success'|'error'|'warning'|'info')} [props.type='info'] - Toast type/severity
 * @param {Function} props.onClose - Callback when toast is dismissed
 * @param {number} [props.duration=3000] - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * 
 * @returns {JSX.Element} Rendered toast notification
 * 
 * @example
 * <Toast 
 *   message="Account created successfully!" 
 *   type="success"
 *   onClose={() => console.log('dismissed')}
 *   duration={3000}
 * />
 */
function Toast({ message, type = "info", onClose, duration = 3000 }) {
  // ==================== Effects ====================
  
  /**
   * Auto-dismiss timer effect
   * @effect
   * @description Sets up a timer to auto-dismiss the toast after the specified duration.
   * Cleans up timer on unmount to prevent memory leaks.
   */
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // ==================== Constants ====================
  
  /**
   * Icon mapping for each toast type
   * @constant {Object.<string, string>}
   */
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  /**
   * Background color mapping for each toast type
   * @constant {Object.<string, string>}
   * @description Colors follow standard severity conventions:
   * - Success: Green (#059669)
   * - Error: Red (#dc2626)
   * - Warning: Orange (#f59e0b)
   * - Info: Blue (#2563eb)
   */
  const backgrounds = {
    success: "#059669",
    error: "#dc2626",
    warning: "#f59e0b",
    info: "#2563eb",
  };

  // ==================== Render ====================
  
  return (
    <div
      style={{
        ...styles.toast,
        background: backgrounds[type] || backgrounds.info,
      }}
      onClick={onClose}
    >
      {/* Icon */}
      <div style={styles.icon}>{icons[type]}</div>
      
      {/* Message Text */}
      <div style={styles.message}>{message}</div>
      
      {/* Close Button */}
      <button onClick={onClose} style={styles.closeBtn} title="Dismiss">
        ✕
      </button>
    </div>
  );
}

/**
 * ToastContainer Component
 * 
 * @component
 * @description Container that manages and displays multiple toast notifications.
 * Positioned fixed in top-right corner. Handles toast lifecycle and removal.
 * 
 * @param {Object} props - Component props
 * @param {Array<Object>} props.toasts - Array of toast objects to display
 * @param {Function} props.removeToast - Callback to remove a toast by ID
 * 
 * @returns {JSX.Element|null} Container with toasts or null if no toasts
 * 
 * @example
 * const { toasts, removeToast } = useToast();
 * 
 * <ToastContainer 
 *   toasts={toasts} 
 *   removeToast={removeToast} 
 * />
 */
export function ToastContainer({ toasts, removeToast }) {
  // ==================== Early Return ====================
  
  /** If no toasts, render nothing */
  if (!toasts || toasts.length === 0) return null;

  // ==================== Render ====================
  
  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * useToast Hook
 * 
 * @hook
 * @description Custom React hook for managing toast notifications.
 * Provides methods to add/remove toasts and convenience methods for each type.
 * 
 * @returns {Object} Toast management object
 * @returns {Array<Object>} return.toasts - Array of active toasts
 * @returns {Function} return.addToast - Add a toast (message, type, duration)
 * @returns {Function} return.removeToast - Remove a toast by ID
 * @returns {Function} return.success - Add success toast
 * @returns {Function} return.error - Add error toast
 * @returns {Function} return.warning - Add warning toast
 * @returns {Function} return.info - Add info toast
 * 
 * @example
 * const toast = useToast();
 * 
 * // Basic usage
 * toast.success("Operation successful!");
 * toast.error("An error occurred");
 * toast.warning("Please review");
 * toast.info("FYI: System updated");
 * 
 * // Custom duration
 * toast.success("Saved!", 5000); // 5 seconds
 * 
 * // Render container
 * <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
 */
export function useToast() {
  // ==================== State ====================
  
  /** @type {[Array<Object>, Function]} Array of active toast objects */
  const [toasts, setToasts] = React.useState([]);

  // ==================== Methods ====================
  
  /**
   * Adds a new toast notification
   * 
   * @function addToast
   * @param {string} message - Toast message
   * @param {string} [type='info'] - Toast type
   * @param {number} [duration=3000] - Auto-dismiss duration in ms
   * @returns {void}
   */
  const addToast = (message, type = "info", duration = 3000) => {
    /** Generate unique ID using timestamp + random for collision avoidance */
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  /**
   * Removes a toast by ID
   * 
   * @function removeToast
   * @param {number} id - Toast ID to remove
   * @returns {void}
   */
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ==================== Return API ====================
  
  return {
    toasts,
    addToast,
    removeToast,
    /** Convenience method: Add success toast */
    success: (msg, duration) => addToast(msg, "success", duration),
    /** Convenience method: Add error toast */
    error: (msg, duration) => addToast(msg, "error", duration),
    /** Convenience method: Add warning toast */
    warning: (msg, duration) => addToast(msg, "warning", duration),
    /** Convenience method: Add info toast */
    info: (msg, duration) => addToast(msg, "info", duration),
  };
}

// ==================== Styles ====================

/**
 * Component styles object
 * @constant {Object} styles
 * @description CSS-in-JS styles for toast system
 */
const styles = {
  /** Toast container - fixed positioned in top-right corner */
  container: {
    position: "fixed",
    top: 80,
    right: 20,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    pointerEvents: "none", // Allow clicks through container
  },
  
  /** Individual toast card */
  toast: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 8,
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    minWidth: 300,
    maxWidth: 500,
    pointerEvents: "auto", // Toast itself is clickable
    cursor: "pointer",
    animation: "slideIn 0.3s ease-out",
  },
  
  /** Toast icon */
  icon: {
    fontSize: 20,
    fontWeight: "bold",
    flexShrink: 0,
  },
  
  /** Toast message text */
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 1.4,
  },
  
  /** Close button */
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    padding: 4,
    opacity: 0.8,
    flexShrink: 0,
  },
};

export default Toast;