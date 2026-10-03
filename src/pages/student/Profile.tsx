import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import RiskBadge from '../../components/RiskBadge';
import { api, getUser } from '../../lib/api';

export default function StudentProfile() {
  const user = getUser();
  const [student, setStudent] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!user?.studentId) return;
    api.students.get(user.studentId).then(s => {
      setStudent(s);
      setPhone(s.phone || '');
      setAddress(s.address || '');
    }).catch(console.error);
    api.subjects.list({ dept: 'Computer Science', semester: 'Semester 5' }).then(setSubjects).catch(console.error);
  }, [user?.studentId]);

  async function saveProfile() {
    if (!user?.studentId) return;
    setSaving(true);
    try {
      const updated = await api.students.update(user.studentId, { phone, address });
      setStudent(updated);
      setSaved(true);
      setEditing(false);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (!user?.id) return;
    setPasswordError('');
    setPasswordSuccess(false);
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      await api.changePassword(user.id, passwordForm.oldPassword, passwordForm.newPassword);
      setPasswordSuccess(true);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (e: any) {
      setPasswordError(e.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  if (!student) return (
    <Layout role="student" breadcrumbs={['Student', 'Profile']}>
      <div className="p-6 text-sm text-[#9CA3AF]">Loading…</div>
    </Layout>
  );

  return (
    <Layout role="student" breadcrumbs={['Student', 'Profile']}>
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-semibold text-[#111827]">My Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 text-xs border border-[#E5E7EB] bg-white text-[#374151] rounded hover:bg-[#F9FAFB] transition-colors">
              Change Password
            </button>
            <button
              onClick={() => { if (editing) saveProfile(); else setEditing(true); }}
              disabled={saving}
              className={`px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-60 ${editing ? 'bg-[#1E3A5F] text-white hover:bg-[#162D4A]' : 'border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]'}`}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {saved && !editing && <p className="text-xs text-green-600 font-medium">✓ Profile updated successfully</p>}

        <div className="bg-white border border-[#E5E7EB] rounded p-5">
          <div className="flex items-start gap-5 mb-5">
            <div className="w-16 h-16 rounded-full bg-[#1E3A5F] flex items-center justify-center text-xl font-semibold text-white flex-shrink-0">
              {student.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-base font-semibold text-[#111827]">{student.name}</h2>
                <RiskBadge risk={student.risk} size="md" />
              </div>
              <p className="text-sm text-[#6B7280]">
                <span className="font-mono">{student.roll_no}</span> · {student.dept} · {student.program} {student.year}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">AY 2024–25 · {student.semester} · {student.division}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Personal Information</p>
              <div className="space-y-3">
                {[
                  { label: 'Full Name', value: student.name },
                  { label: 'Date of Birth', value: student.dob || '—' },
                  { label: 'Gender', value: student.gender || '—' },
                  { label: 'Email', value: student.email || '—' },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">{f.label}</p>
                    <p className="text-sm text-[#374151]">{f.value}</p>
                  </div>
                ))}
                <div>
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Phone</p>
                  {editing ? (
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                  ) : <p className="text-sm text-[#374151]">{phone || '—'}</p>}
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Address</p>
                  {editing ? (
                    <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] resize-none" />
                  ) : <p className="text-sm text-[#374151]">{address || '—'}</p>}
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Academic Information</p>
              <div className="space-y-3">
                {[
                  { label: 'Roll Number', value: student.roll_no },
                  { label: 'Department', value: student.dept },
                  { label: 'Program', value: student.program },
                  { label: 'Year / Semester', value: `${student.year} · ${student.semester}` },
                  { label: 'Division', value: student.division },
                  { label: 'Admission Year', value: student.admission_year || '—' },
                  { label: 'Academic Status', value: student.status },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">{f.label}</p>
                    <p className="text-sm text-[#374151]">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-semibold text-[#111827]">Enrolled Subjects — {student.semester}</h2>
          </div>
          <table>
            <thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Type</th><th>Faculty</th></tr></thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-xs text-[#9CA3AF]">No subjects found</td></tr>
              ) : subjects.map(s => (
                <tr key={s.id}>
                  <td><span className="font-mono text-xs font-semibold text-[#1E3A5F]">{s.code}</span></td>
                  <td className="font-medium text-[#374151]">{s.name}</td>
                  <td className="font-mono text-xs text-[#374151]">{s.credits}</td>
                  <td><span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${s.type === 'Core' ? 'bg-[#EBF0F7] text-[#1E3A5F]' : 'bg-purple-50 text-purple-700'}`}>{s.type}</span></td>
                  <td className="text-xs text-[#6B7280]">{s.faculty?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">Change Password</h2>
                <button onClick={() => setShowPasswordModal(false)} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-4">
                {passwordSuccess && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    <span>✓</span>
                    <span>Password changed successfully!</span>
                  </div>
                )}
                {passwordError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <span>✕</span>
                    <span>{passwordError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Current Password</label>
                  <input type="password" value={passwordForm.oldPassword} 
                    onChange={e => setPasswordForm(f => ({ ...f, oldPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">New Password</label>
                  <input type="password" value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Confirm New Password</label>
                  <input type="password" value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={() => setShowPasswordModal(false)} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={changePassword} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">
                  {saving ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
