const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export type AuthUser = { id: string; email: string; role: 'admin' | 'faculty' | 'student'; name: string; studentId?: string };

export function getUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem('saa_user') || 'null'); } catch { return null; }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('saa_token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).error || 'Request failed');
  return body as T;
}

export async function download(path: string, filename: string) {
  const token = localStorage.getItem('saa_token');
  const response = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as any).error || 'Download failed');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function login(email: string, password: string, role: AuthUser['role']) {
  const result = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, role }) });
  localStorage.setItem('saa_token', result.token);
  localStorage.setItem('saa_user', JSON.stringify(result.user));
  return result.user;
}

export function logout() { localStorage.removeItem('saa_token'); localStorage.removeItem('saa_user'); }

// Generic helpers
export function get<T>(path: string) { return apiFetch<T>(path); }
export function post<T>(path: string, body: unknown) { return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }); }
export function patch<T>(path: string, body: unknown) { return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }); }

// Legacy compat
export function createRecord<T>(resource: string, payload: unknown) { return post<T>(`/${resource}`, payload); }
export function updateRecord<T>(resource: string, id: string, payload: unknown) { return patch<T>(`/${resource}/${id}`, payload); }
export function listRecords<T>(resource: string, query = '') { return get<T[]>(`/${resource}${query}`); }

// ── Typed API calls ──────────────────────────────────────────

export const api = {
  // Auth
  login,
  logout,
  changePassword: (userId: string, oldPassword: string, newPassword: string) => 
    post<{ success: boolean; message: string }>('/auth/change-password', { userId, oldPassword, newPassword }),
  resetPassword: (email: string, newPassword: string) => 
    post<{ success: boolean; message: string }>('/auth/reset-password', { email, newPassword }),
  syncUsers: () => 
    post<{ success: boolean; studentsProcessed: number; studentsCreated: number; studentsUpdated: number; facultyProcessed: number; facultyCreated: number; facultyUpdated: number; errors: string[] }>('/auth/sync-users', {}),

  // Dashboard
  dashboard: (role: string) => get<any>(`/dashboard/${role}`),

  // Students
  students: {
    list: (params?: Record<string,string>) => get<any[]>(`/students${params ? '?' + new URLSearchParams(params) : ''}`),
    get: (id: string) => get<any>(`/students/${id}`),
    create: (body: any) => post<any>('/students', body),
    update: (id: string, body: any) => patch<any>(`/students/${id}`, body),
    risk: (id: string) => get<any>(`/students/${id}/risk`),
    performance: (id: string) => get<any>(`/students/${id}/performance`),
  },

  // Faculty
  faculty: {
    list: (params?: Record<string,string>) => get<any[]>(`/faculty${params ? '?' + new URLSearchParams(params) : ''}`),
    get: (id: string) => get<any>(`/faculty/${id}`),
    create: (body: any) => post<any>('/faculty', body),
    update: (id: string, body: any) => patch<any>(`/faculty/${id}`, body),
  },

  // Departments
  departments: {
    list: () => get<any[]>('/departments'),
    create: (body: any) => post<any>('/departments', body),
    update: (id: string, body: any) => patch<any>(`/departments/${id}`, body),
  },

  // Subjects
  subjects: {
    list: (params?: Record<string,string>) => get<any[]>(`/subjects${params ? '?' + new URLSearchParams(params) : ''}`),
    create: (body: any) => post<any>('/subjects', body),
    update: (id: string, body: any) => patch<any>(`/subjects/${id}`, body),
  },

  // Academic Years
  academicYears: {
    list: () => get<any[]>('/academic-years'),
    create: (body: any) => post<any>('/academic-years', body),
    createSemester: (body: any) => post<any>('/semesters', body),
    updateSemester: (id: string, body: any) => patch<any>(`/semesters/${id}`, body),
  },

  // Classes
  classes: {
    list: (params?: Record<string,string>) => get<any[]>(`/classes${params ? '?' + new URLSearchParams(params) : ''}`),
    create: (body: any) => post<any>('/classes', body),
    update: (id: string, body: any) => patch<any>(`/classes/${id}`, body),
  },

  // Attendance
  attendance: {
    list: (params?: Record<string,string>) => get<any[]>(`/attendance${params ? '?' + new URLSearchParams(params) : ''}`),
    bulk: (records: any[]) => post<any[]>('/attendance/bulk', records),
    create: (body: any) => post<any>('/attendance', body),
    update: (id: string, body: any) => patch<any>(`/attendance/${id}`, body),
  },

  // Marks
  marks: {
    list: (params?: Record<string,string>) => get<any[]>(`/marks${params ? '?' + new URLSearchParams(params) : ''}`),
    bulk: (records: any[]) => post<any[]>('/marks/bulk', records),
    create: (body: any) => post<any>('/marks', body),
    update: (id: string, body: any) => patch<any>(`/marks/${id}`, body),
  },

  // Assignments
  assignments: {
    list: (params?: Record<string,string>) => get<any[]>(`/assignments${params ? '?' + new URLSearchParams(params) : ''}`),
    create: (body: any) => post<any>('/assignments', body),
    update: (id: string, body: any) => patch<any>(`/assignments/${id}`, body),
  },

  // Assignment Submissions
  submissions: {
    list: (params?: Record<string,string>) => get<any[]>(`/assignment-submissions${params ? '?' + new URLSearchParams(params) : ''}`),
    update: (id: string, body: any) => patch<any>(`/assignment-submissions/${id}`, body),
  },

  // Interventions
  interventions: {
    list: (params?: Record<string,string>) => get<any[]>(`/interventions${params ? '?' + new URLSearchParams(params) : ''}`),
    create: (body: any) => post<any>('/interventions', body),
    update: (id: string, body: any) => patch<any>(`/interventions/${id}`, body),
  },

  // Notifications
  notifications: {
    list: (params?: Record<string,string>) => get<any[]>(`/notifications${params ? '?' + new URLSearchParams(params) : ''}`),
    markRead: (id: string) => patch<any>(`/notifications/${id}`, { read: true }),
    markAllRead: (user_id: string) => patch<any>('/notifications/mark-all-read', { user_id }),
  },

  // Trends
  institutionTrend: (academic_year?: string) => get<any[]>(`/institution-trend${academic_year ? '?academic_year=' + academic_year : ''}`),
  performanceTrend: (student_id: string) => get<any[]>(`/performance-trend?student_id=${student_id}`),

  // Reports
  reports: (params: Record<string,string>) => get<any>(`/reports?${new URLSearchParams(params)}`),
  downloadReport: (params: Record<string,string>, filename: string) => download(`/reports/download?${new URLSearchParams(params)}`, filename),
};
