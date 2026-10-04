import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/api';
import clgLogo from '../assets/clglogo.png';

type Role = 'admin' | 'faculty' | 'student';

const roles: { id: Role; label: string; desc: string; icon: string }[] = [
  { id: 'admin', label: 'Administrator', desc: 'Manage institutional structure, students & faculty', icon: '⬡' },
  { id: 'faculty', label: 'Faculty', desc: 'Mark attendance, enter marks, track student progress', icon: '◈' },
  { id: 'student', label: 'Student', desc: 'View attendance, marks, performance & risk status', icon: '◉' },
];

const credentials: Record<Role, { user: string; pass: string }> = {
  admin:   { user: 'admin@college.demo',   pass: 'Admin@SAA2026!' },
  faculty: { user: 'ramesh@college.edu',   pass: 'faculty123' },
  student: { user: 'arjun@college.edu',    pass: 'student123' },
};

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    try { await login(email, password, selectedRole); navigate(`/${selectedRole}`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in'); }
  }

  function selectRole(role: Role) {
    setSelectedRole(role);
    setEmail(credentials[role].user);
    setPassword(credentials[role].pass);
    setError('');
  }

  function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    // Frontend-only: simulate sending reset email
    setResetSent(true);
    setTimeout(() => {
      setShowForgotPassword(false);
      setResetSent(false);
      setResetEmail('');
    }, 3000);
  }

  return (
    <div className="min-h-screen flex bg-[#F7F8FA]">
      {/* Left panel */}
      <div className="hidden lg:flex w-96 flex-col bg-[#1E2D40] p-10 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-12">
          <img src={clgLogo} alt="College Logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Nagpur Institute of Technology</p>
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-white text-2xl font-semibold leading-snug mb-3">
            Academic Management<br />System
          </h1>
          <p className="text-[#64748B] text-sm leading-relaxed mb-10">
            Integrated platform for managing students, faculty, attendance, assessments, and early-warning analytics.
          </p>

          <div className="space-y-3">
            {[
              { icon: '◷', text: 'Real-time attendance tracking' },
              { icon: '⊟', text: 'Marks & assessment management' },
              { icon: '◉', text: 'Rule-based risk classification' },
              { icon: '⬡', text: 'Faculty intervention logging' },
              { icon: '⊞', text: 'Institutional performance reports' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-[#94A3B8] text-sm">
                <span className="text-[#2E4A6E] text-base">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#263850] pt-6 text-[#475569] text-xs">
          AY 2024–25 · Semester 5 · © Nagpur Institute of Technology
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#111827] mb-1">Sign in to your account</h2>
            <p className="text-sm text-[#6B7280]">Select your role to continue</p>
          </div>

          {/* Role selector */}
          <div className="space-y-2 mb-6">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => selectRole(role.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded border text-left transition-all ${
                  selectedRole === role.id
                    ? 'border-[#1E3A5F] bg-[#EBF0F7] ring-1 ring-[#1E3A5F]/20'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB] hover:bg-[#F9FAFB]'
                }`}
              >
                <span className={`text-lg leading-none w-6 text-center ${selectedRole === role.id ? 'text-[#1E3A5F]' : 'text-[#9CA3AF]'}`}>
                  {role.icon}
                </span>
                <div>
                  <p className={`text-sm font-medium ${selectedRole === role.id ? 'text-[#1E3A5F]' : 'text-[#374151]'}`}>
                    {role.label}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">{role.desc}</p>
                </div>
                {selectedRole === role.id && (
                  <span className="ml-auto text-[#1E3A5F] text-sm">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Login form */}
          {selectedRole && (
            <form onSubmit={handleLogin} className="bg-white border border-[#E5E7EB] rounded p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 bg-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#374151]">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-[#1E3A5F] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20 bg-white"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                className="w-full py-2.5 bg-[#1E3A5F] text-white text-sm font-medium rounded hover:bg-[#162D4A] transition-colors"
              >
                Sign in as {roles.find(r => r.id === selectedRole)?.label}
              </button>
              <p className="text-[10px] text-center text-[#9CA3AF]">
                Credentials are pre-filled for demo access
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#111827]">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                  setResetEmail('');
                }}
                className="text-[#6B7280] hover:text-[#111827] text-xl leading-none"
              >
                ×
              </button>
            </div>

            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-[#6B7280]">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="your.email@college.edu"
                    required
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]/20"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    className="flex-1 px-4 py-2 text-sm border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] transition-colors"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <p className="text-sm font-medium text-green-800">Reset link sent!</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Check your email for password reset instructions.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-center text-[#6B7280]">
                  This window will close automatically...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
