import React, { useState, useEffect } from 'react';
import { ShieldAlert, PlusCircle, CheckCircle, Clock, CheckCircle2, Award, FileEdit, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Intervention, User, Course } from '../types';
import { InterventionModal } from '../components/InterventionModal';

export const TeacherInterventions: React.FC = () => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Checkpoint modal state
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [checkpointTitle, setCheckpointTitle] = useState('');
  const [checkpointNotes, setCheckpointNotes] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const [list, sList, cList] = await Promise.all([
        api.getInterventions(),
        api.getStudents(),
        api.getCourses()
      ]);
      setInterventions(list);
      setStudents(sList);
      setCourses(cList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const handleAddCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntervention || !checkpointTitle.trim()) return;

    try {
      await api.addInterventionCheckpoint(selectedIntervention.id, checkpointTitle, checkpointNotes, true);
      setCheckpointTitle('');
      setCheckpointNotes('');
      setSelectedIntervention(null);
      fetchInterventions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveIntervention = async (id: number) => {
    try {
      await api.updateInterventionStatus(id, 'COMPLETED', outcomeNotes || 'Student successfully satisfied academic milestones.');
      setResolvingId(null);
      setOutcomeNotes('');
      fetchInterventions();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filterStatus === 'all'
    ? interventions
    : interventions.filter(i => i.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Intervention Closed-Loop Management</h1>
            <p className="text-xs text-slate-500">
              Track remediation contracts, log faculty advising checkpoints, and measure pre- vs post-intervention risk delta.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Intervention</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'IN_PROGRESS', 'COMPLETED', 'OPEN'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`text-xs px-3.5 py-1.5 rounded-lg border transition-colors cursor-pointer uppercase font-semibold ${
              filterStatus === status
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status === 'all' ? 'All Interventions' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading interventions...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      item.priority === 'urgent'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>Student: <strong className="text-slate-800">{item.student_name}</strong></span>
                    <span>•</span>
                    <span>Course: <strong className="text-slate-800">{item.course_name || 'Academic Core'}</strong></span>
                    <span>•</span>
                    <span>Lead: <strong className="text-slate-800">{item.teacher_name || 'Faculty Mentor'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}>
                    {item.status}
                  </span>

                  {item.status !== 'COMPLETED' && (
                    <button
                      onClick={() => setResolvingId(item.id)}
                      className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Action & Objective */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Prescribed Action / Agreement:</span>
                  <p className="text-slate-800">{item.action}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Timeline & Baseline:</span>
                    <p className="text-slate-600">Start: {item.start_date} • Target: {item.target_date}</p>
                  </div>
                  {item.baseline_risk !== undefined && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
                      <span>Baseline Risk: <strong>{item.baseline_risk}</strong></span>
                      {item.post_risk !== undefined && (
                        <span>Post Risk: <strong className="text-emerald-700">{item.post_risk}</strong> (Delta: -{item.impact_score} pts)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Checkpoints Timeline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Milestone Checkpoints:</span>
                  {item.status !== 'COMPLETED' && (
                    <button
                      onClick={() => setSelectedIntervention(item)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      + Log Checkpoint
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {item.checkpoints?.map((cp) => (
                    <div key={cp.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{cp.title}</span>
                          <span className="text-[11px] text-slate-400">{cp.date}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{cp.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion Outcome */}
              {item.outcome && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold block">Measured Outcome & Impact:</span>
                  <p className="mt-0.5">{item.outcome}</p>
                </div>
              )}

              {/* Inline Completion Form */}
              {resolvingId === item.id && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 text-xs">
                  <span className="font-semibold text-emerald-900 block">Record Outcome Assessment:</span>
                  <textarea
                    rows={2}
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="Describe student's progress and compliance with the plan..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setResolvingId(null)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleResolveIntervention(item.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 cursor-pointer"
                    >
                      Confirm Outcome & Recalculate Risk
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Checkpoint Modal */}
      {selectedIntervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900">
              Log Checkpoint for {selectedIntervention.student_name}
            </h3>

            <form onSubmit={handleAddCheckpoint} className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Checkpoint Milestone Title</label>
                <input
                  type="text"
                  required
                  value={checkpointTitle}
                  onChange={(e) => setCheckpointTitle(e.target.value)}
                  placeholder="e.g. Week 3 Mentoring Meeting"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Observation Notes</label>
                <textarea
                  rows={3}
                  required
                  value={checkpointNotes}
                  onChange={(e) => setCheckpointNotes(e.target.value)}
                  placeholder="e.g. Student submitted practice problems and attended all morning lectures..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIntervention(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Intervention Modal */}
      <InterventionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchInterventions}
        students={students}
        courses={courses}
      />
    </div>
  );
};
