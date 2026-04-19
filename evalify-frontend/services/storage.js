/**
 * DEPRECATED: Legacy Local Storage Service
 * 
 * This file is being phased out in favor of the PostgreSQL backend.
 * New features should use the API controllers via Axios/Fetch.
 */

export const storage = {
  // --- DEPRECATED METHODS (Use Backend API instead) ---
  getUsers: () => [],
  getUser: () => null,
  registerUser: () => ({ success: false, error: 'Migrated to Supabase/PostgreSQL' }),
  getAssignments: () => [],
  getSubmissions: () => [],
  getIntegrityLogs: () => [],

  // Note: All logic for assignments, submissions, classes, and integrity 
  // has been moved to src/controllers/assignmentController.js and others.
};
