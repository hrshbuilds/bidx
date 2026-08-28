'use client';

import React, { useState } from 'react';
import { AuditLogBlock } from '@/types/audit';
import { Badge } from '@/components/ui/badge';
import { Link2, ShieldCheck, ChevronDown, ChevronUp, User, Clock, FileCode, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Props {
  blocks: AuditLogBlock[];
}

export function HashChainTimeline({ blocks }: Props) {
  const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandedBlocks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getEventBadge = (type: AuditLogBlock['eventType']) => {
    switch (type) {
      case 'CONSENT_RECORDED':
        return <Badge variant="info">Consent Captured</Badge>;
      case 'GATE_EVALUATION':
        return <Badge variant="purple">Hard Gate Check</Badge>;
      case 'SCORE_COMPUTED':
        return <Badge variant="success">Score Computed</Badge>;
      case 'COLLUSION_ANALYSIS':
        return <Badge variant="warning">Collusion Analysis</Badge>;
      case 'OFFICER_DECISION':
        return <Badge variant="success">Officer Decision</Badge>;
      case 'OFFICER_OVERRIDE':
        return <Badge variant="danger">Officer Override</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Cryptographic Hash-Chained Audit Ledger</h4>
          <p className="text-xs text-slate-500">
            Immutable, SHA-256 block-chained timeline of all verification events, API calls, and officer decisions.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
          {blocks.length} Blocks Linked
        </div>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
        {blocks.map((block) => {
          const isExpanded = Boolean(expandedBlocks[block.index]);

          return (
            <div key={block.index} className="relative pl-6">
              {/* Chain Node Icon */}
              <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-gem-blue text-white flex items-center justify-center shadow-xs text-[10px] font-bold">
                {block.index}
              </div>

              {/* Block Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all p-4 space-y-3">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      Block #{block.index}
                    </span>
                    {getEventBadge(block.eventType)}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(block.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                      <User className="w-3 h-3 text-slate-400" /> {block.actor}
                    </span>
                    <button
                      onClick={() => toggleExpand(block.index)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Hashes & Linkage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div className="truncate">
                    <span className="text-slate-500 font-sans block text-[9px] font-bold uppercase">
                      Previous Hash:
                    </span>
                    <span className="text-slate-600">{block.previousHash}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-gem-blue font-sans block text-[9px] font-bold uppercase">
                      Current Block Hash (SHA-256):
                    </span>
                    <span className="text-gem-darkblue font-semibold">{block.currentHash}</span>
                  </div>
                </div>

                {/* Digital Signature */}
                {block.signature && (
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Signature: {block.signature}
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Mathematically Linked
                    </span>
                  </div>
                )}

                {/* Expandable JSON Payload */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                      <FileCode className="w-3.5 h-3.5 text-slate-400" /> Event Data Payload:
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-52 leading-relaxed">
                      {JSON.stringify(block.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
