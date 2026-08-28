'use client';

import React from 'react';
import { Bidder } from '@/types/bidder';
import { BidComplianceReport } from '@/types/compliance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSearch,
  Building2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface Props {
  bidders: Bidder[];
  reports: Record<string, BidComplianceReport>;
  onInspectBidder: (bidder: Bidder) => void;
}

export function BidderTable({ bidders, reports, onInspectBidder }: Props) {
  const getRiskBadge = (report?: BidComplianceReport) => {
    if (!report) return <Badge variant="default">Evaluating...</Badge>;

    if (report.qualifyingGateStatus === 'NOT_ELIGIBLE') {
      return (
        <Badge variant="danger" className="font-bold">
          <XCircle className="w-3 h-3" /> Not Eligible
        </Badge>
      );
    }

    switch (report.riskLevel) {
      case 'LOW':
        return (
          <Badge variant="success" className="font-bold">
            <CheckCircle2 className="w-3 h-3" /> Low Risk (Compliant)
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="warning" className="font-bold">
            <AlertTriangle className="w-3 h-3" /> Medium Risk (Review)
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="danger" className="font-bold">
            <ShieldAlert className="w-3 h-3" /> High Risk (Significant Gaps)
          </Badge>
        );
      default:
        return <Badge variant="default">Evaluating</Badge>;
    }
  };

  const getGateBadge = (report?: BidComplianceReport) => {
    if (!report) return <Badge variant="default">—</Badge>;

    if (report.qualifyingGateStatus === 'ELIGIBLE') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Passed (4/4)
        </span>
      );
    }

    const failedCount = report.hardGateResults.filter((g) => g.status === 'FAILED').length;
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
        <XCircle className="w-4 h-4 text-rose-600" /> Gate Failed ({failedCount})
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Bidder Enterprise</th>
              <th className="px-4 py-3.5">Bid Amount</th>
              <th className="px-4 py-3.5 text-center">Qualifying Requirements (Gates)</th>
              <th className="px-4 py-3.5 text-center min-w-[140px]">Compliance Score</th>
              <th className="px-4 py-3.5 text-center">Risk Assessment</th>
              <th className="px-4 py-3.5 text-center">Officer Decision</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {bidders.map((bidder) => {
              const report = reports[bidder.id];
              const isEligible = report?.qualifyingGateStatus === 'ELIGIBLE';

              return (
                <tr
                  key={bidder.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !isEligible && report ? 'bg-rose-50/20' : ''
                  }`}
                >
                  {/* Bidder Enterprise */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5 font-bold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{bidder.name}</span>
                          {bidder.isMsme && (
                            <Badge variant="purple" size="sm">
                              MSME
                            </Badge>
                          )}
                          {bidder.isStartup && (
                            <Badge variant="info" size="sm">
                              Startup
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          CIN: {bidder.cin} • PAN: {bidder.pan}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Bid Amount */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatINR(bidder.bidAmount)}
                    </span>
                  </td>

                  {/* Qualifying Hard Gates */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {getGateBadge(report)}
                  </td>

                  {/* Compliance Score */}
                  <td className="px-4 py-4 text-center">
                    {report && isEligible && report.weightedScore !== null ? (
                      <div className="flex flex-col items-center gap-1 max-w-[130px] mx-auto">
                        <span className="font-black text-slate-900 text-sm">
                          {report.weightedScore.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                        </span>
                        <Progress value={report.weightedScore} variant="dynamic" />
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium text-xs">Score Skipped</span>
                    )}
                  </td>

                  {/* Risk Assessment */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {getRiskBadge(report)}
                  </td>

                  {/* Officer Decision */}
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {report?.officerDecision?.status === 'ACCEPTED' ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3" /> Accepted
                      </Badge>
                    ) : report?.officerDecision?.status === 'OVERRIDDEN' ? (
                      <Badge variant="warning" size="sm">
                        <ShieldAlert className="w-3 h-3" /> Overridden
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">Pending Review</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onInspectBidder(bidder)}
                      className="hover:border-gem-blue hover:text-gem-blue"
                    >
                      <FileSearch className="w-3.5 h-3.5" /> Inspect & Verify
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
