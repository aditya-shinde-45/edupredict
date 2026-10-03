import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { api, getUser } from '../../lib/api';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.classes.list({ faculty_id: user.id }).then(setClasses).catch(console.error).finally(() => setLoading(false));
  }, [user?.id]);

  const totalStudents = classes.reduce((a, c) => a + (c.students || 0), 0);
  const avgAtt = classes.length ? Math.round(classes.reduce((a, c) => a + (c.attendance || 0), 0) / classes.length) : 0;
  const totalAtRisk = classes.reduce((a, c) => a + (c.at_risk || 0), 0);

  return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Dashboard']}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Welcome, {user?.name}</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">AY 2024–25, Semester 5</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="My Classes" value={String(classes.length)} sub="this semester" />
          <StatCard label="Total Students" value={String(totalStudents)} sub="across all classes" />
          <StatCard label="Avg Attendance" value={`${avgAtt}%`} trend={avgAtt < 80 ? 'down' : undefined} />
          <StatCard label="Students At Risk" value={String(totalAtRisk)} accent sub="need attention" />
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-semibold text-[#111827]">My Assigned Classes</h2>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
            <table>
              <thead>
                <tr><th>Class / Subject</th><th>Students</th><th>Attendance %</th><th>Avg Marks</th><th>At Risk</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-sm text-[#9CA3AF]">No classes assigned</td></tr>
                ) : classes.map((cls) => (
                  <tr key={cls.id} className="cursor-pointer">
                    <td>
                      <p className="font-medium text-[#111827]">{cls.name} · {cls.subject}</p>
                      <p className="text-[11px] text-[#9CA3AF] font-mono">{cls.subject_code} · {cls.semester}</p>
                    </td>
                    <td className="text-[#374151]">{cls.students}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cls.attendance >= 80 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${cls.attendance}%` }} />
                        </div>
                        <span className={`font-mono text-xs ${cls.attendance < 80 ? 'text-amber-600' : 'text-[#374151]'}`}>{cls.attendance}%</span>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs text-[#374151]">{cls.avg_marks}/100</span></td>
                    <td><span className={`text-xs font-medium ${cls.at_risk > 4 ? 'text-red-500' : 'text-amber-600'}`}>{cls.at_risk} students</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => navigate('/faculty/attendance')} className="text-xs text-[#1E3A5F] hover:underline">Attendance</button>
                        <button onClick={() => navigate('/faculty/marks')} className="text-xs text-[#1E3A5F] hover:underline">Marks</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
