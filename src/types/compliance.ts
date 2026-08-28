import { CheckCategory } from './tender';
import { DocumentSource } from './bidder';

export type GateStatus = 'PASSED' | 'FAILED' | 'SKIPPED';
export type GateSeverity = 'FATAL' | 'WARNING';

export interface GateEvaluationResult {
  gateId: string;
  gateName: string;
  category: CheckCategory;
  status: GateStatus;
  severity: GateSeverity;
  reason: string;
  citation: {
    clauseNumber: string;
    clauseText: string;
    statutoryAct?: string;
  };
  evidence: {
    testedValue: string;
    expectedValue: string;
    source: string;
  };
}

export type CheckStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'SKIPPED';

export interface CheckScoreResult {
  checkId: string;
  name: string;
  category: CheckCategory;
  applicable: boolean;
  originalWeight: number;
  redistributedWeight: number;
  rawScorePercentage: number; // 0 to 100
  weightedContribution: number; // calculated as rawScorePercentage * redistributedWeight / 100
  status: CheckStatus;
  findings: string;
  citation: {
    clauseNumber: string;
    clauseText: string;
  };
  liveSource: string;
  verifiedAt: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'NOT_ELIGIBLE';

export type DocumentVerificationStatus =
  | 'VERIFIED'
  | 'VERIFIED_WITH_WARNING'
  | 'NOT_VERIFIED_MISSING'
  | 'PENDING_PROCESSING';

export interface DocumentVerificationItem {
  id: string;
  documentName: string;
  documentType: string;
  status: DocumentVerificationStatus;
  source: DocumentSource;
  issuer: string;
  validityInfo: string;
  findings: string;
  checksum: string;
  isDigiLockerSigned: boolean;
}

export interface PendingRequirementItem {
  id: string;
  requirementTitle: string;
  clauseNumber: string;
  isMandatory: boolean;
  isSatisfied: boolean;
  notes: string;
  actionRequired?: string;
}

export interface BidComplianceReport {
  bidderId: string;
  tenderId: string;
  evaluatedAt: string;
  qualifyingGateStatus: 'ELIGIBLE' | 'NOT_ELIGIBLE';
  hardGateResults: GateEvaluationResult[];
  weightedScore: number | null; // null if gate failed
  riskLevel: RiskLevel;
  recommendation: {
    title: string;
    verdict: string;
    actionAdvice: string;
  };
  scoreBreakdown: CheckScoreResult[];
  documentVerifications: DocumentVerificationItem[];
  pendingRequirements: PendingRequirementItem[];
  officerDecision?: {
    status: 'PENDING' | 'ACCEPTED' | 'OVERRIDDEN';
    decisionDate?: string;
    officerName?: string;
    officerId?: string;
    overrideReason?: string;
    signature?: string;
  };
  auditHash: string;
}
