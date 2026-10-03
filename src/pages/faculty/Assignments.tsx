import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

export default function FacultyAssignments() {
  const user = getUser();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'evaluate' | 'create'>('list');
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', subject_code: '', class_id: '', class_name: '', due_date: '', max_marks: '25', instructions: '' });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.assignments.list({ faculty_id: user.id }),
      api.classes.list({ faculty_id: user.id }),
    ]).then(([asns, cls]) => {
      setAssignments(asns);
      setClasses(cls);
      if (cls.length) setForm(f => ({ ...f, class_id: cls[0].id, class_name: cls[0].name, subject_code: cls[0].subject_code }));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!selected) return;
    api.submissions.list({ assignment_id: selected.id }).then(setSubmissions).catch(console.error);
  }, [selected?.id]);

  async function createAssignment() {
    if (!user) return;
    setSaving(true);
    try {
      const cls = classes.find(c => c.id === form.class_id);
      const rec = await api.assignments.create({ ...form, faculty_id: user.id, subject: cls?.subject, max_marks: Number(form.max_marks), status: 'Open', submitted: 0, total: cls?.students || 0 });
      setAssignments(a => [rec, ...a]);
      setView('list');
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function saveGrades() {
    setSaving(true);
    try {
      await Promise.all(submissions.map(s => api.submissions.update(s.id, { marks: s.marks, feedback: s.feedback })));
      setSaved(true);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  if (view === 'create') return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Assignments', 'Create']}>
      <div className="p-6 max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#111827]">Create Assignment</h1>
          <button onClick={() => setView('list')} className="text-xs text-[#6B7280] hover:text-[#111827]">✕ Cancel</button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <span>💡</span>
          <span>Select the class from the dropdown below. The assignment will be visible to all students in that class.</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Assignment Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Assignment 4 — Graph Algorithms"
              className="w-full px-3 py-2 text-sm border-2 border-[#D1D5DB] rounded focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 hover:border-[#1E3A5F]/50 transition-colors" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Class *</label>
              {classes.length === 0 ? (
                <div className="w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50 rounded text-amber-700">
                  No classes assigned
                </div>
              ) : (
                <select value={form.class_id} onChange={e => {
                  const cls = classes.find(c => c.id === e.target.value);
                  setForm(f => ({ ...f, class_id: e.target.value, class_name: cls?.name || '', subject_code: cls?.subject_code || '' }));
                }} className="w-full px-3 py-2 text-sm border-2 border-[#D1D5DB] rounded focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 text-[#374151] bg-white cursor-pointer hover:border-[#1E3A5F]/50 transition-colors">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.subject_code}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Max Marks *</label>
              <input type="number" value={form.max_marks} onChange={e => setForm(f => ({ ...f, max_marks: e.target.value }))}
                className="w-full px-3 py-2 text-sm border-2 border-[#D1D5DB] rounded focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 hover:border-[#1E3A5F]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Due Date *</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border-2 border-[#D1D5DB] rounded focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 text-[#374151] hover:border-[#1E3A5F]/50 transition-colors cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Instructions</label>
            <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={4}
              placeholder="Describe the assignment requirements, submission format, and grading criteria…" className="w-full px-3 py-2 text-sm border-2 border-[#D1D5DB] rounded focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 resize-none hover:border-[#1E3A5F]/50 transition-colors" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setView('list')} className="px-3 py-2 text-sm border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
          <button onClick={createAssignment} disabled={saving} className="px-3 py-2 text-sm bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">{saving ? 'Creating…' : 'Create Assignment'}</button>
        </div>
      </div>
    </Layout>
  );

  if (view === 'evaluate' && selected) return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Assignments', 'Evaluate']}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">{selected.title}</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{selected.class_name} · {selected.subject_code} · Due: {selected.due_date} · Max: {selected.max_marks}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('list')} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">← Back</button>
            <button onClick={saveGrades} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">{saving ? 'Saving…' : 'Save Grades'}</button>
          </div>
        </div>
        {saved && <p className="text-xs text-green-600 font-medium">✓ Grades saved</p>}
        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          <table>
            <thead><tr><th>Student</th><th>Submitted On</th><th>Status</th><th>Marks /{selected.max_marks}</th><th>Feedback</th></tr></thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id}>
                  <td>
                    <p className="font-medium text-[#111827]">{s.students?.name}</p>
                    <p className="text-[11px] text-[#9CA3AF] font-mono">{s.students?.roll_no}</p>
                  </td>
                  <td className="text-xs text-[#6B7280]">{s.submitted_on || <span className="text-red-400">—</span>}</td>
                  <td><span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${!s.submitted_on ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{s.status}</span></td>
                  <td>
                    {s.submitted_on ? (
                      <input type="number" value={s.marks ?? ''} min={0} max={selected.max_marks}
                        onChange={e => setSubmissions(prev => prev.map(x => x.id === s.id ? { ...x, marks: parseInt(e.target.value) || null } : x))}
                        placeholder="—" className="w-14 px-2 py-1 text-xs text-center border border-[#E5E7EB] rounded font-mono focus:outline-none focus:border-[#1E3A5F]" />
                    ) : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td>
                    {s.submitted_on ? (
                      <input value={s.feedback || ''} onChange={e => setSubmissions(prev => prev.map(x => x.id === s.id ? { ...x, feedback: e.target.value } : x))}
                        placeholder="Add feedback…" className="w-full px-2 py-1 text-xs border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                    ) : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-xs text-[#9CA3AF]">No submissions yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Assignments']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Assignments & Assessments</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{assignments.length} assignments across all classes</p>
          </div>
          <button onClick={() => setView('create')} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">+ Create Assignment</button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
            <table>
              <thead><tr><th>Assignment</th><th>Class</th><th>Due Date</th><th>Submissions</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-sm text-[#9CA3AF]">No assignments yet</td></tr>
                ) : assignments.map(a => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-medium text-[#111827]">{a.title}</p>
                      <p className="text-[11px] text-[#9CA3AF] font-mono">{a.subject_code} · Max: {a.max_marks}</p>
                    </td>
                    <td className="text-[#374151]">{a.class_name}</td>
                    <td className="text-xs text-[#6B7280]">{a.due_date}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1E3A5F] rounded-full" style={{ width: `${a.total ? Math.round(a.submitted / a.total * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs font-mono text-[#374151]">{a.submitted}/{a.total}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${a.status === 'Open' ? 'bg-green-50 text-green-700' : a.status === 'Evaluating' ? 'bg-amber-50 text-amber-700' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{a.status}</span>
                    </td>
                    <td>
                      <button onClick={() => { setSelected(a); setView('evaluate'); }} className="text-xs text-[#1E3A5F] hover:underline">
                        {a.status === 'Graded' ? 'View' : 'Evaluate'}
                      </button>
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
