import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import RiskBadge from '../../components/RiskBadge';
import { api, getUser } from '../../lib/api';

export default function FacultyClasses() {
  const navigate = useNavigate();
  const user = getUser();
  const [classes, setClasses] = useState<any[]>([]);
  const [activeClass, setActiveClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.classes.list({ faculty_id: user.id }).then(data => {
      setClasses(data);
      if (data.length) setActiveClass(data[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!activeClass) return;
    api.students.list({ division: activeClass.division, dept: activeClass.dept }).then(setStudents).catch(console.error);
  }, [activeClass?.id]);

  if (loading) return <Layout role="faculty" breadcrumbs={['Faculty', 'My Classes']}><div className="p-6 text-sm text-[#9CA3AF]">Loading…</div></Layout>;

  return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'My Classes']}>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">My Classes</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{classes.length} assigned classes · AY 2024–25</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {classes.map(cls => (
            <button key={cls.id} onClick={() => setActiveClass(cls)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded border text-sm transition-all ${activeClass?.id === cls.id ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white border-[#E5E7EB] text-[#374151] hover:border-[#D1D5DB]'}`}>
              <span className="font-semibold">{cls.name}</span>
              <span className={`text-xs ${activeClass?.id === cls.id ? 'text-blue-200' : 'text-[#9CA3AF]'}`}>{cls.subject_code}</span>
            </button>
          ))}
        </div>

        {activeClass && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E7EB] rounded p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm font-semibold text-[#111827]">{activeClass.subject}</p>
                <p className="text-xs text-[#9CA3AF] font-mono">{activeClass.subject_code}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Schedule</p>
                <p className="text-xs text-[#374151]">{activeClass.schedule || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F3F4F6]">
                <div><p className="text-lg font-semibold text-[#111827]">{activeClass.students}</p><p className="text-[10px] text-[#9CA3AF]">Students</p></div>
                <div><p className={`text-lg font-semibold ${activeClass.attendance < 80 ? 'text-amber-600' : 'text-green-600'}`}>{activeClass.attendance}%</p><p className="text-[10px] text-[#9CA3AF]">Attendance</p></div>
                <div><p className="text-lg font-semibold text-[#374151]">{activeClass.avg_marks}</p><p className="text-[10px] text-[#9CA3AF]">Avg Marks</p></div>
                <div><p className={`text-lg font-semibold ${activeClass.at_risk > 4 ? 'text-red-500' : 'text-amber-600'}`}>{activeClass.at_risk}</p><p className="text-[10px] text-[#9CA3AF]">At Risk</p></div>
              </div>
              <div className="pt-3 border-t border-[#F3F4F6] space-y-2">
                <button onClick={() => navigate('/faculty/attendance')} className="w-full py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">Mark Attendance</button>
                <button onClick={() => navigate('/faculty/marks')} className="w-full py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Enter Marks</button>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">Student Roster — {activeClass.name} · {activeClass.subject_code}</h2>
              </div>
              <table>
                <thead><tr><th>Student</th><th>Roll No</th><th>Attendance %</th><th>Avg Marks</th><th>Risk</th><th></th></tr></thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-xs text-[#9CA3AF]">No students found</td></tr>
                  ) : students.map(s => (
                    <tr key={s.id} className="cursor-pointer">
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EBF0F7] flex items-center justify-center text-[10px] font-semibold text-[#1E3A5F] flex-shrink-0">
                            {s.name.split(' ').map((p: string) => p[0]).join('')}
                          </div>
                          <span className="font-medium text-[#111827]">{s.name}</span>
                        </div>
                      </td>
                      <td><span className="font-mono text-[11px] text-[#6B7280]">{s.roll_no}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.attendance >= 75 ? 'bg-green-500' : s.attendance >= 65 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.attendance}%` }} />
                          </div>
                          <span className={`font-mono text-xs ${s.attendance < 65 ? 'text-red-500' : s.attendance < 75 ? 'text-amber-600' : 'text-[#374151]'}`}>{s.attendance}%</span>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs text-[#374151]">{s.avg_marks}</span></td>
                      <td><RiskBadge risk={s.risk} /></td>
                      <td><button onClick={() => navigate('/faculty/students')} className="text-xs text-[#1E3A5F] hover:underline">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
