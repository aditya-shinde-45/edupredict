import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import RiskBadge from '../../components/RiskBadge';
import { api, getUser } from '../../lib/api';

export default function FacultyStudentProfile() {
  const user = getUser();
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'intervention'>('overview');
  const [interventionForm, setInterventionForm] = useState({ type: 'Counselling Session', date: new Date().toISOString().split('T')[0], follow_up_date: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.students.list().then(data => {
      setStudents(data);
      if (data.length) setSelected(data[0]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.students.risk(selected.id).then(setRiskData).catch(console.error);
  }, [selected?.id]);

  async function logIntervention() {
    if (!user || !selected) return;
    setSaving(true);
    try {
      await api.interventions.create({ ...interventionForm, student_id: selected.id, faculty_id: user.id, status: 'Open' });
      setSaved(true);
      setInterventionForm({ type: 'Counselling Session', date: new Date().toISOString().split('T')[0], follow_up_date: '', note: '' });
      // refresh risk data
      api.students.risk(selected.id).then(setRiskData).catch(console.error);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  const subjectAtt = riskData?.subjectAttendance || [];
  const marks = riskData?.marks || [];
  const interventions = riskData?.interventions || [];

  // Compute subject-wise attendance summary
  const subjectSummary = subjectAtt.reduce((acc: any, r: any) => {
    if (!acc[r.subject_code]) acc[r.subject_code] = { subject_code: r.subject_code, subject: r.subject, total: 0, present: 0 };
    acc[r.subject_code].total++;
    if (r.status === 'present') acc[r.subject_code].present++;
    return acc;
  }, {});

  return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Student Profiles']}>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <select value={selected?.id || ''} onChange={e => setSelected(students.find(s => s.id === e.target.value))}
            className="px-3 py-1.5 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_no})</option>)}
          </select>
        </div>

        {selected && (
          <>
            <div className="flex items-start gap-4 bg-white border border-[#E5E7EB] rounded p-4">
              <div className="w-12 h-12 rounded-full bg-[#EBF0F7] flex items-center justify-center text-base font-semibold text-[#1E3A5F] flex-shrink-0">
                {selected.name.split(' ').map((p: string) => p[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-base font-semibold text-[#111827]">{selected.name}</h1>
                  <RiskBadge risk={selected.risk} size="md" />
                  <span className={`text-xs ${selected.trend === 'Declining' ? 'text-red-500' : selected.trend === 'Improving' ? 'text-green-600' : 'text-[#9CA3AF]'}`}>
                    {selected.trend === 'Declining' ? '↓' : selected.trend === 'Improving' ? '↑' : '→'} {selected.trend}
                  </span>
                </div>
                <p className="text-sm text-[#6B7280] mt-0.5">
                  <span className="font-mono">{selected.roll_no}</span> · {selected.dept} · {selected.year} · {selected.division}
                </p>
              </div>
              <div className="flex gap-3 text-center">
                <div>
                  <p className={`text-lg font-semibold ${selected.attendance < 65 ? 'text-red-500' : 'text-amber-600'}`}>{selected.attendance}%</p>
                  <p className="text-[10px] text-[#9CA3AF]">Attendance</p>
                </div>
                <div className="w-px bg-[#E5E7EB]" />
                <div>
                  <p className="text-lg font-semibold text-[#374151]">{selected.avg_marks}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Avg Marks</p>
                </div>
                <div className="w-px bg-[#E5E7EB]" />
                <div>
                  <p className="text-lg font-semibold text-[#374151]">{selected.assignments}%</p>
                  <p className="text-[10px] text-[#9CA3AF]">Assignments</p>
                </div>
              </div>
            </div>

            <div className="flex gap-0 border-b border-[#E5E7EB]">
              {(['overview', 'risk', 'intervention'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${activeTab === tab ? 'border-[#1E3A5F] text-[#1E3A5F]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}>
                  {tab === 'risk' ? 'Risk Analysis' : tab === 'intervention' ? 'Interventions' : 'Overview'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E7EB]">
                    <h2 className="text-sm font-semibold text-[#111827]">Subject-wise Attendance</h2>
                  </div>
                  <table>
                    <thead><tr><th>Subject</th><th>Attended</th><th>%</th><th>Status</th></tr></thead>
                    <tbody>
                      {Object.values(subjectSummary).length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-6 text-xs text-[#9CA3AF]">No attendance data</td></tr>
                      ) : Object.values(subjectSummary).map((s: any) => {
                        const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
                        const status = pct < 65 ? 'Shortage' : pct < 75 ? 'Warning' : 'Safe';
                        return (
                          <tr key={s.subject_code}>
                            <td>
                              <p className="text-[#374151] font-medium">{s.subject}</p>
                              <p className="text-[11px] text-[#9CA3AF] font-mono">{s.subject_code}</p>
                            </td>
                            <td className="font-mono text-xs text-[#374151]">{s.present}/{s.total}</td>
                            <td><span className={`font-mono text-xs font-medium ${pct < 65 ? 'text-red-500' : pct < 75 ? 'text-amber-600' : 'text-green-600'}`}>{pct}%</span></td>
                            <td>
                              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${status === 'Shortage' ? 'bg-red-50 text-red-700' : status === 'Warning' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E7EB]">
                    <h2 className="text-sm font-semibold text-[#111827]">Marks Summary</h2>
                  </div>
                  <table>
                    <thead><tr><th>Subject</th><th>IA-1</th><th>IA-2</th><th>Assign</th><th>Mid</th><th>Total</th></tr></thead>
                    <tbody>
                      {marks.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-6 text-xs text-[#9CA3AF]">No marks data</td></tr>
                      ) : marks.map((m: any) => {
                        const total = m.ia1 + m.ia2 + m.assignment + m.midterm;
                        return (
                          <tr key={m.id}>
                            <td className="text-xs text-[#374151]">{m.subject_code}</td>
                            <td className="font-mono text-xs text-[#374151]">{m.ia1}/30</td>
                            <td className="font-mono text-xs text-[#374151]">{m.ia2}/30</td>
                            <td className="font-mono text-xs text-[#374151]">{m.assignment}/25</td>
                            <td className="font-mono text-xs text-[#374151]">{m.midterm}/50</td>
                            <td><span className={`font-mono text-xs font-semibold ${total < 54 ? 'text-red-500' : 'text-[#374151]'}`}>{total}/135</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'risk' && (
              <div className="space-y-4">
                <div className={`border rounded p-4 ${selected.risk === 'High' ? 'bg-red-50 border-red-200' : selected.risk === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg leading-none mt-0.5 ${selected.risk === 'High' ? 'text-red-500' : selected.risk === 'Medium' ? 'text-amber-500' : 'text-green-500'}`}>⚠</span>
                    <div>
                      <h2 className={`text-sm font-semibold mb-1 ${selected.risk === 'High' ? 'text-red-800' : selected.risk === 'Medium' ? 'text-amber-800' : 'text-green-800'}`}>{selected.risk} Risk</h2>
                      <p className={`text-xs leading-relaxed ${selected.risk === 'High' ? 'text-red-700' : selected.risk === 'Medium' ? 'text-amber-700' : 'text-green-700'}`}>
                        {selected.name} is classified as {selected.risk} Risk based on attendance ({selected.attendance}%), marks ({selected.avg_marks}/100), and assignment completion ({selected.assignments}%).
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded p-4">
                  <h2 className="text-sm font-semibold text-[#111827] mb-4">Risk Factors</h2>
                  <div className="space-y-3">
                    {[
                      { factor: 'Attendance', value: `${selected.attendance}%`, threshold: '75%', score: selected.attendance, bad: selected.attendance < 75 },
                      { factor: 'Avg Marks', value: `${selected.avg_marks}/100`, threshold: '50/100', score: selected.avg_marks, bad: selected.avg_marks < 50 },
                      { factor: 'Assignment Completion', value: `${selected.assignments}%`, threshold: '80%', score: selected.assignments, bad: selected.assignments < 80 },
                    ].map(f => (
                      <div key={f.factor} className="p-3 border border-[#E5E7EB] rounded">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-[#374151]">{f.factor}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#9CA3AF]">Threshold: {f.threshold}</span>
                            <span className={`text-sm font-semibold font-mono ${f.bad ? 'text-red-500' : 'text-green-600'}`}>{f.value}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[#F3F4F6] rounded-full">
                          <div className={`h-full rounded-full ${f.bad ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${Math.min(f.score, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'intervention' && (
              <div className="space-y-4">
                <div className="bg-white border border-[#E5E7EB] rounded p-4">
                  <h2 className="text-sm font-semibold text-[#111827] mb-3">Log New Intervention</h2>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-[#374151] mb-1.5">Type</label>
                      <select value={interventionForm.type} onChange={e => setInterventionForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                        {['Counselling Session','Remedial Class','Parent Meeting','Peer Mentoring'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#374151] mb-1.5">Date</label>
                      <input type="date" value={interventionForm.date} onChange={e => setInterventionForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#374151] mb-1.5">Follow-up Date</label>
                      <input type="date" value={interventionForm.follow_up_date} onChange={e => setInterventionForm(f => ({ ...f, follow_up_date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Notes</label>
                    <textarea rows={3} value={interventionForm.note} onChange={e => { setInterventionForm(f => ({ ...f, note: e.target.value })); setSaved(false); }}
                      placeholder="Describe the intervention, outcome, and next steps…"
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] resize-none" />
                  </div>
                  {saved && <p className="text-xs text-green-600 mb-2">✓ Intervention logged successfully</p>}
                  <button onClick={logIntervention} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">
                    {saving ? 'Saving…' : 'Log Intervention'}
                  </button>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E7EB]">
                    <h2 className="text-sm font-semibold text-[#111827]">Intervention History</h2>
                  </div>
                  <div className="divide-y divide-[#F3F4F6]">
                    {interventions.length === 0 ? (
                      <p className="px-4 py-6 text-xs text-[#9CA3AF] text-center">No interventions logged yet</p>
                    ) : interventions.map((item: any) => (
                      <div key={item.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-[#374151]">{item.type}</span>
                          <span className="text-[11px] text-[#9CA3AF]">{item.date}</span>
                        </div>
                        <p className="text-xs text-[#6B7280] mb-1.5 leading-relaxed">{item.note}</p>
                        {item.follow_up_date && <p className="text-[11px] text-[#9CA3AF]">Follow-up: <span className="text-[#1E3A5F]">{item.follow_up_date}</span></p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
