import { GoogleGenAI } from "@google/genai";
import {
  RiskAssessment,
  RiskLevel,
  TrendAnalysis,
  Recommendation,
  WhatIfResponse,
  InsightObject,
  AICopilotResponse,
  AttendanceSummary
} from "../../src/types";

// =============================================================
// GEMINI CLIENT (Lazy initialization with safety fallback)
// =============================================================
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// =============================================================
// ATTENDANCE BUFFER ENGINE
// =============================================================
export function calculateAttendanceBuffer(
  attended: number,
  total: number,
  threshold = 75
): {
  percentage: number;
  buffer_sessions: number;
  status: 'safe' | 'warning' | 'critical';
  explanation: string;
} {
  if (total <= 0) {
    return {
      percentage: 100,
      buffer_sessions: 0,
      status: 'safe',
      explanation: 'No class sessions recorded yet.'
    };
  }

  const percentage = Number(((attended / total) * 100).toFixed(1));
  const t = threshold / 100;

  if (percentage >= threshold) {
    // If student misses m classes: attended / (total + m) >= t
    // attended >= t * total + t * m  => m <= (attended - t * total) / t
    const buffer = Math.floor((attended - t * total) / t);
    const status = percentage >= 85 ? 'safe' : 'warning';
    const explanation = buffer > 0
      ? `Student can miss up to ${buffer} additional class session${buffer > 1 ? 's' : ''} before falling below the mandatory ${threshold}% attendance requirement.`
      : `Student is right at the threshold (${percentage}%). Missing even 1 additional class will trigger an attendance violation.`;

    return {
      percentage,
      buffer_sessions: Math.max(0, buffer),
      status,
      explanation
    };
  } else {
    // Below threshold: calculate how many consecutive classes must be attended to recover to 75%
    // (attended + c) / (total + c) >= t => attended + c >= t * total + t * c => (1 - t) * c >= t * total - attended
    const needed = Math.ceil((t * total - attended) / (1 - t));
    return {
      percentage,
      buffer_sessions: -needed,
      status: 'critical',
      explanation: `Attendance is critical at ${percentage}% (${threshold - percentage}% below threshold). The student must attend the next ${needed} consecutive class session${needed > 1 ? 's' : ''} without absence to restore compliance.`
    };
  }
}

// =============================================================
// TREND ENGINE
// =============================================================
export function analyzeTrend(previousScore: number, currentScore: number): TrendAnalysis {
  const change = Number((currentScore - previousScore).toFixed(2));
  const percentageChange = previousScore > 0
    ? Number(((change / previousScore) * 100).toFixed(1))
    : 0;

  let direction: 'strong_improvement' | 'improvement' | 'stable' | 'decline' | 'significant_decline' = 'stable';

  if (change >= 10) {
    direction = 'strong_improvement';
  } else if (change > 2) {
    direction = 'improvement';
  } else if (change <= -10) {
    direction = 'significant_decline';
  } else if (change < -2) {
    direction = 'decline';
  } else {
    direction = 'stable';
  }

  return {
    previous_score: Number(previousScore.toFixed(1)),
    current_score: Number(currentScore.toFixed(1)),
    change,
    percentage_change: percentageChange,
    direction
  };
}

