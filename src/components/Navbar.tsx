import React, { useState, useEffect } from 'react';
import { Shield, Bell, ChevronDown, User, CheckCheck, LogOut, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import { Notification } from '../types';

interface NavbarProps {
  onSelectStudent?: (studentId: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSelectStudent }) => {
  const { user, demoLogin, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectArchetype = async (role: any, id: number) => {
    setShowPersonaMenu(false);
    await demoLogin(role, id);
    if (role === 'STUDENT' && onSelectStudent) {
      onSelectStudent(id);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold tracking-wider text-base shadow-xs">
            AU
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">AURA</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Early Warning Intelligence
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500">
              Academic Understanding, Risk & Action Analytics
            </p>
          </div>
        </div>

        {/* Right Section: Persona Switcher, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              id="btn-persona-switcher"
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Switch Persona</span>
              <span className="sm:hidden">Role</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Student Archetypes (7)
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSelectArchetype('STUDENT', 1)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-slate-800">1. Aarav Kumar</span>
                      <span className="text-[11px] text-emerald-600 block">High Achiever (94% Att, 91% Exam)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">LOW</span>
                  </button>

                  <button
                    onClick={() => handleSelectArchetype('STUDENT', 2)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-slate-800">2. Diya Sharma</span>
                      <span className="text-[11px] text-rose-600 block">Attendance Risk (58% Attendance)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono">MOD</span>
                  </button>

                  <button
                    onClick={() => handleSelectArchetype('STUDENT', 3)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-slate-800">3. Rahul Menon</span>
                      <span className="text-[11px] text-rose-600 block">Declining Performance (-18 Trend)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-mono">HIGH</span>
                  </button>

                  <button
                    onClick={() => handleSelectArchetype('STUDENT', 4)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-slate-800">4. Ananya Patel</span>
                      <span className="text-[11px] text-orange-600 block">Assignment Risk (45% Avg, Late)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-mono">HIGH</span>
                  </button>

                  <button
                    onClick={() => handleSelectArchetype('STUDENT', 5)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-slate-800">5. Vikram Singh</span>
                      <span className="text-[11px] text-rose-600 block">Examination Risk (48% Exam Avg)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 font-mono">HIGH</span>
                  </button>

                  <button
                    onClick={() => handleSelectArchetype('STUDENT', 6)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-slate-800">6. Neha Gupta</span>
                      <span className="text-[11px] text-emerald-600 block">Improving Student (+14 Trend)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">IMP</span>
                  </button>

                  <button
                    onClick={() => handleSelectArchetype('STUDENT', 7)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium text-slate-800">7. Rohan Verma</span>
                      <span className="text-[11px] text-rose-700 font-semibold block">Critical Risk (54% Att, 38% Exam)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 font-mono">CRIT</span>
                  </button>
                </div>

                <div className="my-1.5 border-t border-slate-100" />
                <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Faculty & Administration
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSelectArchetype('TEACHER', 101)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-medium text-slate-800">Dr. Rajesh Iyer (Teacher)</span>
                    <span className="text-[10px] text-slate-500">CS-301</span>
                  </button>
                  <button
                    onClick={() => handleSelectArchetype('ADMIN', 999)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-medium text-slate-800">Dean Arthur Vance (Admin)</span>
                    <span className="text-[10px] text-slate-500">Analytics</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications-bell"
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="font-semibold text-slate-800">In-App Alerts ({unreadCount} unread)</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-center text-slate-400 py-4">No notifications.</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg border ${
                          n.read ? 'bg-white border-slate-100 text-slate-600' : 'bg-indigo-50/50 border-indigo-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-slate-900">{n.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User Pill */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-none">{user.name}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{user.role}</div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
