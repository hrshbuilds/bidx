import React from 'react';
import { DocumentVerificationItem } from '@/types/compliance';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, Database, FileText } from 'lucide-react';

interface Props {
  documents: DocumentVerificationItem[];
}

export function DocumentVerificationPanel({ documents }: Props) {
  const getStatusBadge = (status: DocumentVerificationItem['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Verified Authentic
          </Badge>
        );
      case 'VERIFIED_WITH_WARNING':
        return (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="w-3 h-3" /> Verified with Warning
          </Badge>
        );
      case 'NOT_VERIFIED_MISSING':
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="w-3 h-3" /> Not Verified — Missing
          </Badge>
        );
      case 'PENDING_PROCESSING':
        return (
          <Badge variant="info" className="gap-1">
            <Clock className="w-3 h-3" /> Pending Processing
          </Badge>
        );
    }
  };

  const getSourceIcon = (source: DocumentVerificationItem['source']) => {
    switch (source) {
      case 'DIGILOCKER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3" /> DigiLocker (Live Signed)
          </span>
        );
      case 'API_SETU':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            <Database className="w-3 h-3" /> API Setu (Direct Gateway)
          </span>
        );
      case 'MCA21':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            <Database className="w-3 h-3" /> MCA21 Registry
          </span>
        );
      case 'BIDDER_UPLOAD':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <FileText className="w-3 h-3" /> Bidder Upload (OCR Verified)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Document Verification Status Panel</h4>
          <p className="text-xs text-slate-500">
            Cross-portal cryptographic validation of submitted credentials against statutory sources of truth.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
          {documents.filter((d) => d.status === 'VERIFIED').length} / {documents.length} Verified
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Document Description</th>
              <th className="px-4 py-3">Verification Status</th>
              <th className="px-4 py-3">Authoritative Source</th>
              <th className="px-4 py-3">Issuing Authority & Validity</th>
              <th className="px-4 py-3">Audit Fingerprint</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-900">{doc.documentName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{doc.findings}</div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(doc.status)}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">{getSourceIcon(doc.source)}</td>
                <td className="px-4 py-3.5">
                  <div className="font-medium text-slate-800">{doc.issuer}</div>
                  <div className="text-[11px] text-slate-500">{doc.validityInfo}</div>
                </td>
                <td className="px-4 py-3.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {doc.checksum ? doc.checksum.slice(0, 12) + '...' : 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