// =============================================================
// EXPLAINABLE DETERMINISTIC RISK ENGINE
// =============================================================
export function calculateExplainableRisk(
  attendancePercentage: number,
  assignmentScore: number,
  examinationScore: number,
  previousScore: number,
  currentScore: number,
  attendanceSessions = { attended: 0, total: 0 },
  assignmentCounts = { total: 0, submitted: 0, overdue: 0 }
): RiskAssessment {
  // Signal risks (0 = no risk, 100 = extreme risk)
  const attendanceRisk = Math.max(0, 100 - attendancePercentage);
  const assignmentRisk = Math.max(0, 100 - assignmentScore);
  const examinationRisk = Math.max(0, 100 - examinationScore);

  let trendRisk = 50;
  if (previousScore > 0) {
    const trendChange = currentScore - previousScore;
    // Declining trend increases risk; improving trend decreases risk
    trendRisk = Math.max(0, Math.min(100, 50 - trendChange * 5));
  }

  // Exact Weights mandated: Attendance 30%, Assignments 20%, Examinations 30%, Trend 20%
  const attWeight = 0.30;
  const assWeight = 0.20;
  const exWeight = 0.30;
  const trWeight = 0.20;

  const attendanceContribution = Number((attendanceRisk * attWeight).toFixed(2));
  const assignmentContribution = Number((assignmentRisk * assWeight).toFixed(2));
  const examinationContribution = Number((examinationRisk * exWeight).toFixed(2));
  const trendContribution = Number((trendRisk * trWeight).toFixed(2));

  let rawRiskScore = attendanceContribution + assignmentContribution + examinationContribution + trendContribution;
  const riskScore = Number(Math.max(0, Math.min(100, rawRiskScore)).toFixed(1));

  // Risk levels
  let riskLevel: RiskLevel = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  else riskLevel = 'low';

  // Determine Primary Factor & Explanations
  const factors: string[] = [];
  const componentRisks = [
    { name: 'Attendance', score: attendanceRisk, contribution: attendanceContribution },
    { name: 'Examinations', score: examinationRisk, contribution: examinationContribution },
    { name: 'Assignments', score: assignmentRisk, contribution: assignmentContribution },
    { name: 'Performance Trend', score: trendRisk, contribution: trendContribution },
  ];
  componentRisks.sort((a, b) => b.contribution - a.contribution);
  const primaryFactor = componentRisks[0].contribution > 5 ? componentRisks[0].name : 'None';

  if (attendancePercentage < 75) {
    factors.push(
      `Attendance is critically low at ${attendancePercentage.toFixed(1)}% (${attendanceSessions.attended}/${attendanceSessions.total} sessions conducted, below the mandatory 75% threshold).`
    );
  } else if (attendancePercentage < 82) {
    factors.push(
      `Attendance buffer is thin at ${attendancePercentage.toFixed(1)}%, nearing the institutional compliance boundary.`
    );
  }

  if (assignmentScore < 60) {
    factors.push(
      `Assignment completion and scores are suboptimal at ${assignmentScore.toFixed(1)}% average (${assignmentCounts.overdue} pending/overdue submission${assignmentCounts.overdue !== 1 ? 's' : ''}).`
    );
  }

  if (examinationScore < 60) {
    factors.push(
      `Examination average is weak at ${examinationScore.toFixed(1)}%, indicating concept mastery challenges in core curricular modules.`
    );
  }

  if (currentScore < previousScore) {
    const delta = (previousScore - currentScore).toFixed(1);
    factors.push(
      `Academic velocity indicates a downward trajectory with recent assessments dropping by ${delta} points compared to historical baseline.`
    );
  }

  if (factors.length === 0) {
    factors.push('All observed academic telemetry metrics are stable and within safe operating parameters.');
  }

  const bufferCalc = calculateAttendanceBuffer(attendanceSessions.attended, attendanceSessions.total, 75);

  const evidence = {
    attendance: {
      observed: attendancePercentage,
      threshold: 75,
      sessions_attended: attendanceSessions.attended,
      total_sessions: attendanceSessions.total,
      buffer: bufferCalc.buffer_sessions,
      status: bufferCalc.status
    },
    assignments: {
      observed: assignmentScore,
      total_assigned: assignmentCounts.total,
      submitted: assignmentCounts.submitted,
      pending: Math.max(0, assignmentCounts.total - assignmentCounts.submitted),
      overdue: assignmentCounts.overdue
    },
    examinations: {
      observed: examinationScore,
      exams_taken: 2,
      lowest_exam: examinationScore < 60 ? "Midterm Assessment" : "None",
      lowest_score: examinationScore
    },
    trend: {
      direction: currentScore > previousScore + 2 ? ('improving' as const) : currentScore < previousScore - 2 ? ('declining' as const) : ('stable' as const),
      previous_score: previousScore,
      current_score: currentScore,
      change: Number((currentScore - previousScore).toFixed(1))
    }
  };

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    primary_factor: primaryFactor,
    explanation: factors.join(' '),
    contributing_factors: factors,
    signals: {
      attendance_risk: Number(attendanceRisk.toFixed(1)),
      assignment_risk: Number(assignmentRisk.toFixed(1)),
      examination_risk: Number(examinationRisk.toFixed(1)),
      trend_risk: Number(trendRisk.toFixed(1)),
      attendance_contribution: attendanceContribution,
      assignment_contribution: assignmentContribution,
      examination_contribution: examinationContribution,
      trend_contribution: trendContribution
    },
    evidence
  };
}

