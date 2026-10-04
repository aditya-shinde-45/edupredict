-- ============================================================
-- UPDATE ADMIN NAME to Dr. S. Zade
-- Run this in Supabase SQL Editor
-- ============================================================

-- Update users table
UPDATE users 
SET name = 'Dr. S. Zade' 
WHERE email = 'admin@college.edu' AND role = 'admin';

-- Verify the change
SELECT id, email, role, name FROM users WHERE role = 'admin';
