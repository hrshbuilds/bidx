"""
Pydantic models (schemas) for BidFlo backend.
Mirrors the TypeScript types in src/types/.
"""
from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Registry / Bidder level types
# ---------------------------------------------------------------------------

class Director(BaseModel):
    din: str
    name: str
    pan: str
    appointmentDate: str


class McaFilings(BaseModel):
    cin: str
    companyName: str
    status: Literal["ACTIVE", "STRUCK_OFF", "UNDER_LIQUIDATION", "DORMANT"]
    rocCode: str
    registrationNumber: str
    category: str
    lastAgmDate: str
    balanceSheetDate: str
    statutoryAuditor: str
    registeredAddress: str


class TurnoverRecord(BaseModel):
    financialYear: str
    amount: float      # in INR crores
    auditedBy: str
    udinNumber: str


class SubmittedDocument(BaseModel):
    id: str
    type: str
    title: str
    documentNumber: str
    source: Literal["DIGILOCKER", "API_SETU", "MCA21", "BIDDER_UPLOAD"]
    isDigiLockerVerified: bool
    issuer: str
    issuedDate: str
    expiryDate: Optional[str] = None
    checksum: str
    extractedData: Dict[str, Any] = Field(default_factory=dict)


class ConsentToken(BaseModel):
    tokenId: str
    bidderId: str
    tenderId: str
    timestamp: str
    ipAddress: str
    consentedScopes: List[str]
    signature: str


class Bidder(BaseModel):
    id: str
    tenderId: str
    name: str
    tradeName: str
    cin: str
    pan: str
    gstin: str
    udyamNumber: Optional[str] = None
    epfoNumber: Optional[str] = None
    esicNumber: Optional[str] = None
    isMsme: bool = False
    isStartup: bool = False
    incorporationDate: str
    registeredAddress: str
    statutoryAuditor: str
    directors: List[Director] = Field(default_factory=list)
    mcaFilings: McaFilings
    financialTurnover: List[TurnoverRecord] = Field(default_factory=list)
    submittedDocuments: List[SubmittedDocument] = Field(default_factory=list)
    consentToken: ConsentToken
    bidSubmissionDate: str
    bidAmount: float
    technicalProposalText: Optional[str] = None
    makeInIndiaLocalContentPercentage: Optional[float] = None


# ---------------------------------------------------------------------------
# Tender types
# ---------------------------------------------------------------------------

class TenderClause(BaseModel):
    id: str
    clauseNumber: str
    title: str
    text: str
    type: Literal["HARD_GATE", "WEIGHTED_CHECK"]
    category: str
    defaultWeight: float
    isMandatory: bool
    applicableInCategories: List[str]
    exemptionForMSME: bool = False
    exemptionForStartup: bool = False


class TenderAuthority(BaseModel):
    name: str
    department: str
    location: str


class Tender(BaseModel):
    id: str
    tenderNumber: str
    title: str
    category: Literal["GOODS", "SERVICES", "WORKS"]
    estimatedValue: float
    publishedDate: str
    closingDate: str
    authority: TenderAuthority
    description: str
    requiredDocuments: List[str] = Field(default_factory=list)
    clauses: List[TenderClause] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Compliance output types
# ---------------------------------------------------------------------------

class CitationRef(BaseModel):
    clauseNumber: str
    clauseText: str
    statutoryAct: Optional[str] = None


class GateEvidence(BaseModel):
    testedValue: str
    expectedValue: str
    source: str


class GateEvaluationResult(BaseModel):
    gateId: str
    gateName: str
    category: str
    status: Literal["PASSED", "FAILED", "SKIPPED"]
    severity: Literal["FATAL", "WARNING"]
    reason: str
    citation: CitationRef
    evidence: GateEvidence


class CheckScoreResult(BaseModel):
    checkId: str
    name: str
    category: str
    applicable: bool
    originalWeight: float
    redistributedWeight: float
    rawScorePercentage: float
    weightedContribution: float
    status: Literal["COMPLIANT", "WARNING", "NON_COMPLIANT", "SKIPPED"]
    findings: str
    citation: CitationRef
    liveSource: str
    verifiedAt: str


