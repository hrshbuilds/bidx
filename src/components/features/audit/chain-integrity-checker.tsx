'use client';

import React, { useState } from 'react';
import { AuditService } from '@/services/auditService';
import { AuditChainVerification } from '@/types/audit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, RefreshCw, Zap, Bug, CheckCircle2, RotateCcw } from 'lucide-react';

interface Props {
  onChainUpdated: () => void;
}

export function ChainIntegrityChecker({ onChainUpdated }: Props) {
  const [verification, setVerification] = useState<AuditChainVerification>(() =>
    AuditService.verifyChainIntegrity()
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const result = AuditService.verifyChainIntegrity();
      setVerification(result);
      setIsVerifying(false);
      setStatusNote('Cryptographic verification executed across all SHA-256 blocks in the chain.');
    }, 250);
  };

  const handleSimulateTamper = () => {
    // Modify block #1 payload to prove tamper detection
    AuditService.simulateTamper(1, 'status', 'TAMPERED_INELIGIBLE_PAYLOAD_FRAUD');
    const result = AuditService.verifyChainIntegrity();
    setVerification(result);
    onChainUpdated();
    setStatusNote('Simulated malicious alteration of Block #1 payload. Notice how cryptographic link broke!');
  };

  const handleResetLedger = () => {
    AuditService.resetChain();
    AuditService.initializeGenesis();
    const result = AuditService.verifyChainIntegrity();
    setVerification(result);
    onChainUpdated();
    setStatusNote('Ledger restored to valid uncorrupted state.');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
              verification.isValid ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {verification.isValid ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">Cryptographic Chain Verifier</h4>
              <Badge variant={verification.isValid ? 'success' : 'danger'}>
                {verification.isValid ? '100% Tamper-Evident & Intact' : 'Tampering Detected'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Validates SHA-256 mathematical linkages from Genesis Block #0 to Head.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerify}
            isLoading={isVerifying}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-Verify Ledger
          </Button>

          {verification.isValid ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleSimulateTamper}
              title="Demonstrates mathematical tamper detection for hackathon judges"
            >
              <Bug className="w-3.5 h-3.5" /> Simulate Tamper
            </Button>
          ) : (
            <Button
              variant="success"
              size="sm"
              onClick={handleResetLedger}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Ledger
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
          verification.isValid
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}
      >
        <div className="font-bold mb-0.5">
          {verification.isValid ? 'Verification Result: All Hashes Sound' : 'CRITICAL ALERT: Tampering Identified'}
        </div>
        <div>{verification.verificationMessage}</div>
        {statusNote && <div className="mt-1 font-semibold text-[11px] opacity-90">{statusNote}</div>}
      </div>
    </div>
  );
}
