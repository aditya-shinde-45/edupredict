import { useState } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

export default function FacultySettings() {
  const user = getUser();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

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

  return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Settings']}>
      <div className="p-6 space-y-5 max-w-2xl">
        <h1 className="text-lg font-semibold text-[#111827]">Account Settings</h1>

        <div className="bg-white border border-[#E5E7EB] rounded p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#111827] mb-1">Profile Information</h2>
            <p className="text-xs text-[#6B7280]">Your account details</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#9CA3AF] mb-1">Name</p>
              <p className="text-sm text-[#374151] font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF] mb-1">Email</p>
              <p className="text-sm text-[#374151]">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF] mb-1">Role</p>
              <p className="text-sm text-[#374151] capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#111827] mb-1">Security</h2>
            <p className="text-xs text-[#6B7280]">Manage your password and security settings</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-3 py-2 text-sm bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] transition-colors">
            Change Password
          </button>
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
