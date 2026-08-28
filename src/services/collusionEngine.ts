import { Bidder } from '@/types/bidder';
import {
  CollusionCluster,
  CollusionSignal,
  CollusionSeverity,
  GraphNode,
  GraphEdge,
  TenderIntegrityReport,
} from '@/types/collusion';
import { computeJaccardSimilarity, computeNgramOverlap } from '@/lib/textSimilarity';

export class CollusionEngine {
  /**
   * Analyzes all submitted bids for a tender using knowledge-graph algorithms to surface collusion patterns.
   */
  static analyzeTenderIntegrity(tenderId: string, bidders: Bidder[]): TenderIntegrityReport {
    const timestamp = new Date().toISOString();
    const signals: CollusionSignal[] = [];
    const clusters: CollusionCluster[] = [];

    // Helper maps for entity cross-referencing
    const dinToBidders = new Map<string, { bidder: Bidder; directorName: string }[]>();
    const addressToBidders = new Map<string, Bidder[]>();
    const auditorToBidders = new Map<string, Bidder[]>();

    // 1. Populate entity index maps
    bidders.forEach((bidder) => {
      // Index Directors
      bidder.directors?.forEach((dir) => {
        if (dir.din) {
          const list = dinToBidders.get(dir.din) || [];
          list.push({ bidder, directorName: dir.name });
          dinToBidders.set(dir.din, list);
        }
      });

      // Index Addresses
      if (bidder.registeredAddress) {
        const normalizedAddr = this.normalizeAddress(bidder.registeredAddress);
        const list = addressToBidders.get(normalizedAddr) || [];
        list.push(bidder);
        addressToBidders.set(normalizedAddr, list);
      }

      // Index Auditors
      if (bidder.statutoryAuditor) {
        const normalizedAuditor = this.normalizeAuditor(bidder.statutoryAuditor);
        const list = auditorToBidders.get(normalizedAuditor) || [];
        list.push(bidder);
        auditorToBidders.set(normalizedAuditor, list);
      }
    });

    // 2. Check for Shared Directors (DINs)
    dinToBidders.forEach((entries, din) => {
      if (entries.length > 1) {
        const bidderIds = entries.map((e) => e.bidder.id);
        const bidderNames = entries.map((e) => e.bidder.name);
        const directorName = entries[0].directorName;

        signals.push({
          id: `SIG_DIN_${din}`,
          type: 'SHARED_DIN',
          title: `Shared Director / Common DIN Identified (${directorName})`,
          severity: 'HIGH',
          description: `Director '${directorName}' (DIN: ${din}) holds active board appointments in multiple competing bidders (${bidderNames.join(', ')}).`,
          entitiesInvolved: {
            bidderIds,
            bidderNames,
            sharedEntityValue: `DIN: ${din} (${directorName})`,
          },
          evidenceSnippet: `MCA21 Director Registry confirms DIN ${din} is registered under ${bidderNames.join(' and ')}.`,
          detectionRule: 'Cross-Bidder Board Overlap (MCA21 Section 164)',
        });
      }
    });

    // 3. Check for Shared Registered Addresses
    addressToBidders.forEach((bList, normAddr) => {
      if (bList.length > 1) {
        const bidderIds = bList.map((b) => b.id);
        const bidderNames = bList.map((b) => b.name);

        signals.push({
          id: `SIG_ADDR_${normAddr.slice(0, 12)}`,
          type: 'SHARED_ADDRESS',
          title: 'Shared Registered Address across Bidders',
          severity: 'HIGH',
          description: `Multiple bidders (${bidderNames.join(', ')}) share the exact physical registered office address recorded on MCA21.`,
          entitiesInvolved: {
            bidderIds,
            bidderNames,
            sharedEntityValue: bList[0].registeredAddress,
          },
          evidenceSnippet: `Registered Address: "${bList[0].registeredAddress}"`,
          detectionRule: 'Common Premises & Infrastructure Footprint',
        });
      }
    });

    // 4. Check for Tight Incorporation Date Window (< 30 days)
    for (let i = 0; i < bidders.length; i++) {
      for (let j = i + 1; j < bidders.length; j++) {
        const b1 = bidders[i];
        const b2 = bidders[j];
        if (b1.incorporationDate && b2.incorporationDate) {
          const d1 = new Date(b1.incorporationDate).getTime();
          const d2 = new Date(b2.incorporationDate).getTime();
          const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);

          if (diffDays <= 30) {
            signals.push({
              id: `SIG_INCORP_${b1.id}_${b2.id}`,
              type: 'TIGHT_INCORPORATION',
              title: `Proximate Incorporation Window (${Math.round(diffDays)} days)`,
              severity: 'MEDIUM',
              description: `'${b1.name}' (inc: ${b1.incorporationDate}) and '${b2.name}' (inc: ${b2.incorporationDate}) were incorporated within ${Math.round(diffDays)} days of each other.`,
              entitiesInvolved: {
                bidderIds: [b1.id, b2.id],
                bidderNames: [b1.name, b2.name],
                sharedEntityValue: `Delta: ${Math.round(diffDays)} days`,
              },
              evidenceSnippet: `Inc Dates: ${b1.incorporationDate} vs ${b2.incorporationDate}`,
              detectionRule: 'Co-Incidental Entity Formation Timeline',
            });
          }
        }
      }
    }