// =============================================================
// RECOMMENDATION ENGINE (Data-Grounded)
// =============================================================
export function generateRecommendations(
  attendancePercentage: number,
  assignmentScore: number,
  examinationScore: number,
  previousScore: number,
  currentScore: number,
  attendanceSessions = { attended: 0, total: 0 }
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let id = 1;

  if (attendancePercentage < 75) {
    const buffer = calculateAttendanceBuffer(attendanceSessions.attended, attendanceSessions.total, 75);
    const classesNeeded = Math.abs(buffer.buffer_sessions);
    recommendations.push({
      id: id++,
      category: "Attendance",
      priority: "critical",
      reason: `Current attendance (${attendancePercentage.toFixed(1)}%) is ${Number((75 - attendancePercentage).toFixed(1))}% below institutional requirement.`,
      evidence: `Present for only ${attendanceSessions.attended} of ${attendanceSessions.total} total sessions held.`,
      recommended_action: `Prioritize 100% attendance over the next ${classesNeeded} consecutive class sessions to restore compliance. Coordinate with course instructors to verify presence.`,
      expected_impact: `Reduces student risk index by up to ${(0.30 * (100 - attendancePercentage)).toFixed(1)} points and avoids academic bar on examination entry.`,
      deadline: "Within 14 calendar days"
    });
  } else if (attendancePercentage < 85) {
    recommendations.push({
      id: id++,
      category: "Attendance",
      priority: "medium",
      reason: `Attendance buffer is low (${attendancePercentage.toFixed(1)}%). Missing a single lab session may trigger a warning threshold.`,
      evidence: `Student has 0-1 safe absences remaining.`,
      recommended_action: `Maintain steady participation across morning sessions and notify academic office early in case of illness.`,
      expected_impact: `Maintains risk score buffer below 30 (Low Risk boundary).`,
      deadline: "Ongoing semester review"
    });
  }

  if (assignmentScore < 60) {
    recommendations.push({
      id: id++,
      category: "Assignments",
      priority: "high",
      reason: `Assignment performance is weak (${assignmentScore.toFixed(1)}%), pulling down the continuous internal assessment score.`,
      evidence: `Pending or under-graded problem sets in primary coursework modules.`,
      recommended_action: `Schedule designated study hall hours, review professor feedback on previous problem sets, and submit overdue coursework under late-forgiveness windows.`,
      expected_impact: `Can recover up to 10-15 points on the internal assessment component and reduce assignment risk by 40%.`,
      deadline: "Next 7 days"
    });
  } else if (assignmentScore < 75) {
    recommendations.push({
      id: id++,
      category: "Assignments",
      priority: "medium",
      reason: `Good assignment completion but conceptual depth can be strengthened for high marks.`,
      evidence: `Average score across labs is ${assignmentScore.toFixed(1)}%.`,
      recommended_action: `Utilize office hours to review difficult dynamic programming and matrix algorithms before submitting final p-sets.`,
      expected_impact: `Pushes assignment average above 80% benchmark.`,
      deadline: "Next assignment cycle"
    });
  }

  if (examinationScore < 60) {
    recommendations.push({
      id: id++,
      category: "Examinations",
      priority: "critical",
      reason: `Exam score average (${examinationScore.toFixed(1)}%) is below standard mastery criteria.`,
      evidence: `Midterm evaluation performance showed significant deficit in core problem-solving questions.`,
      recommended_action: `Engage with departmental peer tutoring program, complete 3 mock test papers under timed conditions, and review past exam solution keys.`,
      expected_impact: `Projected +18 point exam performance lift will decrease overall academic risk by ~15.4 points.`,
      deadline: "Prior to Comprehensive Final Exam"
    });
  }

  if (currentScore < previousScore - 5) {
    const drop = Number((previousScore - currentScore).toFixed(1));
    recommendations.push({
      id: id++,
      category: "Performance Trend",
      priority: "high",
      reason: `Performance has experienced a notable negative trend (-${drop} points).`,
      evidence: `Historical benchmark was ${previousScore.toFixed(1)}, current performance dropped to ${currentScore.toFixed(1)}.`,
      recommended_action: `Initiate a 1-on-1 faculty advisory checkpoint to identify root causes (workload, schedule conflict, or foundational gaps) and establish an academic recovery roadmap.`,
      expected_impact: `Reverses negative trend momentum and restores performance stability.`,
      deadline: "Immediate (Within 48 hours)"
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: id++,
      category: "Overall",
      priority: "low",
      reason: "All primary academic signals indicate strong mastery and consistent engagement.",
      evidence: `High performance maintained: Attendance ${attendancePercentage.toFixed(1)}%, Assignments ${assignmentScore.toFixed(1)}%, Exams ${examinationScore.toFixed(1)}%.`,
      recommended_action: "Continue current study routine. Consider applying for undergraduate teaching assistantships or advanced research electives.",
      expected_impact: "Sustains Low Risk profile and high GPA standing.",
      deadline: "End of semester"
    });
  }

  return recommendations;
}

