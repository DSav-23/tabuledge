// src/components/HelpModal.js
import React, { useState } from "react";

function HelpModal({ open, onClose }) {
  const [selectedTopic, setSelectedTopic] = useState("overview");

  if (!open) return null;

  const topics = {
    overview: {
      title: "Application Overview",
      content: (
        <>
          <p><strong>Tabuledge</strong> is a comprehensive accounting software system designed for businesses to manage their financial accounts, journal entries, and reporting.</p>
          <h4>Key Features:</h4>
          <ul>
            <li>Chart of Accounts management</li>
            <li>Journal Entry creation and approval workflow</li>
            <li>Ledger tracking and reconciliation</li>
            <li>Financial statement generation</li>
            <li>Event logging and audit trails</li>
            <li>Role-based access control</li>
          </ul>
        </>
      ),
    },
    accounts: {
      title: "Chart of Accounts",
      content: (
        <>
          <h4>Managing Accounts</h4>
          <p><strong>Add Account:</strong> Click "Add Account" to create a new account. Fill in all required fields:</p>
          <ul>
            <li><strong>Account Number:</strong> Must be digits only. First digit indicates category (1=Asset, 2=Liability, 3=Equity, 4=Revenue, 5=Expense)</li>
            <li><strong>Account Name:</strong> Must be unique</li>
            <li><strong>Normal Side:</strong> Debit (Assets, Expenses) or Credit (Liabilities, Equity, Revenue)</li>
            <li><strong>Category:</strong> Asset, Liability, Equity, Revenue, or Expense</li>
            <li><strong>Statement:</strong> BS (Balance Sheet), IS (Income Statement), or RE (Retained Earnings)</li>
          </ul>
          
          <h4>Searching & Filtering</h4>
          <p>Use the filter bar to search by name, number, category, subcategory, or balance range.</p>
          
          <h4>Viewing Details</h4>
          <p>Click on an account name or number to open its ledger, or use the Actions dropdown for more options.</p>
          
          <h4>Deactivating Accounts</h4>
          <p><strong>Important:</strong> Accounts with balances greater than zero cannot be deactivated. You must first journal any remaining balance to another account.</p>
        </>
      ),
    },
    journal: {
      title: "Journal Entries",
      content: (
        <>
          <h4>Creating Journal Entries</h4>
          <p>Journal entries record financial transactions using double-entry accounting:</p>
          <ul>
            <li><strong>Debits</strong> must equal <strong>Credits</strong></li>
            <li>Each entry requires at least one debit and one credit</li>
            <li>All amounts must be greater than zero</li>
            <li>Include a description for clarity</li>
          </ul>
          
          <h4>Approval Workflow</h4>
          <p>Accountants create journal entries that are submitted for manager approval:</p>
          <ol>
            <li>Accountant creates entry (status: pending)</li>
            <li>Manager reviews and approves/rejects</li>
            <li>Upon approval, entries are posted to ledgers</li>
          </ol>
          
          <h4>Attachments</h4>
          <p>Upload supporting documents (PDF, DOC, XLS, images) to journal entries for audit purposes.</p>
        </>
      ),
    },
    ledger: {
      title: "Ledgers",
      content: (
        <>
          <h4>Understanding Ledgers</h4>
          <p>Ledgers show all transactions for a specific account over time.</p>
          
          <h4>Running Balance</h4>
          <p>The running balance updates with each transaction based on the account's normal side:</p>
          <ul>
            <li><strong>Debit-normal accounts:</strong> Balance increases with debits, decreases with credits</li>
            <li><strong>Credit-normal accounts:</strong> Balance increases with credits, decreases with debits</li>
          </ul>
          
          <h4>Filtering Ledger Entries</h4>
          <p>Use date ranges and search to find specific transactions. Click the PR (Post Reference) link to view the original journal entry.</p>
        </>
      ),
    },
    reports: {
      title: "Financial Reports",
      content: (
        <>
          <h4>Available Reports</h4>
          <ul>
            <li><strong>Trial Balance:</strong> Lists all accounts with debit/credit totals</li>
            <li><strong>Income Statement:</strong> Revenue - Expenses = Net Income</li>
            <li><strong>Balance Sheet:</strong> Assets = Liabilities + Equity</li>
            <li><strong>Retained Earnings:</strong> Tracks equity changes over time</li>
          </ul>
          
          <h4>Generating Reports</h4>
          <ol>
            <li>Select report type</li>
            <li>Choose date range (from/to)</li>
            <li>Click "Generate"</li>
            <li>Save, email, or print the report</li>
          </ol>
          
          <h4>Financial Ratios</h4>
          <p>View key financial ratios on the dashboard including:</p>
          <ul>
            <li>Current Ratio (liquidity)</li>
            <li>Quick Ratio (acid test)</li>
            <li>Debt-to-Equity Ratio</li>
            <li>Net Profit Margin</li>
            <li>Return on Assets</li>
          </ul>
        </>
      ),
    },
    eventLogs: {
      title: "Event Logs & Audit Trail",
      content: (
        <>
          <h4>Audit Trail</h4>
          <p>Every change to accounts is logged with before/after snapshots:</p>
          <ul>
            <li>Who made the change (user email)</li>
            <li>When the change occurred (timestamp)</li>
            <li>What changed (before and after values)</li>
            <li>Type of action (create, update, deactivate)</li>
          </ul>
          
          <h4>Viewing Event Logs</h4>
          <p>Filter logs by:</p>
          <ul>
            <li>Date range</li>
            <li>User who made changes</li>
            <li>Account name or number</li>
            <li>Type of change</li>
          </ul>
          
          <h4>Use Cases</h4>
          <ul>
            <li>Compliance and regulatory audits</li>
            <li>Investigating discrepancies</li>
            <li>Training new staff</li>
            <li>Understanding account history</li>
          </ul>
        </>
      ),
    },
    roles: {
      title: "User Roles & Permissions",
      content: (
        <>
          <h4>Administrator</h4>
          <ul>
            <li>Full access to all features</li>
            <li>Manage users (create, activate, deactivate, suspend)</li>
            <li>Add, edit, deactivate accounts</li>
            <li>View all reports and logs</li>
            <li>Approve/reject user requests</li>
          </ul>
          
          <h4>Manager</h4>
          <ul>
            <li>View accounts (cannot add/edit/deactivate)</li>
            <li>Generate financial reports</li>
            <li>Approve/reject journal entries</li>
            <li>View event logs</li>
          </ul>
          
          <h4>Accountant</h4>
          <ul>
            <li>View accounts (cannot add/edit/deactivate)</li>
            <li>Create journal entries</li>
            <li>View ledgers</li>
            <li>View event logs</li>
          </ul>
        </>
      ),
    },
    security: {
      title: "Security & Best Practices",
      content: (
        <>
          <h4>Password Security</h4>
          <ul>
            <li>Passwords expire after 90 days</li>
            <li>Warning appears 3 days before expiry</li>
            <li>Account locks after 3 failed login attempts</li>
            <li>Use strong passwords (8+ characters, letters, numbers, special characters)</li>
          </ul>
          
          <h4>Account Security</h4>
          <ul>
            <li>Always log out when finished</li>
            <li>Don't share login credentials</li>
            <li>Report suspicious activity to administrators</li>
          </ul>
          
          <h4>Data Protection</h4>
          <ul>
            <li>All financial data is encrypted</li>
            <li>Event logs track all changes</li>
            <li>Regular backups are performed</li>
            <li>Access is role-based</li>
          </ul>
        </>
      ),
    },
    tips: {
      title: "Tips & Shortcuts",
      content: (
        <>
          <h4>Keyboard Navigation</h4>
          <ul>
            <li><kbd>Tab</kbd> - Move between fields</li>
            <li><kbd>Enter</kbd> - Submit forms</li>
            <li><kbd>Esc</kbd> - Close modals</li>
          </ul>
          
          <h4>Efficiency Tips</h4>
          <ul>
            <li><strong>Bulk Actions:</strong> Use filters to find groups of accounts</li>
            <li><strong>Templates:</strong> Save common journal entries as templates</li>
            <li><strong>Quick Search:</strong> Start typing in filter boxes for instant results</li>
            <li><strong>Date Picker:</strong> Use the calendar at the top to set your working date</li>
          </ul>
          
          <h4>Best Practices</h4>
          <ul>
            <li>Review journal entries before submitting</li>
            <li>Add detailed descriptions to transactions</li>
            <li>Attach supporting documents</li>
            <li>Reconcile accounts regularly</li>
            <li>Check event logs for unexpected changes</li>
          </ul>
        </>
      ),
    },
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Help & Documentation</h2>
          <button onClick={onClose} style={styles.closeBtn} title="Close help">
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {/* Topics sidebar */}
          <div style={styles.sidebar}>
            <h3 style={styles.sidebarTitle}>Topics</h3>
            {Object.entries(topics).map(([key, topic]) => (
              <button
                key={key}
                onClick={() => setSelectedTopic(key)}
                style={{
                  ...styles.topicBtn,
                  ...(selectedTopic === key ? styles.topicBtnActive : {}),
                }}
              >
                {topic.title}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div style={styles.mainContent}>
            <h3 style={styles.contentTitle}>{topics[selectedTopic].title}</h3>
            <div style={styles.contentBody}>{topics[selectedTopic].content}</div>
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Need more help? Contact your system administrator or visit the Tabuledge support portal.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
  modal: {
    background: "#fff",
    color: "#0f172a",
    borderRadius: 16,
    width: "100%",
    maxWidth: 900,
    maxHeight: "90vh",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    padding: 8,
    color: "#64748b",
    borderRadius: 4,
  },
  content: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    flex: 1,
    overflow: "hidden",
  },
  sidebar: {
    borderRight: "1px solid #e2e8f0",
    padding: 16,
    overflowY: "auto",
    background: "#f8fafc",
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: 600,
    margin: "0 0 12px 0",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  topicBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    marginBottom: 4,
    color: "#334155",
    transition: "all 0.2s",
  },
  topicBtnActive: {
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
  },
  mainContent: {
    padding: 24,
    overflowY: "auto",
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 16,
    color: "#0f172a",
  },
  contentBody: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#334155",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  footerText: {
    margin: 0,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
};

export default HelpModal;