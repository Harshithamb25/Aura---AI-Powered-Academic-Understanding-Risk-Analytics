import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Course, User } from '../types';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedStudent?: { id: number; name: string };
  preselectedRecommendation?: { category: string; recommended_action: string; reason: string };
  students?: User[];
  courses?: Course[];
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedStudent,
  preselectedRecommendation,
  students = [],
  courses = []
}) => {
  const [studentId, setStudentId] = useState<number>(preselectedStudent?.id || (students[0]?.id || 1));
  const [courseId, setCourseId] = useState<number>(courses[0]?.id || 1);
  const [title, setTitle] = useState(
    preselectedRecommendation
      ? `${preselectedRecommendation.category} Support Plan`
      : 'Academic Performance Recovery Contract'
  );
  const [riskSource, setRiskSource] = useState(preselectedRecommendation?.category || 'Attendance');
  const [recommendation, setRecommendation] = useState(preselectedRecommendation?.reason || '');
  const [action, setAction] = useState(preselectedRecommendation?.recommended_action || '');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.createIntervention({
        student_id: studentId,
        course_id: courseId,
        title,
        risk_source: riskSource,
        recommendation,
        action,
        priority,
        target_date: targetDate
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create intervention');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Initiate Closed-Loop Academic Intervention</h3>
            <p className="text-xs text-slate-500">Formalize an action plan with milestones, check-ins, and outcome tracking.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Student Selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Student</label>
            {preselectedStudent ? (
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold">
                {preselectedStudent.name} (ID: #{preselectedStudent.id})
              </div>
            ) : (
              <select
                id="select-intervention-student"
                value={studentId}
                onChange={(e) => setStudentId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department} - Year {s.year})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Intervention Title</label>
              <input
                id="input-intervention-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Algorithmic Tutoring & Recovery"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <select
                id="select-intervention-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Risk Source & Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Risk Source</label>
              <select
                id="select-intervention-source"
                value={riskSource}
                onChange={(e) => setRiskSource(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Attendance">Attendance Deficit</option>
                <option value="Assignments">Assignment Deficit</option>
                <option value="Examinations">Examination Performance</option>
                <option value="Performance Trend">Performance Decline</option>
                <option value="Multi-factor">Multi-Factor Risk</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Associated Course</label>
              <select
                id="select-intervention-course"
                value={courseId}
                onChange={(e) => setCourseId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Context / Reason */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Observed Academic Context</label>
            <textarea
              id="input-intervention-reason"
              rows={2}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Student attendance has fallen to 58%, below 75% requirement."
            />
          </div>

          {/* Action Required */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Prescribed Action / Agreement</label>
            <textarea
              id="input-intervention-action"
              rows={2}
              required
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Bi-weekly progress check-in with faculty advisor and attend 100% of next 15 lectures."
            />
          </div>

          {/* Target Completion Date */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Target Evaluation Date</label>
            <input
              id="input-intervention-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-intervention"
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Assigning...' : 'Assign Intervention'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
