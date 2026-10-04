-- ============================================================
-- FIX LOGIN ISSUE: Insert users data
-- Run this in Supabase SQL Editor
-- ============================================================

-- Delete any existing conflicting data (if any)
DELETE FROM users WHERE id IN ('U001','U002','U003','U004','U005','U006','U007','U008','U009');

-- Insert users table data with CORRECTED faculty emails matching the faculty table
INSERT INTO users (id, email, password, role, name, student_id) VALUES
  ('U001', 'admin@college.edu', 'admin123', 'admin', 'Dr. S. Zade', null),
  ('U002', 'ramesh@college.edu', 'faculty123', 'faculty', 'Dr. Ramesh Kumar', null),
  ('U003', 'lakshmi@college.edu', 'faculty123', 'faculty', 'Prof. Lakshmi Devi', null),
  ('U004', 'suresh@college.edu', 'faculty123', 'faculty', 'Dr. Suresh Babu', null),
  ('U005', 'anita@college.edu', 'faculty123', 'faculty', 'Prof. Anita Rao', null),
  ('U006', 'vijay@college.edu', 'faculty123', 'faculty', 'Dr. Vijay Mohan', null),
  ('U007', 'arjun@college.edu', 'student123', 'student', 'Arjun Sharma', 'S001'),
  ('U008', 'priya@college.edu', 'student123', 'student', 'Priya Nair', 'S002'),
  ('U009', 'karan@college.edu', 'student123', 'student', 'Karan Mehta', 'S005')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  student_id = EXCLUDED.student_id;

-- Verify the insert worked
SELECT id, email, role, name FROM users ORDER BY id;
