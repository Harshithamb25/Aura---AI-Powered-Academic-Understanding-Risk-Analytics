import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, MapPin, Award, Plus, CheckCircle, Search } from 'lucide-react';
import { api } from '../services/api';
import { Course } from '../types';
import { useAuth } from '../services/auth';

export const Courses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [enrolledSuccess, setEnrolledSuccess] = useState<string | null>(null);

  // New Course Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newCredits, setNewCredits] = useState(4);
  const [newSchedule, setNewSchedule] = useState('Tue/Thu 10:00 AM');
  const [newRoom, setNewRoom] = useState('Hall C-101');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const list = await api.getCourses();
      setCourses(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      await api.enrollCourse(courseId);
      setEnrolledSuccess(`Successfully enrolled in course.`);
      fetchCourses();
      setTimeout(() => setEnrolledSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Enrollment failed');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleOpenDetails = async (courseId: number) => {
    try {
      const details = await api.getCourse(courseId);
      setSelectedCourse(details);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourse({
        code: newCode,
        name: newName,
        department: newDept,
        credits: newCredits,
        schedule: newSchedule,
        room: newRoom,
        syllabus: [
          'Module 1: Mathematical Principles and Theoretical Frameworks',
          'Module 2: Practical Implementations and Optimization',
          'Module 3: Advanced Applications and Empirical Case Studies'
        ]
      });
      setShowCreateModal(false);
      fetchCourses();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'all' || c.department.toLowerCase() === departmentFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Academic Curricular Catalog</h1>
            <p className="text-xs text-slate-500">
              Departmental courses, syllabus structures, credit loads, and enrolled student cohorts.
            </p>
          </div>
        </div>

        {user?.role !== 'STUDENT' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        )}
      </div>

      {enrolledSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{enrolledSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'Computer Science', 'Artificial Intelligence', 'Data Science'].map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap cursor-pointer ${
                departmentFilter === dept
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dept === 'all' ? 'All Departments' : dept}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search code or course name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {c.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {c.department}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.schedule}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.room}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Enrolled: {c.enrolled_count || 0} / {c.capacity}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Credits: {c.credits}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleOpenDetails(c.id)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                View Syllabus & Details →
              </button>

              {user?.role === 'STUDENT' && (
                <button
                  disabled={enrollingId === c.id}
                  onClick={() => handleEnroll(c.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                >
                  {enrollingId === c.id ? 'Enrolling...' : 'Enroll Course'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl p-6 space-y-4 text-xs my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {selectedCourse.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedCourse.name}</h3>
                <p className="text-slate-500 mt-0.5">{selectedCourse.department} • Instructor: {selectedCourse.teacher_name}</p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                Course Syllabus & Learning Modules:
              </span>
              <ul className="space-y-1.5 pl-4 list-disc text-slate-700">
                {selectedCourse.syllabus?.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {selectedCourse.assignments && selectedCourse.assignments.length > 0 && (
              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Active Course Assignments:
                </span>
                <div className="space-y-1">
                  {selectedCourse.assignments.map((a: any) => (
                    <div key={a.id} className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                      <span className="font-medium text-slate-800">{a.title}</span>
                      <span className="text-slate-500">Due: {a.due_date} (Max: {a.max_marks})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Create Academic Course</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-401"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Cloud Computing"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Department</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Schedule</label>
                  <input
                    type="text"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Room</label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
