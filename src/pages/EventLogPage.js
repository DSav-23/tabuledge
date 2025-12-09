/**
 * @fileoverview Event Log Page Component
 * @description Displays comprehensive audit trail of all system changes including
 * account modifications, user actions, and data changes with before/after snapshots.
 * 
 * @module pages/EventLogPage
 * @requires react
 * @requires react-router-dom
 * @requires firebase/firestore
 * @requires ../firebase
 * @requires ../components/NavBar
 * @requires ../utils/format
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import NavBar from "../components/NavBar";
import { formatMoney } from "../utils/format";

/**
 * EventLogPage Component
 * 
 * @component
 * @description Renders the event log page with filterable audit trail.
 * Supports filtering by entity type, date range, and text search.
 * Shows before/after snapshots of data changes.
 * 
 * Features:
 * - Real-time event log fetching from Firestore
 * - Multi-criteria filtering (entity, date range, search)
 * - Deep-linking support via URL parameters
 * - Before/after comparison view
 * - Chronological ordering (newest first)
 * 
 * @returns {JSX.Element} Rendered event log page
 * 
 * @example
 * // Direct access
 * <EventLogPage />
 * 
 * // Deep-linked from Chart of Accounts
 * /event-logs?accountId=abc123
 */
export default function EventLogPage() {
  // ==================== State Management ====================
  
  /** @type {string} Current user's email */
  const userEmail = auth?.currentUser?.email || "user@example.com";
  
  /** @type {[string, Function]} Selected date for NavBar */
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  /** @type {[Array<Object>, Function]} All event logs from Firestore */
  const [logs, setLogs] = useState([]);
  
  /** @type {[boolean, Function]} Loading state indicator */
  const [loading, setLoading] = useState(true);

  // ==================== Filter State ====================
  
  /** @type {[string, Function]} Entity type filter (e.g., "account") */
  const [entityFilter, setEntityFilter] = useState("account");
  
  /** @type {[string, Function]} Free-text search query */
  const [search, setSearch] = useState("");
  
  /** @type {[string, Function]} Start date for date range filter */
  const [from, setFrom] = useState("");
  
  /** @type {[string, Function]} End date for date range filter */
  const [to, setTo] = useState("");

  // ==================== Routing ====================
  
  const location = useLocation();
  const navigate = useNavigate();
  
  /** @type {URLSearchParams} Query parameters from URL */
  const params = new URLSearchParams(location.search);
  
  /** @type {string|null} Account ID from deep-link query parameter */
  const qAccountId = params.get("accountId");

  // ==================== Effects ====================
  
  /**
   * Loads all event logs from Firestore on component mount
   * 
   * @effect
   * @description Fetches event logs ordered by timestamp (descending).
   * Runs once on mount.
   */
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(
        query(collection(db, "eventLogs"), orderBy("at", "desc"))
      );
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  // ==================== Computed Values ====================
  
  /**
   * Filtered view of event logs
   * 
   * @type {Array<Object>}
   * @description Applies all active filters to the logs array.
   * Memoized for performance optimization.
   * 
   * Filters applied in order:
   * 1. Entity type filter
   * 2. Deep-link account ID
   * 3. Date range (from/to)
   * 4. Text search (user, name, number, description, etc.)
   */
  const view = useMemo(() => {
    let v = logs;

    // Filter 1: Entity type
    if (entityFilter) v = v.filter(l => l.entity === entityFilter);

    // Filter 2: Deep-linked account ID from URL
    if (qAccountId) v = v.filter(l => l.entityId === qAccountId);

    // Filter 3: Date range - start date
    if (from) {
      const f = new Date(from).getTime();
      v = v.filter(l => (l.at?.toDate ? l.at.toDate().getTime() : 0) >= f);
    }
    
    // Filter 4: Date range - end date
    if (to) {
      const t = new Date(to).getTime();
      v = v.filter(l => (l.at?.toDate ? l.at.toDate().getTime() : 0) <= t);
    }

    // Filter 5: Free-text search across multiple fields
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      
      /**
       * Checks if snapshot data matches search query
       * 
       * @function matchSnapshot
       * @param {Object|null} snap - Before/after snapshot object
       * @returns {boolean} True if snapshot contains search term
       */
      const matchSnapshot = (snap) => {
        if (!snap) return false;
        const txt = [
          snap.name, 
          snap.number, 
          snap.description, 
          snap.comment,
          snap.category, 
          snap.subcategory, 
          snap.normalSide, 
          snap.statement,
          typeof snap.balance === "number" ? formatMoney(snap.balance) : "",
        ].filter(Boolean).join(" ").toLowerCase();
        return txt.includes(s);
      };
      
      v = v.filter(l =>
        (l.user || "").toLowerCase().includes(s) ||
        matchSnapshot(l.before) ||
        matchSnapshot(l.after)
      );
    }

    return v;
  }, [logs, entityFilter, qAccountId, from, to, search]);

  // ==================== Render ====================
  
  return (
    <div>
      {/* Navigation Bar */}
      <NavBar 
        userEmail={userEmail} 
        selectedDate={selectedDate} 
        onDateChange={setSelectedDate} 
      />
      
      <main style={{ padding: 20 }}>
        {/* ==================== Header & Filters ==================== */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          <h2>Event Logs</h2>
          
          {/* Filter Controls */}
          <div style={{ display: "flex", gap: 8 }}>
            {/* Entity Type Dropdown */}
            <select 
              value={entityFilter} 
              onChange={e => setEntityFilter(e.target.value)} 
              title="Entity"
            >
              <option value="account">Account</option>
              {/* Additional entity types can be added here */}
            </select>
            
            {/* Date Range Filters */}
            <input 
              type="date" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
              title="From date" 
            />
            <input 
              type="date" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              title="To date" 
            />
            
            {/* Text Search */}
            <input
              placeholder="Search user/name/number/desc"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
            
            {/* Apply Filters Button (Visual only - filters auto-apply) */}
            <button style={styles.applyBtn} onClick={() => {}}>
              Apply Filters
            </button>
          </div>
        </div>

        {/* ==================== Deep-Link Filter Indicator ==================== */}
        {qAccountId && (
          <div style={{ margin: "8px 0 12px", fontSize: 12 }}>
            Filtering by accountId: <code>{qAccountId}</code>
            <button 
              onClick={() => navigate("/event-logs")} 
              style={{ marginLeft: 8 }}
            >
              Clear
            </button>
          </div>
        )}

        {/* ==================== Event Log Table ==================== */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Timestamp</th>
                <th style={th}>User</th>
                <th style={th}>Action Taken</th>
                <th style={th}>Account (before)</th>
                <th style={th}>Account (after)</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading State */}
              {loading ? (
                <tr>
                  <td colSpan="5">Loading…</td>
                </tr>
              ) : view.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan="5">No logs found.</td>
                </tr>
              ) : (
                /* Event Log Rows */
                view.map(l => (
                  <tr key={l.id}>
                    {/* Timestamp */}
                    <td style={td}>
                      {l.at?.toDate ? l.at.toDate().toLocaleString() : "—"}
                    </td>
                    
                    {/* User */}
                    <td style={td}>{l.user || "—"}</td>
                    
                    {/* Action */}
                    <td style={td}>{l.action}</td>
                    
                    {/* Before Snapshot */}
                    <td style={td}>
                      {l.before ? (
                        <>
                          <div>
                            <strong>{l.before.name}</strong> ({l.before.number})
                          </div>
                          <div>
                            {l.before.category} ▸ {l.before.subcategory}
                          </div>
                          <div>
                            Bal: {typeof l.before.balance === "number" 
                              ? formatMoney(l.before.balance) 
                              : "—"}
                          </div>
                        </>
                      ) : (
                        <em>— first insert —</em>
                      )}
                    </td>
                    
                    {/* After Snapshot */}
                    <td style={td}>
                      {l.after ? (
                        <>
                          <div>
                            <strong>{l.after.name}</strong> ({l.after.number})
                          </div>
                          <div>
                            {l.after.category} ▸ {l.after.subcategory}
                          </div>
                          <div>
                            Bal: {typeof l.after.balance === "number" 
                              ? formatMoney(l.after.balance) 
                              : "—"}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ==================== Styles ====================

/**
 * Table header cell style
 * @constant {Object} th
 * @description Darker tinted header for better visual hierarchy
 */
const th = { 
  border: "1px solid #e2e8f0", 
  padding: 8, 
  background: "#cbd5e1", // Darker than default #f1f5f9
  textAlign: "left",
  fontWeight: 600,
  color: "#0f172a"
};

/**
 * Table data cell style
 * @constant {Object} td
 */
const td = { 
  border: "1px solid #e2e8f0", 
  padding: 8, 
  textAlign: "left" 
};

/**
 * Component-specific styles
 * @constant {Object} styles
 */
const styles = {
  /** Apply Filters button - reduced height for compact design */
  applyBtn: {
    padding: "6px 16px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    height: "32px",
  }
};