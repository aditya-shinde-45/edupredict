-- ============================================================
-- QUICK FIX: Just insert the users data to fix login
-- Copy and paste this into Supabase SQL Editor and click RUN
-- ============================================================

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
