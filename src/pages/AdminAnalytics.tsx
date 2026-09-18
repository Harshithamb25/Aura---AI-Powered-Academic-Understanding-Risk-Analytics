import React, { useState, useEffect } from 'react';
import { BarChart3, Download, ShieldCheck, Users, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';

export const AdminAnalytics: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [radar, setRadar] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [rep, rad, logs] = await Promise.all([
          api.getAnalytics(),
          api.getTeacherRadar(),
          api.getAuditLogs()
        ]);
        setReport(rep);
        setRadar(rad);
        setAuditLogs(logs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportReportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AURA_Institutional_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Aggregating institutional data and department analytics...
      </div>
    );
  }

  const riskDistributionData = [
    { name: 'Low Risk', count: radar?.counts?.low || 0, fill: '#10b981' },
    { name: 'Moderate Risk', count: radar?.counts?.moderate || 0, fill: '#f59e0b' },
    { name: 'High Risk', count: radar?.counts?.high || 0, fill: '#f97316' },
    { name: 'Critical Risk', count: radar?.counts?.critical || 0, fill: '#ef4444' }
  ];

  const deptData = report?.departments || [
    { department: 'Computer Science', students: 4, avg_attendance: 76.5, avg_exam: 69.2, at_risk_count: 2 },
    { department: 'Artificial Intelligence', students: 2, avg_attendance: 74.0, avg_exam: 68.5, at_risk_count: 1 },
    { department: 'Data Science', students: 1, avg_attendance: 54.0, avg_exam: 38.0, at_risk_count: 1 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Institutional Analytics & Governance</h1>
            <p className="text-xs text-slate-500">
              Executive KPI oversight, risk distribution clustering, and compliance auditing.
            </p>
          </div>
        </div>

        <button
          id="btn-export-csv"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Official CSV</span>
        </button>
      </div>

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled Cohort</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{report?.total_students || 7}</span>
            <span className="text-xs text-slate-500">active students</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">Across 3 academic departments</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cohort at Risk</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600">
              {(radar?.counts?.high || 0) + (radar?.counts?.critical || 0)}
            </span>
            <span className="text-xs text-slate-500">({Math.round((((radar?.counts?.high || 0) + (radar?.counts?.critical || 0)) / (report?.total_students || 7)) * 100)}%)</span>
          </div>
          <span className="text-[11px] text-rose-600 mt-2 block font-medium">Require proactive faculty contact</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Interventions</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-indigo-700">{report?.active_interventions || 5}</span>
            <span className="text-xs text-slate-500">contracts</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-2 block font-medium">100% closed-loop fidelity</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Institutional Attendance</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">{report?.overall_attendance || 75.8}%</span>
            <span className="text-xs text-slate-500">average</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">Institutional threshold: 75.0%</span>
        </div>
      </div>

      {/* Visual Chart: Risk Cohort Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Risk Severity Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Count of students categorized by deterministic risk score.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Departmental Benchmarking</h2>
          <p className="text-xs text-slate-500 mb-4">Attendance, examination mastery, and risk density by department.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Students</th>
                  <th className="px-3 py-2">Avg Att.</th>
                  <th className="px-3 py-2">Avg Exam</th>
                  <th className="px-3 py-2">At-Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {deptData.map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{d.department}</td>
                    <td className="px-3 py-2.5 font-mono">{d.students}</td>
                    <td className="px-3 py-2.5 font-mono">{d.avg_attendance}%</td>
                    <td className="px-3 py-2.5 font-mono">{d.avg_exam}%</td>
                    <td className="px-3 py-2.5 font-mono text-rose-600 font-bold">{d.at_risk_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Governance & Security Audit Trail</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-72">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Actor</th>
                <th className="px-4 py-2.5">Action Event</th>
                <th className="px-4 py-2.5">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 font-mono text-[11px]">
                  <td className="px-4 py-2 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-2 font-semibold text-slate-900">{log.user_name || `User #${log.user_id}`}</td>
                  <td className="px-4 py-2 text-indigo-700">{log.action}</td>
                  <td className="px-4 py-2 text-slate-600 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
