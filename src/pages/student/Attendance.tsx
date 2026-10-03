import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

export default function StudentAttendance() {
  const user = getUser();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) return;
    api.attendance.list({ student_id: user.studentId }).then(setAttendance).catch(console.error).finally(() => setLoading(false));
  }, [user?.studentId]);

  // Subject-wise summary
  const subjectMap: Record<string, any> = {};
  attendance.forEach((r: any) => {
    if (!subjectMap[r.subject_code]) subjectMap[r.subject_code] = { subject: r.subject, subject_code: r.subject_code, total: 0, present: 0, absent: 0, late: 0 };
    subjectMap[r.subject_code].total++;
    subjectMap[r.subject_code][r.status]++;
  });
  const subjects = Object.values(subjectMap).map(s => ({
    ...s,
    pct: s.total ? Math.round((s.present / s.total) * 100) : 0,
    status: s.total ? (Math.round((s.present / s.total) * 100) < 65 ? 'Shortage' : Math.round((s.present / s.total) * 100) < 75 ? 'Warning' : 'Safe') : 'Safe',
  }));

  const overall = subjects.length
    ? Math.round(subjects.reduce((a, s) => a + s.pct, 0) / subjects.length)
    : 0;

  const shortage = subjects.filter(s => s.status === 'Shortage').length;
  const warning = subjects.filter(s => s.status === 'Warning').length;
  const safe = subjects.filter(s => s.status === 'Safe').length;

  // Calendar: last 30 days from attendance records
  const calMap: Record<string, string> = {};
  attendance.forEach((r: any) => {
    if (!calMap[r.date]) calMap[r.date] = r.status;
    else if (r.status === 'absent') calMap[r.date] = 'absent';
  });

  const colorMap: Record<string, string> = { present: 'bg-green-500', absent: 'bg-red-400', late: 'bg-amber-400' };

  return (
    <Layout role="student" breadcrumbs={['Student', 'Attendance']}>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">My Attendance</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Semester 5 · AY 2024–25</p>
        </div>

        <div className="flex items-center gap-4 bg-white border border-[#E5E7EB] rounded p-4">
          <div className="text-center">
            <p className={`text-3xl font-semibold ${overall < 65 ? 'text-red-500' : overall < 75 ? 'text-amber-600' : 'text-green-600'}`}>{overall}%</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Overall</p>
          </div>
          <div className="w-px h-12 bg-[#E5E7EB]" />
          <div className="flex-1">
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${overall < 75 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${overall}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#9CA3AF]">0%</span>
              <span className="text-[10px] text-amber-600 font-medium">75% required</span>
              <span className="text-[10px] text-[#9CA3AF]">100%</span>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div><p className="text-sm font-semibold text-red-500">{shortage}</p><p className="text-[10px] text-[#9CA3AF]">Shortage</p></div>
            <div><p className="text-sm font-semibold text-amber-600">{warning}</p><p className="text-[10px] text-[#9CA3AF]">Warning</p></div>
            <div><p className="text-sm font-semibold text-green-600">{safe}</p><p className="text-[10px] text-[#9CA3AF]">Safe</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <h2 className="text-sm font-semibold text-[#111827] mb-3">Recent Attendance</h2>
            {Object.keys(calMap).length === 0 ? (
              <p className="text-xs text-[#9CA3AF]">No records yet</p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(calMap).slice(0, 10).map(([date, status]) => (
                  <div key={date} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorMap[status] || 'bg-[#F3F4F6]'}`} />
                    <span className="text-xs text-[#374151] font-mono">{date}</span>
                    <span className={`text-[11px] capitalize ml-auto ${status === 'present' ? 'text-green-600' : status === 'absent' ? 'text-red-500' : 'text-amber-600'}`}>{status}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F3F4F6]">
              {[['bg-green-500', 'Present'], ['bg-amber-400', 'Late'], ['bg-red-400', 'Absent']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded ${c}`} />
                  <span className="text-[10px] text-[#9CA3AF]">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#111827]">Subject-wise Breakdown</h2>
            </div>
            {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
              <table>
                <thead><tr><th>Subject</th><th>Total Classes</th><th>Attended</th><th>Attendance %</th><th>Status</th></tr></thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-xs text-[#9CA3AF]">No attendance records yet</td></tr>
                  ) : subjects.map(s => (
                    <tr key={s.subject_code}>
                      <td>
                        <p className="font-medium text-[#374151]">{s.subject}</p>
                        <p className="text-[11px] text-[#9CA3AF] font-mono">{s.subject_code}</p>
                      </td>
                      <td className="font-mono text-xs text-[#374151]">{s.total}</td>
                      <td className="font-mono text-xs text-[#374151]">{s.present}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.pct < 65 ? 'bg-red-500' : s.pct < 75 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${s.pct}%` }} />
                          </div>
                          <span className={`font-mono text-xs font-medium ${s.pct < 65 ? 'text-red-500' : s.pct < 75 ? 'text-amber-600' : 'text-green-600'}`}>{s.pct}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${s.status === 'Shortage' ? 'bg-red-50 text-red-700' : s.status === 'Warning' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
