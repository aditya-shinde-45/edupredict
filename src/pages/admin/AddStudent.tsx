import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';

const steps = ['Personal Info', 'Academic Assignment', 'Review & Save'];

export default function AddStudent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'Male', address: '',
    dept: '', program: 'B.Tech', year: '3rd Year', semester: 'Semester 5', division: 'Div A',
    password: 'student123', // Default password
  });

  useEffect(() => {
    api.departments.list().then(depts => {
      setDepartments(depts);
      if (depts.length > 0) {
        setForm(f => ({ ...f, dept: depts[0].name }));
      }
    }).catch(console.error);
  }, []);

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function saveStudent() {
    setSaving(true);
    try {
      await api.students.create({
        name: `${form.firstName} ${form.lastName}`.trim(),
        roll_no: `${form.dept.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-4)}`,
        email: form.email, phone: form.phone, dob: form.dob || null,
        gender: form.gender, address: form.address,
        dept: form.dept, program: form.program, year: form.year,
        semester: form.semester, division: form.division,
        status: 'Active', attendance: 0, avg_marks: 0, assignments: 0, risk: 'Low', trend: 'Stable',
        password: form.password, // Include password for user account creation
      });
      navigate('/admin/students');
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Layout role="admin" breadcrumbs={['Admin', 'Students', 'Add Student']}>
      <div className="p-6 max-w-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">Add New Student</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Step {step + 1} of {steps.length}: {steps[step]}</p>
          </div>
          <button onClick={() => navigate('/admin/students')} className="text-xs text-[#6B7280] hover:text-[#111827]">✕ Cancel</button>
        </div>

        <div className="flex items-center mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-[#1E3A5F]' : 'text-[#9CA3AF]'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  i < step ? 'bg-[#1E3A5F] text-white' : i === step ? 'border-2 border-[#1E3A5F] text-[#1E3A5F]' : 'border border-[#D1D5DB] text-[#9CA3AF]'
                }`}>{i < step ? '✓' : i + 1}</div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-[#1E3A5F]' : 'bg-[#E5E7EB]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded p-5">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#374151] mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'First Name', key: 'firstName', placeholder: 'Arjun', required: true },
                  { label: 'Last Name', key: 'lastName', placeholder: 'Sharma', required: true },
                  { label: 'Email Address', key: 'email', placeholder: 'arjun@college.edu', required: true },
                  { label: 'Phone Number', key: 'phone', placeholder: '+91 98765 43210' },
                  { label: 'Date of Birth', key: 'dob', type: 'date' },
                  { label: 'Password (for login)', key: 'password', placeholder: 'student123', type: 'text', required: true },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                    <input type={(f as any).type || 'text'} value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)}
                      placeholder={(f as any).placeholder}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Gender</label>
                  <select value={form.gender} onChange={e => update('gender', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">Address</label>
                <textarea value={form.address} onChange={e => update('address', e.target.value)} rows={2}
                  placeholder="23, Main Street, Chennai, Tamil Nadu - 600001"
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] resize-none" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#374151] mb-4">Academic Assignment</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1.5">Department <span className="text-red-500">*</span></label>
                  {departments.length === 0 ? (
                    <div className="w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50 rounded text-amber-700">
                      Loading departments...
                    </div>
                  ) : (
                    <select value={form.dept} onChange={e => update('dept', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  )}
                </div>
                {[
                  { label: 'Program', key: 'program', options: ['B.Tech', 'M.Tech', 'MCA', 'MBA'] },
                  { label: 'Year', key: 'year', options: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
                  { label: 'Semester', key: 'semester', options: ['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8'] },
                  { label: 'Division', key: 'division', options: ['Div A', 'Div B', 'Div C'] },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-[#374151] mb-1.5">{field.label} <span className="text-red-500">*</span></label>
                    <select value={(form as any)[field.key]} onChange={e => update(field.key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#1E3A5F] text-[#374151]">
                      {field.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-sm font-semibold text-[#374151] mb-4">Review & Confirm</h2>
              <div className="space-y-4">
                <div className="border border-[#E5E7EB] rounded p-4">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Personal Info</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-[#6B7280]">Name: </span><span className="font-medium">{form.firstName} {form.lastName}</span></div>
                    <div><span className="text-[#6B7280]">Email: </span><span className="font-medium">{form.email || '—'}</span></div>
                    <div><span className="text-[#6B7280]">Phone: </span><span className="font-medium">{form.phone || '—'}</span></div>
                    <div><span className="text-[#6B7280]">Gender: </span><span className="font-medium">{form.gender}</span></div>
                  </div>
                </div>
                <div className="border border-[#E5E7EB] rounded p-4">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Academic Assignment</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-[#6B7280]">Department: </span><span className="font-medium">{form.dept}</span></div>
                    <div><span className="text-[#6B7280]">Program: </span><span className="font-medium">{form.program}</span></div>
                    <div><span className="text-[#6B7280]">Year / Sem: </span><span className="font-medium">{form.year} · {form.semester}</span></div>
                    <div><span className="text-[#6B7280]">Division: </span><span className="font-medium">{form.division}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/admin/students')}
            className="px-4 py-2 text-sm border border-[#E5E7EB] rounded bg-white text-[#374151] hover:bg-[#F9FAFB]">
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          <button onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : saveStudent()} disabled={saving}
            className="px-4 py-2 text-sm bg-[#1E3A5F] text-white rounded hover:bg-[#162D4A] disabled:opacity-60">
            {step === steps.length - 1 ? (saving ? 'Saving…' : 'Save Student') : 'Continue →'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
