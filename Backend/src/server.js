import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

const app = express();
const port = Number(process.env.PORT || 5005);
const jwtSecret = process.env.JWT_SECRET || 'smart-academic-development-secret';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

// ── Auth middleware ──────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try { req.user = jwt.verify(token, jwtSecret); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Login ────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    const configuredAdmin = process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && {
      id: 'U-ADMIN',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      name: 'Administrator',
    };
    const { data: users, error } = await supabase
      .from('users').select('*').eq('email', email).eq('password', password);
    if (error) throw error;
    const user = users?.[0] || (configuredAdmin?.email === email && configuredAdmin.password === password ? configuredAdmin : null);
    if (!user || (role && user.role !== role))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name, studentId: user.student_id },
      jwtSecret, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, studentId: user.student_id } });
  } catch (e) { next(e); }
});

// ── Change Password ──────────────────────────────────────────
app.post('/api/auth/change-password', async (req, res, next) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    
    // Verify old password
    const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    if (user.password !== oldPassword) return res.status(401).json({ error: 'Current password is incorrect' });
    
    // Update password
    const { error: updateError } = await supabase.from('users').update({ password: newPassword }).eq('id', userId);
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) { next(e); }
});

// ── Admin Reset Password ─────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    
    // Find user by email
    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    
    // Update password (admin doesn't need old password)
    const { error: updateError } = await supabase.from('users').update({ password: newPassword }).eq('email', email);
    if (updateError) throw updateError;
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) { next(e); }
});

// ── Sync Users with Students/Faculty ─────────────────────────
app.post('/api/auth/sync-users', async (req, res, next) => {
  try {
    const report = {
      studentsProcessed: 0,
      studentsCreated: 0,
      studentsUpdated: 0,
      facultyProcessed: 0,
      facultyCreated: 0,
      facultyUpdated: 0,
      errors: []
    };

    // Sync Students
    const { data: students } = await supabase.from('students').select('id, name, email');
    if (students) {
      for (const student of students) {
        if (!student.email) continue;
        report.studentsProcessed++;
        
        try {
          // Check if user exists
          const { data: existingUser } = await supabase.from('users').select('id').eq('email', student.email).single();
          
          if (existingUser) {
            // Update existing user
            await supabase.from('users').update({
              name: student.name,
              role: 'student',
              student_id: student.id
            }).eq('email', student.email);
            report.studentsUpdated++;
          } else {
            // Create new user
            const userId = `U-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            await supabase.from('users').insert({
              id: userId,
              email: student.email,
              password: 'student123',
              role: 'student',
              name: student.name,
              student_id: student.id
            });
            report.studentsCreated++;
          }
        } catch (err) {
          report.errors.push(`Student ${student.email}: ${err.message}`);
        }
      }
    }

    // Sync Faculty
    const { data: faculty } = await supabase.from('faculty').select('id, name, email');
    if (faculty) {
      for (const fac of faculty) {
        if (!fac.email) continue;
        report.facultyProcessed++;
        
        try {
          // Check if user exists
          const { data: existingUser } = await supabase.from('users').select('id').eq('email', fac.email).single();
          
          if (existingUser) {
            // Update existing user
            await supabase.from('users').update({
              name: fac.name,
              role: 'faculty'
            }).eq('email', fac.email);
            report.facultyUpdated++;
          } else {
            // Create new user
            const userId = `U-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            await supabase.from('users').insert({
              id: userId,
              email: fac.email,
              password: 'faculty123',
              role: 'faculty',
              name: fac.name,
              student_id: null
            });
            report.facultyCreated++;
          }
        } catch (err) {
          report.errors.push(`Faculty ${fac.email}: ${err.message}`);
        }
      }
    }

    res.json({ success: true, ...report });
  } catch (e) { next(e); }
});

app.use('/api', auth);

