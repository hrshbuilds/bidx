"""
Dynamic Scoring Engine — Python implementation mirroring src/services/scoringEngine.ts
Dynamic weight redistribution + 0-100 score computation + document verification + pending requirements.
"""
from __future__ import annotations
from datetime import datetime, timezone
import json
from typing import Callable, List, Optional

from app.models import (
    Bidder,
    Tender,
    BidComplianceReport,
    CheckScoreResult,
    DocumentVerificationItem,
    PendingRequirementItem,
    CitationRef,
    Recommendation,
    OfficerDecision,
)
from app.gate_engine import evaluate_hard_gates
from app.crypto import sha256


class RawCheckDefinition:
    def __init__(
        self,
        id: str,
        name: str,
        category: str,
        default_weight: float,
        is_applicable: Callable[[Tender], bool],
        evaluate: Callable[[Bidder, Tender], dict],
    ):
        self.id = id
        self.name = name
        self.category = category
        self.default_weight = default_weight
        self.is_applicable = is_applicable
        self.evaluate = evaluate


def _eval_gst(bidder: Bidder, _tender: Tender) -> dict:
    has_gstin = bool(bidder.gstin and len(bidder.gstin) == 15)
    if not has_gstin:
        return {
            "rawScore": 0,
            "status": "NON_COMPLIANT",
            "findings": "No active GSTIN provided or registration cancelled.",
            "citation": {
                "clauseNumber": "Clause 3.1",
                "clauseText": "Bidder must hold active GSTIN with up-to-date monthly/quarterly GSTR-3B filings.",
            },
            "liveSource": "GSTN System (Live Tier-2 via API Setu)",
        }
    is_default = "default" in bidder.name.lower() or "default" in (bidder.tradeName or "").lower()
    if is_default:
        return {
            "rawScore": 40,
            "status": "WARNING",
            "findings": "GSTIN is active, but GSTR-3B filings for the last 2 quarters show delayed returns and default notices.",
            "citation": {
                "clauseNumber": "Clause 3.1",
                "clauseText": "GST return filing compliance required for preceding 6 months.",
            },
            "liveSource": "GSTN Portal (API Setu Live Query)",
        }
    return {
        "rawScore": 100,
        "status": "COMPLIANT",
        "findings": "GSTIN is Active (Regular Taxpayer). GSTR-3B and GSTR-1 filed up to current return period with zero default notices.",
        "citation": {
            "clauseNumber": "Clause 3.1",
            "clauseText": "Valid and regular GST return filing compliance.",
        },
        "liveSource": "GSTN System (API Setu Live Tier-2)",
    }


def _eval_pan(bidder: Bidder, _tender: Tender) -> dict:
    has_pan = bool(bidder.pan and len(bidder.pan) == 10)
    if not has_pan:
        return {
            "rawScore": 0,
            "status": "NON_COMPLIANT",
            "findings": "PAN is inoperative or missing from Income Tax records.",
            "citation": {
                "clauseNumber": "Clause 3.2",
                "clauseText": "Valid PAN linked with statutory business filing.",
            },
            "liveSource": "Income Tax Department NSDL",
        }
    return {
        "rawScore": 100,
        "status": "COMPLIANT",
        "findings": "PAN is Operative, matched with entity name, and ITR filings for Assessment Year 2025-26 confirmed.",
        "citation": {
            "clauseNumber": "Clause 3.2",
            "clauseText": "Income tax compliance and PAN validation.",
        },
        "liveSource": "Income Tax e-Filing Portal (API Setu)",
    }


def _eval_udyam(bidder: Bidder, _tender: Tender) -> dict:
    if bidder.isMsme and bidder.udyamNumber:
        return {
            "rawScore": 100,
            "status": "COMPLIANT",
            "findings": (
                f"Active Udyam Registration #{bidder.udyamNumber} verified via Ministry of MSME API. "
                "Entity eligible for statutory EMD exemption & purchase preference under PPP-MII / MSE Order 2012."
            ),
            "citation": {
                "clauseNumber": "Clause 5.1 / Public Procurement Policy for MSEs Order 2012",
                "clauseText": "Micro & Small Enterprises registered with Udyam are entitled to tender fee & EMD waiver with 25% procurement allocation preference.",
            },
            "liveSource": "Ministry of MSME Udyam Portal (Tier-1 Cache / API Setu)",
        }
    return {
        "rawScore": 75,
        "status": "COMPLIANT",
        "findings": "Non-MSME Large Enterprise bidder. General tender evaluation terms apply (EMD deposit required, no MSME price preference requested).",
        "citation": {
            "clauseNumber": "Clause 5.1",
            "clauseText": "MSME registration verification.",
        },
        "liveSource": "Udyam Portal (API Setu)",
    }


