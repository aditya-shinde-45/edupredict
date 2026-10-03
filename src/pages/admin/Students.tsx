import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import RiskBadge from '../../components/RiskBadge';
import { api } from '../../lib/api';

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', dept: '', program: '', year: '', semester: '', division: '', status: 'Active'
  });
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params: Record<string,string> = {};
    if (deptFilter !== 'All') params.dept = deptFilter;
    if (riskFilter !== 'All') params.risk = riskFilter;
    if (search) params.search = search;
    setLoading(true);
    api.students.list(params).then(setStudents).catch(console.error).finally(() => setLoading(false));
  }, [deptFilter, riskFilter, search]);

  function toggleSelect(id: string) { setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  function toggleAll() { setSelected(p => p.length === students.length ? [] : students.map(s => s.id)); }

  async function deactivateSelected() {
    await Promise.all(selected.map(id => api.students.update(id, { status: 'Inactive' })));
    setStudents(s => s.map(x => selected.includes(x.id) ? { ...x, status: 'Inactive' } : x));
    setSelected([]);
  }

  function openEditModal(student: any) {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      dept: student.dept,
      program: student.program,
      year: student.year,
      semester: student.semester,
      division: student.division,
      status: student.status,
    });
    setShowEditModal(true);
  }

  async function saveStudent() {
    if (!editingStudent) return;
    setSaving(true);
    try {
      const updated = await api.students.update(editingStudent.id, editForm);
      setStudents(s => s.map(st => st.id === editingStudent.id ? { ...st, ...editForm } : st));
      setShowEditModal(false);
      setEditingStudent(null);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function resetStudentPassword() {
    if (!editingStudent?.email) return;
    setResetError('');
    setResetSuccess(false);
    
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      await api.resetPassword(editingStudent.email, newPassword);
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

  async function recalculateAllRisks() {
    if (!confirm('Recalculate risk levels for all students based on current attendance and marks?')) return;
    setRecalculating(true);
    try {
      const response = await fetch('http://localhost:5005/api/students/recalculate-risk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('saa_token')}`
        }
      });
      const result = await response.json();
      alert(`Successfully recalculated risk for ${result.updated} students`);
      // Reload students
      const params: Record<string,string> = {};
      if (deptFilter !== 'All') params.dept = deptFilter;
      if (riskFilter !== 'All') params.risk = riskFilter;
      if (search) params.search = search;
      api.students.list(params).then(setStudents).catch(console.error);
    } catch (e: any) { alert(e.message); }
    finally { setRecalculating(false); }
  }

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Students']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Students</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{students.length} enrolled · AY 2024–25</p>
          </div>
          <div className="flex gap-2">
            <button onClick={recalculateAllRisks} disabled={recalculating} className="px-3 py-1.5 text-xs border border-[#1E3A5F] text-[#1E3A5F] rounded hover:bg-[#EBF0F7] disabled:opacity-60">
              {recalculating ? 'Recalculating...' : '⟳ Recalculate Risk'}
            </button>
            <button onClick={() => navigate('/admin/students/add')} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">+ Add Student</button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input type="text" placeholder="Search by name or roll no…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-60 px-3 py-1.5 text-xs border border-[#E5E7EB] rounded bg-white focus:outline-none focus:border-[#1E3A5F]" />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded bg-white focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
            {['All','Computer Science','Electronics','Mechanical','Civil'].map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded bg-white focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
            {['All','Low','Medium','High'].map(r => <option key={r} value={r}>{r === 'All' ? 'All Risk Levels' : `${r} Risk`}</option>)}
          </select>
          {(deptFilter !== 'All' || riskFilter !== 'All' || search) && (
            <button onClick={() => { setSearch(''); setDeptFilter('All'); setRiskFilter('All'); }} className="text-xs text-[#6B7280] hover:text-[#111827] underline">Clear filters</button>
          )}
          <span className="ml-auto text-xs text-[#9CA3AF]">{students.length} result{students.length !== 1 ? 's' : ''}</span>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#EBF0F7] border border-[#1E3A5F]/20 rounded text-sm">
            <span className="text-[#1E3A5F] font-medium">{selected.length} selected</span>
            <button onClick={deactivateSelected} className="text-xs text-red-500 hover:underline">Deactivate</button>
            <button onClick={() => setSelected([])} className="ml-auto text-xs text-[#9CA3AF] hover:text-[#374151]">✕ Clear</button>
          </div>
        )}

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          <div className="overflow-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={selected.length === students.length && students.length > 0} onChange={toggleAll} className="rounded border-[#D1D5DB]" />
                    </th>
                    <th>Student</th><th>Roll No</th><th>Department</th><th>Class / Division</th>
                    <th>Attendance</th><th>Avg Marks</th><th>Risk</th><th>Trend</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-12 text-[#9CA3AF] text-sm">No students match the current filters</td></tr>
                  ) : students.map(s => (
                    <tr key={s.id} className={`cursor-pointer ${selected.includes(s.id) ? 'bg-[#EBF0F7]' : ''}`}>
                      <td><input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} onClick={e => e.stopPropagation()} className="rounded border-[#D1D5DB]" /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EBF0F7] flex items-center justify-center text-[10px] font-semibold text-[#1E3A5F] flex-shrink-0">
                            {s.name.split(' ').map((p: string) => p[0]).join('')}
                          </div>
                          <span className="font-medium text-[#111827]">{s.name}</span>
                        </div>
                      </td>
                      <td><span className="font-mono text-[11px] text-[#6B7280]">{s.roll_no}</span></td>
                      <td className="text-[#374151]">{s.dept}</td>
                      <td className="text-[#374151]">{s.year} · {s.division}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.attendance >= 75 ? 'bg-green-500' : s.attendance >= 65 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.attendance}%` }} />
                          </div>
                          <span className={`font-mono text-xs ${s.attendance < 65 ? 'text-red-500' : s.attendance < 75 ? 'text-amber-600' : 'text-[#374151]'}`}>{s.attendance}%</span>
                        </div>
                      </td>
                      <td><span className="font-mono text-xs text-[#374151]">{s.avg_marks}/100</span></td>
                      <td><RiskBadge risk={s.risk} /></td>
                      <td><span className={`text-xs ${s.trend === 'Improving' ? 'text-green-600' : s.trend === 'Declining' ? 'text-red-500' : 'text-[#9CA3AF]'}`}>{s.trend === 'Improving' ? '↑' : s.trend === 'Declining' ? '↓' : '→'} {s.trend}</span></td>
                      <td><span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${s.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{s.status}</span></td>
                      <td><button onClick={(e) => { e.stopPropagation(); openEditModal(s); }} className="text-xs text-[#1E3A5F] hover:underline">Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E5E7EB] bg-[#F9FAFB]">
            <span className="text-xs text-[#9CA3AF]">Showing {students.length} students</span>
          </div>
        </div>

        {/* Edit Student Modal */}
        {showEditModal && editingStudent && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] sticky top-0 bg-white">
                <h2 className="text-sm font-semibold text-[#111827]">Edit Student - {editingStudent.roll_no}</h2>
                <button onClick={() => setShowEditModal(false)} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Full Name</label>
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Phone</label>
                    <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Department</label>
                    <input value={editForm.dept} onChange={e => setEditForm(f => ({ ...f, dept: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Program</label>
                    <select value={editForm.program} onChange={e => setEditForm(f => ({ ...f, program: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {['B.Tech', 'M.Tech', 'MCA', 'MBA'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Year</label>
                    <select value={editForm.year} onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Semester</label>
                    <select value={editForm.semester} onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`Semester ${s}`}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Division</label>
                    <select value={editForm.division} onChange={e => setEditForm(f => ({ ...f, division: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {['Div A', 'Div B', 'Div C'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Status</label>
                    <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center gap-2 px-5 py-3.5 border-t border-[#E5E7EB] sticky bottom-0 bg-white">
                <button onClick={() => setShowResetPassword(true)} className="px-3 py-1.5 text-xs border border-amber-300 bg-amber-50 text-amber-700 rounded hover:bg-amber-100">
                  🔑 Reset Password
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setShowEditModal(false)} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                  <button onClick={saveStudent} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">
                    {saving ? 'Saving…' : 'Update Student'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPassword && editingStudent && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={() => setShowResetPassword(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">Reset Password - {editingStudent.name}</h2>
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
                  <p className="text-sm text-[#6B7280] bg-[#F9FAFB] px-3 py-2 rounded border border-[#E5E7EB]">{editingStudent.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">New Password</label>
                  <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  <p className="text-xs text-[#9CA3AF] mt-1">Student will use this password to login</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={() => setShowResetPassword(false)} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={resetStudentPassword} disabled={saving} className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-60">
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
