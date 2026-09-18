import {
  AuthResponse,
  User,
  Course,
  AcademicClass,
  Assignment,
  AssignmentSubmission,
  AssignmentMatrixResponse,
  NewStudentPayload,
  BulkImportStudent,
  Examination,
  ExaminationResult,
  AttendanceSummary,
  AttendanceRecord,
  InsightObject,
  WhatIfRequest,
  WhatIfResponse,
  AICopilotResponse,
  Intervention,
  Notification,
  AuditLog,
  AdminAnalyticsKPIs
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('aura_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'API request failed';
    try {
      const err = await res.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch {
      errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse<AuthResponse>(res);
  },

  async demoLogin(role: string, id?: number): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, id })
    });
    return handleResponse<AuthResponse>(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ user: User }>(res);
  },

  // Users
  async getStudents(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users/students`);
    return handleResponse<User[]>(res);
  },

  async createStudent(data: NewStudentPayload): Promise<User> {
    const res = await fetch(`${API_BASE}/users/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<User>(res);
  },

  async bulkImportStudents(students: BulkImportStudent[]): Promise<{ message: string; count: number; students: User[] }> {
    const res = await fetch(`${API_BASE}/users/students/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ students })
    });
    return handleResponse<any>(res);
  },

  async deleteStudent(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/users/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  async resetCohortDefaults(): Promise<any> {
    const res = await fetch(`${API_BASE}/users/students/reset-defaults`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  async getTeachers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users/teachers`);
    return handleResponse<User[]>(res);
  },

  // Intelligence
  async getStudentIntelligence(studentId: number): Promise<InsightObject> {
    const res = await fetch(`${API_BASE}/intelligence/student/${studentId}`);
    return handleResponse<InsightObject>(res);
  },

  async runWhatIf(request: WhatIfRequest): Promise<WhatIfResponse> {
    const res = await fetch(`${API_BASE}/intelligence/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return handleResponse<WhatIfResponse>(res);
  },

  async askAICopilot(studentId: number, question: string): Promise<AICopilotResponse> {
    const res = await fetch(`${API_BASE}/intelligence/ai-copilot/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    return handleResponse<AICopilotResponse>(res);
  },

  async getTeacherRadar(): Promise<{
    all: any[];
    buckets: { critical: any[]; high: any[]; moderate: any[]; low: any[] };
    counts: { total: number; critical: number; high: number; moderate: number; low: number };
  }> {
    const res = await fetch(`${API_BASE}/intelligence/radar`);
    return handleResponse<any>(res);
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    const res = await fetch(`${API_BASE}/courses`);
    return handleResponse<Course[]>(res);
  },

  async getCourse(id: number): Promise<Course & { assignments: Assignment[]; examinations: Examination[] }> {
    const res = await fetch(`${API_BASE}/courses/${id}`);
    return handleResponse<any>(res);
  },

  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData)
    });
    return handleResponse<Course>(res);
  },

  async enrollCourse(courseId: number, studentId?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ student_id: studentId })
    });
    return handleResponse<any>(res);
  },

  // Classes
  async getClasses(): Promise<AcademicClass[]> {
    const res = await fetch(`${API_BASE}/classes`);
    return handleResponse<AcademicClass[]>(res);
  },

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    const res = await fetch(`${API_BASE}/assignments`);
    return handleResponse<Assignment[]>(res);
  },

  async createAssignment(data: {
    title: string;
    description: string;
    course_id: number;
    due_date?: string;
    max_marks?: number;
  }): Promise<Assignment> {
    const res = await fetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Assignment>(res);
  },

  async deleteAssignment(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/assignments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  async getAssignmentSubmissionsMatrix(assignmentId: number): Promise<AssignmentMatrixResponse> {
    const res = await fetch(`${API_BASE}/assignments/${assignmentId}/submissions-matrix`);
    return handleResponse<AssignmentMatrixResponse>(res);
  },

  async getStudentAssignments(studentId: number): Promise<Assignment[]> {
    const res = await fetch(`${API_BASE}/assignments/student/${studentId}`);
    return handleResponse<Assignment[]>(res);
  },

  async submitAssignment(assignmentId: number, submissionText: string, studentId?: number): Promise<AssignmentSubmission> {
    const res = await fetch(`${API_BASE}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ submission_text: submissionText, student_id: studentId })
    });
    return handleResponse<AssignmentSubmission>(res);
  },

  async gradeAssignment(submissionId: number, marks: number, feedback: string): Promise<AssignmentSubmission> {
    const res = await fetch(`${API_BASE}/assignments/submissions/${submissionId}/grade`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ marks, feedback })
    });
    return handleResponse<AssignmentSubmission>(res);
  },

  // Attendance
  async getAttendanceSummary(studentId: number): Promise<AttendanceSummary> {
    const res = await fetch(`${API_BASE}/attendance/student/${studentId}/summary`);
    return handleResponse<AttendanceSummary>(res);
  },

  async getAttendanceRecords(studentId: number): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE}/attendance/student/${studentId}/records`);
    return handleResponse<AttendanceRecord[]>(res);
  },

  async recordAttendance(courseId: number, sessions: { student_id: number; status: string }[], date?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/attendance/record`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course_id: courseId, sessions, date })
    });
    return handleResponse<any>(res);
  },

  // Examinations
  async getExaminations(): Promise<Examination[]> {
    const res = await fetch(`${API_BASE}/examinations`);
    return handleResponse<Examination[]>(res);
  },

  async getStudentExamResults(studentId: number): Promise<ExaminationResult[]> {
    const res = await fetch(`${API_BASE}/examinations/student/${studentId}/results`);
    return handleResponse<ExaminationResult[]>(res);
  },

  async recordExamResult(examinationId: number, studentId: number, marks: number): Promise<ExaminationResult> {
    const res = await fetch(`${API_BASE}/examinations/results`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ examination_id: examinationId, student_id: studentId, marks })
    });
    return handleResponse<ExaminationResult>(res);
  },

  // Interventions
  async getInterventions(): Promise<Intervention[]> {
    const res = await fetch(`${API_BASE}/interventions`);
    return handleResponse<Intervention[]>(res);
  },

  async getStudentInterventions(studentId: number): Promise<Intervention[]> {
    const res = await fetch(`${API_BASE}/interventions/student/${studentId}`);
    return handleResponse<Intervention[]>(res);
  },

  async createIntervention(data: Partial<Intervention>): Promise<Intervention> {
    const res = await fetch(`${API_BASE}/interventions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Intervention>(res);
  },

  async updateInterventionStatus(id: number, status: string, outcome?: string): Promise<Intervention> {
    const res = await fetch(`${API_BASE}/interventions/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, outcome })
    });
    return handleResponse<Intervention>(res);
  },

  async addInterventionCheckpoint(id: number, title: string, notes: string, completed: boolean): Promise<Intervention> {
    const res = await fetch(`${API_BASE}/interventions/${id}/checkpoints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, notes, completed })
    });
    return handleResponse<Intervention>(res);
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders()
    });
    return handleResponse<Notification[]>(res);
  },

  async markNotificationRead(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  async markAllNotificationsRead(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AuditLog[]>(res);
  },

  // Reports
  async getAnalytics(): Promise<{
    kpis: AdminAnalyticsKPIs;
    riskDistribution: { name: string; value: number; color: string }[];
    departmentComparison: any[];
  }> {
    const res = await fetch(`${API_BASE}/reports/analytics`);
    return handleResponse<any>(res);
  },

  async exportReportCSV(): Promise<Blob> {
    const res = await fetch(`${API_BASE}/reports/export-csv`);
    return res.blob();
  }
};
