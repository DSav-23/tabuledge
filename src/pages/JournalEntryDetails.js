/**
 * @fileoverview Journal Entry Details Page
 * @description Displays detailed view of a single journal entry including debits,
 * credits, metadata, and attachments. Accessed from manager approval workflow
 * or accountant journal list.
 * 
 * @module pages/JournalEntryDetails
 * @requires react
 * @requires react-router-dom
 * @requires firebase/firestore
 * @requires ../firebase
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * JournalEntryDetails Component
 * 
 * @component
 * @description Read-only detail view of a journal entry showing all transaction
 * information, debits, credits, status, and attached supporting documents.
 * 
 * Features:
 * - Displays entry metadata (ID, date, description, status, preparer)
 * - Lists all debit transactions with account names and amounts
 * - Lists all credit transactions with account names and amounts
 * - Shows attached supporting documents with download links
 * - Normalizes data structure (supports both debits/credits and lines formats)
 * - Back navigation to previous page
 * 
 * @returns {JSX.Element} Journal entry details page
 * 
 * @example
 * // Route: /journal/:id
 * <Route path="/journal/:id" element={<JournalEntryDetails />} />
 */
export default function JournalEntryDetails() {
  // ==================== Router Hooks ====================
  
  /** Extract journal entry ID from URL params */
  const { id } = useParams();
  
  /** Navigation hook for back button */
  const navigate = useNavigate();
  
  // ==================== State Management ====================
  
  /** @type {[Object|null, Function]} Journal entry data */
  const [entry, setEntry] = useState(null);
  
  /** @type {[boolean, Function]} Loading state */
  const [loading, setLoading] = useState(true);

  // ==================== Effects ====================
  
  /**
   * Loads journal entry data from Firestore
   * 
   * @effect
   * @description Fetches journal entry document by ID from Firestore.
   * Runs once on component mount and when ID changes.
   */
  useEffect(() => {
    /**
     * Async function to load entry data
     * 
     * @async
     * @function load
     * @returns {Promise<void>}
     */
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "journalEntries", id));
        if (snap.exists()) {
          setEntry({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error("Failed to load journal entry:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ==================== Early Returns ====================
  
  /** Show loading state */
  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  
  /** Show not found message if entry doesn't exist */
  if (!entry) return <p style={{ padding: 20 }}>Journal entry not found.</p>;

  // ==================== Data Normalization ====================
  
  /**
   * Normalize debit line items
   * @constant {Array<Object>}
   * @description Supports two data structures:
   * 1. entry.debits array (newer format)
   * 2. entry.lines filtered by side="debit" (legacy format)
   */
  const debitLines =
    entry.debits ||
    entry.lines?.filter((l) => l.side === "debit") ||
    [];

  /**
   * Normalize credit line items
   * @constant {Array<Object>}
   * @description Supports two data structures:
   * 1. entry.credits array (newer format)
   * 2. entry.lines filtered by side="credit" (legacy format)
   */
  const creditLines =
    entry.credits ||
    entry.lines?.filter((l) => l.side === "credit") ||
    [];

  // ==================== Render ====================
  
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      
      {/* Back Button */}
      <button onClick={() => navigate(-1)}>← Back</button>

      {/* Page Title */}
      <h2>Journal Entry Details</h2>

      {/* Entry Metadata */}
      <p><strong>ID:</strong> {entry.id}</p>
      <p><strong>Date:</strong> {entry.date || "—"}</p>
      <p><strong>Description:</strong> {entry.description || "—"}</p>
      <p><strong>Status:</strong> {entry.status || "pending"}</p>
      <p><strong>Prepared By:</strong> {entry.preparedBy || entry.createdBy || "—"}</p>

      {/* Debit Transactions */}
      <h3>Debits</h3>
      <ul>
        {debitLines.map((d, i) => (
          <li key={i}>
            {d.accountName} — ${Number(d.amount || 0).toFixed(2)}
          </li>
        ))}
      </ul>

      {/* Credit Transactions */}
      <h3>Credits</h3>
      <ul>
        {creditLines.map((c, i) => (
          <li key={i}>
            {c.accountName} — ${Number(c.amount || 0).toFixed(2)}
          </li>
        ))}
      </ul>

      {/* Attachments Section (if any) */}
      {entry.attachments?.length > 0 && (
        <>
          <h3>Attachments</h3>
          <ul>
            {entry.attachments.map((a, i) => (
              <li key={i}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                  {a.name}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}