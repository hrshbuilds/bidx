import React from 'react';
import { CollusionCluster } from '@/types/collusion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert, FileText, CheckCircle2, UserCheck } from 'lucide-react';

interface Props {
  clusters: CollusionCluster[];
}

export function SignalBreakdown({ clusters }: Props) {
  if (clusters.length === 0) {
    return (
      <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
        <h4 className="font-bold text-slate-800 text-sm">No Suspicious Collusion Clusters</h4>
        <p className="text-xs text-slate-500 mt-1">
          Knowledge graph algorithms detected no common directors, matching addresses, or text plagiarism across competing bids.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {clusters.map((cluster) => (
        <div
          key={cluster.id}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Cluster Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                  cluster.severity === 'HIGH' ? 'bg-rose-600' : 'bg-amber-500'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">{cluster.title}</h4>
            </div>
            <Badge variant={cluster.severity === 'HIGH' ? 'danger' : 'warning'}>
              {cluster.severity} Suspicion Level
            </Badge>
          </div>

          <div className="p-6 space-y-5">
            {/* Involved Bidders */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">Competing Entities Involved:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cluster.bidders.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{b.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">CIN: {b.cin}</div>
                    </div>
                    <Badge variant="outline" size="sm">
                      {b.id}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Signals */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Detected Structural Affinity Signals:</span>
              {cluster.signals.map((sig) => (
                <div
                  key={sig.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 ${
                          sig.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-500'
                        }`}
                      />
                      <span className="font-bold text-xs text-slate-900">{sig.title}</span>
                    </div>
                    <Badge variant={sig.severity === 'HIGH' ? 'danger' : 'warning'} size="sm">
                      {sig.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{sig.description}</p>
                  <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200 font-mono">
                    <strong className="text-slate-700 font-sans">Evidence: </strong> {sig.evidenceSnippet}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Detection Rule: {sig.detectionRule}
                  </div>
                </div>
              ))}
            </div>

            {/* Officer Action Advisory */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
              <UserCheck className="w-5 h-5 text-gem-blue flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gem-darkblue block">Officer Action Advisory:</span>
                <p className="mt-0.5 text-blue-900 leading-relaxed">
                  {cluster.recommendationForOfficer}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