// ── HELPER: Create Notification ──────────────────────────────
async function createNotification(userId, role, type, title, message, priority = 'medium') {
  const id = `NOT-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  await supabase.from('notifications').insert({
    id,
    user_id: userId,
    role,
    type,
    title,
    message,
    priority,
    read: false,
    created_at: new Date().toISOString()
  });
}

// ── HELPER: Calculate Risk Level ────────────────────────────
function calculateRisk(attendance, avgMarks, assignments) {
  const att = Number(attendance) || 0;
  const marks = Number(avgMarks) || 0;
  const assign = Number(assignments) || 0;
  
  // High Risk: Critical thresholds
  if (att < 65 || marks < 40) return 'High';
  
  // Medium Risk: Warning thresholds
  if (att < 75 || marks < 50 || assign < 80) return 'Medium';
  
  // Low Risk: All metrics good
  return 'Low';
}

// ── HELPER: Calculate Trend ──────────────────────────────────
function calculateTrend(student, updates) {
  // If no previous data, return Stable
  if (!student) return 'Stable';
  
  const oldAtt = Number(student.attendance) || 0;
  const oldMarks = Number(student.avg_marks) || 0;
  const newAtt = Number(updates.attendance ?? oldAtt);
  const newMarks = Number(updates.avg_marks ?? oldMarks);
  
  const attChange = newAtt - oldAtt;
  const marksChange = newMarks - oldMarks;
  const totalChange = attChange + marksChange;
  
  if (totalChange > 5) return 'Improving';
  if (totalChange < -5) return 'Declining';
  return 'Stable';
}

// ── STUDENTS ─────────────────────────────────────────────────
app.get('/api/students', async (req, res, next) => {
  try {
    let q = supabase.from('students').select('*');
    if (req.query.dept) q = q.ilike('dept', `%${req.query.dept}%`);
    if (req.query.risk) q = q.eq('risk', req.query.risk);
    if (req.query.division) q = q.eq('division', req.query.division);
    if (req.query.search) q = q.or(`name.ilike.%${req.query.search}%,roll_no.ilike.%${req.query.search}%`);
    const { data, error } = await q.order('name');
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.get('/api/students/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('students').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Student not found' });
    res.json(data);
  } catch (e) { next(e); }
});

app.post('/api/students', async (req, res, next) => {
  try {
    const id = `S-${Date.now()}`;
    const risk = calculateRisk(req.body.attendance, req.body.avg_marks, req.body.assignments);
    const trend = 'Stable'; // New students start as stable
    const { data, error } = await supabase.from('students').insert({ id, ...req.body, risk, trend }).select().single();
    if (error) throw error;
    
    // Auto-create user account for login
    if (data.email) {
      const userId = `U-${Date.now()}`;
      const defaultPassword = req.body.password || 'student123'; // Use provided password or default
      await supabase.from('users').insert({
        id: userId,
        email: data.email,
        password: defaultPassword,
        role: 'student',
        name: data.name,
        student_id: data.id
      }).catch(err => console.error('Failed to create user account:', err));
    }
    
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/students/:id', async (req, res, next) => {
  try {
    // Get current student data to calculate trend
    const { data: current } = await supabase.from('students').select('*').eq('id', req.params.id).single();
    
    // Calculate risk and trend if attendance or marks are being updated
    const updates = { ...req.body };
    let riskChanged = false;
    let newRisk = current?.risk;
    
    if ('attendance' in updates || 'avg_marks' in updates || 'assignments' in updates) {
      const att = updates.attendance ?? current?.attendance ?? 0;
      const marks = updates.avg_marks ?? current?.avg_marks ?? 0;
      const assign = updates.assignments ?? current?.assignments ?? 0;
      newRisk = calculateRisk(att, marks, assign);
      updates.risk = newRisk;
      updates.trend = calculateTrend(current, updates);
      
      // Check if risk level changed
      riskChanged = current?.risk !== newRisk;
    }
    
    const { data, error } = await supabase.from('students').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    
    // Create notifications if risk changed to High or Medium
    if (riskChanged && (newRisk === 'High' || newRisk === 'Medium')) {
      const att = data.attendance || 0;
      const marks = data.avg_marks || 0;
      
      // Notify student
      if (newRisk === 'High') {
        await createNotification(
          data.id,
          'student',
          'risk',
          'Academic Risk Alert',
          `You have been classified as High Risk based on your attendance (${att}%) and marks (${marks}/100). Please contact your class advisor immediately.`,
          'high'
        );
      }
      
      // Notify faculty advisor if exists
      if (data.advisor_id) {
        await createNotification(
          data.advisor_id,
          'faculty',
          'risk',
          `${newRisk} Risk Alert`,
          `${data.name} (${data.roll_no}) has been classified as ${newRisk} Risk — attendance ${att}%, avg marks ${marks}. ${newRisk === 'High' ? 'Immediate intervention recommended.' : 'Monitoring required.'}`,
          newRisk === 'High' ? 'high' : 'medium'
        );
      }
      
      // Check attendance shortage
      if (att < 75) {
        await createNotification(
          data.id,
          'student',
          'attendance',
          'Attendance Shortage',
          `Your attendance has fallen to ${att}% — below the 75% minimum requirement. Attend more classes to avoid academic penalties.`,
          att < 65 ? 'high' : 'medium'
        );
      }
    }
    
    res.json(data);
  } catch (e) { next(e); }
});

// Bulk recalculate risk for all students
app.post('/api/students/recalculate-risk', async (req, res, next) => {
  try {
    const { data: students, error } = await supabase.from('students').select('*');
    if (error) throw error;
    
    const updates = students.map(s => ({
      id: s.id,
      risk: calculateRisk(s.attendance, s.avg_marks, s.assignments),
      // Keep existing trend since we don't have historical data
      trend: s.trend || 'Stable'
    }));
    
    // Update all students
    await Promise.all(updates.map(u => 
      supabase.from('students').update({ risk: u.risk, trend: u.trend }).eq('id', u.id)
    ));
    
    res.json({ success: true, updated: updates.length, students: updates });
  } catch (e) { next(e); }
});

// ── FACULTY ──────────────────────────────────────────────────
app.get('/api/faculty', async (req, res, next) => {
  try {
    let q = supabase.from('faculty').select('*');
    if (req.query.dept) q = q.ilike('dept', `%${req.query.dept}%`);
    const { data, error } = await q.order('name');
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.get('/api/faculty/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('faculty').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.post('/api/faculty', async (req, res, next) => {
  try {
    const id = `F-${Date.now()}`;
    const { data, error } = await supabase.from('faculty').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    
    // Auto-create user account for login
    if (data.email) {
      const userId = `U-${Date.now()}`;
      const defaultPassword = req.body.password || 'faculty123'; // Use provided password or default
      await supabase.from('users').insert({
        id: userId,
        email: data.email,
        password: defaultPassword,
        role: 'faculty',
        name: data.name,
        student_id: null
      }).catch(err => console.error('Failed to create user account:', err));
    }
    
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/faculty/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('faculty').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── DEPARTMENTS ──────────────────────────────────────────────
app.get('/api/departments', async (req, res, next) => {
  try {
    const { data: depts, error } = await supabase.from('departments').select('*').order('name');
    if (error) throw error;
    
    // Get actual counts from students and faculty tables
    const { data: students } = await supabase.from('students').select('dept');
    const { data: faculty } = await supabase.from('faculty').select('dept');
    
    // Define explicit mapping of student dept names to department records
    const deptMapping = {
      'Computer Science & Engineering': ['computer science', 'cse', 'cs'],
      'Electrical Engineering': ['electrical', 'ee', 'electrical engineering'],
      'Electronics & Communication Engineering': ['electronics', 'ece', 'electronics & communication'],
      'Mechanical Engineering': ['mechanical', 'me', 'mechanical engineering'],
      'Civil Engineering': ['civil engineering', 'ce'],
      'Information Technology': ['information technology', 'it', 'info tech'],
    };
    
    // Calculate real counts for each department
    const enriched = depts.map(dept => {
      const deptName = dept.name;
      const aliases = deptMapping[deptName] || [dept.code?.toLowerCase(), dept.name.toLowerCase()].filter(Boolean);
      
      const studentCount = students?.filter(s => {
        if (!s.dept) return false;
        const studentDept = s.dept.toLowerCase().trim();
        return aliases.some(alias => studentDept === alias);
      }).length || 0;
      
      const facultyCount = faculty?.filter(f => {
        if (!f.dept) return false;
        const facultyDept = f.dept.toLowerCase().trim();
        return aliases.some(alias => facultyDept === alias);
      }).length || 0;
      
      return { ...dept, students: studentCount, faculty_count: facultyCount };
    });
    
    res.json(enriched);
  } catch (e) { next(e); }
});

app.post('/api/departments', async (req, res, next) => {
  try {
    const id = `D-${Date.now()}`;
    const { data, error } = await supabase.from('departments').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/departments/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('departments').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── SUBJECTS ─────────────────────────────────────────────────
app.get('/api/subjects', async (req, res, next) => {
  try {
    let q = supabase.from('subjects').select('*, faculty(name)');
    if (req.query.dept) q = q.ilike('dept', `%${req.query.dept}%`);
    if (req.query.semester) q = q.eq('semester', req.query.semester);
    if (req.query.type) q = q.eq('type', req.query.type);
    const { data, error } = await q.order('code');
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.post('/api/subjects', async (req, res, next) => {
  try {
    const id = `SUB-${Date.now()}`;
    const { data, error } = await supabase.from('subjects').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/subjects/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('subjects').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── ACADEMIC YEARS ───────────────────────────────────────────
app.get('/api/academic-years', async (req, res, next) => {
  try {
    const { data: years, error: ye } = await supabase.from('academic_years').select('*').order('year', { ascending: false });
    if (ye) throw ye;
    const { data: sems, error: se } = await supabase.from('semesters').select('*').order('start_date');
    if (se) throw se;
    
    // Get all students to count enrollment per semester
    const { data: students } = await supabase.from('students').select('semester');
    
    // Calculate real enrollment counts per semester with flexible matching
    const enrichedSems = sems.map(sem => {
      // Extract semester number from name (e.g., "Semester 5 (Odd)" -> "5", "Semester 7" -> "7")
      const semNumber = sem.name.match(/Semester\s+(\d+)/i)?.[1];
      
      // Count students enrolled in this semester (flexible matching by number)
      const enrollmentCount = students?.filter(s => {
        if (!s.semester) return false;
        const studentSemNumber = s.semester.match(/Semester\s+(\d+)/i)?.[1] || s.semester.match(/^(\d+)$/)?.[1];
        return studentSemNumber === semNumber;
      })?.length || 0;
      
      return { ...sem, students: enrollmentCount };
    });
    
    // Find semesters that have students but aren't in the semesters table
    const existingSemNumbers = new Set(enrichedSems.map(s => s.name.match(/Semester\s+(\d+)/i)?.[1]).filter(Boolean));
    const studentSemNumbers = new Set();
    students?.forEach(s => {
      const semNumber = s.semester?.match(/Semester\s+(\d+)/i)?.[1] || s.semester?.match(/^(\d+)$/)?.[1];
      if (semNumber) studentSemNumbers.add(semNumber);
    });
    
    // Add missing semesters that have students
    const missingSems = Array.from(studentSemNumbers).filter(num => !existingSemNumbers.has(num)).map(num => {
      const enrollmentCount = students?.filter(s => {
        const studentSemNumber = s.semester?.match(/Semester\s+(\d+)/i)?.[1] || s.semester?.match(/^(\d+)$/)?.[1];
        return studentSemNumber === num;
      })?.length || 0;
      
      return {
        id: `SEM-AUTO-${num}`,
        academic_year_id: years[0]?.id || 'AY001', // Assign to current academic year
        name: `Semester ${num}`,
        start_date: null,
        end_date: null,
        status: 'Ongoing',
        students: enrollmentCount
      };
    });
    
    const allSems = [...enrichedSems, ...missingSems].sort((a, b) => {
      const aNum = parseInt(a.name.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.name.match(/\d+/)?.[0] || '0');
      return aNum - bNum;
    });
    
    const result = years.map(y => ({ ...y, semesters: allSems.filter(s => s.academic_year_id === y.id) }));
    res.json(result);
  } catch (e) { next(e); }
});

app.post('/api/academic-years', async (req, res, next) => {
  try {
    const id = `AY-${Date.now()}`;
    const { data, error } = await supabase.from('academic_years').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.post('/api/semesters', async (req, res, next) => {
  try {
    const id = `SEM-${Date.now()}`;
    const { data, error } = await supabase.from('semesters').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/semesters/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('semesters').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── CLASSES ──────────────────────────────────────────────────
app.get('/api/classes', async (req, res, next) => {
  try {
    let q = supabase.from('classes').select('*, faculty(name,email)');
    
    // If faculty_id is provided, check if it's a user ID (starts with U)
    // and look up the actual faculty ID by email
    if (req.query.faculty_id) {
      const userId = req.query.faculty_id;
      
      // If it's a user ID (U-xxx), look up the faculty record by email
      if (userId.startsWith('U')) {
        const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
        if (user?.email) {
          const { data: facultyRecord } = await supabase.from('faculty').select('id').eq('email', user.email).single();
          if (facultyRecord) {
            q = q.eq('faculty_id', facultyRecord.id);
          } else {
            // No faculty record found, return empty
            return res.json([]);
          }
        } else {
          return res.json([]);
        }
      } else {
        // Direct faculty ID
        q = q.eq('faculty_id', req.query.faculty_id);
      }
    }
    
    if (req.query.dept) q = q.ilike('dept', `%${req.query.dept}%`);
    const { data, error } = await q.order('name');
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.post('/api/classes', async (req, res, next) => {
  try {
    const id = `CLS-${Date.now()}`;
    const { data, error } = await supabase.from('classes').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/classes/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('classes').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── ATTENDANCE ───────────────────────────────────────────────
app.get('/api/attendance', async (req, res, next) => {
  try {
    let q = supabase.from('attendance').select('*, students(name,roll_no)');
    if (req.query.student_id) q = q.eq('student_id', req.query.student_id);
    if (req.query.class_id) q = q.eq('class_id', req.query.class_id);
    if (req.query.subject_code) q = q.eq('subject_code', req.query.subject_code);
    if (req.query.date) q = q.eq('date', req.query.date);
    if (req.query.faculty_id) q = q.eq('faculty_id', req.query.faculty_id);
    const { data, error } = await q.order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Bulk attendance submit
app.post('/api/attendance/bulk', async (req, res, next) => {
  try {
    const records = req.body.map(r => ({ id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, ...r }));
    const { data, error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,subject_code,date' }).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.post('/api/attendance', async (req, res, next) => {
  try {
    const id = `ATT-${Date.now()}`;
    const { data, error } = await supabase.from('attendance').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/attendance/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('attendance').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── MARKS ────────────────────────────────────────────────────
app.get('/api/marks', async (req, res, next) => {
  try {
    let q = supabase.from('marks').select('*, students(name,roll_no)');
    if (req.query.student_id) q = q.eq('student_id', req.query.student_id);
    if (req.query.class_id) q = q.eq('class_id', req.query.class_id);
    if (req.query.subject_code) q = q.eq('subject_code', req.query.subject_code);
    if (req.query.faculty_id) q = q.eq('faculty_id', req.query.faculty_id);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Bulk marks upsert
app.post('/api/marks/bulk', async (req, res, next) => {
  try {
    const records = req.body.map(r => ({ id: r.id || `MRK-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, ...r }));
    const { data, error } = await supabase.from('marks').upsert(records, { onConflict: 'student_id,subject_code' }).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.post('/api/marks', async (req, res, next) => {
  try {
    const id = `MRK-${Date.now()}`;
    const { data, error } = await supabase.from('marks').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/marks/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('marks').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── ASSIGNMENTS ──────────────────────────────────────────────
app.get('/api/assignments', async (req, res, next) => {
  try {
    let q = supabase.from('assignments').select('*');
    
    // If faculty_id is provided, check if it's a user ID and convert to faculty ID
    if (req.query.faculty_id) {
      const userId = req.query.faculty_id;
      
      if (userId.startsWith('U')) {
        const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
        if (user?.email) {
          const { data: facultyRecord } = await supabase.from('faculty').select('id').eq('email', user.email).single();
          if (facultyRecord) {
            q = q.eq('faculty_id', facultyRecord.id);
          } else {
            return res.json([]);
          }
        } else {
          return res.json([]);
        }
      } else {
        q = q.eq('faculty_id', userId);
      }
    }
    
    if (req.query.class_id) q = q.eq('class_id', req.query.class_id);
    if (req.query.student_id) {
      // get assignments for student's class
      const { data: subs } = await supabase.from('assignment_submissions').select('assignment_id').eq('student_id', req.query.student_id);
      const ids = subs?.map(s => s.assignment_id) || [];
      if (ids.length) q = q.in('id', ids);
      else return res.json([]);
    }
    const { data, error } = await q.order('due_date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.post('/api/assignments', async (req, res, next) => {
  try {
    const id = `ASN-${Date.now()}`;
    let facultyId = req.body.faculty_id;
    
    // If faculty_id is a user ID (starts with U), look up the actual faculty ID by email
    if (facultyId && facultyId.startsWith('U')) {
      const { data: user } = await supabase.from('users').select('email').eq('id', facultyId).single();
      if (user?.email) {
        const { data: facultyRecord } = await supabase.from('faculty').select('id').eq('email', user.email).single();
        if (facultyRecord) {
          facultyId = facultyRecord.id;
        }
      }
    }
    
    const { data, error } = await supabase.from('assignments').insert({ id, ...req.body, faculty_id: facultyId }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/assignments/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('assignments').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── ASSIGNMENT SUBMISSIONS ───────────────────────────────────
app.get('/api/assignment-submissions', async (req, res, next) => {
  try {
    let q = supabase.from('assignment_submissions').select('*, students(name,roll_no)');
    if (req.query.assignment_id) q = q.eq('assignment_id', req.query.assignment_id);
    if (req.query.student_id) q = q.eq('student_id', req.query.student_id);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.patch('/api/assignment-submissions/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('assignment_submissions').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── INTERVENTIONS ────────────────────────────────────────────
app.get('/api/interventions', async (req, res, next) => {
  try {
    let q = supabase.from('interventions').select('*, students(name,roll_no,risk)');
    if (req.query.faculty_id) q = q.eq('faculty_id', req.query.faculty_id);
    if (req.query.student_id) q = q.eq('student_id', req.query.student_id);
    if (req.query.status) q = q.eq('status', req.query.status);
    const { data, error } = await q.order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.post('/api/interventions', async (req, res, next) => {
  try {
    const id = `INT-${Date.now()}`;
    const { data, error } = await supabase.from('interventions').insert({ id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.patch('/api/interventions/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('interventions').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── NOTIFICATIONS ────────────────────────────────────────────
app.get('/api/notifications', async (req, res, next) => {
  try {
    let q = supabase.from('notifications').select('*');
    if (req.query.user_id) q = q.eq('user_id', req.query.user_id);
    if (req.query.role) q = q.eq('role', req.query.role);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

app.patch('/api/notifications/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('notifications').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Mark all read for a user
app.patch('/api/notifications/mark-all-read', async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user_id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── PERFORMANCE TREND ────────────────────────────────────────
app.get('/api/performance-trend', async (req, res, next) => {
  try {
    let q = supabase.from('performance_trend').select('*');
    if (req.query.student_id) q = q.eq('student_id', req.query.student_id);
    const { data, error } = await q.order('recorded_at');
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── INSTITUTION TREND ────────────────────────────────────────
app.get('/api/institution-trend', async (req, res, next) => {
  try {
    let q = supabase.from('institution_trend').select('*');
    if (req.query.academic_year) q = q.eq('academic_year', req.query.academic_year);
    const { data, error } = await q.order('recorded_at');
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// ── DASHBOARD ────────────────────────────────────────────────
app.get('/api/dashboard/:role', async (req, res, next) => {
  try {
    const [
      { data: students },
      { data: notifications },
      { data: assignments },
      { data: faculty },
      { data: trend }
    ] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('notifications').select('*').eq('read', false),
      supabase.from('assignments').select('*'),
      supabase.from('faculty').select('*'),
      supabase.from('institution_trend').select('*').order('recorded_at'),
    ]);

    const deptStats = ['Computer Science','Electronics','Mechanical','Civil'].map(dept => {
      const ds = students?.filter(s => s.dept === dept) || [];
      return {
        dept: dept.split(' ')[0].slice(0,3).toUpperCase(),
        students: ds.length,
        att: ds.length ? Math.round(ds.reduce((a,s) => a + s.attendance, 0) / ds.length) : 0,
        marks: ds.length ? Math.round(ds.reduce((a,s) => a + s.avg_marks, 0) / ds.length) : 0,
        highRisk: ds.filter(s => s.risk === 'High').length,
        medRisk: ds.filter(s => s.risk === 'Medium').length,
      };
    });

    res.json({
      role: req.params.role,
      stats: {
        students: students?.length || 0,
        atRisk: students?.filter(s => s.risk === 'High').length || 0,
        notifications: notifications?.length || 0,
        assignments: assignments?.length || 0,
        faculty: faculty?.length || 0,
      },
      students: students || [],
      notifications: notifications || [],
      assignments: assignments || [],
      deptStats,
      institutionTrend: trend || [],
    });
  } catch (e) { next(e); }
});

// ── STUDENT RISK DETAIL ──────────────────────────────────────
app.get('/api/students/:id/risk', async (req, res, next) => {
  try {
    const { data: student, error: se } = await supabase.from('students').select('*').eq('id', req.params.id).single();
    if (se) throw se;
    const { data: subjectAtt } = await supabase.from('attendance').select('subject_code,status').eq('student_id', req.params.id);
    const { data: marksData } = await supabase.from('marks').select('*').eq('student_id', req.params.id);
    const { data: interventions } = await supabase.from('interventions').select('*').eq('student_id', req.params.id).order('date', { ascending: false });

    res.json({ student, subjectAttendance: subjectAtt || [], marks: marksData || [], interventions: interventions || [] });
  } catch (e) { next(e); }
});

// ── STUDENT PERFORMANCE ──────────────────────────────────────
app.get('/api/students/:id/performance', async (req, res, next) => {
  try {
    const { data: trend } = await supabase.from('performance_trend').select('*').eq('student_id', req.params.id).order('recorded_at');
    const { data: marks } = await supabase.from('marks').select('*').eq('student_id', req.params.id).eq('published', true);
    res.json({ trend: trend || [], marks: marks || [] });
  } catch (e) { next(e); }
});

// ── REPORTS ──────────────────────────────────────────────────
app.get('/api/reports', async (req, res, next) => {
  try {
    const { type, dept, class_id, division, program, semester } = req.query;
    const { data: allStudents, error: studentError } = await supabase.from('students').select('*');
    if (studentError) throw studentError;
    let selectedClass = null;
    if (class_id && class_id !== 'All') {
      const { data: classRow, error: classError } = await supabase.from('classes').select('dept,year,division').eq('id', class_id).single();
      if (classError) throw classError;
      selectedClass = classRow;
    }
    const students = (allStudents || []).filter(student =>
      (!dept || dept === 'All' || student.dept === dept) &&
      (!division || division === 'All' || student.division === division) &&
      (!program || program === 'All' || student.program === program) &&
      (!semester || !student.semester || student.semester === semester) &&
      (!selectedClass || (student.dept === selectedClass.dept && student.year === selectedClass.year && student.division === selectedClass.division))
    );
    const studentIds = students.map(student => student.id);
    let reportData = {};

    if (type === 'att-summary') {
      let q = supabase.from('students').select('id,name,roll_no,dept,program,year,attendance,division');
      if (studentIds.length) q = q.in('id', studentIds); else return res.json({ type, data: { students: [] }, generated_at: new Date().toISOString() });
      const { data } = await q;
      reportData = { students: data };
    } else if (type === 'marks-summary') {
      let q = supabase.from('marks').select('*, students(name,roll_no,dept)').eq('published', true);
      if (studentIds.length) q = q.in('student_id', studentIds);
      if (class_id && class_id !== 'All') q = q.eq('class_id', class_id);
      const { data } = await q;
      reportData = { marks: data };
    } else if (type === 'risk-report') {
      reportData = { students: students.filter(student => ['High', 'Medium'].includes(student.risk)) };
    } else if (type === 'intervention-log') {
      let q = supabase.from('interventions').select('*, students(name,roll_no,dept,program,division)').order('date', { ascending: false });
      if (studentIds.length) q = q.in('student_id', studentIds);
      const { data } = await q;
      reportData = { interventions: data };
    } else if (type === 'faculty-report') {
      const { data } = await supabase.from('faculty').select('*');
      reportData = { faculty: data };
    } else if (type === 'dept-comparison') {
      reportData = { students: students.map(({ dept: department, attendance, avg_marks, risk }) => ({ dept: department, attendance, avg_marks, risk })) };
    }

    res.json({ type, dept, class_id, division, program, semester, data: reportData, generated_at: new Date().toISOString() });
  } catch (e) { next(e); }
});

app.get('/api/reports/download', async (req, res, next) => {
  try {
    const { type = 'att-summary', format = 'CSV', dept = 'All', class_id = 'All', division = 'All', program = 'All', semester = 'All' } = req.query;
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    let selectedClass = null;
    if (class_id !== 'All') {
      const { data: classRow, error: classError } = await supabase.from('classes').select('dept,year,division').eq('id', class_id).single();
      if (classError) throw classError;
      selectedClass = classRow;
    }
    const rows = (data || []).filter(student => (dept === 'All' || student.dept === dept) && (division === 'All' || student.division === division) && (program === 'All' || student.program === program) && (semester === 'All' || !student.semester || student.semester === semester));
    const classRows = selectedClass ? rows.filter(student => student.dept === selectedClass.dept && student.year === selectedClass.year && student.division === selectedClass.division) : rows;
    let exportRows = classRows;
    if (type === 'risk-report') exportRows = classRows.filter(row => ['High', 'Medium'].includes(row.risk));
    if (type === 'marks-summary') {
      const studentIds = classRows.map(row => row.id);
      let marksQuery = supabase.from('marks').select('*, students(name,roll_no)').eq('published', true);
      if (studentIds.length) marksQuery = marksQuery.in('student_id', studentIds);
      if (class_id !== 'All') marksQuery = marksQuery.eq('class_id', class_id);
      const { data: marks, error: marksError } = await marksQuery;
      if (marksError) throw marksError;
      exportRows = marks || [];
    }
    if (type === 'intervention-log') {
      const studentIds = classRows.map(row => row.id);
      let interventionQuery = supabase.from('interventions').select('*');
      if (studentIds.length) interventionQuery = interventionQuery.in('student_id', studentIds);
      const { data: interventions, error: interventionError } = await interventionQuery;
      if (interventionError) throw interventionError;
      exportRows = interventions || [];
    }
    if (type === 'faculty-report') {
      const { data: faculty, error: facultyError } = await supabase.from('faculty').select('*');
      if (facultyError) throw facultyError;
      exportRows = faculty || [];
    }
    const headers = [...new Set(exportRows.flatMap(row => Object.keys(row)))];
    const csv = [headers.join(','), ...exportRows.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))].join('\n');
    const safeName = `${String(type)}-report`.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    if (String(format).toUpperCase() === 'PDF') {
      const reportTitles = {
        'att-summary': 'Attendance Summary Report',
        'marks-summary': 'Marks & Assessment Report',
        'risk-report': 'At-Risk Students Report',
        'faculty-report': 'Faculty Performance Report',
        'dept-comparison': 'Department Comparison Report',
        'intervention-log': 'Intervention Log Report',
      };
      const columnSets = {
        'att-summary': [['Name', 'name'], ['Roll No', 'roll_no'], ['Department', 'dept'], ['Program', 'program'], ['Division', 'division'], ['Attendance', 'attendance']],
        'marks-summary': [['Student', 'student_name'], ['Subject', 'subject'], ['Subject Code', 'subject_code'], ['IA 1', 'ia1'], ['IA 2', 'ia2'], ['Assignment', 'assignment'], ['Midterm', 'midterm'], ['Published', 'published']],
        'risk-report': [['Name', 'name'], ['Roll No', 'roll_no'], ['Department', 'dept'], ['Program', 'program'], ['Attendance', 'attendance'], ['Avg Marks', 'avg_marks'], ['Risk', 'risk']],
        'faculty-report': [['Name', 'name'], ['Email', 'email'], ['Department', 'dept'], ['Role', 'role']],
        'dept-comparison': [['Department', 'dept'], ['Attendance', 'attendance'], ['Avg Marks', 'avg_marks'], ['Risk', 'risk']],
        'intervention-log': [['Student', 'student_id'], ['Type', 'type'], ['Date', 'date'], ['Follow-up', 'follow_up_date'], ['Status', 'status'], ['Notes', 'note']],
      };
      const columns = columnSets[type] || headers.map(header => [header, header]);
      const formatValue = (row, key) => {
        if (key === 'student_name') return row.students?.name || row.student_name || row.student_id || '';
        if (key === 'student_id' && row.students?.name) return `${row.students.name} (${row.student_id})`;
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      };
      const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
      doc.pipe(res);

      const title = reportTitles[type] || 'Academic Report';
      const drawTable = () => {
        const tableTop = doc.y;
        const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const columnWidth = tableWidth / columns.length;
        const rowHeight = 24;
        const drawRow = (values, header = false, alternate = false) => {
          if (doc.y + rowHeight > doc.page.height - 48) {
            doc.addPage();
            drawTableHeader();
          }
          const y = doc.y;
          if (header || alternate) {
            doc.save().rect(doc.page.margins.left, y, tableWidth, rowHeight).fill(header ? '#1E3A5F' : '#F3F6FA').restore();
          }
          values.forEach((value, index) => {
            const x = doc.page.margins.left + index * columnWidth;
            doc.fontSize(header ? 7.5 : 7.5).fillColor(header ? '#FFFFFF' : '#263850').text(value, x + 5, y + 7, { width: columnWidth - 10, height: rowHeight - 8, ellipsis: true });
            doc.strokeColor('#D9E0E8').lineWidth(0.4).rect(x, y, columnWidth, rowHeight).stroke();
          });
          doc.y = y + rowHeight;
        };
        const drawTableHeader = () => drawRow(columns.map(column => column[0]), true);
        drawTableHeader();
        exportRows.forEach((row, index) => drawRow(columns.map(column => formatValue(row, column[1])), false, index % 2 === 0));
      };

      doc.fillColor('#1E2D40').fontSize(19).font('Helvetica-Bold').text('Nagpur Institute of Technology', { align: 'left' });
      doc.moveDown(0.25).fillColor('#1E3A5F').fontSize(14).text(title);
      doc.moveDown(0.3).fillColor('#667085').font('Helvetica').fontSize(8.5).text(`Generated ${new Date().toLocaleString('en-IN')}`);
      doc.moveDown(0.8);
      doc.save().roundedRect(doc.page.margins.left, doc.y, doc.page.width - 84, 38, 4).fill('#F3F6FA').restore();
      doc.fillColor('#344054').fontSize(8.5).text(`Department: ${dept}    Class: ${class_id}    Program: ${program}`, 50, doc.y - 29);
      doc.text(`Division: ${division}    Semester: ${semester}    Records: ${exportRows.length}`, 50, doc.y - 15);
      doc.moveDown(1.4).fillColor('#263850');
      if (exportRows.length) drawTable();
      else doc.fontSize(10).fillColor('#667085').text('No records matched the selected filters.', { align: 'center' });
      const range = doc.bufferedPageRange();
      for (let page = range.start; page < range.start + range.count; page += 1) {
        doc.switchToPage(page);
        doc.fillColor('#98A2B3').fontSize(7).text(`Smart Academic System  |  ${title}`, 42, 780, { width: 350 });
        doc.text(`Page ${page - range.start + 1} of ${range.count}`, 420, 780, { width: 130, align: 'right' });
      }
      doc.end();
      return;
    }
    const isExcel = String(format).toUpperCase() === 'EXCEL';
    res.setHeader('Content-Type', isExcel ? 'application/vnd.ms-excel' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.${isExcel ? 'xls' : 'csv'}"`);
    res.send(csv);
  } catch (e) { next(e); }
});

// ── Error handler ────────────────────────────────────────────
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

app.listen(port, () => console.log(`Smart Academic API on port ${port}`));
