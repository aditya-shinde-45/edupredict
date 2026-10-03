import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import RiskBadge from '../../components/RiskBadge';
import { api, getUser } from '../../lib/api';

export default function FacultyInterventions() {
  const user = getUser();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_id: '', type: 'Counselling Session', date: new Date().toISOString().split('T')[0], follow_up_date: '', note: '' });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.interventions.list({ faculty_id: user.id }),
      api.students.list(),
    ]).then(([ints, studs]) => {
      setInterventions(ints);
      setStudents(studs.filter((s: any) => s.risk !== 'Low'));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.id]);

  async function logIntervention() {
    if (!user) return;
    setSaving(true);
    try {
      const rec = await api.interventions.create({ ...form, faculty_id: user.id, status: 'Open' });
      setInterventions(i => [rec, ...i]);
      setShowModal(false);
      setForm({ student_id: '', type: 'Counselling Session', date: new Date().toISOString().split('T')[0], follow_up_date: '', note: '' });
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  const filtered = interventions.filter(i => filter === 'All' || i.status === filter);

  return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Interventions']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Interventions</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Log and track faculty interventions for at-risk students</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">+ Log Intervention</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Logged', value: interventions.length, sub: 'all time' },
            { label: 'Open / Pending', value: interventions.filter(i => i.status === 'Open').length, sub: 'follow-up needed', accent: true },
            { label: 'Completed', value: interventions.filter(i => i.status === 'Completed').length, sub: 'this semester' },
            { label: 'Students Helped', value: new Set(interventions.map(i => i.student_id)).size, sub: 'unique students' },
          ].map(c => (
            <div key={c.label} className={`rounded border p-4 ${c.accent ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white border-[#E5E7EB]'}`}>
              <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${c.accent ? 'text-blue-200' : 'text-[#9CA3AF]'}`}>{c.label}</p>
              <p className={`text-2xl font-semibold ${c.accent ? 'text-white' : 'text-[#111827]'}`}>{c.value}</p>
              <p className={`text-xs mt-1 ${c.accent ? 'text-blue-200' : 'text-[#9CA3AF]'}`}>{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border border-[#E5E7EB] rounded overflow-hidden w-fit">
          {['All', 'Open', 'Completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs transition-colors ${filter === f ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#374151] hover:bg-[#F9FAFB]'}`}>{f}</button>
          ))}
        </div>

        {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded p-8 text-center text-sm text-[#9CA3AF]">No interventions found</div>
            ) : filtered.map(item => (
              <div key={item.id} className="bg-white border border-[#E5E7EB] rounded p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EBF0F7] flex items-center justify-center text-xs font-semibold text-[#1E3A5F] flex-shrink-0">
                      {item.students?.name?.split(' ').map((p: string) => p[0]).join('') || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#111827]">{item.students?.name}</p>
                        <RiskBadge risk={item.students?.risk || 'Medium'} />
                      </div>
                      <p className="text-xs text-[#9CA3AF] font-mono">{item.students?.roll_no}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${item.status === 'Open' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{item.status}</span>
                    {item.follow_up_date && <p className="text-[10px] text-[#9CA3AF] mt-1">Follow-up: {item.follow_up_date}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs font-medium text-[#374151] bg-[#F3F4F6] px-2 py-0.5 rounded">{item.type}</span>
                  <span className="text-xs text-[#9CA3AF]">{item.date}</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">{item.note}</p>
                {(item.before_att || item.after_att) && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#F3F4F6] mt-3">
                    <div>
                      <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Attendance</p>
                      <div className="flex items-center gap-2 text-sm font-semibold font-mono">
                        <span className="text-red-500">{item.before_att}%</span>
                        {item.after_att && <><span className="text-[#9CA3AF]">→</span><span className="text-green-600">{item.after_att}%</span><span className="text-green-600 text-xs">+{item.after_att - item.before_att}%</span></>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Marks</p>
                      <div className="flex items-center gap-2 text-sm font-semibold font-mono">
                        <span className="text-red-500">{item.before_marks}</span>
                        {item.after_marks && <><span className="text-[#9CA3AF]">→</span><span className="text-green-600">{item.after_marks}</span><span className="text-green-600 text-xs">+{item.after_marks - item.before_marks}</span></>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">Log New Intervention</h2>
                <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Student</label>
                  <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                    <option value="">Select student…</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_no})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {['Counselling Session','Remedial Class','Parent Meeting','Peer Mentoring'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Follow-up</label>
                    <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Notes</label>
                  <textarea rows={3} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Describe what was discussed, outcome, and next steps…"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={logIntervention} disabled={saving || !form.student_id}
                  className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">{saving ? 'Saving…' : 'Log Intervention'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
