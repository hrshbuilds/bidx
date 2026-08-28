'use client';

import React, { useState, useEffect } from 'react';
import { SAMPLE_TENDERS } from '@/constants/sampleTenders';
import { Tender } from '@/types/tender';
import { Bidder } from '@/types/bidder';
import { BidComplianceReport } from '@/types/compliance';
import { TenderIntegrityReport } from '@/types/collusion';
import { ScoringEngine } from '@/services/scoringEngine';
import { CollusionEngine } from '@/services/collusionEngine';
import { BidderTable } from '@/components/features/evaluation/bidder-table';
import { BidderDetailModal } from '@/components/features/evaluation/bidder-detail-modal';
import { CollusionAlertBanner } from '@/components/features/collusion/collusion-alert-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FileSpreadsheet,
  Building2,
  Calendar,
  IndianRupee,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function OfficerDashboardPage() {
  const [tendersData, setTendersData] = useState(SAMPLE_TENDERS);
  const [activeTenderId, setActiveTenderId] = useState(SAMPLE_TENDERS[0].tender.id);
  const [selectedBidder, setSelectedBidder] = useState<Bidder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [reports, setReports] = useState<Record<string, BidComplianceReport>>({});
  const [integrityReport, setIntegrityReport] = useState<TenderIntegrityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get active tender and its bidders
  const currentTenderData =
    tendersData.find((t) => t.tender.id === activeTenderId) || tendersData[0];
  const activeTender = currentTenderData.tender;
  const activeBidders = currentTenderData.bidders;

  // Run the full verification pipeline for all bidders in the active tender
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const runPipeline = async () => {
      const reportsMap: Record<string, BidComplianceReport> = {};

      for (const bidder of activeBidders) {
        const report = await ScoringEngine.evaluateBidderCompliance(bidder, activeTender);
        reportsMap[bidder.id] = report;
      }

      const collReport = CollusionEngine.analyzeTenderIntegrity(
        activeTender.id,
        activeBidders
      );

      if (isMounted) {
        setReports(reportsMap);
        setIntegrityReport(collReport);
        setIsLoading(false);
      }
    };

    runPipeline();

    return () => {
      isMounted = false;
    };
  }, [activeTenderId, activeTender, activeBidders]);

  const handleInspectBidder = (bidder: Bidder) => {
    setSelectedBidder(bidder);
    setIsModalOpen(true);
  };

  const handleDecisionUpdated = (
    bidderId: string,
    decision: 'ACCEPTED' | 'OVERRIDDEN',
    reason?: string
  ) => {
    setReports((prev) => {
      const existing = prev[bidderId];
      if (!existing) return prev;
      return {
        ...prev,
        [bidderId]: {
          ...existing,
          officerDecision: {
            status: decision,
            decisionDate: new Date().toISOString(),
            officerName: 'Senior Procurement Officer',
            officerId: 'PO-DELHI-8812',
            overrideReason: reason,
          },
        },
      };
    });
  };

  // Metrics
  const totalBidders = activeBidders.length;
  const eligibleBidders = Object.values(reports).filter(
    (r) => r.qualifyingGateStatus === 'ELIGIBLE'
  ).length;
  const notEligibleBidders = totalBidders - eligibleBidders;
  const cartelClustersCount = integrityReport?.clusters.length || 0;
  const lowRiskCount = Object.values(reports).filter((r) => r.riskLevel === 'LOW').length;
  const mediumRiskCount = Object.values(reports).filter((r) => r.riskLevel === 'MEDIUM').length;
  const highRiskCount = Object.values(reports).filter((r) => r.riskLevel === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Tender Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Bid Compliance & Eligibility Evaluation Sheet
            </h1>
            <Badge variant="purple">Officer Console</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated statutory eligibility checks, RAG-grounded citations, and tender-level collusion detection.
          </p>
        </div>

        {/* Tender Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap hidden sm:block">
            Select Active Tender:
          </label>
          <select
            value={activeTenderId}
            onChange={(e) => setActiveTenderId(e.target.value)}
            className="p-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-gem-blue text-slate-900 shadow-2xs max-w-xs truncate"
          >
            {tendersData.map((t) => (
              <option key={t.tender.id} value={t.tender.id}>
                {t.tender.tenderNumber} — {t.tender.title.slice(0, 35)}...
              </option>
            ))}
          </select>
          <Link href="/tender-wizard">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Live Demo Mode
            </Button>
          </Link>
        </div>
      </div>

      {/* Tender Metadata Card */}
      <Card className="bg-gradient-to-br from-white to-slate-50/80 border-slate-200">
        <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-extrabold px-2 py-0.5 bg-blue-100 text-blue-900 rounded border border-blue-200">
                {activeTender.tenderNumber}
              </span>
              <Badge
                variant={
                  activeTender.category === 'GOODS'
                    ? 'info'
                    : activeTender.category === 'SERVICES'
                    ? 'purple'
                    : 'warning'
                }
              >
                {activeTender.category} PROCUREMENT
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                Published: {formatDate(activeTender.publishedDate)} • Closing: {formatDate(activeTender.closingDate)}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {activeTender.title}
            </h2>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {activeTender.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-gem-blue" />
                {activeTender.authority.name} ({activeTender.authority.department})
              </span>
            </div>
          </div>

          {/* Tender Estimated Value & Clause Count */}
          <div className="flex sm:flex-col items-start sm:items-end justify-between w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 gap-2">
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                Estimated Value
              </span>
              <span className="text-2xl font-black text-gem-blue">
                {formatINR(activeTender.estimatedValue)}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">{activeTender.clauses.length} Statutory Clauses</span> Grounded
            </div>
          </div>
        </div>
      </Card>

      {/* Tender Integrity Collusion Alert Banner */}
      {integrityReport && <CollusionAlertBanner report={integrityReport} />}

      {/* Executive Metrics Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Bidders</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{totalBidders}</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Eligible (Gates Passed)</span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">{eligibleBidders}</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase block">Gate Failed / Debarred</span>
          <span className="text-xl font-black text-rose-700 mt-1 block">{notEligibleBidders}</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Low Risk (Compliant)</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{lowRiskCount}</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Medium / High Risk</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{mediumRiskCount + highRiskCount}</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Cartel Clusters</span>
          <span className={`text-xl font-black mt-1 block ${cartelClustersCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {cartelClustersCount}
          </span>
        </div>
      </div>

      {/* Bidder Evaluation Sheet Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-gem-blue" />
            Bidder Statutory Compliance Evaluation Matrix
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Click &quot;Inspect &amp; Verify&quot; to review grounded citations, document hashes, and record officer decisions.
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-gem-blue animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Running Agentic Compliance & Gate Verification Pipeline...</p>
          </div>
        ) : (
          <BidderTable
            bidders={activeBidders}
            reports={reports}
            onInspectBidder={handleInspectBidder}
          />
        )}
      </div>

      {/* Detailed Bidder Inspector Modal */}
      <BidderDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bidder={selectedBidder}
        tender={activeTender}
        report={selectedBidder ? reports[selectedBidder.id] || null : null}
        onDecisionUpdated={handleDecisionUpdated}
      />
    </div>
  );
}
