'use client';

import React, { useState } from 'react';
import { Tender, TenderCategory } from '@/types/tender';
import { Bidder } from '@/types/bidder';
import { RagClauseEngine, ExtractedClauseFinding } from '@/services/ragClauseEngine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, Plus, FileText, CheckCircle2, Building2, ArrowRight } from 'lucide-react';
import { sha256 } from '@/lib/crypto';
import { useRouter } from 'next/navigation';

interface Props {
  onTenderCreated: (newTender: Tender, newBidders: Bidder[]) => void;
}

export function TenderForm({ onTenderCreated }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState('Procurement of AI Workstations and High-Density GPU Compute Nodes');
  const [category, setCategory] = useState<TenderCategory>('GOODS');
  const [estimatedValueCr, setEstimatedValueCr] = useState(8.5);
  const [authorityName, setAuthorityName] = useState('Center for Development of Advanced Computing (C-DAC)');
  const [department, setDepartment] = useState('Supercomputing & AI Research Directorate, Pune');
  const [description, setDescription] = useState(
    'Turnkey supply, configuration and benchmarking of 20 High-Performance GPU Nodes with NVIDIA H100 SXM5 / AMD Instinct MI300X with 5-year 24x7 mission-critical OEM support and Make in India Class-I local content compliance.'
  );

  const [extractedClauses, setExtractedClauses] = useState<ExtractedClauseFinding[]>(() =>
    RagClauseEngine.extractApplicableClauses(title, category, description)
  );

  const [isExtracting, setIsExtracting] = useState(false);

  // Custom Bidders to include
  const [customBidders, setCustomBidders] = useState<Bidder[]>([
    {
      id: 'BID-LIVE-01',
      tenderId: 'TND-LIVE-CUSTOM',
      name: 'Param Computing Technologies Pvt Ltd',
      tradeName: 'Param Computing',
      cin: 'U72900PN2019PTC184120',
      pan: 'AAACP8812K',
      gstin: '27AAACP8812K1Z3',
      udyamNumber: 'UDYAM-MH-26-0019284',
      isMsme: true,
      isStartup: false,
      incorporationDate: '2019-07-15',
      registeredAddress: 'Pashan Road, Pune, Maharashtra - 411008',
      statutoryAuditor: 'M/s Joshi & Kulkarni LLP',
      directors: [
        {
          din: '07192841',
          name: 'Venkatesh Joshi',
          pan: 'AAAPJ1948L',
          appointmentDate: '2019-07-15',
        },
      ],
      mcaFilings: {
        cin: 'U72900PN2019PTC184120',
        companyName: 'Param Computing Technologies Pvt Ltd',
        status: 'ACTIVE',
        rocCode: 'RoC-Pune',
        registrationNumber: '184120',
        category: 'Private Limited Company',
        lastAgmDate: '2025-09-25',
        balanceSheetDate: '2025-03-31',
        statutoryAuditor: 'M/s Joshi & Kulkarni LLP',
        registeredAddress: 'Pashan Road, Pune, Maharashtra - 411008',
      },
      financialTurnover: [
        { financialYear: '2024-25', amount: 14.2, auditedBy: 'M/s Joshi', udinNumber: '25019284AAAA1190' },
      ],
      submittedDocuments: [
        {
          id: 'DOC-LIVE-1',
          type: 'OEM_AUTHORIZATION',
          title: 'Direct OEM Authorization (NVIDIA Partner Network)',
          documentNumber: 'NPN-2026-LIVE-88',
          source: 'DIGILOCKER',
          isDigiLockerVerified: true,
          issuer: 'NVIDIA India Enterprise',
          issuedDate: '2026-08-01',
          checksum: 'ea881293ac',
          extractedData: {},
        },
      ],
      consentToken: {
        tokenId: 'CST-LIVE-001',
        bidderId: 'BID-LIVE-01',
        tenderId: 'TND-LIVE-CUSTOM',
        timestamp: new Date().toISOString(),
        ipAddress: '14.139.122.10',
        consentedScopes: ['API_SETU', 'DIGILOCKER', 'MCA21', 'CVC_DEBARMENT'],
        signature: 'ECDSA-SHA256-LIVE-001-OK',
      },
      bidSubmissionDate: new Date().toISOString(),
      bidAmount: 82000000,
      makeInIndiaLocalContentPercentage: 65,
      technicalProposalText: 'Param Computing provides Tier-1 enterprise GPU servers with liquid cooling manifolds.',
    },
    {
      id: 'BID-LIVE-02',
      tenderId: 'TND-LIVE-CUSTOM',
      name: 'Global Compute Distro Services Ltd',
      tradeName: 'Global Compute',
      cin: 'U72200DL2021PTC389120',
      pan: 'AAACG7712M',
      gstin: '07AAACG7712M1Z5',
      isMsme: false,
      isStartup: false,
      incorporationDate: '2021-04-10',
      registeredAddress: 'Nehru Place, New Delhi - 110019',
      statutoryAuditor: 'M/s Mittal & Co',
      directors: [
        {
          din: '06192840',
          name: 'Ashish Mittal',
          pan: 'AAAPM9912K',
          appointmentDate: '2021-04-10',
        },
      ],
      mcaFilings: {
        cin: 'U72200DL2021PTC389120',
        companyName: 'Global Compute Distro Services Ltd',
        status: 'ACTIVE',
        rocCode: 'RoC-Delhi',
        registrationNumber: '389120',
        category: 'Public Limited Company',
        lastAgmDate: '2025-09-15',
        balanceSheetDate: '2025-03-31',
        statutoryAuditor: 'M/s Mittal & Co',
        registeredAddress: 'Nehru Place, New Delhi - 110019',
      },
      financialTurnover: [
        { financialYear: '2024-25', amount: 9.8, auditedBy: 'M/s Mittal', udinNumber: '25019284AAAA2219' },
      ],
      submittedDocuments: [],
      consentToken: {
        tokenId: 'CST-LIVE-002',
        bidderId: 'BID-LIVE-02',
        tenderId: 'TND-LIVE-CUSTOM',
        timestamp: new Date().toISOString(),
        ipAddress: '115.112.90.14',
        consentedScopes: ['API_SETU', 'DIGILOCKER', 'MCA21', 'CVC_DEBARMENT'],
        signature: 'ECDSA-SHA256-LIVE-002-OK',
      },
      bidSubmissionDate: new Date().toISOString(),
      bidAmount: 84500000,
      makeInIndiaLocalContentPercentage: 18, // Below 20% Class-II threshold
      technicalProposalText: 'Global Compute offers imported compute units with distributor fulfillment.',
    },
  ]);

  const handleRunRAG = () => {
    setIsExtracting(true);
    setTimeout(() => {
      const findings = RagClauseEngine.extractApplicableClauses(title, category, description);
      setExtractedClauses(findings);
      setIsExtracting(false);
    }, 300);
  };

  const handleCreateAndEvaluate = () => {
    const tenderId = `TND-LIVE-${Date.now().toString().slice(-6)}`;
    const tenderNumber = `GeM/2026/B/${Math.floor(100000 + Math.random() * 900000)}`;

    const newTender: Tender = {
      id: tenderId,
      tenderNumber,
      title,
      category,
      estimatedValue: estimatedValueCr * 10000000,
      publishedDate: new Date().toISOString().split('T')[0],
      closingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      authority: {
        name: authorityName,
        department,
        location: 'Pune / Delhi NCR',
      },
      description,
      requiredDocuments: [
        'GST Registration Certificate',
        'PAN Card',
        'MCA21 Certificate of Incorporation',
        'OEM Authorization Form',
        'Make in India Local Content Declaration',
      ],
      clauses: extractedClauses.map((c, idx) => ({
        id: `CLS_LIVE_${idx}`,
        clauseNumber: c.clauseNumber,
        title: c.title,
        text: c.groundedTextSnippet,
        type: c.type,
        category: c.category as any,
        defaultWeight: c.type === 'HARD_GATE' ? 0 : 15,
        isMandatory: c.type === 'HARD_GATE',
        applicableInCategories: [category],
        exemptionForMSME: true,
      })),
    };

    const assignedBidders = customBidders.map((b) => ({
      ...b,
      tenderId,
    }));

    onTenderCreated(newTender, assignedBidders);
    router.push('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Live Custom Tender Creator & Agentic Pipeline Trigger
              </CardTitle>
              <CardDescription>
                Designed for hackathon judges to input any live tender description and run the end-to-end RAG clause parsing, hard gate verification, and weighted scoring pipeline in real time.
              </CardDescription>
            </div>
            <Badge variant="purple">Judge Live Demo Mode</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tender Title / Requirement
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gem-blue text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Procurement Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TenderCategory)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gem-blue text-slate-900 font-bold"
              >
                <option value="GOODS">GOODS (Hardware/Supply)</option>
                <option value="SERVICES">SERVICES (Facility/Manpower/IT)</option>
                <option value="WORKS">WORKS (Solar/Civil/EPC)</option>
              </select>
            </div>
          </div>

          {/* Value & Authority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated Value (₹ Crores)
              </label>
              <input
                type="number"
                step="0.1"
                value={estimatedValueCr}
                onChange={(e) => setEstimatedValueCr(Number(e.target.value))}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gem-blue text-slate-900 font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Procuring Authority & Department
              </label>
              <input
                type="text"
                value={`${authorityName} - ${department}`}
                onChange={(e) => setAuthorityName(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gem-blue text-slate-900"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Tender Scope & Eligibility Specifications Text
              </label>
              <button
                type="button"
                onClick={handleRunRAG}
                className="text-xs font-semibold text-gem-blue hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Re-Parse Clauses with RAG
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gem-blue text-slate-900 leading-relaxed"
            />
          </div>

          {/* RAG Extracted Clauses Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                RAG-Extracted Grounded Statutory Clauses ({extractedClauses.length}):
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Model: RAG Citation Embeddings v2
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {extractedClauses.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-900">{c.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {c.clauseNumber} • {c.sourceCitation}
                    </div>
                  </div>
                  <Badge variant={c.type === 'HARD_GATE' ? 'danger' : 'info'} size="sm">
                    {c.type === 'HARD_GATE' ? 'Gate' : 'Score'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Participating Sample Bidders for this Live Run */}
          <div>
            <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-gem-blue" />
              Participating Test Bidders for this Live Evaluation:
            </h5>
            <div className="space-y-2">
              {customBidders.map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span className="text-slate-500 font-mono ml-2">
                      (CIN: {b.cin} • Quote: ₹{(b.bidAmount / 10000000).toFixed(2)} Cr • MII Local: {b.makeInIndiaLocalContentPercentage}%)
                    </span>
                  </div>
                  <Badge variant={b.isMsme ? 'purple' : 'outline'}>
                    {b.isMsme ? 'MSME' : 'Regular Enterprise'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Trigger Button */}
          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateAndEvaluate}
              className="w-full sm:w-auto shadow-md"
            >
              Publish Tender & Launch Compliance Microservice <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