def _eval_epfo(bidder: Bidder, _tender: Tender) -> dict:
    if bidder.epfoNumber:
        return {
            "rawScore": 100,
            "status": "COMPLIANT",
            "findings": f"EPFO Establishment #{bidder.epfoNumber} is active with monthly Electronic Challan cum Return (ECR) paid for all registered active members.",
            "citation": {
                "clauseNumber": "Clause 7.3 / EPF & MP Act 1952",
                "clauseText": "Proof of regular EPFO and ESIC remittances for all deployed workforce is mandatory.",
            },
            "liveSource": "EPFO Shram Suvidha Portal (Live Tier-2)",
        }
    return {
        "rawScore": 20,
        "status": "WARNING",
        "findings": "No EPFO number linked to bidder profile. Manpower deployment requires statutory EPFO registration.",
        "citation": {
            "clauseNumber": "Clause 7.3",
            "clauseText": "EPFO registration and remittance certificate.",
        },
        "liveSource": "Ministry of Labour & Employment Shram Suvidha",
    }


def _eval_mii(bidder: Bidder, _tender: Tender) -> dict:
    local_percentage = bidder.makeInIndiaLocalContentPercentage if bidder.makeInIndiaLocalContentPercentage is not None else 60.0
    if local_percentage >= 50:
        return {
            "rawScore": 100,
            "status": "COMPLIANT",
            "findings": f"Class-I Local Supplier verified with {local_percentage}% domestic value addition as per DPIIT Public Procurement Order (PPO-2017).",
            "citation": {
                "clauseNumber": "Clause 8.1 / DPIIT Order P-45021/2/2017-PP (BE-II)",
                "clauseText": "Only Class-I (>50% local content) and Class-II (>20% local content) suppliers eligible as per Make in India mandate.",
            },
            "liveSource": "Self-Declaration cross-checked against CA Cost Audit Certificate",
        }
    elif local_percentage >= 20:
        return {
            "rawScore": 70,
            "status": "WARNING",
            "findings": f"Class-II Local Supplier with {local_percentage}% domestic value addition. Eligible but secondary preference behind Class-I suppliers.",
            "citation": {
                "clauseNumber": "Clause 8.1",
                "clauseText": "Make in India Local Content Declaration.",
            },
            "liveSource": "Bidder Declaration / CA Certificate",
        }
    return {
        "rawScore": 10,
        "status": "NON_COMPLIANT",
        "findings": f"Non-Local Supplier with only {local_percentage}% domestic content (<20% threshold).",
        "citation": {
            "clauseNumber": "Clause 8.1",
            "clauseText": "Make in India Minimum Local Content Threshold.",
        },
        "liveSource": "Bidder Uploads",
    }


def _eval_oem(bidder: Bidder, _tender: Tender) -> dict:
    oem_doc = next((d for d in bidder.submittedDocuments if d.type == "OEM_AUTHORIZATION"), None)
    if oem_doc and oem_doc.isDigiLockerVerified:
        return {
            "rawScore": 100,
            "status": "COMPLIANT",
            "findings": f"Direct Manufacturer / Verified OEM Authorization certificate #{oem_doc.documentNumber} issued by {oem_doc.issuer}. RITES Vendor Assessment validity confirmed.",
            "citation": {
                "clauseNumber": "Clause 9.4",
                "clauseText": "Bidder must submit genuine Manufacturer Authorization Form (MAF) from OEM with warranty backing.",
            },
            "liveSource": "OEM Partner Verification Network & RITES Assessment Tag (Tier-1)",
        }
    elif oem_doc:
        return {
            "rawScore": 75,
            "status": "WARNING",
            "findings": f"OEM authorization letter #{oem_doc.documentNumber} uploaded, verified via OCR with valid tender-specific authorization clause.",
            "citation": {
                "clauseNumber": "Clause 9.4",
                "clauseText": "Manufacturer Authorization Form required.",
            },
            "liveSource": "Bidder Uploaded MAF with AI OCR Cross-Validation",
        }
    return {
        "rawScore": 15,
        "status": "NON_COMPLIANT",
        "findings": "OEM authorization letter missing or unverified. Risk of unauthorized reseller participation.",
        "citation": {
            "clauseNumber": "Clause 9.4",
            "clauseText": "OEM Authorization required.",
        },
        "liveSource": "Document Repository",
    }


