'use client';

import React, { useState } from 'react';
import { AuditService } from '@/services/auditService';
import { ChainIntegrityChecker } from '@/components/features/audit/chain-integrity-checker';
import { HashChainTimeline } from '@/components/features/audit/hash-chain-timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Download, ShieldCheck, FileCheck2 } from 'lucide-react';

export default function AuditTrailPage() {
  const [blocks, setBlocks] = useState(() => AuditService.getLogs());

  const handleRefresh = () => {
    setBlocks(AuditService.getLogs());
  };

  const handleExportCertificate = () => {
    const chainVerification = AuditService.verifyChainIntegrity();
    const certificate = {
      title: 'GeM Cryptographic Audit Trail & Compliance Certificate',
      standard: 'IT Act 2000 Section 65B & W3C Verifiable Credentials',
      issuedAt: new Date().toISOString(),
      chainVerification,
      totalBlocks: blocks.length,
      genesisHash: blocks[0]?.currentHash,
      headHash: blocks[blocks.length - 1]?.currentHash,
      ledgerBlocks: blocks,
    };

    const blob = new Blob([JSON.stringify(certificate, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gem-audit-certificate-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Tamper-Evident Cryptographic Audit Trail
            </h1>
            <Badge variant="purple">SHA-256 Hash Chain</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically linked immutable record of every consent event, API Setu/DigiLocker fetch, AI extraction, and officer decision.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCertificate}>
            <Download className="w-4 h-4" /> Export Audit Certificate (JSON)
          </Button>
        </div>
      </div>

      {/* Chain Integrity Real-time Checker with Tamper Simulation */}
      <ChainIntegrityChecker onChainUpdated={handleRefresh} />

      {/* Hash Chain Timeline Explorer */}
      <HashChainTimeline blocks={blocks} />
    </div>
  );
}