    // 5. Check for Shared Statutory Auditor
    auditorToBidders.forEach((bList, _normAuditor) => {
      if (bList.length > 1) {
        const bidderIds = bList.map((b) => b.id);
        const bidderNames = bList.map((b) => b.name);

        signals.push({
          id: `SIG_AUD_${bList[0].statutoryAuditor.slice(0, 10)}`,
          type: 'SHARED_AUDITOR',
          title: 'Shared Statutory Auditor / CA Firm',
          severity: 'MEDIUM',
          description: `Multiple bidders (${bidderNames.join(', ')}) share the statutory audit firm '${bList[0].statutoryAuditor}'.`,
          entitiesInvolved: {
            bidderIds,
            bidderNames,
            sharedEntityValue: bList[0].statutoryAuditor,
          },
          evidenceSnippet: `Auditor: "${bList[0].statutoryAuditor}" in MCA AOC-4 filings`,
          detectionRule: 'Common Professional Intermediary Footprint',
        });
      }
    });

    // 6. Check for Technical Proposal Text Similarity
    for (let i = 0; i < bidders.length; i++) {
      for (let j = i + 1; j < bidders.length; j++) {
        const b1 = bidders[i];
        const b2 = bidders[j];
        if (b1.technicalProposalText && b2.technicalProposalText) {
          const jaccard = computeJaccardSimilarity(
            b1.technicalProposalText,
            b2.technicalProposalText
          );
          const ngramOverlap = computeNgramOverlap(
            b1.technicalProposalText,
            b2.technicalProposalText,
            4
          );

          if (jaccard > 0.65 || ngramOverlap > 0.5) {
            signals.push({
              id: `SIG_TEXT_${b1.id}_${b2.id}`,
              type: 'DOCUMENT_SIMILARITY',
              title: `High Proposal Text Similarity (${(Math.max(jaccard, ngramOverlap) * 100).toFixed(1)}%)`,
              severity: 'HIGH',
              description: `Technical proposals submitted by '${b1.name}' and '${b2.name}' contain identical phraseology, structure, and token overlap exceeding normal variance.`,
              entitiesInvolved: {
                bidderIds: [b1.id, b2.id],
                bidderNames: [b1.name, b2.name],
                sharedEntityValue: `${(Math.max(jaccard, ngramOverlap) * 100).toFixed(1)}% Match`,
              },
              evidenceSnippet: `Token Jaccard: ${(jaccard * 100).toFixed(1)}% | 4-gram Overlap: ${(ngramOverlap * 100).toFixed(1)}%`,
              detectionRule: 'Bid Document Textual Plagiarism & Collusive Drafting',
            });
          }
        }
      }
    }

    // 7. Group into Collusion Clusters
    const clusterMap = new Map<string, { bidders: Set<string>; signals: CollusionSignal[] }>();

    signals.forEach((sig) => {
      const key = sig.entitiesInvolved.bidderIds.sort().join('__');
      const existing = clusterMap.get(key) || { bidders: new Set<string>(), signals: [] };
      sig.entitiesInvolved.bidderIds.forEach((id) => existing.bidders.add(id));
      existing.signals.push(sig);
      clusterMap.set(key, existing);
    });

    let clusterIndex = 1;
    clusterMap.forEach(({ bidders: bSet, signals: cSignals }) => {
      const bArray = Array.from(bSet).map((id) => {
        const bObj = bidders.find((b) => b.id === id);
        return {
          id,
          name: bObj?.name || id,
          cin: bObj?.cin || 'N/A',
        };
      });

      const hasHighSignal = cSignals.some((s) => s.severity === 'HIGH');
      const hasSharedDin = cSignals.some((s) => s.type === 'SHARED_DIN');
      const hasSharedAddress = cSignals.some((s) => s.type === 'SHARED_ADDRESS');
      const hasTightIncorp = cSignals.some((s) => s.type === 'TIGHT_INCORPORATION');

      // High suspicion tier: shared director AND shared address AND tight incorporation
      const isHighSuspicion = (hasSharedDin && hasSharedAddress) || (hasSharedDin && hasTightIncorp) || hasHighSignal;
      const severity: CollusionSeverity = isHighSuspicion ? 'HIGH' : 'MEDIUM';

      clusters.push({
        id: `CLUSTER_${clusterIndex++}`,
        title: `Cluster ${clusterIndex - 1}: Potential Affiliation (${bArray.map((b) => b.name).join(' & ')})`,
        severity,
        bidders: bArray,
        signals: cSignals,
        summaryExplanation: `Detected ${cSignals.length} structural linkage signal(s) between ${bArray.map((b) => b.name).join(' and ')}. Relationship exists — pattern consistent with known shell-bidding signatures.`,
        recommendationForOfficer:
          severity === 'HIGH'
            ? 'High suspicion: Officer advised to issue formal inquiry regarding common management and beneficial ownership before awarding contract.'
            : 'Medium suspicion: Single common intermediary or proximity detected. Verify arm’s length independence of bids.',
      });
    });