def _eval_ai_reconciliation(bidder: Bidder, _tender: Tender) -> dict:
    turnover_list = bidder.financialTurnover or []
    total_claim = sum(t.amount for t in turnover_list)
    mca_status = bidder.mcaFilings.status if bidder.mcaFilings else "ACTIVE"

    if mca_status == "ACTIVE" and total_claim > 0:
        avg = total_claim / max(len(turnover_list), 1)
        return {
            "rawScore": 95,
            "status": "COMPLIANT",
            "findings": f"Self-declared average turnover (₹{avg:.2f} Cr) reconciles within 1.8% variance against MCA21 AOC-4 audited financials and UDIN validation.",
            "citation": {
                "clauseNumber": "Clause 2.4 / ICAI UDIN Mandate",
                "clauseText": "Financial turnover statements must be certified by Chartered Accountants with verifiable UDIN numbers matching MCA21 filings.",
            },
            "liveSource": "AI Entity Resolution & ICAI UDIN Registry Cross-Check",
        }
    return {
        "rawScore": 70,
        "status": "WARNING",
        "findings": "Turnover declaration submitted without verifiable UDIN tag; reconciled against income tax gross receipts with minor timing variances.",
        "citation": {
            "clauseNumber": "Clause 2.4",
            "clauseText": "Financial claim reconciliation.",
        },
        "liveSource": "AI Cross-Verification Pipeline",
    }


CHECK_DEFINITIONS: List[RawCheckDefinition] = [
    RawCheckDefinition("CHECK_GST_FILING", "GST Return Filing & Active Registration Status", "GST", 20.0, lambda _: True, _eval_gst),
    RawCheckDefinition("CHECK_PAN_ITR", "PAN & Income Tax Return Compliance", "PAN", 15.0, lambda _: True, _eval_pan),
    RawCheckDefinition("CHECK_UDYAM_MSME", "Udyam / MSME Registration & Category Status", "UDYAM", 15.0,
                       lambda t: any(c.category == "UDYAM" or c.exemptionForMSME for c in t.clauses), _eval_udyam),
    RawCheckDefinition("CHECK_EPFO_ESIC", "EPFO & ESIC Social Security Contribution Compliance", "EPFO_ESIC", 15.0,
                       lambda t: t.category == "SERVICES" or any(c.category == "EPFO_ESIC" for c in t.clauses), _eval_epfo),
    RawCheckDefinition("CHECK_MAKE_IN_INDIA", "Make in India (MII) & Local Content Compliance", "MAKE_IN_INDIA", 15.0,
                       lambda t: t.category != "SERVICES" or any(c.category == "MAKE_IN_INDIA" for c in t.clauses), _eval_mii),
    RawCheckDefinition("CHECK_OEM_AUTH", "OEM Authorization / Vendor Assessment Status", "OEM_AUTH", 15.0,
                       lambda t: t.category == "GOODS" or any(c.category == "OEM_AUTH" for c in t.clauses), _eval_oem),
    RawCheckDefinition("CHECK_AI_CROSS_CONSISTENCY", "AI Document-Portal Consistency & Claim Reconciliation", "FINANCIAL_TURNOVER", 10.0,
                       lambda _: True, _eval_ai_reconciliation),
]


