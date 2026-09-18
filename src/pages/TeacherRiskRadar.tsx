import React, { useState, useEffect } from 'react';
import { Radar, AlertTriangle, ChevronRight, PlusCircle, Filter, Search, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { RiskBadge, TrendBadge } from '../components/RiskBadge';
import { InterventionModal } from '../components/InterventionModal';

interface TeacherRiskRadarProps {
  onSelectStudent: (id: number) => void;
}

export const TeacherRiskRadar: React.FC<TeacherRiskRadarProps> = ({ onSelectStudent }) => {
  const [radarData, setRadarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<'all' | 'critical' | 'high' | 'moderate' | 'low'>('all');
  const [search, setSearch] = useState('');
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [selectedStudentForIntervention, setSelectedStudentForIntervention] = useState<any>(null);

  const fetchRadar = async () => {
    setLoading(true);
    try {
      const data = await api.getTeacherRadar();
      setRadarData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Scanning institutional telemetry & risk radar...</p>
      </div>
    );
  }

  const { all = [], buckets, counts } = radarData || {};

  const filteredStudents = (activeBucket === 'all' ? all : buckets[activeBucket] || []).filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
              <Radar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Faculty Student Attention Radar</h1>
              <p className="text-xs text-slate-500">
                Early warning intelligence identifying cohorts requiring immediate intervention before failure occurs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Active Cohort:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {counts?.total || 0} Students Tracked
            </span>
          </div>
        </div>

        {/* 4 Risk Radar Buckets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <button
            id="radar-bucket-critical"
            onClick={() => setActiveBucket('critical')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === 'critical'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                : 'bg-white border-slate-200 hover:border-rose-200'
            }`}
          >
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Critical Risk</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-rose-800">{counts?.critical || 0}</span>
              <span className="text-[10px] text-rose-600 font-medium">(Score ≥ 70)</span>
            </div>
          </button>

          <button
            id="radar-bucket-high"
            onClick={() => setActiveBucket('high')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === 'high'
                ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200'
                : 'bg-white border-slate-200 hover:border-orange-200'
            }`}
          >
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">High Risk</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-orange-800">{counts?.high || 0}</span>
              <span className="text-[10px] text-orange-600 font-medium">(Score 50-69)</span>
            </div>
          </button>

          <button
            id="radar-bucket-moderate"
            onClick={() => setActiveBucket('moderate')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === 'moderate'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                : 'bg-white border-slate-200 hover:border-amber-200'
            }`}
          >
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Moderate Risk</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-800">{counts?.moderate || 0}</span>
              <span className="text-[10px] text-amber-600 font-medium">(Score 30-49)</span>
            </div>
          </button>

          <button
            id="radar-bucket-low"
            onClick={() => setActiveBucket('low')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeBucket === 'low'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-white border-slate-200 hover:border-emerald-200'
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Low Risk</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-800">{counts?.low || 0}</span>
              <span className="text-[10px] text-emerald-600 font-medium">(Score &lt; 30)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Radar Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveBucket('all')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${
                activeBucket === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Cohorts ({counts?.total})
            </button>
            <span className="text-xs text-slate-400">| Showing {filteredStudents.length} results</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name or dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Risk Assessment</th>
                <th className="px-4 py-3">Primary Factor</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Assignments</th>
                <th className="px-4 py-3">Exams</th>
                <th className="px-4 py-3">Trajectory</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStudents.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-500">{s.department} • Year {s.year || 3}</div>
                  </td>

                  <td className="px-4 py-3">
                    <RiskBadge level={s.risk_level} score={s.risk_score} size="sm" />
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-700">
                    {s.primary_factor}
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <span className={s.attendance < 75 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                      {s.attendance}%
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <span className={s.assignments < 60 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                      {s.assignments}%
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <span className={s.examinations < 60 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                      {s.examinations}%
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <TrendBadge direction={s.trend} change={s.trend_change} />
                  </td>

                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      id={`btn-open-intel-${s.id}`}
                      onClick={() => onSelectStudent(s.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Intelligence</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`btn-radar-intervene-${s.id}`}
                      onClick={() => {
                        setSelectedStudentForIntervention(s);
                        setInterventionModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Initiate intervention contract"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Intervene</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intervention Modal */}
      {selectedStudentForIntervention && (
        <InterventionModal
          isOpen={interventionModalOpen}
          onClose={() => setInterventionModalOpen(false)}
          onSuccess={() => fetchRadar()}
          preselectedStudent={selectedStudentForIntervention}
        />
      )}
    </div>
  );
};
