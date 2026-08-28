'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { ShieldCheck, Lock, FileUp, CheckCircle2, Building2 } from 'lucide-react';
import { sha256 } from '@/lib/crypto';
import { AuditService } from '@/services/auditService';

export function BidSubmissionForm() {
  const [enterpriseName, setEnterpriseName] = useState('Bharath Electronics Solutions Pvt Ltd');
  const [cin, setCin] = useState('U72200DL2022PTC394812');
  const [pan, setPan] = useState('AAACB8819L');
  const [gstin, setGstin] = useState('07AAACB8819L1Z6');
  const [udyam, setUdyam] = useState('UDYAM-DL-01-0099412');
  const [quoteAmountLakhs, setQuoteAmountLakhs] = useState(48.5);
  const [hasConsented, setHasConsented] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsented) {
      alert('Consent Required: You must authorize scoped statutory verification to submit a bid on GeM.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const tokenId = `CST-GEM-${Math.floor(100000 + Math.random() * 900000)}`;
      const tokenPayload = {
        tokenId,
        bidder: enterpriseName,
        cin,
        pan,
        gstin,
        consentedScopes: ['API_SETU_GSTN', 'API_SETU_PAN', 'DIGILOCKER_DOCS', 'MCA21_REGISTRY'],
        timestamp: new Date().toISOString(),
      };

      // Log consent block to hash-chained ledger
      AuditService.logEvent(
        'TND-2026-IT-89421',
        'CONSENT_RECORDED',
        'Bidder Self-Service Portal',
        tokenPayload,
        cin
      );

      setSubmittedToken(tokenId);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gem-blue text-white flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-base">GeM Bidder Submission & Scoped Consent Interface</CardTitle>
                <CardDescription>
                  Demonstrates the seller-side one-time per-bid statutory data access consent flow.
                </CardDescription>
              </div>
            </div>
            <Badge variant="purple">Seller Portal View</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {submittedToken ? (
            <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">Bid & Scoped Consent Successfully Submitted</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your bid has been cryptographically recorded on GeM. Statutory eligibility checks will be verified via API Setu & DigiLocker under your granted consent token.
              </p>
              <div className="p-3 bg-white rounded-lg border border-emerald-300 inline-block font-mono text-xs text-slate-800">
                <span className="font-bold text-emerald-800">Consent Token ID: </span> {submittedToken}
              </div>
              <div className="pt-3">
                <Button variant="outline" size="sm" onClick={() => setSubmittedToken(null)}>
                  Submit Another Demonstration Bid
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitBid} className="space-y-5">
              {/* Enterprise Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enterprise Legal Name
                  </label>
                  <input
                    type="text"
                    value={enterpriseName}
                    onChange={(e) => setEnterpriseName(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Corporate Identification Number (CIN)
                  </label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Tax & Udyam IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Udyam Number (MSME)
                  </label>
                  <input
                    type="text"
                    value={udyam}
                    onChange={(e) => setUdyam(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Commercial Bid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Financial Commercial Quote (₹ Lakhs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={quoteAmountLakhs}
                  onChange={(e) => setQuoteAmountLakhs(Number(e.target.value))}
                  required
                  className="w-full sm:w-1/2 p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              {/* Scoped Statutory Consent Checkbox */}
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="statutory-consent"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-gem-blue rounded focus:ring-gem-blue cursor-pointer"
                  />
                  <label
                    htmlFor="statutory-consent"
                    className="text-xs text-blue-950 leading-relaxed cursor-pointer"
                  >
                    <span className="font-bold block mb-0.5">
                      Per-Bid Scoped Statutory Verification Consent (IT Act 2000 & DigiLocker Mandate)
                    </span>
                    I hereby give explicit consent to the Government e-Marketplace (GeM) Compliance Verification Microservice to query API Setu, DigiLocker, and MCA21 government gateways to verify GST returns, PAN standing, Udyam MSME status, and EPFO compliance on a scoped, read-only basis strictly for evaluating eligibility in this procurement tender.
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="shadow-sm"
                >
                  <Lock className="w-4 h-4" /> Cryptographically Sign & Submit Bid
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
