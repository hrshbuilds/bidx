import React from 'react';
import { PendingRequirementItem } from '@/types/compliance';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  requirements: PendingRequirementItem[];
}

export function PendingRequirementsPanel({ requirements }: Props) {
  const satisfiedCount = requirements.filter((r) => r.isSatisfied).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Pending Requirements & Tender-Specific Checklist</h4>
          <p className="text-xs text-slate-500">
            Real-time compliance tracking against the tender&apos;s published statutory eligibility clauses.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          {satisfiedCount} of {requirements.length} Satisfied
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {requirements.map((req) => (
          <div
            key={req.id}
            className={`p-4 rounded-xl border transition-all ${
              req.isSatisfied
                ? 'bg-emerald-50/30 border-emerald-200'
                : 'bg-rose-50/40 border-rose-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {req.isSatisfied ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-900">{req.requirementTitle}</h5>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">
                      {req.clauseNumber}
                    </span>
                    {req.isMandatory && (
                      <Badge variant="danger" size="sm">
                        Mandatory
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{req.notes}</p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {req.isSatisfied ? (
                  <Badge variant="success">Satisfied</Badge>
                ) : (
                  <Badge variant="danger">Action Required</Badge>
                )}
              </div>
            </div>

            {req.actionRequired && (
              <div className="mt-2.5 pt-2.5 border-t border-rose-200/60 text-xs font-medium text-rose-800 flex items-center gap-1.5">
                <span className="font-bold">Officer Action:</span> {req.actionRequired}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
