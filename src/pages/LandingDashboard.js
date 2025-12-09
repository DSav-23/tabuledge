/**
 * @fileoverview LandingDashboard Page
 * 
 * 
 * @module pages/LandingDashboard
 * @requires react
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

// Professional dashboard with financial ratios, role-based actions, and important messages
// Sprint 5 complete implementation

import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import useUserRole from "../hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { computeBalances, incomeStatement, balanceSheet } from "../utils/financials";
import { computeRatios } from "../utils/ratios";

export default function LandingDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const navigate = useNavigate();
  const { role, loading: roleLoading, userEmail } = useUserRole();

  const [ratios, setRatios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [lastLogin, setLastLogin] = useState(null);

  useEffect(() => {
    if (!auth?.currentUser) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        // Load accounts and ledger
        const accSnap = await getDocs(collection(db, "accounts"));
        const accounts = accSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const ledSnap = await getDocs(collection(db, "ledgerEntries"));
        const ledger = ledSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Compute balances
        const accMap = computeBalances(accounts, ledger, null, today);

        // Compute statements
        const is = incomeStatement(accMap);
        const bs = balanceSheet(accMap, 0, is.netIncome);

        // Extract totals
        const totals = {
          currentAssets: bs.currentAssets ?? 0,
          inventory: bs.inventory ?? 0,
          currentLiabilities: bs.currentLiabilities ?? 0,
          totalLiabilities: bs.totalLiabilities ?? 0,
          totalEquity: bs.totalEquity ?? 0,
          totalAssets: bs.totalAssets ?? 0,
          netIncome: is.netIncome ?? 0,
          revenue: is.revenue ?? 0,
        };

        // Compute ratios
        setRatios(computeRatios(totals));

        // Load journal entry counts
        const jeSnap = await getDocs(collection(db, "journalEntries"));
        const journalEntries = jeSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setPendingCount(journalEntries.filter((j) => j.status === "pending").length);
        setRejectedCount(journalEntries.filter((j) => j.status === "rejected").length);

        // Load notifications
        const notifSnap = await getDocs(collection(db, "notifications"));
        setUnreadNotifications(notifSnap.docs.length);

        // Load last login
        const userEmail = auth?.currentUser?.email;
        if (userEmail) {
          const eventSnap = await getDocs(
            query(collection(db, "eventLogs"), where("createdBy", "==", userEmail))
          );
          const events = eventSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((e) => e.action === "login")
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

          if (events.length > 0) {
            setLastLogin(events[0].timestamp);
          }
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [today]);

  // Ratio icons
  const getRatioIcon = (key) => {
    const icons = {
      currentRatio: "💧",
      quickRatio: "⚡",
      debtToEquity: "⚖️",
      netMargin: "💰",
      returnOnAssets: "📈",
      workingCapital: "💵",
    };
    return icons[key] || "📊";
  };

  // Status colors
  const getStatusColor = (status) => {
    return status === "good" ? "#16a34a" : status === "warning" ? "#f59e0b" : "#dc2626";
  };

  const getStatusBg = (status) => {
    return status === "good" ? "#dcfce7" : status === "warning" ? "#fef3c7" : "#fee2e2";
  };

  // Role-based actions
  const getQuickActions = () => {
    if (role === "admin") {
      return [
        { label: "Manage Users", icon: "👥", path: "/admin", color: "#3b82f6" },
        { label: "Chart of Accounts", icon: "📊", path: "/chart-of-accounts", color: "#8b5cf6" },
        { label: "Event Logs", icon: "📝", path: "/event-logs", color: "#06b6d4" },
        { label: "Generate Reports", icon: "📄", path: "/manager", color: "#10b981" },
      ];
    } else if (role === "manager") {
      return [
        { label: "Review Journals", icon: "📋", path: "/manager", color: "#f59e0b" },
        { label: "Generate Reports", icon: "📊", path: "/manager", color: "#10b981" },
        { label: "View Chart of Accounts", icon: "📈", path: "/chart-of-accounts", color: "#8b5cf6" },
        { label: "Event Logs", icon: "📝", path: "/event-logs", color: "#06b6d4" },
      ];
    } else if (role === "accountant") {
      return [
        { label: "Create Journal Entry", icon: "✍️", path: "/journal-entry", color: "#10b981" },
        { label: "View Ledgers", icon: "📖", path: "/chart-of-accounts", color: "#3b82f6" },
        { label: "Chart of Accounts", icon: "📊", path: "/chart-of-accounts", color: "#8b5cf6" },
        { label: "Event Logs", icon: "📝", path: "/event-logs", color: "#06b6d4" },
      ];
    }
    return [];
  };

  return (
    <div>
      <NavBar userEmail={userEmail || ""} selectedDate={today} onDateChange={() => {}} />

      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {role === "admin" && "Admin Dashboard"}
              {role === "manager" && "Manager Dashboard"}
              {role === "accountant" && "Accountant Dashboard"}
              {!role && "Dashboard"}
            </h1>
            <p style={styles.subtitle}>Welcome back, {userEmail || "User"}</p>
          </div>
          <div style={styles.lastLogin}>
            Last login: {lastLogin ? new Date(lastLogin).toLocaleString() : "—"}
          </div>
        </div>

        {/* Important Messages / Alerts */}
        <section style={styles.alertsSection}>
          {pendingCount > 0 && (role === "manager" || role === "admin") && (
            <div style={{ ...styles.alert, ...styles.alertWarning }}>
              <div style={styles.alertIcon}>⚠️</div>
              <div style={styles.alertContent}>
                <div style={styles.alertTitle}>
                  {pendingCount} Journal {pendingCount === 1 ? "Entry" : "Entries"} Awaiting Approval
                </div>
                <div style={styles.alertMessage}>
                  Review and approve pending journal entries
                </div>
              </div>
              <button
                style={{ ...styles.alertButton, background: "#f59e0b" }}
                onClick={() => navigate("/manager")}
              >
                Review Now
              </button>
            </div>
          )}

          {rejectedCount > 0 && (
            <div style={{ ...styles.alert, ...styles.alertDanger }}>
              <div style={styles.alertIcon}>❌</div>
              <div style={styles.alertContent}>
                <div style={styles.alertTitle}>
                  {rejectedCount} Rejected {rejectedCount === 1 ? "Entry" : "Entries"}
                </div>
                <div style={styles.alertMessage}>
                  {role === "accountant" ? "Review rejection reasons and resubmit" : "Review rejected entries"}
                </div>
              </div>
              <button
                style={{ ...styles.alertButton, background: "#dc2626" }}
                onClick={() => navigate(role === "manager" ? "/manager" : "/journal-entry")}
              >
                View Details
              </button>
            </div>
          )}

          {unreadNotifications > 0 && (
            <div style={{ ...styles.alert, ...styles.alertInfo }}>
              <div style={styles.alertIcon}>🔔</div>
              <div style={styles.alertContent}>
                <div style={styles.alertTitle}>
                  {unreadNotifications} Unread {unreadNotifications === 1 ? "Notification" : "Notifications"}
                </div>
                <div style={styles.alertMessage}>You have new notifications</div>
              </div>
              <button
                style={{ ...styles.alertButton, background: "#3b82f6" }}
                onClick={() => alert("Notifications page coming soon!")}
              >
                View All
              </button>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.actionsGrid}>
            {getQuickActions().map((action, idx) => (
              <button
                key={idx}
                style={{ ...styles.actionCard, borderLeft: `4px solid ${action.color}` }}
                onClick={() => navigate(action.path)}
              >
                <div style={{ ...styles.actionIcon, background: action.color + "20" }}>
                  {action.icon}
                </div>
                <div style={styles.actionLabel}>{action.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Financial Ratios */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Financial Ratios</h2>

          {loading && (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Loading financial data...</p>
            </div>
          )}

          {!loading && !ratios && (
            <div style={styles.emptyState}>
              <p>No ratio data available. Please add accounts and transactions.</p>
            </div>
          )}

          {!loading && ratios && (
            <div style={styles.ratiosGrid}>
              {ratios.map((r) => {
                const statusColor = getStatusColor(r.status);
                const statusBg = getStatusBg(r.status);

                return (
                  <div key={r.key} style={styles.ratioCard}>
                    <div style={styles.ratioHeader}>
                      <div style={styles.ratioIconWrapper}>{getRatioIcon(r.key)}</div>
                      <div
                        style={{ ...styles.statusBadge, background: statusBg, color: statusColor }}
                        title={r.status === "good" ? "Healthy" : r.status === "warning" ? "Needs Attention" : "Critical"}
                      >
                        {r.status === "good" ? "✓" : r.status === "warning" ? "⚠" : "✕"}
                      </div>
                    </div>
                    <div style={styles.ratioLabel}>{r.label}</div>
                    <div style={{ ...styles.ratioValue, color: statusColor }}>{r.formatted}</div>
                    <div style={styles.ratioFormula} title={r.formula}>
                      {r.formula}
                    </div>
                    <div style={styles.ratioStatus}>
                      {r.status === "good" && "Healthy range"}
                      {r.status === "warning" && "Monitor closely"}
                      {r.status === "bad" && "Needs attention"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Financial Health Summary */}
        {!loading && ratios && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Financial Health Summary</h2>
            <div style={styles.healthSummary}>
              {(() => {
                const goodCount = ratios.filter((r) => r.status === "good").length;
                const warnCount = ratios.filter((r) => r.status === "warning").length;
                const badCount = ratios.filter((r) => r.status === "bad").length;
                const total = ratios.length;

                let healthScore = (goodCount / total) * 100;
                let healthStatus = "Excellent";
                let healthColor = "#16a34a";

                if (healthScore < 50) {
                  healthStatus = "Needs Improvement";
                  healthColor = "#dc2626";
                } else if (healthScore < 75) {
                  healthStatus = "Good";
                  healthColor = "#f59e0b";
                }

                return (
                  <>
                    <div style={styles.healthScore}>
                      <div style={{ ...styles.healthScoreCircle, borderColor: healthColor }}>
                        <div style={{ ...styles.healthScoreValue, color: healthColor }}>
                          {Math.round(healthScore)}%
                        </div>
                        <div style={styles.healthScoreLabel}>Health Score</div>
                      </div>
                      <div style={styles.healthScoreDetails}>
                        <div style={styles.healthScoreStatus}>
                          Status: <strong style={{ color: healthColor }}>{healthStatus}</strong>
                        </div>
                        <div style={styles.healthStats}>
                          <div style={styles.healthStat}>
                            <span style={{ color: "#16a34a" }}>●</span> {goodCount} Healthy
                          </div>
                          <div style={styles.healthStat}>
                            <span style={{ color: "#f59e0b" }}>●</span> {warnCount} Warning
                          </div>
                          <div style={styles.healthStat}>
                            <span style={{ color: "#dc2626" }}>●</span> {badCount} Critical
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  main: {
    padding: 20,
    maxWidth: 1400,
    margin: "0 auto",
    background: "#f8fafc",
    minHeight: "calc(100vh - 60px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    padding: "20px 0",
  },
  title: {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: "#0f172a",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: 16,
    color: "#64748b",
  },
  lastLogin: {
    fontSize: 14,
    color: "#64748b",
    background: "#fff",
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
  },
  alertsSection: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 24,
  },
  alert: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 12,
    border: "1px solid",
    background: "#fff",
  },
  alertWarning: {
    borderColor: "#fcd34d",
    background: "#fffbeb",
  },
  alertDanger: {
    borderColor: "#fca5a5",
    background: "#fef2f2",
  },
  alertInfo: {
    borderColor: "#93c5fd",
    background: "#eff6ff",
  },
  alertIcon: {
    fontSize: 32,
    flexShrink: 0,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: "#64748b",
  },
  alertButton: {
    padding: "6px 16px",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    whiteSpace: "nowrap",
    height: "32px",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 16,
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  actionCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
    minHeight: "60px",
  },
  actionIcon: {
    fontSize: 28,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
  },
  ratiosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  ratioCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 20,
    transition: "all 0.2s",
    cursor: "default",
  },
  ratioHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ratioIconWrapper: {
    fontSize: 32,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
  },
  ratioLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  ratioValue: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 8,
  },
  ratioFormula: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
    fontStyle: "italic",
  },
  ratioStatus: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 500,
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    color: "#64748b",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: 16,
  },
  emptyState: {
    padding: 60,
    textAlign: "center",
    color: "#64748b",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  healthSummary: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 32,
  },
  healthScore: {
    display: "flex",
    alignItems: "center",
    gap: 40,
  },
  healthScoreCircle: {
    width: 160,
    height: 160,
    borderRadius: "50%",
    border: "8px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  healthScoreValue: {
    fontSize: 48,
    fontWeight: 700,
  },
  healthScoreLabel: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  healthScoreDetails: {
    flex: 1,
  },
  healthScoreStatus: {
    fontSize: 24,
    marginBottom: 16,
    color: "#0f172a",
  },
  healthStats: {
    display: "flex",
    gap: 24,
  },
  healthStat: {
    fontSize: 16,
    color: "#64748b",
  },
};

// Add CSS for spinner animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
  `;
  document.head.appendChild(style);
}