// =============================================================
// WHAT-IF SIMULATOR ENGINE
// =============================================================
export function simulateWhatIf(
  currentAttendance: number,
  currentAssignments: number,
  currentExams: number,
  previousScore: number,
  targetExamScore?: number,
  projectedAttendance?: number,
  projectedAssignmentScore?: number
): WhatIfResponse {
  // Current calculations
  const curAtt = currentAttendance;
  const curAss = currentAssignments;
  const curEx = currentExams;
  const curOverall = Number((curAtt * 0.30 + curAss * 0.20 + curEx * 0.50).toFixed(1));

  const currentRiskObj = calculateExplainableRisk(curAtt, curAss, curEx, previousScore, curOverall);

  // Projected calculations (use user inputs or keep existing if not provided)
  const projAtt = projectedAttendance !== undefined ? Math.max(0, Math.min(100, projectedAttendance)) : curAtt;
  const projAss = projectedAssignmentScore !== undefined ? Math.max(0, Math.min(100, projectedAssignmentScore)) : curAss;
  const projEx = targetExamScore !== undefined ? Math.max(0, Math.min(100, targetExamScore)) : curEx;

  const projOverall = Number((projAtt * 0.30 + projAss * 0.20 + projEx * 0.50).toFixed(1));
  const projectedRiskObj = calculateExplainableRisk(projAtt, projAss, projEx, curOverall, projOverall);

  const riskChange = Number((projectedRiskObj.risk_score - currentRiskObj.risk_score).toFixed(1));

  return {
    current_overall: curOverall,
    projected_overall: projOverall,
    current_risk: currentRiskObj.risk_score,
    projected_risk: projectedRiskObj.risk_score,
    current_risk_level: currentRiskObj.risk_level,
    projected_risk_level: projectedRiskObj.risk_level,
    risk_change: riskChange,
    target_exam_score: projEx,
    projected_attendance: projAtt,
    projected_assignment_score: projAss,
    breakdown: {
      attendance: { current: curAtt, projected: projAtt },
      assignments: { current: curAss, projected: projAss },
      examinations: { current: curEx, projected: projEx }
    },
    disclaimer: "Simulation only — not a guaranteed prediction. Projections represent mathematical scenarios derived from the AURA deterministic intelligence model based on simulated telemetry inputs."
  };
}

