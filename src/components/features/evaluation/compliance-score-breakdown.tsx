import React from 'react';
import { CheckScoreResult } from '@/types/compliance';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface Props {
  scoreBreakdown: CheckScoreResult[];
  weightedTotalScore: number | null;
}

export function ComplianceScoreBreakdown({ scoreBreakdown, weightedTotalScore }: Props) {
  const getStatusIcon = (status: CheckScoreResult['status']) => {
    switch (status) {
      case 'COMPLIANT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'NON_COMPLIANT':
        return <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      case 'SKIPPED':
        return <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />;
    }
  };

  const getStatusBadge = (status: CheckScoreResult['status']) => {
    switch (status) {
      case 'COMPLIANT':
        return <Badge variant="success">Compliant</Badge>;
      case 'WARNING':
        return <Badge variant="warning">Review Gap</Badge>;
      case 'NON_COMPLIANT':
        return <Badge variant="danger">Non-Compliant</Badge>;
      case 'SKIPPED':
        return <Badge variant="default">Exempted / N/A</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Total Score Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Weighted Statutory Compliance Score</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Weights dynamically redistributed proportionally across tender-applicable clauses.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-64">
          <Progress value={weightedTotalScore || 0} variant="dynamic" className="flex-1" />
          <span className="text-base font-extrabold text-slate-900 whitespace-nowrap">
            {weightedTotalScore !== null ? `${weightedTotalScore.toFixed(1)} / 100` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Per Check Breakdown Table / Cards */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Statutory Check & Grounded Clause</th>
              <th className="px-3 py-3 text-center">Allocated Weight</th>
              <th className="px-3 py-3 text-center">Raw Score</th>
              <th className="px-3 py-3 text-center">Contribution</th>
              <th className="px-4 py-3">Status & Authoritative Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {scoreBreakdown.map((item) => (
              <tr
                key={item.checkId}
                className={item.applicable ? 'hover:bg-slate-50/70 transition-colors' : 'bg-slate-50/40 opacity-70'}
              >
                <td className="px-4 py-3.5 max-w-sm">
                  <div className="flex items-start gap-2">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{item.findings}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <span className="font-semibold text-gem-blue">{item.citation.clauseNumber}:</span>
                        <span>{item.citation.clauseText}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-center font-bold text-slate-800">
                  {item.applicable ? (
                    <span>
                      {item.redistributedWeight}%
                      {item.originalWeight !== item.redistributedWeight && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          (orig: {item.originalWeight}%)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3.5 text-center font-semibold text-slate-700">
                  {item.applicable ? `${item.rawScorePercentage}%` : '—'}
                </td>
                <td className="px-3 py-3.5 text-center font-bold text-gem-blue text-sm">
                  {item.applicable ? `${item.weightedContribution.toFixed(1)} pts` : '0 pts'}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    {getStatusBadge(item.status)}
                    <span className="text-[10px] text-slate-500">{item.liveSource}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
