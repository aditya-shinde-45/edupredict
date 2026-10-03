import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import RiskBadge from '../../components/RiskBadge';
import { api, getUser } from '../../lib/api';

export default function StudentRiskStatus() {
  const user = getUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) return;
    api.students.risk(user.studentId).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [user?.studentId]);

  const student = data?.student;
  const interventions = data?.interventions || [];

  if (loading) return <Layout role="student" breadcrumbs={['Student', 'Risk Status']}><div className="p-6 text-sm text-[#9CA3AF]">Loading…</div></Layout>;
  if (!student) return <Layout role="student" breadcrumbs={['Student', 'Risk Status']}><div className="p-6 text-sm text-[#9CA3AF]">No data found</div></Layout>;

  const factors = [
    {
      factor: 'Attendance',
      yours: `${student.attendance}%`,
      required: '75%',
      score: student.attendance,
      bad: student.attendance < 75,
      detail: student.attendance < 75
        ? `Your attendance is ${75 - student.attendance}% below the minimum required. Attend more classes to clear the shortage.`
        : 'Your attendance is above the required threshold.',
    },
    {
      factor: 'Internal Assessment Marks',
      yours: `${student.avg_marks}/100`,
      required: '50/100',
      score: student.avg_marks,
      bad: student.avg_marks < 50,
      detail: student.avg_marks < 50
        ? 'Your average marks are below the pass threshold. Focus on upcoming assessments.'
        : 'Your marks are above the pass threshold.',
    },
    {
      factor: 'Assignment Completion',
      yours: `${student.assignments}%`,
      required: '80%',
      score: student.assignments,
      bad: student.assignments < 80,
      detail: student.assignments < 80
        ? 'You have pending assignments. Submit them to improve your completion rate.'
        : 'Your assignment completion rate is good.',
    },
    {
      factor: 'Performance Trend',
      yours: student.trend,
      required: 'Stable or Improving',
      score: student.trend === 'Improving' ? 90 : student.trend === 'Stable' ? 60 : 30,
      bad: student.trend === 'Declining',
      detail: student.trend === 'Declining'
        ? 'Your performance has been declining. Seek help from your advisor immediately.'
        : 'Your performance trend is stable or improving.',
    },
  ];

  return (
    <Layout role="student" breadcrumbs={['Student', 'Risk Status']}>
      <div className="p-6 space-y-5 max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">My Academic Risk Status</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Auto-assessed based on your academic data</p>
          </div>
          <RiskBadge risk={student.risk} size="md" />
        </div>

        <div className={`border rounded p-4 ${student.risk === 'High' ? 'bg-red-50 border-red-200' : student.risk === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-3">
            <span className={`text-lg leading-none mt-0.5 ${student.risk === 'High' ? 'text-red-500' : student.risk === 'Medium' ? 'text-amber-500' : 'text-green-500'}`}>⚠</span>
            <div>
              <h2 className={`text-sm font-semibold mb-1 ${student.risk === 'High' ? 'text-red-800' : student.risk === 'Medium' ? 'text-amber-800' : 'text-green-800'}`}>
                You are currently classified as {student.risk} Risk
              </h2>
              <p className={`text-xs leading-relaxed ${student.risk === 'High' ? 'text-red-700' : student.risk === 'Medium' ? 'text-amber-700' : 'text-green-700'}`}>
                Your academic standing has been automatically assessed based on attendance, marks, assignment completion, and performance trend.
                {student.risk !== 'Low' && ' This is an early warning to help you get back on track before end-semester exams.'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-4">
          <h2 className="text-sm font-semibold text-[#111827] mb-4">Risk Factor Breakdown</h2>
          <div className="space-y-4">
            {factors.map(f => (
              <div key={f.factor} className="border border-[#E5E7EB] rounded p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-[#374151]">{f.factor}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Required: {f.required}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold font-mono ${f.bad ? 'text-red-500' : 'text-green-600'}`}>{f.yours}</p>
                    <span className={`text-[10px] font-medium ${f.bad ? 'text-red-500' : 'text-green-600'}`}>{f.bad ? 'Below threshold' : 'On track'}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#F3F4F6] rounded-full mb-2">
                  <div className={`h-full rounded-full ${f.bad ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${Math.min(f.score, 100)}%` }} />
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {interventions.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <h2 className="text-sm font-semibold text-[#111827] mb-3">Faculty Interventions</h2>
            <div className="space-y-3">
              {interventions.map((item: any) => (
                <div key={item.id} className="border border-[#E5E7EB] rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#374151]">{item.type}</span>
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${item.status === 'Open' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{item.note}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">{item.date}{item.follow_up_date ? ` · Follow-up: ${item.follow_up_date}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#EBF0F7] border border-[#1E3A5F]/20 rounded p-4">
          <h2 className="text-sm font-semibold text-[#1E3A5F] mb-2">Need help? Reach out.</h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-medium text-[#374151]">Class Advisor</p>
              <p className="text-[#6B7280]">Dr. Ramesh Kumar</p>
              <p className="text-[#1E3A5F]">ramesh.kumar@college.edu</p>
            </div>
            <div>
              <p className="font-medium text-[#374151]">Student Counsellor</p>
              <p className="text-[#6B7280]">Ms. Sunita Varma</p>
              <p className="text-[#1E3A5F]">counsellor@college.edu</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