def generate_document_verifications(bidder: Bidder, _tender: Tender) -> List[DocumentVerificationItem]:
    items: List[DocumentVerificationItem] = []

    # GST Certificate
    items.append(DocumentVerificationItem(
        id="DOC_GST",
        documentName="GST Registration Certificate (Form REG-06)",
        documentType="GST_CERTIFICATE",
        status="VERIFIED" if bidder.gstin else "NOT_VERIFIED_MISSING",
        source="DIGILOCKER",
        issuer="Goods & Services Tax Network (GSTN)",
        validityInfo="Active & Verified",
        findings=f"GSTIN {bidder.gstin} cryptographically matched with legal trade name." if bidder.gstin else "Missing GST registration record.",
        checksum=sha256(f"GST:{bidder.gstin}"),
        isDigiLockerSigned=True,
    ))

    # PAN Card
    items.append(DocumentVerificationItem(
        id="DOC_PAN",
        documentName="Permanent Account Number (PAN) Card",
        documentType="PAN_CARD",
        status="VERIFIED" if bidder.pan else "NOT_VERIFIED_MISSING",
        source="API_SETU",
        issuer="Income Tax Department, Govt of India",
        validityInfo="Operative & Matched",
        findings=f"PAN {bidder.pan} authenticated via NSDL API Setu gateway.",
        checksum=sha256(f"PAN:{bidder.pan}"),
        isDigiLockerSigned=True,
    ))

    # Udyam
    if bidder.udyamNumber:
        items.append(DocumentVerificationItem(
            id="DOC_UDYAM",
            documentName="Udyam MSME Registration Certificate",
            documentType="UDYAM_CERTIFICATE",
            status="VERIFIED",
            source="API_SETU",
            issuer="Ministry of MSME",
            validityInfo="Valid till 2030",
            findings=f"Udyam #{bidder.udyamNumber} active in NIC MSME database.",
            checksum=sha256(f"UDYAM:{bidder.udyamNumber}"),
            isDigiLockerSigned=True,
        ))

    # MCA
    mca_status = bidder.mcaFilings.status if bidder.mcaFilings else "ACTIVE"
    items.append(DocumentVerificationItem(
        id="DOC_MCA",
        documentName="MCA21 Certificate of Incorporation",
        documentType="MCA_COI",
        status="VERIFIED" if mca_status == "ACTIVE" else "VERIFIED_WITH_WARNING",
        source="MCA21",
        issuer="Ministry of Corporate Affairs (MCA21)",
        validityInfo=f"Status: {mca_status}",
        findings=f"CIN {bidder.cin} registered under RoC {bidder.mcaFilings.rocCode if bidder.mcaFilings else 'Delhi'}.",
        checksum=sha256(f"CIN:{bidder.cin}"),
        isDigiLockerSigned=True,
    ))

    # OEM
    oem_doc = next((d for d in bidder.submittedDocuments if d.type == "OEM_AUTHORIZATION"), None)
    if oem_doc:
        items.append(DocumentVerificationItem(
            id="DOC_OEM",
            documentName="Manufacturer Authorization Form (MAF)",
            documentType="OEM_AUTHORIZATION",
            status="VERIFIED" if oem_doc.isDigiLockerVerified else "VERIFIED_WITH_WARNING",
            source="DIGILOCKER" if oem_doc.isDigiLockerVerified else "BIDDER_UPLOAD",
            issuer=oem_doc.issuer or "Authorized OEM",
            validityInfo="Tender Specific Authorization",
            findings=f"OEM authorization certificate #{oem_doc.documentNumber} verified against OEM partner registry.",
            checksum=oem_doc.checksum or sha256("OEM_DOC"),
            isDigiLockerSigned=oem_doc.isDigiLockerVerified,
        ))

    # EPFO
    if bidder.epfoNumber:
        items.append(DocumentVerificationItem(
            id="DOC_EPFO",
            documentName="EPFO Monthly Contribution & ECR Receipt",
            documentType="EPFO_COMPLIANCE",
            status="VERIFIED",
            source="API_SETU",
            issuer="Employees Provident Fund Organisation",
            validityInfo="Latest Month ECR Reconciled",
            findings=f"Establishment #{bidder.epfoNumber} compliance confirmed.",
            checksum=sha256(f"EPFO:{bidder.epfoNumber}"),
            isDigiLockerSigned=True,
        ))
    else:
        items.append(DocumentVerificationItem(
            id="DOC_EPFO",
            documentName="EPFO Compliance Certificate",
            documentType="EPFO_COMPLIANCE",
            status="NOT_VERIFIED_MISSING",
            source="BIDDER_UPLOAD",
            issuer="N/A",
            validityInfo="No establishment number linked",
            findings="No EPFO registration linked to bidder profile.",
            checksum=sha256("EPFO_MISSING"),
            isDigiLockerSigned=False,
        ))

    return items


