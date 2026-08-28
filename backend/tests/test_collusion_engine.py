"""
Unit tests for Python Collusion Detection & Knowledge Graph Analytics.
"""
import pytest
from app.models import (
    Bidder,
    Director,
    McaFilings,
    ConsentToken,
)
from app.collusion_engine import analyze_tender_integrity


def make_bidders_with_shared_din_and_address():
    b1 = Bidder(
        id="BIDDER_1",
        tenderId="TENDER_001",
        name="TechPro Solutions Pvt Ltd",
        tradeName="TechPro",
        cin="U72900DL2021PTC381001",
        pan="AAACT1234K",
        gstin="07AAACT1234K1Z2",
        incorporationDate="2021-03-10",
        registeredAddress="Plot 45, Sector 62, Noida, UP - 201301",
        statutoryAuditor="M/s K.N. Goyal & Associates",
        directors=[
            Director(din="08991234", name="Sunil Narang", pan="AAAPN8812K", appointmentDate="2021-03-10"),
            Director(din="08995678", name="Alok Mathur", pan="AAAPM9912K", appointmentDate="2021-03-10"),
        ],
        mcaFilings=McaFilings(
            cin="U72900DL2021PTC381001",
            companyName="TechPro Solutions Pvt Ltd",
            status="ACTIVE",
            rocCode="RoC-Kanpur",
            registrationNumber="381001",
            category="Company limited by Shares",
            lastAgmDate="2025-09-30",
            balanceSheetDate="2025-03-31",
            statutoryAuditor="M/s K.N. Goyal & Associates",
            registeredAddress="Plot 45, Sector 62, Noida, Gautam Buddha Nagar, UP 201301",
        ),
        financialTurnover=[],
        submittedDocuments=[],
        consentToken=ConsentToken(
            tokenId="T1", bidderId="BIDDER_1", tenderId="TENDER_001", timestamp="2026-08-10T10:00:00Z",
            ipAddress="10.0.0.1", consentedScopes=["GSTN"], signature="SIG1"
        ),
        bidSubmissionDate="2026-08-10T10:00:00Z",
        bidAmount=48.2,
        technicalProposalText="Comprehensive supply and integration of MIL-STD-810H rugged computing systems with specialized thermal management.",
    )

    b2 = Bidder(
        id="BIDDER_2",
        tenderId="TENDER_001",
        name="NextGen Infotech Pvt Ltd",
        tradeName="NextGen",
        cin="U72900DL2021PTC381045",
        pan="AAACN5678L",
        gstin="07AAACN5678L1Z9",
        incorporationDate="2021-03-24",  # 14 days difference
        registeredAddress="Plot 45, Sector 62, Noida, UP - 201301",  # Same physical address
        statutoryAuditor="M/s K.N. Goyal & Associates",  # Same auditor
        directors=[
            Director(din="08991234", name="Sunil Narang", pan="AAAPN8812K", appointmentDate="2021-03-24"),  # Shared DIN
            Director(din="09112233", name="Pooja Narang", pan="AAAPN7712K", appointmentDate="2021-03-24"),
        ],
        mcaFilings=McaFilings(
            cin="U72900DL2021PTC381045",
            companyName="NextGen Infotech Pvt Ltd",
            status="ACTIVE",
            rocCode="RoC-Kanpur",
            registrationNumber="381045",
            category="Company limited by Shares",
            lastAgmDate="2025-09-30",
            balanceSheetDate="2025-03-31",
            statutoryAuditor="M/s K.N. Goyal & Associates",
            registeredAddress="Plot 45, Sector 62, Noida, UP - 201301",
        ),
        financialTurnover=[],
        submittedDocuments=[],
        consentToken=ConsentToken(
            tokenId="T2", bidderId="BIDDER_2", tenderId="TENDER_001", timestamp="2026-08-10T10:05:00Z",
            ipAddress="10.0.0.2", consentedScopes=["GSTN"], signature="SIG2"
        ),
        bidSubmissionDate="2026-08-10T10:05:00Z",
        bidAmount=49.1,
        technicalProposalText="Comprehensive supply and integration of MIL-STD-810H rugged computing systems with specialized thermal management architecture.",
    )

    return [b1, b2]


def test_detects_collusion_cluster():
    bidders = make_bidders_with_shared_din_and_address()
    report = analyze_tender_integrity("TENDER_001", bidders)

    assert report.totalBiddersAnalyzed == 2
    assert report.overallRisk == "HIGH_INVESTIGATION"
    assert len(report.clusters) > 0

    cluster = report.clusters[0]
    signal_types = [s.type for s in cluster.signals]

    assert "SHARED_DIN" in signal_types
    assert "SHARED_ADDRESS" in signal_types
    assert "TIGHT_INCORPORATION" in signal_types
    assert "SHARED_AUDITOR" in signal_types
    assert "DOCUMENT_SIMILARITY" in signal_types


def test_independent_bidders_report_clear():
    b1 = make_bidders_with_shared_din_and_address()[0]
    b_clean = Bidder(
        id="BIDDER_INDEPENDENT",
        tenderId="TENDER_001",
        name="Independent Systems Ltd",
        tradeName="Independent",
        cin="U11111MH2010PLC123456",
        pan="AAACI9999M",
        gstin="27AAACI9999M1Z1",
        incorporationDate="2010-01-15",
        registeredAddress="Nariman Point, Mumbai, MH 400021",
        statutoryAuditor="M/s Deloitte Haskins & Sells",
        directors=[Director(din="01111111", name="Ramesh Patel", pan="AAAPR1111K", appointmentDate="2010-01-15")],
        mcaFilings=McaFilings(
            cin="U11111MH2010PLC123456",
            companyName="Independent Systems Ltd",
            status="ACTIVE",
            rocCode="RoC-Mumbai",
            registrationNumber="123456",
            category="Company limited by Shares",
            lastAgmDate="2025-09-30",
            balanceSheetDate="2025-03-31",
            statutoryAuditor="M/s Deloitte Haskins & Sells",
            registeredAddress="Nariman Point, Mumbai, MH 400021",
        ),
        financialTurnover=[],
        submittedDocuments=[],
        consentToken=ConsentToken(
            tokenId="T3", bidderId="BIDDER_INDEPENDENT", tenderId="TENDER_001", timestamp="2026-08-10T10:00:00Z",
            ipAddress="10.0.0.3", consentedScopes=["GSTN"], signature="SIG3"
        ),
        bidSubmissionDate="2026-08-10T10:00:00Z",
        bidAmount=44.0,
        technicalProposalText="Completely different proposal for indigenous server delivery with Linux OS support.",
    )

    report = analyze_tender_integrity("TENDER_001", [b1, b_clean])
    assert report.overallRisk == "CLEAR"
    assert len(report.clusters) == 0
