import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api, getUser } from '../../lib/api';

export default function StudentPerformance() {
  const user = getUser();
  const [trend, setTrend] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) return;
    api.students.performance(user.studentId).then(data => {
      setTrend(data.trend || []);
      setMarks(data.marks || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.studentId]);

  const chartW = 480, chartH = 120, padL = 32, padR = 12, padT = 10, padB = 20;
  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
  function px(i: number) { return padL + (i / Math.max(trend.length - 1, 1)) * plotW; }
  function py(v: number) { return padT + plotH - (v / 100) * plotH; }
  const attPath = trend.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.attendance)}`).join(' ');
  const marksPath = trend.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.marks)}`).join(' ');
  const attArea = attPath + (trend.length ? ` L${px(trend.length - 1)},${padT + plotH} L${padL},${padT + plotH} Z` : '');
  const marksArea = marksPath + (trend.length ? ` L${px(trend.length - 1)},${padT + plotH} L${padL},${padT + plotH} Z` : '');

  return (
    <Layout role="student" breadcrumbs={['Student', 'Performance']}>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Academic Performance</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Semester 5 trend and subject analysis</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#111827]">Monthly Trend</h2>
            <div className="flex gap-4 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#1E3A5F] inline-block" /> Attendance %</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> Marks %</span>
            </div>
          </div>
          {loading ? (
            <div className="h-24 flex items-center justify-center text-sm text-[#9CA3AF]">Loading…</div>
          ) : trend.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] text-center py-8">No trend data available yet</p>
          ) : (
            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="marksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[25, 50, 75].map(v => (
                <g key={v}>
                  <line x1={padL} y1={py(v)} x2={chartW - padR} y2={py(v)} stroke="#F3F4F6" strokeWidth="1" />
                  <text x={padL - 4} y={py(v) + 3.5} textAnchor="end" fontSize="9" fill="#9CA3AF">{v}</text>
                </g>
              ))}
              <path d={attArea} fill="url(#attGrad)" />
              <path d={marksArea} fill="url(#marksGrad)" />
              <path d={attPath} fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinejoin="round" />
              <path d={marksPath} fill="none" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" strokeDasharray="4 2" />
              {trend.map((d, i) => (
                <g key={i}>
                  <circle cx={px(i)} cy={py(d.attendance)} r="3" fill="#1E3A5F" />
                  <circle cx={px(i)} cy={py(d.marks)} r="3" fill="#D97706" />
                  <text x={px(i)} y={py(d.attendance) - 6} textAnchor="middle" fontSize="9" fill="#1E3A5F" fontWeight="600">{d.attendance}</text>
                  <text x={px(i)} y={chartH - 2} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.month}</text>
                </g>
              ))}
            </svg>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <h2 className="text-sm font-semibold text-[#111827] mb-3">Subject Performance Comparison</h2>
            {marks.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-4">No marks data available</p>
            ) : (
              <div className="space-y-3">
                {marks.map(m => {
                  const total = m.ia1 + m.ia2 + m.assignment + m.midterm;
                  const pct = Math.round((total / 135) * 100);
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#374151] truncate max-w-[60%]">{m.subject}</span>
                        <span className={`font-mono text-xs font-semibold ${pct < 40 ? 'text-red-500' : pct < 55 ? 'text-amber-600' : 'text-[#374151]'}`}>{pct}%</span>
                      </div>
                      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct < 40 ? 'bg-red-400' : pct < 55 ? 'bg-amber-400' : pct < 70 ? 'bg-amber-300' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded p-4">
            <h2 className="text-sm font-semibold text-[#111827] mb-3">Analysis Summary</h2>
            {marks.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-4">No data available</p>
            ) : (() => {
              const sorted = [...marks].map(m => ({
                ...m,
                pct: Math.round(((m.ia1 + m.ia2 + m.assignment + m.midterm) / 135) * 100),
              })).sort((a, b) => b.pct - a.pct);
              const strengths = sorted.slice(0, 2);
              const weaknesses = [...sorted].reverse().slice(0, 2);
              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Relative Strengths</p>
                    <div className="space-y-1.5">
                      {strengths.map(s => (
                        <div key={s.id} className="flex items-start gap-2">
                          <span className="text-green-500 text-xs mt-0.5 flex-shrink-0">↑</span>
                          <div>
                            <p className="text-xs font-medium text-[#374151]">{s.subject}</p>
                            <p className="text-[11px] text-[#9CA3AF]">{s.pct}% overall score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Areas Needing Attention</p>
                    <div className="space-y-1.5">
                      {weaknesses.map(s => (
                        <div key={s.id} className="flex items-start gap-2">
                          <span className="text-red-500 text-xs mt-0.5 flex-shrink-0">↓</span>
                          <div>
                            <p className="text-xs font-medium text-[#374151]">{s.subject}</p>
                            <p className="text-[11px] text-[#9CA3AF]">{s.pct}% overall score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </Layout>
  );
}
