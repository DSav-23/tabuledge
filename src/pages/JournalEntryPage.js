/**
 * @fileoverview JournalEntryPage Page
 * 
 * 
 * @module pages/JournalEntryPage
 * @requires react
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

// Enhanced version with support for Regular vs Adjusting journal entries
// Sprint 4 requirement: distinguish adjusting entries from regular entries

import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import ErrorDisplay from "../components/ErrorDisplay";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
];

function moneyToNumber(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  return Number(String(v).replace(/,/g, ""));
}

function formatMoney(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function JournalEntryPage() {
  const user = auth.currentUser;
  const [accounts, setAccounts] = useState([]);
  
  // Form state
  const [entryType, setEntryType] = useState("regular"); // NEW: regular or adjusting
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [debits, setDebits] = useState([{ accountId: "", amount: "" }]);
  const [credits, setCredits] = useState([{ accountId: "", amount: "" }]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // List view state
  const [entries, setEntries] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // NEW: all, regular, adjusting
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Load accounts
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "accounts"));
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  const normalizeStatus = (s) => {
    if (!s) return "pending";
    s = s.toLowerCase();
    if (["approved", "rejected", "pending"].includes(s)) return s;
    if (s === "pendingapproval" || s === "submitted") return "pending";
    return "pending";
  };

  const normalizeDate = (entry) => {
    if (entry.date) return entry.date;
    if (entry.createdAt?.toDate) {
      return entry.createdAt.toDate().toISOString().slice(0, 10);
    }
    return "";
  };

  // Load entries
  useEffect(() => {
    const loadEntries = async () => {
      const q = query(collection(db, "journalEntries"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setEntries(
        snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            status: normalizeStatus(data.status),
            type: data.type || "regular", // Default to regular if not set
            filterDate: normalizeDate(data),
          };
        })
      );
    };
    loadEntries();
  }, []);

  const totalDebits = useMemo(
    () => debits.reduce((s, r) => s + moneyToNumber(r.amount), 0),
    [debits]
  );
  
  const totalCredits = useMemo(
    () => credits.reduce((s, r) => s + moneyToNumber(r.amount), 0),
    [credits]
  );

  const onChangeDebit = (idx, key, val) => {
    const next = debits.map((r, i) => (i === idx ? { ...r, [key]: val } : r));
    setDebits(next);
  };
  
  const onChangeCredit = (idx, key, val) => {
    const next = credits.map((r, i) => (i === idx ? { ...r, [key]: val } : r));
    setCredits(next);
  };

  const addDebit = () => setDebits([...debits, { accountId: "", amount: "" }]);
  const addCredit = () => setCredits([...credits, { accountId: "", amount: "" }]);
  const removeDebit = (idx) => setDebits(debits.filter((_, i) => i !== idx));
  const removeCredit = (idx) => setCredits(credits.filter((_, i) => i !== idx));

  const resetForm = () => {
    setEntryType("regular");
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setDebits([{ accountId: "", amount: "" }]);
    setCredits([{ accountId: "", amount: "" }]);
    setFiles([]);
    setError("");
  };

  const validate = () => {
    if (debits.length === 0 || credits.length === 0) {
      return "Each journal entry must have at least one debit and one credit.";
    }
    
    for (const r of [...debits, ...credits]) {
      if (!r.accountId) return "All lines must have an account selected.";
      const amt = moneyToNumber(r.amount);
      if (!amt || amt <= 0) return "All line amounts must be greater than zero.";
    }
    
    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      return "Total debits must equal total credits.";
    }
    
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        return `Unsupported file type: ${f.name}`;
      }
    }
    
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const v = validate();
    
    if (v) {
      setError(v);
      await addDoc(collection(db, "errorMessages"), {
        code: "JE_VALIDATION",
        message: v,
        user: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });
      return;
    }

    try {
      setSubmitting(true);

      // Upload attachments
      const uploads = [];
      for (const f of files) {
        const storageRef = ref(storage, `journal_attachments/${Date.now()}_${f.name}`);
        await uploadBytes(storageRef, f);
        const url = await getDownloadURL(storageRef);
        uploads.push({ name: f.name, url, contentType: f.type, size: f.size });
      }

      // Resolve account metadata
      const accountLookup = Object.fromEntries(accounts.map(a => [a.id, a]));
      const debitLines = debits.map(r => ({
        accountId: r.accountId,
        accountName: accountLookup[r.accountId]?.name || "",
        amount: moneyToNumber(r.amount),
        side: "debit",
      }));
      const creditLines = credits.map(r => ({
        accountId: r.accountId,
        accountName: accountLookup[r.accountId]?.name || "",
        amount: moneyToNumber(r.amount),
        side: "credit",
      }));

      // Create journal entry
      const docRef = await addDoc(collection(db, "journalEntries"), {
        type: entryType, // NEW: regular or adjusting
        date,
        description,
        lines: [...debitLines, ...creditLines],
        totalDebits: Number(totalDebits.toFixed(2)),
        totalCredits: Number(totalCredits.toFixed(2)),
        status: "pending",
        attachments: uploads,
        createdBy: user?.email || "unknown",
        createdAt: serverTimestamp(),
      });

      // Notification for manager
      await addDoc(collection(db, "notifications"), {
        type: entryType === "adjusting" ? "adjusting_journal_submitted" : "journal_submitted",
        journalId: docRef.id,
        forRole: "manager",
        message: `New ${entryType} journal entry submitted by ${user?.email}`,
        createdAt: serverTimestamp(),
      });

      alert(`✅ ${entryType === "adjusting" ? "Adjusting" : "Regular"} journal entry submitted for approval!`);
      resetForm();

      // Reload entries
      const q = query(collection(db, "journalEntries"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setEntries(
        snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            status: normalizeStatus(data.status),
            type: data.type || "regular",
            filterDate: normalizeDate(data),
          };
        })
      );
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit journal entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false; // NEW
      if (fromDate && e.filterDate < fromDate) return false;
      if (toDate && e.filterDate > toDate) return false;

      if (searchTerm) {
        const st = searchTerm.toLowerCase();
        const inAccounts =
          Array.isArray(e.lines) &&
          e.lines.some(
            ln =>
              (ln.accountName || "").toLowerCase().includes(st) ||
              (ln.accountNumber || "").toLowerCase?.().includes(st) ||
              String(ln.amount).includes(st)
          );
        const inDesc = (e.description || "").toLowerCase().includes(st);
        const inDate = (e.date || "").includes(st) || (e.filterDate || "").includes(st);
        return inAccounts || inDesc || inDate;
      }
      return true;
    });
  }, [entries, statusFilter, typeFilter, fromDate, toDate, searchTerm]);

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h2>Journal Entries</h2>

      {/* Entry form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>Create Journal Entry</h3>

        {/* Entry Type Selector - NEW */}
        <div style={styles.typeSelector}>
          <label style={styles.typeLabel}>
            <input
              type="radio"
              value="regular"
              checked={entryType === "regular"}
              onChange={(e) => setEntryType(e.target.value)}
            />
            <span style={styles.typeText}>
              <strong>Regular Journal Entry</strong>
              <span style={styles.typeDesc}>Standard business transactions</span>
            </span>
          </label>
          <label style={styles.typeLabel}>
            <input
              type="radio"
              value="adjusting"
              checked={entryType === "adjusting"}
              onChange={(e) => setEntryType(e.target.value)}
            />
            <span style={styles.typeText}>
              <strong>Adjusting Journal Entry</strong>
              <span style={styles.typeDesc}>Period-end adjustments (accruals, deferrals, etc.)</span>
            </span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <div>
            <label>Date</label><br />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div style={{ flex: 1 }}>
            <label>Description</label><br />
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter description"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Debits */}
          <div>
            <h4>Debits</h4>
            {debits.map((row, idx) => (
              <div key={`d-${idx}`} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <select
                  value={row.accountId}
                  onChange={e => onChangeDebit(idx, "accountId", e.target.value)}
                  required
                  style={{ flex: 1 }}
                >
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.number})</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.amount}
                  onChange={e => onChangeDebit(idx, "amount", e.target.value)}
                  placeholder="Amount"
                  required
                  style={{ width: 140, textAlign: "right" }}
                />
                {debits.length > 1 && (
                  <button type="button" onClick={() => removeDebit(idx)}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addDebit}>Add debit line</button>
          </div>

          {/* Credits */}
          <div>
            <h4>Credits</h4>
            {credits.map((row, idx) => (
              <div key={`c-${idx}`} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <select
                  value={row.accountId}
                  onChange={e => onChangeCredit(idx, "accountId", e.target.value)}
                  required
                  style={{ flex: 1 }}
                >
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.number})</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.amount}
                  onChange={e => onChangeCredit(idx, "amount", e.target.value)}
                  placeholder="Amount"
                  required
                  style={{ width: 140, textAlign: "right" }}
                />
                {credits.length > 1 && (
                  <button type="button" onClick={() => removeCredit(idx)}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addCredit}>Add credit line</button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Total Debits:</strong> {formatMoney(totalDebits)} &nbsp; | &nbsp;
            <strong>Total Credits:</strong> {formatMoney(totalCredits)}
            {Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0 && (
              <span style={{ marginLeft: 12, color: "#059669" }}>✓ Balanced</span>
            )}
          </div>
          <div>
            <label style={{ fontSize: 13 }}>
              Attachments:
              <input
                type="file"
                multiple
                onChange={e => setFiles(Array.from(e.target.files || []))}
                accept={ALLOWED_TYPES.join(",")}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>
        </div>

        {error && <ErrorDisplay error={error} onDismiss={() => setError("")} />}

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for approval"}
          </button>
          <button type="button" onClick={resetForm}>Reset</button>
        </div>
      </form>

      {/* Journal Entries list */}
      <div style={styles.listContainer}>
        <h3>All Journal Entries</h3>
        
        {/* Filters - Enhanced with type filter */}
        <div style={styles.filters}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          {/* NEW: Type filter */}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="regular">Regular Entries</option>
            <option value="adjusting">Adjusting Entries</option>
          </select>
          
          <div>
            <label style={{ marginRight: 4 }}>From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label style={{ marginRight: 4 }}>To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <input
            type="text"
            placeholder="Search by account, amount, or description"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 260 }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Debits</th>
                <th>Credits</th>
                <th>Attachments</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((je) => {
                const debs = (je.lines || []).filter(l => l.side === "debit");
                const creds = (je.lines || []).filter(l => l.side === "credit");
                
                // Type badge styling
                const typeBadge = je.type === "adjusting"
                  ? { background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }
                  : { background: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 };
                
                return (
                  <tr key={je.id}>
                    <td>
                      <span style={typeBadge}>
                        {je.type === "adjusting" ? "Adjusting" : "Regular"}
                      </span>
                    </td>
                    <td>{je.date}</td>
                    <td>{je.description || ""}</td>
                    <td>{je.status}</td>
                    <td>
                      {debs.map((l, i) => (
                        <div key={i}>{l.accountName}: {formatMoney(l.amount)}</div>
                      ))}
                      <div><strong>Total:</strong> {formatMoney(je.totalDebits)}</div>
                    </td>
                    <td>
                      {creds.map((l, i) => (
                        <div key={i}>{l.accountName}: {formatMoney(l.amount)}</div>
                      ))}
                      <div><strong>Total:</strong> {formatMoney(je.totalCredits)}</div>
                    </td>
                    <td>
                      {(je.attachments || []).map((a, i) => (
                        <div key={i}>
                          <a href={a.url} target="_blank" rel="noreferrer">{a.name}</a>
                        </div>
                      ))}
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr><td colSpan={7}>No journal entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  form: {
    border: "1px solid #e2e8f0",
    padding: 16,
    marginBottom: 24,
    borderRadius: 8,
    background: "#f8fafc",
  },
  typeSelector: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 16,
  },
  typeLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    border: "2px solid #cbd5e1",
    borderRadius: 8,
    cursor: "pointer",
    background: "#fff",
  },
  typeText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  typeDesc: {
    fontSize: 12,
    color: "#64748b",
  },
  listContainer: {
    border: "1px solid #e2e8f0",
    padding: 16,
    borderRadius: 8,
  },
  filters: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
};