import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, AlertTriangle, PlusCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/auth';
import { Examination, ExaminationResult, Course, User } from '../types';

interface StudentExamsProps {
  studentId: number;
}

export const StudentExams: React.FC<StudentExamsProps> = ({ studentId }) => {
  const { user } = useAuth();
  const [examResults, setExamResults] = useState<ExaminationResult[]>([]);
  const [allExams, setAllExams] = useState<Examination[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Teacher Mark Entry
  const [showMarkEntry, setShowMarkEntry] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number>(1);
  const [examStudentId, setExamStudentId] = useState<number>(studentId);
  const [marksObtained, setMarksObtained] = useState<number>(75);
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordMsg, setRecordMsg] = useState('');

  const fetchExamsData = async () => {
    setLoading(true);
    try {
      const [resList, exList, cList, sList] = await Promise.all([
        api.getStudentExamResults(studentId),
        api.getExaminations(),
        api.getCourses(),
        api.getStudents()
      ]);
      setExamResults(resList);
      setAllExams(exList);
      setCourses(cList);
      setStudents(sList);
      if (exList.length > 0) setSelectedExamId(exList[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsData();
  }, [studentId]);

  const handleRecordMark = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordSubmitting(true);
    setRecordMsg('');

    try {
      await api.recordExamResult(selectedExamId, examStudentId, marksObtained);
      setRecordMsg('Exam score recorded successfully!');
      fetchExamsData();
      setTimeout(() => setRecordMsg(''), 3000);
    } catch (err: any) {
      setRecordMsg('Failed: ' + (err.message || 'Error recording mark'));
    } finally {
      setRecordSubmitting(false);
    }
  };

  const avgPct = examResults.length > 0
    ? Number((examResults.reduce((acc, e) => acc + e.percentage, 0) / examResults.length).toFixed(1))
    : 0;

  const passedCount = examResults.filter(e => e.percentage >= 60).length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Examinations & Formal Assessments</h1>
            <p className="text-xs text-slate-500">
              Summative assessment records, benchmark evaluations, and gradebook registry.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Examination Average</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${avgPct < 60 ? 'text-rose-600' : 'text-slate-900'}`}>
              {avgPct}%
            </span>
            <span className="text-xs text-slate-500">aggregate across {examResults.length} exams</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pass Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {examResults.length > 0 ? Math.round((passedCount / examResults.length) * 100) : 100}%
            </span>
            <span className="text-xs text-slate-500">({passedCount} / {examResults.length} passed)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Telemetry Status</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${avgPct < 55 ? 'text-rose-600' : 'text-slate-800'}`}>
              {avgPct < 55 ? 'High Exam Risk' : 'Acceptable'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">Calculated at 30% weight in AURA model</span>
        </div>
      </div>

      {/* Faculty Mark Entry Accordion */}
      {user?.role !== 'STUDENT' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Faculty Grade Entry Portal</h2>
              <p className="text-xs text-slate-500">Enter or update exam marks with automated letter grade calculation.</p>
            </div>
            <button
              onClick={() => setShowMarkEntry(!showMarkEntry)}
              className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
            >
              {showMarkEntry ? 'Collapse Form' : '+ Enter New Exam Mark'}
            </button>
          </div>

          {showMarkEntry && (
            <form onSubmit={handleRecordMark} className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Examination</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {allExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} (Max {ex.max_marks})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Student</label>
                <select
                  value={examStudentId}
                  onChange={(e) => setExamStudentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Score Obtained</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={recordSubmitting}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer transition"
                >
                  {recordSubmitting ? 'Saving...' : 'Submit Mark Entry'}
                </button>
              </div>

              {recordMsg && (
                <div className="col-span-full p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                  {recordMsg}
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* Examinations Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Recorded Examination Assessment Results</h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Assessment Name</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Score Achieved</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {examResults.map((e) => {
                const pct = e.percentage;
                return (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {e.examination_title || `Exam #${e.examination_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {e.course_name || `Course #${e.course_id || 'N/A'}`}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {e.marks} / {e.max_marks}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className={pct < 60 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {e.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pct >= 85 ? (
                        <span className="text-[11px] font-bold text-emerald-700">Excellent (A)</span>
                      ) : pct >= 70 ? (
                        <span className="text-[11px] font-bold text-indigo-700">Proficient (B)</span>
                      ) : pct >= 60 ? (
                        <span className="text-[11px] font-bold text-amber-700">Pass (C)</span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700">Below Passing (F)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
