"""
Cross-Bidder Collusion Detection Engine & Knowledge Graph Analytics.
Mirrors src/services/collusionEngine.ts in Python.
"""
from __future__ import annotations
from datetime import datetime, timezone
import math
import re
from typing import Dict, List, Set, Tuple

from app.models import (
    Bidder,
    CollusionCluster,
    CollusionSignal,
    GraphEdge,
    GraphNode,
    TenderIntegrityReport,
)
from app.text_similarity import compute_jaccard_similarity, compute_ngram_overlap


def normalize_address(address: str) -> str:
    cleaned = address.lower()
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\b(road|rd|street|st|lane|sector|sec|floor|flr|tower|twr|plot|no|number)\b", "", cleaned)
    return cleaned.strip()


def normalize_auditor(auditor: str) -> str:
    cleaned = auditor.lower()
    cleaned = re.sub(r"\b(m/s|chartered\s+accountants|ca|llp|and\s+co|&|firm)\b", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def analyze_tender_integrity(tender_id: str, bidders: List[Bidder]) -> TenderIntegrityReport:
    timestamp = datetime.now(timezone.utc).isoformat()
    signals: List[CollusionSignal] = []
    clusters: List[CollusionCluster] = []

    # Entity index maps
    din_to_bidders: Dict[str, List[Tuple[Bidder, str]]] = {}
    address_to_bidders: Dict[str, List[Bidder]] = {}
    auditor_to_bidders: Dict[str, List[Bidder]] = {}

    # 1. Populate entity index maps
    for bidder in bidders:
        for director in bidder.directors or []:
            if director.din:
                din_to_bidders.setdefault(director.din, []).append((bidder, director.name))

        if bidder.registeredAddress:
            norm_addr = normalize_address(bidder.registeredAddress)
            address_to_bidders.setdefault(norm_addr, []).append(bidder)

        if bidder.statutoryAuditor:
            norm_aud = normalize_auditor(bidder.statutoryAuditor)
            auditor_to_bidders.setdefault(norm_aud, []).append(bidder)

    # 2. Check for Shared Directors (DINs)
    for din, entries in din_to_bidders.items():
        if len(entries) > 1:
            bidder_ids = [e[0].id for e in entries]
            bidder_names = [e[0].name for e in entries]
            dir_name = entries[0][1]

            signals.append(CollusionSignal(
                id=f"SIG_DIN_{din}",
                type="SHARED_DIN",
                title=f"Shared Director / Common DIN Identified ({dir_name})",
                severity="HIGH",
                description=f"Director '{dir_name}' (DIN: {din}) holds active board appointments in multiple competing bidders ({', '.join(bidder_names)}).",
                entitiesInvolved={
                    "bidderIds": bidder_ids,
                    "bidderNames": bidder_names,
                    "sharedEntityValue": f"DIN: {din} ({dir_name})",
                },
                evidenceSnippet=f"MCA21 Director Registry confirms DIN {din} is registered under {' and '.join(bidder_names)}.",
                detectionRule="Cross-Bidder Board Overlap (MCA21 Section 164)",
            ))

    # 3. Check for Shared Registered Addresses
    for norm_addr, b_list in address_to_bidders.items():
        if len(b_list) > 1:
            bidder_ids = [b.id for b in b_list]
            bidder_names = [b.name for b in b_list]

            signals.append(CollusionSignal(
                id=f"SIG_ADDR_{norm_addr[:12]}",
                type="SHARED_ADDRESS",
                title="Shared Registered Address across Bidders",
                severity="HIGH",
                description=f"Multiple bidders ({', '.join(bidder_names)}) share the exact physical registered office address recorded on MCA21.",
                entitiesInvolved={
                    "bidderIds": bidder_ids,
                    "bidderNames": bidder_names,
                    "sharedEntityValue": b_list[0].registeredAddress,
                },
                evidenceSnippet=f'Registered Address: "{b_list[0].registeredAddress}"',
                detectionRule="Common Premises & Infrastructure Footprint",
            ))

    # 4. Check for Tight Incorporation Date Window (< 30 days)
    for i in range(len(bidders)):
        for j in range(i + 1, len(bidders)):
            b1 = bidders[i]
            b2 = bidders[j]
            if b1.incorporationDate and b2.incorporationDate:
                try:
                    d1 = datetime.fromisoformat(b1.incorporationDate.replace("Z", "+00:00"))
                    d2 = datetime.fromisoformat(b2.incorporationDate.replace("Z", "+00:00"))
                    diff_days = abs((d1 - d2).days)

                    if diff_days <= 30:
                        signals.append(CollusionSignal(
                            id=f"SIG_INCORP_{b1.id}_{b2.id}",
                            type="TIGHT_INCORPORATION",
                            title=f"Proximate Incorporation Window ({diff_days} days)",
                            severity="MEDIUM",
                            description=f"'{b1.name}' (inc: {b1.incorporationDate}) and '{b2.name}' (inc: {b2.incorporationDate}) were incorporated within {diff_days} days of each other.",
                            entitiesInvolved={
                                "bidderIds": [b1.id, b2.id],
                                "bidderNames": [b1.name, b2.name],
                                "sharedEntityValue": f"Delta: {diff_days} days",
                            },
                            evidenceSnippet=f"Inc Dates: {b1.incorporationDate} vs {b2.incorporationDate}",
                            detectionRule="Co-Incidental Entity Formation Timeline",
                        ))
                except Exception:
                    pass

    # 5. Check for Shared Statutory Auditor
    for _norm_aud, b_list in auditor_to_bidders.items():
        if len(b_list) > 1:
            bidder_ids = [b.id for b in b_list]
            bidder_names = [b.name for b in b_list]

            signals.append(CollusionSignal(
                id=f"SIG_AUD_{b_list[0].statutoryAuditor[:10]}",
                type="SHARED_AUDITOR",
                title="Shared Statutory Auditor / CA Firm",
                severity="MEDIUM",
                description=f"Multiple bidders ({', '.join(bidder_names)}) share the statutory audit firm '{b_list[0].statutoryAuditor}'.",
                entitiesInvolved={
                    "bidderIds": bidder_ids,
                    "bidderNames": bidder_names,
                    "sharedEntityValue": b_list[0].statutoryAuditor,
                },
                evidenceSnippet=f'Auditor: "{b_list[0].statutoryAuditor}" in MCA AOC-4 filings',
                detectionRule="Common Professional Intermediary Footprint",
            ))

    # 6. Check for Technical Proposal Text Similarity
    for i in range(len(bidders)):
        for j in range(i + 1, len(bidders)):
            b1 = bidders[i]
            b2 = bidders[j]
            if b1.technicalProposalText and b2.technicalProposalText:
                jaccard = compute_jaccard_similarity(b1.technicalProposalText, b2.technicalProposalText)
                ngram_overlap = compute_ngram_overlap(b1.technicalProposalText, b2.technicalProposalText, 4)

                if jaccard > 0.65 or ngram_overlap > 0.5:
                    match_pct = round(max(jaccard, ngram_overlap) * 100.0, 1)
                    signals.append(CollusionSignal(
                        id=f"SIG_TEXT_{b1.id}_{b2.id}",
                        type="DOCUMENT_SIMILARITY",
                        title=f"High Proposal Text Similarity ({match_pct}%)",
                        severity="HIGH",
                        description=f"Technical proposals submitted by '{b1.name}' and '{b2.name}' contain identical phraseology, structure, and token overlap exceeding normal variance.",
                        entitiesInvolved={
                            "bidderIds": [b1.id, b2.id],
                            "bidderNames": [b1.name, b2.name],
                            "sharedEntityValue": f"{match_pct}% Match",
                        },
                        evidenceSnippet=f"Token Jaccard: {jaccard*100:.1f}% | 4-gram Overlap: {ngram_overlap*100:.1f}%",
                        detectionRule="Bid Document Textual Plagiarism & Collusive Drafting",
                    ))

    # 7. Group into Collusion Clusters
    cluster_map: Dict[str, Tuple[Set[str], List[CollusionSignal]]] = {}
    for sig in signals:
        key = "__".join(sorted(sig.entitiesInvolved["bidderIds"]))
        if key not in cluster_map:
            cluster_map[key] = (set(), [])
        b_set, sig_list = cluster_map[key]
        for b_id in sig.entitiesInvolved["bidderIds"]:
            b_set.add(b_id)
        sig_list.append(sig)

    cluster_idx = 1
    for _key, (b_set, c_signals) in cluster_map.items():
        b_array = []
        for b_id in b_set:
            b_obj = next((b for b in bidders if b.id == b_id), None)
            b_array.append({
                "id": b_id,
                "name": b_obj.name if b_obj else b_id,
                "cin": b_obj.cin if b_obj else "N/A",
            })

        has_high_signal = any(s.severity == "HIGH" for s in c_signals)
        has_shared_din = any(s.type == "SHARED_DIN" for s in c_signals)
        has_shared_address = any(s.type == "SHARED_ADDRESS" for s in c_signals)
        has_tight_incorp = any(s.type == "TIGHT_INCORPORATION" for s in c_signals)

        is_high_suspicion = (has_shared_din and has_shared_address) or (has_shared_din and has_tight_incorp) or has_high_signal
        severity = "HIGH" if is_high_suspicion else "MEDIUM"

        b_names = [b["name"] for b in b_array]
        clusters.append(CollusionCluster(
            id=f"CLUSTER_{cluster_idx}",
            title=f"Cluster {cluster_idx}: Potential Affiliation ({' & '.join(b_names)})",
            severity=severity,
            bidders=b_array,
            signals=c_signals,
            summaryExplanation=f"Detected {len(c_signals)} structural linkage signal(s) between {' and '.join(b_names)}. Relationship exists — pattern consistent with known shell-bidding signatures.",
            recommendationForOfficer=(
                "High suspicion: Officer advised to issue formal inquiry regarding common management and beneficial ownership before awarding contract."
                if severity == "HIGH"
                else "Medium suspicion: Single common intermediary or proximity detected. Verify arm’s length independence of bids."
            ),
        ))
        cluster_idx += 1

    # 8. Build Knowledge Graph
    graph_data = build_knowledge_graph(bidders, signals, clusters)

    overall_risk = (
        "HIGH_INVESTIGATION"
        if any(c.severity == "HIGH" for c in clusters)
        else ("MEDIUM_INVESTIGATION" if len(clusters) > 0 else "CLEAR")
    )

    if overall_risk == "HIGH_INVESTIGATION":
        summary = f"Tender Integrity Flag: {len(clusters)} suspicious cluster(s) detected with high structural affinity. Coordinated bidding patterns require officer investigation."
    elif overall_risk == "MEDIUM_INVESTIGATION":
        summary = f"Tender Integrity Notice: {len(clusters)} minor relationship signal(s) detected across bidders. Routine diligence recommended."
    else:
        summary = "Tender Integrity Clear: All submitted bids exhibit independent ownership, diverse leadership, and distinct premises."

    return TenderIntegrityReport(
        tenderId=tender_id,
        evaluatedAt=timestamp,
        totalBiddersAnalyzed=len(bidders),
        overallRisk=overall_risk,
        summary=summary,
        clusters=clusters,
        graph=graph_data,
    )


def build_knowledge_graph(
    bidders: List[Bidder],
    signals: List[CollusionSignal],
    clusters: List[CollusionCluster],
) -> Dict[str, List]:
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []
    node_set: Set[str] = set()

    def add_node(node: GraphNode):
        if node.id not in node_set:
            node_set.add(node.id)
            nodes.append(node)

    for idx, b in enumerate(bidders):
        cluster = next((c for c in clusters if any(cb["id"] == b.id for cb in c.bidders)), None)
        angle = (idx * 2 * math.pi) / max(1, len(bidders))
        add_node(GraphNode(
            id=f"BIDDER_{b.id}",
            label=b.name,
            type="BIDDER",
            clusterId=cluster.id if cluster else None,
            data={
                "cin": b.cin,
                "isMsme": b.isMsme,
                "bidAmount": b.bidAmount,
            },
            x=150.0 + math.cos(angle) * 180.0,
            y=200.0 + math.sin(angle) * 140.0,
        ))

        # Directors
        for d in b.directors or []:
            dir_node_id = f"DIR_{d.din}"
            add_node(GraphNode(
                id=dir_node_id,
                label=f"{d.name} (DIN: {d.din})",
                type="DIRECTOR",
                data={"din": d.din, "name": d.name},
            ))
            edges.append(GraphEdge(
                id=f"EDGE_DIR_{b.id}_{d.din}",
                source=f"BIDDER_{b.id}",
                target=dir_node_id,
                label="Has Director",
                type="HAS_DIRECTOR",
            ))

        # Addresses
        if b.registeredAddress:
            addr_node_id = f"ADDR_{normalize_address(b.registeredAddress)[:16]}"
            add_node(GraphNode(
                id=addr_node_id,
                label=b.registeredAddress,
                type="ADDRESS",
                data={"address": b.registeredAddress},
            ))
            edges.append(GraphEdge(
                id=f"EDGE_ADDR_{b.id}",
                source=f"BIDDER_{b.id}",
                target=addr_node_id,
                label="Registered At",
                type="REGISTERED_AT",
            ))

        # Auditors
        if b.statutoryAuditor:
            aud_node_id = f"AUD_{normalize_auditor(b.statutoryAuditor)[:16]}"
            add_node(GraphNode(
                id=aud_node_id,
                label=b.statutoryAuditor,
                type="AUDITOR",
                data={"auditor": b.statutoryAuditor},
            ))
            edges.append(GraphEdge(
                id=f"EDGE_AUD_{b.id}",
                source=f"BIDDER_{b.id}",
                target=aud_node_id,
                label="Audited By",
                type="AUDITED_BY",
            ))

    # Text similarity edges
    for s in signals:
        if s.type == "DOCUMENT_SIMILARITY":
            b_ids = s.entitiesInvolved["bidderIds"]
            if len(b_ids) >= 2:
                b1, b2 = b_ids[0], b_ids[1]
                edges.append(GraphEdge(
                    id=f"EDGE_SIM_{b1}_{b2}",
                    source=f"BIDDER_{b1}",
                    target=f"BIDDER_{b2}",
                    label="Proposal Text Similarity",
                    type="TEXT_SIMILARITY",
                    severity="HIGH",
                ))

    return {
        "nodes": [n.model_dump() for n in nodes],
        "edges": [e.model_dump() for e in edges],
    }
