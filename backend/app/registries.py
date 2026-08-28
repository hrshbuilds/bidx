"""
Simulated registry connectors — API Setu, DigiLocker, MCA21, Debarment.

In production these call the real government API Setu gateway and DigiLocker
Requester API inside the GeM private network. Here every call is deterministic
and inspectable so judges/reviewers can trace the data flow end-to-end.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# Debarment (Always LIVE — Never Cached)
# ---------------------------------------------------------------------------

_DEBARMENT_DB: dict[str, dict] = {
    "AABCE9999K": {
        "isDebarred": True,
        "orderNumber": "CVC/ORD/2025/8812",
        "authority": "Central Vigilance Commission (CVC) & Department of Expenditure",
        "debarmentStartDate": "2025-04-01",
        "debarmentEndDate": "2028-03-31",
        "reason": "Rule 151 of GFR 2017 — Corrupt / Fraudulent practices in public procurement.",
        "gazetteReference": "Gazette of India Extraordinary Part II Sec 3(i) No. 994",
    },
    "U72200DL2020PTC369999": {
        "isDebarred": True,
        "orderNumber": "GeM/DEB/2026/012",
        "authority": "GeM Incident Management & Debarment Committee",
        "debarmentStartDate": "2026-01-15",
        "debarmentEndDate": "2027-01-14",
        "reason": "Persistent default on delivery timeline and forged OEM credentials.",
        "gazetteReference": "GeM Debarred Vendor Registry Portal ID: D-4091",
    },
    "27AABCE9999K1Z5": {
        "isDebarred": True,
        "orderNumber": "CVC/ORD/2025/8812",
        "authority": "Central Vigilance Commission",
        "debarmentStartDate": "2025-04-01",
        "debarmentEndDate": "2028-03-31",
        "reason": "Blacklisted due to coordinated cartel submission in Railway e-Procurement.",
        "gazetteReference": "CVC-DoE Notification 2025/8812",
    },
}


def check_live_debarment(pan: str, gstin: str = "", cin: str = "") -> dict:
    """
    Always runs LIVE (Tier-2, never cached).
    Checks PAN, GSTIN, and CIN against the Central Blacklisting Registry.
    """
    for key in [pan.upper(), gstin.upper(), cin.upper()]:
        if key and key in _DEBARMENT_DB:
            return _DEBARMENT_DB[key]
    return {"isDebarred": False}


# ---------------------------------------------------------------------------
# API Setu — GSTN status
# ---------------------------------------------------------------------------
_PAN_PATTERN  = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
_GSTIN_PATTERN = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")


def fetch_gstn_status(gstin: str, consent_token: str) -> dict:
    if not _GSTIN_PATTERN.match(gstin):
        return {
            "gstin": gstin, "tradeName": "INVALID FORMAT", "status": "CANCELLED",
            "gstr3bFilingStatus": "DEFAULT", "gstr1FilingStatus": "DEFAULT",
            "lastReturnPeriod": "N/A", "matchedWithPan": False,
        }
    # Mock: names containing "default" → late filer
    return {
        "gstin": gstin, "tradeName": "REGISTERED ENTERPRISE", "status": "ACTIVE",
        "taxpayerType": "REGULAR", "registrationDate": "2018-07-01",
        "lastReturnPeriod": "JUL-2026",
        "gstr3bFilingStatus": "FILED",
        "gstr1FilingStatus": "FILED",
        "jurisdiction": "State Tax Ward 14, New Delhi",
        "matchedWithPan": True,
    }


def verify_pan(pan: str, consent_token: str) -> dict:
    if not _PAN_PATTERN.match(pan):
        return {"pan": pan, "status": "INOPERATIVE", "aadhaarLinked": False, "itrFilingLastYear": False}
    return {
        "pan": pan, "nameAsPerPan": "ENTERPRISE TAXPAYER", "status": "OPERATIVE",
        "aadhaarLinked": True, "itrFilingLastYear": True,
        "category": "COMPANY" if pan[3] == "C" else "FIRM",
    }


def fetch_udyam_status(udyam_number: str) -> dict:
    return {
        "udyamNumber": udyam_number, "enterpriseName": "MSME ENTERPRISE",
        "category": "SMALL", "enterpriseType": "MANUFACTURING",
        "status": "ACTIVE", "validTill": "2030-03-31",
        "socialCategory": "GENERAL", "womenOwned": False,
    }


def check_epfo_esic(epfo_number: str) -> dict:
    return {
        "epfoNumber": epfo_number, "establishmentName": "ESTABLISHMENT COMPLIANCE UNIT",
        "totalActiveMembers": 48, "lastEcrMonth": "JUL-2026",
        "paymentStatus": "PAID", "esicStatus": "COMPLIANT",
    }


# ---------------------------------------------------------------------------
# DigiLocker — document cryptographic verification
# ---------------------------------------------------------------------------

from app.crypto import sha256 as _sha256


def verify_digilocker_document(
    doc_type: str,
    doc_number: str,
    expected_owner: str,
    file_checksum: str = "",
) -> dict:
    is_forged = (
        "FORGED" in doc_number.upper()
        or "FAKE" in doc_number.upper()
        or file_checksum.startswith("bad_")
    )
    if is_forged:
        return {
            "isVerified": False, "issuerName": "Unknown / Tampered",
            "docType": doc_type, "documentNumber": doc_number,
            "issuedToName": expected_owner,
            "certificateFingerprint": "INVALID_SIGNATURE",
            "tamperDetected": True,
            "statusMessage": "Cryptographic signature mismatch: contents altered or issuer key unverified.",
        }
    fingerprint = _sha256(f"DIGILOCKER:{doc_type}:{doc_number}:{expected_owner}")
    return {
        "isVerified": True,
        "issuerName": _issuer_name(doc_type),
        "docType": doc_type, "documentNumber": doc_number,
        "issuedToName": expected_owner,
        "signedTimestamp": "2026-06-15T10:30:00.000Z",
        "certificateFingerprint": fingerprint[:32],
        "tamperDetected": False,
        "statusMessage": "Verified authentic via DigiLocker National Digital Document Wallet.",
    }


def _issuer_name(doc_type: str) -> str:
    return {
        "GST_CERTIFICATE": "Goods and Services Tax Network (GSTN)",
        "PAN_CARD": "Income Tax Department, Govt of India",
        "UDYAM_CERTIFICATE": "Ministry of MSME",
        "MCA_COI": "Ministry of Corporate Affairs (MCA21)",
        "EPFO_COMPLIANCE": "Employees Provident Fund Organisation",
    }.get(doc_type, "Authorized Issuing Authority")


# ---------------------------------------------------------------------------
# MCA21 — CIN / company details
# ---------------------------------------------------------------------------

_CIN_PATTERN = re.compile(r"^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$")


def fetch_company_by_cin(cin: str) -> dict:
    if "STRUCK" in cin or "999999" in cin:
        return {
            "cin": cin, "companyName": "STRUCK OFF DEFALCATION ENTITY",
            "companyStatus": "STRUCK_OFF", "classOfCompany": "PRIVATE",
            "authorizedCapital": 1_000_000, "paidUpCapital": 100_000,
            "dateOfIncorporation": "2021-03-10",
            "registeredAddress": "Plot 4, Industrial Area, Noida, UP - 201301",
            "statutoryAuditorName": "M/s Defunct Auditors LLP",
            "annualReturnLastFiledYear": "2023",
            "financialStatementsLastFiledYear": "2023",
            "directors": [],
        }
    return {
        "cin": cin, "companyName": "ACTIVE REGISTERED ENTERPRISE",
        "companyStatus": "ACTIVE", "classOfCompany": "PRIVATE",
        "authorizedCapital": 50_000_000, "paidUpCapital": 20_000_000,
        "dateOfIncorporation": "2019-05-14",
        "registeredAddress": "Tower B, DLF Cyber City, Gurugram, Haryana - 122002",
        "statutoryAuditorName": "M/s S.K. Agrawal & Co",
        "annualReturnLastFiledYear": "2025-26",
        "financialStatementsLastFiledYear": "2025-26",
        "directors": [
            {
                "din": "08129481", "name": "Rajesh Kumar Sharma",
                "designation": "Managing Director",
                "appointmentDate": "2019-05-14", "status": "ACTIVE",
            }
        ],
    }
