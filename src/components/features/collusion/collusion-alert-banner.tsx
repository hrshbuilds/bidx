import React from 'react';
import { TenderIntegrityReport } from '@/types/collusion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, Network } from 'lucide-react';
import Link from 'next/link';

interface Props {
  report: TenderIntegrityReport;
}

export function CollusionAlertBanner({ report }: Props) {
  if (report.overallRisk === 'CLEAR') {
    return (
      <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-900">
                Tender Integrity Clear
              </span>
              <Badge variant="success">No Collusion Detected</Badge>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              All {report.totalBiddersAnalyzed} submitted bids show independent beneficial ownership, distinct corporate leadership, and discrete operating premises.
            </p>
          </div>
        </div>
        <Link href="/collusion-graph">
          <Button variant="outline" size="sm" className="bg-white">
            <Network className="w-3.5 h-3.5" /> View Network Graph
          </Button>
        </Link>
      </div>
    );
  }

  const isHigh = report.overallRisk === 'HIGH_INVESTIGATION';

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border transition-all ${
        isHigh
          ? 'bg-rose-50/80 border-rose-300 text-rose-950 shadow-xs'
          : 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
              isHigh ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm uppercase tracking-wider">
                {isHigh
                  ? 'High-Suspicion Cross-Bidder Affiliation Pattern Detected'
                  : 'Tender Integrity Notice — Structural Linkages Flagged'}
              </span>
              <Badge variant={isHigh ? 'danger' : 'warning'}>
                {report.clusters.length} Cluster(s) Flagged
              </Badge>
            </div>
            <p className="text-xs mt-1 opacity-90 leading-relaxed max-w-3xl">
              {report.summary}
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs font-semibold">
              <span className="underline decoration-rose-300">
                Pattern: Shared DIN + Common Okhla Address + 12-day Incorp Window + 89% Proposal Similarity
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
          <Link href="/collusion-graph">
            <Button
              variant={isHigh ? 'danger' : 'primary'}
              size="sm"
              className="w-full md:w-auto shadow-sm"
            >
              <Network className="w-4 h-4" /> Investigate Cartel Graph <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
