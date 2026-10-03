-- ============================================================
-- SMART ACADEMIC APP — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- USERS (auth table for login)
create table if not exists users (
  id text primary key,
  email text unique not null,
  password text not null,
  role text check (role in ('admin','faculty','student')) not null,
  name text not null,
  student_id text
);

-- DEPARTMENTS
create table if not exists departments (
  id text primary key,
  name text not null,
  code text unique not null,
  hod text,
  programs integer default 0,
  students integer default 0,
  faculty_count integer default 0
);

-- ACADEMIC YEARS
create table if not exists academic_years (
  id text primary key,
  year text not null,
  start_date date,
  end_date date,
  status text default 'Active'
);

-- SEMESTERS
create table if not exists semesters (
  id text primary key,
  academic_year_id text references academic_years(id),
  name text not null,
  start_date date,
  end_date date,
  status text default 'Upcoming',
  students integer default 0
);

-- FACULTY
create table if not exists faculty (
  id text primary key,
  name text not null,
  email text unique not null,
  dept text,
  department_id text references departments(id),
  role text default 'Faculty',
  subjects text[],
  classes text[]
);

-- STUDENTS
create table if not exists students (
  id text primary key,
  name text not null,
  roll_no text unique not null,
  email text,
  phone text,
  dob date,
  gender text,
  address text,
  dept text,
  department_id text references departments(id),
  program text,
  year text,
  semester text,
  division text,
  status text default 'Active',
  attendance numeric default 0,
  avg_marks numeric default 0,
  assignments numeric default 0,
  risk text default 'Low',
  trend text default 'Stable',
  advisor_id text references faculty(id),
  admission_year integer
);

-- SUBJECTS
create table if not exists subjects (
  id text primary key,
  code text unique not null,
  name text not null,
  dept text,
  department_id text references departments(id),
  semester text,
  credits integer default 3,
  type text default 'Core',
  faculty_id text references faculty(id)
);

-- CLASSES (a class = faculty + subject + division)
create table if not exists classes (
  id text primary key,
  name text not null,
  subject text not null,
  subject_id text references subjects(id),
  subject_code text,
  faculty_id text references faculty(id),
  dept text,
  year text,
  semester text,
  division text,
  schedule text,
  students integer default 0,
  attendance numeric default 0,
  avg_marks numeric default 0,
  at_risk integer default 0
);

-- ATTENDANCE
create table if not exists attendance (
  id text primary key,
  student_id text references students(id),
  class_id text references classes(id),
  subject text,
  subject_code text,
  date date default current_date,
  status text check (status in ('present','absent','late')) not null,
  faculty_id text references faculty(id)
);

-- MARKS
create table if not exists marks (
  id text primary key,
  student_id text references students(id),
  class_id text references classes(id),
  subject text,
  subject_code text,
  ia1 numeric default 0,
  ia2 numeric default 0,
  assignment numeric default 0,
  midterm numeric default 0,
  published boolean default false,
  faculty_id text references faculty(id)
);

-- ASSIGNMENTS
create table if not exists assignments (
  id text primary key,
  title text not null,
  subject text,
  subject_code text,
  class_id text references classes(id),
  class_name text,
  faculty_id text references faculty(id),
  due_date date,
  max_marks integer default 25,
  instructions text,
  status text default 'Open',
  submitted integer default 0,
  total integer default 0
);

-- ASSIGNMENT SUBMISSIONS
create table if not exists assignment_submissions (
  id text primary key,
  assignment_id text references assignments(id),
  student_id text references students(id),
  submitted_on date,
  status text default 'Not Submitted',
  marks integer,
  feedback text
);

-- INTERVENTIONS
create table if not exists interventions (
  id text primary key,
  student_id text references students(id),
  faculty_id text references faculty(id),
  type text,
  date date,
  follow_up_date date,
  note text,
  status text default 'Open',
  before_att numeric,
  after_att numeric,
  before_marks numeric,
  after_marks numeric
);

-- NOTIFICATIONS
create table if not exists notifications (
  id text primary key,
  user_id text,
  role text,
  type text not null,
  title text,
  message text not null,
  read boolean default false,
  priority text default 'low',
  created_at timestamptz default now()
);

