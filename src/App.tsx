import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/auth';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { StudentIntelligence } from './pages/StudentIntelligence';
import { TeacherRiskRadar } from './pages/TeacherRiskRadar';
import { TeacherInterventions } from './pages/TeacherInterventions';
import { Courses } from './pages/Courses';
import { StudentAttendance } from './pages/StudentAttendance';
import { StudentAssignments } from './pages/StudentAssignments';
import { StudentExams } from './pages/StudentExams';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { StudentDirectory } from './pages/StudentDirectory';

function DashboardContent() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);
  const [currentTab, setCurrentTab] = useState<string>('intelligence');

  // When logged-in user changes:
  useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT') {
        setSelectedStudentId(user.id);
        setCurrentTab('intelligence');
      } else if (user.role === 'TEACHER') {
        setCurrentTab('radar');
      } else if (user.role === 'ADMIN') {
        setCurrentTab('analytics');
      }
    }
  }, [user?.role, user?.id]);

  const handleSelectStudent = (id: number) => {
    setSelectedStudentId(id);
    setCurrentTab('intelligence');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onSelectStudent={handleSelectStudent} />

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          selectedStudentId={selectedStudentId}
        />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'intelligence' && (
            <StudentIntelligence
              studentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          )}

          {currentTab === 'radar' && (
            <TeacherRiskRadar
              onSelectStudent={(id) => {
                setSelectedStudentId(id);
                setCurrentTab('intelligence');
              }}
            />
          )}

          {currentTab === 'interventions' && <TeacherInterventions />}
          {currentTab === 'courses' && <Courses />}
          {currentTab === 'attendance' && <StudentAttendance studentId={selectedStudentId} />}
          {currentTab === 'assignments' && <StudentAssignments studentId={selectedStudentId} />}
          {currentTab === 'examinations' && <StudentExams studentId={selectedStudentId} />}
          {currentTab === 'directory' && (
            <StudentDirectory
              selectedStudentId={selectedStudentId}
              onSelectStudent={(id) => {
                setSelectedStudentId(id);
                setCurrentTab('intelligence');
              }}
            />
          )}
          {currentTab === 'whatif' && (
            <StudentIntelligence
              studentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          )}
          {(currentTab === 'analytics' || currentTab === 'reports' || currentTab === 'audit') && (
            <AdminAnalytics />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
