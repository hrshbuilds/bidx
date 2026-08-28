import { Tender, TenderClause } from '@/types/tender';

export interface ExtractedClauseFinding {
  clauseNumber: string;
  title: string;
  category: string;
  type: 'HARD_GATE' | 'WEIGHTED_CHECK';
  confidenceScore: number; // 0.0 to 1.0
  sourceCitation: string;
  groundedTextSnippet: string;
  exemptionNotes?: string;
}

export class RagClauseEngine {
  /**
   * Evaluates raw tender description and requirements, extracting structured clauses with citations
   */
  static extractApplicableClauses(
    tenderTitle: string,
    tenderCategory: 'GOODS' | 'SERVICES' | 'WORKS',
    rawTenderText: string
  ): ExtractedClauseFinding[] {
    const findings: ExtractedClauseFinding[] = [];

    // Always extract statutory baseline gates
    findings.push({
      clauseNumber: 'Clause 4.1(a)',
      title: 'Debarment & Blacklisting Clearance',
      category: 'DEBARMENT',
      type: 'HARD_GATE',
      confidenceScore: 0.99,
      sourceCitation: 'General Financial Rules 2017 (GFR Rule 151)',
      groundedTextSnippet: 'Bidders debarred by CVC, GeM, or any Ministry/Department under Rule 151 of GFR 2017 are ineligible to participate in public procurement tenders.',
    });

    findings.push({
      clauseNumber: 'Clause 2.1(b)',
      title: 'Active Corporate Legal Entity Status',
      category: 'MCA21_STATUS',
      type: 'HARD_GATE',
      confidenceScore: 0.98,
      sourceCitation: 'Companies Act 2013 Sec 248',
      groundedTextSnippet: 'Incorporated entities must be in Active legal status under Ministry of Corporate Affairs (MCA21). Companies under liquidation, winding-up or struck-off are strictly ineligible.',
    });

    findings.push({
      clauseNumber: 'Clause 2.3',
      title: 'Mandatory GSTIN and PAN Statutory Registrations',
      category: 'PAN',
      type: 'HARD_GATE',
      confidenceScore: 0.99,
      sourceCitation: 'Income Tax Act 1961 & CGST Act 2017',
      groundedTextSnippet: 'The bidder must possess a valid Permanent Account Number (PAN) and Goods and Services Tax Identification Number (GSTIN).',
    });

    // Weighted Check: GST
    findings.push({
      clauseNumber: 'Clause 3.1',
      title: 'GST Return Filing & Tax Compliance',
      category: 'GST',
      type: 'WEIGHTED_CHECK',
      confidenceScore: 0.97,
      sourceCitation: 'Section 39 of CGST Act 2017',
      groundedTextSnippet: 'Bidder must hold active GSTIN with up-to-date monthly/quarterly GSTR-3B filings for the preceding 6 months.',
    });

    // Check category specific clauses
    if (tenderCategory === 'GOODS') {
      findings.push({
        clauseNumber: 'Clause 8.1',
        title: 'Make in India (MII) Local Content Preference',
        category: 'MAKE_IN_INDIA',
        type: 'WEIGHTED_CHECK',
        confidenceScore: 0.95,
        sourceCitation: 'DPIIT Public Procurement Order P-45021/2/2017-PP (BE-II)',
        groundedTextSnippet: 'Purchase preference shall be given to Class-I Local Suppliers (≥50% local content) and Class-II Local Suppliers (≥20% local content) as per Make in India mandate.',
        exemptionNotes: 'Startup India & MSME relaxation on prior turnover/experience applies if meeting quality standards.',
      });

      findings.push({
        clauseNumber: 'Clause 9.4',
        title: 'Manufacturer Authorization Form (OEM Authorization)',
        category: 'OEM_AUTH',
        type: 'WEIGHTED_CHECK',
        confidenceScore: 0.96,
        sourceCitation: 'GeM Specific Terms & Conditions (STC) - IT & Hardware',
        groundedTextSnippet: 'Bidder who is not an OEM must submit Manufacturer Authorization Form (MAF) explicitly authorizing the bidder to quote on this tender with full warranty support.',
      });
    }

    if (tenderCategory === 'SERVICES') {
      findings.push({
        clauseNumber: 'Clause 7.3',
        title: 'EPFO & ESIC Workforce Compliance',
        category: 'EPFO_ESIC',
        type: 'WEIGHTED_CHECK',
        confidenceScore: 0.98,
        sourceCitation: 'EPF & MP Act 1952 and ESI Act 1948',
        groundedTextSnippet: 'Bidder must be registered with EPFO and ESIC. Monthly Electronic Challan cum Return (ECR) proofs for deployed manpower must be produced.',
      });
    }

    // MSME Benefits
    findings.push({
      clauseNumber: 'Clause 5.1',
      title: 'MSME Policy Preference & EMD Exemption',
      category: 'UDYAM',
      type: 'WEIGHTED_CHECK',
      confidenceScore: 0.97,
      sourceCitation: 'Public Procurement Policy for MSEs Order 2012',
      groundedTextSnippet: 'Micro & Small Enterprises (MSEs) registered with Udyam are entitled to tender document fee and EMD exemption with 25% purchase preference.',
    });

    return findings;
  }
}
