"""
Tenders API router.
POST /api/tenders/extract-clauses - RAG clause extraction with citation grounding
"""
from __future__ import annotations
from typing import List, Literal, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.rag_clause_engine import extract_applicable_clauses, ExtractedClauseFinding

router = APIRouter()


class ClauseExtractRequest(BaseModel):
    title: str
    category: Literal["GOODS", "SERVICES", "WORKS"]
    description: str


@router.post("/extract-clauses", response_model=List[ExtractedClauseFinding])
def extract_clauses_from_text(request: ClauseExtractRequest):
    """
    Analyzes tender title, category, and raw scope text to extract statutory
    and weighted compliance clauses grounded in General Financial Rules (GFR),
    Make in India DPIIT orders, and MSME public procurement mandates.
    """
    return extract_applicable_clauses(
        tender_title=request.title,
        tender_category=request.category,
        raw_tender_text=request.description,
    )


@router.get("/categories")
def get_supported_categories():
    return {
        "categories": [
            {
                "id": "GOODS",
                "label": "Goods / Hardware / Equipment",
                "mandatoryChecks": ["DEBARMENT", "MCA21", "PAN", "GST", "OEM_AUTH", "MAKE_IN_INDIA"],
            },
            {
                "id": "SERVICES",
                "label": "Services / Facility Management / IT Staffing",
                "mandatoryChecks": ["DEBARMENT", "MCA21", "PAN", "GST", "EPFO_ESIC"],
            },
            {
                "id": "WORKS",
                "label": "Civil & Construction Works",
                "mandatoryChecks": ["DEBARMENT", "MCA21", "PAN", "GST", "UDIN_TURNOVER"],
            },
        ]
    }
