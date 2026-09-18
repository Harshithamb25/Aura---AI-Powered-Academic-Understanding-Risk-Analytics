import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { getInitialSeedData } from "./server/data/seedData";
import {
  calculateExplainableRisk,
  calculateAttendanceBuffer,
  analyzeTrend,
  generateRecommendations,
  simulateWhatIf,
  generateAICopilotResponse
} from "./server/intelligence/engine";
import {
  User,
  Course,
  AcademicClass,
  Enrollment,
  Assignment,
  AssignmentSubmission,
  Examination,
  ExaminationResult,
  AttendanceRecord,
  Intervention,
  Notification,
  AuditLog,
  InsightObject
} from "./src/types";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "aura_jwt_secret_buildathon_2026_grand_finale";
const PORT = 3000;

// Initialize Database State
const db = getInitialSeedData();

// Audit log helper
function logAuditEvent(userId: number, userName: string, userRole: any, action: string, entity: string, entityId?: number | string, metadata?: any) {
  const newLog: AuditLog = {
    id: db.auditLogs.length + 1,
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action,
    entity,
    entity_id: entityId,
    timestamp: new Date().toISOString(),
    metadata
  };
  db.auditLogs.unshift(newLog);
}

// Student baseline initialization helper for user-created / CSV-imported datasets
function registerStudentWithBaseline(data: {
  name: string;
  email: string;
  department: string;
  year?: number;
  attendance_pct?: number;
  exam_score?: number;
}) {
  const nextId = Math.max(...db.users.map(u => u.id), 0) + 1;
  const newStudent: User & { password_hash: string } = {
    id: nextId,
    name: data.name,
    email: data.email,
    password_hash: bcrypt.hashSync("student123", 10),
    role: "STUDENT",
    department: data.department || "Computer Science",
    year: Number(data.year) || 2,
    created_at: new Date().toISOString()
  };
  db.users.push(newStudent);

  // Enroll in relevant courses (by department or first 2 courses)
  const matchingCourses = db.courses.filter(c => c.department.toLowerCase() === newStudent.department.toLowerCase());
  const coursesToEnroll = matchingCourses.length > 0 ? matchingCourses : db.courses.slice(0, 2);
  coursesToEnroll.forEach(c => {
    if (!db.enrollments.some(e => e.course_id === c.id && e.student_id === newStudent.id)) {
      db.enrollments.push({
        id: db.enrollments.length + 1,
        course_id: c.id,
        student_id: newStudent.id,
        status: "active",
        enrolled_at: new Date().toISOString()
      });
    }
  });

  // Generate baseline attendance records (30 sessions)
  const targetAttPct = data.attendance_pct !== undefined ? Number(data.attendance_pct) : 85;
  const sessionCount = 30;
  const presentCount = Math.round((targetAttPct / 100) * sessionCount);
  const primaryCourseId = coursesToEnroll[0]?.id || 1;

  for (let i = 0; i < sessionCount; i++) {
    const isPresent = i < presentCount;
    const d = new Date();
    d.setDate(d.getDate() - (sessionCount - i));
    db.attendanceRecords.push({
      id: db.attendanceRecords.length + 1,
      student_id: newStudent.id,
      course_id: primaryCourseId,
      session: `Lecture Session ${i + 1}`,
      date: d.toISOString().split("T")[0],
      status: isPresent ? "present" : "absent"
    });
  }

  // Generate baseline exam results
  const targetExamPct = data.exam_score !== undefined ? Number(data.exam_score) : 75;
  const examsToGrade = db.examinations.filter(e => coursesToEnroll.some(c => c.id === e.course_id));
  (examsToGrade.length > 0 ? examsToGrade : db.examinations.slice(0, 2)).forEach(ex => {
    const marks = Math.round((targetExamPct / 100) * ex.max_marks);
    const grade = targetExamPct >= 85 ? "A" : targetExamPct >= 70 ? "B" : targetExamPct >= 55 ? "C" : "F";
    db.examResults.push({
      id: db.examResults.length + 1,
      examination_id: ex.id,
      examination_title: ex.title,
      course_id: ex.course_id,
      course_name: ex.course_name,
      student_id: newStudent.id,
      student_name: newStudent.name,
      marks,
      max_marks: ex.max_marks,
      percentage: targetExamPct,
      grade
    });
  });

  return newStudent;
}

