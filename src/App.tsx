import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AddStudent from './pages/admin/AddStudent';
import AdminFaculty from './pages/admin/Faculty';
import AdminDepartments from './pages/admin/Departments';
import AdminSubjects from './pages/admin/Subjects';
import AcademicYears from './pages/admin/AcademicYears';
import AdminMonitoring from './pages/admin/Monitoring';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

// Faculty
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyClasses from './pages/faculty/Classes';
import FacultyAttendance from './pages/faculty/Attendance';
import FacultyMarks from './pages/faculty/Marks';
import FacultyAssignments from './pages/faculty/Assignments';
import FacultyStudentProfile from './pages/faculty/StudentProfile';
import FacultyInterventions from './pages/faculty/Interventions';
import FacultyNotifications from './pages/faculty/Notifications';
import FacultySettings from './pages/faculty/Settings';

// Student
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentMarks from './pages/student/Marks';
import StudentRiskStatus from './pages/student/RiskStatus';
import StudentPerformance from './pages/student/Performance';
import StudentAssignments from './pages/student/Assignments';
import StudentNotifications from './pages/student/Notifications';
import StudentProfile from './pages/student/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        <Route path="/admin/faculty" element={<AdminFaculty />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        <Route path="/admin/subjects" element={<AdminSubjects />} />
        <Route path="/admin/academic" element={<AcademicYears />} />
        <Route path="/admin/monitoring" element={<AdminMonitoring />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Faculty */}
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/classes" element={<FacultyClasses />} />
        <Route path="/faculty/attendance" element={<FacultyAttendance />} />
        <Route path="/faculty/marks" element={<FacultyMarks />} />
        <Route path="/faculty/assignments" element={<FacultyAssignments />} />
        <Route path="/faculty/students" element={<FacultyStudentProfile />} />
        <Route path="/faculty/interventions" element={<FacultyInterventions />} />
        <Route path="/faculty/notifications" element={<FacultyNotifications />} />
        <Route path="/faculty/settings" element={<FacultySettings />} />

        {/* Student */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/marks" element={<StudentMarks />} />
        <Route path="/student/risk" element={<StudentRiskStatus />} />
        <Route path="/student/performance" element={<StudentPerformance />} />
        <Route path="/student/assignments" element={<StudentAssignments />} />
        <Route path="/student/notifications" element={<StudentNotifications />} />
        <Route path="/student/profile" element={<StudentProfile />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
