'use client';

import React, { useState } from 'react';
import { GraphNode, GraphEdge, CollusionCluster } from '@/types/collusion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, User, MapPin, Briefcase, FileText, ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: CollusionCluster[];
}

export function NetworkGraphCanvas({ nodes, edges, clusters }: Props) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeClusterFilter, setActiveClusterFilter] = useState<string | 'ALL'>('ALL');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Position nodes nicely on SVG canvas
  // Group bidders on the left/center, directors top, addresses bottom, auditors right
  const width = 860;
  const height = 520;

  const getNodeCoordinates = (node: GraphNode, index: number, total: number) => {
    if (node.x && node.y) return { x: node.x, y: node.y };

    if (node.type === 'BIDDER') {
      const angle = (index / Math.max(1, total)) * 2 * Math.PI;
      return {
        x: width / 2 + Math.cos(angle) * 190,
        y: height / 2 + Math.sin(angle) * 130,
      };
    }
    if (node.type === 'DIRECTOR') {
      return {
        x: 180 + (index * 170) % (width - 240),
        y: 80 + Math.floor(index / 3) * 60,
      };
    }
    if (node.type === 'ADDRESS') {
      return {
        x: 220 + (index * 210) % (width - 260),
        y: height - 90,
      };
    }
    if (node.type === 'AUDITOR') {
      return {
        x: width - 150,
        y: 180 + (index * 80),
      };
    }
    return { x: width / 2, y: height / 2 };
  };

  const calculatedNodes = nodes.map((node, i) => {
    const coords = getNodeCoordinates(node, i, nodes.length);
    return { ...node, x: coords.x, y: coords.y };
  });

  const nodeMap = new Map(calculatedNodes.map((n) => [n.id, n]));

  const getNodeColor = (type: GraphNode['type'], isClusterMember?: boolean) => {
    switch (type) {
      case 'BIDDER':
        return isClusterMember ? '#dc2626' : '#0b4d8c'; // Red if cartel cluster, blue if regular
      case 'DIRECTOR':
        return '#d97706'; // Amber
      case 'ADDRESS':
        return '#7c3aed'; // Purple
      case 'AUDITOR':
        return '#059669'; // Emerald
      default:
        return '#475569';
    }
  };

  const getNodeIcon = (type: GraphNode['type']) => {
    switch (type) {
      case 'BIDDER':
        return <Building2 className="w-3.5 h-3.5 text-white" />;
      case 'DIRECTOR':
        return <User className="w-3.5 h-3.5 text-white" />;
      case 'ADDRESS':
        return <MapPin className="w-3.5 h-3.5 text-white" />;
      case 'AUDITOR':
        return <Briefcase className="w-3.5 h-3.5 text-white" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-white" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
      {/* Main Canvas Area */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Controls Toolbar */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Cluster Filter:</span>
            <button
              onClick={() => setActiveClusterFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activeClusterFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Entities ({nodes.length})
            </button>
            {clusters.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveClusterFilter(c.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  activeClusterFilter === c.id
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {c.title.split(':')[0]} ({c.severity})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 py-2 text-[11px] text-slate-600 border-b border-slate-100 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0b4d8c]" /> Bidder Entity
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> Cartel / Collusion Ring Member
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" /> Director (DIN)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" /> Registered Address
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" /> Statutory Auditor
          </span>
        </div>

        {/* Interactive SVG Canvas */}
        <div className="relative flex-1 min-h-[440px] bg-slate-50/50 rounded-xl overflow-hidden mt-2 border border-slate-100 flex items-center justify-center">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
          >
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {edges.map((edge) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const isCollusionEdge = edge.severity === 'HIGH' || edge.type === 'TEXT_SIMILARITY';

              return (
                <g key={edge.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isCollusionEdge ? '#e11d48' : '#94a3b8'}
                    strokeWidth={isCollusionEdge ? 2.5 : 1.5}
                    strokeDasharray={isCollusionEdge ? '4,4' : undefined}
                    opacity={0.75}
                  />
                  {/* Midpoint Label */}
                  <text
                    x={(src.x! + tgt.x!) / 2}
                    y={(src.y! + tgt.y!) / 2 - 4}
                    fill={isCollusionEdge ? '#e11d48' : '#64748b'}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none bg-white"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {calculatedNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isCartelMember = clusters.some((c) =>
                c.bidders.some((b) => b.id === node.id.replace('BIDDER_', ''))
              );
              const color = getNodeColor(node.type, isCartelMember);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Outer halo when selected */}
                  {isSelected && (
                    <circle r="26" fill="none" stroke={color} strokeWidth="3" strokeDasharray="3,3" />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={node.type === 'BIDDER' ? 20 : 16}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="shadow-md"
                  />

                  {/* Icon foreignObject or SVG representation */}
                  <g transform={node.type === 'BIDDER' ? 'translate(-8, -8)' : 'translate(-7, -7)'}>
                    {getNodeIcon(node.type)}
                  </g>

                  {/* Node Label Text */}
                  <text
                    y={node.type === 'BIDDER' ? 32 : 26}
                    fill="#0f172a"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {node.label.length > 22 ? node.label.slice(0, 20) + '...' : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Side Inspector Drawer */}
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 p-5 bg-slate-50/50 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Entity & Relationship Inspector
          </h4>

          {selectedNode ? (
            <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedNode.type === 'BIDDER'
                      ? 'info'
                      : selectedNode.type === 'DIRECTOR'
                      ? 'warning'
                      : selectedNode.type === 'ADDRESS'
                      ? 'purple'
                      : 'success'
                  }
                >
                  {selectedNode.type}
                </Badge>
              </div>

              <div>
                <h5 className="font-bold text-sm text-slate-900">{selectedNode.label}</h5>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {selectedNode.id}</p>
              </div>

              {selectedNode.data && (
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  {Object.entries(selectedNode.data).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-semibold capitalize text-slate-700">{key}:</span>
                      <span className="font-mono text-slate-900">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Connected Edges */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">Connected Links:</span>
                <div className="space-y-1">
                  {edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e) => (
                      <div
                        key={e.id}
                        className="text-[11px] p-2 bg-slate-100 rounded flex items-center justify-between text-slate-700"
                      >
                        <span className="font-medium">{e.label}</span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {e.source === selectedNode.id ? '-> ' + e.target : '<- ' + e.source}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              Click any node in the knowledge graph to inspect its beneficial ownership links, director appointments, and address registrations.
            </div>
          )}
        </div>

        {/* Collusion Pattern Summary */}
        <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Relational Detection Policy
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Graph signals represent structural affiliations for officer investigation. The system never auto-disqualifies bidders without human officer determination.
          </p>
        </div>
      </div>
    </div>
  );
}
