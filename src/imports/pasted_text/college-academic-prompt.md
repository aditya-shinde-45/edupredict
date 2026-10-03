# MASTER FIGMA DESIGN PROMPT
## College Academic Management, Student Performance Monitoring & Early-Warning System

---

## 1. PROJECT CONTEXT (give this to the tool first)

Design a complete UI/UX system for a **College Academic Management, Student Performance Monitoring, and Early-Warning Platform** with three role-based panels: **Admin, Faculty, Student**. The platform manages the full academic lifecycle — onboarding, academic structure setup, faculty-student assignment, daily attendance, assignments/assessments, marks entry, performance analysis, a rule-based (non-AI) risk classification of students (Low/Medium/High Risk), faculty interventions, notifications, and reporting.

This is a **serious, institutional, data-heavy product** — think a hospital dashboard or a banking back-office tool, not a consumer app. It should feel trustworthy, dense-but-organized, and built for daily repeated use by non-technical college staff and students.

---

## 2. CRITICAL DESIGN DIRECTION — DO NOT MAKE IT LOOK "AI-GENERATED"

Avoid the default look every AI design tool produces. Specifically avoid:
- Purple/indigo gradient backgrounds, glassmorphism, soft blurred blobs
- Generic rounded-everything cards floating on plain white with huge drop shadows
- Overused Inter/Poppins + emoji icons + pastel gradient badges
- Centered hero sections with oversized headings on a dashboard (this is a working tool, not a landing page)
- Excessive whitespace that wastes space on data-dense screens
- Illustration-style empty states (generic humans/undraw-style graphics)
- Symmetrical, template-perfect grids with no visual hierarchy variation

