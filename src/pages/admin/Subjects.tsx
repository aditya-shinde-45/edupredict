import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [form, setForm] = useState({ code: '', name: '', dept: 'Computer Science', semester: 'Semester 5', credits: '4', type: 'Core' });
  const [saving, setSaving] = useState(false);
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');

  function load() {
    const params: Record<string,string> = {};
    if (deptFilter) params.dept = deptFilter;
    if (semFilter) params.semester = semFilter;
    setLoading(true);
    api.subjects.list(params).then(setSubjects).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(load, [deptFilter, semFilter]);

  async function saveSubject() {
    setSaving(true);
    try {
      if (editingSubject) {
        // Update existing subject
        const updated = await api.subjects.update(editingSubject.id, { ...form, credits: Number(form.credits) });
        setSubjects(s => s.map(sub => sub.id === editingSubject.id ? updated : sub));
      } else {
        // Create new subject
        const rec = await api.subjects.create({ ...form, credits: Number(form.credits) });
        setSubjects(s => [...s, rec]);
      }
      setShowModal(false);
      setEditingSubject(null);
      setForm({ code: '', name: '', dept: 'Computer Science', semester: 'Semester 5', credits: '4', type: 'Core' });
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  function openEditModal(subject: any) {
    setEditingSubject(subject);
    setForm({
      code: subject.code,
      name: subject.name,
      dept: subject.dept,
      semester: subject.semester,
      credits: String(subject.credits),
      type: subject.type,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingSubject(null);
    setForm({ code: '', name: '', dept: 'Computer Science', semester: 'Semester 5', credits: '4', type: 'Core' });
  }

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Subjects']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Subjects & Courses</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{subjects.length} subjects configured · AY 2024–25</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">+ Add Subject</button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded bg-white text-[#374151] focus:outline-none focus:border-[#1E3A5F]">
            <option value="">All Departments</option>
            {['Computer Science','Electronics','Mechanical','Civil'].map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded bg-white text-[#374151] focus:outline-none focus:border-[#1E3A5F]">
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`Semester ${s}`}>Semester {s}</option>)}
          </select>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
            <table>
              <thead><tr><th>Code</th><th>Subject Name</th><th>Department</th><th>Semester</th><th>Credits</th><th>Type</th><th>Faculty</th><th></th></tr></thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td><span className="font-mono text-xs font-semibold text-[#1E3A5F]">{s.code}</span></td>
                    <td className="font-medium text-[#111827]">{s.name}</td>
                    <td className="text-[#374151]">{s.dept}</td>
                    <td className="text-[#6B7280]">{s.semester}</td>
                    <td><span className="font-mono text-xs text-[#374151]">{s.credits}</span></td>
                    <td>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${s.type === 'Core' ? 'bg-[#EBF0F7] text-[#1E3A5F]' : 'bg-purple-50 text-purple-700'}`}>{s.type}</span>
                    </td>
                    <td><span className="text-[11px] text-[#6B7280]">{s.faculty?.name || '—'}</span></td>
                    <td><button onClick={() => openEditModal(s)} className="text-xs text-[#1E3A5F] hover:underline">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={closeModal}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
                <button onClick={closeModal} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Subject Code</label>
                    <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="CS306"
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Credits</label>
                    <input type="number" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} min="1" max="6"
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Subject Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Artificial Intelligence"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Department</label>
                    <select value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {['Computer Science','Electronics','Mechanical','Civil'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {['Core','Elective','Lab'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Semester</label>
                  <select value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`Semester ${s}`}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={closeModal} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={saveSubject} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">
                  {saving ? 'Saving…' : editingSubject ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
