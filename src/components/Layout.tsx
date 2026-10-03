import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api, getUser, logout } from '../lib/api';

interface NavItem { label: string; path: string; icon: string; }
interface LayoutProps { role: 'admin' | 'faculty' | 'student'; children: React.ReactNode; breadcrumbs?: string[]; }

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: '⊞' },
  { label: 'Students', path: '/admin/students', icon: '◉' },
  { label: 'Faculty', path: '/admin/faculty', icon: '◈' },
  { label: 'Departments', path: '/admin/departments', icon: '⬡' },
  { label: 'Subjects', path: '/admin/subjects', icon: '⊟' },
  { label: 'Academic Years', path: '/admin/academic', icon: '◷' },
  { label: 'Monitoring', path: '/admin/monitoring', icon: '◉' },
  { label: 'Reports', path: '/admin/reports', icon: '⊞' },
  { label: 'Settings', path: '/admin/settings', icon: '⚙' },
];

const facultyNav: NavItem[] = [
  { label: 'Dashboard', path: '/faculty', icon: '⊞' },
  { label: 'My Classes', path: '/faculty/classes', icon: '◉' },
  { label: 'Attendance', path: '/faculty/attendance', icon: '◷' },
  { label: 'Marks Entry', path: '/faculty/marks', icon: '⊟' },
  { label: 'Assignments', path: '/faculty/assignments', icon: '◈' },
  { label: 'Student Profiles', path: '/faculty/students', icon: '◉' },
  { label: 'Interventions', path: '/faculty/interventions', icon: '⬡' },
  { label: 'Notifications', path: '/faculty/notifications', icon: '◷' },
  { label: 'Settings', path: '/faculty/settings', icon: '⚙' },
];

const studentNav: NavItem[] = [
  { label: 'Dashboard', path: '/student', icon: '⊞' },
  { label: 'Attendance', path: '/student/attendance', icon: '◷' },
  { label: 'Marks & Results', path: '/student/marks', icon: '⊟' },
  { label: 'Assignments', path: '/student/assignments', icon: '◈' },
  { label: 'Performance', path: '/student/performance', icon: '⬡' },
  { label: 'Risk Status', path: '/student/risk', icon: '◉' },
  { label: 'Notifications', path: '/student/notifications', icon: '◷' },
  { label: 'Profile', path: '/student/profile', icon: '◈' },
];

const navMap = { admin: adminNav, faculty: facultyNav, student: studentNav };
const labelMap = { admin: 'Admin Panel', faculty: 'Faculty Panel', student: 'Student Panel' };

export default function Layout({ role, children, breadcrumbs }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = getUser();
  const nav = navMap[role];

  useEffect(() => {
    if (!user) return;
    api.notifications.list({ user_id: user.id }).then(setNotifs).catch(() => {});
  }, [user?.id]);

  const unread = notifs.filter(n => !n.read).length;

  async function handleMarkAllRead() {
    if (!user) return;
    await api.notifications.markAllRead(user.id).catch(() => {});
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8FA]">
      <aside className={`flex flex-col flex-shrink-0 bg-[#1E2D40] transition-all duration-200 ${collapsed ? 'w-14' : 'w-56'}`}>
        <div className={`flex items-center gap-2.5 px-3 py-4 border-b border-[#263850] ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded bg-[#2E4A6E] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">GC</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold leading-tight truncate">Nagpur Institute of Technology</p>
              <p className="text-[#64748B] text-[10px] leading-tight truncate">{labelMap[role]}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/faculty' || item.path === '/student'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 mx-1 rounded text-sm transition-colors ${
                  isActive ? 'bg-[#2E4A6E] text-white font-medium' : 'text-[#94A3B8] hover:bg-[#263850] hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#263850] p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[#64748B] hover:text-white hover:bg-[#263850] text-xs transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <span>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-[#E5E7EB] flex-shrink-0">
          <div className="flex items-center gap-3">
            {breadcrumbs && (
              <nav className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span>/</span>}
                    <span className={i === breadcrumbs.length - 1 ? 'text-[#111827] font-medium' : 'hover:text-[#6B7280] cursor-pointer'}>{crumb}</span>
                  </span>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div className="relative mr-2">
              <input
                type="text"
                placeholder="Search students, faculty…"
                className="w-52 pl-8 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded bg-[#F9FAFB] text-[#374151] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E3A5F]"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-xs">⌕</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
              >
                <span>🔔</span>
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-[#E5E7EB] rounded shadow-lg z-50">
                  <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#111827]">Notifications</span>
                    {unread > 0 && <button onClick={handleMarkAllRead} className="text-xs text-[#1E3A5F] hover:underline">Mark all read</button>}
                  </div>
                  {notifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-[#9CA3AF]">No notifications</div>
                  ) : notifs.slice(0, 5).map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer ${!n.read ? 'bg-[#EBF0F7]' : ''}`}
                      onClick={() => api.notifications.markRead(n.id).then(() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)))}>
                      <p className="text-xs font-medium text-[#374151]">{n.title}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-1 pl-3 border-l border-[#E5E7EB]">
              <div className="w-7 h-7 rounded-full bg-[#1E3A5F] flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">
                  {user?.name?.split(' ').map(p => p[0]).join('').slice(0, 2) || '??'}
                </span>
              </div>
              <div className="text-xs">
                <p className="font-medium text-[#111827] leading-tight">{user?.name || '—'}</p>
                <p className="text-[#9CA3AF] leading-tight capitalize">{role}</p>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="ml-1 text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
                title="Sign out"
              >
                ⏻
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
