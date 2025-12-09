# Tabuledge - Professional Accounting Software

Tabuledge is a comprehensive, full-featured accounting application built with React and Firebase. It implements double-entry bookkeeping, financial reporting, journal entry management, and role-based access control.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Tech Stack](#technologies-used)
- [Setup](#installation)
- [Running the Project](#running-the-project)

---

## Features

### Core Accounting Features
**Chart of Accounts** - Complete account management (CRUD operations)
**Double-Entry Journal** - Journal entry creation with debit/credit validation
**Ledger System** - Running balance calculation with account-specific ledgers
**Financial Reports** - Trial Balance, Income Statement, Balance Sheet, Retained Earnings
**Financial Ratios** - 5 key ratios with health score calculation
**Event Logging** - Complete audit trail with before/after snapshots

### Security & User Management
**Role-Based Access Control** - Admin, Manager, Accountant roles
**Account Lockout** - Locks after 3 failed login attempts
**Password Expiry** - 90-day password expiration policy
**Expiry Warnings** - 3-day advance warning before expiration
**User Suspension** - Temporary or permanent account suspension

### Workflow Features
**Approval Workflow** - Manager approval required for journal entries
**Real-time Notifications** - Pending entry notifications for managers
**Rejection Comments** - Required detailed rejection reasons
**Attachment Support** - PDF, DOC, XLS, image attachments for journal entries
**Email Notifications** - Firestore-based notification system

---

## Prerequisites

Before you begin, ensure you have the following installed:

**Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
**npm** (v8.0.0 or higher) - Comes with Node.js
**Git** - [Download](https://git-scm.com/)
**Firebase Account** - [Sign up](https://firebase.google.com/)  // Project already connected to firebase DB

### Verify Installation

```bash
node --version   # Should show v16.0.0 or higher
npm --version    # Should show v8.0.0 or higher
git --version    # Should show git version
```

---

## Project Structure

```
tabuledge/
├── public/
│   ├── index.html              # HTML template
│   └── favicon.ico             # App icon
│
├── src/
│   ├── assets/                 # Images, logos
│   │   └── tabuledge-logo.png
│   │
│   ├── components/             # Reusable components
│   │   ├── NavBar.js
│   │   ├── HelpModal.js
│   │   ├── Toast.js
│   │   ├── ErrorDisplay.js
│   │   ├── ManagerNotificationBanner.js
│   │   ├── RejectJournalModal.js
│   │   └── SendEmailModal.js
│   │
│   ├── pages/                  # Page components
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   ├── ForgotPasswordPage.js
│   │   ├── AdminPanel.js
│   │   ├── ChartOfAccounts.js
│   │   ├── AccountDetailsPage.js
│   │   ├── LedgerPage.js
│   │   ├── CreateJournalEntry.js
│   │   ├── JournalEntryPage.js
│   │   ├── JournalEntryDetails.js
│   │   ├── AccountantDashboard.js
│   │   ├── ManagerDashboard.js
│   │   ├── LandingDashboard.js
│   │   └── EventLogPage.js
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useUserRole.js
│   │
│   ├── utils/                  # Utility functions
│   │   ├── format.js           # Money formatting
│   │   ├── logEvent.js         # Event logging
│   │   └── uploadAttachment.js # File uploads
│   │
│   ├── firebase.js             # Firebase configuration
│   ├── App.js                  # Main app component
│   ├── index.js                # App entry point
│   └── index.css               # Global styles
│
├── .env                        # Environment variables (create this)
├── .gitignore                  # Git ignore file
├── package.json                # Dependencies and scripts
├── package-lock.json           # Dependency lock file
└── README.md                   # This file
```


---

## TechTech Stack

### Frontend
**React 18.2.0** - UI library
**React Router DOM 6.x** - Client-side routing
**React Password Checklist** - Password validation UI

### Backend & Database
**Firebase Authentication** - User authentication
**Cloud Firestore** - NoSQL database
**Firebase Storage** - File storage for attachments

### Development Tools
**Create React App** - Project setup and build tooling
**ES6+ JavaScript** - Modern JavaScript features

---


## Setup (Installation)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/tabuledge.git
cd tabuledge
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React 18.2.0
- React Router DOM 6.x
- Firebase 10.x
- React Password Checklist
- All other dependencies listed in package.json

### Step 3: Verify Installation

```bash
npm list --depth=0
```

Expected output should include:
```

├── react@18.2.0
├── react-router-dom@6.x
├── firebase@10.x
├── react-password-checklist@2.x
└── ... (other dependencies)
```

---


## Running the Project

### Development Mode

Start the development server:

```bash
npm start
```

The application will automatically open in your browser at:
```
http://localhost:3000
```

**Expected Output:**
```
Compiled successfully!

You can now view tabuledge in the browser.

  Local:            http://localhost:3000


Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

You can now login and view the project

---

**Made with joy by the Tabuledge Development Team**

**Happy Accounting! **