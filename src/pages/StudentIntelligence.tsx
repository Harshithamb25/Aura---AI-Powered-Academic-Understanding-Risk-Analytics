import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Award,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
import { InsightObject, Recommendation } from '../types';
import { api } from '../services/api';
import { RiskBadge, TrendBadge } from '../components/RiskBadge';
import { AttendanceBufferCard } from '../components/AttendanceBufferCard';
import { WhatIfSimulator } from '../components/WhatIfSimulator';
import { AICopilotCard } from '../components/AICopilotCard';
import { InterventionModal } from '../components/InterventionModal';
import { useAuth } from '../services/auth';

interface StudentIntelligenceProps {
  studentId: number;
  onSelectStudent: (id: number) => void;
}

export const StudentIntelligence: React.FC<StudentIntelligenceProps> = ({ studentId, onSelectStudent }) => {
  const { user } = useAuth();
  const [insight, setInsight] = useState<InsightObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [selectedRecForIntervention, setSelectedRecForIntervention] = useState<any>(null);

  const fetchInsight = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getStudentIntelligence(studentId);
      setInsight(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load student telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, [studentId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Computing deterministic academic intelligence...</p>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <span className="font-semibold block">Failed to load telemetry</span>
            <span>{error || 'Student not found.'}</span>
          </div>
        </div>
      </div>
    );
  }

  const { student, attendance, assignments, examinations, overall_score, risk, trend, weak_subjects, recommendations, interventions } = insight;

  // Filter recommendations
  const filteredRecommendations = selectedCategory === 'all'
    ? recommendations
    : recommendations.filter(r => r.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const handleCreateInterventionFromRec = (rec: Recommendation) => {
    setSelectedRecForIntervention(rec);
    setInterventionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Student Archetype Header & Fast Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
                <RiskBadge level={risk.risk_level} score={risk.risk_score} size="md" />
                <TrendBadge direction={trend.direction} change={trend.change} />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span>Student ID: <strong className="font-mono text-slate-700">#{student.id}</strong></span>
                <span>•</span>
                <span>Department: <strong className="text-slate-700">{student.department}</strong></span>
                <span>•</span>
                <span>Year: <strong className="text-slate-700">Year {student.year || 3}</strong></span>
                <span>•</span>
                <span>Email: <strong className="text-slate-700">{student.email}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Archetype Switcher Tabs */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <label className="text-xs font-semibold text-slate-500">Switch Archetype:</label>
            <select
              id="select-archetype-dropdown"
              value={studentId}
              onChange={(e) => onSelectStudent(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="1">1. Aarav Kumar (Low Risk - High Achiever)</option>
              <option value="2">2. Diya Sharma (High Risk - Attendance Deficit)</option>
              <option value="3">3. Rahul Menon (High Risk - Declining Performance)</option>
              <option value="4">4. Ananya Patel (High Risk - Assignment Deficit)</option>
              <option value="5">5. Vikram Singh (High Risk - Examination Deficit)</option>
              <option value="6">6. Neha Gupta (Moderate Risk - Improving)</option>
              <option value="7">7. Rohan Verma (Critical Risk - Multi-factor)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5 HERO KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Risk Index */}
        <div id="kpi-risk-score" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AURA Risk Index</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{risk.risk_score}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <RiskBadge level={risk.risk_level} size="sm" />
            <span className="text-[11px] text-slate-500 truncate" title={risk.primary_factor}>
              Factor: {risk.primary_factor}
            </span>
          </div>
        </div>

        {/* KPI 2: Attendance & Buffer */}
        <div id="kpi-attendance" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${attendance.percentage < 75 ? 'text-rose-600' : 'text-slate-900'}`}>
              {attendance.percentage}%
            </span>
            <span className="text-xs text-slate-400">({attendance.attended}/{attendance.total})</span>
          </div>
          <div className="mt-2 text-[11px] font-medium">
            {attendance.buffer < 0 ? (
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                {Math.abs(attendance.buffer)} classes needed
              </span>
            ) : (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {attendance.buffer} safe session buffer
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Assignments */}
        <div id="kpi-assignments" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignment Avg</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{assignments.average}%</span>
            <span className="text-xs text-slate-400">({assignments.completed} done)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {assignments.overdue > 0 ? (
              <span className="text-rose-600 font-semibold">{assignments.overdue} overdue p-set(s)</span>
            ) : (
              <span className="text-emerald-600">Submissions current</span>
            )}
          </div>
        </div>

        {/* KPI 4: Examination Avg */}
        <div id="kpi-examinations" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Examination Avg</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{examinations.average}%</span>
            <span className="text-xs text-slate-400">({examinations.count} assessments)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {examinations.average < 60 ? (
              <span className="text-rose-600 font-semibold">Below passing mark</span>
            ) : (
              <span className="text-slate-600">Standard mastery</span>
            )}
          </div>
        </div>

        {/* KPI 5: Academic Trajectory */}
        <div id="kpi-trajectory" className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Velocity</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {trend.change >= 0 ? `+${trend.change}` : trend.change}
            </span>
            <span className="text-xs text-slate-400">pts</span>
          </div>
          <div className="mt-2">
            <TrendBadge direction={trend.direction} />
          </div>
        </div>
      </div>

      {/* SECTION: WHY IS THIS STUDENT AT RISK? (Explainable Risk Deep-Dive) */}
      <div id="section-explainable-risk" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Why is this student at risk? (Explainability Engine)</h2>
              <p className="text-xs text-slate-500">Mathematical attribution and observed telemetry signals grounded in university policy.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Primary Risk Driver:</span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {risk.primary_factor}
            </span>
          </div>
        </div>

        {/* Data-Grounded Narrative */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
            Automated Diagnostic Summary:
          </span>
          <p className="text-slate-700 leading-relaxed font-sans">
            {risk.explanation}
          </p>
        </div>

        {/* Component Contribution Breakdown (30% Att, 20% Ass, 30% Exam, 20% Trend) */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Signal Contribution Breakdown (Institutional Weights: Att 30% | Ass 20% | Exam 30% | Trend 20%)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Attendance Contribution */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-700">Attendance Risk (30%)</span>
                <span className="font-mono font-bold text-indigo-700">
                  +{risk.signals.attendance_contribution} pts
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (risk.signals.attendance_contribution / 30) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                Observed: {attendance.percentage}% (Threshold 75%)
              </span>
            </div>

            {/* Assignments Contribution */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-700">Assignment Risk (20%)</span>
                <span className="font-mono font-bold text-indigo-700">
                  +{risk.signals.assignment_contribution} pts
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (risk.signals.assignment_contribution / 20) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                Avg: {assignments.average}% ({assignments.overdue} overdue)
              </span>
            </div>

            {/* Examinations Contribution */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-700">Examination Risk (30%)</span>
                <span className="font-mono font-bold text-indigo-700">
                  +{risk.signals.examination_contribution} pts
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (risk.signals.examination_contribution / 30) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                Exam Avg: {examinations.average}%
              </span>
            </div>

            {/* Trend Contribution */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-700">Trajectory Risk (20%)</span>
                <span className="font-mono font-bold text-indigo-700">
                  +{risk.signals.trend_contribution} pts
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, (risk.signals.trend_contribution / 20) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                Delta: {trend.change >= 0 ? `+${trend.change}` : trend.change} points
              </span>
            </div>
          </div>
        </div>

        {/* Evidence Inspector Table */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Observed Telemetry Evidence vs Standards
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Indicator</th>
                  <th className="px-4 py-2.5">Observed Metric</th>
                  <th className="px-4 py-2.5">Institutional Standard</th>
                  <th className="px-4 py-2.5">Compliance Gap</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="px-4 py-3 font-medium">Class Attendance</td>
                  <td className="px-4 py-3 font-mono">{attendance.percentage}% ({attendance.attended}/{attendance.total})</td>
                  <td className="px-4 py-3 font-mono">≥ 75.0%</td>
                  <td className="px-4 py-3 font-mono">
                    {attendance.percentage < 75 ? `-${(75 - attendance.percentage).toFixed(1)}%` : '+Compliant'}
                  </td>
                  <td className="px-4 py-3">
                    {attendance.percentage < 75 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">Deficit</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Compliant</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Assignment Submissions</td>
                  <td className="px-4 py-3 font-mono">{assignments.average}% avg ({assignments.overdue} overdue)</td>
                  <td className="px-4 py-3 font-mono">≥ 60.0% (Zero overdue)</td>
                  <td className="px-4 py-3 font-mono">
                    {assignments.average < 60 ? `-${(60 - assignments.average).toFixed(1)}%` : 'Satisfactory'}
                  </td>
                  <td className="px-4 py-3">
                    {assignments.average < 60 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">Warning</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Satisfactory</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Exam Performance</td>
                  <td className="px-4 py-3 font-mono">{examinations.average}%</td>
                  <td className="px-4 py-3 font-mono">≥ 60.0% Passing Benchmark</td>
                  <td className="px-4 py-3 font-mono">
                    {examinations.average < 60 ? `-${(60 - examinations.average).toFixed(1)}%` : 'Passing'}
                  </td>
                  <td className="px-4 py-3">
                    {examinations.average < 60 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">Failing</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Passing</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Performance Trajectory</td>
                  <td className="px-4 py-3 font-mono">{trend.current_score} vs {trend.previous_score} baseline</td>
                  <td className="px-4 py-3 font-mono">Stable / Upward (≥ 0 pts)</td>
                  <td className="px-4 py-3 font-mono">
                    {trend.change >= 0 ? `+${trend.change} pts` : `${trend.change} pts`}
                  </td>
                  <td className="px-4 py-3">
                    {trend.change < -2 ? (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">Declining</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Healthy</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ATTENDANCE BUFFER CARD (Dynamic Interactive Section) */}
      <AttendanceBufferCard
        percentage={attendance.percentage}
        attended={attendance.attended}
        total={attendance.total}
        buffer={attendance.buffer}
        threshold={75}
      />

      {/* DATA-GROUNDED RECOMMENDATIONS */}
      <div id="section-recommendations" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Actionable Academic Recommendations</h2>
            <p className="text-xs text-slate-500">Prioritized recovery and optimization steps grounded in actual telemetry.</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {['all', 'Attendance', 'Assignments', 'Examinations', 'Trend'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-lg border transition-colors cursor-pointer capitalize ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecommendations.map((rec, idx) => (
            <div
              key={idx}
              id={`recommendation-card-${idx}`}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {rec.category}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    rec.priority === 'critical'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : rec.priority === 'high'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {rec.reason}
                </p>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                  <div>
                    <span className="font-semibold text-indigo-700">Action: </span>
                    <span>{rec.recommended_action}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Expected Impact: </span>
                    <span className="text-slate-600">{rec.expected_impact}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {rec.deadline || 'Current semester'}
                </span>

                {user?.role !== 'STUDENT' && (
                  <button
                    onClick={() => handleCreateInterventionFromRec(rec)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    <span>Create Intervention</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INTERACTIVE WHAT-IF SIMULATOR */}
      <WhatIfSimulator studentId={studentId} insight={insight} />

      {/* AI ACADEMIC COPILOT */}
      <AICopilotCard studentId={studentId} studentName={student.name} />

      {/* ACTIVE INTERVENTIONS FOR THIS STUDENT */}
      <div id="section-student-interventions" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Intervention Closed-Loop History</h2>
            <p className="text-xs text-slate-500">Formal remediation contracts, faculty checkpoints, and outcome measurements.</p>
          </div>

          {user?.role !== 'STUDENT' && (
            <button
              onClick={() => {
                setSelectedRecForIntervention(null);
                setInterventionModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Intervention</span>
            </button>
          )}
        </div>

        {interventions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No formal interventions recorded for this student.
          </div>
        ) : (
          <div className="space-y-4">
            {interventions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span>Assigned by: <strong>{item.teacher_name || 'Faculty'}</strong></span>
                      <span>•</span>
                      <span>Target: <strong>{item.target_date}</strong></span>
                      {item.course_name && (
                        <>
                          <span>•</span>
                          <span>Course: <strong>{item.course_name}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto ${
                    item.status === 'COMPLETED' || item.status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                  <p><strong>Action Prescribed:</strong> {item.action}</p>
                </div>

                {/* Checkpoints */}
                {item.checkpoints && item.checkpoints.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">Milestone Checkpoints:</span>
                    <div className="space-y-1.5">
                      {item.checkpoints.map((cp) => (
                        <div key={cp.id} className="flex items-start gap-2 text-xs text-slate-600">
                          {cp.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span><strong>{cp.date}</strong>: {cp.title} — {cp.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Intervention Modal */}
      <InterventionModal
        isOpen={interventionModalOpen}
        onClose={() => setInterventionModalOpen(false)}
        onSuccess={fetchInsight}
        preselectedStudent={{ id: student.id, name: student.name }}
        preselectedRecommendation={selectedRecForIntervention}
      />
    </div>
  );
};
