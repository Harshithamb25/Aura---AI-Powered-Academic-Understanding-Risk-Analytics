import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const normalized = (level || 'low').toLowerCase() as RiskLevel;

  const config = {
    critical: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      dot: 'bg-rose-600',
      label: 'CRITICAL RISK'
    },
    high: {
      bg: 'bg-orange-50 border-orange-200 text-orange-800',
      dot: 'bg-orange-600',
      label: 'HIGH RISK'
    },
    moderate: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-600',
      label: 'MODERATE RISK'
    },
    low: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dot: 'bg-emerald-600',
      label: 'LOW RISK'
    }
  }[normalized] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-800',
    dot: 'bg-slate-500',
    label: 'UNKNOWN'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold'
  }[size];

  return (
    <span
      id={`risk-badge-${normalized}`}
      className={`inline-flex items-center border rounded-full whitespace-nowrap ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="font-mono opacity-80">({score})</span>
      )}
    </span>
  );
};

export const TrendBadge: React.FC<{ direction: string; change?: number }> = ({ direction, change }) => {
  const norm = (direction || 'stable').toLowerCase();

  if (norm.includes('improv')) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <span>↗</span>
        <span>Improving</span>
        {change !== undefined && <span className="font-mono">({change >= 0 ? `+${change}` : change})</span>}
      </span>
    );
  }

  if (norm.includes('decline')) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
        <span>↘</span>
        <span>Declining</span>
        {change !== undefined && <span className="font-mono">({change >= 0 ? `+${change}` : change})</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
      <span>→</span>
      <span>Stable</span>
      {change !== undefined && <span className="font-mono">({change >= 0 ? `+${change}` : change})</span>}
    </span>
  );
};
