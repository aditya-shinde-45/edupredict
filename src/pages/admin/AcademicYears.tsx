import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';

export default function AcademicYears() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ year: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.academicYears.list().then(data => {
      setYears(data);
      if (data.length) setExpanded(data[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function createYear() {
    setSaving(true);
    try {
      const rec = await api.academicYears.create({ ...form, status: 'Active' });
      setYears(y => [{ ...rec, semesters: [] }, ...y]);
      setShowModal(false);
      setForm({ year: '', start_date: '', end_date: '' });
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  const active = years.find(y => y.status === 'Active');

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Academic Years']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Academic Years & Semesters</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Manage the institutional academic calendar</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A]">+ New Academic Year</button>
        </div>

        {active && (
          <div className="flex items-center gap-4 bg-[#EBF0F7] border border-[#1E3A5F]/20 rounded p-4">
            <div className="w-8 h-8 rounded bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">◷</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1E3A5F]">Current: AY {active.year}</p>
              <p className="text-xs text-[#4B6A8F] mt-0.5">{active.start_date} – {active.end_date}</p>
            </div>
          </div>
        )}

        {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
          <div className="space-y-3">
            {years.map(ay => (
              <div key={ay.id} className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors"
                  onClick={() => setExpanded(expanded === ay.id ? '' : ay.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#111827]">Academic Year {ay.year}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${ay.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{ay.status}</span>
                  </div>
                  <span className="text-[#9CA3AF] text-sm">{expanded === ay.id ? '▲' : '▼'}</span>
                </button>

                {expanded === ay.id && (
                  <div className="border-t border-[#E5E7EB]">
                    <table>
                      <thead><tr><th>Semester</th><th>Start Date</th><th>End Date</th><th>Enrolled</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        {(ay.semesters || []).map((sem: any) => (
                          <tr key={sem.id}>
                            <td className="font-medium text-[#374151]">{sem.name}</td>
                            <td className="text-[#6B7280] font-mono text-xs">{sem.start_date}</td>
                            <td className="text-[#6B7280] font-mono text-xs">{sem.end_date}</td>
                            <td className="font-mono text-xs text-[#374151]">{sem.students}</td>
                            <td>
                              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                                sem.status === 'Ongoing' ? 'bg-green-50 text-green-700' :
                                sem.status === 'Upcoming' ? 'bg-blue-50 text-[#1E3A5F]' : 'bg-[#F3F4F6] text-[#6B7280]'
                              }`}>{sem.status}</span>
                            </td>
                            <td><button className="text-xs text-[#9CA3AF] hover:underline">View</button></td>
                          </tr>
                        ))}
                        {(ay.semesters || []).length === 0 && (
                          <tr><td colSpan={6} className="text-center py-4 text-xs text-[#9CA3AF]">No semesters added</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded border border-[#E5E7EB] w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                <h2 className="text-sm font-semibold text-[#111827]">New Academic Year</h2>
                <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#374151]">✕</button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Academic Year</label>
                  <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2025-26"
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">Start Date</label>
                    <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">End Date</label>
                    <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[#E5E7EB]">
                <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded text-[#374151] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={createYear} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">{saving ? 'Creating…' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
