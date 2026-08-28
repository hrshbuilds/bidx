export type TenderCategory = 'GOODS' | 'SERVICES' | 'WORKS';

export type ClauseType = 'HARD_GATE' | 'WEIGHTED_CHECK';

export type CheckCategory =
  | 'DEBARMENT'
  | 'GST'
  | 'PAN'
  | 'UDYAM'
  | 'EPFO_ESIC'
  | 'MAKE_IN_INDIA'
  | 'OEM_AUTH'
  | 'FINANCIAL_TURNOVER'
  | 'PAST_EXPERIENCE'
  | 'MCA21_STATUS';

export interface TenderClause {
  id: string;
  clauseNumber: string;
  title: string;
  text: string;
  type: ClauseType;
  category: CheckCategory;
  defaultWeight: number;
  isMandatory: boolean;
  applicableInCategories: TenderCategory[];
  exemptionForMSME?: boolean;
  exemptionForStartup?: boolean;
}

export interface Tender {
  id: string;
  tenderNumber: string;
  title: string;
  category: TenderCategory;
  estimatedValue: number; // in INR
  publishedDate: string;
  closingDate: string;
  authority: {
    name: string;
    department: string;
    location: string;
  };
  description: string;
  requiredDocuments: string[];
  clauses: TenderClause[];
}
