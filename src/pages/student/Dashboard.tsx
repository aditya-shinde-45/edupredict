import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import RiskBadge from '../../components/RiskBadge';
import { api, getUser } from '../../lib/api';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) return;
    Promise.all([
      api.students.get(user.studentId),
      api.attendance.list({ student_id: user.studentId }),
      api.submissions.list({ student_id: user.studentId }),
      api.notifications.list({ user_id: user.id }),
    ]).then(([s, att, subs, notifs]) => {
      setStudent(s);
      setAttendance(att);
      // get pending assignments from submissions
      setAssignments(subs.filter((x: any) => x.status === 'Not Submitted' || x.status === 'Pending'));
      setNotifications(notifs.slice(0, 3));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.studentId]);

  // Compute subject-wise attendance
  const subjectMap: Record<string, { subject: string; subject_code: string; total: number; present: number }> = {};
  attendance.forEach((r: any) => {
    if (!subjectMap[r.subject_code]) subjectMap[r.subject_code] = { subject: r.subject, subject_code: r.subject_code, total: 0, present: 0 };
    subjectMap[r.subject_code].total++;
    if (r.status === 'present') subjectMap[r.subject_code].present++;
  });
  const subjectList = Object.values(subjectMap).map(s => ({ ...s, pct: s.total ? Math.round((s.present / s.total) * 100) : 0 }));

  if (loading) return <Layout role="student" breadcrumbs={['Student', 'Dashboard']}><div className="p-6 text-sm text-[#9CA3AF]">Loading…</div></Layout>;

  return (
    <Layout role="student" breadcrumbs={['Student', 'Dashboard']}>
      <div className="p-6 space-y-5">
        {student?.risk === 'High' && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded">
            <span className="text-red-500 text-sm leading-none mt-0.5 flex-shrink-0">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Academic Alert — Immediate Action Required</p>
              <p className="text-xs text-red-700 mt-0.5">You are currently classified as <strong>High Risk</strong>. Please contact your class advisor immediately.</p>
            </div>
            <button onClick={() => navigate('/student/risk')} className="px-2.5 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0">View Details</button>
          </div>
        )}

        <div>
          <h1 className="text-lg font-semibold text-[#111827]">My Academic Summary</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{student?.name} · {student?.roll_no} · {student?.division} · AY 2024–25</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Overall Attendance</p>
            <p className={`text-2xl font-semibold ${student?.attendance < 75 ? 'text-red-500' : 'text-green-600'}`}>{student?.attendance}%</p>
            <p className={`text-xs mt-1 ${student?.attendance < 75 ? 'text-red-400' : 'text-[#9CA3AF]'}`}>{student?.attendance < 75 ? '↓ Below 75% threshold' : '✓ Above threshold'}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Average Marks</p>
            <p className={`text-2xl font-semibold ${student?.avg_marks < 50 ? 'text-red-500' : 'text-amber-600'}`}>{student?.avg_marks}/100</p>
            <p className="text-xs text-[#9CA3AF] mt-1">{student?.trend} trend</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Assignments</p>
            <p className="text-2xl font-semibold text-[#374151]">{student?.assignments}%</p>
            <p className="text-xs text-amber-500 mt-1">{assignments.length} pending</p>
          </div>
          <div className="bg-white border border-[#1E3A5F]/30 rounded p-4">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Risk Status</p>
            <div className="mt-1.5">{student && <RiskBadge risk={student.risk} size="md" />}</div>
            <p className="text-xs text-[#9CA3AF] mt-1.5">Auto-classified</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#111827]">Attendance by Subject</h2>
              <button onClick={() => navigate('/student/attendance')} className="text-xs text-[#1E3A5F] hover:underline">View all →</button>
            </div>
            <div className="divide-y divide-[#F3F4F6]">
              {subjectList.length === 0 ? (
                <p className="px-4 py-6 text-xs text-[#9CA3AF] text-center">No attendance data yet</p>
              ) : subjectList.map(s => {
                const status = s.pct < 65 ? 'Shortage' : s.pct < 75 ? 'Warning' : 'Safe';
                return (
                  <div key={s.subject_code} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#374151] truncate">{s.subject}</p>
                      <p className="text-[10px] text-[#9CA3AF] font-mono">{s.subject_code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.pct < 65 ? 'bg-red-500' : s.pct < 75 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${s.pct}%` }} />
                      </div>
                      <span className={`font-mono text-xs w-8 text-right ${s.pct < 65 ? 'text-red-500' : s.pct < 75 ? 'text-amber-600' : 'text-green-600'}`}>{s.pct}%</span>
                      <span className={`text-[10px] w-14 ${status === 'Shortage' ? 'text-red-500' : status === 'Warning' ? 'text-amber-600' : 'text-green-600'}`}>{status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">Pending Assignments</h2>
                <button onClick={() => navigate('/student/assignments')} className="text-xs text-[#1E3A5F] hover:underline">View all →</button>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {assignments.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-[#9CA3AF] text-center">No pending assignments</p>
                ) : assignments.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#374151] truncate">{a.assignment_id}</p>
                      <p className="text-[10px] text-[#9CA3AF]">Not submitted</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">Recent Notifications</h2>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {notifications.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-[#9CA3AF] text-center">No notifications</p>
                ) : notifications.map((n: any) => (
                  <div key={n.id} className="px-4 py-2.5 hover:bg-[#F9FAFB]">
                    <p className="text-xs text-[#374151] leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