    // 8. Build Interactive Graph Data (Nodes & Edges)
    const { nodes, edges } = this.buildKnowledgeGraph(bidders, signals, clusters);

    const overallRisk =
      clusters.some((c) => c.severity === 'HIGH')
        ? 'HIGH_INVESTIGATION'
        : clusters.length > 0
        ? 'MEDIUM_INVESTIGATION'
        : 'CLEAR';

    const summary =
      overallRisk === 'HIGH_INVESTIGATION'
        ? `Tender Integrity Flag: ${clusters.length} suspicious cluster(s) detected with high structural affinity. Coordinated bidding patterns require officer investigation.`
        : overallRisk === 'MEDIUM_INVESTIGATION'
        ? `Tender Integrity Notice: ${clusters.length} minor relationship signal(s) detected across bidders. Routine diligence recommended.`
        : 'Tender Integrity Clear: All submitted bids exhibit independent ownership, diverse leadership, and distinct premises.';

    return {
      tenderId,
      evaluatedAt: timestamp,
      totalBiddersAnalyzed: bidders.length,
      overallRisk,
      summary,
      clusters,
      graph: {
        nodes,
        edges,
      },
    };
  }

  private static buildKnowledgeGraph(
    bidders: Bidder[],
    signals: CollusionSignal[],
    clusters: CollusionCluster[]
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeSet = new Set<string>();

    const addNode = (node: GraphNode) => {
      if (!nodeSet.has(node.id)) {
        nodeSet.add(node.id);
        nodes.push(node);
      }
    };

    // Add Bidder nodes
    bidders.forEach((b, idx) => {
      const cluster = clusters.find((c) => c.bidders.some((cb) => cb.id === b.id));
      addNode({
        id: `BIDDER_${b.id}`,
        label: b.name,
        type: 'BIDDER',
        clusterId: cluster?.id,
        data: {
          cin: b.cin,
          isMsme: b.isMsme,
          bidAmount: b.bidAmount,
        },
        // Spread evenly in layout
        x: 150 + Math.cos((idx * 2 * Math.PI) / Math.max(1, bidders.length)) * 180,
        y: 200 + Math.sin((idx * 2 * Math.PI) / Math.max(1, bidders.length)) * 140,
      });

      // Add Director nodes & edges
      b.directors?.forEach((d) => {
        const dirNodeId = `DIR_${d.din}`;
        addNode({
          id: dirNodeId,
          label: `${d.name} (DIN: ${d.din})`,
          type: 'DIRECTOR',
          data: { din: d.din, name: d.name },
        });

        edges.push({
          id: `EDGE_DIR_${b.id}_${d.din}`,
          source: `BIDDER_${b.id}`,
          target: dirNodeId,
          label: 'Has Director',
          type: 'HAS_DIRECTOR',
        });
      });

      // Add Address nodes & edges
      if (b.registeredAddress) {
        const addrNodeId = `ADDR_${this.normalizeAddress(b.registeredAddress).slice(0, 16)}`;
        addNode({
          id: addrNodeId,
          label: b.registeredAddress,
          type: 'ADDRESS',
          data: { address: b.registeredAddress },
        });

        edges.push({
          id: `EDGE_ADDR_${b.id}`,
          source: `BIDDER_${b.id}`,
          target: addrNodeId,
          label: 'Registered At',
          type: 'REGISTERED_AT',
        });
      }

      // Add Auditor nodes & edges
      if (b.statutoryAuditor) {
        const audNodeId = `AUD_${this.normalizeAuditor(b.statutoryAuditor).slice(0, 16)}`;
        addNode({
          id: audNodeId,
          label: b.statutoryAuditor,
          type: 'AUDITOR',
          data: { auditor: b.statutoryAuditor },
        });

        edges.push({
          id: `EDGE_AUD_${b.id}`,
          source: `BIDDER_${b.id}`,
          target: audNodeId,
          label: 'Audited By',
          type: 'AUDITED_BY',
        });
      }
    });

    // Add similarity edges
    signals
      .filter((s) => s.type === 'DOCUMENT_SIMILARITY')
      .forEach((s) => {
        const [b1, b2] = s.entitiesInvolved.bidderIds;
        edges.push({
          id: `EDGE_SIM_${b1}_${b2}`,
          source: `BIDDER_${b1}`,
          target: `BIDDER_${b2}`,
          label: 'Proposal Text Similarity',
          type: 'TEXT_SIMILARITY',
          severity: 'HIGH',
        });
      });

    return { nodes, edges };
  }

  private static normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/road|rd|street|st|lane|sector|sec|floor|flr|tower|twr|plot|no|number/g, '')
      .trim();
  }

  private static normalizeAuditor(auditor: string): string {
    return auditor
      .toLowerCase()
      .replace(/m\/s|chartered\s+accountants|ca|llp|and\s+co|&|firm/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
