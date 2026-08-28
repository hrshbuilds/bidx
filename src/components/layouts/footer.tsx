import React from 'react';
import { Lock, FileCheck2, Database, ShieldAlert } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block text-xs">Embedded Trust Boundary</span>
              <span className="text-[11px] leading-tight text-slate-500 block mt-0.5">
                No third-party LLM ingress. Self-hosted on MeitY GCC / NIC government private cloud.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block text-xs">Two-Tier Data Freshness</span>
              <span className="text-[11px] leading-tight text-slate-500 block mt-0.5">
                Tier-1 static eligibility cache + Tier-2 live statutory checks (Debarment always live).
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <FileCheck2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block text-xs">Cryptographic Audit Chain</span>
              <span className="text-[11px] leading-tight text-slate-500 block mt-0.5">
                SHA-256 hash-chained ledger. IT Act 2000 Sec 65B & W3C Verifiable Credentials compliant.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block text-xs">Human-in-the-Loop</span>
              <span className="text-[11px] leading-tight text-slate-500 block mt-0.5">
                Procurement officer retains full discretionary authority. AI acts as explainable decision-support.
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© 2026 Government e-Marketplace (GeM) • Compliance Verification Microservice (BidFlo)</p>
          <p className="flex items-center gap-3">
            <span>GFR 2017 Rule 151</span>
            <span>•</span>
            <span>API Setu MeitY</span>
            <span>•</span>
            <span>DigiLocker Certified</span>
            <span>•</span>
            <span>MCA21 Live</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
