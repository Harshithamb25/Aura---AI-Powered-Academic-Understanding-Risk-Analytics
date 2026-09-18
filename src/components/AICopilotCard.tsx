import React, { useState } from 'react';
import { Sparkles, Send, Bot, Copy, Check, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { AICopilotResponse } from '../types';

interface AICopilotCardProps {
  studentId: number;
  studentName: string;
}

const PRECONFIGURED_QUESTIONS = [
  "Why is this student at risk?",
  "What are the main weak areas?",
  "What should the teacher prioritize?",
  "Summarize this student's progress.",
  "What changed recently?",
  "What intervention should be considered?"
];

export const AICopilotCard: React.FC<AICopilotCardProps> = ({ studentId, studentName }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AICopilotResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion(q);
    try {
      const res = await api.askAICopilot(studentId, q);
      setResponse(res);
    } catch (err) {
      console.error("Copilot query failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response?.answer) {
      navigator.clipboard.writeText(response.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="ai-academic-copilot" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">AI Academic Intelligence Copilot</h3>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Grounded Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500">Natural language synthesis powered by verified deterministic telemetry records.</p>
          </div>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="mt-4">
        <span className="text-xs font-medium text-slate-600 mb-2 block">Quick Diagnostic Queries:</span>
        <div className="flex flex-wrap gap-2">
          {PRECONFIGURED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              id={`copilot-query-btn-${idx}`}
              onClick={() => handleAsk(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-700 transition-colors text-left cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="mt-4 flex gap-2"
      >
        <div className="relative flex-1">
          <input
            id="input-copilot-query"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask a question about ${studentName}'s academic telemetry...`}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
          />
        </div>
        <button
          id="btn-submit-copilot"
          type="submit"
          disabled={loading || !question.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{loading ? 'Synthesizing...' : 'Analyze'}</span>
        </button>
      </form>

      {/* Response Box */}
      {response && (
        <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Diagnostic Synthesis: &ldquo;{response.question}&rdquo;</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                {response.is_ai_generated ? 'Gemini 3.8 Flash' : 'Deterministic Engine'}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-200 cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
            {response.answer}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span>Student: <strong className="text-slate-700">{response.insight_summary.student_name}</strong></span>
            <span>Risk Status: <strong className="text-slate-700">{response.insight_summary.risk_level} ({response.insight_summary.risk_score})</strong></span>
            <span>Trajectory: <strong className="text-slate-700">{response.insight_summary.trend}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
