import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

export default function StudentAssignments() {
  const user = getUser();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignmentDetails, setAssignmentDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.studentId) return;
    api.submissions.list({ student_id: user.studentId }).then(async subs => {
      setSubmissions(subs);
      // fetch assignment details for each submission
      const ids = [...new Set(subs.map((s: any) => s.assignment_id))];
      const details: Record<string, any> = {};
      await Promise.all(ids.map(async (id: any) => {
        try {
          const asns = await api.assignments.list();
          asns.forEach((a: any) => { details[a.id] = a; });
        } catch {}
      }));
      setAssignmentDetails(details);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.studentId]);

  const enriched = submissions.map(s => ({
    ...s,
    assignment: assignmentDetails[s.assignment_id] || {},
  }));

  const filtered = enriched.filter(s =>
    filter === 'All' ? true :
    filter === 'Pending' ? s.status === 'Not Submitted' :
    filter === 'Graded' ? s.marks !== null :
    s.status === 'Late'
  );

  const pending = enriched.filter(s => s.status === 'Not Submitted').length;
  const graded = enriched.filter(s => s.marks !== null).length;
  const totalMarks = enriched.filter(s => s.marks !== null).reduce((a, s) => a + s.marks, 0);
  const maxTotal = enriched.filter(s => s.marks !== null).reduce((a, s) => a + (s.assignment?.max_marks || 0), 0);

  return (
    <Layout role="student" breadcrumbs={['Student', 'Assignments']}>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Assignments</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Semester 5 · AY 2024–25</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-semibold text-[#111827]">{enriched.length}</p>
          </div>
          <div className={`border rounded p-4 ${pending > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#E5E7EB]'}`}>
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Pending</p>
            <p className={`text-2xl font-semibold ${pending > 0 ? 'text-amber-600' : 'text-[#111827]'}`}>{pending}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Graded</p>
            <p className="text-2xl font-semibold text-green-600">{graded}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">Score</p>
            <p className="text-2xl font-semibold text-[#374151] font-mono">{totalMarks}/{maxTotal}</p>
          </div>
        </div>

        <div className="flex gap-1 border border-[#E5E7EB] rounded overflow-hidden w-fit">
          {['All', 'Pending', 'Graded', 'Late'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs transition-colors ${filter === f ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#374151] hover:bg-[#F9FAFB]'}`}>{f}</button>
          ))}
        </div>

        {loading ? <div className="p-8 text-center text-sm text-[#9CA3AF]">Loading…</div> : (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded p-8 text-center text-sm text-[#9CA3AF]">No assignments found</div>
            ) : filtered.map(s => {
              const a = s.assignment;
              const isPending = s.status === 'Not Submitted';
              const isGraded = s.marks !== null;
              return (
                <div key={s.id} className={`bg-white border rounded overflow-hidden transition-all ${isPending ? 'border-amber-300' : 'border-[#E5E7EB]'}`}>
                  <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F9FAFB] text-left"
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${isPending ? 'bg-amber-100 text-amber-700' : isGraded ? 'bg-green-100 text-green-700' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                      {isPending ? '!' : isGraded ? '✓' : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium text-[#111827] truncate">{a.title || s.assignment_id}</p>
                        <span className={`flex-shrink-0 text-[11px] font-medium px-1.5 py-0.5 rounded ${isPending ? 'bg-amber-50 text-amber-700' : isGraded ? 'bg-green-50 text-green-700' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                          {isPending ? 'Pending' : isGraded ? 'Graded' : s.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">{a.subject_code} · Due: {a.due_date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {s.marks !== null ? (
                        <p className={`text-sm font-semibold font-mono ${s.marks / (a.max_marks || 1) < 0.5 ? 'text-red-500' : 'text-[#374151]'}`}>{s.marks}/{a.max_marks}</p>
                      ) : <p className="text-sm text-[#9CA3AF]">—/{a.max_marks}</p>}
                      <p className="text-[10px] text-[#9CA3AF]">{expanded === s.id ? '▲' : '▼'}</p>
                    </div>
                  </button>

                  {expanded === s.id && (
                    <div className="border-t border-[#F3F4F6] px-4 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-[#9CA3AF] mb-0.5">Subject</p>
                          <p className="font-medium text-[#374151]">{a.subject}</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] mb-0.5">Submitted on</p>
                          <p className="font-medium text-[#374151]">{s.submitted_on || <span className="text-amber-600">Not submitted yet</span>}</p>
                        </div>
                      </div>
                      {s.feedback && (
                        <div>
                          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Faculty Feedback</p>
                          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-3">
                            <p className="text-xs text-[#374151] leading-relaxed">{s.feedback}</p>
                          </div>
                        </div>
                      )}
                      {a.instructions && (
                        <div>
                          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Instructions</p>
                          <p className="text-xs text-[#6B7280] leading-relaxed">{a.instructions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
