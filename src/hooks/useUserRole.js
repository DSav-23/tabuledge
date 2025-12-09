/**
 * @fileoverview User Role Hook
 * @description Custom React hook to fetch and manage the current user's role from Firestore.
 * Reads role data based on authenticated user's email address.
 * 
 * @module hooks/useUserRole
 * @requires react
 * @requires firebase/firestore
 * @requires ../firebase
 * 
 * @author Tabuledge Development Team
 * @version 1.0.0
 */

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";

/**
 * useUserRole Hook
 * 
 * @hook
 * @description Fetches the current authenticated user's role from Firestore.
 * Looks up user document by email address to retrieve role information.
 * Returns loading state while fetching and null if user not found.
 * 
 * Role-based access control (RBAC) implementation:
 * - Admin: Full system access
 * - Manager: Reports, approvals, view-only accounts
 * - Accountant: Journal entries, ledgers, view-only accounts
 * 
 * @returns {Object} User role data object
 * @returns {string|null} return.role - User's role ("admin", "manager", "accountant", or null)
 * @returns {boolean} return.loading - Whether role is still being fetched
 * @returns {string|null} return.userEmail - Current user's email address
 * 
 * @example
 * function MyComponent() {
 *   const { role, loading, userEmail } = useUserRole();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!role) return <div>No role assigned</div>;
 *   
 *   return <div>Welcome {userEmail} (Role: {role})</div>;
 * }
 * 
 * @example
 * // Conditional rendering based on role
 * const { role } = useUserRole();
 * 
 * return (
 *   <div>
 *     {role === "admin" && <AdminPanel />}
 *     {role === "manager" && <ManagerDashboard />}
 *     {role === "accountant" && <AccountantDashboard />}
 *   </div>
 * );
 */
export default function useUserRole() {
  // ==================== State Management ====================
  
  /**
   * User role state
   * @type {[string|null, Function]}
   * @description Possible values: "admin", "manager", "accountant", or null
   */
  const [role, setRole] = useState(null);
  
  /**
   * Loading state
   * @type {[boolean, Function]}
   * @description True while fetching role from Firestore
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * User email state
   * @type {[string|null, Function]}
   * @description Email address of currently authenticated user
   */
  const [userEmail, setUserEmail] = useState(null);

  // ==================== Effects ====================
  
  /**
   * Fetches user role from Firestore on mount
   * 
   * @effect
   * @description Retrieves current user's email from Firebase Auth,
   * then queries Firestore users collection to fetch role.
   * Runs once on component mount.
   */
  useEffect(() => {
    // Get current user's email from Firebase Auth
    const email = auth?.currentUser?.email || null;
    setUserEmail(email);
    
    // If no authenticated user, set role to null
    if (!email) {
      setRole(null);
      setLoading(false);
      return;
    }

    /**
     * Fetches user role from Firestore
     * 
     * @async
     * @function fetchRole
     * @returns {Promise<void>}
     * 
     * @description Queries users collection by email, retrieves role field.
     * Sets role to null if user document not found.
     */
    const fetchRole = async () => {
      try {
        // Build query to find user by email
        // Users are stored in Firestore "users" with "email" and "role" fields
        const q = query(
          collection(db, "users"),
          where("email", "==", email),
          limit(1) // Only need one result
        );
        
        // Execute query
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          // User found - extract role
          const data = snap.docs[0].data();
          setRole(data.role || null);
        } else {
          // User not found in Firestore
          setRole(null);
        }
      } catch (e) {
        console.error("Error fetching role:", e);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []); // Empty dependency array - run once on mount

  // ==================== Return API ====================
  
  return { 
    role,      // User's role string or null
    loading,   // Boolean loading state
    userEmail  // User's email address or null
  };
}