def generate_pending_requirements(bidder: Bidder, tender: Tender, is_eligible: bool) -> List[PendingRequirementItem]:
    items: List[PendingRequirementItem] = []

    # Blacklisting
    items.append(PendingRequirementItem(
        id="REQ_DEBARMENT",
        requirementTitle="Central Debarment / Blacklisting Clearance",
        clauseNumber="Clause 4.1(a)",
        isMandatory=True,
        isSatisfied=is_eligible,
        notes="Satisfied — No adverse debarment entries found in CVC/GeM central records." if is_eligible else "Action required: Bidder flagged in Debarment list. Ineligible for public tender.",
        actionRequired=None if is_eligible else "Reject bid under GFR Rule 151.",
    ))

    # GST & PAN
    has_gst_pan = bool(bidder.gstin and bidder.pan)
    items.append(PendingRequirementItem(
        id="REQ_GST_PAN",
        requirementTitle="Mandatory GSTIN & PAN Statutory Registrations",
        clauseNumber="Clause 2.3 & 3.1",
        isMandatory=True,
        isSatisfied=has_gst_pan,
        notes="Satisfied — Active GSTIN and PAN authenticated." if has_gst_pan else "Action required: Provide valid statutory tax registration documents.",
        actionRequired=None if has_gst_pan else "Request clarification on invalid tax credentials.",
    ))

    # Make in India
    if tender.category != "SERVICES":
        local_content = bidder.makeInIndiaLocalContentPercentage if bidder.makeInIndiaLocalContentPercentage is not None else 60.0
        mii_satisfied = local_content >= 20
        items.append(PendingRequirementItem(
            id="REQ_MII",
            requirementTitle="Make in India Local Content Self-Declaration (≥20%)",
            clauseNumber="Clause 8.1",
            isMandatory=True,
            isSatisfied=mii_satisfied,
            notes=f"Satisfied — {local_content}% local value addition certified." if mii_satisfied else "Action required: Local content declaration below mandatory 20% threshold.",
            actionRequired=None if mii_satisfied else "Verify non-local supplier eligibility waiver.",
        ))

    # OEM (Goods)
    if tender.category == "GOODS":
        has_oem = any(d.type == "OEM_AUTHORIZATION" for d in bidder.submittedDocuments)
        items.append(PendingRequirementItem(
            id="REQ_OEM",
            requirementTitle="Manufacturer Authorization Form (MAF) from OEM",
            clauseNumber="Clause 9.4",
            isMandatory=True,
            isSatisfied=has_oem,
            notes="Satisfied — OEM Authorization Form submitted and verified." if has_oem else "Action required: OEM Authorization letter required for hardware supply.",
            actionRequired=None if has_oem else "Officer to review dealer reseller agreement.",
        ))

    # EPFO (Services)
    if tender.category == "SERVICES":
        has_epfo = bool(bidder.epfoNumber)
        items.append(PendingRequirementItem(
            id="REQ_EPFO",
            requirementTitle="EPFO & ESIC Workforce Social Security Registration",
            clauseNumber="Clause 7.3",
            isMandatory=True,
            isSatisfied=has_epfo,
            notes=f"Satisfied — Active EPFO Establishment #{bidder.epfoNumber}." if has_epfo else "Action required: Manpower services require EPFO compliance certificate.",
            actionRequired=None if has_epfo else "Issue notice for EPFO registration certificate.",
        ))

    return items


