'use client';

import React, { useState } from 'react';
import { Bidder } from '@/types/bidder';
import { Tender } from '@/types/tender';
import { BidComplianceReport } from '@/types/compliance';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { Alert } from '@/components/ui/alert';
import { DocumentVerificationPanel } from './document-verification-panel';
import { PendingRequirementsPanel } from './pending-requirements-panel';
import { ComplianceScoreBreakdown } from './compliance-score-breakdown';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Building2,
  FileCheck2,
  ListTodo,
  CheckCircle2,
  PenTool,
  Lock,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { AuditService } from '@/services/auditService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bidder: Bidder | null;
  tender: Tender | null;
  report: BidComplianceReport | null;
  onDecisionUpdated: (bidderId: string, decision: 'ACCEPTED' | 'OVERRIDDEN', reason?: string) => void;
}

export function BidderDetailModal({
  isOpen,
  onClose,
  bidder,
  tender,
  report,
  onDecisionUpdated,
}: Props) {
  const [activeTab, setActiveTab] = useState('score');
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  if (!bidder || !tender || !report) return null;

  const isEligible = report.qualifyingGateStatus === 'ELIGIBLE';

  const handleAcceptDecision = () => {
    setIsSavingDecision(true);
    AuditService.logEvent(
      tender.id,
      'OFFICER_DECISION',
      'Procurement Officer',
      {
        bidderId: bidder.id,
        action: 'ACCEPTED_AI_VERDICT',
        verdict: report.recommendation.verdict,
        score: report.weightedScore,
      },
      bidder.id
    );
    onDecisionUpdated(bidder.id, 'ACCEPTED');
    setIsSavingDecision(false);
  };

  const handleOverrideDecision = () => {
    if (!overrideReason.trim()) {
      alert('Mandatory Requirement: You must provide a justifiable reason for overriding the compliance recommendation.');
      return;
    }
    setIsSavingDecision(true);
    AuditService.logEvent(
      tender.id,
      'OFFICER_OVERRIDE',
      'Procurement Officer',
      {
        bidderId: bidder.id,
        action: 'OVERRIDE_VERDICT',
        originalVerdict: report.recommendation.verdict,
        overrideReason: overrideReason.trim(),
        score: report.weightedScore,
      },
      bidder.id,
      'GOV-OFFICER-DIGITAL-SIGNATURE-OVERRIDE'
    );
    onDecisionUpdated(bidder.id, 'OVERRIDDEN', overrideReason.trim());
    setIsSavingDecision(false);
    setIsOverrideMode(false);
  };

  const tabs = [
    {
      id: 'score',
      label: 'Compliance Scoring',
      icon: <FileCheck2 className="w-4 h-4" />,
      badge: report.weightedScore !== null ? `${report.weightedScore.toFixed(0)} pts` : 'Gate Fail',
    },
    {
      id: 'documents',
      label: 'Document Verification Status',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: report.documentVerifications.length,
    },
    {
      id: 'pending',
      label: 'Pending Requirements Checklist',
      icon: <ListTodo className="w-4 h-4" />,
      badge: `${report.pendingRequirements.filter((r) => r.isSatisfied).length}/${report.pendingRequirements.length}`,
    },
    {
      id: 'gates',
      label: 'Qualifying Gates',
      icon: <AlertOctagon className="w-4 h-4" />,
      badge: isEligible ? 'Passed' : 'Failed',
    },
    {
      id: 'decision',
      label: 'Officer Review & Override',
      icon: <PenTool className="w-4 h-4" />,
      badge: report.officerDecision?.status || 'Pending',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="5xl"
      title={
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gem-blue text-white flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{bidder.name}</h3>
              {bidder.isMsme && <Badge variant="purple">Udyam MSME</Badge>}
              {bidder.isStartup && <Badge variant="info">DPIIT Startup</Badge>}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              CIN: {bidder.cin} | GSTIN: {bidder.gstin} | Quote: {formatINR(bidder.bidAmount)}
            </p>
          </div>
        </div>
      }
      description={
        <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Consent Token: <span className="font-mono">{bidder.consentToken?.tokenId || 'CST-VERIFIED'}</span>
          </span>
          <span>•</span>
          <span>Tender: {tender.tenderNumber}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-mono">
            Audit Hash: {report.auditHash.slice(0, 16)}...
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
            {report.officerDecision?.status === 'ACCEPTED' ? (
              <Badge variant="success" size="md">
                <CheckCircle2 className="w-3.5 h-3.5" /> Decision Recorded (Accepted)
              </Badge>
            ) : report.officerDecision?.status === 'OVERRIDDEN' ? (
              <Badge variant="warning" size="md">
                <ShieldAlert className="w-3.5 h-3.5" /> Officer Override Recorded
              </Badge>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('decision')}
              >
                Take Officer Action
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Top Banner: Hard Gates / Risk Banner */}
      <div className="mb-6">
        {!isEligible ? (
          <Alert
            variant="danger"
            title="QUALIFYING REQUIREMENTS FAILED — BIDDER NOT ELIGIBLE"
            icon={<AlertOctagon className="w-6 h-6 text-rose-600 flex-shrink-0" />}
          >
            {report.recommendation.actionAdvice}
            <div className="mt-2 text-xs font-semibold text-rose-800">
              Note: Under GeM & GFR guidelines, compliance score computation is bypassed when a mandatory Qualifying Requirement gate fails.
            </div>
          </Alert>
        ) : (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              report.riskLevel === 'LOW'
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : report.riskLevel === 'MEDIUM'
                ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                : 'bg-rose-50/60 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {report.riskLevel === 'LOW' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm uppercase tracking-wide">
                    {report.recommendation.title}
                  </span>
                  <Badge
                    variant={
                      report.riskLevel === 'LOW'
                        ? 'success'
                        : report.riskLevel === 'MEDIUM'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {report.recommendation.verdict}
                  </Badge>
                </div>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                  {report.recommendation.actionAdvice}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:pl-4 border-slate-300/40">
              <span className="text-xs text-slate-500 font-medium block">Compliance Score</span>
              <span className="text-2xl font-black text-slate-900">
                {report.weightedScore?.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ 100</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-5" />

      {/* Tab 1: Scoring */}
      {activeTab === 'score' && (
        <div>
          {isEligible ? (
            <ComplianceScoreBreakdown
              scoreBreakdown={report.scoreBreakdown}
              weightedTotalScore={report.weightedScore}
            />
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">Scoring Bypassed</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Compliance score is not computed for bidders who fail mandatory Qualifying Requirements. Please check the Qualifying Gates tab for root causes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Document Verification Status Panel */}
      {activeTab === 'documents' && (
        <DocumentVerificationPanel documents={report.documentVerifications} />
      )}

      {/* Tab 3: Pending Requirements Panel */}
      {activeTab === 'pending' && (
        <PendingRequirementsPanel requirements={report.pendingRequirements} />
      )}

      {/* Tab 4: Qualifying Gates */}
      {activeTab === 'gates' && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900">Deterministic Qualifying Requirements (Hard Gates)</h4>
          <div className="grid grid-cols-1 gap-3">
            {report.hardGateResults.map((gate) => (
              <div
                key={gate.gateId}
                className={`p-4 rounded-xl border ${
                  gate.status === 'PASSED'
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {gate.status === 'PASSED' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{gate.gateName}</span>
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {gate.citation.clauseNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{gate.reason}</p>
                      <div className="mt-2 text-[11px] text-slate-500 font-mono bg-white/80 p-2 rounded border border-slate-200">
                        <div><strong className="text-slate-700">Tested:</strong> {gate.evidence.testedValue}</div>
                        <div><strong className="text-slate-700">Source:</strong> {gate.evidence.source}</div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={gate.status === 'PASSED' ? 'success' : 'danger'}>
                    {gate.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Officer Review & Override */}
      {activeTab === 'decision' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Human-in-the-Loop Discretionary Authority</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              As the designated Procurement Officer, you have final authority to accept the AI-generated recommendation or override the eligibility verdict. Any override is permanently cryptographically recorded in the hash-chained audit ledger with your justification.
            </p>
          </div>

          {report.officerDecision?.status && report.officerDecision.status !== 'PENDING' ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Officer Decision Recorded ({report.officerDecision.status})
              </div>
              {report.officerDecision.overrideReason && (
                <div className="mt-2 text-xs text-slate-700 bg-white p-3 rounded border border-emerald-200">
                  <span className="font-semibold text-slate-900 block mb-1">Recorded Justification:</span>
                  {report.officerDecision.overrideReason}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {!isOverrideMode ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="success"
                    className="w-full sm:w-auto"
                    onClick={handleAcceptDecision}
                    isLoading={isSavingDecision}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Accept AI Recommendation ({report.recommendation.verdict})
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full sm:w-auto"
                    onClick={() => setIsOverrideMode(true)}
                  >
                    <PenTool className="w-4 h-4" /> Override Recommendation
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    Officer Override Justification (Mandatory Audit Requirement)
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Enter formal justification for overriding the AI recommendation (e.g., 'Competent authority granted one-time extension on MSME certificate submission under Rule 173')..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full p-3 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsOverrideMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleOverrideDecision}
                      isLoading={isSavingDecision}
                    >
                      Sign & Submit Override to Audit Ledger
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
