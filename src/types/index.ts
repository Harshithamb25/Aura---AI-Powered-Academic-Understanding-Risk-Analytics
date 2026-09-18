export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: string;
  year?: number;
  created_at: string;
  password_hash?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  description: string;
  department: string;
  teacher_id: number;
  teacher_name?: string;
  credits: number;
  semester: number;
  schedule: string;
  room: string;
  capacity: number;
  enrolled_count?: number;
  syllabus?: string[];
  status?: string;
}

export interface AcademicClass {
  id: number;
  name: string;
  course_id: number;
  course_name?: string;
  teacher_id: number;
  teacher_name?: string;
  room: string;
  schedule: string;
  semester: string;
  status: string;
}

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  course?: Course;
  status: string;
  enrolled_at: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  course_id: number;
  date: string;
  session: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  recorded_by?: number;
  timestamp?: string;
}

export interface AttendanceSummary {
  student_id: number;
  total_sessions: number;
  attended_sessions: number;
  attendance_percentage: number;
  threshold_percentage: number;
  buffer_sessions: number;
  status: 'safe' | 'warning' | 'critical';
  explanation: string;
  course_breakdown?: {
    course_id: number;
    course_name: string;
    course_code: string;
    attended: number;
    total: number;
    percentage: number;
    buffer: number;
  }[];
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_name?: string;
  course_code?: string;
  teacher_id: number;
  due_date: string;
  max_marks: number;
  status: 'active' | 'closed';
  submission?: AssignmentSubmission;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name?: string;
  submitted_at: string;
  submission_text: string;
  status: 'submitted' | 'graded' | 'late';
  marks?: number;
  feedback?: string;
}

export interface Examination {
  id: number;
  title: string;
  course_id: number;
  course_name?: string;
  course_code?: string;
  exam_date: string;
  duration_minutes: number;
  max_marks: number;
  weightage_percentage?: number;
}

export interface ExaminationResult {
  id: number;
  examination_id: number;
  examination_title?: string;
  course_id?: number;
  course_name?: string;
  student_id: number;
  student_name?: string;
  marks: number;
  max_marks: number;
  percentage: number;
  grade: string;
}

export interface AcademicRecord {
  id: number;
  student_id: number;
  course_id: number;
  course_name?: string;
  attendance_score: number;
  assignment_score: number;
  examination_score: number;
  previous_score: number;
  current_score: number;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface RiskSignalBreakdown {
  attendance_risk: number;
  assignment_risk: number;
  examination_risk: number;
  trend_risk: number;
  attendance_contribution: number;
  assignment_contribution: number;
  examination_contribution: number;
  trend_contribution: number;
}

export interface RiskEvidence {
  attendance: {
    observed: number;
    threshold: number;
    sessions_attended: number;
    total_sessions: number;
    buffer: number;
    status: string;
  };
  assignments: {
    observed: number;
    total_assigned: number;
    submitted: number;
    pending: number;
    overdue: number;
  };
  examinations: {
    observed: number;
    exams_taken: number;
    lowest_exam: string;
    lowest_score: number;
  };
  trend: {
    direction: 'improving' | 'stable' | 'declining' | 'volatile';
    previous_score: number;
    current_score: number;
    change: number;
  };
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: RiskLevel;
  explanation: string;
  primary_factor: string;
  signals: RiskSignalBreakdown;
  evidence: RiskEvidence;
  contributing_factors: string[];
}

export interface TrendAnalysis {
  previous_score: number;
  current_score: number;
  change: number;
  percentage_change: number;
  direction: 'strong_improvement' | 'improvement' | 'stable' | 'decline' | 'significant_decline';
}

export interface Recommendation {
  id?: number;
  category: 'Attendance' | 'Assignments' | 'Examinations' | 'Performance Trend' | 'Overall' | 'Course Focus';
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  evidence: string;
  recommended_action: string;
  expected_impact: string;
  deadline?: string;
}

export type InterventionStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CLOSED';

export interface InterventionCheckpoint {
  id: string;
  date: string;
  title: string;
  notes: string;
  completed: boolean;
}

export interface Intervention {
  id: number;
  student_id: number;
  student_name?: string;
  teacher_id: number;
  teacher_name?: string;
  course_id?: number;
  course_name?: string;
  title: string;
  risk_source: string;
  recommendation: string;
  action: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  start_date: string;
  target_date: string;
  status: InterventionStatus;
  checkpoints: InterventionCheckpoint[];
  outcome?: string;
  baseline_risk?: number;
  post_risk?: number;
  impact_score?: number;
  created_at: string;
}

export interface WhatIfRequest {
  student_id: number;
  target_exam_score?: number;
  projected_attendance?: number;
  projected_assignment_score?: number;
}

export interface WhatIfResponse {
  current_overall: number;
  projected_overall: number;
  current_risk: number;
  projected_risk: number;
  current_risk_level: RiskLevel;
  projected_risk_level: RiskLevel;
  risk_change: number;
  target_exam_score: number;
  projected_attendance: number;
  projected_assignment_score: number;
  breakdown: {
    attendance: { current: number; projected: number };
    assignments: { current: number; projected: number };
    examinations: { current: number; projected: number };
  };
  disclaimer: string;
}

export interface InsightObject {
  student: {
    id: number;
    name: string;
    email: string;
    department: string;
    year?: number;
  };
  attendance: {
    percentage: number;
    attended: number;
    total: number;
    buffer: number;
  };
  assignments: {
    average: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  examinations: {
    average: number;
    count: number;
    results: {
      exam_title: string;
      percentage: number;
      grade: string;
    }[];
  };
  overall_score: number;
  risk: RiskAssessment;
  trend: TrendAnalysis;
  weak_subjects: {
    course_name: string;
    course_code: string;
    score: number;
    issue: string;
  }[];
  recommendations: Recommendation[];
  interventions: Intervention[];
}

export interface AICopilotResponse {
  question: string;
  answer: string;
  is_ai_generated: boolean;
  generated_at: string;
  insight_summary: {
    student_name: string;
    risk_level: string;
    risk_score: number;
    trend: string;
  };
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'risk_alert' | 'attendance_warning' | 'assignment_due' | 'exam_result' | 'intervention_assigned' | 'system';
  priority: 'urgent' | 'normal';
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  user_role: Role;
  action: string;
  entity: string;
  entity_id?: number | string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AdminAnalyticsKPIs {
  total_students: number;
  total_teachers: number;
  total_courses: number;
  active_classes: number;
  average_attendance: number;
  average_performance: number;
  high_risk_students: number;
  critical_risk_students: number;
  improving_students: number;
  declining_students: number;
  assignment_completion_rate: number;
  intervention_success_rate: number;
}

export interface AssignmentSubmissionMatrixItem {
  student_id: number;
  student_name: string;
  email: string;
  department: string;
  year: number;
  status: 'submitted' | 'pending' | 'overdue';
  submitted_at: string | null;
  submission_text: string | null;
  marks: number | null;
  max_marks: number;
  feedback: string | null;
  submission_id: number | null;
}

export interface AssignmentMatrixResponse {
  assignment: Assignment;
  metrics: {
    total_students: number;
    submitted_count: number;
    pending_count: number;
    overdue_count: number;
    completion_percentage: number;
    average_score: number;
  };
  students: AssignmentSubmissionMatrixItem[];
}

export interface NewStudentPayload {
  name: string;
  email: string;
  department: string;
  year: number;
  attendance_pct?: number;
  exam_score?: number;
}

export interface BulkImportStudent {
  name: string;
  email: string;
  department: string;
  year: number;
  attendance_pct?: number;
  exam_score?: number;
}
