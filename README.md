# AURA — Academic Understanding, Risk & Action

> An explainable, closed-loop academic intelligence platform featuring multi-factor risk detection, attendance buffer calculus, what-if scenario simulation, and faculty intervention workflows.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)

---

## Overview

Educational institutions often suffer from fragmented student data: attendance records, assignment portals, and exam grades live in isolated silos, leaving instructors unaware of students in distress until final grades are posted.

**AURA** solves this problem by functioning as a unified academic early-warning and remediation system. Rather than relying on black-box heuristics, AURA implements a **mathematically deterministic multi-factor risk engine**, calculates **real-time attendance buffers**, and provides **faculty triage radars** linked to closed-loop intervention contracts.

---

## Core Capabilities

### 1. Deterministic Academic Intelligence Engine
- **Multi-Factor Risk Scoring**: Evaluates student telemetry across four weighted dimensions:
  $$\text{Composite Risk} = 0.30 \times \text{Attendance} + 0.20 \times \text{Assignments} + 0.30 \times \text{Examinations} + 0.20 \times \text{Trend}$$
- **Tier Classification**: Categorizes students into four explicit tiers:
  - **Low Risk** ($< 25$)
  - **Moderate Watchlist** ($25 - 50$)
  - **High Attention** ($50 - 75$)
  - **Critical Urgency** ($> 75$)
- **Explainability**: Isolates primary risk drivers, contributing behavioral signals, and prioritized student recommendations.

### 2. Attendance Calculus & Buffer Optimization
- Automatically calculates the minimum institutional attendance threshold ($75\%$):
  - **Safe Absence Buffer**: $A - 3T$ (for $A/T \ge 0.75$) — indicates how many upcoming lectures a student can miss without dropping below compliance.
  - **Recovery Countdown**: $3T - 4A$ (for $A/T < 0.75$) — computes the consecutive sessions a student must attend to restore compliant standing.

### 3. Non-Destructive What-If Simulation
- Interactive modeling sliders allowing students and advisors to simulate hypothetical future attendance, assignment delivery scores, and upcoming examination grades.
- Generates live trajectory comparisons and delta charts against the student's current baseline.

### 4. Grounded AI Academic Copilot
- Integrated conversational assistant powered by Google Gemini (with deterministic rule-based fallback).
- Grounded in real-time academic records, historical exam trends, and active coursework deadlines.

### 5. Faculty Attention Radar & Closed-Loop Interventions
- **Cohort Triage**: Faculty overview ranking students by risk urgency.
- **Contract Workflows**: Formal remediation plans featuring milestones, target completion dates, assigned faculty mentors, and pre/post intervention impact scoring.

### 6. Coursework Portal & Completion Matrix
- **Faculty Deliverable Authoring**: Create and publish assignments with deadlines and point weights.
- **Cohort Completion Matrix**: Real-time evaluation grid tracking completion percentages, pending work, overdue submissions, and inline grading with feedback.

### 7. Custom Dataset Management
- **Dataset Ingestion**: Manual single-student creation or bulk CSV import (`name, email, department, year, attendance_pct, exam_score`).
- **Automated Seeding**: Automatically initializes course enrollments, historical session attendance logs, and baseline assessment records for newly imported cohorts.

---

## Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Tailwind CSS v4 | Responsive Single-Page Application |
| **Icons & Visuals** | Lucide React | Clean, high-contrast iconography |
| **Backend Service** | Express.js, TypeScript | REST API, role authentication, deterministic calculation engine |
| **AI Integration** | Google GenAI SDK (`@google/genai`) | Academic Copilot with telemetry grounding |
| **Bundling & Build** | Vite, esbuild, tsx | Development hot-reload and optimized production build |

---

## Project Structure

```text
├── backend/                  # Python/FastAPI service assets (optional extension)
├── server/                   # Backend seed data and intelligence calculation logic
│   ├── data/
│   │   └── seedData.ts       # Canonical benchmark cohort & course registry
│   └── intelligence/
│       └── engine.ts         # Multi-factor formula & buffer calculus implementation
├── src/
│   ├── components/           # Navigation, header, modals, and shared UI primitives
│   ├── pages/
│   │   ├── StudentIntelligence.tsx  # Primary student cockpit & AI Copilot
│   │   ├── TeacherRiskRadar.tsx     # Faculty attention radar triage view
│   │   ├── TeacherInterventions.tsx # Closed-loop remediation contracts
│   │   ├── StudentAssignments.tsx   # Coursework submission & completion matrix
│   │   ├── StudentDirectory.tsx     # Custom student dataset & CSV import
│   │   ├── StudentAttendance.tsx    # Session-by-session attendance audit logs
│   │   ├── StudentExams.tsx         # Assessment performance & gradebook
│   │   ├── Courses.tsx              # Institutional catalog & syllabi
│   │   └── AdminAnalytics.tsx       # Institutional KPIs & audit logging
│   ├── services/             # API client methods and authentication providers
│   ├── types/                # TypeScript interface definitions
│   ├── App.tsx               # Main application component
│   └── main.tsx              # Application entry point
├── server.ts                 # Express backend API server & Vite middleware
├── package.json              # Project dependencies and build scripts
└── tsconfig.json             # TypeScript compiler configuration
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/aura-academic-intelligence.git
   cd aura-academic-intelligence
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Add your Google Gemini API key for live generative AI responses:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   > **Note**: If no API key is provided, AURA automatically uses its built-in rule-based academic reasoning engine.

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build

To compile both client and server for containerized or production hosting:

```bash
npm run build
npm start
```

This compiles static assets into `dist/` and packages the backend into `dist/server.cjs`.

---

## Role-Based Access Credentials

AURA includes pre-configured demo credentials for immediate testing across user archetypes:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Student** | `aarav.kumar@aura.edu` | `student123` | Personal academic intelligence, What-If simulation, assignment submission |
| **Teacher** | `rajesh.iyer@aura.edu` | `teacher123` | Cohort attention radar, coursework authoring, grading matrix, interventions |
| **Admin** | `sarah.jenkins@aura.edu` | `admin123` | Institutional KPIs, dataset import/export, student deletion, audit logging |

You can also use the one-click **"Demo Role Quick Switcher"** in the top navigation bar to toggle between personas instantly.

---

## License

This project is licensed under the MIT License.
