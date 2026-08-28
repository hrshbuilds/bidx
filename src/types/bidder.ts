export interface Director {
  din: string;
  name: string;
  pan: string;
  appointmentDate: string;
}

export interface McaFilings {
  cin: string;
  companyName: string;
  status: 'ACTIVE' | 'STRUCK_OFF' | 'UNDER_LIQUIDATION' | 'DORMANT';
  rocCode: string;
  registrationNumber: string;
  category: string;
  lastAgmDate: string;
  balanceSheetDate: string;
  statutoryAuditor: string;
  registeredAddress: string;
}

export interface TurnoverRecord {
  financialYear: string;
  amount: number; // in INR Crores
  auditedBy: string;
  udinNumber: string;
}

export type DocumentType =
  | 'GST_CERTIFICATE'
  | 'PAN_CARD'
  | 'UDYAM_CERTIFICATE'
  | 'MCA_COI'
  | 'EPFO_COMPLIANCE'
  | 'ESIC_COMPLIANCE'
  | 'MAKE_IN_INDIA_DECLARATION'
  | 'OEM_AUTHORIZATION'
  | 'AUDITED_BALANCE_SHEET'
  | 'PAST_EXPERIENCE_CERTIFICATE';

export type DocumentSource = 'DIGILOCKER' | 'API_SETU' | 'MCA21' | 'BIDDER_UPLOAD';

export interface SubmittedDocument {
  id: string;
  type: DocumentType;
  title: string;
  documentNumber: string;
  source: DocumentSource;
  isDigiLockerVerified: boolean;
  issuer: string;
  issuedDate: string;
  expiryDate?: string;
  checksum: string;
  fileUrl?: string;
  extractedData?: Record<string, any>;
}

export interface ConsentToken {
  tokenId: string;
  bidderId: string;
  tenderId: string;
  timestamp: string;
  ipAddress: string;
  consentedScopes: string[];
  signature: string;
}

export interface Bidder {
  id: string;
  tenderId: string;
  name: string;
  tradeName: string;
  cin: string;
  pan: string;
  gstin: string;
  udyamNumber?: string;
  epfoNumber?: string;
  esicNumber?: string;
  isMsme: boolean;
  isStartup: boolean;
  incorporationDate: string;
  registeredAddress: string;
  statutoryAuditor: string;
  directors: Director[];
  mcaFilings: McaFilings;
  financialTurnover: TurnoverRecord[];
  submittedDocuments: SubmittedDocument[];
  consentToken: ConsentToken;
  bidSubmissionDate: string;
  bidAmount: number;
  technicalProposalText?: string;
  makeInIndiaLocalContentPercentage?: number;
}
