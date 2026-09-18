import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/auth';
import { User, NewStudentPayload, BulkImportStudent } from '../types';

interface StudentDirectoryProps {
  selectedStudentId: number;
  onSelectStudent: (id: number) => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  selectedStudentId,
  onSelectStudent
}) => {
  const { user } = useAuth();
  const isFacultyOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<NewStudentPayload>({
    name: '',
    email: '',
    department: 'Computer Science',
    year: 2,
    attendance_pct: 85,
    exam_score: 75
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<BulkImportStudent[]>([]);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email) return;
    setSubmittingAdd(true);
    try {
      const created = await api.createStudent(addForm);
      setStatusMessage({ type: 'success', text: `Student ${created.name} registered and enrolled successfully.` });
      setShowAddModal(false);
      setAddForm({
        name: '',
        email: '',
        department: 'Computer Science',
        year: 2,
        attendance_pct: 85,
        exam_score: 75
      });
      await fetchStudents();
      onSelectStudent(created.id);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to add student' });
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleDeleteStudent = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the student database?`)) return;
    try {
      await api.deleteStudent(id);
      setStatusMessage({ type: 'success', text: `Student ${name} removed.` });
      if (selectedStudentId === id) {
        const remaining = students.filter(s => s.id !== id);
        if (remaining.length > 0) onSelectStudent(remaining[0].id);
      }
      await fetchStudents();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete student' });
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset academic database to canonical 7-student benchmark cohort?')) return;
    try {
      await api.resetCohortDefaults();
      setStatusMessage({ type: 'success', text: 'Database restored to canonical cohort.' });
      await fetchStudents();
      onSelectStudent(1);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset cohort' });
    }
  };

  // CSV parsing logic
  const handleParseCsv = (raw: string) => {
    setCsvText(raw);
    const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      setParsedPreview([]);
      return;
    }

    // header row check
    const header = lines[0].toLowerCase();
    const startIndex = header.includes('name') || header.includes('email') ? 1 : 0;

    const parsed: BulkImportStudent[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        parsed.push({
          name: parts[0] || 'Unknown Student',
          email: parts[1] || `student${i}@aura.edu`,
          department: parts[2] || 'Computer Science',
          year: parts[3] ? parseInt(parts[3], 10) || 2 : 2,
          attendance_pct: parts[4] ? parseFloat(parts[4]) || 80 : 80,
          exam_score: parts[5] ? parseFloat(parts[5]) || 70 : 70
        });
      }
    }
    setParsedPreview(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) handleParseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedPreview.length === 0) return;
    setImporting(true);
    setImportFeedback(null);
    try {
      const res = await api.bulkImportStudents(parsedPreview);
      setImportFeedback(res.message);
      setStatusMessage({ type: 'success', text: res.message });
      await fetchStudents();
      setTimeout(() => {
        setShowImportModal(false);
        setCsvText('');
        setParsedPreview([]);
      }, 1500);
    } catch (err: any) {
      setImportFeedback(`Error: ${err.message || 'Import failed'}`);
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'name,email,department,year,attendance_pct,exam_score\n' +
      'Maya Chen,maya.chen@aura.edu,Computer Science,3,92,88\n' +
      'Vikram Reddy,vikram.reddy@aura.edu,Data Science,2,68,54\n' +
      'Sara Al-Mansoor,sara.m@aura.edu,Information Technology,4,84,76\n' +
      'Tariq Malik,tariq.malik@aura.edu,Artificial Intelligence,1,58,45';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'aura_students_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departments = ['ALL', ...Array.from(new Set(students.map(s => s.department || 'Computer Science')))];

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = departmentFilter === 'ALL' || s.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Student Dataset & Directory</h1>
              <p className="text-xs text-slate-500">
                Manage enrolled cohorts, inject custom datasets, and inspect student telemetry.
              </p>
            </div>
          </div>

          {isFacultyOrAdmin && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="btn-add-student-modal"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Student</span>
              </button>

              <button
                id="btn-import-csv-modal"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Import Dataset (CSV)</span>
              </button>

              <button
                id="btn-reset-defaults"
                onClick={handleResetDefaults}
                title="Reset to initial 7-student benchmark cohort"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Cohort</span>
              </button>
            </div>
          )}
        </div>

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

      {/* Cohort KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled Cohort</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{students.length}</span>
            <span className="text-xs text-slate-500">active profiles</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{departments.length - 1}</span>
            <span className="text-xs text-slate-500">disciplines active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Workspace Student</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-bold text-indigo-600 truncate">
              {students.find(s => s.id === selectedStudentId)?.name || `Student #${selectedStudentId}`}
            </span>
            <span className="text-xs text-slate-400">ID #{selectedStudentId}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="student-search-input"
            type="text"
            placeholder="Search students by name, email, or dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Filter Dept:</span>
          <select
            id="student-dept-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Student Roster ({filteredStudents.length})
          </h2>
          <span className="text-xs text-slate-400">
            Click &quot;Switch View&quot; to inspect any student&apos;s risk radar &amp; intelligence profile
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading student directory...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No students match your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Department &amp; Year</th>
                  <th className="py-3 px-4">Workspace Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((st) => {
                  const isCurrent = st.id === selectedStudentId;
                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50/75 transition-colors ${
                        isCurrent ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCurrent
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{st.name}</span>
                            <span className="text-slate-400 text-[11px]">{st.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-800 block">{st.department || 'Computer Science'}</span>
                          <span className="text-[11px] text-slate-500">Year {st.year || 2}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Student
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Enrolled</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`btn-select-student-${st.id}`}
                            onClick={() => onSelectStudent(st.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                            }`}
                          >
                            <span>{isCurrent ? 'Selected' : 'Switch View'}</span>
                            {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                          </button>

                          {isFacultyOrAdmin && st.id > 7 && (
                            <button
                              id={`btn-delete-student-${st.id}`}
                              onClick={() => handleDeleteStudent(st.id, st.name)}
                              title="Delete custom student"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Add New Student Profile</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane.doe@aura.edu"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={addForm.year}
                    onChange={(e) => setAddForm({ ...addForm, year: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={1}>Year 1 (Freshman)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Junior)</option>
                    <option value={4}>Year 4 (Senior)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Attendance: <span className="text-indigo-600 font-mono">{addForm.attendance_pct}%</span>
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    step="1"
                    value={addForm.attendance_pct}
                    onChange={(e) => setAddForm({ ...addForm, attendance_pct: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400">Generates 30 historical session logs</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Exam Baseline: <span className="text-indigo-600 font-mono">{addForm.exam_score}%</span>
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="1"
                    value={addForm.exam_score}
                    onChange={(e) => setAddForm({ ...addForm, exam_score: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400">Generates baseline assessment marks</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {submittingAdd ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Dataset Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Import Student Dataset (CSV)</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                <span>Upload a CSV with columns: <code>name, email, department, year, attendance_pct, exam_score</code></span>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-lg shadow-2xs cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload CSV File or Drag &amp; Drop:
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or Paste Raw CSV Rows Directly:
                </label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  placeholder={`Maya Chen,maya.chen@aura.edu,Computer Science,3,92,88\nVikram Reddy,vikram.reddy@aura.edu,Data Science,2,68,54`}
                  className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Parsed Records Preview ({parsedPreview.length} students):</span>
                    <span className="text-emerald-600 font-normal">Valid &amp; Ready</span>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Dept</th>
                          <th className="py-2 px-3">Att %</th>
                          <th className="py-2 px-3">Exam %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-semibold text-slate-800">{item.name}</td>
                            <td className="py-1.5 px-3 text-slate-500">{item.email}</td>
                            <td className="py-1.5 px-3 text-slate-600">{item.department}</td>
                            <td className="py-1.5 px-3 font-mono">{item.attendance_pct}%</td>
                            <td className="py-1.5 px-3 font-mono">{item.exam_score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importFeedback && (
                <div className="p-3 bg-slate-100 rounded-xl text-xs font-medium text-slate-800">
                  {importFeedback}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={parsedPreview.length === 0 || importing}
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{importing ? 'Importing Dataset...' : `Import ${parsedPreview.length} Students`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
