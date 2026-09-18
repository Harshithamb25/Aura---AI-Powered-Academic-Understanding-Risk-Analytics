from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os

app = FastAPI(
    title="AURA — Academic Understanding, Risk & Action API",
    description="Deterministic Academic Intelligence, Explainable Risk Analysis, What-If Simulation, and Intervention Lifecycle Management.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AURA Python FastAPI Engine",
        "version": "1.0.0"
    }

# Risk Engine Formula
# Weights: Attendance 30%, Assignments 20%, Examinations 30%, Trend 20%
def calculate_risk(
    attendance_pct: float,
    assignment_score: float,
    exam_score: float,
    previous_score: float,
    current_score: float
) -> Dict[str, Any]:
    att_risk = max(0.0, 100.0 - attendance_pct)
    ass_risk = max(0.0, 100.0 - assignment_score)
    ex_risk = max(0.0, 100.0 - exam_score)

    if previous_score > 0:
        trend_change = current_score - previous_score
        trend_risk = max(0.0, min(100.0, 50.0 - trend_change * 5.0))
    else:
        trend_risk = 50.0

    att_contrib = round(att_risk * 0.30, 2)
    ass_contrib = round(ass_risk * 0.20, 2)
    ex_contrib = round(ex_risk * 0.30, 2)
    trend_contrib = round(trend_risk * 0.20, 2)

    total_risk = round(min(100.0, max(0.0, att_contrib + ass_contrib + ex_contrib + trend_contrib)), 1)

    if total_risk >= 70:
        level = "CRITICAL"
    elif total_risk >= 50:
        level = "HIGH"
    elif total_risk >= 30:
        level = "MODERATE"
    else:
        level = "LOW"

    return {
        "risk_score": total_risk,
        "risk_level": level,
        "signals": {
            "attendance_contribution": att_contrib,
            "assignment_contribution": ass_contrib,
            "examination_contribution": ex_contrib,
            "trend_contribution": trend_contrib
        }
    }

# Attendance Buffer Calculation
def calculate_attendance_buffer(attended: int, total: int, threshold: float = 75.0) -> Dict[str, Any]:
    if total <= 0:
        return {"percentage": 100.0, "buffer": 0, "status": "SAFE"}

    pct = round((attended / total) * 100.0, 1)
    t = threshold / 100.0

    if pct >= threshold:
        buffer = int((attended - t * total) / t)
        return {
            "percentage": pct,
            "buffer": max(0, buffer),
            "status": "SAFE" if pct >= 85 else "WARNING",
            "message": f"Student can safely miss up to {buffer} class(es) before violating {threshold}% threshold."
        }
    else:
        needed = int(((t * total - attended) / (1.0 - t)) + 0.999)
        return {
            "percentage": pct,
            "buffer": -needed,
            "status": "CRITICAL",
            "message": f"Student must attend the next {needed} consecutive class(es) to recover compliance."
        }