Instead, design like a **real enterprise product** (reference feel: Linear, Notion's table views, Stripe Dashboard, Airtable, a well-designed ERP/SIS like PowerSchool or Frappe/ERPNext) — dense information tables, clear left-nav + top-bar structure, real data hierarchy, functional micro-interactions, and restrained, purposeful color used only for status/meaning (risk levels, attendance %, pass/fail) — not decoration.

---

## 3. THEME & VISUAL SYSTEM

- **Light theme only. No dark mode screens.**
- Background: off-white / very light neutral gray (not pure white) — e.g. `#F7F8FA` for canvas, `#FFFFFF` for cards/surfaces.
- Primary brand color: a single confident color (deep blue, teal, or indigo — pick ONE, e.g. `#1E3A5F` or `#0F6B5C`) used sparingly for primary actions, active nav states, and key links only.
- Status colors (reserved ONLY for risk/attendance/marks meaning, never decorative):
  - Low Risk / Good: green
  - Medium Risk / Warning: amber/orange
  - High Risk / Critical: red
  - Neutral/Info: slate gray
- Typography: one clean, functional grotesque/sans font (e.g. Inter, IBM Plex Sans, or Söhne) — but set with disciplined type scale (12/14/16/20/24/32px), not oversized display text on data screens.
- Borders over shadows: prefer 1px hairline borders (`#E5E7EB`) and subtle elevation; avoid heavy drop shadows everywhere.
- Iconography: consistent single-weight line icon set (e.g. Lucide/Phosphor), no emoji, no mixed icon styles.
- Data tables are a first-class citizen: sortable columns, sticky headers, row hover states, inline status badges, pagination — this product lives in tables and dashboards, not cards.
- Corner radius: small and consistent (4–8px), not the default large "AI" rounded-everything look.

---

## 4. GLOBAL STRUCTURE (applies to all 3 panels)

- **Persistent left sidebar navigation** (collapsible), grouped by section, with the role name and institution/college identity at the top.
- **Top bar**: search, notification bell (with unread badge), profile/avatar menu.
- **Breadcrumbs** on nested pages (e.g. Admin > Departments > CSE > Divisions > Div A).
- Consistent **page header pattern**: page title + short description + primary action button (top right).
- Consistent **empty states**, **loading states**, and **error/no-data states** for every data screen — design at least one example of each, not just the "happy path."
- Consistent **modal/drawer pattern** for create/edit actions (e.g. "Add Student," "Assign Faculty") vs. full-page flows for multi-step processes (e.g. onboarding).

---

## 5. ADMIN PANEL — FULL FLOW (design every screen below)

**A. Onboarding & Academic Structure Setup**
1. Admin login screen
2. Admin dashboard (KPIs: total students, total faculty, departments, overall attendance %, overall performance %, active classes, students requiring attention — shown as a stat-card row + trend chart + "students requiring attention" table below)
3. Academic Year / Semester setup screen (list + create/edit)
4. Department & Program setup (list + create/edit, hierarchy view)
5. Branch / Year / Division (Class) setup screen
6. Subject / Course setup screen (linked to department, semester)

**B. Student & Faculty Onboarding**
7. Student list screen (table: name, roll no, dept, class, status — filters, search, bulk import button)
8. Add/Edit Student flow (multi-step: personal info → academic assignment (dept/program/year/sem/class) → subject enrollment → review & save)
9. Bulk student import screen (CSV upload, mapping, validation preview)
10. Faculty list screen (table: name, department, subjects, assigned classes)
11. Add/Edit Faculty flow (personal info → department/subject assignment → class assignment → mark as Class Advisor/Mentor toggle)

**C. Assignment & Mapping**
12. Faculty–Subject–Class assignment screen (matrix/table view: assign which faculty teaches which subject to which class)
13. Class Advisor / Mentor assignment screen (map advisor to a division)
14. Student enrollment management screen (bulk enroll students into subjects for a semester)

**D. Monitoring & Reports (Admin)**
15. Institutional performance trends screen (charts: attendance & marks over months, filterable by department/class)
16. Department comparison screen (side-by-side department performance table + chart)
17. Students requiring attention screen (Low/Medium/High risk table across the whole college, filterable, click-through to student profile)
18. Report generation screen (select report type + filters + export/download)

---

## 6. FACULTY PANEL — FULL FLOW (design every screen below)

19. Faculty login screen
20. Faculty dashboard (assigned classes list as cards/table: class name, no. of students, attendance %, avg marks, "students requiring attention" count)
21. Class detail screen (student roster table for one class/subject, with attendance %, avg marks, risk badge per row)
22. **Attendance marking screen** — daily/subject-wise, roster list with Present/Absent/Late toggle per student, bulk mark-all, save/submit
23. Attendance correction/edit screen (view past dates, edit a specific day's record with reason/audit note)
24. Attendance history & shortage view (per class, students below threshold highlighted)
25. Assignment/Assessment creation screen (title, subject, class, due date, max marks, instructions, attachment)
26. Assignment submissions & evaluation screen (list of student submissions, grade + feedback per submission)
27. **Marks entry screen** — table of students × marks input, bulk upload option, save as draft vs. finalize/publish
28. Marks edit/update screen (post-finalization correction, with audit trail note)
29. Individual student profile screen (as seen by faculty: attendance, marks, assignment completion, subject performance, risk status + reasons, performance history graph)
30. **Risk/Early-warning detail view** — shows the explainable breakdown (e.g. "Attendance: 61%, Avg Internal Marks: 48%, Assignments Completed: 60%, Recent Performance: Declining") with recommended actions listed
31. Intervention logging screen (record counselling/remedial/meeting, notes, date, follow-up)
32. Intervention progress tracking screen (before/after comparison view for a student post-intervention)
33. Notifications screen (attendance shortage alerts, new submissions, follow-up reminders)

---

## 7. STUDENT PANEL — FULL FLOW (design every screen below)

34. Student login screen
35. Student dashboard (overall score summary, attendance %, quick stats, alerts banner if flagged)
36. Profile screen (personal + academic info: department, program, class, enrolled subjects)
37. Attendance screen (subject-wise attendance table + overall %, calendar heatmap view)
38. Assignments screen (list: pending/submitted/graded, with due dates and status badges)
39. Assignment detail/submission screen
40. Marks & assessment results screen (subject-wise marks table, internal vs. assessment breakdown)
41. **Performance & academic trend screen** — monthly trend chart, strengths/weaknesses summary, subject-wise performance comparison
42. **My Risk Status / Recommendations screen** — if flagged, shows the same transparent reasoning (attendance/marks/assignments/trend) in student-friendly language + actionable recommendations (e.g. "attend remedial session," "meet mentor")
43. Faculty feedback screen (feedback received per assignment/subject)
44. Notifications screen (marks published, assignment deadlines, attendance alerts, feedback received)

---

## 8. COMPONENT LIBRARY TO BUILD (as a shared Figma page before screens)

- Buttons (primary/secondary/ghost/destructive, all states)
- Input fields, dropdowns, date pickers, search bars
- Table component (with sortable header, row hover, status badge cell, pagination)
- Risk badge component (Low/Medium/High — color + label, small and large variants)
- Stat card component (for dashboards)
- Chart components (line trend, bar comparison, donut for attendance %)
- Notification/alert banner component
- Modal & drawer components
- Sidebar nav component (3 variants: Admin/Faculty/Student, with active/hover states)
- Empty state, loading state, error state components
- Toast/confirmation component

---

## 9. DELIVERABLE INSTRUCTIONS

- Organize as separate Figma pages: `Design System`, `Admin Panel`, `Faculty Panel`, `Student Panel`.
- Use real auto-layout and constraints so frames are responsive-ready (design at desktop width, ~1440px).
- Use realistic sample data in every screen (real-sounding names, plausible attendance %, marks, dates) — not "Lorem Ipsum" or placeholder-looking data.
- Name every frame clearly matching the flow step (e.g. `Admin / 07 - Student List`, `Faculty / 22 - Attendance Marking`).
- Show at least one full end-to-end flow with connected frames/prototype links for: (1) Admin onboarding a student, (2) Faculty marking attendance and marks, (3) Student viewing a risk flag and recommendation — so the whole "Onboarding → Structure Setup → Assignment → Attendance → Marks → Risk → Recommendation → Intervention → Reports" pipeline is visibly connected, not isolated screens.