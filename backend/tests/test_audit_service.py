"""
Unit tests for Python SHA-256 Hash Chained Audit Ledger & Tamper Detection.
"""
import pytest
from app.audit_service import AuditService, GENESIS_PREV_HASH


@pytest.fixture(autouse=True)
def clean_audit_chain():
    AuditService.reset_chain()
    AuditService.initialize_genesis()
    yield
    AuditService.reset_chain()


def test_genesis_block_creation():
    logs = AuditService.get_logs()
    assert len(logs) == 1
    genesis = logs[0]
    assert genesis.index == 0
    assert genesis.previousHash == GENESIS_PREV_HASH
    assert len(genesis.currentHash) == 64


def test_chain_integrity_verification():
    # Append events
    AuditService.log_event(
        tender_id="TENDER_001",
        bidder_id="BIDDER_001",
        event_type="COMPLIANCE_EVALUATED",
        actor="Officer Sharma",
        payload={"verdict": "ELIGIBLE", "score": 92.5},
    )

    AuditService.log_event(
        tender_id="TENDER_001",
        bidder_id="BIDDER_002",
        event_type="DECISION_ACCEPTED",
        actor="Officer Sharma",
        payload={"decision": "ACCEPTED"},
    )

    logs = AuditService.get_logs()
    assert len(logs) == 3

    verification = AuditService.verify_chain_integrity()
    assert verification.isValid is True
    assert verification.totalBlocks == 3
    assert verification.brokenBlockIndex is None
    assert "tamper-evident" in verification.verificationMessage


def test_detects_malicious_payload_tampering():
    AuditService.log_event(
        tender_id="TENDER_001",
        bidder_id="BIDDER_001",
        event_type="COMPLIANCE_EVALUATED",
        actor="System",
        payload={"score": 55.0, "status": "NON_COMPLIANT"},
    )

    # Malicious actor changes score from 55.0 to 95.0 in block #1
    tampered = AuditService.simulate_tamper(1, "score", 95.0)
    assert tampered is True

    # Immediate cryptographic verification failure
    verification = AuditService.verify_chain_integrity()
    assert verification.isValid is False
    assert verification.brokenBlockIndex == 1
    assert "altered" in verification.verificationMessage or "mismatch" in verification.verificationMessage
