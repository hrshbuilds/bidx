"""
Compliance verification API router.
POST /api/verify - full evaluation (gates + weighted checks + audit logging)
POST /api/verify/gate - evaluates hard gates only
POST /api/verify/officer-override - logs officer override decision
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException

from app.models import (
    VerifyRequest,
    BidComplianceReport,
    OfficerDecisionRequest,
)
from app.scoring_engine import evaluate_bidder_compliance
from app.gate_engine import evaluate_hard_gates
from app.audit_service import AuditService

router = APIRouter()


@router.post("", response_model=BidComplianceReport)
def verify_bidder(request: VerifyRequest):
    """
    Evaluates statutory compliance for a single bidder against a tender.
    Returns explainable report with hard gate results, redistributed weights,
    0-100 score, document verification status, and pending requirements.
    Also appends an immutable record to the audit hash chain.
    """
    try:
        report = evaluate_bidder_compliance(request.bidder, request.tender)

        # Log event to immutable audit chain
        AuditService.log_event(
            tender_id=request.tender.id,
            bidder_id=request.bidder.id,
            event_type="COMPLIANCE_EVALUATED",
            actor="BidFlo Autonomous Gate & Scoring Microservice",
            payload={
                "bidderName": request.bidder.name,
                "qualifyingGateStatus": report.qualifyingGateStatus,
                "weightedScore": report.weightedScore,
                "riskLevel": report.riskLevel,
                "verdict": report.recommendation.verdict,
            },
        )

        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.post("/gate")
def verify_hard_gates_only(request: VerifyRequest):
    """
    Runs deterministic hard gates only (Debarment, Registration existence, MCA21, DigiLocker).
    """
    try:
        is_eligible, gate_results = evaluate_hard_gates(request.bidder, request.tender)
        return {
            "bidderId": request.bidder.id,
            "tenderId": request.tender.id,
            "isEligible": is_eligible,
            "hardGateResults": gate_results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gate evaluation failed: {str(e)}")


@router.post("/officer-override")
def record_officer_override(request: OfficerDecisionRequest):
    """
    Records a procurement officer's accept or override decision on a bidder.
    Mandatory reason is required if decision is OVERRIDDEN.
    """
    if request.decision == "OVERRIDDEN" and not request.overrideReason:
        raise HTTPException(
            status_code=400,
            detail="Mandatory override reason is required when overriding automated compliance verdict."
        )

    event_type = "DECISION_OVERRIDDEN" if request.decision == "OVERRIDDEN" else "DECISION_ACCEPTED"
    block = AuditService.log_event(
        tender_id=request.tenderId,
        bidder_id=request.bidderId,
        event_type=event_type,
        actor=f"Procurement Officer ({request.officerName} - ID: {request.officerId})",
        payload={
            "officerId": request.officerId,
            "officerName": request.officerName,
            "decision": request.decision,
            "overrideReason": request.overrideReason or "N/A",
        },
    )

    return {
        "status": "success",
        "decision": request.decision,
        "auditBlockIndex": block.index,
        "auditHash": block.currentHash,
    }
