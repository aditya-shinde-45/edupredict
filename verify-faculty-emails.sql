-- ============================================================
-- VERIFY: Check faculty emails match users table
-- Run this in Supabase SQL Editor AFTER inserting users data
-- ============================================================

-- Check what's currently in faculty table
SELECT id, name, email, dept FROM faculty ORDER BY id;

-- Check what's in users table for faculty
SELECT id, email, role, name FROM users WHERE role = 'faculty' ORDER BY id;

-- IMPORTANT: Faculty table emails should match users table emails
-- The users table is used for LOGIN
-- The faculty table is used for class assignments and relationships

-- If emails don't match, the /api/classes endpoint won't work properly
-- because it looks up users by email to find faculty records
