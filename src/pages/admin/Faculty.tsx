import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', dept: 'Computer Science', role: 'Faculty', password: 'faculty123' });
  const [saving, setSaving] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => { api.faculty.list().then(setFaculty).catch(console.error).finally(() => setLoading(false)); }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: '', email: '', dept: 'Computer Science', role: 'Faculty', password: 'faculty123' });
    setShowModal(true);
  }

  function openEditModal(fac: any) {
    setEditingId(fac.id);
    setForm({ name: fac.name, email: fac.email, dept: fac.dept, role: fac.role, password: 'faculty123' });
    setShowModal(true);
  }

  async function saveFaculty() {
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.faculty.update(editingId, { name: form.name, email: form.email, dept: form.dept, role: form.role });
        setFaculty(f => f.map(x => x.id === editingId ? updated : x));
      } else {
        const rec = await api.faculty.create({ ...form, subjects: [], classes: [] });
        setFaculty(f => [...f, rec]);
      }
      setShowModal(false);
      setForm({ name: '', email: '', dept: 'Computer Science', role: 'Faculty', password: 'faculty123' });
      setEditingId(null);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function resetFacultyPassword() {
    if (!selectedFaculty?.email) return;
    setResetError('');
    setResetSuccess(false);
    
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      await api.resetPassword(selectedFaculty.email, newPassword);
      setResetSuccess(true);
      setNewPassword('');
      setTimeout(() => {
        setShowResetPassword(false);
        setResetSuccess(false);
      }, 2000);
    } catch (e: any) {
      setResetError(e.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Faculty']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Faculty</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{faculty.length} faculty members · AY 2024–25</p>
          </div>
          <button onClick={openCreateModal} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">+ Add Faculty</button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
            <table>
              <thead><tr><th>Faculty Member</th><th>Department</th><th>Subjects Assigned</th><th>Classes</th><th>Role</th><th></th></tr></thead>
              <tbody>
                {faculty.map(f => (
                  <tr key={f.id} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EBF0F7] flex items-center justify-center text-[11px] font-semibold text-[#1E3A5F] flex-shrink-0">
                          {f.name.split(' ').filter((p: string) => !['Dr.','Prof.'].includes(p)).map((p: string) => p[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <p className="font-medium text-[#111827]">{f.name}</p>
                          <p className="text-[11px] text-[#9CA3AF]">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-[#374151]">{f.dept}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(f.subjects || []).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] text-[11px] rounded">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(f.classes || []).map((c: string) => (
                          <span key={c} className="px-1.5 py-0.5 bg-[#EBF0F7] text-[#1E3A5F] text-[11px] rounded font-medium">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        f.role === 'Class Advisor' ? 'bg-blue-50 text-[#1E3A5F]' : f.role === 'Mentor' ? 'bg-purple-50 text-purple-700' : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}>{f.role}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(f)} className="text-xs text-[#1E3A5F] hover:underline">Edit</button>
                        <button onClick={() => { setSelectedFaculty(f); setShowResetPassword(true); }} 
                          className="text-xs text-amber-600 hover:underline">Reset Password</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">{editingId ? 'Edit Faculty' : 'Add Faculty'}</h2>
                <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Full Name', key: 'name', placeholder: 'Dr. Name' },
                  { label: 'Email', key: 'email', placeholder: 'name@college.edu' },
                  { label: 'Password (for login)', key: 'password', placeholder: 'faculty123' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Department</label>
                    <select value={form.dept} onChange={e => setForm(x => ({ ...x, dept: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {['Computer Science','Electronics','Mechanical','Civil'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Role</label>
                    <select value={form.role} onChange={e => setForm(x => ({ ...x, role: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {['Faculty','Class Advisor','Mentor'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={saveFaculty} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPassword && selectedFaculty && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={() => setShowResetPassword(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">Reset Password - {selectedFaculty.name}</h2>
                <button onClick={() => setShowResetPassword(false)} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-4">
                {resetSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    <span>✓</span>
                    <span>Password reset successfully!</span>
                  </div>
                )}
                {resetError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <span>✕</span>
                    <span>{resetError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Email</label>
                  <p className="text-sm text-[#6B7280] bg-[#F9FAFB] px-3 py-2 rounded border border-[#E5E7EB]">{selectedFaculty.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">New Password</label>
                  <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  <p className="text-xs text-[#9CA3AF] mt-1">Faculty will use this password to login</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={() => setShowResetPassword(false)} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={resetFacultyPassword} disabled={saving} className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-60">
                  {saving ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
