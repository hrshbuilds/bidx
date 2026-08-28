"""
Immutable SHA-256 Audit Trail API router.
GET /api/audit - fetch audit ledger and real-time cryptographic verification
POST /api/audit/verify - verify integrity of an arbitrary chain
POST /api/audit/simulate-tamper - simulate tampering for judge live demos
POST /api/audit/reset - resets chain to genesis
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.models import AuditChainVerification, AuditLogBlock
from app.audit_service import AuditService

router = APIRouter()


class SimulateTamperRequest(BaseModel):
    blockIndex: int
    key: str
    newValue: Any


class CustomVerifyRequest(BaseModel):
    chain: List[AuditLogBlock]


@router.get("")
def get_audit_trail(
    tenderId: Optional[str] = Query(None, description="Optional tender ID filter"),
    bidderId: Optional[str] = Query(None, description="Optional bidder ID filter"),
):
    """
    Returns all audit ledger blocks with a real-time mathematical integrity check.
    """
    logs = AuditService.get_logs(tender_id=tenderId, bidder_id=bidderId)
    verification = AuditService.verify_chain_integrity()
    return {
        "blocks": logs,
        "verification": verification,
    }


@router.post("/verify", response_model=AuditChainVerification)
def verify_audit_chain(request: Optional[CustomVerifyRequest] = None):
    """
    Cryptographically verifies the given or current hash chain.
    """
    custom = request.chain if request else None
    return AuditService.verify_chain_integrity(custom)


@router.post("/simulate-tamper")
def simulate_tamper(request: SimulateTamperRequest):
    """
    Simulates malicious tampering on a historical audit block to demonstrate
    immediate break in the cryptographic hash chain during live demonstrations.
    """
    success = AuditService.simulate_tamper(
        block_index=request.blockIndex,
        key=request.key,
        new_value=request.newValue,
    )
    if not success:
        return {"status": "error", "message": f"Block index {request.blockIndex} out of range."}

    # Immediately re-verify to show broken status
    verification = AuditService.verify_chain_integrity()
    return {
        "status": "tampered",
        "message": f"Block #{request.blockIndex} modified. Recalculating chain integrity.",
        "verification": verification,
    }


@router.post("/reset")
def reset_audit_chain():
    """
    Resets the in-memory audit ledger and reinitializes genesis block.
    """
    AuditService.reset_chain()
    AuditService.initialize_genesis()
    return {"status": "success", "message": "Audit chain reset to genesis block."}
