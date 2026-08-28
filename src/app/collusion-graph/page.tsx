'use client';

import React, { useState } from 'react';
import { SAMPLE_TENDERS } from '@/constants/sampleTenders';
import { CollusionEngine } from '@/services/collusionEngine';
import { NetworkGraphCanvas } from '@/components/features/collusion/network-graph-canvas';
import { SignalBreakdown } from '@/components/features/collusion/signal-breakdown';
import { Badge } from '@/components/ui/badge';
import { Network, ShieldAlert, FileText, Info } from 'lucide-react';

export default function CollusionGraphPage() {
  const [activeTenderId, setActiveTenderId] = useState(SAMPLE_TENDERS[0].tender.id);

  const currentTenderData =
    SAMPLE_TENDERS.find((t) => t.tender.id === activeTenderId) || SAMPLE_TENDERS[0];
  const activeTender = currentTenderData.tender;
  const activeBidders = currentTenderData.bidders;

  const integrityReport = CollusionEngine.analyzeTenderIntegrity(
    activeTender.id,
    activeBidders
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Tender-Level Cross-Bidder Collusion & Knowledge Graph
            </h1>
            <Badge variant="danger">Cartel Detection</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Knowledge-graph based structural affinity detection across DINs, registered addresses, incorporation timelines, and proposal texts.
          </p>
        </div>

        {/* Tender Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Tender:
          </label>
          <select
            value={activeTenderId}
            onChange={(e) => setActiveTenderId(e.target.value)}
            className="p-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-gem-blue text-slate-900 shadow-2xs max-w-xs truncate"
          >
            {SAMPLE_TENDERS.map((t) => (
              <option key={t.tender.id} value={t.tender.id}>
                {t.tender.tenderNumber} — {t.tender.title.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Relational Detection Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-5 h-5 text-gem-blue flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Relational Non-Accusatory Framing Policy</span>
          <p className="text-[11px] leading-relaxed text-blue-900">
            Graph linkages are framed as &quot;relationship exists — pattern consistent with known shell-bidding signatures.&quot; Collusion is a legal determination requiring officer investigation; the system surfaces verifiable signals without automatic disqualification.
          </p>
        </div>
      </div>

      {/* Interactive Network Graph Canvas */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Network className="w-4 h-4 text-gem-blue" />
          Interactive Knowledge Graph Visualization ({integrityReport.graph.nodes.length} Nodes, {integrityReport.graph.edges.length} Links)
        </h3>
        <NetworkGraphCanvas
          nodes={integrityReport.graph.nodes}
          edges={integrityReport.graph.edges}
          clusters={integrityReport.clusters}
        />
      </div>

      {/* Detailed Signal Breakdown */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Detected Collusion Signals & Evidence Dossier
        </h3>
        <SignalBreakdown clusters={integrityReport.clusters} />
      </div>
    </div>
  );
}
