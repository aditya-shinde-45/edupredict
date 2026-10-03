import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

const gradeColor: Record<string, string> = {
  'A+': 'text-green-700 bg-green-50', 'A': 'text-green-700 bg-green-50',
  'B+': 'text-green-600 bg-green-50', 'B': 'text-green-600 bg-green-50',
  'B-': 'text-amber-600 bg-amber-50', 'C': 'text-amber-700 bg-amber-50',
  'D': 'text-red-600 bg-red-50', 'F': 'text-red-700 bg-red-50',
};

function calcGrade(pct: number) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 55) return 'B-';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

export default function StudentMarks() {
  const user = getUser();
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) return;
    api.marks.list({ student_id: user.studentId }).then(data => setMarks(data.filter((m: any) => m.published))).catch(console.error).finally(() => setLoading(false));
  }, [user?.studentId]);

  return (
    <Layout role="student" breadcrumbs={['Student', 'Marks & Results']}>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Marks & Assessment Results</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Semester 5 · AY 2024–25</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
            <table>
              <thead>
                <tr><th>Subject</th><th>IA-1 /30</th><th>IA-2 /30</th><th>Assignment /25</th><th>Mid-term /50</th><th>Total /135</th><th>Grade</th></tr>
              </thead>
              <tbody>
                {marks.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-sm text-[#9CA3AF]">No published marks yet</td></tr>
                ) : marks.map(m => {
                  const total = m.ia1 + m.ia2 + m.assignment + m.midterm;
                  const pct = Math.round((total / 135) * 100);
                  const grade = calcGrade(pct);
                  return (
                    <tr key={m.id}>
                      <td>
                        <p className="font-medium text-[#374151]">{m.subject}</p>
                        <p className="text-[11px] text-[#9CA3AF] font-mono">{m.subject_code}</p>
                      </td>
                      {[{ v: m.ia1, max: 30 }, { v: m.ia2, max: 30 }, { v: m.assignment, max: 25 }, { v: m.midterm, max: 50 }].map((x, i) => (
                        <td key={i}>
                          <span className={`font-mono text-xs font-medium ${x.v / x.max < 0.4 ? 'text-red-500' : x.v / x.max < 0.6 ? 'text-amber-600' : 'text-[#374151]'}`}>
                            {x.v}/{x.max}
                          </span>
                        </td>
                      ))}
                      <td><span className="font-mono text-sm font-semibold text-[#111827]">{total}/135</span></td>
                      <td>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${gradeColor[grade] || 'text-[#374151] bg-[#F3F4F6]'}`}>{grade}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="text-xs text-[#9CA3AF] text-center">
          End-semester examination results will be published after exams conclude.
        </div>
      </div>
    </Layout>
  );
}
