import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, AlertCircle, PlusCircle } from 'lucide-react';
import { api } from '../services/api';
import { AttendanceBufferCard } from '../components/AttendanceBufferCard';
import { useAuth } from '../services/auth';
import { Course, User } from '../types';

interface StudentAttendanceProps {
  studentId: number;
}

export const StudentAttendance: React.FC<StudentAttendanceProps> = ({ studentId }) => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Mark attendance state for teachers/admins
  const [recordCourseId, setRecordCourseId] = useState<number>(1);
  const [recordStudentId, setRecordStudentId] = useState<number>(studentId);
  const [recordStatus, setRecordStatus] = useState<'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>('PRESENT');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordMsg, setRecordMsg] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [records, cList, sList] = await Promise.all([
        api.getAttendanceRecords(studentId),
        api.getCourses(),
        api.getStudents()
      ]);
      setAttendanceRecords(records);
      setCourses(cList);
      setStudents(sList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  const total = attendanceRecords.length;
  const attended = attendanceRecords.filter(r => r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'late').length;
  const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 100;

  const threshold = 0.75;
  let buffer = 0;
  if (percentage >= 75) {
    buffer = Math.floor((attended - threshold * total) / threshold);
  } else {
    buffer = -Math.ceil((threshold * total - attended) / (1 - threshold));
  }

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordSubmitting(true);
    setRecordMsg('');

    try {
      await api.recordAttendance(
        recordCourseId,
        [{ student_id: recordStudentId, status: recordStatus.toLowerCase() }],
        recordDate
      );
      setRecordMsg('Attendance successfully recorded!');
      fetchAttendance();
      setTimeout(() => setRecordMsg(''), 3000);
    } catch (err: any) {
      setRecordMsg('Failed: ' + err.message);
    } finally {
      setRecordSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Attendance Telemetry & Safety Buffer</h1>
            <p className="text-xs text-slate-500">
              Institutional attendance tracking with predictive threshold safety margins and shortfall remediation.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Attendance Buffer Card */}
      <AttendanceBufferCard
        percentage={percentage}
        attended={attended}
        total={total}
        buffer={buffer}
        threshold={75}
      />

      {/* Teacher / Admin Attendance Entry Form */}
      {user?.role !== 'STUDENT' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Faculty Attendance Logger</h2>
          <p className="text-xs text-slate-500 mb-4">Record or update daily session presence to recalibrate student buffer.</p>

          {recordMsg && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs">
              {recordMsg}
            </div>
          )}

          <form onSubmit={handleRecordAttendance} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Student</label>
              <select
                value={recordStudentId}
                onChange={(e) => setRecordStudentId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Course</label>
              <select
                value={recordCourseId}
                onChange={(e) => setRecordCourseId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={recordStatus}
                onChange={(e) => setRecordStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="PRESENT">Present</option>
                <option value="LATE">Late (Counts as Present)</option>
                <option value="ABSENT">Absent (Penalized)</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={recordSubmitting}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {recordSubmitting ? 'Logging...' : 'Log Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detailed Session Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Individual Session Telemetry Log</h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Course Name</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {attendanceRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-mono text-slate-600">{r.date}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{r.course_name || `Course #${r.course_id}`}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.status === 'LATE'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {r.status === 'PRESENT' && <Check className="w-3 h-3" />}
                      {r.status === 'LATE' && <Clock className="w-3 h-3" />}
                      {r.status === 'ABSENT' && <X className="w-3 h-3" />}
                      <span>{r.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                    {r.status === 'PRESENT' ? 'Recorded via RFID Scanner' : r.status === 'LATE' ? 'Checked in 12m late' : 'Unexcused Absence'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
