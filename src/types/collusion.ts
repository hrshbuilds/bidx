export type CollusionSignalType =
  | 'SHARED_DIN'
  | 'SHARED_ADDRESS'
  | 'TIGHT_INCORPORATION'
  | 'SHARED_AUDITOR'
  | 'DOCUMENT_SIMILARITY';

export type CollusionSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CollusionSignal {
  id: string;
  type: CollusionSignalType;
  title: string;
  severity: CollusionSeverity;
  description: string;
  entitiesInvolved: {
    bidderIds: string[];
    bidderNames: string[];
    sharedEntityValue: string;
  };
  evidenceSnippet: string;
  detectionRule: string;
}

export interface CollusionCluster {
  id: string;
  title: string;
  severity: CollusionSeverity;
  bidders: {
    id: string;
    name: string;
    cin: string;
  }[];
  signals: CollusionSignal[];
  summaryExplanation: string;
  recommendationForOfficer: string;
}

export type NodeType = 'BIDDER' | 'DIRECTOR' | 'ADDRESS' | 'AUDITOR' | 'DOCUMENT';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  subType?: string;
  data?: Record<string, any>;
  clusterId?: string;
  x?: number;
  y?: number;
}

export type EdgeType =
  | 'HAS_DIRECTOR'
  | 'REGISTERED_AT'
  | 'AUDITED_BY'
  | 'SUBMITTED_DOC'
  | 'TEXT_SIMILARITY';

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: EdgeType;
  weight?: number;
  severity?: CollusionSeverity;
}

export interface TenderIntegrityReport {
  tenderId: string;
  evaluatedAt: string;
  totalBiddersAnalyzed: number;
  overallRisk: 'CLEAR' | 'MEDIUM_INVESTIGATION' | 'HIGH_INVESTIGATION';
  summary: string;
  clusters: CollusionCluster[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}
