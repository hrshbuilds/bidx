"""
Registry Connectors API router.
Direct endpoints to test individual registry connectors (Debarment, GSTN, PAN, Udyam, EPFO, MCA21, DigiLocker).
"""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.registries import (
    check_live_debarment,
    fetch_gstn_status,
    verify_pan,
    fetch_udyam_status,
    check_epfo_esic,
    fetch_company_by_cin,
    verify_digilocker_document,
)

router = APIRouter()


class DigiLockerDocVerifyRequest(BaseModel):
    docType: str
    docNumber: str
    expectedOwner: str
    fileChecksum: Optional[str] = ""


@router.get("/debarment/{identifier}")
def query_debarment_status(identifier: str):
    """
    Direct lookup into the Central Debarment / Blacklisting Database (Always LIVE).
    Pass PAN, GSTIN, or CIN.
    """
    res = check_live_debarment(pan=identifier, gstin=identifier, cin=identifier)
    return {"identifier": identifier, "result": res}


@router.get("/gstn/{gstin}")
def query_gstn(gstin: str, consentToken: str = Query("CONSENT-DEV-TOKEN")):
    """
    Direct lookup into API Setu GSTN Connector.
    """
    return fetch_gstn_status(gstin=gstin, consent_token=consentToken)


@router.get("/pan/{pan}")
def query_pan(pan: str, consentToken: str = Query("CONSENT-DEV-TOKEN")):
    """
    Direct lookup into Income Tax / NSDL Connector via API Setu.
    """
    return verify_pan(pan=pan, consent_token=consentToken)


@router.get("/udyam/{udyam_number}")
def query_udyam(udyam_number: str):
    """
    Direct lookup into Ministry of MSME Udyam Database.
    """
    return fetch_udyam_status(udyam_number=udyam_number)


@router.get("/epfo/{epfo_number}")
def query_epfo(epfo_number: str):
    """
    Direct lookup into EPFO / ESIC Shram Suvidha Portal.
    """
    return check_epfo_esic(epfo_number=epfo_number)


@router.get("/mca21/{cin}")
def query_mca21(cin: str):
    """
    Direct lookup into Ministry of Corporate Affairs (MCA21) Registry.
    """
    return fetch_company_by_cin(cin=cin)


@router.post("/digilocker/verify-doc")
def query_digilocker(request: DigiLockerDocVerifyRequest):
    """
    Cryptographically verifies a document against DigiLocker requester gateway.
    """
    return verify_digilocker_document(
        doc_type=request.docType,
        doc_number=request.docNumber,
        expected_owner=request.expectedOwner,
        file_checksum=request.fileChecksum or "",
    )
