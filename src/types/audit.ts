export type AuditEventType =
  | 'CONSENT_RECORDED'
  | 'GATE_EVALUATION'
  | 'API_FETCH_TIER1'
  | 'API_FETCH_TIER2'
  | 'AI_EXTRACTION'
  | 'SCORE_COMPUTED'
  | 'COLLUSION_ANALYSIS'
  | 'OFFICER_DECISION'
  | 'OFFICER_OVERRIDE';

export interface AuditLogBlock {
  index: number;
  timestamp: string;
  tenderId: string;
  bidderId?: string;
  eventType: AuditEventType;
  actor: string;
  payload: Record<string, any>;
  previousHash: string;
  currentHash: string;
  signature?: string;
}

export interface AuditChainVerification {
  isValid: boolean;
  totalBlocks: number;
  brokenBlockIndex?: number;
  verificationMessage: string;
  verifiedAt: string;
  rootHash: string;
  headHash: string;
}