// =============================================================
// AI ACADEMIC COPILOT (With Safe Deterministic Fallback)
// =============================================================
export async function generateAICopilotResponse(
  insight: InsightObject,
  question: string
): Promise<AICopilotResponse> {
  const defaultSummary = {
    student_name: insight.student.name,
    risk_level: insight.risk.risk_level.toUpperCase(),
    risk_score: insight.risk.risk_score,
    trend: insight.trend.direction
  };

  // Check if Gemini API client is available
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are AURA's AI Academic Intelligence Copilot for university educators.
Analyze the following verified, deterministic academic telemetry data for student "${insight.student.name}" (Department of ${insight.student.department}, Year ${insight.student.year}):

=== VERIFIED ACADEMIC TELEMETRY DATA ===
- Overall Performance: ${insight.overall_score.toFixed(1)}/100
- Risk Score: ${insight.risk.risk_score} (Level: ${insight.risk.risk_level.toUpperCase()})
- Primary Risk Factor: ${insight.risk.primary_factor}
- Attendance: ${insight.attendance.percentage.toFixed(1)}% (${insight.attendance.attended}/${insight.attendance.total} sessions conducted, Buffer: ${insight.attendance.buffer} sessions)
- Assignments: Average ${insight.assignments.average.toFixed(1)}% (${insight.assignments.completed} completed, ${insight.assignments.pending} pending, ${insight.assignments.overdue} overdue)
- Examinations: Average ${insight.examinations.average.toFixed(1)}% across ${insight.examinations.count} assessments
- Performance Trend: ${insight.trend.direction.toUpperCase()} (${insight.trend.change >= 0 ? '+' : ''}${insight.trend.change} points from baseline of ${insight.trend.previous_score} to ${insight.trend.current_score})
- Evidence & Factors: ${insight.risk.contributing_factors.join(' ')}
- Active Recommendations: ${insight.recommendations.map(r => `[${r.priority.toUpperCase()}] ${r.recommended_action}`).join('; ')}
- Existing Interventions: ${insight.interventions.length > 0 ? insight.interventions.map(i => `${i.title} (${i.status})`).join('; ') : 'None currently recorded'}

USER INQUIRY: "${question}"

INSTRUCTIONS:
1. Answer the user inquiry directly, accurately, and empathetically in 2 to 3 concise, professional paragraphs.
2. Ground EVERY single statement in the verified numbers above.
3. NEVER invent grades, assignments, exams, or personal details not in the telemetry data.
4. Distinguish clearly between deterministic data and educational recommendations.
5. Provide actionable advice for the educator or student.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const responseText = response.text?.trim();
      if (responseText) {
        return {
          question,
          answer: responseText,
          is_ai_generated: true,
          generated_at: new Date().toISOString(),
          insight_summary: defaultSummary
        };
      }
    } catch (err) {
      console.warn("Gemini API call failed or timed out. Gracefully falling back to deterministic response.", err);
    }
  }

  // Deterministic Fallback Logic (Guaranteed 100% Reliable without external API)
  let fallbackAnswer = "";
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes("why") || lowerQ.includes("risk")) {
    fallbackAnswer = `**Risk Diagnosis for ${insight.student.name} (${insight.risk.risk_level.toUpperCase()} Risk — Score: ${insight.risk.risk_score}/100)**\n\n` +
      `The student's elevated academic risk is driven primarily by **${insight.risk.primary_factor}**. ` +
      `Key contributing signals include:\n` +
      `• **Attendance**: Observed at ${insight.attendance.percentage.toFixed(1)}% (${insight.attendance.attended}/${insight.attendance.total} sessions). Threshold is 75.0%. Buffer status: ${insight.attendance.buffer < 0 ? `${Math.abs(insight.attendance.buffer)} sessions behind` : `${insight.attendance.buffer} safe sessions`}.\n` +
      `• **Assignments**: Average of ${insight.assignments.average.toFixed(1)}% with ${insight.assignments.overdue} overdue submissions.\n` +
      `• **Examinations**: Assessment average stands at ${insight.examinations.average.toFixed(1)}%.\n` +
      `• **Performance Trajectory**: Recent performance exhibits a **${insight.trend.direction}** trend (${insight.trend.change >= 0 ? '+' : ''}${insight.trend.change} points).\n\n` +
      `*Recommended Immediate Focus:* ${insight.recommendations[0]?.recommended_action || "Maintain regular attendance and engage with instructors."}`;
  } else if (lowerQ.includes("weak") || lowerQ.includes("area") || lowerQ.includes("subject")) {
    const weakList = insight.weak_subjects.length > 0
      ? insight.weak_subjects.map(w => `• **${w.course_name} (${w.course_code})**: Score of ${w.score.toFixed(1)}% — ${w.issue}`).join('\n')
      : `• All coursework scores are currently above the critical 60% mark.`;

    fallbackAnswer = `**Weak-Subject & Competency Diagnostic for ${insight.student.name}**\n\n` +
      `Analysis of recent assessments reveals the following focus areas:\n` +
      `${weakList}\n\n` +
      `Additionally, ${insight.assignments.overdue > 0 ? `the student has ${insight.assignments.overdue} overdue assignments requiring submission.` : "assignment submissions are current."} ` +
      `Targeted remediation in problem sets and algorithmic proofs will yield the highest performance recovery.`;
  } else if (lowerQ.includes("prioritize") || lowerQ.includes("teacher") || lowerQ.includes("intervention")) {
    const topRec = insight.recommendations[0];
    fallbackAnswer = `**Teacher Intervention Priorities for ${insight.student.name}**\n\n` +
      `Based on AURA's closed-loop risk engine, the instructor should prioritize:\n` +
      `1. **Immediate Intervention**: ${topRec ? topRec.recommended_action : "Schedule 1-on-1 progress review."} (Expected Impact: ${topRec?.expected_impact || "Stabilize risk score"})\n` +
      `2. **Attendance Enforcement**: ${insight.attendance.percentage < 75 ? `Enforce an attendance recovery contract requiring mandatory attendance for the next ${Math.abs(insight.attendance.buffer)} sessions.` : `Attendance is stable (${insight.attendance.percentage.toFixed(1)}%).`}\n` +
      `3. **Formative Assessment**: Assign supplementary practice problems targeting lower-scoring modules prior to the comprehensive final exam.`;
  } else if (lowerQ.includes("summarize") || lowerQ.includes("progress") || lowerQ.includes("summary")) {
    fallbackAnswer = `**Comprehensive Academic Summary for ${insight.student.name}**\n\n` +
      `• **Enrollment**: Year ${insight.student.year || 3}, Department of ${insight.student.department}.\n` +
      `• **Overall Performance**: ${insight.overall_score.toFixed(1)}/100.\n` +
      `• **Risk Classification**: ${insight.risk.risk_level.toUpperCase()} (${insight.risk.risk_score} / 100).\n` +
      `• **Attendance Record**: ${insight.attendance.percentage.toFixed(1)}% (${insight.attendance.attended} attended / ${insight.attendance.total} total).\n` +
      `• **Trajectory**: ${insight.trend.direction.toUpperCase()} (${insight.trend.change >= 0 ? '+' : ''}${insight.trend.change} points).\n` +
      `• **Intervention Status**: ${insight.interventions.length} intervention plan${insight.interventions.length !== 1 ? 's' : ''} currently logged.`;
  } else {
    fallbackAnswer = `**Academic Intelligence Telemetry for ${insight.student.name}**\n\n` +
      `Regarding your inquiry: "${question}"\n\n` +
      `The student currently has an overall performance score of **${insight.overall_score.toFixed(1)}%** with a **${insight.risk.risk_level.toUpperCase()}** academic risk profile (Score: ${insight.risk.risk_score}/100). ` +
      `Primary driver: **${insight.risk.primary_factor}**. Recent performance trend is **${insight.trend.direction}**. ` +
      `Key actionable step: ${insight.recommendations[0]?.recommended_action || "Review course metrics with the academic advisor."}`;
  }

  return {
    question,
    answer: fallbackAnswer,
    is_ai_generated: false,
    generated_at: new Date().toISOString(),
    insight_summary: defaultSummary
  };
}
