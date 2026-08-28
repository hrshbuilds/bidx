import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '@/services/scoringEngine';
import { SAMPLE_TENDERS } from '@/constants/sampleTenders';

describe('ScoringEngine - Weighted Compliance Scoring & Dynamic Redistribution', () => {
  const tender1 = SAMPLE_TENDERS[0].tender; // Goods
  const tender3 = SAMPLE_TENDERS[2].tender; // Services
  const highMsmeBidder = SAMPLE_TENDERS[0].bidders[3]; // Apex Digital (MSME, clean)
  const debarredBidder = SAMPLE_TENDERS[0].bidders[2]; // AeroByte (Debarred)
  const goodsBidder = SAMPLE_TENDERS[0].bidders[0]; // TechPro

  it('should skip score computation and set risk to NOT_ELIGIBLE if hard gate fails', async () => {
    const report = await ScoringEngine.evaluateBidderCompliance(debarredBidder, tender1);
    expect(report.qualifyingGateStatus).toBe('NOT_ELIGIBLE');
    expect(report.weightedScore).toBeNull();
    expect(report.riskLevel).toBe('NOT_ELIGIBLE');
    expect(report.scoreBreakdown).toHaveLength(0);
  });

  it('should compute weighted score and assign LOW risk for high-compliance MSME bidder', async () => {
    const report = await ScoringEngine.evaluateBidderCompliance(highMsmeBidder, tender1);
    expect(report.qualifyingGateStatus).toBe('ELIGIBLE');
    expect(report.weightedScore).toBeGreaterThanOrEqual(85);
    expect(report.riskLevel).toBe('LOW');
    expect(report.scoreBreakdown.length).toBeGreaterThan(0);
  });

  it('should dynamically redistribute weights proportionally in Services tender (OEM & MII excluded)', async () => {
    const servicesBidder = SAMPLE_TENDERS[2].bidders[0]; // CleanForce
    const report = await ScoringEngine.evaluateBidderCompliance(servicesBidder, tender3);

    expect(report.qualifyingGateStatus).toBe('ELIGIBLE');
    
    // Total sum of redistributed weights of applicable checks should equal 100%
    const totalApplicableWeight = report.scoreBreakdown
      .filter((c) => c.applicable)
      .reduce((sum, c) => sum + c.redistributedWeight, 0);

    expect(Math.round(totalApplicableWeight)).toBe(100);

    // OEM Authorization should be skipped in Services tender
    const oemCheck = report.scoreBreakdown.find((c) => c.checkId === 'CHECK_OEM_AUTH');
    expect(oemCheck?.applicable).toBe(false);
    expect(oemCheck?.status).toBe('SKIPPED');
  });

  it('should produce document verification panel items with source tags and checksums', async () => {
    const report = await ScoringEngine.evaluateBidderCompliance(goodsBidder, tender1);
    expect(report.documentVerifications.length).toBeGreaterThan(0);
    const gstDoc = report.documentVerifications.find((d) => d.documentType === 'GST_CERTIFICATE');
    expect(gstDoc).toBeDefined();
    expect(gstDoc?.status).toBe('VERIFIED');
    expect(gstDoc?.source).toBe('DIGILOCKER');
  });
});
