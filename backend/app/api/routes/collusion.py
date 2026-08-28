"""
Collusion detection and knowledge graph analytics API router.
POST /api/collusion - cross-bidder collusion analysis and graph creation
POST /api/collusion/text-similarity - pair-wise text similarity check
"""
from __future__ import annotations
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models import CollusionRequest, TenderIntegrityReport
from app.collusion_engine import analyze_tender_integrity
from app.text_similarity import compute_jaccard_similarity, compute_ngram_overlap
from app.audit_service import AuditService

router = APIRouter()


class TextSimilarityRequest(BaseModel):
    text1: str
    text2: str


@router.post("", response_model=TenderIntegrityReport)
def evaluate_collusion(request: CollusionRequest):
    """
    Evaluates submitted bids for a tender using cross-bidder knowledge graph
    algorithms to detect shared DINs, registered addresses, auditors, tight incorporation
    windows, and proposal text plagiarism.
    """
    try:
        report = analyze_tender_integrity(request.tenderId, request.bidders)

        AuditService.log_event(
            tender_id=request.tenderId,
            event_type="COLLUSION_EVALUATED",
            actor="BidFlo Cross-Bidder Knowledge Graph Microservice",
            payload={
                "totalBidders": len(request.bidders),
                "overallRisk": report.overallRisk,
                "clusterCount": len(report.clusters),
                "signalsDetected": sum(len(c.signals) for c in report.clusters),
            },
        )

        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collusion analysis failed: {str(e)}")


@router.post("/text-similarity")
def check_text_similarity(request: TextSimilarityRequest):
    """
    Computes token-level Jaccard similarity and 4-gram overlap ratio between two texts.
    """
    jaccard = compute_jaccard_similarity(request.text1, request.text2)
    ngram = compute_ngram_overlap(request.text1, request.text2, 4)
    return {
        "jaccardSimilarity": round(jaccard, 4),
        "ngramOverlap": round(ngram, 4),
        "maxSimilarity": round(max(jaccard, ngram), 4),
        "isSuspicious": max(jaccard, ngram) > 0.5,
    }
