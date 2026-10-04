# Email Change Behavior - Tables & Columns

## What Happens When You Change Email

### Before (Old Behavior)
| Action | Tables Updated | Problem |
|--------|---------------|---------|
| Edit Faculty Email | `faculty.email` only | Login fails, classes don't show |
| Edit Student Email | `students.email` only | Login fails |

### After (New Behavior - FIXED)
| Action | Tables Updated | Result |
|--------|---------------|--------|
| Edit Faculty Email | `faculty.email` + `users.email` | ✅ Login works, classes show |
| Edit Student Email | `students.email` + `users.email` | ✅ Login works |
| Edit Faculty Name | `faculty.name` + `users.name` | ✅ Name synced everywhere |
| Edit Student Name | `students.name` + `users.name` | ✅ Name synced everywhere |

## Database Tables Involved

### 1. `users` Table
- **Purpose**: Authentication (login)
- **Columns**: `id`, `email`, `password`, `role`, `name`, `student_id`
- **Used for**: Login validation, JWT token creation

### 2. `faculty` Table
- **Purpose**: Faculty information & relationships
- **Columns**: `id`, `name`, `email`, `dept`, `role`, `subjects`, `classes`
- **Used for**: Class assignments, interventions, display

### 3. `students` Table
- **Purpose**: Student information & academic data
- **Columns**: `id`, `name`, `email`, `roll_no`, `dept`, `attendance`, `avg_marks`, etc.
- **Used for**: Academic tracking, risk calculation, display

## How Auto-Sync Works

### Faculty Edit Example
```javascript
// User edits faculty email: ramesh@college.edu → ramesh.new@college.edu

// Step 1: Update faculty table
UPDATE faculty SET email = 'ramesh.new@college.edu' WHERE id = 'F001';

// Step 2: Auto-sync to users table
UPDATE users 
SET email = 'ramesh.new@college.edu' 
WHERE email = 'ramesh@college.edu' AND role = 'faculty';
```

### Student Edit Example
```javascript
// User edits student email: arjun@college.edu → arjun.new@college.edu

// Step 1: Update students table
UPDATE students SET email = 'arjun.new@college.edu' WHERE id = 'S001';

// Step 2: Auto-sync to users table
UPDATE users 
SET email = 'arjun.new@college.edu' 
WHERE email = 'arjun@college.edu' AND role = 'student';
```

## Backend Implementation

### Faculty Update Endpoint (`PATCH /api/faculty/:id`)
1. Gets current faculty record (for old email)
2. Updates `faculty` table with new data
3. If email changed → updates `users` table where old email + role='faculty'
4. If name changed → updates `users` table where email + role='faculty'

### Student Update Endpoint (`PATCH /api/students/:id`)
1. Gets current student record (for old email)
2. Updates `students` table with new data
3. Calculates risk/trend if needed
4. If email changed → updates `users` table where old email + role='student'
5. If name changed → updates `users` table where email + role='student'
6. Creates notifications if risk changed

## Why This Matters

### Without Sync (Old Behavior)
```
Faculty edits email in admin panel
  → faculty table updates ✅
  → users table stays old ❌
  → Login fails (uses users table) ❌
  → Classes don't load (email mismatch) ❌
```

### With Sync (New Behavior)
```
Faculty edits email in admin panel
  → faculty table updates ✅
  → users table auto-updates ✅
  → Login works ✅
  → Classes load properly ✅
```

## Testing

To test the sync:

1. **Edit Faculty Email**:
   - Go to Admin → Faculty
   - Click Edit on any faculty
   - Change email and save
   - Try logging in with new email → should work
   - Check classes appear on dashboard → should work

2. **Edit Student Email**:
   - Go to Admin → Students
   - Click Edit on any student
   - Change email and save
   - Try logging in with new email → should work

3. **Verify in Database**:
   ```sql
   -- Check both tables have same email
   SELECT f.email as faculty_email, u.email as user_email
   FROM faculty f
   LEFT JOIN users u ON u.email = f.email AND u.role = 'faculty'
   WHERE f.id = 'F001';
   ```

## Important Notes

- ✅ Email changes sync automatically between tables
- ✅ Name changes sync automatically between tables
- ✅ Password changes happen through "Reset Password" button (faculty only)
- ✅ Role matching ensures we update correct user record
- ⚠️ If multiple users have same email (shouldn't happen), only matching role updates
