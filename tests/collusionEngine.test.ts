import { describe, it, expect } from 'vitest';
import { CollusionEngine } from '@/services/collusionEngine';
import { SAMPLE_TENDERS } from '@/constants/sampleTenders';

describe('CollusionEngine - Knowledge Graph & Cartel Pattern Detection', () => {
  const tender1 = SAMPLE_TENDERS[0].tender;
  const bidders1 = SAMPLE_TENDERS[0].bidders;

  it('should detect shared DIN, shared address, and tight incorporation window between Bidder A and Bidder B', () => {
    const report = CollusionEngine.analyzeTenderIntegrity(tender1.id, bidders1);

    expect(report.totalBiddersAnalyzed).toBe(bidders1.length);
    expect(report.overallRisk).toBe('HIGH_INVESTIGATION');
    expect(report.clusters.length).toBeGreaterThan(0);

    const cluster = report.clusters[0];
    expect(cluster.bidders.some((b) => b.name.includes('TechPro'))).toBe(true);
    expect(cluster.bidders.some((b) => b.name.includes('NextGen'))).toBe(true);

    const dinSignal = cluster.signals.find((s) => s.type === 'SHARED_DIN');
    expect(dinSignal).toBeDefined();
    expect(dinSignal?.severity).toBe('HIGH');
    expect(dinSignal?.description).toContain('08412948');

    const addressSignal = cluster.signals.find((s) => s.type === 'SHARED_ADDRESS');
    expect(addressSignal).toBeDefined();
    expect(addressSignal?.evidenceSnippet).toContain('Okhla');
    expect(addressSignal?.entitiesInvolved.sharedEntityValue).toContain('Okhla');

    const tightIncorpSignal = cluster.signals.find((s) => s.type === 'TIGHT_INCORPORATION');
    expect(tightIncorpSignal).toBeDefined();
  });

  it('should generate interactive graph nodes and edges', () => {
    const report = CollusionEngine.analyzeTenderIntegrity(tender1.id, bidders1);
    expect(report.graph.nodes.length).toBeGreaterThan(0);
    expect(report.graph.edges.length).toBeGreaterThan(0);

    const bidderNodes = report.graph.nodes.filter((n) => n.type === 'BIDDER');
    expect(bidderNodes.length).toBe(bidders1.length);
  });
});
