/**
 * @fileoverview Manager Notification Banner Component
 * @description Real-time notification banner for managers displaying pending journal entries
 * awaiting approval. Implements Sprint 3 Requirement #40: Manager must get notification
 * when journal entry is submitted.
 * 
 * @module components/ManagerNotificationBanner
 * @requires react
 * @requires firebase/firestore
 * @requires react-router-dom
 * @requires ../firebase
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

/**
 * ManagerNotificationBanner Component
 * 
 * @component
 * @description Sticky banner that appears for managers/admins when there are pending
 * journal entries awaiting approval. Uses real-time Firestore listener for instant updates.
 * 
 * Features:
 * - Real-time listener for pending entries
 * - Shows count of pending entries
 * - Displays latest entry details
 * - Animated appearance
 * - "Review Now" navigation button
 * - Dismissible (reappears on refresh)
 * - Pulsing notification bell icon
 * 
 * Requirement #40: Manager must get notification when journal entry is submitted
 * 
 * @param {Object} props - Component props
 * @param {string} props.userRole - Current user's role ("admin", "manager", or "accountant")
 * 
 * @returns {JSX.Element|null} Rendered notification banner or null if no pending entries
 * 
 * @example
 * <ManagerNotificationBanner userRole={role} />
 */
function ManagerNotificationBanner({ userRole }) {
  // ==================== State Management ====================
  
  /** @type {[number, Function]} Count of pending journal entries */
  const [pendingCount, setPendingCount] = useState(0);
  
  /** @type {[Object|null, Function]} Latest pending entry object */
  const [latestEntry, setLatestEntry] = useState(null);
  
  /** @type {[boolean, Function]} Whether to show the banner */
  const [show, setShow] = useState(false);
  
  const navigate = useNavigate();

  // ==================== Effects ====================
  
  /**
   * Sets up real-time listener for pending journal entries
   * 
   * @effect
   * @description Subscribes to Firestore collection for real-time updates.
   * Only activates for manager and admin roles.
   * Automatically updates count and latest entry when data changes.
   * Cleans up listener on unmount.
   */
  useEffect(() => {
    // Only show for managers and admins
    if (userRole !== "manager" && userRole !== "admin") {
      return;
    }

    // Build query for pending journal entries
    const q = query(
      collection(db, "journalEntries"),
      where("status", "==", "pending")
    );

    /**
     * Real-time snapshot listener
     * @callback onSnapshot
     * @param {QuerySnapshot} snapshot - Firestore query snapshot
     */
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.length;
      setPendingCount(count);

      if (count > 0) {
        // Get the most recent pending entry
        const entries = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        
        // Sort by createdAt descending (newest first)
        entries.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });

        setLatestEntry(entries[0]);
        setShow(true);
      } else {
        // No pending entries - hide banner
        setShow(false);
        setLatestEntry(null);
      }
    }, (error) => {
      console.error("Error listening to journal entries:", error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userRole]);

  // ==================== Early Return ====================
  
  /** If banner shouldn't show or no pending entries, render nothing */
  if (!show || pendingCount === 0) return null;

  // ==================== Render ====================
  
  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        {/* Notification Bell Icon with Pulse Animation */}
        <div style={styles.icon}>🔔</div>
        
        {/* Notification Text */}
        <div style={styles.text}>
          {/* Main Title - Shows count */}
          <div style={styles.title}>
            {pendingCount === 1 
              ? "1 Journal Entry Awaiting Approval" 
              : `${pendingCount} Journal Entries Awaiting Approval`}
          </div>
          
          {/* Subtitle - Shows latest entry details */}
          {latestEntry && (
            <div style={styles.subtitle}>
              Latest: "{latestEntry.description || "Untitled"}" by {latestEntry.createdBy || "Unknown"}
            </div>
          )}
        </div>
        
        {/* Review Now Button - Navigates to manager dashboard */}
        <button
          onClick={() => navigate("/manager")}
          style={styles.button}
        >
          Review Now
        </button>
        
        {/* Dismiss Button */}
        <button
          onClick={() => setShow(false)}
          style={styles.dismissBtn}
          title="Dismiss (will reappear on refresh)"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ==================== Styles ====================

/**
 * Component styles object
 * @constant {Object} styles
 * @description CSS-in-JS styles for notification banner.
 * Uses yellow/amber color scheme for warning-level notifications.
 */
const styles = {
  /** Banner container - sticky positioned below navbar */
  banner: {
    position: "sticky",
    top: 60, // Below navbar (navbar height is ~60px)
    zIndex: 99, // Below navbar (100) but above content
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", // Yellow gradient
    borderBottom: "2px solid #f59e0b",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    animation: "slideDown 0.3s ease-out",
  },
  
  /** Content container - centered with max width */
  content: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 20px",
    maxWidth: 1400,
    margin: "0 auto",
  },
  
  /** Notification bell icon with pulse animation */
  icon: {
    fontSize: 28,
    animation: "pulse 2s infinite",
  },
  
  /** Text container - flexible to take remaining space */
  text: {
    flex: 1,
  },
  
  /** Main title text - shows count */
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#78350f", // Dark amber text
    marginBottom: 2,
  },
  
  /** Subtitle text - shows latest entry details */
  subtitle: {
    fontSize: 13,
    color: "#92400e", // Medium amber text
  },
  
  /** Review Now action button */
  button: {
    padding: "8px 16px",
    background: "#f59e0b", // Amber background
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  
  /** Dismiss button */
  dismissBtn: {
    background: "transparent",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    padding: 8,
    color: "#92400e",
    borderRadius: 4,
  },
};

// ==================== Dynamic Styles ====================

/**
 * Injects CSS animations into document head
 * @description Adds slideDown entrance animation and pulse animation for icon.
 * Runs only in browser environment.
 */
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    /* Slide down entrance animation */
    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    /* Pulse animation for notification icon */
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }
  `;
  document.head.appendChild(style);
}

export default ManagerNotificationBanner;