class DocumentVerificationItem(BaseModel):
    id: str
    documentName: str
    documentType: str
    status: Literal["VERIFIED", "VERIFIED_WITH_WARNING", "NOT_VERIFIED_MISSING", "PENDING_PROCESSING"]
    source: str
    issuer: str
    validityInfo: str
    findings: str
    checksum: str
    isDigiLockerSigned: bool


class PendingRequirementItem(BaseModel):
    id: str
    requirementTitle: str
    clauseNumber: str
    isMandatory: bool
    isSatisfied: bool
    notes: str
    actionRequired: Optional[str] = None


class OfficerDecision(BaseModel):
    status: Literal["PENDING", "ACCEPTED", "OVERRIDDEN"]
    decisionDate: Optional[str] = None
    officerName: Optional[str] = None
    officerId: Optional[str] = None
    overrideReason: Optional[str] = None


class Recommendation(BaseModel):
    title: str
    verdict: str
    actionAdvice: str


class BidComplianceReport(BaseModel):
    bidderId: str
    tenderId: str
    evaluatedAt: str
    qualifyingGateStatus: Literal["ELIGIBLE", "NOT_ELIGIBLE"]
    hardGateResults: List[GateEvaluationResult]
    weightedScore: Optional[float]
    riskLevel: Literal["LOW", "MEDIUM", "HIGH", "NOT_ELIGIBLE"]
    recommendation: Recommendation
    scoreBreakdown: List[CheckScoreResult]
    documentVerifications: List[DocumentVerificationItem]
    pendingRequirements: List[PendingRequirementItem]
    officerDecision: OfficerDecision
    auditHash: str


# ---------------------------------------------------------------------------
# Collusion / Knowledge Graph types
# ---------------------------------------------------------------------------

class CollusionSignal(BaseModel):
    id: str
    type: Literal["SHARED_DIN", "SHARED_ADDRESS", "TIGHT_INCORPORATION", "SHARED_AUDITOR", "DOCUMENT_SIMILARITY"]
    title: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    description: str
    entitiesInvolved: Dict[str, Any]
    evidenceSnippet: str
    detectionRule: str


class CollusionCluster(BaseModel):
    id: str
    title: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    bidders: List[Dict[str, str]]
    signals: List[CollusionSignal]
    summaryExplanation: str
    recommendationForOfficer: str


class GraphNode(BaseModel):
    id: str
    label: str
    type: Literal["BIDDER", "DIRECTOR", "ADDRESS", "AUDITOR", "DOCUMENT"]
    subType: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    clusterId: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    type: str
    weight: Optional[float] = None
    severity: Optional[str] = None


class TenderIntegrityReport(BaseModel):
    tenderId: str
    evaluatedAt: str
    totalBiddersAnalyzed: int
    overallRisk: Literal["CLEAR", "MEDIUM_INVESTIGATION", "HIGH_INVESTIGATION"]
    summary: str
    clusters: List[CollusionCluster]
    graph: Dict[str, List]


# ---------------------------------------------------------------------------
# Audit types
# ---------------------------------------------------------------------------

class AuditLogBlock(BaseModel):
    index: int
    timestamp: str
    tenderId: str
    bidderId: Optional[str] = None
    eventType: str
    actor: str
    payload: Dict[str, Any]
    previousHash: str
    currentHash: str
    signature: Optional[str] = None


class AuditChainVerification(BaseModel):
    isValid: bool
    totalBlocks: int
    brokenBlockIndex: Optional[int] = None
    verificationMessage: str
    verifiedAt: str
    rootHash: str
    headHash: str


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------

class VerifyRequest(BaseModel):
    bidder: Bidder
    tender: Tender


class CollusionRequest(BaseModel):
    tenderId: str
    bidders: List[Bidder]


class OfficerDecisionRequest(BaseModel):
    bidderId: str
    tenderId: str
    decision: Literal["ACCEPTED", "OVERRIDDEN"]
    officerName: str
    officerId: str
    overrideReason: Optional[str] = None
