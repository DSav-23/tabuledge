/**
 * @fileoverview Reject Journal Modal Component
 * @description Modal dialog for managers to reject journal entries with detailed reasoning.
 * Implements Sprint 3 Requirement #5: Manager must enter reason in comment field when rejecting.
 * Replaces basic prompt() dialog with professional UI.
 * 
 * @module components/RejectJournalModal
 * @requires react
 * @requires firebase/firestore
 * @requires ../firebase
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useState } from "react";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * RejectJournalModal Component
 * 
 * @component
 * @description Professional modal for rejecting journal entries with validation.
 * Requires managers to provide detailed rejection reason (minimum 10 characters).
 * 
 * Features:
 * - Displays entry details for context
 * - Textarea for detailed rejection reason
 * - Minimum 10 character validation
 * - Character counter
 * - Updates journal entry status to "rejected"
 * - Sends notification to entry creator
 * - Form validation and error handling
 * 
 * Sprint 3 Requirement #5: Manager must enter reason in comment field when rejecting
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is currently open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Object} props.entry - Journal entry object to reject
 * @param {string} props.userEmail - Current user's email (manager/admin)
 * @param {Function} [props.onSuccess] - Optional callback after successful rejection
 * 
 * @returns {JSX.Element|null} Rendered modal or null if closed
 * 
 * @example
 * <RejectJournalModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   entry={selectedEntry}
 *   userEmail="manager@example.com"
 *   onSuccess={() => {
 *     fetchEntries();
 *     alert("Entry rejected");
 *   }}
 * />
 */
function RejectJournalModal({ open, onClose, entry, userEmail, onSuccess }) {
  // ==================== State Management ====================
  
  /** @type {[string, Function]} Rejection reason text */
  const [reason, setReason] = useState("");
  
  /** @type {[boolean, Function]} Form submission state */
  const [submitting, setSubmitting] = useState(false);
  
  /** @type {[string, Function]} Validation error message */
  const [error, setError] = useState("");

  // ==================== Early Return ====================
  
  /** If modal is closed or no entry provided, render nothing */
  if (!open || !entry) return null;

  // ==================== Event Handlers ====================
  
  /**
   * Handles form submission - rejects journal entry
   * 
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submit event
   * @returns {Promise<void>}
   * 
   * @description Validates rejection reason, updates entry status in Firestore,
   * sends notification to entry creator, and calls success callback.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Reason is required
    if (!reason.trim()) {
      setError("Rejection reason is required.");
      return;
    }

    // Validation: Minimum 10 characters for detailed explanation
    if (reason.trim().length < 10) {
      setError("Please provide a more detailed reason (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Update journal entry status to rejected
      await updateDoc(doc(db, "journalEntries", entry.id), {
        status: "rejected",
        rejectedBy: userEmail,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason.trim(),
      });

      // Send notification to the entry creator
      await addDoc(collection(db, "notifications"), {
        recipient: entry.createdBy || entry.preparedBy || "unknown",
        message: `Your journal entry "${entry.description || entry.id}" was rejected: ${reason.trim()}`,
        type: "rejection",
        createdAt: serverTimestamp(),
        sentBy: userEmail,
        journalId: entry.id,
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset form and close modal
      setReason("");
      onClose();
    } catch (err) {
      console.error("Rejection failed:", err);
      setError("Failed to reject entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles modal close - resets form state
   * 
   * @function handleClose
   * @returns {void}
   */
  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  // ==================== Render ====================
  
  return (
    <div style={styles.backdrop} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>❌ Reject Journal Entry</h3>
          <button onClick={handleClose} style={styles.closeBtn} title="Close">
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div style={styles.content}>
          
          {/* Entry Information Display */}
          <div style={styles.entryInfo}>
            <p><strong>Entry ID:</strong> {entry.id}</p>
            <p><strong>Description:</strong> {entry.description || "—"}</p>
            <p><strong>Created By:</strong> {entry.createdBy || entry.preparedBy || "—"}</p>
            <p><strong>Date:</strong> {entry.date || entry.createdAt?.toDate?.()?.toLocaleDateString() || "—"}</p>
          </div>

          {/* Rejection Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            
            {/* Rejection Reason Textarea */}
            <label style={styles.label}>
              Rejection Reason *
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError(""); // Clear error on change
                }}
                style={styles.textarea}
                placeholder="Provide a detailed reason for rejecting this journal entry..."
                rows={6}
                required
                disabled={submitting}
              />
              
              {/* Character Counter */}
              <span style={styles.charCount}>
                {reason.length} characters (minimum 10 required)
              </span>
            </label>

            {/* Error Display */}
            {error && <div style={styles.error}>{error}</div>}

            {/* Action Buttons */}
            <div style={styles.actions}>
              <button
                type="button"
                onClick={handleClose}
                style={styles.cancelBtn}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.rejectBtn}
                disabled={submitting || !reason.trim() || reason.trim().length < 10}
              >
                {submitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==================== Styles ====================

/**
 * Component styles object
 * @constant {Object} styles
 * @description CSS-in-JS styles for rejection modal.
 * Uses red color scheme to indicate negative action.
 */
const styles = {
  /** Modal backdrop overlay - dark semi-transparent */
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 20,
  },
  
  /** Modal container - white card */
  modal: {
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 600,
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  
  /** Modal header - red themed */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    background: "#fef2f2", // Light red background
  },
  
  /** Modal title */
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#991b1b", // Dark red
  },
  
  /** Close button */
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    padding: 8,
    color: "#991b1b",
    borderRadius: 4,
  },
  
  /** Modal content area */
  content: {
    padding: 24,
  },
  
  /** Entry information display box */
  entryInfo: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  
  /** Form container */
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  
  /** Form label */
  label: {
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "#0f172a",
  },
  
  /** Textarea input */
  textarea: {
    padding: 12,
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: 120,
  },
  
  /** Character counter text */
  charCount: {
    fontSize: 12,
    color: "#64748b",
  },
  
  /** Error message display */
  error: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: 6,
    padding: "10px 12px",
    color: "#991b1b",
    fontSize: 14,
  },
  
  /** Action buttons container */
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  
  /** Cancel button */
  cancelBtn: {
    padding: "10px 20px",
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
  },
  
  /** Reject button - red themed */
  rejectBtn: {
    padding: "10px 20px",
    background: "#dc2626", // Red background
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
  },
};

export default RejectJournalModal;