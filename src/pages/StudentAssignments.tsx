import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Users,
  Search,
  Check,
  Eye,
  Trash2,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/auth';
import { Assignment, AssignmentSubmission, AssignmentMatrixResponse, Course } from '../types';

interface StudentAssignmentsProps {
  studentId: number;
}

export const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ studentId }) => {
  const { user } = useAuth();
  const isFacultyOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // Mode switcher for Faculty/Admin: 'my_view' (student view) or 'matrix' (cohort completion matrix)
  const [activeTab, setActiveTab] = useState<'student_view' | 'faculty_matrix'>(
    isFacultyOrAdmin ? 'faculty_matrix' : 'student_view'
  );

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal (Student)
  const [selectedAssignForSubmit, setSelectedAssignForSubmit] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Grade Modal (Teacher)
  const [gradeModalData, setGradeModalData] = useState<{
    submissionId: number;
    studentName: string;
    assignmentTitle: string;
    submissionText: string;
    marks: number;
    maxMarks: number;
    feedback: string;
  } | null>(null);
  const [grading, setGrading] = useState(false);

  // Create Assignment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    course_id: 1,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    max_marks: 100
  });
  const [creating, setCreating] = useState(false);

  // Matrix View State
  const [selectedMatrixAssignmentId, setSelectedMatrixAssignmentId] = useState<number | null>(null);
  const [matrixData, setMatrixData] = useState<AssignmentMatrixResponse | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'submitted' | 'pending' | 'overdue'>('all');
  const [matrixSearch, setMatrixSearch] = useState('');

  // Status feedback toast
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aList, cList] = await Promise.all([
        api.getStudentAssignments(studentId),
        api.getCourses()
      ]);
      setAssignments(aList);
      setCourses(cList);
      if (cList.length > 0 && !createForm.course_id) {
        setCreateForm(prev => ({ ...prev, course_id: cList[0].id }));
      }
      if (aList.length > 0 && !selectedMatrixAssignmentId) {
        setSelectedMatrixAssignmentId(aList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  // Fetch matrix when selectedMatrixAssignmentId changes
  const fetchMatrix = async (assignId: number) => {
    setLoadingMatrix(true);
    try {
      const res = await api.getAssignmentSubmissionsMatrix(assignId);
      setMatrixData(res);
    } catch (e) {
      console.error('Failed to load submissions matrix', e);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (selectedMatrixAssignmentId) {
      fetchMatrix(selectedMatrixAssignmentId);
    }
  }, [selectedMatrixAssignmentId]);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignForSubmit) return;
    setSubmitting(true);
    try {
      await api.submitAssignment(selectedAssignForSubmit.id, submissionContent, studentId);
      setSelectedAssignForSubmit(null);
      setSubmissionContent('');
      setStatusMessage({ type: 'success', text: 'Assignment submitted successfully!' });
      await fetchData();
      if (selectedMatrixAssignmentId) fetchMatrix(selectedMatrixAssignmentId);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title) return;
    setCreating(true);
    try {
      const created = await api.createAssignment(createForm);
      setStatusMessage({ type: 'success', text: `Assignment "${created.title}" published to cohort.` });
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        course_id: courses[0]?.id || 1,
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        max_marks: 100
      });
      await fetchData();
      setSelectedMatrixAssignmentId(created.id);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create assignment' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssignment = async (id: number, title: string) => {
    if (!confirm(`Delete assignment "${title}" and all its recorded student submissions?`)) return;
    try {
      await api.deleteAssignment(id);
      setStatusMessage({ type: 'success', text: `Assignment "${title}" removed.` });
      const nextList = assignments.filter(a => a.id !== id);
      setAssignments(nextList);
      if (nextList.length > 0) {
        setSelectedMatrixAssignmentId(nextList[0].id);
      } else {
        setSelectedMatrixAssignmentId(null);
        setMatrixData(null);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete assignment' });
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeModalData) return;
    setGrading(true);
    try {
      await api.gradeAssignment(gradeModalData.submissionId, gradeModalData.marks, gradeModalData.feedback);
      setGradeModalData(null);
      setStatusMessage({ type: 'success', text: `Marked recorded for ${gradeModalData.studentName}.` });
      await fetchData();
      if (selectedMatrixAssignmentId) fetchMatrix(selectedMatrixAssignmentId);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Grading failed' });
    } finally {
      setGrading(false);
    }
  };

  const assignmentsWithStatus = assignments.map((a) => {
    const isOverdue = !a.submission && new Date(a.due_date) < new Date();
    return { ...a, isOverdue };
  });

  const total = assignmentsWithStatus.length;
  const submittedCount = assignmentsWithStatus.filter(a => !!a.submission).length;
  const overdueCount = assignmentsWithStatus.filter(a => a.isOverdue).length;
  const gradedSubs = assignmentsWithStatus.filter(a => a.submission && a.submission.marks !== null && a.submission.marks !== undefined);
  const avgScore = gradedSubs.length > 0
    ? Number((gradedSubs.reduce((acc, a) => acc + (a.submission?.marks || 0), 0) / gradedSubs.length).toFixed(1))
    : 0;

  // Filter matrix students
  const filteredMatrixStudents = matrixData?.students.filter((st) => {
    const matchesFilter = matrixFilter === 'all' || st.status === matrixFilter;
    const matchesSearch =
      st.student_name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      st.email.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      st.department.toLowerCase().includes(matrixSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Assignments Portal &amp; Completion Tracker</h1>
              <p className="text-xs text-slate-500">
                Coursework deliverables, automated deadline tracking, and faculty submission completion matrix.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFacultyOrAdmin && (
              <button
                id="btn-assign-new-assignment"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Assign New Assignment</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode Switcher for Faculty */}
        {isFacultyOrAdmin && (
          <div className="flex items-center gap-2 mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={() => setActiveTab('faculty_matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'faculty_matrix'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cohort Completion Matrix &amp; Evaluation</span>
            </button>

            <button
              onClick={() => setActiveTab('student_view')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-2 ${
                activeTab === 'student_view'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Active Student Workspace View (#{studentId})</span>
            </button>
          </div>
        )}

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold underline cursor-pointer ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FACULTY COMPLETION MATRIX TAB */}
      {/* ========================================================================= */}
      {activeTab === 'faculty_matrix' && (
        <div className="space-y-6">
          {/* Assignment Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Select Assignment to Inspect Completion:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {assignments.map((a) => {
                    const isSelected = a.id === selectedMatrixAssignmentId;
                    return (
                      <button
                        key={a.id}
                        id={`btn-select-assignment-${a.id}`}
                        onClick={() => setSelectedMatrixAssignmentId(a.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{a.title}</span>
                        <span className="ml-1.5 text-[10px] text-slate-400">({a.course_code || 'Course'})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedMatrixAssignmentId && isFacultyOrAdmin && (
                <button
                  onClick={() => {
                    const a = assignments.find(x => x.id === selectedMatrixAssignmentId);
                    if (a) handleDeleteAssignment(a.id, a.title);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Assignment</span>
                </button>
              )}
            </div>
          </div>

          {/* Matrix KPI Cards */}
          {matrixData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-slate-900">
                    {matrixData.metrics.total_students}
                  </span>
                  <span className="text-xs text-slate-400">students</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Completed / Submitted</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-emerald-600">
                    {matrixData.metrics.completion_percentage}%
                  </span>
                  <span className="text-xs text-slate-500">({matrixData.metrics.submitted_count} submitted)</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Pending</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-amber-600">
                    {matrixData.metrics.pending_count}
                  </span>
                  <span className="text-xs text-slate-400">in progress</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Overdue / Missing</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono text-rose-600">
                    {matrixData.metrics.overdue_count}
                  </span>
                  <span className="text-xs text-slate-400">past deadline</span>
                </div>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or dept..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {(['all', 'submitted', 'pending', 'overdue'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setMatrixFilter(filterKey)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer shrink-0 ${
                    matrixFilter === filterKey
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Completion Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800">
                Student Completion Roster ({filteredMatrixStudents.length})
              </h2>
              {matrixData && (
                <span className="text-xs text-slate-500">
                  Due Date: <strong className="text-slate-800">{matrixData.assignment.due_date}</strong> (Max: {matrixData.assignment.max_marks} marks)
                </span>
              )}
            </div>

            {loadingMatrix ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading student submissions matrix...</div>
            ) : filteredMatrixStudents.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No students match this filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Department &amp; Year</th>
                      <th className="py-3 px-4">Completion Status</th>
                      <th className="py-3 px-4">Submission Text / Date</th>
                      <th className="py-3 px-4">Score &amp; Feedback</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredMatrixStudents.map((st) => {
                      return (
                        <tr key={st.student_id} className="hover:bg-slate-50/75 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">{st.student_name}</span>
                            <span className="text-slate-400 text-[11px]">{st.email}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-slate-700 block">{st.department}</span>
                            <span className="text-slate-400 text-[11px]">Year {st.year}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            {st.status === 'submitted' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Completed
                              </span>
                            ) : st.status === 'overdue' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold rounded-full">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            {st.submission_text ? (
                              <div className="space-y-0.5">
                                <p className="truncate text-slate-700 font-mono text-[11px]">
                                  &quot;{st.submission_text}&quot;
                                </p>
                                <span className="text-[10px] text-slate-400 block">
                                  Submitted {new Date(st.submitted_at || '').toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No response yet</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {st.marks !== null ? (
                              <div>
                                <span className="font-bold text-slate-900 font-mono">
                                  {st.marks} / {st.max_marks}
                                </span>
                                {st.feedback && (
                                  <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-xs">
                                    {st.feedback}
                                  </p>
                                )}
                              </div>
                            ) : st.status === 'submitted' ? (
                              <span className="text-amber-600 font-medium text-[11px]">Ungraded</span>
                            ) : (
                              <span className="text-slate-300 font-mono">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {st.status === 'submitted' && st.submission_id ? (
                              <button
                                id={`btn-grade-${st.submission_id}`}
                                onClick={() =>
                                  setGradeModalData({
                                    submissionId: st.submission_id!,
                                    studentName: st.student_name,
                                    assignmentTitle: matrixData?.assignment.title || 'Assignment',
                                    submissionText: st.submission_text || '',
                                    marks: st.marks !== null ? st.marks : 85,
                                    maxMarks: st.max_marks,
                                    feedback: st.feedback || ''
                                  })
                                }
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                {st.marks !== null ? 'Re-grade' : 'Grade'}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Awaiting Work</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENT PERSPECTIVE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'student_view' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {total > 0 ? Math.round((submittedCount / total) * 100) : 100}%
                </span>
                <span className="text-xs text-slate-500">({submittedCount} / {total} delivered)</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Graded Average</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold font-mono ${avgScore < 60 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {avgScore}%
                </span>
                <span className="text-xs text-slate-500">({gradedSubs.length} graded)</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Alerts</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold font-mono ${overdueCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {overdueCount}
                </span>
                <span className="text-xs text-slate-500">pending resolution</span>
              </div>
            </div>
          </div>

          {/* Assignments List */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                Coursework Deliverables ({assignments.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No assignments posted for this course profile.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignmentsWithStatus.map((item) => {
                  const hasSubmitted = !!item.submission;
                  const isGraded = hasSubmitted && typeof item.submission?.marks === 'number';

                  return (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold rounded">
                            {item.course_code || 'COURSE'}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                          {hasSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Submitted
                            </span>
                          ) : item.isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold rounded-full">
                              <Clock className="w-3 h-3" />
                              Due in {Math.ceil((new Date(item.due_date).getTime() - Date.now()) / 86400000)}d
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600">{item.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span>Due: <strong className="text-slate-600">{item.due_date}</strong></span>
                          <span>Max Marks: <strong className="text-slate-600">{item.max_marks}</strong></span>
                          {hasSubmitted && item.submission?.submitted_at && (
                            <span>Turned in: <strong className="text-slate-600">{new Date(item.submission.submitted_at).toLocaleDateString()}</strong></span>
                          )}
                        </div>

                        {/* Submission feedback if graded */}
                        {isGraded && (
                          <div className="mt-2 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-indigo-900">
                                Score: {item.submission?.marks} / {item.max_marks} ({Math.round(((item.submission?.marks || 0) / item.max_marks) * 100)}%)
                              </span>
                              <span className="text-[10px] text-indigo-600 font-semibold uppercase">Graded</span>
                            </div>
                            {item.submission?.feedback && (
                              <p className="text-slate-600 italic text-[11px]">
                                &quot;{item.submission.feedback}&quot;
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          id={`btn-submit-${item.id}`}
                          onClick={() => {
                            setSelectedAssignForSubmit(item);
                            setSubmissionContent(item.submission?.submission_text || '');
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            hasSubmitted
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                          }`}
                        >
                          {hasSubmitted ? 'Update Submission' : 'Submit Response'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Student Submit Modal */}
      {selectedAssignForSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Submit: {selectedAssignForSubmit.title}</h3>
              <button
                onClick={() => setSelectedAssignForSubmit(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment Deliverable Response or Link
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste your solution writeup, algorithm implementation, or hosted repository URL..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignForSubmit(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Transmitting...' : 'Submit Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal (Teacher) */}
      {gradeModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Evaluate: {gradeModalData.studentName}</h3>
              <button
                onClick={() => setGradeModalData(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Submitted Response:</span>
                <p className="text-slate-800 font-mono mt-1">&quot;{gradeModalData.submissionText}&quot;</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marks (Out of {gradeModalData.maxMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={gradeModalData.maxMarks}
                  required
                  value={gradeModalData.marks}
                  onChange={(e) =>
                    setGradeModalData({ ...gradeModalData, marks: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Provide structured feedback..."
                  value={gradeModalData.feedback}
                  onChange={(e) =>
                    setGradeModalData({ ...gradeModalData, feedback: e.target.value })
                  }
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradeModalData(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {grading ? 'Recording...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assignment Modal (Faculty) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Assign New Coursework</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Problem Set 3: Recurrent Networks"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course</label>
                <select
                  value={createForm.course_id}
                  onChange={(e) => setCreateForm({ ...createForm, course_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description &amp; Objectives</label>
                <textarea
                  rows={3}
                  placeholder="Detail the assignment deliverables, test suite specifications, and submission criteria..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    required
                    value={createForm.max_marks}
                    onChange={(e) => setCreateForm({ ...createForm, max_marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish to Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
