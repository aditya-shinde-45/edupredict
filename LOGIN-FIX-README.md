# Login Issue Fix

## Problem
Login was failing with "Invalid credentials" for faculty user `ramesh@college.edu / faculty123`

## Root Cause
The `users` table in your Supabase database is **EMPTY**. The seed data from `schema.sql` was never inserted.

The login endpoint in `Backend/src/server.js` authenticates against the `users` table:
```javascript
const { data: users, error } = await supabase
  .from('users').select('*').eq('email', email).eq('password', password);
```

When you updated faculty emails directly in the `faculty` table, it didn't affect the (empty) `users` table where authentication happens.

## Solution

### Step 1: Insert Users Data
Run `fix-users-login.sql` in your **Supabase SQL Editor**:

1. Go to Supabase Dashboard → SQL Editor
2. Open the `fix-users-login.sql` file
3. Click "Run"

This will insert all user accounts including:
- **Admin**: admin@college.edu / admin123
- **Faculty**: ramesh@college.edu, lakshmi@college.edu, etc. / faculty123
- **Students**: arjun@college.edu, priya@college.edu, etc. / student123

### Step 2: Verify Faculty Emails Match
Run `verify-faculty-emails.sql` to check that:
- Users table has correct emails
- Faculty table has matching emails

**IMPORTANT**: The emails in both tables MUST match, because:
- `users` table → used for **login authentication**
- `faculty` table → used for **class assignments and relationships**
- The `/api/classes` endpoint links them by email

### Step 3: Test Login
After inserting users data, try logging in again with:
```
Email: ramesh@college.edu
Password: faculty123
Role: faculty
```

### Step 4: Verify Faculty Dashboard Shows Classes
After successful login, the faculty dashboard should show:
- Classes assigned to faculty member
- Students in those classes
- Attendance and marks entry options

## Why Admin Login Still Worked
The admin credentials worked because they're hardcoded as a fallback in `Backend/.env`:
```
ADMIN_EMAIL=admin@college.demo
ADMIN_PASSWORD=Admin@SAA2026!
```

## Technical Details

### Login Flow
1. User submits email/password/role
2. Backend queries `users` table for matching record
3. If no match → Falls back to env admin credentials
4. If still no match → Returns "Invalid credentials"

### Faculty Dashboard Flow
1. Faculty logs in with user ID (e.g., U002)
2. Dashboard requests `/api/classes?faculty_id=U002`
3. Backend detects "U" prefix → looks up user email
4. Finds faculty record by email
5. Returns classes for that faculty member

### The Email Update Confusion
When you ran:
```sql
UPDATE faculty SET email = 'ramesh@college.edu' WHERE id = 'F001';
```

This only updated the `faculty` table, NOT the `users` table. Login checks `users` table first.

## Files Created
- `fix-users-login.sql` - Inserts all user accounts
- `verify-faculty-emails.sql` - Checks email consistency
- `LOGIN-FIX-README.md` - This documentation

## Next Steps
1. Run `fix-users-login.sql` in Supabase
2. Test faculty login
3. Verify dashboard shows classes
4. If dashboard still empty, run `verify-faculty-emails.sql` to debug
