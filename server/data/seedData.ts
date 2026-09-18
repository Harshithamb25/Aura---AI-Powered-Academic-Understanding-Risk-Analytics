import { User, Course, AcademicClass, Enrollment, AttendanceRecord, Assignment, AssignmentSubmission, Examination, ExaminationResult, Intervention, Notification, AuditLog } from '../../src/types';
import bcrypt from 'bcryptjs';

const passwordHash = bcrypt.hashSync('password123', 10);

export function getInitialSeedData() {
  const users: (User & { password_hash: string })[] = [
    // 7 Required Student Archetypes
    {
      id: 1,
      name: "Aarav Kumar",
      email: "aarav@aura.edu",
      role: "STUDENT",
      department: "Computer Science",
      year: 3,
      created_at: "2026-01-10T08:00:00Z",
      password_hash: passwordHash,
    },
    {
      id: 2,
      name: "Diya Sharma",
      email: "diya@aura.edu",
      role: "STUDENT",
      department: "Artificial Intelligence",
      year: 2,
      created_at: "2026-01-10T08:00:00Z",
      password_hash: passwordHash,
    },
    {
      id: 3,
      name: "Rahul Menon",
      email: "rahul@aura.edu",
      role: "STUDENT",
      department: "Computer Science",
      year: 3,
      created_at: "2026-01-10T08:00:00Z",
      password_hash: passwordHash,
    },
    {
      id: 4,
      name: "Ananya Patel",
      email: "ananya@aura.edu",
      role: "STUDENT",
      department: "Data Science",
      year: 2,
      created_at: "2026-01-10T08:00:00Z",
      password_hash: passwordHash,
    },
    {
      id: 5,
      name: "Vikram Singh",
      email: "vikram@aura.edu",
      role: "STUDENT",
      department: "Computer Science",
      year: 3,
      created_at: "2026-01-10T08:00:00Z",
      password_hash: passwordHash,
    },
    {
      id: 6,
      name: "Neha Gupta",
      email: "neha@aura.edu",
      role: "STUDENT",
      department: "Information Technology",
      year: 2,
      created_at: "2026-01-10T08:00:00Z",
      password_hash: passwordHash,
    },
    {
      id: 7,
      name: "Rohan Verma",
      email: "rohan@aura.edu",
      role: "STUDENT",
      department: "Computer Science",
      year: 3,
      created_at: "2026-01-10T08:00:00Z",
      password_hash: passwordHash,
    },
    // Teachers
    {
      id: 101,
      name: "Dr. Rajesh Iyer",
      email: "rajesh.iyer@aura.edu",
      role: "TEACHER",
      department: "Computer Science",
      created_at: "2025-08-15T08:00:00Z",
      password_hash: passwordHash,
    },
    {
      id: 102,
      name: "Prof. Sunita Rao",
      email: "sunita.rao@aura.edu",
      role: "TEACHER",
      department: "Artificial Intelligence",
      created_at: "2025-08-15T08:00:00Z",
      password_hash: passwordHash,
    },
    // Admin
    {
      id: 999,
      name: "Dean Arthur Vance",
      email: "admin@aura.edu",
      role: "ADMIN",
      department: "Academic Affairs",
      created_at: "2025-01-01T08:00:00Z",
      password_hash: passwordHash,
    }
  ];

  const courses: Course[] = [
    {
      id: 1,
      code: "CS-301",
      name: "Design & Analysis of Algorithms",
      description: "Advanced algorithmic paradigms, complexity classes, dynamic programming, and graph theory.",
      department: "Computer Science",
      teacher_id: 101,
      teacher_name: "Dr. Rajesh Iyer",
      credits: 4,
      semester: 5,
      schedule: "Mon/Wed 10:00 AM - 11:30 AM",
      room: "Hall B-204",
      capacity: 60,
      enrolled_count: 52,
      status: "active",
      syllabus: [
        "Divide and Conquer & Recurrence Relations",
        "Greedy Algorithms & Matroids",
        "Dynamic Programming & Optimization",
        "Graph Algorithms: Flow Networks & Shortest Paths",
        "NP-Completeness and Approximation Algorithms"
      ]
    },
    {
      id: 2,
      code: "AI-201",
      name: "Machine Learning Foundations",
      description: "Supervised and unsupervised learning, loss functions, regularization, and gradient descent.",
      department: "Artificial Intelligence",
      teacher_id: 102,
      teacher_name: "Prof. Sunita Rao",
      credits: 4,
      semester: 4,
      schedule: "Tue/Thu 02:00 PM - 03:30 PM",
      room: "Turing Lab 3",
      capacity: 50,
      enrolled_count: 48,
      status: "active",
      syllabus: [
        "Linear Regression & Gradient Descent",
        "Logistic Regression & Classification Metrics",
        "Decision Trees, Random Forests, & Ensembles",
        "Unsupervised Learning & Clustering (K-Means, PCA)",
        "Introduction to Deep Neural Networks"
      ]
    },
    {
      id: 3,
      code: "CS-305",
      name: "Database Systems & Architecture",
      description: "Relational modeling, SQL, normalization, concurrency control, and indexing strategies.",
      department: "Computer Science",
      teacher_id: 101,
      teacher_name: "Dr. Rajesh Iyer",
      credits: 3,
      semester: 5,
      schedule: "Fri 09:00 AM - 12:00 PM",
      room: "Hall A-102",
      capacity: 65,
      enrolled_count: 58,
      status: "active",
      syllabus: [
        "ER Modeling and Relational Algebra",
        "Advanced SQL & Analytical Queries",
        "Normalization Theory (1NF through BCNF)",
        "Indexing, B+ Trees, and Query Optimization",
        "Transactions, ACID Properties, & Locking"
      ]
    },
    {
      id: 4,
      code: "DS-202",
      name: "Applied Statistical Computing",
      description: "Probability distributions, hypothesis testing, ANOVA, and multivariate data analysis.",
      department: "Data Science",
      teacher_id: 102,
      teacher_name: "Prof. Sunita Rao",
      credits: 3,
      semester: 3,
      schedule: "Mon/Wed 03:30 PM - 05:00 PM",
      room: "Gauss Hall 101",
      capacity: 45,
      enrolled_count: 40,
      status: "active",
      syllabus: [
        "Random Variables & Probability Distributions",
        "Statistical Inference & Confidence Intervals",
        "Parametric & Non-Parametric Hypothesis Tests",
        "Linear & Multiple Regression Analysis",
        "Resampling Methods & Monte Carlo Simulation"
      ]
    }
  ];

  const classes: AcademicClass[] = [
    {
      id: 1,
      name: "CS-301 Section A",
      course_id: 1,
      course_name: "Design & Analysis of Algorithms",
      teacher_id: 101,
      teacher_name: "Dr. Rajesh Iyer",
      room: "Hall B-204",
      schedule: "Mon/Wed 10:00 AM - 11:30 AM",
      semester: "Fall 2026",
      status: "active"
    },
    {
      id: 2,
      name: "AI-201 Section B",
      course_id: 2,
      course_name: "Machine Learning Foundations",
      teacher_id: 102,
      teacher_name: "Prof. Sunita Rao",
      room: "Turing Lab 3",
      schedule: "Tue/Thu 02:00 PM - 03:30 PM",
      semester: "Fall 2026",
      status: "active"
    }
  ];

  const enrollments: Enrollment[] = [
    // Enroll all 7 students in courses
    { id: 1, student_id: 1, course_id: 1, status: "active", enrolled_at: "2026-01-15" },
    { id: 2, student_id: 1, course_id: 2, status: "active", enrolled_at: "2026-01-15" },
    { id: 3, student_id: 1, course_id: 3, status: "active", enrolled_at: "2026-01-15" },

    { id: 4, student_id: 2, course_id: 1, status: "active", enrolled_at: "2026-01-15" },
    { id: 5, student_id: 2, course_id: 2, status: "active", enrolled_at: "2026-01-15" },
    { id: 6, student_id: 2, course_id: 4, status: "active", enrolled_at: "2026-01-15" },

    { id: 7, student_id: 3, course_id: 1, status: "active", enrolled_at: "2026-01-15" },
    { id: 8, student_id: 3, course_id: 2, status: "active", enrolled_at: "2026-01-15" },
    { id: 9, student_id: 3, course_id: 3, status: "active", enrolled_at: "2026-01-15" },

    { id: 10, student_id: 4, course_id: 1, status: "active", enrolled_at: "2026-01-15" },
    { id: 11, student_id: 4, course_id: 2, status: "active", enrolled_at: "2026-01-15" },
    { id: 12, student_id: 4, course_id: 4, status: "active", enrolled_at: "2026-01-15" },

    { id: 13, student_id: 5, course_id: 1, status: "active", enrolled_at: "2026-01-15" },
    { id: 14, student_id: 5, course_id: 2, status: "active", enrolled_at: "2026-01-15" },
    { id: 15, student_id: 5, course_id: 3, status: "active", enrolled_at: "2026-01-15" },

    { id: 16, student_id: 6, course_id: 1, status: "active", enrolled_at: "2026-01-15" },
    { id: 17, student_id: 6, course_id: 2, status: "active", enrolled_at: "2026-01-15" },

    { id: 18, student_id: 7, course_id: 1, status: "active", enrolled_at: "2026-01-15" },
    { id: 19, student_id: 7, course_id: 2, status: "active", enrolled_at: "2026-01-15" },
    { id: 20, student_id: 7, course_id: 3, status: "active", enrolled_at: "2026-01-15" },
  ];

  // Assignments
  const assignments: Assignment[] = [
    {
      id: 1,
      course_id: 1,
      course_name: "Design & Analysis of Algorithms",
      course_code: "CS-301",
      teacher_id: 101,
      title: "Problem Set 1: Recurrences & Divide-and-Conquer",
      description: "Solve Master Theorem proofs and implement Strassen matrix multiplication.",
      due_date: "2026-02-15",
      max_marks: 100,
      status: "closed"
    },
    {
      id: 2,
      course_id: 1,
      course_name: "Design & Analysis of Algorithms",
      course_code: "CS-301",
      teacher_id: 101,
      title: "Problem Set 2: Dynamic Programming Formulation",
      description: "Implement 0/1 Knapsack, Sequence Alignment, and Tree DP in Python/C++.",
      due_date: "2026-03-05",
      max_marks: 100,
      status: "closed"
    },
    {
      id: 3,
      course_id: 1,
      course_name: "Design & Analysis of Algorithms",
      course_code: "CS-301",
      teacher_id: 101,
      title: "Problem Set 3: Max Flow & Bipartite Matching",
      description: "Ford-Fulkerson algorithm and Edmond-Karp applications in network routing.",
      due_date: "2026-09-25",
      max_marks: 100,
      status: "active"
    },
    {
      id: 4,
      course_id: 2,
      course_name: "Machine Learning Foundations",
      course_code: "AI-201",
      teacher_id: 102,
      title: "Lab 1: Regularized Linear Models",
      description: "Implement Lasso and Ridge regression from scratch using NumPy.",
      due_date: "2026-02-20",
      max_marks: 100,
      status: "closed"
    },
    {
      id: 5,
      course_id: 2,
      course_name: "Machine Learning Foundations",
      course_code: "AI-201",
      teacher_id: 102,
      title: "Lab 2: Classification with Support Vector Machines",
      description: "Evaluate linear and RBF kernels on biomedical benchmark datasets.",
      due_date: "2026-03-10",
      max_marks: 100,
      status: "closed"
    },
    {
      id: 6,
      course_id: 2,
      course_name: "Machine Learning Foundations",
      course_code: "AI-201",
      teacher_id: 102,
      title: "Lab 3: Deep MLP Architecture and Backpropagation",
      description: "Construct 3-layer neural network with Xavier initialization and Adam optimizer.",
      due_date: "2026-09-30",
      max_marks: 100,
      status: "active"
    }
  ];

  // Specific assignment submissions tailored to the 7 Archetypes
  // Archetype 1 (Aarav): High (92%)
  // Archetype 2 (Diya): Good (84%)
  // Archetype 3 (Rahul): Good initial (76%)
  // Archetype 4 (Ananya): Assignment risk (45%, missing/overdue)
  // Archetype 5 (Vikram): Good (80%)
  // Archetype 6 (Neha): Good (78%)
  // Archetype 7 (Rohan): Critical (42%)
  const assignmentSubmissions: AssignmentSubmission[] = [
    // Aarav (1)
    { id: 1, assignment_id: 1, student_id: 1, submitted_at: "2026-02-14", submission_text: "GitHub link: repo/pset1", marks: 95, feedback: "Exemplary solution and clean asymptotic bounds.", status: "graded" },
    { id: 2, assignment_id: 2, student_id: 1, submitted_at: "2026-03-04", submission_text: "GitHub link: repo/pset2", marks: 90, feedback: "Great DP state transition explanation.", status: "graded" },
    { id: 3, assignment_id: 4, student_id: 1, submitted_at: "2026-02-19", submission_text: "Notebook: lab1.ipynb", marks: 92, feedback: "Thorough loss curve comparison.", status: "graded" },

    // Diya (2)
    { id: 4, assignment_id: 1, student_id: 2, submitted_at: "2026-02-14", submission_text: "Solution attached", marks: 86, feedback: "Good effort.", status: "graded" },
    { id: 5, assignment_id: 2, student_id: 2, submitted_at: "2026-03-05", submission_text: "Code attached", marks: 82, feedback: "Correct code, minor typo in documentation.", status: "graded" },
    { id: 6, assignment_id: 4, student_id: 2, submitted_at: "2026-02-20", submission_text: "Jupyter Notebook", marks: 84, feedback: "Well executed.", status: "graded" },

    // Rahul (3)
    { id: 7, assignment_id: 1, student_id: 3, submitted_at: "2026-02-15", submission_text: "Pset 1 PDF", marks: 78, feedback: "Average performance.", status: "graded" },
    { id: 8, assignment_id: 2, student_id: 3, submitted_at: "2026-03-05", submission_text: "Pset 2 Code", marks: 74, feedback: "Suboptimal space complexity.", status: "graded" },

    // Ananya (4) - Assignment Risk (45%, 1 submitted poor, 1 late, 1 missing)
    { id: 9, assignment_id: 1, student_id: 4, submitted_at: "2026-02-15", submission_text: "Incomplete pset1", marks: 50, feedback: "Missing proofs for problems 3 and 4.", status: "graded" },
    { id: 10, assignment_id: 4, student_id: 4, submitted_at: "2026-02-22", submission_text: "Late submission lab1", marks: 40, feedback: "Late by 2 days; code throws syntax error on test 2.", status: "late" },

    // Vikram (5)
    { id: 11, assignment_id: 1, student_id: 5, submitted_at: "2026-02-15", submission_text: "Pset 1", marks: 82, feedback: "Good work.", status: "graded" },
    { id: 12, assignment_id: 2, student_id: 5, submitted_at: "2026-03-04", submission_text: "Pset 2", marks: 78, feedback: "Solid dynamic programming table.", status: "graded" },

    // Neha (6) - Improving
    { id: 13, assignment_id: 1, student_id: 6, submitted_at: "2026-02-15", submission_text: "Pset 1", marks: 72, feedback: "Fair work.", status: "graded" },
    { id: 14, assignment_id: 4, student_id: 6, submitted_at: "2026-02-20", submission_text: "Lab 1", marks: 84, feedback: "Marked improvement over initial submission!", status: "graded" },

    // Rohan (7) - Critical Risk (42%)
    { id: 15, assignment_id: 1, student_id: 7, submitted_at: "2026-02-16", submission_text: "Partial Pset1", marks: 45, feedback: "Significant gaps in understanding recurrence trees.", status: "graded" },
    { id: 16, assignment_id: 4, student_id: 7, submitted_at: "2026-02-23", submission_text: "Partial Lab", marks: 39, feedback: "Incomplete implementation.", status: "late" },
  ];

  // Examinations
  const examinations: Examination[] = [
    {
      id: 1,
      course_id: 1,
      course_name: "Design & Analysis of Algorithms",
      course_code: "CS-301",
      title: "Midterm Examination",
      exam_date: "2026-03-12",
      duration_minutes: 120,
      max_marks: 100,
      weightage_percentage: 30
    },
    {
      id: 2,
      course_id: 2,
      course_name: "Machine Learning Foundations",
      course_code: "AI-201",
      title: "Midterm Examination",
      exam_date: "2026-03-18",
      duration_minutes: 120,
      max_marks: 100,
      weightage_percentage: 30
    },
    {
      id: 3,
      course_id: 3,
      course_name: "Database Systems & Architecture",
      course_code: "CS-305",
      title: "Midterm Examination",
      exam_date: "2026-03-24",
      duration_minutes: 120,
      max_marks: 100,
      weightage_percentage: 30
    },
    {
      id: 4,
      course_id: 1,
      course_name: "Design & Analysis of Algorithms",
      course_code: "CS-301",
      title: "Comprehensive Final Exam",
      exam_date: "2026-10-15",
      duration_minutes: 180,
      max_marks: 100,
      weightage_percentage: 50
    }
  ];

  // Examination Results tailored to the 7 Archetypes
  // 1: Aarav (91%)
  // 2: Diya (82%)
  // 3: Rahul (Declining: was 70 prev, now 52)
  // 4: Ananya (72%)
  // 5: Vikram (Exam Risk: 48%)
  // 6: Neha (Improving: was 67, now 81)
  // 7: Rohan (Critical: 38%)
  const examResults: ExaminationResult[] = [
    // Aarav (1)
    { id: 1, examination_id: 1, student_id: 1, marks: 91, max_marks: 100, percentage: 91, grade: "A+" },
    { id: 2, examination_id: 2, student_id: 1, marks: 90, max_marks: 100, percentage: 90, grade: "A+" },
    { id: 3, examination_id: 3, student_id: 1, marks: 92, max_marks: 100, percentage: 92, grade: "A+" },

    // Diya (2)
    { id: 4, examination_id: 1, student_id: 2, marks: 84, max_marks: 100, percentage: 84, grade: "A" },
    { id: 5, examination_id: 2, student_id: 2, marks: 80, max_marks: 100, percentage: 80, grade: "A-" },

    // Rahul (3) - Declining (52%)
    { id: 6, examination_id: 1, student_id: 3, marks: 54, max_marks: 100, percentage: 54, grade: "D" },
    { id: 7, examination_id: 2, student_id: 3, marks: 50, max_marks: 100, percentage: 50, grade: "D" },

    // Ananya (4)
    { id: 8, examination_id: 1, student_id: 4, marks: 74, max_marks: 100, percentage: 74, grade: "B" },
    { id: 9, examination_id: 2, student_id: 4, marks: 70, max_marks: 100, percentage: 70, grade: "B-" },

    // Vikram (5) - Exam Risk (48%)
    { id: 10, examination_id: 1, student_id: 5, marks: 46, max_marks: 100, percentage: 46, grade: "F" },
    { id: 11, examination_id: 2, student_id: 5, marks: 50, max_marks: 100, percentage: 50, grade: "D" },

    // Neha (6) - Improving (81%)
    { id: 12, examination_id: 1, student_id: 6, marks: 80, max_marks: 100, percentage: 80, grade: "A-" },
    { id: 13, examination_id: 2, student_id: 6, marks: 82, max_marks: 100, percentage: 82, grade: "A-" },

    // Rohan (7) - Critical (38%)
    { id: 14, examination_id: 1, student_id: 7, marks: 36, max_marks: 100, percentage: 36, grade: "F" },
    { id: 15, examination_id: 2, student_id: 7, marks: 40, max_marks: 100, percentage: 40, grade: "F" },
  ];

  // Attendance Records generated to match the exact percentages:
  // 1: Aarav -> 94% (47/50)
  // 2: Diya -> 58% (29/50) - Attendance risk!
  // 3: Rahul -> 91% (45/50)
  // 4: Ananya -> 87% (43/50)
  // 5: Vikram -> 85% (42/50)
  // 6: Neha -> 89% (44/50)
  // 7: Rohan -> 55% (27/50) - Critical attendance risk!
  const attendanceRecords: AttendanceRecord[] = [];
  const studentAttendanceTargets = [
    { student_id: 1, present_count: 47, total: 50 },
    { student_id: 2, present_count: 29, total: 50 },
    { student_id: 3, present_count: 45, total: 50 },
    { student_id: 4, present_count: 43, total: 50 },
    { student_id: 5, present_count: 42, total: 50 },
    { student_id: 6, present_count: 44, total: 50 },
    { student_id: 7, present_count: 27, total: 50 },
  ];

  let recordId = 1;
  const startDate = new Date(2026, 0, 15);
  for (const target of studentAttendanceTargets) {
    for (let i = 0; i < target.total; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + Math.floor(i * 1.5));
      const dateStr = d.toISOString().split('T')[0];
      const isPresent = i < target.present_count;
      attendanceRecords.push({
        id: recordId++,
        student_id: target.student_id,
        course_id: (i % 2 === 0) ? 1 : 2,
        date: dateStr,
        session: `Session ${i + 1}`,
        status: isPresent ? 'present' : 'absent',
        recorded_by: 101,
        timestamp: `${dateStr}T10:05:00Z`
      });
    }
  }

  // Interventions
  const interventions: Intervention[] = [
    {
      id: 1,
      student_id: 2, // Diya - Attendance Risk
      student_name: "Diya Sharma",
      teacher_id: 101,
      teacher_name: "Dr. Rajesh Iyer",
      course_id: 1,
      course_name: "Design & Analysis of Algorithms",
      title: "Attendance Recovery Contract & Morning Class Mentoring",
      risk_source: "Attendance",
      recommendation: "Increase class participation and maintain 100% attendance over the next 15 sessions.",
      action: "Enforce bi-weekly check-in with faculty mentor and mandatory recitation attendance.",
      priority: "high",
      start_date: "2026-03-15",
      target_date: "2026-04-15",
      status: "IN_PROGRESS",
      checkpoints: [
        { id: "c1", date: "2026-03-22", title: "Week 1 Checkpoint", notes: "Attended all 3 sessions this week. Marked improvement.", completed: true },
        { id: "c2", date: "2026-03-29", title: "Week 2 Checkpoint", notes: "Attended 3 of 3 sessions. Buffer deficit decreasing.", completed: true },
        { id: "c3", date: "2026-04-05", title: "Mid-Term Review", notes: "Review attendance buffer and verify notes log.", completed: false }
      ],
      baseline_risk: 54.2,
      created_at: "2026-03-15T11:00:00Z"
    },
    {
      id: 2,
      student_id: 3, // Rahul - Declining Performance
      student_name: "Rahul Menon",
      teacher_id: 102,
      teacher_name: "Prof. Sunita Rao",
      course_id: 2,
      course_name: "Machine Learning Foundations",
      title: "Algorithmic Complexity Remediation & Exam Review",
      risk_source: "Examinations",
      recommendation: "Focus revision on mid-term weak points and review dynamic programming fundamentals.",
      action: "Assigned 4 supplemental practice sets and weekly peer tutor session.",
      priority: "high",
      start_date: "2026-03-20",
      target_date: "2026-04-20",
      status: "IN_PROGRESS",
      checkpoints: [
        { id: "c4", date: "2026-03-27", title: "Practice Problem Set 1", notes: "Completed with 85% accuracy under tutor supervision.", completed: true },
        { id: "c5", date: "2026-04-03", title: "Mock Assessment 1", notes: "Upcoming mock test on Graph Algorithms.", completed: false }
      ],
      baseline_risk: 58.5,
      created_at: "2026-03-20T14:30:00Z"
    },
    {
      id: 3,
      student_id: 7, // Rohan - Critical Risk
      student_name: "Rohan Verma",
      teacher_id: 101,
      teacher_name: "Dr. Rajesh Iyer",
      course_id: 1,
      course_name: "Design & Analysis of Algorithms",
      title: "Academic Dean Warning & Comprehensive Recovery Plan",
      risk_source: "Multi-factor",
      recommendation: "Immediate multi-front intervention covering attendance, backlog submissions, and remedial testing.",
      action: "Formal contract signed with Academic Affairs. Required 10 hrs/week study hall attendance.",
      priority: "urgent",
      start_date: "2026-03-10",
      target_date: "2026-04-30",
      status: "IN_PROGRESS",
      checkpoints: [
        { id: "c6", date: "2026-03-17", title: "Dean Counseling Session", notes: "Student committed to catch up on 2 overdue assignments.", completed: true },
        { id: "c7", date: "2026-03-24", title: "Assignment Resubmission", notes: "Problem Set 1 resubmitted.", completed: false }
      ],
      baseline_risk: 76.8,
      created_at: "2026-03-10T09:00:00Z"
    }
  ];

  // In-App Notifications
  const notifications: Notification[] = [
    {
      id: 1,
      user_id: 1,
      title: "Dean's Commendation",
      message: "Congratulations on maintaining Low Risk status (Risk Score 7.2) across all enrolled courses.",
      type: "system",
      priority: "normal",
      read: false,
      created_at: "2026-03-18T09:00:00Z"
    },
    {
      id: 2,
      user_id: 2,
      title: "Attendance Warning Alert",
      message: "Your attendance has dropped to 58.0% (below 75% threshold). An intervention plan has been assigned.",
      type: "attendance_warning",
      priority: "urgent",
      read: false,
      created_at: "2026-03-15T11:05:00Z"
    },
    {
      id: 3,
      user_id: 3,
      title: "Academic Risk Escalation",
      message: "AURA detected a -18 point performance decline following recent examinations.",
      type: "risk_alert",
      priority: "urgent",
      read: false,
      created_at: "2026-03-20T14:35:00Z"
    },
    {
      id: 4,
      user_id: 101,
      title: "Critical Student Attention Required",
      message: "Student Rohan Verma has entered CRITICAL risk status (Score 76.8). Review radar queue.",
      type: "risk_alert",
      priority: "urgent",
      read: false,
      created_at: "2026-03-18T08:30:00Z"
    }
  ];

  // Audit Logs
  const auditLogs: AuditLog[] = [
    {
      id: 1,
      user_id: 999,
      user_name: "Dean Arthur Vance",
      user_role: "ADMIN",
      action: "LOGIN",
      entity: "Session",
      timestamp: "2026-03-18T07:45:00Z",
      metadata: { ip: "192.168.1.1", user_agent: "AURA Portal Client" }
    },
    {
      id: 2,
      user_id: 101,
      user_name: "Dr. Rajesh Iyer",
      user_role: "TEACHER",
      action: "CREATE_INTERVENTION",
      entity: "Intervention",
      entity_id: 1,
      timestamp: "2026-03-15T11:00:00Z",
      metadata: { student_id: 2, target: "Diya Sharma", category: "Attendance Recovery" }
    },
    {
      id: 3,
      user_id: 101,
      user_name: "Dr. Rajesh Iyer",
      user_role: "TEACHER",
      action: "RECORD_ATTENDANCE",
      entity: "Attendance",
      timestamp: "2026-03-17T10:30:00Z",
      metadata: { course_id: 1, total_students: 52, present: 48 }
    },
    {
      id: 4,
      user_id: 102,
      user_name: "Prof. Sunita Rao",
      user_role: "TEACHER",
      action: "GRADE_ASSIGNMENT",
      entity: "AssignmentSubmission",
      entity_id: 10,
      timestamp: "2026-03-16T15:20:00Z",
      metadata: { assignment_id: 4, student_id: 4, marks: 40 }
    },
    {
      id: 5,
      user_id: 999,
      user_name: "Dean Arthur Vance",
      user_role: "ADMIN",
      action: "EXPORT_REPORT",
      entity: "InstitutionalAnalytics",
      timestamp: "2026-03-18T08:00:00Z",
      metadata: { format: "CSV", report: "RiskDistribution" }
    }
  ];

  return {
    users,
    courses,
    classes,
    enrollments,
    assignments,
    assignmentSubmissions,
    examinations,
    examResults,
    attendanceRecords,
    interventions,
    notifications,
    auditLogs
  };
}
