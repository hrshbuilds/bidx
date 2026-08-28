"""
Unit tests for Python Hard Gates Engine (Debarment, Tax existence, MCA21, DigiLocker).
"""
import pytest
from app.models import (
    Bidder,
    Director,
    McaFilings,
    SubmittedDocument,
    ConsentToken,
    Tender,
    TenderAuthority,
)
from app.gate_engine import evaluate_hard_gates


def make_sample_tender() -> Tender:
    return Tender(
        id="TENDER_001",
        tenderNumber="GEM/2026/B/89124",
        title="Procurement of Ruggedized Laptops",
        category="GOODS",
        estimatedValue=45.0,
        publishedDate="2026-08-01T00:00:00Z",
        closingDate="2026-08-30T00:00:00Z",
        authority=TenderAuthority(
            name="Directorate General of Information Systems",
            department="Ministry of Defence",
            location="New Delhi",
        ),
        description="Supply of 1,200 MIL-STD Rugged Laptops",
        clauses=[],
    )


def make_clean_bidder() -> Bidder:
    return Bidder(
        id="BIDDER_CLEAN",
        tenderId="TENDER_001",
        name="Apex Digital Systems Pvt Ltd",
        tradeName="Apex Digital",
        cin="U72900DL2018PTC334455",
        pan="AABCA1234F",
        gstin="07AABCA1234F1Z8",
        udyamNumber="UDYAM-DL-01-0089124",
        epfoNumber="DLCPM1234567000",
        isMsme=True,
        incorporationDate="2018-04-12",
        registeredAddress="Plot 12, Okhla Industrial Area Phase-III, New Delhi 110020",
        statutoryAuditor="M/s S.R. Batliboi & Associates LLP",
        directors=[
            Director(din="07123456", name="Vikramaditya Sharma", pan="AAAPS1234K", appointmentDate="2018-04-12")
        ],
        mcaFilings=McaFilings(
            cin="U72900DL2018PTC334455",
            companyName="Apex Digital Systems Pvt Ltd",
            status="ACTIVE",
            rocCode="RoC-Delhi",
            registrationNumber="334455",
            category="Company limited by Shares",
            lastAgmDate="2025-09-30",
            balanceSheetDate="2025-03-31",
            statutoryAuditor="M/s S.R. Batliboi & Associates LLP",
            registeredAddress="Plot 12, Okhla Industrial Area Phase-III, New Delhi 110020",
        ),
        financialTurnover=[],
        submittedDocuments=[],
        consentToken=ConsentToken(
            tokenId="TOKEN_001",
            bidderId="BIDDER_CLEAN",
            tenderId="TENDER_001",
            timestamp="2026-08-10T10:00:00Z",
            ipAddress="103.21.124.8",
            consentedScopes=["GSTN", "PAN", "MCA21", "UDYAM"],
            signature="SIG_TOKEN_001",
        ),
        bidSubmissionDate="2026-08-10T10:30:00Z",
        bidAmount=42.5,
    )


def test_clean_bidder_passes_all_gates():
    tender = make_sample_tender()
    bidder = make_clean_bidder()
    is_eligible, results = evaluate_hard_gates(bidder, tender)
    assert is_eligible is True
    assert all(r.status == "PASSED" for r in results)


def test_debarred_bidder_fails_gate():
    tender = make_sample_tender()
    bidder = make_clean_bidder()
    bidder.pan = "AABCE9999K"  # In debarment registry

    is_eligible, results = evaluate_hard_gates(bidder, tender)
    assert is_eligible is False
    deb_result = next((r for r in results if r.gateId == "GATE_DEBARMENT"), None)
    assert deb_result is not None
    assert deb_result.status == "FAILED"
    assert "Rule 151" in deb_result.reason


def test_struck_off_mca_fails_gate():
    tender = make_sample_tender()
    bidder = make_clean_bidder()
    bidder.mcaFilings.status = "STRUCK_OFF"

    is_eligible, results = evaluate_hard_gates(bidder, tender)
    assert is_eligible is False
    mca_result = next((r for r in results if r.gateId == "GATE_MCA_LEGAL_STATUS"), None)
    assert mca_result is not None
    assert mca_result.status == "FAILED"


def test_tampered_document_fails_gate():
    tender = make_sample_tender()
    bidder = make_clean_bidder()
    bidder.submittedDocuments = [
        SubmittedDocument(
            id="DOC_FAKE",
            type="OEM_AUTHORIZATION",
            title="Forged OEM Authorization",
            documentNumber="FORGED_MAF_999",
            source="BIDDER_UPLOAD",
            isDigiLockerVerified=False,
            issuer="Fake Issuer",
            issuedDate="2026-01-01",
            checksum="bad_checksum_123",
        )
    ]

    is_eligible, results = evaluate_hard_gates(bidder, tender)
    assert is_eligible is False
    doc_result = next((r for r in results if r.gateId == "GATE_DOC_AUTHENTICITY"), None)
    assert doc_result is not None
    assert doc_result.status == "FAILED"
