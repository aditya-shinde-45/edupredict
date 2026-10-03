-- ============================================================
-- RESTORE ORIGINAL FACULTY NAMES FROM SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Update faculty names back to original schema values
UPDATE faculty SET name = 'Dr. Ramesh Kumar' WHERE id = 'F001';
UPDATE faculty SET name = 'Prof. Lakshmi Devi' WHERE id = 'F002';
UPDATE faculty SET name = 'Dr. Suresh Babu' WHERE id = 'F003';
UPDATE faculty SET name = 'Prof. Anita Rao' WHERE id = 'F004';
UPDATE faculty SET name = 'Dr. Vijay Mohan' WHERE id = 'F005';

-- Verify the update
SELECT id, email, name, dept FROM faculty ORDER BY id;