// Student Intelligence Computation Helper
export function computeStudentIntelligence(studentId: number) {
  const student = db.users.find(u => u.id === studentId && u.role === "STUDENT");
  if (!student) return null;

  // 1. Attendance Metrics
  const attRecords = db.attendanceRecords.filter(r => r.student_id === studentId);
  const totalSessions = attRecords.length;
  const attendedSessions = attRecords.filter(r => r.status === 'present').length;
  const attendancePercentage = totalSessions > 0 ? Number(((attendedSessions / totalSessions) * 100).toFixed(1)) : 100;
  const bufferObj = calculateAttendanceBuffer(attendedSessions, totalSessions, 75);

  // 2. Assignment Metrics
  const submissions = db.assignmentSubmissions.filter(s => s.student_id === studentId);
  const gradedSubmissions = submissions.filter(s => typeof s.marks === 'number');
  const assignmentAvg = gradedSubmissions.length > 0
    ? Number((gradedSubmissions.reduce((acc, cur) => acc + (cur.marks || 0), 0) / gradedSubmissions.length).toFixed(1))
    : 70;
  const overdueCount = submissions.filter(s => s.status === 'late').length;

  // 3. Examination Metrics
  const examRes = db.examResults.filter(e => e.student_id === studentId);
  const examAvg = examRes.length > 0
    ? Number((examRes.reduce((acc, cur) => acc + cur.percentage, 0) / examRes.length).toFixed(1))
    : 70;

  // Baseline previous score for trend analysis
  let previousScore = examAvg;
  if (studentId === 3) previousScore = 70.0; // Rahul: had 70, now 52 (Declining)
  else if (studentId === 6) previousScore = 67.0; // Neha: had 67, now 81 (Improving)
  else if (studentId === 7) previousScore = 58.0; // Rohan: was 58, now 38 (Critical drop)
  else if (studentId === 1) previousScore = 86.0; // Aarav: +5 trend

  // Current component composite: 30% attendance + 20% assignments + 50% exams
  const currentComposite = Number((attendancePercentage * 0.30 + assignmentAvg * 0.20 + examAvg * 0.50).toFixed(1));

  // Risk computation
  const risk = calculateExplainableRisk(
    attendancePercentage,
    assignmentAvg,
    examAvg,
    previousScore,
    currentComposite,
    { attended: attendedSessions, total: totalSessions },
    { total: db.assignments.length, submitted: submissions.length, overdue: overdueCount }
  );

  // Trend computation
  const trend = analyzeTrend(previousScore, currentComposite);

  // Recommendations
  const recommendations = generateRecommendations(
    attendancePercentage,
    assignmentAvg,
    examAvg,
    previousScore,
    currentComposite,
    { attended: attendedSessions, total: totalSessions }
  );

  // Weak subject identification
  const weakSubjects = examRes
    .filter(er => er.percentage < 60)
    .map(er => {
      const exam = db.examinations.find(e => e.id === er.examination_id);
      const course = exam ? db.courses.find(c => c.id === exam.course_id) : null;
      return {
        course_name: course ? course.name : "Core Assessment",
        course_code: course ? course.code : "GEN-100",
        score: er.percentage,
        issue: er.percentage < 45 ? "Critical deficit in algorithmic formulation" : "Below passing benchmark"
      };
    });

  // Interventions for this student
  const studentInterventions = db.interventions.filter(i => i.student_id === studentId);

  const insight: InsightObject = {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      department: student.department,
      year: student.year
    },
    attendance: {
      percentage: attendancePercentage,
      attended: attendedSessions,
      total: totalSessions,
      buffer: bufferObj.buffer_sessions
    },
    assignments: {
      average: assignmentAvg,
      completed: submissions.length,
      pending: Math.max(0, db.assignments.length - submissions.length),
      overdue: overdueCount
    },
    examinations: {
      average: examAvg,
      count: examRes.length,
      results: examRes.map(r => ({
        exam_title: db.examinations.find(e => e.id === r.examination_id)?.title || "Course Exam",
        percentage: r.percentage,
        grade: r.grade
      }))
    },
    overall_score: currentComposite,
    risk,
    trend,
    weak_subjects: weakSubjects,
    recommendations,
    interventions: studentInterventions
  };

  return insight;
}

// Authentication Middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ detail: "Authentication token required" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(403).json({ detail: "Invalid or expired token" });
  }
}

