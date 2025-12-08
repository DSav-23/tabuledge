// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPanel from "./pages/AdminPanel";
import ManagerDashboard from "./pages/ManagerDashboard";
import AccountantDashboard from "./pages/AccountantDashboard";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import AccountDetailsPage from "./pages/AccountDetailsPage";
import LedgerPage from "./pages/LedgerPage";
import EventLogPage from "./pages/EventLogPage";
import JournalEntryPage from "./pages/JournalEntryPage";
import CreateJournalEntry from "./pages/CreateJournalEntry";
import JournalEntryDetails from "./pages/JournalEntryDetails";
import LandingDashboard from "./pages/LandingDashboard"; // ⬅️ from file 1

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin / Manager / Accountant */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/accountant" element={<AccountantDashboard />} />

        {/* Accounts + Ledgers + Events */}
        <Route path="/accounts" element={<ChartOfAccounts />} />
        <Route path="/accounts/:id" element={<AccountDetailsPage />} />
        <Route path="/ledger/:id" element={<LedgerPage />} />
        <Route path="/event-logs" element={<EventLogPage />} />

        {/* Accountant journal page: list + create inline */}
        <Route path="/journal" element={<JournalEntryPage />} />

        {/* Journal entry details: used by PR links, manager, etc. */}
        <Route path="/journal/:id" element={<JournalEntryDetails />} />

        {/* Dedicated create-journal page (if you still use it) */}
        <Route path="/create-journal" element={<CreateJournalEntry />} />

        {/* Optional landing/dashboard page */}
        <Route path="/dashboard" element={<LandingDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
