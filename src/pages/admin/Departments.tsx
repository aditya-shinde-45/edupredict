import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', hod: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.departments.list().then(setDepartments).catch(console.error).finally(() => setLoading(false)); }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: '', code: '', hod: '' });
    setShowModal(true);
  }

  function openEditModal(dept: any) {
    setEditingId(dept.id);
    setForm({ name: dept.name, code: dept.code, hod: dept.hod });
    setShowModal(true);
  }

  async function saveDept() {
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.departments.update(editingId, form);
        setDepartments(d => d.map(x => x.id === editingId ? updated : x));
      } else {
        const rec = await api.departments.create(form);
        setDepartments(d => [...d, rec]);
      }
      setShowModal(false);
      setForm({ name: '', code: '', hod: '' });
      setEditingId(null);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Departments']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Departments & Programs</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Institutional academic structure</p>
          </div>
          <button onClick={openCreateModal} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">+ Add Department</button>
        </div>

        {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(dept => (
              <div key={dept.id} className="bg-white border border-[#E5E7EB] rounded p-4 hover:border-[#D1D5DB] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-[#EBF0F7] flex items-center justify-center text-xs font-bold text-[#1E3A5F]">{dept.code}</div>
                    <div>
                      <p className="font-medium text-[#111827] text-sm">{dept.name}</p>
                      <p className="text-xs text-[#9CA3AF]">HoD: {dept.hod}</p>
                    </div>
                  </div>
                  <button onClick={() => openEditModal(dept)} className="text-xs text-[#1E3A5F] hover:underline">Edit</button>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#F3F4F6]">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[#111827]">{dept.students}</p>
                    <p className="text-[11px] text-[#9CA3AF]">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[#111827]">{dept.faculty_count}</p>
                    <p className="text-[11px] text-[#9CA3AF]">Faculty</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[#111827]">{dept.programs}</p>
                    <p className="text-[11px] text-[#9CA3AF]">Programs</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">{editingId ? 'Edit Department' : 'Add Department'}</h2>
                <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Department Name', key: 'name', placeholder: 'Computer Science & Engineering' },
                  { label: 'Code', key: 'code', placeholder: 'CSE' },
                  { label: 'Head of Department', key: 'hod', placeholder: 'Dr. Name' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={saveDept} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
