import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';

const reportTypes = [
  { id: 'att-summary', label: 'Attendance Summary Report', desc: 'Subject-wise and overall attendance by class, department, and institution', icon: '◷' },
  { id: 'marks-summary', label: 'Marks & Assessment Report', desc: 'IA scores, mid-term results, grade distribution, and subject performance', icon: '⊟' },
  { id: 'risk-report', label: 'At-Risk Students Report', desc: 'Full list of High/Medium risk students with factor breakdown', icon: '⚠' },
  { id: 'faculty-report', label: 'Faculty Performance Report', desc: 'Classes handled, attendance marking timeliness, marks submission', icon: '◈' },
  { id: 'dept-comparison', label: 'Department Comparison Report', desc: 'Side-by-side performance metrics across all departments', icon: '⬡' },
  { id: 'intervention-log', label: 'Intervention Log Report', desc: 'All faculty interventions logged with outcomes and follow-up status', icon: '◉' },
];

export default function AdminReports() {
  const [selected, setSelected] = useState('att-summary');
  const [dept, setDept] = useState('All');
  const [classId, setClassId] = useState('All');
  const [division, setDivision] = useState('All');
  const [program, setProgram] = useState('All');
  const [semester, setSemester] = useState('Semester 5');
  const [format, setFormat] = useState('PDF');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.classes.list(), api.students.list()]).then(([classRows, studentRows]) => {
      setClasses(classRows);
      setStudents(studentRows);
    }).catch(e => alert(e.message));
  }, []);

  const divisions = [...new Set(students.map(student => student.division).filter(Boolean))];
  const programs = [...new Set(students.map(student => student.program).filter(Boolean))];

  async function generate() {
    setGenerating(true);
    setReportData(null);
    try {
      const result = await api.reports({ type: selected, dept, class_id: classId, division, program, semester, format });
      setReportData(result);
    } catch (e: any) { alert(e.message); }
    finally { setGenerating(false); }
  }

  async function downloadReport() {
    try {
      const extension = format === 'PDF' ? 'pdf' : format === 'Excel' ? 'xls' : 'csv';
      await api.downloadReport({ type: selected, dept, class_id: classId, division, program, semester, format }, `${selected}-report.${extension}`);
    } catch (e: any) { alert(e.message); }
  }

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Reports']}>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Report Generation</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Generate and export institutional reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Select Report Type</h2>
            <div className="space-y-2">
              {reportTypes.map(r => (
                <button key={r.id} onClick={() => { setSelected(r.id); setReportData(null); }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded border text-left transition-all ${selected === r.id ? 'border-[#1E3A5F] bg-[#EBF0F7] ring-1 ring-[#1E3A5F]/20' : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'}`}>
                  <span className={`text-base leading-none mt-0.5 ${selected === r.id ? 'text-[#1E3A5F]' : 'text-[#9CA3AF]'}`}>{r.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${selected === r.id ? 'text-[#1E3A5F]' : 'text-[#374151]'}`}>{r.label}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{r.desc}</p>
                  </div>
                  {selected === r.id && <span className="ml-auto text-[#1E3A5F] text-sm flex-shrink-0">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded p-4 space-y-3">
              <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Report Filters</h2>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Semester</label>
                <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`Semester ${s}`}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Department</label>
                <select value={dept} onChange={e => setDept(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                  <option>All</option>
                  {['Computer Science','Electronics','Mechanical','Civil'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Class</label>
                <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                  <option value="All">All Classes</option>
                  {classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Program</label>
                <select value={program} onChange={e => setProgram(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                  <option value="All">All Programs</option>
                  {programs.map(item => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Division</label>
                <select value={division} onChange={e => setDivision(e.target.value)} className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                  <option value="All">All Divisions</option>
                  {divisions.map(item => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Export Format</label>
                <div className="flex gap-2">
                  {['PDF', 'Excel', 'CSV'].map(f => (
                    <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-1.5 text-xs rounded border font-medium transition-colors ${format === f ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]'}`}>{f}</button>
                  ))}
                </div>
              </div>
              <button onClick={generate} disabled={generating}
                className="w-full py-2.5 text-sm font-medium bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60 transition-colors">
                {generating ? 'Generating…' : `Generate ${format}`}
              </button>

              {reportData && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                  <span className="text-green-600 text-sm">✓</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-700">Report ready</p>
                    <p className="text-[11px] text-[#6B7280]">Generated at {new Date(reportData.generated_at).toLocaleTimeString()}</p>
                  </div>
                  <button onClick={downloadReport} className="text-xs font-medium text-[#1E3A5F] hover:underline">Download</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
