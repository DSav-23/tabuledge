/**
 * @fileoverview AdminPanel Page
 * 
 * 
 * @module pages/AdminPanel
 * @requires react
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase";
import bcrypt from "bcryptjs";
import NavBar from "../components/NavBar";

function AdminPanel() {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [suspendDates, setSuspendDates] = useState({});
  const userEmail = auth?.currentUser?.email || "admin@example.com";
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    const fetchData = async () => {
      const reqSnap = await getDocs(collection(db, "userRequests"));
      setRequests(reqSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const userSnap = await getDocs(collection(db, "users"));
      setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const generateUsername = (firstName, lastName) => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    return `${firstName[0].toLowerCase()}${lastName.toLowerCase()}${mm}${yy}`;
  };

  const approveRequest = async (req) => {
    try {
      const username = req.username || generateUsername(req.firstName, req.lastName);

      // Hash the password for storage
      const hashedPassword = await bcrypt.hash(req.password, 10);

      // Create Firebase Auth user
      // Note: In production, this should be done via a secure backend/Cloud Function
      // to avoid exposing admin credentials in client code
      
      // Add user to Firestore users collection
      await addDoc(collection(db, "users"), {
        firstName: req.firstName,
        lastName: req.lastName,
        address: req.address || "",
        dob: req.dob || "",
        email: req.email,
        username,
        role: "accountant", // Default role for new users
        active: true,
        failedAttempts: 0,
        passwordSetAt: Date.now(),
        createdAt: serverTimestamp(),
        createdBy: userEmail,
        passwordHistory: [hashedPassword], // Store first password in history
      });

      // Send approval notification
      await addDoc(collection(db, "notifications"), {
        type: "account_approved",
        recipient: req.email,
        subject: "Tabuledge Account Approved",
        message: `Your Tabuledge account has been approved! Username: ${username}. You can now log in at https://tabuledge.app`,
        createdAt: serverTimestamp(),
        sentBy: userEmail,
      });

      // Delete the request
      await deleteDoc(doc(db, "userRequests", req.id));
      setRequests(requests.filter((r) => r.id !== req.id));
      
      alert(`✅ Approved user: ${username}. Approval email sent to ${req.email}.`);
      
      // Reload users to show the new user
      const userSnap = await getDocs(collection(db, "users"));
      setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request: " + error.message);
    }
  };

  const rejectRequest = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    const req = requests.find((r) => r.id === id);
    
    try {
      // Send rejection notification
      await addDoc(collection(db, "notifications"), {
        type: "account_rejected",
        recipient: req.email,
        subject: "Tabuledge Account Request",
        message: `Your Tabuledge account request has been rejected. Reason: ${reason}`,
        createdAt: serverTimestamp(),
        sentBy: userEmail,
      });

      // Delete the request
      await deleteDoc(doc(db, "userRequests", id));
      setRequests(requests.filter((r) => r.id !== id));
      alert("❌ Request rejected and notification sent.");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request: " + error.message);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    const ref = doc(db, "users", id);
    await updateDoc(ref, { active: !currentStatus });
    setUsers(users.map((u) => (u.id === id ? { ...u, active: !currentStatus } : u)));
    alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully.`);
  };

  const suspendUser = async (id) => {
    const { start, end } = suspendDates[id] || {};
    if (!start || !end) {
      alert("Please select start and end dates.");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (endDate <= startDate) {
      alert("End date must be after start date.");
      return;
    }

    const ref = doc(db, "users", id);
    await updateDoc(ref, { 
      suspendedFrom: start, 
      suspendedTo: end, 
      active: false 
    });
    
    setUsers(users.map((u) => 
      u.id === id 
        ? { ...u, suspendedFrom: start, suspendedTo: end, active: false } 
        : u
    ));
    
    // Send notification to user
    const user = users.find(u => u.id === id);
    await addDoc(collection(db, "notifications"), {
      type: "account_suspended",
      recipient: user.email,
      subject: "Account Suspended",
      message: `Your account has been suspended from ${start} to ${end}. Please contact administrator for more information.`,
      createdAt: serverTimestamp(),
      sentBy: userEmail,
    });
    
    alert("⏸ User suspended and notification sent.");
  };

  const unlockUser = async (id) => {
    const ref = doc(db, "users", id);
    await updateDoc(ref, { 
      failedAttempts: 0,
      active: true 
    });
    setUsers(users.map((u) => (u.id === id ? { ...u, failedAttempts: 0, active: true } : u)));
    alert("🔓 User unlocked successfully.");
  };

  const getExpiredUsers = () => {
    const now = Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    return users.filter((u) => u.passwordSetAt && now - u.passwordSetAt > ninetyDays);
  };

  const getLockedUsers = () => {
    return users.filter((u) => (u.failedAttempts || 0) >= 3);
  };

  const sendEmail = async (user) => {
    const subject = prompt("Email subject:");
    if (!subject) return;
    
    const message = prompt("Email message:");
    if (!message) return;

    try {
      await addDoc(collection(db, "notifications"), {
        type: "admin_message",
        recipient: user.email,
        subject,
        message,
        createdAt: serverTimestamp(),
        sentBy: userEmail,
      });
      alert(`📧 Email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error sending email: " + error.message);
    }
  };

  return (
    <div>
      <NavBar userEmail={userEmail} selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <div style={{ margin: "20px", maxWidth: 1200 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2>👑 Admin Panel</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => window.location.assign("/accounts")} title="Open Chart of Accounts">
              Chart of Accounts
            </button>
            <button onClick={() => window.location.assign("/event-logs")} title="Open Event Logs">
              Event Logs
            </button>
          </div>
        </div>

        {/* Pending Requests */}
        <section style={styles.section}>
          <h3>📋 Pending Access Requests</h3>
          {requests.length === 0 ? (
            <p style={styles.emptyMessage}>No pending requests</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Address</th>
                    <th style={styles.th}>DOB</th>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Requested</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td style={styles.td}>{r.firstName} {r.lastName}</td>
                      <td style={styles.td}>{r.email}</td>
                      <td style={styles.td}>{r.address || "—"}</td>
                      <td style={styles.td}>{r.dob || "—"}</td>
                      <td style={styles.td}>{r.username || generateUsername(r.firstName, r.lastName)}</td>
                      <td style={styles.td}>
                        {r.requestedAt?.toDate ? r.requestedAt.toDate().toLocaleDateString() : "—"}
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => approveRequest(r)} style={styles.approveBtn}>
                          ✓ Approve
                        </button>
                        <button onClick={() => rejectRequest(r.id)} style={styles.rejectBtn}>
                          ✗ Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Existing Users */}
        <section style={styles.section}>
          <h3>👥 All Users</h3>
          {users.length === 0 ? (
            <p style={styles.emptyMessage}>No users yet</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Suspend Dates</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isLocked = (u.failedAttempts || 0) >= 3;
                    return (
                      <tr key={u.id} style={{ opacity: u.active ? 1 : 0.6 }}>
                        <td style={styles.td}>{u.username}</td>
                        <td style={styles.td}>{u.firstName} {u.lastName}</td>
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>
                          <span style={styles.roleBadge}>{u.role}</span>
                        </td>
                        <td style={styles.td}>
                          {isLocked ? (
                            <span style={styles.lockedBadge}>🔒 Locked</span>
                          ) : u.active ? (
                            <span style={styles.activeBadge}>Active</span>
                          ) : (
                            <span style={styles.inactiveBadge}>Inactive</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <input
                            type="date"
                            onChange={(e) =>
                              setSuspendDates({ 
                                ...suspendDates, 
                                [u.id]: { ...suspendDates[u.id], start: e.target.value } 
                              })
                            }
                            style={styles.dateInput}
                            placeholder="Start"
                          />
                          <input
                            type="date"
                            onChange={(e) =>
                              setSuspendDates({ 
                                ...suspendDates, 
                                [u.id]: { ...suspendDates[u.id], end: e.target.value } 
                              })
                            }
                            style={styles.dateInput}
                            placeholder="End"
                          />
                          <button onClick={() => suspendUser(u.id)} style={styles.smallBtn}>
                            Suspend
                          </button>
                        </td>
                        <td style={styles.td}>
                          {isLocked ? (
                            <button onClick={() => unlockUser(u.id)} style={styles.unlockBtn}>
                              🔓 Unlock
                            </button>
                          ) : (
                            <button onClick={() => toggleActive(u.id, u.active)} style={styles.smallBtn}>
                              {u.active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                          <button onClick={() => sendEmail(u)} style={styles.smallBtn}>
                            📧 Email
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Locked Users Report */}
        <section style={styles.section}>
          <h3>🔒 Locked Accounts</h3>
          {getLockedUsers().length === 0 ? (
            <p style={styles.emptyMessage}>No locked accounts</p>
          ) : (
            <ul style={styles.list}>
              {getLockedUsers().map((u) => (
                <li key={u.id} style={styles.listItem}>
                  <strong>{u.username}</strong> ({u.email}) — {u.failedAttempts} failed attempts
                  <button onClick={() => unlockUser(u.id)} style={styles.unlockBtn}>
                    Unlock
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Expired Password Report */}
        <section style={styles.section}>
          <h3>⚠️ Expired Passwords</h3>
          {getExpiredUsers().length === 0 ? (
            <p style={styles.emptyMessage}>No expired passwords</p>
          ) : (
            <ul style={styles.list}>
              {getExpiredUsers().map((u) => {
                const daysSinceSet = Math.floor((Date.now() - u.passwordSetAt) / (1000 * 60 * 60 * 24));
                return (
                  <li key={u.id} style={styles.listItem}>
                    <strong>{u.username}</strong> ({u.email}) — expired {daysSinceSet - 90} days ago
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  section: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
  },
  th: {
    border: "1px solid #e2e8f0",
    padding: 10,
    background: "#f1f5f9",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 13,
  },
  td: {
    border: "1px solid #e2e8f0",
    padding: 10,
    fontSize: 13,
  },
  emptyMessage: {
    textAlign: "center",
    color: "#64748b",
    padding: 20,
    fontStyle: "italic",
  },
  approveBtn: {
    padding: "6px 12px",
    marginRight: 6,
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  rejectBtn: {
    padding: "6px 12px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  smallBtn: {
    padding: "4px 8px",
    margin: 2,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 11,
  },
  unlockBtn: {
    padding: "4px 8px",
    margin: 2,
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 11,
  },
  dateInput: {
    padding: 4,
    marginRight: 4,
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    fontSize: 12,
  },
  roleBadge: {
    padding: "3px 8px",
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
  },
  activeBadge: {
    padding: "3px 8px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
  },
  inactiveBadge: {
    padding: "3px 8px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
  },
  lockedBadge: {
    padding: "3px 8px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: "10px 12px",
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};

export default AdminPanel;