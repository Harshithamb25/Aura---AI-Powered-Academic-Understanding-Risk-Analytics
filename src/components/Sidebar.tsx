import React from 'react';
import {
  Radar,
  BrainCircuit,
  BookOpen,
  CalendarCheck,
  FileText,
  Award,
  Sliders,
  ShieldAlert,
  BarChart3,
  History,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { useAuth } from '../services/auth';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  selectedStudentId: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, selectedStudentId }) => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const navItems = [
    // Teacher & Admin Primary View
    ...(role === 'TEACHER' || role === 'ADMIN'
      ? [
          { id: 'radar', label: 'Teacher Risk Radar', icon: Radar, badge: 'Active' },
          { id: 'interventions', label: 'Interventions Tracker', icon: ShieldAlert },
        ]
      : []),

    // Hero Academic Intelligence Page
    { id: 'intelligence', label: 'Student Intelligence', icon: BrainCircuit, badge: 'Hero' },

    // Student & Academic Tools
    { id: 'attendance', label: 'Attendance & Buffer', icon: CalendarCheck },
    { id: 'assignments', label: 'Assignments Portal', icon: FileText },
    { id: 'examinations', label: 'Examinations & Marks', icon: Award },
    { id: 'whatif', label: 'What-If Simulator', icon: Sliders },
    { id: 'courses', label: 'Courses & Syllabus', icon: BookOpen },

    // Dataset & Directory Management
    { id: 'directory', label: 'Student Dataset & Roster', icon: Users, badge: 'Cohort' },

    // Admin Specific
    ...(role === 'ADMIN'
      ? [
          { id: 'analytics', label: 'Institutional KPIs', icon: BarChart3 },
          { id: 'reports', label: 'Reports & CSV Export', icon: FileSpreadsheet },
          { id: 'audit', label: 'Audit Security Logs', icon: History }
        ]
      : [])
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {role === 'STUDENT' ? 'Student Workspace' : role === 'TEACHER' ? 'Faculty Command' : 'Administration'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick context info */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          Current Context
        </span>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Student ID:</span>
          <span className="font-mono font-semibold text-slate-800">#{selectedStudentId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Term:</span>
          <span className="font-medium text-slate-700">Fall 2026</span>
        </div>
      </div>
    </aside>
  );
};
