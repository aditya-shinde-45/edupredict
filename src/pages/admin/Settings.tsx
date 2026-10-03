import { useState } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

export default function AdminSettings() {
  const user = getUser();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

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

  async function syncUsers() {
    if (!confirm('Sync all students and faculty data with user accounts? This will create missing user accounts and update existing ones.')) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await api.syncUsers();
      setSyncResult(result);
      setShowSyncModal(true);
    } catch (e: any) {
      alert(e.message || 'Failed to sync users');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Settings']}>
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

        <div className="bg-white border border-[#E5E7EB] rounded p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#111827] mb-1">Data Synchronization</h2>
            <p className="text-xs text-[#6B7280]">Sync student and faculty data with user accounts</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700 space-y-2">
            <p className="font-medium">💡 When to use Data Sync:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Students or faculty exist but can't login</li>
              <li>After importing data from external sources</li>
              <li>Names don't match between user accounts and records</li>
              <li>Missing user accounts need to be created</li>
            </ul>
          </div>
          <button
            onClick={syncUsers}
            disabled={syncing}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 transition-colors">
            {syncing ? '⟳ Syncing...' : '⟳ Sync Users Data'}
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

        {/* Sync Results Modal */}
        {showSyncModal && syncResult && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowSyncModal(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">Data Sync Results</h2>
                <button onClick={() => setShowSyncModal(false)} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                  <span>✓</span>
                  <span>User data synchronized successfully!</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold text-[#111827] mb-2">Students</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                        <p className="text-lg font-semibold text-blue-700">{syncResult.studentsProcessed}</p>
                        <p className="text-blue-600">Processed</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                        <p className="text-lg font-semibold text-green-700">{syncResult.studentsCreated}</p>
                        <p className="text-green-600">Created</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center">
                        <p className="text-lg font-semibold text-amber-700">{syncResult.studentsUpdated}</p>
                        <p className="text-amber-600">Updated</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-[#111827] mb-2">Faculty</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                        <p className="text-lg font-semibold text-blue-700">{syncResult.facultyProcessed}</p>
                        <p className="text-blue-600">Processed</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                        <p className="text-lg font-semibold text-green-700">{syncResult.facultyCreated}</p>
                        <p className="text-green-600">Created</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center">
                        <p className="text-lg font-semibold text-amber-700">{syncResult.facultyUpdated}</p>
                        <p className="text-amber-600">Updated</p>
                      </div>
                    </div>
                  </div>

                  {syncResult.errors && syncResult.errors.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-red-700 mb-2">Errors ({syncResult.errors.length})</h3>
                      <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                        {syncResult.errors.map((err: string, i: number) => (
                          <p key={i} className="text-[11px] text-red-600">{err}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={() => setShowSyncModal(false)} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
