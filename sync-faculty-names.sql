-- ============================================================
-- SYNC USERS TABLE NAMES TO MATCH FACULTY TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

-- Update user names to match the current faculty table names
UPDATE users SET name = 'Prof. Tejas Dhule' WHERE id = 'U002';
UPDATE users SET name = 'Prof. Sejiya Wahhande' WHERE id = 'U003';
UPDATE users SET name = 'Prof. N. Ansari' WHERE id = 'U004';
UPDATE users SET name = 'Prof. Mohammed Sajid' WHERE id = 'U005';
UPDATE users SET name = 'Prof. Buyar' WHERE id = 'U006';

-- Verify the update
SELECT id, email, name, role FROM users WHERE role = 'faculty' ORDER BY id;
