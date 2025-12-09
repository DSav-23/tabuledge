/**
 * @fileoverview ChartOfAccounts Page
 * 
 * 
 * @module pages/ChartOfAccounts
 * @requires react
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

// OPTIONAL ENHANCEMENT: Version with toast notifications and confirmation dialogs
// Replace the original ChartOfAccounts.js with this for better UX

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import NavBar from "../components/NavBar";
import HelpModal from "../components/HelpModal";
import SendEmailModal from "../components/SendEmailModal";
import { ToastContainer, useToast } from "../components/Toast";
import { formatMoney, parseMoney } from "../utils/format";
import { isDigitsOnly, hasCorrectPrefix } from "../utils/validation";
import useUserRole from "../hooks/useUserRole";

function ChartOfAccounts() {
  const navigate = useNavigate();
  const { role, loading: roleLoading, userEmail } = useUserRole();
  const canManage = role === "admin";
  const fallbackEmail = auth?.currentUser?.email || "admin@example.com";
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [helpOpen, setHelpOpen] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    if (!roleLoading) setShowForm(canManage);
  }, [roleLoading, canManage]);

  const [filters, setFilters] = useState({
    name: "",
    number: "",
    category: "",
    subcategory: "",
    minAmount: "",
    maxAmount: "",
    activeOnly: true,
  });
  const [filterDraft, setFilterDraft] = useState({
    name: "",
    number: "",
    category: "",
    subcategory: "",
    minAmount: "",
    maxAmount: "",
    activeOnly: true,
  });

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState({ role: "", account: null });

  const emptyForm = {
    name: "",
    number: "",
    description: "",
    normalSide: "Debit",
    category: "Asset",
    subcategory: "Current Assets",
    initialBalance: "0.00",
    debit: "0.00",
    credit: "0.00",
    balance: "0.00",
    statement: "BS",
    order: "01",
    comment: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "accounts"));
        setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFilterDraft((d) => ({ ...d, ...filters }));
      } catch (error) {
        toast.error("Failed to load accounts. Please refresh the page.");
        console.error("Load error:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    return accounts
      .filter((a) => {
        if (filters.activeOnly && a.active === false) return false;
        if (filters.name && !a.name.toLowerCase().includes(filters.name.toLowerCase()))
          return false;
        if (filters.number && !String(a.number).startsWith(filters.number)) return false;
        if (filters.category && a.category !== filters.category) return false;
        if (
          filters.subcategory &&
          !String(a.subcategory).toLowerCase().includes(filters.subcategory.toLowerCase())
        )
          return false;
        const amt = Number(a.balance || 0);
        if (filters.minAmount && amt < parseMoney(filters.minAmount)) return false;
        if (filters.maxAmount && amt > parseMoney(filters.maxAmount)) return false;
        return true;
      })
      .sort((x, y) => String(x.order).localeCompare(String(y.order)));
  }, [accounts, filters]);

  const ensureUnique = async (name, number, excludeId = null) => {
    const nameQ = query(collection(db, "accounts"), where("name", "==", name));
    const nameSnap = await getDocs(nameQ);
    const nameClash = nameSnap.docs.some((d) => d.id !== excludeId);

    const numQ = query(collection(db, "accounts"), where("number", "==", String(number)));
    const numSnap = await getDocs(numQ);
    const numClash = numSnap.docs.some((d) => d.id !== excludeId);

    if (nameClash) throw new Error("Duplicate account name not allowed");
    if (numClash) throw new Error("Duplicate account number not allowed");
  };

  const validateForm = () => {
    if (!form.name.trim()) throw new Error("Account name is required");
    if (!isDigitsOnly(String(form.number))) throw new Error("Account number must be digits only");
    if (!hasCorrectPrefix(form.category, String(form.number)))
      throw new Error(`Account number must start with correct prefix for ${form.category}`);
  };

  const toPersist = (raw) => {
    const initBal = parseMoney(raw.initialBalance);
    const debit = parseMoney(raw.debit);
    const credit = parseMoney(raw.credit);
    const balance = parseMoney(
      raw.balance !== undefined ? raw.balance : initBal + debit - credit
    );

    return {
      name: raw.name.trim(),
      number: String(raw.number),
      description: raw.description.trim(),
      normalSide: raw.normalSide,
      category: raw.category,
      subcategory: raw.subcategory,
      initialBalance: initBal,
      debit,
      credit,
      balance,
      statement: raw.statement,
      order: String(raw.order).padStart(2, "0"),
      comment: raw.comment || "",
      createdAt: serverTimestamp(),
      createdBy: userEmail || fallbackEmail,
      active: true,
    };
  };

  const logEvent = async ({ action, before, after, entityId }) => {
    await addDoc(collection(db, "eventLogs"), {
      entity: "account",
      entityId,
      action,
      before: before || null,
      after: after || null,
      user: userEmail || fallbackEmail,
      at: serverTimestamp(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) {
      toast.warning("View-only: your role cannot add accounts.");
      return;
    }
    
    try {
      validateForm();
      await ensureUnique(form.name, form.number);
      const data = toPersist(form);
      const ref = await addDoc(collection(db, "accounts"), data);
      await logEvent({ action: "create", before: null, after: data, entityId: ref.id });
      setAccounts([{ id: ref.id, ...data }, ...accounts]);
      setForm(emptyForm);
      toast.success(`Account "${data.name}" added successfully!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const startEdit = (acc) => {
    if (!canManage) {
      toast.warning("View-only: your role cannot edit accounts.");
      return;
    }
    setEditingId(acc.id);
    setShowForm(true);
    setForm({
      ...acc,
      initialBalance: formatMoney(acc.initialBalance),
      debit: formatMoney(acc.debit),
      credit: formatMoney(acc.credit),
      balance: formatMoney(acc.balance),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(`Editing account "${acc.name}"`);
  };

  const saveEdit = async () => {
    if (!canManage) {
      toast.warning("View-only: your role cannot edit accounts.");
      return;
    }
    
    try {
      validateForm();
      await ensureUnique(form.name, form.number, editingId);

      const before = accounts.find((a) => a.id === editingId);
      const updated = { ...before, ...toPersist(form) };
      delete updated.createdAt;

      await updateDoc(doc(db, "accounts", editingId), updated);
      await logEvent({ action: "update", before, after: updated, entityId: editingId });

      setAccounts(accounts.map((a) => (a.id === editingId ? updated : a)));
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(true);
      toast.success(`Account "${updated.name}" updated successfully!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deactivate = async (acc) => {
    if (!canManage) {
      toast.warning("View-only: your role cannot deactivate accounts.");
      return;
    }
    
    if ((acc.balance || 0) > 0) {
      toast.error("Accounts with balance greater than zero cannot be deactivated");
      return;
    }

    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to deactivate account "${acc.name}"?`)) {
      return;
    }

    try {
      const before = { ...acc };
      const after = { ...acc, active: false };
      await updateDoc(doc(db, "accounts", acc.id), { active: false });
      await logEvent({ action: "deactivate", before, after, entityId: acc.id });
      setAccounts(accounts.map((a) => (a.id === acc.id ? { ...a, active: false } : a)));
      toast.success(`Account "${acc.name}" deactivated`);
    } catch (error) {
      toast.error("Failed to deactivate account. Please try again.");
      console.error(error);
    }
  };

  const goLedger = (acc) => navigate(`/ledger/${acc.id}`);
  const goDetails = (acc) => navigate(`/accounts/${acc.id}`);

  const onRowAction = (acc, value) => {
    if (!value) return;
    switch (value) {
      case "view":
        return goDetails(acc);
      case "edit":
        return startEdit(acc);
      case "deactivate":
        return deactivate(acc);
      case "viewLogs":
        return navigate(`/event-logs?accountId=${acc.id}`);
      case "emailManager":
        setEmailTo({ role: "manager", account: acc });
        setEmailOpen(true);
        return;
      case "emailAccountant":
        setEmailTo({ role: "accountant", account: acc });
        setEmailOpen(true);
        return;
      default:
        return;
    }
  };

  return (
    <div>
      <NavBar userEmail={userEmail} selectedDate={selectedDate} onDateChange={setSelectedDate} />
      
      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      <main style={styles.container}>
        <h2 style={styles.h2}>Chart of Accounts</h2>

        {!canManage && (
          <div style={styles.banner}>
            ℹ️ View-only mode. Only administrators can add, edit, or deactivate accounts.
          </div>
        )}

        {/* Action buttons */}
        <div style={styles.actions}>
          {canManage && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) setEditingId(null);
              }}
              title={showForm ? "Hide form" : "Show form to add account"}
            >
              {showForm ? "Hide Form" : "+ Add Account"}
            </button>
          )}
          <button onClick={() => setHelpOpen(true)} title="Open help documentation">
            ? Help
          </button>
        </div>

        {/* Add/Edit Form - Only show for admin */}
        {showForm && canManage && (
          <form onSubmit={editingId ? saveEdit : handleSubmit} style={styles.form}>
            <h3>{editingId ? "Edit Account" : "Add New Account"}</h3>
            
            {/* Form fields... (same as original) */}
            <div style={styles.row}>
              <label title="Unique name for this account">
                Account Name *
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g., Cash"
                />
              </label>

              <label title="Account number (digits only, must match category prefix)">
                Account Number *
                <input
                  value={form.number}
                  onChange={(e) =>
                    setForm({ ...form, number: e.target.value.replace(/\D/g, "") })
                  }
                  required
                  placeholder="e.g., 1001"
                />
              </label>

              <label title="Description of what this account tracks">
                Description
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Cash on hand"
                />
              </label>
            </div>

            <div style={styles.row}>
              <label title="Normal side for this account type">
                Normal Side *
                <select
                  value={form.normalSide}
                  onChange={(e) => setForm({ ...form, normalSide: e.target.value })}
                >
                  <option>Debit</option>
                  <option>Credit</option>
                </select>
              </label>

              <label title="Main category (determines account number prefix)">
                Category *
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>Asset</option>
                  <option>Liability</option>
                  <option>Equity</option>
                  <option>Revenue</option>
                  <option>Expense</option>
                </select>
              </label>

              <label title="Subcategory for grouping accounts">
                Subcategory *
                <input
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  required
                  placeholder="e.g., Current Assets"
                />
              </label>
            </div>

            <div style={styles.row}>
              <label title="Starting balance for this account">
                Initial Balance
                <input
                  type="number"
                  step="0.01"
                  value={form.initialBalance}
                  onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
                  placeholder="0.00"
                />
              </label>

              <label title="Total debits to this account">
                Debit
                <input
                  type="number"
                  step="0.01"
                  value={form.debit}
                  onChange={(e) => setForm({ ...form, debit: e.target.value })}
                  placeholder="0.00"
                />
              </label>

              <label title="Total credits to this account">
                Credit
                <input
                  type="number"
                  step="0.01"
                  value={form.credit}
                  onChange={(e) => setForm({ ...form, credit: e.target.value })}
                  placeholder="0.00"
                />
              </label>
            </div>

            <div style={styles.row}>
              <label title="Which financial statement shows this account">
                Statement *
                <select
                  value={form.statement}
                  onChange={(e) => setForm({ ...form, statement: e.target.value })}
                >
                  <option value="BS">Balance Sheet (BS)</option>
                  <option value="IS">Income Statement (IS)</option>
                  <option value="RE">Retained Earnings (RE)</option>
                </select>
              </label>

              <label title="Display order in reports (e.g., 01, 02, 03)">
                Order *
                <input
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  required
                  placeholder="01"
                  maxLength={3}
                />
              </label>

              <label title="Optional notes about this account">
                Comment
                <input
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder="Optional notes"
                />
              </label>
            </div>

            <div>
              <button type="submit" title={editingId ? "Save changes" : "Create account"}>
                {editingId ? "Save Changes" : "Create Account"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    toast.info("Edit cancelled");
                  }}
                  style={{ marginLeft: 8 }}
                  title="Cancel editing"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}

        {/* Filters */}
        <section
          style={styles.filters}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setFilters(filterDraft);
              toast.info("Filters applied");
            }
          }}
        >
          <input
            placeholder="Filter by name"
            value={filterDraft.name}
            onChange={(e) => setFilterDraft({ ...filterDraft, name: e.target.value })}
            title="Filter by account name"
          />
          <input
            placeholder="Filter by number"
            value={filterDraft.number}
            onChange={(e) =>
              setFilterDraft({
                ...filterDraft,
                number: e.target.value.replace(/[^\d]/g, ""),
              })
            }
            title="Filter by account number"
          />
          <select
            value={filterDraft.category}
            onChange={(e) => setFilterDraft({ ...filterDraft, category: e.target.value })}
            title="Filter by category"
          >
            <option value="">All Categories</option>
            <option>Asset</option>
            <option>Liability</option>
            <option>Equity</option>
            <option>Revenue</option>
            <option>Expense</option>
          </select>
          <input
            placeholder="Filter by subcategory"
            value={filterDraft.subcategory}
            onChange={(e) =>
              setFilterDraft({ ...filterDraft, subcategory: e.target.value })
            }
            title="Filter by subcategory"
          />
          <input
            placeholder="Min balance"
            value={filterDraft.minAmount}
            onChange={(e) =>
              setFilterDraft({
                ...filterDraft,
                minAmount: e.target.value.replace(/[^\d.,-]/g, ""),
              })
            }
            title="Filter by minimum balance"
          />
          <input
            placeholder="Max balance"
            value={filterDraft.maxAmount}
            onChange={(e) =>
              setFilterDraft({
                ...filterDraft,
                maxAmount: e.target.value.replace(/[^\d.,-]/g, ""),
              })
            }
            title="Filter by maximum balance"
          />
          <label
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            title="Show only active accounts"
          >
            <input
              type="checkbox"
              checked={filterDraft.activeOnly}
              onChange={(e) =>
                setFilterDraft({ ...filterDraft, activeOnly: e.target.checked })
              }
            />
            Active only
          </label>

          <button
            onClick={() => {
              setFilters(filterDraft);
              toast.info(`Showing ${filtered.length} account(s)`);
            }}
            style={styles.applyBtn}
            title="Apply filter search"
          >
            Apply Filters
          </button>
        </section>

        {/* Accounts Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Number</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Subcategory</th>
                <th style={styles.th}>Normal</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Balance</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: "left" }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: "left" }}>No accounts match your filters.</td></tr>
              ) : (
                filtered.map((acc) => (
                  <tr key={acc.id} style={{ opacity: acc.active === false ? 0.5 : 1 }}>
                    <td style={styles.td}>{acc.order}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => goLedger(acc)}
                        style={styles.linkBtn}
                        title="Open ledger for this account"
                      >
                        {acc.name}
                      </button>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => goLedger(acc)}
                        style={styles.linkBtn}
                        title="Open ledger for this account"
                      >
                        {acc.number}
                      </button>
                    </td>
                    <td style={styles.td}>{acc.category}</td>
                    <td style={styles.td}>{acc.subcategory}</td>
                    <td style={styles.td}>{acc.normalSide}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      {formatMoney(acc.balance)}
                    </td>
                    <td style={styles.td}>
                      {acc.active === false ? "Inactive" : "Active"}
                    </td>
                    <td style={styles.td}>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const action = e.target.value;
                          e.target.value = "";
                          onRowAction(acc, action);
                        }}
                        title={canManage ? "Choose an action" : "View-only"}
                      >
                        <option value="" disabled>▾ Actions</option>
                        <option value="view">View Details</option>
                        <option value="edit" disabled={!canManage}>Edit</option>
                        <option value="deactivate" disabled={!canManage}>Deactivate</option>
                        <option value="viewLogs">View Logs</option>
                        <option value="emailManager">Email Manager</option>
                        <option value="emailAccountant">Email Accountant</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <SendEmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        defaultSubject={
          emailTo.account ? `Account: ${emailTo.account.name} (${emailTo.account.number})` : ""
        }
        defaultMessage={
          emailTo.account
            ? `Hi ${emailTo.role},\n\nPlease review the account "${emailTo.account.name}" (#${emailTo.account.number}).\n\nThanks!`
            : ""
        }
      />
    </div>
  );
}

const styles = {
  container: { padding: 20 },
  h2: { margin: "12px 0" },
  banner: {
    margin: "8px 0 12px",
    padding: "10px 12px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 8,
    color: "#7c2d12",
  },
  actions: { display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8 },
  form: {
    display: "grid",
    gap: 12,
    background: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    marginBottom: 12,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 10,
  },
  filters: { display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" },
  applyBtn: {
    padding: "8px 12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { border: "1px solid #e2e8f0", padding: 8, background: "#f1f5f9", textAlign: "left" },
  td: { border: "1px solid #e2e8f0", padding: 8, textAlign: "left" },
  linkBtn: {
    background: "transparent",
    color: "#2563eb",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
  },
};

export default ChartOfAccounts;