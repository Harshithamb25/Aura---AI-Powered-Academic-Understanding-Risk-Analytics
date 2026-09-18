import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, AlertTriangle, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { WhatIfResponse, InsightObject } from '../types';
import { api } from '../services/api';
import { RiskBadge } from './RiskBadge';

interface WhatIfSimulatorProps {
  studentId: number;
  insight: InsightObject;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ studentId, insight }) => {
  const [examScore, setExamScore] = useState<number>(Math.round(insight.examinations.average));
  const [attendance, setAttendance] = useState<number>(Math.round(insight.attendance.percentage));
  const [assignmentScore, setAssignmentScore] = useState<number>(Math.round(insight.assignments.average));

  const [simulation, setSimulation] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runSim = async (exam: number, att: number, ass: number) => {
    setLoading(true);
    try {
      const res = await api.runWhatIf({
        student_id: studentId,
        target_exam_score: exam,
        projected_attendance: att,
        projected_assignment_score: ass
      });
      setSimulation(res);
    } catch (e) {
      console.error("Simulation error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSim(examScore, attendance, assignmentScore);
  }, [studentId]);

  const handleSliderChange = (type: 'exam' | 'att' | 'ass', val: number) => {
    if (type === 'exam') {
      setExamScore(val);
      runSim(val, attendance, assignmentScore);
    } else if (type === 'att') {
      setAttendance(val);
      runSim(examScore, val, assignmentScore);
    } else {
      setAssignmentScore(val);
      runSim(examScore, attendance, val);
    }
  };

  const handleReset = () => {
    const defaultExam = Math.round(insight.examinations.average);
    const defaultAtt = Math.round(insight.attendance.percentage);
    const defaultAss = Math.round(insight.assignments.average);
    setExamScore(defaultExam);
    setAttendance(defaultAtt);
    setAssignmentScore(defaultAss);
    runSim(defaultExam, defaultAtt, defaultAss);
  };

  return (
    <div id="what-if-simulator" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Interactive What-If Scenario Simulator</h3>
            <p className="text-xs text-slate-500">Project hypothetical academic outcomes and observe risk delta in real-time.</p>
          </div>
        </div>

        <button
          id="btn-reset-whatif"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset to Current</span>
        </button>
      </div>

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Sliders Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Target Exam Score */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1.5">
              <span>Target Final Exam Score (30% weight)</span>
              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {examScore} / 100
              </span>
            </div>
            <input
              id="slider-whatif-exam"
              type="range"
              min="0"
              max="100"
              value={examScore}
              onChange={(e) => handleSliderChange('exam', Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0 (Failing)</span>
              <span>Observed: {insight.examinations.average.toFixed(1)}%</span>
              <span>100 (Full Marks)</span>
            </div>
          </div>

          {/* Projected Attendance */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1.5">
              <span>Projected Final Attendance (30% weight)</span>
              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {attendance}%
              </span>
            </div>
            <input
              id="slider-whatif-attendance"
              type="range"
              min="0"
              max="100"
              value={attendance}
              onChange={(e) => handleSliderChange('att', Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0%</span>
              <span className="font-semibold text-slate-600">Threshold: 75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Projected Assignment Score */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1.5">
              <span>Projected Assignment Average (20% weight)</span>
              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {assignmentScore}%
              </span>
            </div>
            <input
              id="slider-whatif-assignment"
              type="range"
              min="0"
              max="100"
              value={assignmentScore}
              onChange={(e) => handleSliderChange('ass', Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0%</span>
              <span>Observed: {insight.assignments.average.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Real-Time Outcome Comparison Column */}
        <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projected Impact Analysis</span>

            {simulation && (
              <div className="mt-4 space-y-4">
                {/* Risk Score Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Current Status</span>
                    <div className="mt-1">
                      <RiskBadge level={simulation.current_risk_level} score={simulation.current_risk} size="sm" />
                    </div>
                    <span className="text-xs text-slate-600 font-mono block mt-1.5">
                      Composite: {simulation.current_overall}%
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-indigo-200 ring-1 ring-indigo-100">
                    <span className="text-[11px] text-indigo-600 font-semibold block">Simulated Outcome</span>
                    <div className="mt-1">
                      <RiskBadge level={simulation.projected_risk_level} score={simulation.projected_risk} size="sm" />
                    </div>
                    <span className="text-xs text-indigo-700 font-mono block mt-1.5 font-medium">
                      Composite: {simulation.projected_overall}%
                    </span>
                  </div>
                </div>

                {/* Risk Delta Banner */}
                <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  simulation.risk_change < 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : simulation.risk_change > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2 font-medium">
                    {simulation.risk_change < 0 ? (
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {simulation.risk_change < 0
                        ? `Projected Risk Reduction: ${Math.abs(simulation.risk_change)} points`
                        : simulation.risk_change > 0
                        ? `Projected Risk Increase: +${simulation.risk_change} points`
                        : 'No change in projected risk index'}
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    {simulation.current_risk} → {simulation.projected_risk}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Disclaimer */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-start gap-2 text-[11px] text-slate-500 leading-normal">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Notice:</strong> Simulation only — not a guaranteed prediction. Projections represent mathematical scenarios derived from the AURA deterministic intelligence model based on simulated telemetry inputs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
