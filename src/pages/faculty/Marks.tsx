import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

export default function FacultyMarks() {
  const user = getUser();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.classes.list({ faculty_id: user.id }).then(cls => {
      setClasses(cls);
      if (cls.length) setSelectedClass(cls[0]);
    }).catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    Promise.all([
      api.students.list({ division: selectedClass.division, dept: selectedClass.dept }),
      api.marks.list({ class_id: selectedClass.id }),
    ]).then(([students, marks]) => {
      const merged = students.map(s => {
        const m = marks.find((x: any) => x.student_id === s.id) || {};
        return { ...s, markId: m.id, ia1: m.ia1 ?? 0, ia2: m.ia2 ?? 0, assignment: m.assignment ?? 0, midterm: m.midterm ?? 0 };
      });
      setData(merged);
    }).catch(console.error).finally(() => setLoading(false));
  }, [selectedClass?.id]);

  function updateMark(id: string, field: string, value: string) {
    const num = Math.max(0, parseInt(value) || 0);
    setData(d => d.map(s => s.id === id ? { ...s, [field]: num } : s));
    setPublished(false);
  }

  const maxes = { ia1: 30, ia2: 30, assignment: 25, midterm: 50 };

  async function publishMarks() {
    if (!selectedClass || !user) return;
    setSaving(true);
    try {
      const records = data.map(s => ({
        id: s.markId,
        student_id: s.id,
        class_id: selectedClass.id,
        subject: selectedClass.subject,
        subject_code: selectedClass.subject_code,
        ia1: s.ia1, ia2: s.ia2, assignment: s.assignment, midterm: s.midterm,
        published: true,
        faculty_id: user.id,
      }));
      await api.marks.bulk(records);
      setPublished(true);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Layout role="faculty" breadcrumbs={['Faculty', 'Marks Entry']}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Marks Entry</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{selectedClass ? `${selectedClass.subject_code} · ${selectedClass.subject} · ${selectedClass.name}` : 'Select a class'}</p>
          </div>
          <div className="flex gap-2">
            <select value={selectedClass?.id || ''} onChange={e => setSelectedClass(classes.find(c => c.id === e.target.value))}
              className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded bg-white text-[#374151] focus:outline-none focus:border-[#1E3A5F]">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.subject_code}</option>)}
            </select>
            <button onClick={publishMarks} disabled={saving} className="px-3 py-1.5 text-xs bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">
              {saving ? 'Publishing…' : 'Finalize & Publish'}
            </button>
          </div>
        </div>

        {published && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium">
            <span>✓</span><span>Marks finalized and published. Students can now view their results.</span>
          </div>
        )}

        {!published && data.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            <span>⚠️</span><span>You have unsaved changes. Click "Finalize & Publish" to save and make marks visible to students.</span>
          </div>
        )}

        <div className="flex gap-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="flex items-center gap-2 text-blue-700">
            <span>💡</span>
            <span className="font-medium">Click on any marks field to edit and enter student scores</span>
          </div>
          <div className="ml-auto flex gap-3 text-[#6B7280]">
            <span>IA-1 <span className="font-mono text-[#374151]">/30</span></span>
            <span>IA-2 <span className="font-mono text-[#374151]">/30</span></span>
            <span>Assignment <span className="font-mono text-[#374151]">/25</span></span>
            <span>Mid-term <span className="font-mono text-[#374151]">/50</span></span>
            <span className="font-medium">Total <span className="font-mono text-[#374151]">/135</span></span>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
            <table>
              <thead>
                <tr><th>#</th><th>Student</th><th>Roll No</th><th>IA-1 /30</th><th>IA-2 /30</th><th>Assignment /25</th><th>Mid-term /50</th><th>Total /135</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.map((s, i) => {
                  const total = s.ia1 + s.ia2 + s.assignment + s.midterm;
                  const pct = Math.round((total / 135) * 100);
                  const pass = pct >= 40;
                  return (
                    <tr key={s.id}>
                      <td className="text-[#9CA3AF] text-xs">{String(i + 1).padStart(2, '0')}</td>
                      <td className="font-medium text-[#111827]">{s.name}</td>
                      <td><span className="font-mono text-[11px] text-[#6B7280]">{s.roll_no}</span></td>
                      {(['ia1', 'ia2', 'assignment', 'midterm'] as const).map(field => (
                        <td key={field}>
                          <input type="number" value={s[field]} min={0} max={maxes[field]}
                            onChange={e => updateMark(s.id, field, e.target.value)}
                            className={`w-16 px-2 py-1.5 text-xs text-center border-2 rounded font-mono focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-colors cursor-pointer hover:border-[#1E3A5F]/50 ${
                              s[field] < maxes[field] * 0.4 ? 'border-red-300 bg-red-50 text-red-600' : 'border-[#D1D5DB] bg-white text-[#374151]'
                            }`}
                            placeholder="0" />
                        </td>
                      ))}
                      <td><span className={`font-mono text-xs font-semibold ${!pass ? 'text-red-500' : pct >= 60 ? 'text-green-600' : 'text-[#374151]'}`}>{total}</span></td>
                      <td>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${!pass ? 'bg-red-50 text-red-700' : pct >= 75 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {!pass ? 'Fail' : 'Pass'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
