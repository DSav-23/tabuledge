/**
 * @fileoverview Send Email Modal Component
 * @description Simple modal for sending messages/notifications to managers or specific recipients.
 * Messages are saved in Firestore "notifications" collection for retrieval.
 * 
 * @module components/SendEmailModal
 * @requires react
 * @requires firebase/firestore
 * @requires ../firebase
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * SendEmailModal Component
 * 
 * @component
 * @description Modal dialog for composing and sending messages to managers.
 * Messages are stored in Firestore notifications collection rather than
 * sent as actual emails. Can be integrated with email service later.
 * 
 * Features:
 * - Subject and message body fields
 * - Form validation
 * - Success feedback
 * - Auto-close after sending
 * - Stores in Firestore notifications collection
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is currently open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {string} props.sender - Email address of the sender
 * @param {string} [props.defaultRecipient='manager@example.com'] - Default recipient email
 * 
 * @returns {JSX.Element|null} Rendered modal or null if closed
 * 
 * @example
 * <SendEmailModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   sender="accountant@example.com"
 *   defaultRecipient="manager@example.com"
 * />
 */
export default function SendEmailModal({ open, onClose, sender, defaultRecipient }) {
  // ==================== State Management ====================
  
  /** @type {[string, Function]} Email subject line */
  const [subject, setSubject] = useState("");
  
  /** @type {[string, Function]} Email message body */
  const [message, setMessage] = useState("");
  
  /** @type {[boolean, Function]} Form submission state */
  const [sending, setSending] = useState(false);
  
  /** @type {[boolean, Function]} Success state for feedback */
  const [success, setSuccess] = useState(false);

  // ==================== Early Return ====================
  
  /** If modal is closed, render nothing */
  if (!open) return null;

  // ==================== Event Handlers ====================
  
  /**
   * Handles form submission - sends message
   * 
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submit event
   * @returns {Promise<void>}
   * 
   * @description Saves message to Firestore notifications collection,
   * shows success feedback, and auto-closes modal after 1.5 seconds.
   * 
   * @throws {Error} If Firestore write fails
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSuccess(false);

    try {
      // Save message to notifications collection
      await addDoc(collection(db, "notifications"), {
        type: "manual_message",
        from: sender,
        to: defaultRecipient || "manager@example.com",
        subject,
        body: message,
        createdAt: serverTimestamp(),
      });
      
      // Show success feedback
      setSuccess(true);
      
      // Reset form fields
      setSubject("");
      setMessage("");
      
      // Auto-close after 1.5 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Error sending message. Check console for details.");
    } finally {
      setSending(false);
    }
  };

  // ==================== Render ====================
  
  return (
    <div style={overlay}>
      <div style={modal}>
        
        {/* Modal Title */}
        <h3 style={{ marginBottom: 12 }}>Send Message to Manager</h3>
        
        {/* Message Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Subject Field */}
          <div style={{ marginBottom: 10 }}>
            <label>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              style={input}
            />
          </div>
          
          {/* Message Body Field */}
          <div style={{ marginBottom: 10 }}>
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              style={{ ...input, resize: "vertical" }}
            />
          </div>
          
          {/* Success Message */}
          {success && <p style={{ color: "green" }}>Message sent successfully.</p>}
          
          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== Styles ====================

/**
 * Modal backdrop overlay style
 * @constant {Object} overlay
 * @description Fixed positioned semi-transparent dark background
 */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

/**
 * Modal content container style
 * @constant {Object} modal
 * @description White card with shadow and rounded corners
 */
const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  width: "100%",
  maxWidth: 420,
};

/**
 * Input field style
 * @constant {Object} input
 * @description Standard form input styling
 */
const input = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #cbd5e1",
  borderRadius: 4,
  background: "white",
};