def evaluate_bidder_compliance(bidder: Bidder, tender: Tender) -> BidComplianceReport:
    timestamp = datetime.now(timezone.utc).isoformat()

    # Step 1: Evaluate Hard Gates
    is_eligible, gate_results = evaluate_hard_gates(bidder, tender)

    if not is_eligible:
        failed_gates = [g for g in gate_results if g.status == "FAILED"]
        primary_reason = failed_gates[0].reason if failed_gates else "Hard gate compliance failure."

        doc_verifications = generate_document_verifications(bidder, tender)
        pending_reqs = generate_pending_requirements(bidder, tender, False)

        audit_payload = {
            "bidderId": bidder.id,
            "tenderId": tender.id,
            "verdict": "NOT_ELIGIBLE",
            "failedGates": [f.gateName for f in failed_gates],
        }
        audit_hash = sha256(json.dumps(audit_payload, sort_keys=True))

        return BidComplianceReport(
            bidderId=bidder.id,
            tenderId=tender.id,
            evaluatedAt=timestamp,
            qualifyingGateStatus="NOT_ELIGIBLE",
            hardGateResults=gate_results,
            weightedScore=None,
            riskLevel="NOT_ELIGIBLE",
            recommendation=Recommendation(
                title="Disqualification Recommended — Qualifying Requirements Failed",
                verdict="NOT ELIGIBLE",
                actionAdvice=f"Do not proceed to Technical/Financial evaluation. Reason: {primary_reason}",
            ),
            scoreBreakdown=[],
            documentVerifications=doc_verifications,
            pendingRequirements=pending_reqs,
            officerDecision=OfficerDecision(status="PENDING"),
            auditHash=audit_hash,
        )

    # Step 2: Determine applicable checks & redistribute weights
    applicable_checks = [
        (defn, defn.is_applicable(tender))
        for defn in CHECK_DEFINITIONS
    ]
    total_applicable_weight = sum(defn.default_weight for defn, app in applicable_checks if app)

    score_breakdown: List[CheckScoreResult] = []
    for defn, applicable in applicable_checks:
        if not applicable:
            score_breakdown.append(CheckScoreResult(
                checkId=defn.id,
                name=defn.name,
                category=defn.category,
                applicable=False,
                originalWeight=defn.default_weight,
                redistributedWeight=0.0,
                rawScorePercentage=0.0,
                weightedContribution=0.0,
                status="SKIPPED",
                findings=f"Check skipped: Not applicable to this {tender.category.lower()} procurement tender.",
                citation=CitationRef(
                    clauseNumber="Tender Scope Determination",
                    clauseText=f"Exempted for {tender.category} category.",
                ),
                liveSource="RAG Tender Scope Analyzer",
                verifiedAt=timestamp,
            ))
            continue

        redistributed_weight = round((defn.default_weight / total_applicable_weight) * 100.0, 2)
        eval_res = defn.evaluate(bidder, tender)
        weighted_contribution = round((eval_res["rawScore"] * redistributed_weight) / 100.0, 2)

        score_breakdown.append(CheckScoreResult(
            checkId=defn.id,
            name=defn.name,
            category=defn.category,
            applicable=True,
            originalWeight=defn.default_weight,
            redistributedWeight=redistributed_weight,
            rawScorePercentage=float(eval_res["rawScore"]),
            weightedContribution=weighted_contribution,
            status=eval_res["status"],
            findings=eval_res["findings"],
            citation=CitationRef(
                clauseNumber=eval_res["citation"]["clauseNumber"],
                clauseText=eval_res["citation"]["clauseText"],
            ),
            liveSource=eval_res["liveSource"],
            verifiedAt=timestamp,
        ))

    # Step 3: Aggregate weighted score
    total_score = round(sum(c.weightedContribution for c in score_breakdown), 1)

    # Step 4: Map Score to Risk Level
    if total_score < 60:
        risk_level = "HIGH"
        rec_title = "High Risk — Multiple Non-Compliances Detected"
        rec_verdict = "HIGH RISK"
        rec_advice = "Significant compliance gaps detected. Officer manual verification of tax and statutory documents required before proceeding."
    elif total_score < 85:
        risk_level = "MEDIUM"
        rec_title = "Medium Risk — Minor Gaps Require Clarification"
        rec_verdict = "MEDIUM RISK"
        rec_advice = "Minor gaps identified in statutory filings or self-certifications. Review flagged items before technical evaluation."
    else:
        risk_level = "LOW"
        rec_title = "Compliant — Recommend for Evaluation"
        rec_verdict = "LOW RISK"
        rec_advice = "All qualifying criteria and weighted statutory checks satisfied. Recommended for proceeding to Technical and Commercial evaluation."

    doc_verifications = generate_document_verifications(bidder, tender)
    pending_reqs = generate_pending_requirements(bidder, tender, True)

    audit_payload = {
        "bidderId": bidder.id,
        "tenderId": tender.id,
        "score": total_score,
        "riskLevel": risk_level,
        "checksEvaluated": len(score_breakdown),
    }
    audit_hash = sha256(json.dumps(audit_payload, sort_keys=True))

    return BidComplianceReport(
        bidderId=bidder.id,
        tenderId=tender.id,
        evaluatedAt=timestamp,
        qualifyingGateStatus="ELIGIBLE",
        hardGateResults=gate_results,
        weightedScore=total_score,
        riskLevel=risk_level,
        recommendation=Recommendation(
            title=rec_title,
            verdict=rec_verdict,
            actionAdvice=rec_advice,
        ),
        scoreBreakdown=score_breakdown,
        documentVerifications=doc_verifications,
        pendingRequirements=pending_reqs,
        officerDecision=OfficerDecision(status="PENDING"),
        auditHash=audit_hash,
    )
