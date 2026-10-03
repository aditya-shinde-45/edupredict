import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import RiskBadge from '../../components/RiskBadge';
import { api } from '../../lib/api';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [chartHover, setChartHover] = useState<number | null>(null);

  useEffect(() => { api.dashboard('admin').then(setData).catch(console.error); }, []);

  const trend = data?.institutionTrend || [];
  const students = data?.students || [];
  const deptStats = data?.deptStats || [];
  const recentNotifs = data?.notifications || [];

  const chartW = 400, chartH = 120, padL = 30, padR = 10, padT = 10, padB = 20;
  const plotW = chartW - padL - padR, plotH = chartH - padT - padB;
  function pointX(i: number) { return padL + (i / Math.max(trend.length - 1, 1)) * plotW; }
  function pointY(v: number) { return padT + plotH - (v / 100) * plotH; }
  const attPath = trend.map((d: any, i: number) => `${i === 0 ? 'M' : 'L'}${pointX(i)},${pointY(d.attendance)}`).join(' ');
  const marksPath = trend.map((d: any, i: number) => `${i === 0 ? 'M' : 'L'}${pointX(i)},${pointY(d.marks)}`).join(' ');

  const highRisk = students.filter((s: any) => s.risk === 'High');
  const medRisk = students.filter((s: any) => s.risk === 'Medium');

  if (!data) return (
    <Layout role="admin" breadcrumbs={['Admin', 'Dashboard']}>
      <div className="p-6 text-sm text-[#9CA3AF]">Loading dashboard…</div>
    </Layout>
  );

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Dashboard']}>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Dashboard</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">AY 2024–25 · Semester 5</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs border border-[#E5E7EB] rounded bg-white text-[#374151] hover:bg-[#F9FAFB]">Export Report</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard label="Total Students" value={String(data.stats.students)} sub="across all depts" />
          <StatCard label="Total Faculty" value={String(data.stats.faculty)} sub="active members" />
          <StatCard label="Departments" value={String(deptStats.length)} sub="configured" />
          <StatCard label="Active Assignments" value={String(data.stats.assignments)} sub="this semester" />
          <StatCard label="Need Attention" value={String(highRisk.length + medRisk.length)} accent sub={`${highRisk.length} high risk`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#111827]">Institution Trend</h2>
              <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#1E3A5F] inline-block" /> Attendance</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> Marks</span>
              </div>
            </div>
            {trend.length > 0 ? (
              <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="overflow-visible">
                {[25, 50, 75, 100].map(v => (
                  <g key={v}>
                    <line x1={padL} y1={pointY(v)} x2={chartW - padR} y2={pointY(v)} stroke="#F3F4F6" strokeWidth="1" />
                    <text x={padL - 4} y={pointY(v) + 3.5} textAnchor="end" fontSize="9" fill="#9CA3AF">{v}</text>
                  </g>
                ))}
                {trend.map((d: any, i: number) => (
                  <text key={i} x={pointX(i)} y={chartH - 2} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.month}</text>
                ))}
                <path d={attPath} fill="none" stroke="#1E3A5F" strokeWidth="1.5" strokeLinejoin="round" />
                <path d={marksPath} fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
                {trend.map((d: any, i: number) => (
                  <g key={i} onMouseEnter={() => setChartHover(i)} onMouseLeave={() => setChartHover(null)}>
                    <circle cx={pointX(i)} cy={pointY(d.attendance)} r={chartHover === i ? 4 : 2.5} fill="#1E3A5F" />
                    <circle cx={pointX(i)} cy={pointY(d.marks)} r={chartHover === i ? 4 : 2.5} fill="#D97706" />
                  </g>
                ))}
              </svg>
            ) : <p className="text-xs text-[#9CA3AF]">No trend data</p>}
          </div>

          <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded p-4">
            <h2 className="text-sm font-semibold text-[#111827] mb-3">By Department</h2>
            <div className="space-y-3">
              {deptStats.map((d: any) => (
                <div key={d.dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#374151]">{d.dept}</span>
                    <span className={`text-xs font-mono ${d.att < 80 ? 'text-amber-600' : 'text-[#6B7280]'}`}>{d.att}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.att >= 80 ? 'bg-[#1E3A5F]' : 'bg-amber-500'}`} style={{ width: `${d.att}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#111827]">Students Requiring Attention</h2>
              <span className="text-xs text-red-500 font-medium">{highRisk.length} High Risk</span>
            </div>
            <div className="overflow-auto max-h-48">
              <table>
                <thead><tr><th>Student</th><th>Dept</th><th>Att %</th><th>Risk</th></tr></thead>
                <tbody>
                  {students.filter((s: any) => s.risk !== 'Low').map((s: any) => (
                    <tr key={s.id}>
                      <td>
                        <p className="font-medium text-[#111827]">{s.name}</p>
                        <p className="text-[11px] text-[#9CA3AF] font-mono">{s.roll_no}</p>
                      </td>
                      <td><p className="text-[#374151] text-xs">{s.dept}</p></td>
                      <td><span className={`font-mono text-xs font-medium ${s.attendance < 65 ? 'text-red-500' : 'text-amber-600'}`}>{s.attendance}%</span></td>
                      <td><RiskBadge risk={s.risk} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-semibold text-[#111827]">Recent Alerts</h2>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {recentNotifs.length === 0 ? (
              <p className="px-4 py-4 text-xs text-[#9CA3AF]">No recent alerts</p>
            ) : recentNotifs.slice(0, 5).map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F9FAFB]">
                <span className={`w-6 h-6 flex-shrink-0 rounded flex items-center justify-center text-[10px] mt-0.5 ${
                  n.type === 'risk' ? 'bg-red-50 text-red-500' : n.type === 'attendance' ? 'bg-blue-50 text-[#1E3A5F]' : 'bg-amber-50 text-amber-600'
                }`}>!</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-[#374151]">{n.title}</span>
                  <span className="text-xs text-[#9CA3AF]"> — </span>
                  <span className="text-xs text-[#6B7280]">{n.message}</span>
                </div>
                <span className="text-[11px] text-[#9CA3AF] flex-shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
