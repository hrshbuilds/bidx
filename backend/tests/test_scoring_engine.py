"""
Unit tests for Python Dynamic Scoring Engine (Weight redistribution, 0-100 scoring, risk mapping).
"""
import pytest
from app.models import (
    Bidder,
    Director,
    McaFilings,
    SubmittedDocument,
    ConsentToken,
    Tender,
    TenderClause,
    TenderAuthority,
)
from app.scoring_engine import evaluate_bidder_compliance


def make_test_tender(category: str = "GOODS") -> Tender:
    return Tender(
        id="TENDER_001",
        tenderNumber="GEM/2026/B/89124",
        title="Procurement of Ruggedized Laptops",
        category=category,
        estimatedValue=45.0,
        publishedDate="2026-08-01T00:00:00Z",
        closingDate="2026-08-30T00:00:00Z",
        authority=TenderAuthority(
            name="Directorate General of Information Systems",
            department="Ministry of Defence",
            location="New Delhi",
        ),
        description="Supply of 1,200 MIL-STD Rugged Laptops",
        clauses=[
            TenderClause(
                id="C1",
                clauseNumber="Clause 5.1",
                title="MSME Purchase Preference",
                text="MSME waiver",
                type="WEIGHTED_CHECK",
                category="UDYAM",
                defaultWeight=15.0,
                isMandatory=False,
                applicableInCategories=["GOODS", "SERVICES"],
                exemptionForMSME=True,
            )
        ],
    )


def make_valid_bidder() -> Bidder:
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
        submittedDocuments=[
            SubmittedDocument(
                id="DOC_OEM_VALID",
                type="OEM_AUTHORIZATION",
                title="OEM MAF Letter",
                documentNumber="MAF/DEL/2026/089",
                source="DIGILOCKER",
                isDigiLockerVerified=True,
                issuer="Dell Technologies India",
                issuedDate="2026-06-01",
                checksum="valid_oem_checksum",
            )
        ],
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
        makeInIndiaLocalContentPercentage=65.0,
    )


def test_scoring_for_eligible_bidder():
    tender = make_test_tender("GOODS")
    bidder = make_valid_bidder()

    report = evaluate_bidder_compliance(bidder, tender)
    assert report.qualifyingGateStatus == "ELIGIBLE"
    assert report.weightedScore is not None
    assert report.weightedScore >= 85.0
    assert report.riskLevel == "LOW"
    assert len(report.scoreBreakdown) > 0

    # Verify redistributed weights sum up to 100% (within rounding)
    applicable_weights = sum(c.redistributedWeight for c in report.scoreBreakdown if c.applicable)
    assert 99.5 <= applicable_weights <= 100.5


def test_scoring_skipped_for_disqualified_bidder():
    tender = make_test_tender("GOODS")
    bidder = make_valid_bidder()
    bidder.pan = "AABCE9999K"  # Debarred

    report = evaluate_bidder_compliance(bidder, tender)
    assert report.qualifyingGateStatus == "NOT_ELIGIBLE"
    assert report.weightedScore is None
    assert report.riskLevel == "NOT_ELIGIBLE"
    assert "Disqualification Recommended" in report.recommendation.title