-- PERFORMANCE TREND (monthly snapshots per student)
create table if not exists performance_trend (
  id text primary key,
  student_id text references students(id),
  month text not null,
  attendance numeric,
  marks numeric,
  recorded_at date default current_date
);

-- INSTITUTION TREND (monthly snapshots institution-wide)
create table if not exists institution_trend (
  id text primary key,
  month text not null,
  attendance numeric,
  marks numeric,
  academic_year text,
  recorded_at date default current_date
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Users
insert into users values
  ('U001','admin@college.edu','admin123','admin','Dr. Priya Menon',null),
  ('U002','ramesh@college.edu','faculty123','faculty','Dr. Ramesh Kumar',null),
  ('U003','lakshmi@college.edu','faculty123','faculty','Prof. Lakshmi Devi',null),
  ('U004','suresh@college.edu','faculty123','faculty','Dr. Suresh Babu',null),
  ('U005','anita@college.edu','faculty123','faculty','Prof. Anita Rao',null),
  ('U006','vijay@college.edu','faculty123','faculty','Dr. Vijay Mohan',null),
  ('U007','arjun@college.edu','student123','student','Arjun Sharma','S001'),
  ('U008','priya@college.edu','student123','student','Priya Nair','S002'),
  ('U009','karan@college.edu','student123','student','Karan Mehta','S005')
on conflict (id) do nothing;

-- Departments
insert into departments values
  ('D001','Computer Science & Engineering','CSE','Dr. Ramesh Kumar',3,240,18),
  ('D002','Electronics & Communication Engineering','ECE','Dr. Suresh Babu',2,180,14),
  ('D003','Mechanical Engineering','ME','Prof. Anita Rao',2,160,12),
  ('D004','Civil Engineering','CE','Dr. Pradeep Nair',2,120,10)
on conflict (id) do nothing;

-- Academic Years
insert into academic_years values
  ('AY001','2024-25','2024-07-15','2025-05-25','Active'),
  ('AY002','2023-24','2023-07-12','2024-05-18','Closed'),
  ('AY003','2022-23','2022-07-18','2023-05-22','Closed')
on conflict (id) do nothing;

-- Semesters
insert into semesters values
  ('SEM001','AY001','Semester 5 (Odd)','2024-07-15','2024-11-30','Ongoing',700),
  ('SEM002','AY001','Semester 6 (Even)','2025-01-06','2025-05-20','Upcoming',700),
  ('SEM003','AY002','Semester 3 (Odd)','2023-07-12','2023-11-25','Completed',680),
  ('SEM004','AY002','Semester 4 (Even)','2024-01-08','2024-05-18','Completed',680)
on conflict (id) do nothing;

-- Faculty
insert into faculty values
  ('F001','Dr. Ramesh Kumar','ramesh@college.edu','Computer Science','D001','Class Advisor',array['Data Structures','Algorithms'],array['CSE-3A','CSE-3B']),
  ('F002','Prof. Lakshmi Devi','lakshmi@college.edu','Computer Science','D001','Faculty',array['Operating Systems','Computer Networks'],array['CSE-3A']),
  ('F003','Dr. Suresh Babu','suresh@college.edu','Electronics','D002','Mentor',array['Digital Electronics','VLSI Design'],array['ECE-3A','ECE-3B']),
  ('F004','Prof. Anita Rao','anita@college.edu','Mechanical','D003','Class Advisor',array['Thermodynamics','Fluid Mechanics'],array['ME-3A']),
  ('F005','Dr. Vijay Mohan','vijay@college.edu','Computer Science','D001','Faculty',array['Database Systems','Software Engineering'],array['CSE-3B'])
on conflict (id) do nothing;

-- Students
insert into students values
  ('S001','Arjun Sharma','CSE2301','arjun@college.edu','+91 94872 31045','2004-03-14','Male','23, Nehru Street, Chennai','Computer Science','D001','B.Tech','3rd Year','Semester 5','Div A','Active',61,48,60,'High','Declining','F001',2022),
  ('S002','Priya Nair','CSE2302','priya@college.edu',null,null,'Female',null,'Computer Science','D001','B.Tech','3rd Year','Semester 5','Div A','Active',88,74,92,'Low','Stable','F001',2022),
  ('S003','Rahul Verma','CSE2303','rahul@college.edu',null,null,'Male',null,'Computer Science','D001','B.Tech','3rd Year','Semester 5','Div A','Active',72,58,75,'Medium','Stable','F001',2022),
  ('S004','Sneha Iyer','CSE2304','sneha@college.edu',null,null,'Female',null,'Computer Science','D001','B.Tech','3rd Year','Semester 5','Div A','Active',91,82,100,'Low','Improving','F001',2022),
  ('S005','Karan Mehta','CSE2305','karan@college.edu',null,null,'Male',null,'Computer Science','D001','B.Tech','3rd Year','Semester 5','Div A','Active',55,42,50,'High','Declining','F001',2022),
  ('S006','Divya Krishnan','CSE2306','divya@college.edu',null,null,'Female',null,'Computer Science','D001','B.Tech','3rd Year','Semester 5','Div B','Active',79,66,83,'Low','Stable','F001',2022),
  ('S007','Amit Patel','ECE2301','amit@college.edu',null,null,'Male',null,'Electronics','D002','B.Tech','3rd Year','Semester 5','Div A','Active',68,54,67,'Medium','Stable','F003',2022),
  ('S008','Meera Reddy','ECE2302','meera@college.edu',null,null,'Female',null,'Electronics','D002','B.Tech','3rd Year','Semester 5','Div A','Active',85,71,89,'Low','Improving','F003',2022),
  ('S009','Vikram Singh','ME2301','vikram@college.edu',null,null,'Male',null,'Mechanical','D003','B.Tech','3rd Year','Semester 5','Div A','Active',62,47,55,'High','Declining','F004',2022),
  ('S010','Anjali Das','ME2302','anjali@college.edu',null,null,'Female',null,'Mechanical','D003','B.Tech','3rd Year','Semester 5','Div A','Active',94,88,100,'Low','Improving','F004',2022)
on conflict (id) do nothing;

-- Subjects
insert into subjects values
  ('SUB001','CS301','Data Structures & Algorithms','Computer Science','D001','Semester 5',4,'Core','F001'),
  ('SUB002','CS302','Operating Systems','Computer Science','D001','Semester 5',3,'Core','F002'),
  ('SUB003','CS303','Computer Networks','Computer Science','D001','Semester 5',3,'Core','F002'),
  ('SUB004','CS304','Database Systems','Computer Science','D001','Semester 5',4,'Core','F005'),
  ('SUB005','CS305','Software Engineering','Computer Science','D001','Semester 5',3,'Elective','F005'),
  ('SUB006','EC301','Digital Electronics','Electronics','D002','Semester 5',4,'Core','F003'),
  ('SUB007','EC302','Signals & Systems','Electronics','D002','Semester 5',3,'Core','F003'),
  ('SUB008','ME301','Thermodynamics','Mechanical','D003','Semester 5',4,'Core','F004'),
  ('SUB009','ME302','Fluid Mechanics','Mechanical','D003','Semester 5',3,'Core','F004'),
  ('SUB010','CS401','Machine Learning','Computer Science','D001','Semester 7',3,'Elective','F005')
on conflict (id) do nothing;

-- Classes
insert into classes values
  ('CLS001','CSE-3A','Data Structures & Algorithms','SUB001','CS301','F001','Computer Science','3rd Year','Semester 5','Div A','Mon, Wed, Fri · 9:00 AM · LH-201',58,83,69,4),
  ('CLS002','CSE-3B','Data Structures & Algorithms','SUB001','CS301','F001','Computer Science','3rd Year','Semester 5','Div B','Tue, Thu · 10:00 AM · LH-104',56,79,65,6),
  ('CLS003','CSE-3A','Algorithms','SUB002','CS302','F001','Computer Science','3rd Year','Semester 5','Div A','Mon, Wed · 11:00 AM · LH-201',58,86,72,2),
  ('CLS004','ECE-3A','Digital Electronics','SUB006','EC301','F003','Electronics','3rd Year','Semester 5','Div A','Tue, Thu · 9:00 AM · ECE-101',54,81,65,5),
  ('CLS005','ME-3A','Thermodynamics','SUB008','ME301','F004','Mechanical','3rd Year','Semester 5','Div A','Mon, Wed · 2:00 PM · ME-201',52,79,62,6)
on conflict (id) do nothing;

-- Attendance records
insert into attendance values
  ('ATT001','S001','CLS001','Data Structures & Algorithms','CS301','2024-11-17','present','F001'),
  ('ATT002','S002','CLS001','Data Structures & Algorithms','CS301','2024-11-17','present','F001'),
  ('ATT003','S003','CLS001','Data Structures & Algorithms','CS301','2024-11-17','absent','F001'),
  ('ATT004','S004','CLS001','Data Structures & Algorithms','CS301','2024-11-17','present','F001'),
  ('ATT005','S005','CLS001','Data Structures & Algorithms','CS301','2024-11-17','late','F001'),
  ('ATT006','S001','CLS001','Data Structures & Algorithms','CS301','2024-11-15','absent','F001'),
  ('ATT007','S002','CLS001','Data Structures & Algorithms','CS301','2024-11-15','present','F001'),
  ('ATT008','S003','CLS001','Data Structures & Algorithms','CS301','2024-11-15','present','F001')
on conflict (id) do nothing;

-- Marks
insert into marks values
  ('MRK001','S001','CLS001','Data Structures & Algorithms','CS301',18,14,12,28,true,'F001'),
  ('MRK002','S002','CLS001','Data Structures & Algorithms','CS301',28,26,22,44,true,'F001'),
  ('MRK003','S003','CLS001','Data Structures & Algorithms','CS301',22,20,18,36,true,'F001'),
  ('MRK004','S004','CLS001','Data Structures & Algorithms','CS301',30,29,25,48,true,'F001'),
  ('MRK005','S005','CLS001','Data Structures & Algorithms','CS301',15,12,10,24,true,'F001'),
  ('MRK006','S006','CLS001','Data Structures & Algorithms','CS301',25,24,20,40,true,'F001'),
  ('MRK007','S001','CLS003','Operating Systems','CS302',24,22,19,38,true,'F002'),
  ('MRK008','S001','CLS001','Computer Networks','CS303',16,13,10,25,true,'F002'),
  ('MRK009','S001','CLS001','Database Systems','CS304',22,20,18,35,true,'F005'),
  ('MRK010','S001','CLS001','Software Engineering','CS305',20,18,16,32,true,'F005')
on conflict (id) do nothing;

-- Assignments
insert into assignments values
  ('ASN001','Assignment 1 — Linked Lists & Trees','Data Structures & Algorithms','CS301','CLS001','CSE-3A','F001','2024-10-15',25,null,'Graded',55,58),
  ('ASN002','Assignment 2 — Graph Traversal','Data Structures & Algorithms','CS301','CLS001','CSE-3A','F001','2024-11-01',25,null,'Graded',52,58),
  ('ASN003','Assignment 3 — Dynamic Programming','Data Structures & Algorithms','CS301','CLS001','CSE-3A','F001','2024-11-20',25,'Solve 5 DP problems covering knapsack, LCS, and matrix chain multiplication.','Open',24,58),
  ('ASN004','Assignment 1 — Sorting Algorithms','Data Structures & Algorithms','CS301','CLS002','CSE-3B','F001','2024-10-18',25,null,'Graded',54,56),
  ('ASN005','Assignment 2 — Heaps & Priority Queues','Data Structures & Algorithms','CS301','CLS002','CSE-3B','F001','2024-11-05',25,null,'Evaluating',50,56)
on conflict (id) do nothing;

-- Assignment Submissions
insert into assignment_submissions values
  ('SUB_S001_A003','ASN003','S001','2024-11-18','Submitted',null,''),
  ('SUB_S002_A003','ASN003','S002','2024-11-17','Submitted',22,'Good work on memoization.'),
  ('SUB_S003_A003','ASN003','S003','2024-11-19','Submitted',18,'Correct approach but edge-case bugs.'),
  ('SUB_S004_A003','ASN003','S004','2024-11-16','Submitted',25,'Excellent — optimal solutions.'),
  ('SUB_S005_A003','ASN003','S005',null,'Not Submitted',null,''),
  ('SUB_S001_A001','ASN001','S001','2024-10-14','Submitted',18,'Good understanding of linked lists.'),
  ('SUB_S001_A002','ASN002','S001','2024-11-01','Submitted',14,'BFS correct but DFS has stack overflow issue.')
on conflict (id) do nothing;

-- Interventions
insert into interventions values
  ('INT001','S001','F001','Counselling Session','2024-11-10','2024-12-01','Student acknowledged attendance shortage. Discussed personal difficulties. Agreed to attend remedial sessions.','Open',63,null,45,null),
  ('INT002','S005','F001','Parent Meeting','2024-11-05','2024-11-25','Met with parent to discuss declining attendance and marks. Parent agreed to enforce regular attendance.','Open',57,null,40,null),
  ('INT003','S003','F001','Remedial Class','2024-10-22','2024-11-15','Enrolled Rahul in OS remedial batch. Attended 3 of 4 sessions. Improvement noted.','Completed',68,72,52,58),
  ('INT004','S007','F003','Peer Mentoring','2024-10-15','2024-11-10','Assigned Sneha Iyer as peer mentor for ECE topics. Regular study group formed.','Completed',65,71,50,56)
on conflict (id) do nothing;

-- Notifications
insert into notifications values
  ('NOT001','F001','faculty','risk','High Risk Alert','Karan Mehta (CSE2305) has been classified as High Risk — attendance 55%, avg marks 42. Immediate intervention recommended.',false,'high','2026-10-01 08:00:00+00'),
  ('NOT002','F001','faculty','risk','Attendance Shortage','Arjun Sharma (CSE2301) has attendance below 75% in CS301 and CS303. Shortage warning triggered.',false,'high','2026-10-01 07:00:00+00'),
  ('NOT003','F001','faculty','attendance','Class Below Threshold','CSE-3B attendance for Sep 28 session (CS301) recorded at 71% — below the 75% class-level target.',false,'medium','2026-09-28 06:00:00+00'),
  ('NOT004','F001','faculty','submission','Assignment Submissions Closed','Assignment 2 (CS301 · CSE-3B) closed — 50/56 students submitted. 6 students did not submit.',true,'low','2026-09-27 10:00:00+00'),
  ('NOT005','F001','faculty','marks','Marks Publish Reminder','IA-2 marks for CS301 · CSE-3A are in draft. Please finalize and publish by Oct 5, 2026.',true,'medium','2026-09-27 09:00:00+00'),
  ('NOT006','S001','student','risk','Academic Risk Alert','You have been classified as High Risk based on your attendance (61%) and marks trend. Please contact your class advisor Dr. Ramesh Kumar immediately.',false,'high','2026-10-01 08:00:00+00'),
  ('NOT007','S001','student','attendance','Attendance Shortage — CS303','Your attendance in Computer Networks (CS303) has fallen to 56% — well below the 75% minimum.',false,'high','2026-10-01 04:00:00+00'),
  ('NOT008','S001','student','marks','IA-2 Results Published','IA-2 marks for Operating Systems (CS302) have been published. You scored 22/30.',true,'low','2026-09-27 10:00:00+00'),
  ('NOT009','S001','student','assignment','Assignment Due Soon','Assignment 3 — Dynamic Programming (CS301) is due in 3 days on Oct 5, 2026.',true,'medium','2026-09-26 10:00:00+00')
on conflict (id) do nothing;

-- Performance Trend (student S001)
insert into performance_trend values
  ('PT001','S001','Jul',74,58,'2024-07-31'),
  ('PT002','S001','Aug',70,54,'2024-08-31'),
  ('PT003','S001','Sep',65,51,'2024-09-30'),
  ('PT004','S001','Oct',62,49,'2024-10-31'),
  ('PT005','S001','Nov',61,48,'2024-11-17')
on conflict (id) do nothing;

-- Institution Trend
insert into institution_trend values
  ('IT001','Jul',88,72,'2024-25','2024-07-31'),
  ('IT002','Aug',87,71,'2024-25','2024-08-31'),
  ('IT003','Sep',85,70,'2024-25','2024-09-30'),
  ('IT004','Oct',83,68,'2024-25','2024-10-31'),
  ('IT005','Nov',82,67,'2024-25','2024-11-17')
on conflict (id) do nothing;
