/**
 * @fileoverview Accountant Dashboard Page
 * @description Journal entry listing and management page for accountants.
 * Provides filtering, searching, and navigation to create new journal entries.
 * 
 * @module pages/AccountantDashboard
 * @requires react
 * @requires firebase/firestore
 * @requires ../firebase
 * @requires ../components/NavBar
 * @requires react-router-dom
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";

/**
 * AccountantDashboard Component
 * 
 * @component
 * @description Main dashboard for accountants to view and manage journal entries.
 * Includes comprehensive filtering and search capabilities.
 * 
 * Features:
 * - View all journal entries in table format
 * - Filter by status (All, Pending, Approved, Rejected)
 * - Filter by date range (from/to dates)
 * - Search by account name, amount, or description
 * - Navigate to create new journal entry
 * - Displays debits and credits for each entry
 * - Real-time data loading from Firestore
 * 
 * Cosmetic Updates:
 * - Page title: "Journal" (not "Accountant Dashboard")
 * - "+ New Journal Entry" button: 32px height, bold text
 * 
 * @returns {JSX.Element} Accountant dashboard page
 * 
 * @example
 * <Route path="/accountant" element={<AccountantDashboard />} />
 */
function AccountantDashboard() {
  // ==================== State Management ====================
  
  /** @type {[Array<Object>, Function]} All journal entries from Firestore */
  const [entries, setEntries] = useState([]);
  
  /** @type {[Array<Object>, Function]} Filtered entries based on search criteria */
  const [filteredEntries, setFilteredEntries] = useState([]);
  
  /** @type {[string, Function]} Status filter ("All"|"Pending"|"Approved"|"Rejected") */
  const [statusFilter, setStatusFilter] = useState("All");
  
  /** @type {[string, Function]} Free-text search term */
  const [searchTerm, setSearchTerm] = useState("");
  
  /** @type {[string, Function]} From date for date range filter */
  const [fromDate, setFromDate] = useState("");
  
  /** @type {[string, Function]} To date for date range filter */
  const [toDate, setToDate] = useState("");
  
  /** @type {[boolean, Function]} Loading state while fetching entries */
  const [loading, setLoading] = useState(true);
  
  /** Current user's email from Firebase Auth */
  const userEmail = auth?.currentUser?.email || "accountant@example.com";
  
  /** Navigation hook for routing */
  const navigate = useNavigate();

  // ==================== Effects ====================
  
  /**
   * Loads all journal entries from Firestore on mount
   * 
   * @effect
   * @description Fetches all documents from journalEntries collection,
   * sets both entries and filteredEntries to initial data.
   */
  useEffect(() => {
    /**
     * Async function to load entries
     * 
     * @async
     * @function loadEntries
     * @returns {Promise<void>}
     */
    const loadEntries = async () => {
      try {
        const snap = await getDocs(collection(db, "journalEntries"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEntries(data);
        setFilteredEntries(data);
      } catch (e) {
        console.error("Failed to load journal entries:", e);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);

  /**
   * Applies filters whenever entries or filter criteria change
   * 
   * @effect
   * @description Multi-criteria filtering pipeline:
   * 1. Filter by status (if not "All")
   * 2. Filter by date range (from date)
   * 3. Filter by date range (to date)
   * 4. Filter by search term (accounts, amounts, description)
   */
  useEffect(() => {
    let filtered = [...entries];

    // Filter by status
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (e) => (e.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by date range - from date
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter((e) => e.createdAt?.toDate?.() >= from);
    }
    
    // Filter by date range - to date
    if (toDate) {
      const to = new Date(toDate);
      filtered = filtered.filter((e) => e.createdAt?.toDate?.() <= to);
    }

    // Search by account name, amount, or description
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((e) => {
        /** Check if any debit account name matches search */
        const debitMatch = e.debits?.some((d) =>
          d.accountName?.toLowerCase().includes(term)
        );
        
        /** Check if any credit account name matches search */
        const creditMatch = e.credits?.some((c) =>
          c.accountName?.toLowerCase().includes(term)
        );
        
        /** Check if description matches search */
        const descMatch = e.description?.toLowerCase().includes(term);
        
        /** Check if any amount matches search */
        const amountMatch =
          e.debits?.some((d) => String(d.amount).includes(term)) ||
          e.credits?.some((c) => String(c.amount).includes(term));
        
        return debitMatch || creditMatch || descMatch || amountMatch;
      });
    }

    setFilteredEntries(filtered);
  }, [entries, statusFilter, fromDate, toDate, searchTerm]);

  // ==================== Computed Values ====================
  
  /**
   * Memoized table rows for performance
   * @constant {Array<JSX.Element>}
   * @description Generates table rows from filtered entries,
   * only recomputes when filteredEntries changes.
   */
  const tableRows = useMemo(
    () =>
      filteredEntries.map((e) => (
        <tr key={e.id}>
          <td style={td}>
            {e.createdAt?.toDate
              ? e.createdAt.toDate().toLocaleDateString()
              : "—"}
          </td>
          <td style={td}>{e.description || "—"}</td>
          <td style={td}>
            {e.debits?.map((d, i) => (
              <div key={i}>
                {d.accountName}: ${d.amount?.toFixed(2)}
              </div>
            ))}
          </td>
          <td style={td}>
            {e.credits?.map((c, i) => (
              <div key={i}>
                {c.accountName}: ${c.amount?.toFixed(2)}
              </div>
            ))}
          </td>
          <td style={td}>{e.status || "pending"}</td>
          <td style={td}>{e.preparedBy || "—"}</td>
        </tr>
      )),
    [filteredEntries]
  );

  // ==================== Render ====================
  
  return (
    <div>
      <NavBar userEmail={userEmail} />

      <main style={{ padding: 20 }}>
        
        {/* Header with Create Journal button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {/* Page Title - Changed from "Accountant Dashboard" to "Journal" */}
          <h2>Journal</h2>
          
          {/* Create New Entry Button - Reduced height to 32px and made bold */}
          <button
            onClick={() => navigate("/create-journal")}
            style={{
              padding: "6px 14px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              height: "32px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            + New Journal Entry
          </button>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            margin: "16px 0",
            background: "#f8fafc",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Status Filter */}
          <div>
            <label>Status: </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={select}
            >
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>

          {/* From Date Filter */}
          <div>
            <label>From: </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={input}
            />
          </div>

          {/* To Date Filter */}
          <div>
            <label>To: </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={input}
            />
          </div>

          {/* Search Input */}
          <div style={{ flexGrow: 1 }}>
            <label>Search: </label>
            <input
              type="text"
              placeholder="Search account, amount, or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...input, width: "100%" }}
            />
          </div>
        </div>

        {/* Journal Entries Table */}
        {loading ? (
          <p>Loading journal entries…</p>
        ) : filteredEntries.length === 0 ? (
          <p>No journal entries found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>Description</th>
                  <th style={th}>Debits</th>
                  <th style={th}>Credits</th>
                  <th style={th}>Status</th>
                  <th style={th}>Prepared By</th>
                </tr>
              </thead>
              <tbody>{tableRows}</tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

// ==================== Styles ====================

/**
 * Table header cell style
 * @constant {Object} th
 */
const th = {
  border: "1px solid #e2e8f0",
  padding: 8,
  background: "#f1f5f9",
  textAlign: "left",
};

/**
 * Table data cell style
 * @constant {Object} td
 */
const td = {
  border: "1px solid #e2e8f0",
  padding: 8,
  verticalAlign: "top",
  textAlign: "left",
};

/**
 * Input field style
 * @constant {Object} input
 */
const input = {
  padding: "6px 8px",
  border: "1px solid #cbd5e1",
  borderRadius: 4,
  background: "white",
};

/**
 * Select dropdown style
 * @constant {Object} select
 */
const select = { ...input, minWidth: 120 };

export default AccountantDashboard;