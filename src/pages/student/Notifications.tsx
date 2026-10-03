import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

const typeConfig: Record<string, { icon: string; bg: string; text: string }> = {
  risk:        { icon: '⚠', bg: 'bg-red-50', text: 'text-red-600' },
  attendance:  { icon: '◷', bg: 'bg-amber-50', text: 'text-amber-600' },
  marks:       { icon: '⊟', bg: 'bg-blue-50', text: 'text-[#1E3A5F]' },
  assignment:  { icon: '◈', bg: 'bg-purple-50', text: 'text-purple-600' },
  intervention:{ icon: '◉', bg: 'bg-green-50', text: 'text-green-600' },
};

export default function StudentNotifications() {
  const user = getUser();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!user) return;
    api.notifications.list({ user_id: user.id }).then(setNotifs).catch(console.error).finally(() => setLoading(false));
  }, [user?.id]);

  async function markRead(id: string) {
    await api.notifications.markRead(id).catch(console.error);
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  }

  async function markAllRead() {
    if (!user) return;
    await api.notifications.markAllRead(user.id).catch(console.error);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  }

  const filtered = notifs.filter(n => filter === 'All' ? true : filter === 'Unread' ? !n.read : n.type === filter);
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <Layout role="student" breadcrumbs={['Student', 'Notifications']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Notifications</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-[#1E3A5F] hover:underline">Mark all as read</button>}
        </div>

        <div className="flex gap-1 flex-wrap">
          {['All', 'Unread', 'risk', 'attendance', 'marks', 'assignment', 'intervention'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors capitalize ${filter === f ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'}`}>
              {f === 'risk' ? 'Risk Alerts' : f === 'attendance' ? 'Attendance' : f === 'marks' ? 'Marks' : f === 'assignment' ? 'Assignments' : f === 'intervention' ? 'Interventions' : f}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden divide-y divide-[#F3F4F6]">
          {loading ? (
            <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-3">
                <span className="text-[#9CA3AF] text-base">🔔</span>
              </div>
              <p className="text-sm text-[#374151] font-medium">No notifications</p>
              <p className="text-xs text-[#9CA3AF] mt-1">You're all caught up</p>
            </div>
          ) : filtered.map(n => {
            const tc = typeConfig[n.type] || { icon: '◉', bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' };
            return (
              <div key={n.id} onClick={() => markRead(n.id)}
                className={`flex items-start gap-3 px-4 py-3.5 hover:bg-[#F9FAFB] cursor-pointer transition-colors ${!n.read ? 'bg-[#F8FAFF]' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${tc.bg}`}>
                  <span className={tc.text}>{tc.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.read ? 'text-[#111827]' : 'text-[#374151]'}`}>{n.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-[#9CA3AF]">{new Date(n.created_at).toLocaleDateString()}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#1E3A5F] flex-shrink-0" />}
                    </div>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
