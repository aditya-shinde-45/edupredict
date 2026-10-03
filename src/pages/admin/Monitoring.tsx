import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import RiskBadge from '../../components/RiskBadge';
import { api } from '../../lib/api';

export default function AdminMonitoring() {
  const [data, setData] = useState<any>(null);
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  useEffect(() => { api.dashboard('admin').then(setData).catch(console.error); }, []);

  const trend = data?.institutionTrend || [];
  const allStudents = data?.students || [];
  const deptStats = data?.deptStats || [];

  const filtered = allStudents.filter((s: any) =>
    s.risk !== 'Low' &&
    (deptFilter === 'All' || s.dept.toLowerCase().includes(deptFilter.toLowerCase())) &&
    (riskFilter === 'All' || s.risk === riskFilter)
  );

  const chartW = 480, chartH = 130, padL = 32, padR = 12, padT = 10, padB = 22;
  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
  function px(i: number) { return padL + (i / Math.max(trend.length - 1, 1)) * plotW; }
  function py(v: number) { return padT + plotH - (v / 100) * plotH; }
  const attPath = trend.map((d: any, i: number) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.attendance)}`).join(' ');
  const marksPath = trend.map((d: any, i: number) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.marks)}`).join(' ');
  const attArea = attPath + (trend.length ? ` L${px(trend.length - 1)},${padT + plotH} L${padL},${padT + plotH} Z` : '');

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Monitoring']}>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Institutional Monitoring</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Performance trends and risk analysis · AY 2024–25</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#111827]">Institution-wide Performance Trend</h2>
            <div className="flex gap-4 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#1E3A5F] inline-block" /> Attendance</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> Marks</span>
            </div>
          </div>
          {trend.length > 0 ? (
            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`}>
              <defs>
                <linearGradient id="attGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[25, 50, 75, 100].map(v => (
                <g key={v}>
                  <line x1={padL} y1={py(v)} x2={chartW - padR} y2={py(v)} stroke="#F3F4F6" strokeWidth="1" />
                  <text x={padL - 4} y={py(v) + 3.5} textAnchor="end" fontSize="9" fill="#9CA3AF">{v}</text>
                </g>
              ))}
              <path d={attArea} fill="url(#attGrad2)" />
              <path d={attPath} fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinejoin="round" />
              <path d={marksPath} fill="none" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 3" />
              {trend.map((d: any, i: number) => (
                <g key={i}>
                  <circle cx={px(i)} cy={py(d.attendance)} r="3" fill="#1E3A5F" />
                  <circle cx={px(i)} cy={py(d.marks)} r="3" fill="#D97706" />
                  <text x={px(i)} y={chartH - 4} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.month}</text>
                </g>
              ))}
            </svg>
          ) : <p className="text-xs text-[#9CA3AF]">No trend data available</p>}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-semibold text-[#111827]">Department Comparison</h2>
          </div>
          <table>
            <thead><tr><th>Department</th><th>Students</th><th>Attendance %</th><th>Avg Marks %</th><th>High Risk</th><th>Medium Risk</th><th>At-Risk Total</th></tr></thead>
            <tbody>
              {deptStats.map((d: any) => (
                <tr key={d.dept}>
                  <td><span className="font-mono text-xs font-bold text-[#1E3A5F]">{d.dept}</span></td>
                  <td className="font-mono text-xs text-[#374151]">{d.students}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${d.att >= 82 ? 'bg-[#1E3A5F]' : 'bg-amber-500'}`} style={{ width: `${d.att}%` }} />
                      </div>
                      <span className={`font-mono text-xs font-medium ${d.att < 82 ? 'text-amber-600' : 'text-[#374151]'}`}>{d.att}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${d.marks >= 68 ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${d.marks}%` }} />
                      </div>
                      <span className="font-mono text-xs text-[#374151]">{d.marks}%</span>
                    </div>
                  </td>
                  <td><span className="text-xs font-medium text-red-500">{d.highRisk}</span></td>
                  <td><span className="text-xs font-medium text-amber-600">{d.medRisk}</span></td>
                  <td>
                    <span className="font-mono text-xs font-semibold text-[#374151]">{d.highRisk + d.medRisk}</span>
                    {d.students > 0 && <span className="text-[10px] text-[#9CA3AF] ml-1">({Math.round(((d.highRisk + d.medRisk) / d.students) * 100)}%)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB] flex-wrap">
            <h2 className="text-sm font-semibold text-[#111827]">Students Requiring Attention</h2>
            <div className="ml-auto flex gap-2">
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-2.5 py-1 text-xs border border-[#E5E7EB] rounded text-[#374151] focus:outline-none">
                <option>All</option><option>Computer</option><option>Electronics</option><option>Mechanical</option>
              </select>
              <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="px-2.5 py-1 text-xs border border-[#E5E7EB] rounded text-[#374151] focus:outline-none">
                <option>All</option><option>High</option><option>Medium</option>
              </select>
            </div>
          </div>
          <table>
            <thead><tr><th>Student</th><th>Dept / Class</th><th>Attendance</th><th>Avg Marks</th><th>Trend</th><th>Risk</th></tr></thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#EBF0F7] flex items-center justify-center text-[10px] font-semibold text-[#1E3A5F] flex-shrink-0">
                        {s.name.split(' ').map((p: string) => p[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-[#111827]">{s.name}</p>
                        <p className="text-[11px] text-[#9CA3AF] font-mono">{s.roll_no}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs text-[#374151]">{s.dept}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{s.year} · {s.division}</p>
                  </td>
                  <td><span className={`font-mono text-xs font-medium ${s.attendance < 65 ? 'text-red-500' : 'text-amber-600'}`}>{s.attendance}%</span></td>
                  <td><span className={`font-mono text-xs font-medium ${s.avg_marks < 50 ? 'text-red-500' : 'text-amber-600'}`}>{s.avg_marks}</span></td>
                  <td><span className={`text-xs ${s.trend === 'Declining' ? 'text-red-500' : 'text-[#9CA3AF]'}`}>{s.trend === 'Declining' ? '↓' : '→'} {s.trend}</span></td>
                  <td><RiskBadge risk={s.risk} /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-xs text-[#9CA3AF]">No at-risk students found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
