'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileDown,
  Building2,
  Users,
  ShieldCheck,
  Edit3,
  RefreshCw,
  Eye,
  ChevronRight,
  ExternalLink,
  Info,
  Network,
  Cpu,
  Layers,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Modal } from '@/components/ui/modal';
import { SAMPLE_TENDERS } from '@/constants/sampleTenders';
import { TEN_SAMPLE_BIDDERS } from '@/constants/tenSampleBidders';
import { Tender, TenderClause } from '@/types/tender';
import { Bidder } from '@/types/bidder';
import { BidComplianceReport } from '@/types/compliance';
import { TenderIntegrityReport } from '@/types/collusion';
import { ScoringEngine } from '@/services/scoringEngine';
import { CollusionEngine } from '@/services/collusionEngine';
import { AuditService } from '@/services/auditService';
import { RagClauseEngine, ExtractedClauseFinding } from '@/services/ragClauseEngine';
import { generateCompliancePdfReport } from '@/services/pdfReportGenerator';
import { BidderDetailModal } from '@/components/features/evaluation/bidder-detail-modal';
import { NetworkGraphCanvas } from '@/components/features/collusion/network-graph-canvas';
import { CollusionAlertBanner } from '@/components/features/collusion/collusion-alert-banner';

export default function JudgeDemoPage() {
  // Stepper state: 1 = Tender, 2 = Bidders, 3 = Verifying, 4 = Results
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Active tender & extracted clauses
  const [selectedTender, setSelectedTender] = useState<Tender>(SAMPLE_TENDERS[0].tender);
  const [extractedClauses, setExtractedClauses] = useState<ExtractedClauseFinding[]>(
    RagClauseEngine.extractApplicableClauses(
      SAMPLE_TENDERS[0].tender.title,
      SAMPLE_TENDERS[0].tender.category,
      SAMPLE_TENDERS[0].tender.description
    )
  );

  // 10 Bidders state
  const [bidders, setBidders] = useState<Bidder[]>(TEN_SAMPLE_BIDDERS);
  const [editingBidder, setEditingBidder] = useState<Bidder | null>(null);

  // Evaluation & processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [verificationDone, setVerificationDone] = useState<boolean>(false);

  // Reports
  const [complianceReports, setComplianceReports] = useState<BidComplianceReport[]>([]);
  const [integrityReport, setIntegrityReport] = useState<TenderIntegrityReport | null>(null);
  const [selectedBidderForModal, setSelectedBidderForModal] = useState<Bidder | null>(null);
  const [activeResultsTab, setActiveResultsTab] = useState<'matrix' | 'collusion'>('matrix');

  // Handle Tender switch
  const handleTenderSelect = (tender: Tender) => {
    setSelectedTender(tender);
    const clauses = RagClauseEngine.extractApplicableClauses(tender.title, tender.category, tender.description);
    setExtractedClauses(clauses);
  };

  // Reset to 10 sample bidders
  const handleLoadSampleBidders = () => {
    setBidders(TEN_SAMPLE_BIDDERS);
  };

  // Save edited bidder
  const handleSaveEditedBidder = (updated: Bidder) => {
    setBidders((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingBidder(null);
  };

  // Run full verification pipeline with live animated simulation
  const handleRunVerification = async () => {
    setIsProcessing(true);
    setCurrentStep(3);
    setProgressValue(10);
    setProgressMessage('Initializing GeM private enclave & W3C audit genesis block...');

    await new Promise((r) => setTimeout(r, 600));
    setProgressValue(25);
    setProgressMessage('Querying Central Debarment / CVC Registry (Tier-2 Live)...');

    await new Promise((r) => setTimeout(r, 700));
    setProgressValue(45);
    setProgressMessage('Calling API Setu Gateway (GSTN filings, PAN validity, MSME Udyam, EPFO)...');

    await new Promise((r) => setTimeout(r, 700));
    setProgressValue(65);
    setProgressMessage('Verifying DigiLocker Cryptographic Certificate Fingerprints & OEM MAFs...');

    await new Promise((r) => setTimeout(r, 600));
    setProgressValue(80);
    setProgressMessage('Executing Dynamic Weight Redistribution & 0–100 Compliance Scoring Engine...');

    // Run real deterministic evaluation for all 10 bidders
    const reports: BidComplianceReport[] = [];
    for (const b of bidders) {
      const rep = await ScoringEngine.evaluateBidderCompliance(b, selectedTender);
      reports.push(rep);
    }
    setComplianceReports(reports);

    await new Promise((r) => setTimeout(r, 600));
    setProgressValue(92);
    setProgressMessage('Constructing Cross-Bidder Knowledge Graph & Detecting Collusion Signatures...');

    // Run collusion detection
    const intRep = CollusionEngine.analyzeTenderIntegrity(selectedTender.id, bidders);
    setIntegrityReport(intRep);

    // Append to audit ledger
    AuditService.logEvent(
      selectedTender.id,
      'SCORE_COMPUTED',
      'Judge Demo Automated Execution Pipeline',
      {
        totalBidders: bidders.length,
        eligibleCount: reports.filter((r) => r.qualifyingGateStatus === 'ELIGIBLE').length,
        overallRisk: intRep.overallRisk,
      }
    );

    await new Promise((r) => setTimeout(r, 500));
    setProgressValue(100);
    setProgressMessage('Verification complete! Results synthesized.');

    await new Promise((r) => setTimeout(r, 400));
    setIsProcessing(false);
    setVerificationDone(true);
    setCurrentStep(4);
  };

  // Download PDF Report
  const handleDownloadPdf = () => {
    if (!integrityReport) return;
    const auditLogs = AuditService.getLogs(selectedTender.id);
    const rootHash = auditLogs[0]?.currentHash;
    generateCompliancePdfReport(selectedTender, bidders, complianceReports, integrityReport, rootHash);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / Stepper */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon Live Pitch Mode
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI-Powered GeM Bid Compliance Verification
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Self-contained, end-to-end demo simulating live government registries (API Setu, DigiLocker, MCA21, CVC Debarment),
              deterministic gates, dynamic weight redistribution, and cross-bidder collusion graph analytics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {verificationDone && (
              <Button
                onClick={handleDownloadPdf}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" /> Download Official PDF Report
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(1);
                setVerificationDone(false);
              }}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Restart Demo
            </Button>
          </div>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="mt-8 grid grid-cols-4 gap-2 text-center text-xs font-medium">
          {[
            { num: 1, label: '1. Select/Create Tender', desc: 'RAG Scope Extraction' },
            { num: 2, label: '2. 10 Sample Bidders', desc: 'Pre-seeded & Editable' },
            { num: 3, label: '3. Run Verification', desc: 'Autonomous Multi-Gate' },
            { num: 4, label: '4. Evaluation Results', desc: 'Matrix & PDF Export' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num || (currentStep === 4 && verificationDone);

            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num <= 2 || verificationDone) setCurrentStep(s.num);
                }}
                className={`cursor-pointer rounded-xl p-3 border transition-all ${
                  isActive
                    ? 'bg-blue-600/30 border-blue-400 text-white shadow-md'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <div className="font-bold">{s.label}</div>
                <div className="text-[10px] opacity-75 hidden sm:block">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 1: TENDER SCOPE & CLAUSE EXTRACTION                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tender Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gem-blue" />
                  Select Active Demo Tender
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose a pre-configured procurement scope or test clause extraction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SAMPLE_TENDERS.map((item) => {
                  const t = item.tender;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleTenderSelect(t)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTender.id === t.id
                          ? 'border-gem-blue bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={selectedTender.id === t.id ? 'info' : 'outline'} className="text-[10px]">
                          {t.category}
                        </Badge>
                        <span className="text-[11px] font-bold text-slate-700">INR {(t.estimatedValue / 10000000).toFixed(2)} Cr</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">{t.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{t.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Button
              onClick={() => setCurrentStep(2)}
              className="w-full bg-gem-blue hover:bg-blue-800 text-white font-bold shadow-md py-6 flex items-center justify-center gap-2"
            >
              Proceed to 10 Sample Bidders <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Extracted Checklist Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      RAG-Extracted Compliance Checklist
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Automatically extracted statutory requirements and dynamic weights grounded in GFR 2017 & DPIIT policies.
                    </CardDescription>
                  </div>
                  <Badge variant="success" className="text-xs">
                    {extractedClauses.length} Applicable Checks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {extractedClauses.map((clause, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-gem-blue">{clause.clauseNumber}</span>
                          <Badge variant={clause.type === 'HARD_GATE' ? 'danger' : 'info'} className="text-[9px]">
                            {clause.type === 'HARD_GATE' ? 'Qualifying Gate' : 'Weighted Check'}
                          </Badge>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900">{clause.title}</h5>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{clause.groundedTextSnippet}</p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Statutory Citation:</span>
                        <span className="font-medium text-slate-700">{clause.sourceCitation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: 10 SAMPLE BIDDERS REVIEW & LIVE EDITING                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gem-blue" />
                Pre-Loaded 10 Sample Bidders for {selectedTender.title}
              </h3>
              <p className="text-xs text-slate-500">
                Seeded with 2 collusion suspects (TechPro + NextGen), 1 blacklisted entity (AeroByte), and 7 varying clean/yellow/red profiles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSampleBidders}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Default 10
              </Button>
              <Button
                onClick={handleRunVerification}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md text-xs px-4 py-2 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> Run Autonomous Verification
              </Button>
            </div>
          </div>

          {/* 10 Bidders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bidders.map((b, idx) => {
              // Determine tag badge
              let tag = 'Clean Bidder';
              let tagVariant: any = 'success';
              if (b.id === 'BID-001' || b.id === 'BID-002') {
                tag = 'Seeded Collusion Suspect';
                tagVariant = 'warning';
              } else if (b.id === 'BID-003') {
                tag = 'Debarred Gate Fail';
                tagVariant = 'danger';
              } else if (b.id === 'BID-005') {
                tag = 'Yellow Late GST';
                tagVariant = 'warning';
              } else if (b.id === 'BID-009') {
                tag = 'Red Non-Local MII';
                tagVariant = 'danger';
              }

              return (
                <div
                  key={b.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1} ({b.id})</span>
                      <Badge variant={tagVariant} className="text-[10px]">
                        {tag}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{b.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">CIN: {b.cin}</p>

                    <div className="mt-3 space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div><span className="font-medium text-slate-700">PAN:</span> {b.pan}</div>
                      <div><span className="font-medium text-slate-700">GSTIN:</span> {b.gstin}</div>
                      <div><span className="font-medium text-slate-700">Director:</span> {b.directors?.[0]?.name || 'N/A'}</div>
                      <div><span className="font-medium text-slate-700">Local Content:</span> {b.makeInIndiaLocalContentPercentage ?? 60}%</div>
                      <div><span className="font-medium text-slate-700">Bid Amount:</span> INR {(b.bidAmount / 10000000).toFixed(2)} Cr</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Inc: {b.incorporationDate}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingBidder(b)}
                      className="text-xs text-gem-blue hover:text-blue-900 font-semibold p-1 h-auto flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Bidder
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleRunVerification}
              className="bg-gem-blue hover:bg-blue-800 text-white font-bold text-sm px-6 py-6 shadow-lg flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" /> Launch Verification Engine across all 10 Bidders
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 3: LIVE VERIFICATION PROCESSING SIMULATION                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <Card className="border-slate-200 shadow-lg p-8 text-center max-w-2xl mx-auto my-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-gem-blue mx-auto flex items-center justify-center animate-bounce shadow-md">
            <Cpu className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">
              Autonomous Verification Engine Executing...
            </h3>
            <p className="text-xs text-slate-500">
              Cross-referencing 10 bidders with live statutory registry connectors and knowledge graph.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>{progressMessage}</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} variant="default" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 text-[11px] text-slate-500">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span>4 Hard Gates</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <Layers className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <span>7 Weighted Checks</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <Network className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <span>Collusion Pass</span>
            </div>
          </div>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* STEP 4: VERIFICATION RESULTS MATRIX & COLLUSION GRAPH               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Top Results Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Evaluated</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{bidders.length} Bidders</div>
              <span className="text-[10px] text-slate-400">Automated GeM Microservice</span>
            </Card>

            <Card className="p-4 border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 uppercase">Gate Eligible</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {complianceReports.filter((r) => r.qualifyingGateStatus === 'ELIGIBLE').length}
              </div>
              <span className="text-[10px] text-slate-400">Passed all 4 hard gates</span>
            </Card>

            <Card className="p-4 border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-rose-600 uppercase">Disqualified (Gate Fail)</span>
              <div className="text-2xl font-black text-rose-700 mt-1">
                {complianceReports.filter((r) => r.qualifyingGateStatus === 'NOT_ELIGIBLE').length}
              </div>
              <span className="text-[10px] text-slate-400">Debarred / Struck-off</span>
            </Card>

            <Card className="p-4 border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-amber-600 uppercase">Integrity Alert</span>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {integrityReport?.clusters.length || 0} Cluster(s)
              </div>
              <span className="text-[10px] text-slate-400">Shared DIN & address detected</span>
            </Card>
          </div>

          {/* Collusion Alert Banner */}
          {integrityReport && integrityReport.clusters.length > 0 && (
            <CollusionAlertBanner report={integrityReport} />
          )}

          {/* Tab Switcher: Matrix vs Knowledge Graph */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Button
                variant={activeResultsTab === 'matrix' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveResultsTab('matrix')}
                className="text-xs font-bold"
              >
                <FileCheck2 className="w-3.5 h-3.5 mr-1.5" /> 10-Bidder Evaluation Scorecard
              </Button>
              <Button
                variant={activeResultsTab === 'collusion' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveResultsTab('collusion')}
                className="text-xs font-bold"
              >
                <Network className="w-3.5 h-3.5 mr-1.5" /> Interactive Knowledge Graph
              </Button>
            </div>

            <Button
              onClick={handleDownloadPdf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4" /> Download Official PDF Report
            </Button>
          </div>

          {/* Results Tab 1: 10 Bidders Scorecard Table */}
          {activeResultsTab === 'matrix' && (
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Bidder Legal Name</th>
                      <th className="py-3 px-4">CIN / Reg No</th>
                      <th className="py-3 px-4 text-center">Hard Gates</th>
                      <th className="py-3 px-4 text-center">Compliance Score</th>
                      <th className="py-3 px-4 text-center">Risk Level</th>
                      <th className="py-3 px-4">Recommendation</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {bidders.map((b, idx) => {
                      const rep = complianceReports.find((r) => r.bidderId === b.id);
                      const isEligible = rep?.qualifyingGateStatus === 'ELIGIBLE';

                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{b.name}</div>
                            <div className="text-[10px] text-slate-500">PAN: {b.pan} | GSTIN: {b.gstin}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{b.cin}</td>
                          <td className="py-3 px-4 text-center">
                            {isEligible ? (
                              <Badge variant="success" className="text-[10px]">
                                PASSED (4/4)
                              </Badge>
                            ) : (
                              <Badge variant="danger" className="text-[10px]">
                                FAILED (Rule 151)
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-sm">
                            {isEligible && rep?.weightedScore !== null ? (
                              <span
                                className={
                                  rep.weightedScore >= 85
                                    ? 'text-emerald-600'
                                    : rep.weightedScore >= 60
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }
                              >
                                {rep.weightedScore}/100
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">N/A (Disqualified)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={
                                rep?.riskLevel === 'LOW'
                                  ? 'success'
                                  : rep?.riskLevel === 'MEDIUM'
                                  ? 'warning'
                                  : 'danger'
                              }
                              className="text-[10px]"
                            >
                              {rep?.riskLevel || 'NOT_ELIGIBLE'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {rep?.recommendation.actionAdvice || 'Evaluation pending'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBidderForModal(b)}
                              className="text-xs text-gem-blue border-blue-200 hover:bg-blue-50 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> View Breakdown
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Results Tab 2: Interactive SVG Knowledge Graph */}
          {activeResultsTab === 'collusion' && integrityReport && (
            <Card className="border-slate-200 shadow-sm p-4">
              <NetworkGraphCanvas
                nodes={integrityReport.graph.nodes as any}
                edges={integrityReport.graph.edges as any}
                clusters={integrityReport.clusters}
              />
            </Card>
          )}
        </div>
      )}

      {/* Edit Bidder Modal */}
      {editingBidder && (
        <Modal
          isOpen={true}
          onClose={() => setEditingBidder(null)}
          title={`Edit Sample Bidder: ${editingBidder.name}`}
          description="Modify fields on the fly to demonstrate dynamic re-computation to judges."
          maxWidth="2xl"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={editingBidder.name}
                  onChange={(e) => setEditingBidder({ ...editingBidder, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">PAN Number</label>
                <input
                  type="text"
                  value={editingBidder.pan}
                  onChange={(e) => setEditingBidder({ ...editingBidder, pan: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">GSTIN</label>
                <input
                  type="text"
                  value={editingBidder.gstin}
                  onChange={(e) => setEditingBidder({ ...editingBidder, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Make in India Local Content (%)</label>
                <input
                  type="number"
                  value={editingBidder.makeInIndiaLocalContentPercentage ?? 60}
                  onChange={(e) =>
                    setEditingBidder({
                      ...editingBidder,
                      makeInIndiaLocalContentPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Registered Address</label>
              <input
                type="text"
                value={editingBidder.registeredAddress}
                onChange={(e) => setEditingBidder({ ...editingBidder, registeredAddress: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Technical Proposal Text</label>
              <textarea
                rows={3}
                value={editingBidder.technicalProposalText || ''}
                onChange={(e) => setEditingBidder({ ...editingBidder, technicalProposalText: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setEditingBidder(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveEditedBidder(editingBidder)}
                className="bg-gem-blue text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Deep-Dive Bidder Detail Modal */}
      {selectedBidderForModal && (
        <BidderDetailModal
          isOpen={true}
          onClose={() => setSelectedBidderForModal(null)}
          bidder={selectedBidderForModal}
          tender={selectedTender}
          report={complianceReports.find((r) => r.bidderId === selectedBidderForModal.id) || null}
          onDecisionUpdated={() => {}}
        />
      )}
    </div>
  );
}