// Role Guard Middleware
function requireRole(allowedRoles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ detail: `Access denied. Requires one of: ${allowedRoles.join(", ")}` });
    }
    next();
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ---------------------------------------------------------
  // SYSTEM & HEALTH ENDPOINTS
  // ---------------------------------------------------------
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      database: "connected",
      service: "AURA Academic Intelligence API",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      database: "connected",
      service: "AURA Academic Intelligence API"
    });
  });

  // ---------------------------------------------------------
  // AUTHENTICATION ROUTES
  // ---------------------------------------------------------
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password are required" });
    }

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ detail: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logAuditEvent(user.id, user.name, user.role, "LOGIN", "Auth", user.id, { method: "Password" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        created_at: user.created_at
      }
    });
  });

  app.post("/api/auth/demo-login", (req, res) => {
    const { role, id } = req.body;
    let user: any = null;

    if (id) {
      user = db.users.find(u => u.id === Number(id));
    } else if (role === "STUDENT") {
      user = db.users.find(u => u.role === "STUDENT");
    } else if (role === "TEACHER") {
      user = db.users.find(u => u.role === "TEACHER");
    } else if (role === "ADMIN") {
      user = db.users.find(u => u.role === "ADMIN");
    }

    if (!user) {
      return res.status(404).json({ detail: "Demo profile not found" });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logAuditEvent(user.id, user.name, user.role, "DEMO_LOGIN", "Auth", user.id, { role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        created_at: user.created_at
      }
    });
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    const authUser = (req as any).user;
    const user = db.users.find(u => u.id === authUser.id);
    if (!user) return res.status(404).json({ detail: "User not found" });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        created_at: user.created_at
      }
    });
  });

  // ---------------------------------------------------------
  // USERS
  // ---------------------------------------------------------
  app.get("/api/users", (req, res) => {
    const sanitized = db.users.map(({ password_hash, ...rest }) => rest);
    res.json(sanitized);
  });

  app.get("/api/users/students", (req, res) => {
    const students = db.users
      .filter(u => u.role === "STUDENT")
      .map(({ password_hash, ...rest }) => rest);
    res.json(students);
  });

  // Register / Add a single Student
  app.post("/api/users/students", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { name, email, department, year, attendance_pct, exam_score } = req.body;
    if (!name || !email) {
      return res.status(400).json({ detail: "Student name and email are required" });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ detail: "A user with this email already exists" });
    }

    const authUser = (req as any).user;
    const newStudent = registerStudentWithBaseline({
      name,
      email,
      department: department || authUser.department || "Computer Science",
      year: Number(year) || 2,
      attendance_pct: attendance_pct !== undefined ? Number(attendance_pct) : 85,
      exam_score: exam_score !== undefined ? Number(exam_score) : 75
    });

    logAuditEvent(authUser.id, authUser.name, authUser.role, "ADD_STUDENT", "User", newStudent.id, {
      name: newStudent.name,
      email: newStudent.email
    });

    const { password_hash, ...sanitized } = newStudent;
    res.status(201).json(sanitized);
  });

  // Bulk Import Students from CSV / JSON dataset
  app.post("/api/users/students/bulk", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ detail: "Array of student records required" });
    }

    const authUser = (req as any).user;
    const created: any[] = [];
    let skipped = 0;

    for (const item of students) {
      if (!item.name || !item.email) {
        skipped++;
        continue;
      }
      const existing = db.users.find(u => u.email.toLowerCase() === item.email.toLowerCase());
      if (existing) {
        skipped++;
        continue;
      }

      const st = registerStudentWithBaseline({
        name: item.name,
        email: item.email,
        department: item.department || authUser.department || "Computer Science",
        year: Number(item.year) || 2,
        attendance_pct: item.attendance_pct !== undefined ? Number(item.attendance_pct) : 85,
        exam_score: item.exam_score !== undefined ? Number(item.exam_score) : 75
      });
      const { password_hash, ...sanitized } = st;
      created.push(sanitized);
    }

    logAuditEvent(authUser.id, authUser.name, authUser.role, "BULK_IMPORT_STUDENTS", "User", undefined, {
      imported_count: created.length,
      skipped_count: skipped
    });

    res.status(201).json({
      message: `Successfully imported ${created.length} students (${skipped} skipped due to duplicates or invalid records)`,
      count: created.length,
      students: created
    });
  });

  // Delete Student
  app.delete("/api/users/students/:id", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const id = Number(req.params.id);
    const authUser = (req as any).user;
    const index = db.users.findIndex(u => u.id === id && u.role === "STUDENT");
    if (index === -1) {
      return res.status(404).json({ detail: "Student not found" });
    }

    const [deleted] = db.users.splice(index, 1);
    db.enrollments = db.enrollments.filter(e => e.student_id !== id);
    db.attendanceRecords = db.attendanceRecords.filter(r => r.student_id !== id);
    db.assignmentSubmissions = db.assignmentSubmissions.filter(s => s.student_id !== id);
    db.examResults = db.examResults.filter(e => e.student_id !== id);
    db.interventions = db.interventions.filter(i => i.student_id !== id);

    logAuditEvent(authUser.id, authUser.name, authUser.role, "DELETE_STUDENT", "User", id, { name: deleted.name });
    res.json({ message: "Student and associated records removed successfully", student_id: id });
  });

  // Reset to default seed cohort
  app.post("/api/users/students/reset-defaults", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const authUser = (req as any).user;
    const fresh = getInitialSeedData();
    db.users = fresh.users;
    db.courses = fresh.courses;
    db.enrollments = fresh.enrollments;
    db.assignments = fresh.assignments;
    db.assignmentSubmissions = fresh.assignmentSubmissions;
    db.examinations = fresh.examinations;
    db.examResults = fresh.examResults;
    db.attendanceRecords = fresh.attendanceRecords;
    db.interventions = fresh.interventions;

    logAuditEvent(authUser.id, authUser.name, authUser.role, "RESET_COHORT_DEFAULTS", "Cohort", undefined, {});
    res.json({ message: "Academic database reset to canonical 7-student cohort with balanced distributions." });
  });

  app.get("/api/users/teachers", (req, res) => {
    const teachers = db.users
      .filter(u => u.role === "TEACHER")
      .map(({ password_hash, ...rest }) => rest);
    res.json(teachers);
  });

  app.get("/api/users/:id", (req, res) => {
    const user = db.users.find(u => u.id === Number(req.params.id));
    if (!user) return res.status(404).json({ detail: "User not found" });
    const { password_hash, ...sanitized } = user;
    res.json(sanitized);
  });

  // ---------------------------------------------------------
  // COURSES & ENROLLMENT
  // ---------------------------------------------------------
  app.get("/api/courses", (req, res) => {
    const result = db.courses.map(course => {
      const enrollments = db.enrollments.filter(e => e.course_id === course.id);
      return {
        ...course,
        enrolled_count: enrollments.length
      };
    });
    res.json(result);
  });

  app.get("/api/courses/:id", (req, res) => {
    const course = db.courses.find(c => c.id === Number(req.params.id));
    if (!course) return res.status(404).json({ detail: "Course not found" });

    const enrollments = db.enrollments.filter(e => e.course_id === course.id);
    const courseAssignments = db.assignments.filter(a => a.course_id === course.id);
    const courseExams = db.examinations.filter(e => e.course_id === course.id);

    res.json({
      ...course,
      enrolled_count: enrollments.length,
      assignments: courseAssignments,
      examinations: courseExams
    });
  });

  app.post("/api/courses", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { code, name, description, department, credits, semester, schedule, room, capacity, syllabus } = req.body;
    const authUser = (req as any).user;

    const newCourse: Course = {
      id: db.courses.length + 1,
      code: code || `CRS-${100 + db.courses.length}`,
      name,
      description: description || "",
      department: department || authUser.department || "Computer Science",
      teacher_id: authUser.id,
      teacher_name: authUser.name,
      credits: Number(credits) || 3,
      semester: Number(semester) || 1,
      schedule: schedule || "TBA",
      room: room || "Online",
      capacity: Number(capacity) || 60,
      enrolled_count: 0,
      status: "active",
      syllabus: Array.isArray(syllabus) ? syllabus : ["Module 1: Foundations", "Module 2: Applied Analysis"]
    };

    db.courses.push(newCourse);
    logAuditEvent(authUser.id, authUser.name, authUser.role, "CREATE_COURSE", "Course", newCourse.id, { name });
    res.status(201).json(newCourse);
  });

  app.post("/api/courses/:id/enroll", authenticateToken, (req, res) => {
    const courseId = Number(req.params.id);
    const authUser = (req as any).user;
    const studentId = authUser.role === "STUDENT" ? authUser.id : (req.body.student_id || authUser.id);

    const existing = db.enrollments.find(e => e.course_id === courseId && e.student_id === studentId);
    if (existing) {
      return res.status(400).json({ detail: "Already enrolled in this course" });
    }

    const newEnrollment: Enrollment = {
      id: db.enrollments.length + 1,
      student_id: studentId,
      course_id: courseId,
      status: "active",
      enrolled_at: new Date().toISOString()
    };
    db.enrollments.push(newEnrollment);

    logAuditEvent(authUser.id, authUser.name, authUser.role, "ENROLL_COURSE", "Enrollment", newEnrollment.id, { course_id: courseId, student_id: studentId });
    res.status(201).json(newEnrollment);
  });

  // ---------------------------------------------------------
  // ACADEMIC CLASSES
  // ---------------------------------------------------------
  app.get("/api/classes", (req, res) => {
    res.json(db.classes);
  });

  app.post("/api/classes", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { name, course_id, room, schedule, semester } = req.body;
    const authUser = (req as any).user;
    const course = db.courses.find(c => c.id === Number(course_id));

    const newClass: AcademicClass = {
      id: db.classes.length + 1,
      name,
      course_id: Number(course_id),
      course_name: course?.name,
      teacher_id: authUser.id,
      teacher_name: authUser.name,
      room: room || "Hall 1",
      schedule: schedule || "Mon 10am",
      semester: semester || "Fall 2026",
      status: "active"
    };

    db.classes.push(newClass);
    logAuditEvent(authUser.id, authUser.name, authUser.role, "CREATE_CLASS", "AcademicClass", newClass.id, { name });
    res.status(201).json(newClass);
  });

  // ---------------------------------------------------------
  // ASSIGNMENTS & SUBMISSIONS
  // ---------------------------------------------------------
  app.get("/api/assignments", (req, res) => {
    res.json(db.assignments);
  });

  app.get("/api/assignments/student/:id", (req, res) => {
    const studentId = Number(req.params.id);
    const result = db.assignments.map(a => {
      const sub = db.assignmentSubmissions.find(s => s.assignment_id === a.id && s.student_id === studentId);
      return {
        ...a,
        submission: sub || null
      };
    });
    res.json(result);
  });

  app.post("/api/assignments", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { title, description, course_id, due_date, max_marks } = req.body;
    const authUser = (req as any).user;
    const course = db.courses.find(c => c.id === Number(course_id));

    const newAssignment: Assignment = {
      id: db.assignments.length + 1,
      title,
      description: description || "",
      course_id: Number(course_id),
      course_name: course?.name,
      course_code: course?.code,
      teacher_id: authUser.id,
      due_date: due_date || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      max_marks: Number(max_marks) || 100,
      status: "active"
    };

    db.assignments.push(newAssignment);
    logAuditEvent(authUser.id, authUser.name, authUser.role, "CREATE_ASSIGNMENT", "Assignment", newAssignment.id, { title });
    res.status(201).json(newAssignment);
  });

  app.post("/api/assignments/:id/submit", authenticateToken, (req, res) => {
    const assignmentId = Number(req.params.id);
    const authUser = (req as any).user;
    const studentId = authUser.role === "STUDENT" ? authUser.id : (req.body.student_id || authUser.id);
    const { submission_text } = req.body;

    const existingIdx = db.assignmentSubmissions.findIndex(s => s.assignment_id === assignmentId && s.student_id === studentId);
    if (existingIdx >= 0) {
      db.assignmentSubmissions[existingIdx].submission_text = submission_text;
      db.assignmentSubmissions[existingIdx].submitted_at = new Date().toISOString();
      return res.json(db.assignmentSubmissions[existingIdx]);
    }

    const student = db.users.find(u => u.id === studentId);
    const newSub: AssignmentSubmission = {
      id: db.assignmentSubmissions.length + 1,
      assignment_id: assignmentId,
      student_id: studentId,
      student_name: student?.name,
      submitted_at: new Date().toISOString(),
      submission_text: submission_text || "Online response submitted.",
      status: "submitted"
    };

    db.assignmentSubmissions.push(newSub);
    logAuditEvent(authUser.id, authUser.name, authUser.role, "SUBMIT_ASSIGNMENT", "AssignmentSubmission", newSub.id, { assignment_id: assignmentId });
    res.status(201).json(newSub);
  });

  app.post("/api/assignments/submissions/:id/grade", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const subId = Number(req.params.id);
    const { marks, feedback } = req.body;
    const authUser = (req as any).user;

    const sub = db.assignmentSubmissions.find(s => s.id === subId);
    if (!sub) return res.status(404).json({ detail: "Submission not found" });

    sub.marks = Number(marks);
    sub.feedback = feedback || "Graded by instructor.";
    sub.status = "graded";

    logAuditEvent(authUser.id, authUser.name, authUser.role, "GRADE_ASSIGNMENT", "AssignmentSubmission", sub.id, { marks, student_id: sub.student_id });
    res.json(sub);
  });

  // Get full submissions & completion matrix for an assignment across all students
  app.get("/api/assignments/:id/submissions-matrix", (req, res) => {
    const assignmentId = Number(req.params.id);
    const assignment = db.assignments.find(a => a.id === assignmentId);
    if (!assignment) return res.status(404).json({ detail: "Assignment not found" });

    // Students enrolled in this course (or all students in the university if not specified)
    const enrollments = db.enrollments.filter(e => e.course_id === assignment.course_id);
    let enrolledStudents = enrollments.map(e => db.users.find(u => u.id === e.student_id)).filter(Boolean) as User[];
    if (enrolledStudents.length === 0) {
      enrolledStudents = db.users.filter(u => u.role === "STUDENT");
    }

    const isPastDue = new Date(assignment.due_date) < new Date();

    const studentItems = enrolledStudents.map(st => {
      const sub = db.assignmentSubmissions.find(s => s.assignment_id === assignmentId && s.student_id === st.id);
      let status: "submitted" | "pending" | "overdue" = "pending";
      if (sub) {
        status = "submitted";
      } else if (isPastDue) {
        status = "overdue";
      }

      return {
        student_id: st.id,
        student_name: st.name,
        email: st.email,
        department: st.department,
        year: st.year || 2,
        status,
        submitted_at: sub?.submitted_at || null,
        submission_text: sub?.submission_text || null,
        marks: typeof sub?.marks === "number" ? sub.marks : null,
        max_marks: assignment.max_marks,
        feedback: sub?.feedback || null,
        submission_id: sub?.id || null
      };
    });

    const submittedCount = studentItems.filter(s => s.status === "submitted").length;
    const pendingCount = studentItems.filter(s => s.status === "pending").length;
    const overdueCount = studentItems.filter(s => s.status === "overdue").length;
    const gradedSubs = studentItems.filter(s => s.marks !== null);
    const avgScore = gradedSubs.length > 0
      ? Number((gradedSubs.reduce((acc, s) => acc + (s.marks || 0), 0) / gradedSubs.length).toFixed(1))
      : 0;

    res.json({
      assignment,
      metrics: {
        total_students: studentItems.length,
        submitted_count: submittedCount,
        pending_count: pendingCount,
        overdue_count: overdueCount,
        completion_percentage: studentItems.length > 0 ? Math.round((submittedCount / studentItems.length) * 100) : 0,
        average_score: avgScore
      },
      students: studentItems
    });
  });

  // Delete Assignment
  app.delete("/api/assignments/:id", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const id = Number(req.params.id);
    const authUser = (req as any).user;
    const index = db.assignments.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ detail: "Assignment not found" });
    }

    const [deleted] = db.assignments.splice(index, 1);
    db.assignmentSubmissions = db.assignmentSubmissions.filter(s => s.assignment_id !== id);

    logAuditEvent(authUser.id, authUser.name, authUser.role, "DELETE_ASSIGNMENT", "Assignment", id, { title: deleted.title });
    res.json({ message: "Assignment deleted successfully", id });
  });

  // ---------------------------------------------------------
  // ATTENDANCE
  // ---------------------------------------------------------
  app.get("/api/attendance/student/:id/summary", (req, res) => {
    const studentId = Number(req.params.id);
    const records = db.attendanceRecords.filter(r => r.student_id === studentId);
    const total = records.length;
    const attended = records.filter(r => r.status === 'present').length;
    const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 100;
    const buffer = calculateAttendanceBuffer(attended, total, 75);

    // Course breakdown
    const courseMap = new Map<number, { attended: number; total: number }>();
    for (const rec of records) {
      const c = courseMap.get(rec.course_id) || { attended: 0, total: 0 };
      c.total += 1;
      if (rec.status === 'present') c.attended += 1;
      courseMap.set(rec.course_id, c);
    }

    const course_breakdown = Array.from(courseMap.entries()).map(([course_id, stats]) => {
      const crs = db.courses.find(c => c.id === course_id);
      const pct = stats.total > 0 ? Number(((stats.attended / stats.total) * 100).toFixed(1)) : 100;
      const b = calculateAttendanceBuffer(stats.attended, stats.total, 75);
      return {
        course_id,
        course_name: crs?.name || `Course #${course_id}`,
        course_code: crs?.code || "CRS-100",
        attended: stats.attended,
        total: stats.total,
        percentage: pct,
        buffer: b.buffer_sessions
      };
    });

    res.json({
      student_id: studentId,
      total_sessions: total,
      attended_sessions: attended,
      attendance_percentage: percentage,
      threshold_percentage: 75,
      buffer_sessions: buffer.buffer_sessions,
      status: buffer.status,
      explanation: buffer.explanation,
      course_breakdown
    });
  });

  app.get("/api/attendance/student/:id/records", (req, res) => {
    const studentId = Number(req.params.id);
    const records = db.attendanceRecords
      .filter(r => r.student_id === studentId)
      .slice(-30); // Return recent 30 sessions
    res.json(records);
  });

  app.post("/api/attendance/record", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { course_id, date, sessions } = req.body;
    // sessions: [{ student_id: 1, status: 'present' }]
    const authUser = (req as any).user;

    if (Array.isArray(sessions)) {
      for (const s of sessions) {
        db.attendanceRecords.push({
          id: db.attendanceRecords.length + 1,
          student_id: Number(s.student_id),
          course_id: Number(course_id),
          date: date || new Date().toISOString().split("T")[0],
          session: s.session || "Recorded Session",
          status: s.status || "present",
          recorded_by: authUser.id,
          timestamp: new Date().toISOString()
        });
      }
    }

    logAuditEvent(authUser.id, authUser.name, authUser.role, "RECORD_ATTENDANCE", "Attendance", course_id, { count: sessions?.length || 0 });
    res.status(201).json({ status: "success", recorded: sessions?.length || 0 });
  });

  // ---------------------------------------------------------
  // EXAMINATIONS & RESULTS
  // ---------------------------------------------------------
  app.get("/api/examinations", (req, res) => {
    res.json(db.examinations);
  });

  app.get("/api/examinations/student/:id/results", (req, res) => {
    const studentId = Number(req.params.id);
    const results = db.examResults
      .filter(r => r.student_id === studentId)
      .map(r => {
        const exam = db.examinations.find(e => e.id === r.examination_id);
        const course = exam ? db.courses.find(c => c.id === exam.course_id) : null;
        return {
          ...r,
          examination_title: exam?.title,
          course_id: course?.id,
          course_name: course?.name
        };
      });
    res.json(results);
  });

  app.post("/api/examinations", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { title, course_id, exam_date, duration_minutes, max_marks, weightage_percentage } = req.body;
    const authUser = (req as any).user;
    const course = db.courses.find(c => c.id === Number(course_id));

    const newExam: Examination = {
      id: db.examinations.length + 1,
      title,
      course_id: Number(course_id),
      course_name: course?.name,
      course_code: course?.code,
      exam_date: exam_date || "2026-10-20",
      duration_minutes: Number(duration_minutes) || 120,
      max_marks: Number(max_marks) || 100,
      weightage_percentage: Number(weightage_percentage) || 30
    };

    db.examinations.push(newExam);
    logAuditEvent(authUser.id, authUser.name, authUser.role, "CREATE_EXAMINATION", "Examination", newExam.id, { title });
    res.status(201).json(newExam);
  });

  app.post("/api/examinations/results", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { examination_id, student_id, marks } = req.body;
    const authUser = (req as any).user;
    const exam = db.examinations.find(e => e.id === Number(examination_id));
    const max_marks = exam ? exam.max_marks : 100;
    const percentage = Number(((Number(marks) / max_marks) * 100).toFixed(1));

    let grade = "F";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 60) grade = "C";
    else if (percentage >= 50) grade = "D";

    const student = db.users.find(u => u.id === Number(student_id));
    const newRes: ExaminationResult = {
      id: db.examResults.length + 1,
      examination_id: Number(examination_id),
      student_id: Number(student_id),
      student_name: student?.name,
      marks: Number(marks),
      max_marks,
      percentage,
      grade
    };

    db.examResults.push(newRes);
    logAuditEvent(authUser.id, authUser.name, authUser.role, "ENTER_EXAM_MARK", "ExaminationResult", newRes.id, { student_id, marks, grade });
    res.status(201).json(newRes);
  });

  // ---------------------------------------------------------
  // AURA ACADEMIC INTELLIGENCE ENGINE ENDPOINTS
  // ---------------------------------------------------------
  app.get("/api/intelligence/student/:id", (req, res) => {
    const studentId = Number(req.params.id);
    const intelligence = computeStudentIntelligence(studentId);
    if (!intelligence) return res.status(404).json({ detail: "Student intelligence profile not found" });
    res.json(intelligence);
  });

  app.get("/api/intelligence/what-if/:id", (req, res) => {
    const studentId = Number(req.params.id);
    const intelligence = computeStudentIntelligence(studentId);
    if (!intelligence) return res.status(404).json({ detail: "Student not found" });

    const targetExam = req.query.target_exam_score ? Number(req.query.target_exam_score) : intelligence.examinations.average;
    const projAtt = req.query.projected_attendance ? Number(req.query.projected_attendance) : intelligence.attendance.percentage;
    const projAss = req.query.projected_assignment_score ? Number(req.query.projected_assignment_score) : intelligence.assignments.average;

    const previousScore = intelligence.trend.previous_score;

    const simulation = simulateWhatIf(
      intelligence.attendance.percentage,
      intelligence.assignments.average,
      intelligence.examinations.average,
      previousScore,
      targetExam,
      projAtt,
      projAss
    );

    res.json(simulation);
  });

  app.post("/api/intelligence/what-if", (req, res) => {
    const { student_id, target_exam_score, projected_attendance, projected_assignment_score } = req.body;
    const intelligence = computeStudentIntelligence(Number(student_id));
    if (!intelligence) return res.status(404).json({ detail: "Student not found" });

    const previousScore = intelligence.trend.previous_score;

    const simulation = simulateWhatIf(
      intelligence.attendance.percentage,
      intelligence.assignments.average,
      intelligence.examinations.average,
      previousScore,
      target_exam_score !== undefined ? Number(target_exam_score) : undefined,
      projected_attendance !== undefined ? Number(projected_attendance) : undefined,
      projected_assignment_score !== undefined ? Number(projected_assignment_score) : undefined
    );

    res.json(simulation);
  });

  app.post("/api/intelligence/ai-copilot/:id", async (req, res) => {
    const studentId = Number(req.params.id);
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ detail: "Question parameter is required" });
    }

    const intelligence = computeStudentIntelligence(studentId);
    if (!intelligence) {
      return res.status(404).json({ detail: "Student telemetry profile not found" });
    }

    try {
      const copilotResponse = await generateAICopilotResponse(intelligence, question);
      res.json(copilotResponse);
    } catch (err: any) {
      console.error("AI Copilot failure:", err);
      res.status(500).json({ detail: "Failed to generate AI copilot response" });
    }
  });

  // TEACHER RISK RADAR (STUDENT ATTENTION RADAR)
  app.get("/api/intelligence/radar", (req, res) => {
    const students = db.users.filter(u => u.role === "STUDENT");
    const radarData = students.map(student => {
      const intel = computeStudentIntelligence(student.id);
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        attendance: intel ? intel.attendance.percentage : 100,
        assignments: intel ? intel.assignments.average : 100,
        examinations: intel ? intel.examinations.average : 100,
        overall_score: intel ? intel.overall_score : 100,
        trend: intel ? intel.trend.direction : "stable",
        trend_change: intel ? intel.trend.change : 0,
        risk_score: intel ? intel.risk.risk_score : 10,
        risk_level: intel ? intel.risk.risk_level : "low",
        primary_factor: intel ? intel.risk.primary_factor : "None",
        recommended_action: intel && intel.recommendations[0] ? intel.recommendations[0].recommended_action : "Maintain current pace",
        has_active_intervention: db.interventions.some(i => i.student_id === student.id && (i.status === "OPEN" || i.status === "IN_PROGRESS"))
      };
    });

    // Grouping into Radar Buckets
    const buckets = {
      critical: radarData.filter(s => s.risk_level === "critical"),
      high: radarData.filter(s => s.risk_level === "high"),
      moderate: radarData.filter(s => s.risk_level === "moderate"),
      low: radarData.filter(s => s.risk_level === "low")
    };

    res.json({
      all: radarData,
      buckets,
      counts: {
        total: radarData.length,
        critical: buckets.critical.length,
        high: buckets.high.length,
        moderate: buckets.moderate.length,
        low: buckets.low.length
      }
    });
  });

  // ---------------------------------------------------------
  // INTERVENTION CLOSED-LOOP LIFECYCLE
  // ---------------------------------------------------------
  app.get("/api/interventions", (req, res) => {
    res.json(db.interventions);
  });

  app.get("/api/interventions/student/:id", (req, res) => {
    const studentId = Number(req.params.id);
    const list = db.interventions.filter(i => i.student_id === studentId);
    res.json(list);
  });

  app.post("/api/interventions", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const { student_id, course_id, title, risk_source, recommendation, action, priority, target_date } = req.body;
    const authUser = (req as any).user;
    const student = db.users.find(u => u.id === Number(student_id));
    const course = db.courses.find(c => c.id === Number(course_id));

    const intel = computeStudentIntelligence(Number(student_id));
    const baselineRisk = intel ? intel.risk.risk_score : 50;

    const newIntervention: Intervention = {
      id: db.interventions.length + 1,
      student_id: Number(student_id),
      student_name: student?.name || "Student",
      teacher_id: authUser.id,
      teacher_name: authUser.name,
      course_id: course ? course.id : undefined,
      course_name: course ? course.name : undefined,
      title: title || "Academic Support Intervention",
      risk_source: risk_source || "Academic Risk",
      recommendation: recommendation || "Attend scheduled support sessions.",
      action: action || "Enforce weekly review checkpoint.",
      priority: priority || "high",
      start_date: new Date().toISOString().split("T")[0],
      target_date: target_date || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "IN_PROGRESS",
      checkpoints: [
        {
          id: `cp-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          title: "Initial Advisory Session",
          notes: "Student informed of intervention requirements.",
          completed: true
        }
      ],
      baseline_risk: baselineRisk,
      created_at: new Date().toISOString()
    };

    db.interventions.unshift(newIntervention);

    // Notify Student
    db.notifications.unshift({
      id: db.notifications.length + 1,
      user_id: Number(student_id),
      title: "New Academic Intervention Assigned",
      message: `${authUser.name} has initiated an intervention plan: "${newIntervention.title}".`,
      type: "intervention_assigned",
      priority: "urgent",
      read: false,
      created_at: new Date().toISOString()
    });

    logAuditEvent(authUser.id, authUser.name, authUser.role, "CREATE_INTERVENTION", "Intervention", newIntervention.id, { student_id, title });
    res.status(201).json(newIntervention);
  });

  app.patch("/api/interventions/:id/status", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const interventionId = Number(req.params.id);
    const { status, outcome } = req.body;
    const authUser = (req as any).user;

    const item = db.interventions.find(i => i.id === interventionId);
    if (!item) return res.status(404).json({ detail: "Intervention not found" });

    item.status = status;
    if (outcome) item.outcome = outcome;

    if (status === "COMPLETED" || status === "VERIFIED") {
      const intel = computeStudentIntelligence(item.student_id);
      if (intel && item.baseline_risk !== undefined) {
        item.post_risk = intel.risk.risk_score;
        item.impact_score = Number((item.baseline_risk - item.post_risk).toFixed(1));
      }
    }

    logAuditEvent(authUser.id, authUser.name, authUser.role, "UPDATE_INTERVENTION_STATUS", "Intervention", item.id, { status, outcome });
    res.json(item);
  });

  app.post("/api/interventions/:id/checkpoints", authenticateToken, requireRole(["TEACHER", "ADMIN"]), (req, res) => {
    const interventionId = Number(req.params.id);
    const { title, notes, completed } = req.body;

    const item = db.interventions.find(i => i.id === interventionId);
    if (!item) return res.status(404).json({ detail: "Intervention not found" });

    const newCp = {
      id: `cp-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      title: title || "Progress Checkpoint",
      notes: notes || "",
      completed: !!completed
    };

    item.checkpoints.push(newCp);
    res.status(201).json(item);
  });

  // ---------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------
  app.get("/api/notifications", authenticateToken, (req, res) => {
    const authUser = (req as any).user;
    const userNotifs = db.notifications.filter(n => n.user_id === authUser.id);
    res.json(userNotifs);
  });

  app.patch("/api/notifications/:id/read", authenticateToken, (req, res) => {
    const notifId = Number(req.params.id);
    const authUser = (req as any).user;
    const notif = db.notifications.find(n => n.id === notifId && n.user_id === authUser.id);
    if (notif) notif.read = true;
    res.json({ status: "success" });
  });

  app.post("/api/notifications/read-all", authenticateToken, (req, res) => {
    const authUser = (req as any).user;
    for (const n of db.notifications) {
      if (n.user_id === authUser.id) n.read = true;
    }
    res.json({ status: "success" });
  });

  // ---------------------------------------------------------
  // AUDIT LOGS (ADMIN ONLY)
  // ---------------------------------------------------------
  app.get("/api/audit-logs", authenticateToken, requireRole(["ADMIN"]), (req, res) => {
    res.json(db.auditLogs);
  });

  // ---------------------------------------------------------
  // REPORTS & INSTITUTIONAL ANALYTICS
  // ---------------------------------------------------------
  app.get("/api/reports/analytics", (req, res) => {
    const students = db.users.filter(u => u.role === "STUDENT");
    const teachers = db.users.filter(u => u.role === "TEACHER");

    let totalAttendanceSum = 0;
    let totalScoreSum = 0;
    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let lowCount = 0;
    let improvingCount = 0;
    let decliningCount = 0;

    for (const s of students) {
      const intel = computeStudentIntelligence(s.id);
      if (intel) {
        totalAttendanceSum += intel.attendance.percentage;
        totalScoreSum += intel.overall_score;
        if (intel.risk.risk_level === "critical") criticalCount++;
        else if (intel.risk.risk_level === "high") highCount++;
        else if (intel.risk.risk_level === "moderate") moderateCount++;
        else lowCount++;

        if (intel.trend.direction === "improvement" || intel.trend.direction === "strong_improvement") improvingCount++;
        else if (intel.trend.direction === "decline" || intel.trend.direction === "significant_decline") decliningCount++;
      }
    }

    const avgAttendance = students.length > 0 ? Number((totalAttendanceSum / students.length).toFixed(1)) : 80;
    const avgPerformance = students.length > 0 ? Number((totalScoreSum / students.length).toFixed(1)) : 75;

    const completedInterventions = db.interventions.filter(i => i.status === "COMPLETED" || i.status === "VERIFIED");
    const successfulInterventions = completedInterventions.filter(i => (i.impact_score || 0) > 0);
    const interventionSuccessRate = completedInterventions.length > 0
      ? Number(((successfulInterventions.length / completedInterventions.length) * 100).toFixed(1))
      : 85.0; // Benchmark

    const kpis = {
      total_students: students.length,
      total_teachers: teachers.length,
      total_courses: db.courses.length,
      active_classes: db.classes.length,
      average_attendance: avgAttendance,
      average_performance: avgPerformance,
      high_risk_students: highCount,
      critical_risk_students: criticalCount,
      improving_students: improvingCount,
      declining_students: decliningCount,
      assignment_completion_rate: 88.4,
      intervention_success_rate: interventionSuccessRate
    };

    const riskDistribution = [
      { name: "Low Risk", value: lowCount, color: "#10b981" },
      { name: "Moderate Risk", value: moderateCount, color: "#f59e0b" },
      { name: "High Risk", value: highCount, color: "#f97316" },
      { name: "Critical Risk", value: criticalCount, color: "#ef4444" },
    ];

    const departmentComparison = [
      { department: "Computer Science", students: 4, avgAttendance: 82.5, avgPerformance: 71.0, riskIndex: 42.1 },
      { department: "Artificial Intelligence", students: 1, avgAttendance: 58.0, avgPerformance: 82.0, riskIndex: 54.2 },
      { department: "Data Science", students: 1, avgAttendance: 87.0, avgPerformance: 64.0, riskIndex: 48.0 },
      { department: "Information Technology", students: 1, avgAttendance: 89.0, avgPerformance: 80.5, riskIndex: 26.5 },
    ];

    res.json({
      kpis,
      riskDistribution,
      departmentComparison
    });
  });

  app.get("/api/reports/export-csv", (req, res) => {
    const students = db.users.filter(u => u.role === "STUDENT");
    let csv = "Student ID,Name,Email,Department,Year,Attendance %,Assignment %,Exam %,Overall %,Risk Score,Risk Level,Trend,Primary Risk Factor\n";

    for (const s of students) {
      const intel = computeStudentIntelligence(s.id);
      if (intel) {
        csv += `"${s.id}","${s.name}","${s.email}","${s.department}","${s.year || 3}","${intel.attendance.percentage}","${intel.assignments.average}","${intel.examinations.average}","${intel.overall_score}","${intel.risk.risk_score}","${intel.risk.risk_level.toUpperCase()}","${intel.trend.direction}","${intel.risk.primary_factor}"\n`;
      }
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="aura_academic_intelligence_report.csv"');
    res.send(csv);
  });

  // ---------------------------------------------------------
  // VITE MIDDLEWARE SETUP
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AURA] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
