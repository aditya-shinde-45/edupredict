import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

type AttStatus = 'present' | 'absent' | 'late';

export default function FacultyAttendance() {
  const user = getUser();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<'mark' | 'history'>('mark');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.classes.list({ faculty_id: user.id }).then(data => {
      setClasses(data);
      if (data.length) setSelectedClass(data[0]);
    }).catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    if (!selectedClass) return;
    api.students.list({ division: selectedClass.division, dept: selectedClass.dept })
      .then(students => setRoster(students.map(s => ({ ...s, status: 'present' as AttStatus }))))
      .catch(console.error);
  }, [selectedClass?.id]);

  useEffect(() => {
    if (!selectedClass) return;
    api.attendance.list({ class_id: selectedClass.id }).then(setHistory).catch(console.error);
  }, [selectedClass?.id, view]);

  function setAll(status: AttStatus) { setRoster(r => r.map(s => ({ ...s, status }))); setSaved(false); }
  function toggle(id: string, status: AttStatus) { setRoster(r => r.map(s => s.id === id ? { ...s, status } : s)); setSaved(false); }

  const counts = {
    present: roster.filter(s => s.status === 'present').length,
    absent: roster.filter(s => s.status === 'absent').length,
    late: roster.filter(s => s.status === 'late').length,
  };

  async function submitAttendance() {
    if (!selectedClass || !user) return;
    setSaving(true);
    try {
      const records = roster.map(s => ({
        student_id: s.id,
        class_id: selectedClass.id,
        subject: selectedClass.subject,
        subject_code: selectedClass.subject_code,
        date,
        status: s.status,
        faculty_id: user.id,
      }));
      await api.attendance.bulk(records);
      setSaved(true);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  // Group history by date
  const historyByDate = history.reduce((acc: any, r: any) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Attendance']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Attendance</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Mark daily subject-wise attendance</p>
          </div>
          <div className="flex gap-1 border border-[#E5E7EB] rounded overflow-hidden">
            <button onClick={() => setView('mark')} className={`px-3 py-1.5 text-xs transition-colors ${view === 'mark' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#374151] hover:bg-[#F9FAFB]'}`}>Mark Attendance</button>
            <button onClick={() => setView('history')} className={`px-3 py-1.5 text-xs transition-colors ${view === 'history' ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#374151] hover:bg-[#F9FAFB]'}`}>History</button>
          </div>
        </div>

        {view === 'mark' ? (
          <>
            <div className="flex items-center gap-3 flex-wrap bg-white border border-[#E5E7EB] rounded p-3">
              <div>
                <label className="block text-[10px] font-medium text-[#9CA3AF] mb-1">DATE</label>
                <input type="date" value={date} onChange={e => { setDate(e.target.value); setSaved(false); }}
                  className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-medium text-[#9CA3AF] mb-1">CLASS / SUBJECT</label>
                <select value={selectedClass?.id || ''} onChange={e => setSelectedClass(classes.find(c => c.id === e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.subject} ({c.subject_code})</option>)}
                </select>
              </div>
              <div className="self-end flex gap-1.5">
                <button onClick={() => setAll('present')} className="px-2.5 py-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100">All Present</button>
                <button onClick={() => setAll('absent')} className="px-2.5 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100">All Absent</button>
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded">
              <span className="text-xs text-[#6B7280]">{roster.length} students total</span>
              <span className="text-xs text-green-600 font-medium">● {counts.present} Present</span>
              <span className="text-xs text-red-500 font-medium">● {counts.absent} Absent</span>
              <span className="text-xs text-amber-600 font-medium">● {counts.late} Late</span>
              <span className="ml-auto text-xs font-mono text-[#1E3A5F] font-medium">
                {roster.length ? Math.round((counts.present / roster.length) * 100) : 0}% attendance rate
              </span>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
              <table>
                <thead><tr><th>#</th><th>Student Name</th><th>Roll No</th><th>Status</th><th>Overall %</th></tr></thead>
                <tbody>
                  {roster.map((s, i) => (
                    <tr key={s.id} className={s.status === 'absent' ? 'bg-red-50/30' : s.status === 'late' ? 'bg-amber-50/30' : ''}>
                      <td className="text-[#9CA3AF] text-xs">{String(i + 1).padStart(2, '0')}</td>
                      <td className="font-medium text-[#111827]">{s.name}</td>
                      <td><span className="font-mono text-[11px] text-[#6B7280]">{s.roll_no}</span></td>
                      <td>
                        <div className="flex gap-1">
                          {(['present', 'absent', 'late'] as AttStatus[]).map(status => (
                            <button key={status} onClick={() => toggle(s.id, status)}
                              className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                                s.status === status
                                  ? status === 'present' ? 'bg-green-100 text-green-700 border border-green-300'
                                  : status === 'absent' ? 'bg-red-100 text-red-700 border border-red-300'
                                  : 'bg-amber-100 text-amber-700 border border-amber-300'
                                  : 'bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB] hover:bg-[#E9EAEB]'
                              }`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td><span className={`font-mono text-xs ${s.attendance < 65 ? 'text-red-500' : s.attendance < 75 ? 'text-amber-600' : 'text-[#374151]'}`}>{s.attendance}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              {saved && <span className="text-xs text-green-600 font-medium">✓ Attendance saved successfully</span>}
              <div className="flex gap-2 ml-auto">
                <button onClick={submitAttendance} disabled={saving} className="px-3 py-2 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">
                  {saving ? 'Saving…' : 'Submit Attendance'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#111827]">Attendance History — {selectedClass?.name} · {selectedClass?.subject_code}</h2>
            </div>
            <table>
              <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th></tr></thead>
              <tbody>
                {Object.entries(historyByDate).map(([date, records]: [string, any]) => {
                  const present = records.filter((r: any) => r.status === 'present').length;
                  const absent = records.filter((r: any) => r.status === 'absent').length;
                  const late = records.filter((r: any) => r.status === 'late').length;
                  const total = records.length;
                  const pct = total ? Math.round((present / total) * 100) : 0;
                  return (
                    <tr key={date}>
                      <td className="font-medium text-[#374151]">{date}</td>
                      <td><span className="text-green-600 font-mono text-xs">{present}</span></td>
                      <td><span className="text-red-500 font-mono text-xs">{absent}</span></td>
                      <td><span className="text-amber-600 font-mono text-xs">{late}</span></td>
                      <td><span className={`font-mono text-xs font-medium ${pct < 80 ? 'text-amber-600' : 'text-[#374151]'}`}>{pct}%</span></td>
                    </tr>
                  );
                })}
                {Object.keys(historyByDate).length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-xs text-[#9CA3AF]">No attendance records yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
