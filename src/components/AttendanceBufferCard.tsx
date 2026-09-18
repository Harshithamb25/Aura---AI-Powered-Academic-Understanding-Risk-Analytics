import React, { useState } from 'react';
import { Calendar, ShieldAlert, ShieldCheck, AlertCircle, Calculator } from 'lucide-react';

interface AttendanceBufferCardProps {
  percentage: number;
  attended: number;
  total: number;
  buffer: number;
  threshold?: number;
}

export const AttendanceBufferCard: React.FC<AttendanceBufferCardProps> = ({
  percentage,
  attended,
  total,
  buffer,
  threshold = 75
}) => {
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAttendedDelta, setSimAttendedDelta] = useState(0);
  const [simMissedDelta, setSimMissedDelta] = useState(0);

  const isSafe = percentage >= threshold;
  const isCritical = percentage < threshold;

  // Interactive local simulation calculation
  const simTotal = total + simAttendedDelta + simMissedDelta;
  const simAttended = attended + simAttendedDelta;
  const simPercentage = simTotal > 0 ? Number(((simAttended / simTotal) * 100).toFixed(1)) : 100;

  const t = threshold / 100;
  let simBuffer = 0;
  if (simPercentage >= threshold) {
    simBuffer = Math.floor((simAttended - t * simTotal) / t);
  } else {
    simBuffer = -Math.ceil((t * simTotal - simAttended) / (1 - t));
  }

  return (
    <div id="attendance-buffer-card" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Intelligence</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-bold font-mono ${isCritical ? 'text-rose-600' : isSafe && percentage >= 85 ? 'text-emerald-700' : 'text-amber-600'}`}>
              {percentage}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({attended} / {total} sessions)
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
          <Calendar className="w-5 h-5 text-indigo-600" />
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Observed: {percentage}%</span>
          <span className="font-semibold text-slate-700">Threshold: {threshold}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical ? 'bg-rose-500' : percentage >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
          {/* Institutional threshold marker at 75% */}
          <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-slate-800" title="75% Mandatory Compliance" />
        </div>
      </div>

      {/* Buffer Metric Indicator */}
      <div className={`mt-4 p-3.5 rounded-lg border flex items-start gap-3 ${
        isCritical
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : buffer <= 1
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}>
        {isCritical ? (
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed">
          {isCritical ? (
            <div>
              <p className="font-semibold text-rose-800">
                Attendance Deficit: {Math.abs(buffer)} Sessions Required
              </p>
              <p className="mt-0.5 text-rose-700">
                Student must attend the next <strong>{Math.abs(buffer)} consecutive classes</strong> without absence to recover to {threshold}%.
              </p>
            </div>
          ) : buffer === 0 ? (
            <div>
              <p className="font-semibold text-amber-800">Zero Attendance Buffer</p>
              <p className="mt-0.5 text-amber-700">
                Student is at the boundary. Missing even 1 additional class will trigger an academic warning.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-emerald-800">
                Safe Attendance Buffer: {buffer} Class{buffer > 1 ? 'es' : ''}
              </p>
              <p className="mt-0.5 text-emerald-700">
                Student can miss up to <strong>{buffer} more session{buffer > 1 ? 's' : ''}</strong> before falling below the {threshold}% requirement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Buffer Simulator Toggle */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          id="btn-toggle-buffer-sim"
          onClick={() => setShowSimulator(!showSimulator)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{showSimulator ? 'Close Buffer Simulator' : 'Simulate Future Classes'}</span>
        </button>
        <span className="text-[11px] text-slate-400">Deterministic formula</span>
      </div>

      {showSimulator && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
          <div className="font-semibold text-slate-800 flex items-center justify-between">
            <span>Dynamic Buffer Projections</span>
            <span className="font-mono text-indigo-700">Sim: {simPercentage}% ({simAttended}/{simTotal})</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Attend Next: +{simAttendedDelta} class(es)</label>
              <input
                type="range"
                min="0"
                max="20"
                value={simAttendedDelta}
                onChange={(e) => setSimAttendedDelta(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Miss Next: +{simMissedDelta} class(es)</label>
              <input
                type="range"
                min="0"
                max="20"
                value={simMissedDelta}
                onChange={(e) => setSimMissedDelta(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>
          </div>

          <div className="p-2 rounded bg-white border border-slate-200 text-slate-700">
            {simBuffer >= 0 ? (
              <span className="text-emerald-700 font-medium">
                Simulated Buffer: Safe to miss up to {simBuffer} future session(s).
              </span>
            ) : (
              <span className="text-rose-700 font-medium">
                Simulated Deficit: Will require {Math.abs(simBuffer)} consecutive classes to recover compliance.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
