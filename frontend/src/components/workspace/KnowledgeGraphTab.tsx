import React, { useState } from "react";
import { GitBranch, RefreshCw, Loader2, AlertCircle, Filter, X, Network, Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { GraphData, GraphNode } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface KnowledgeGraphTabProps {
  graphData?: GraphData | null;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  onSelectNode?: (nodeName: string) => void;
  selectedNodeName?: string | null;
}

export function KnowledgeGraphTab({
  graphData,
  onRefresh,
  isLoading,
  error,
  onSelectNode,
  selectedNodeName,
}: KnowledgeGraphTabProps) {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [inspectNode, setInspectNode] = useState<GraphNode | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];

  const exportGraphJSON = () => {
    if (nodes.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `docflow_graph_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract unique entity types
  const entityTypes = ["ALL", ...Array.from(new Set(nodes.map((n) => n.type)))];

  const filteredNodes =
    selectedTypeFilter === "ALL"
      ? nodes
      : nodes.filter((n) => n.type === selectedTypeFilter);

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // 2D Flowchart Layered Layout (Sugiyama approach)
  // Calculate node positions based on in-degree dependencies
  const inDegrees: Record<string, number> = {};
  filteredNodes.forEach((n) => {
    inDegrees[n.id] = 0;
  });
  filteredEdges.forEach((e) => {
    if (inDegrees[e.target] !== undefined) {
      inDegrees[e.target]++;
    }
  });

  const roots = filteredNodes.filter((n) => inDegrees[n.id] === 0);
  if (roots.length === 0 && filteredNodes.length > 0) {
    roots.push(filteredNodes[0]);
  }

  const levels: Record<string, number> = {};
  const queue: { id: string; level: number }[] = roots.map((r) => ({ id: r.id, level: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    levels[id] = Math.max(levels[id] || 0, level);
    const outgoing = filteredEdges.filter((e) => e.source === id);
    outgoing.forEach((edge) => {
      if (filteredNodes.some((n) => n.id === edge.target)) {
        queue.push({ id: edge.target, level: level + 1 });
      }
    });
  }

  filteredNodes.forEach((n) => {
    if (levels[n.id] === undefined) {
      levels[n.id] = 0;
    }
  });

  const nodesByLevel: Record<number, typeof filteredNodes> = {};
  filteredNodes.forEach((n) => {
    const lvl = levels[n.id];
    if (!nodesByLevel[lvl]) nodesByLevel[lvl] = [];
    nodesByLevel[lvl].push(n);
  });

  const colWidth = 260;
  const rowHeight = 130;
  const nodeWidth = 170;
  const nodeHeight = 60;

  const positions: Record<string, { x: number; y: number }> = {};
  Object.keys(nodesByLevel).forEach((lvlStr) => {
    const lvl = parseInt(lvlStr);
    const lvlNodes = nodesByLevel[lvl];
    const count = lvlNodes.length;
    lvlNodes.forEach((node, idx) => {
      const x = 120 + lvl * colWidth;
      const y = 250 + (idx - (count - 1) / 2) * rowHeight;
      positions[node.id] = { x, y };
    });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/50 pb-5">
        <div>
          <h3 className="text-base font-bold text-neutral-900 flex items-center">
            <GitBranch className="w-4 h-4 mr-2 text-indigo-600" /> Entity Knowledge Graph
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Semantic node networks and relational mappings discovered across transaction files. Click a node to view timeline events.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {nodes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportGraphJSON}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export JSON
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Graph
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 space-y-4 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-neutral-700">
            Mapping relationships...
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-700 text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">GRAPH EXCEPTION:</span> {error}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && nodes.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 space-y-4 shadow-sm">
          <GitBranch className="w-10 h-10 text-neutral-300 mx-auto" />
          <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest font-mono">
            No entities mapped
          </p>
          <p className="text-[10px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
            Seeding document repository or uploading files triggers automated entity analysis.
          </p>
        </div>
      )}

      {/* Graph Visual Explorer */}
      {!isLoading && !error && nodes.length > 0 && (
        <div className="space-y-6">
          {/* Entity Type Filter Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-neutral-100">
            <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0 mr-1" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono shrink-0">
              Filter:
            </span>
            {entityTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedTypeFilter(type)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wide transition-all cursor-pointer border-none bg-transparent ${
                  selectedTypeFilter === type
                    ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold"
                    : "text-neutral-400 hover:text-neutral-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Zoomable Flowchart Canvas */}
          <div className="bg-neutral-50/40 border border-neutral-200/60 rounded-2xl p-0 relative h-[540px] overflow-hidden shadow-sm select-none">
            {/* Control Bar */}
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 text-[10px] font-mono text-neutral-500 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-neutral-200 shadow-sm">
              <Network className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>
                Flowchart View ({filteredNodes.length} Nodes, {filteredEdges.length} Edges)
              </span>
            </div>

            <div className="absolute top-4 right-4 z-10 flex items-center space-x-1 bg-white border border-neutral-200 p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 border-none bg-transparent cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.2, z / 1.2))}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 border-none bg-transparent cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setPan({ x: 0, y: 0 });
                  setZoom(1);
                }}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 border-none bg-transparent cursor-pointer"
                title="Fit Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive SVG Canvas */}
            <svg
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                const target = e.target as SVGElement;
                if (target.id === "bg-canvas") {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                }
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setPan({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onWheel={(e) => {
                e.preventDefault();
                const zoomFactor = 1.08;
                const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
                setZoom(Math.max(0.2, Math.min(3, newZoom)));
              }}
            >
              <defs>
                <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="12" cy="12" r="1.2" fill="#E2E8F0" />
                </pattern>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0,0 8,3 0,6" fill="#818CF8" />
                </marker>
              </defs>

              {/* Background pattern */}
              <rect id="bg-canvas" width="100%" height="100%" fill="url(#dot-grid)" />

              {/* Zoomable Group */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Draw Edge Connections */}
                {filteredEdges.map((edge) => {
                  const posS = positions[edge.source];
                  const posT = positions[edge.target];
                  if (!posS || !posT) return null;

                  const isSourceDiamond = ["DATE", "AMOUNT", "CLAUSE", "DIAGNOSIS"].includes(nodes.find(n => n.id === edge.source)?.type || "");
                  const isTargetDiamond = ["DATE", "AMOUNT", "CLAUSE", "DIAGNOSIS"].includes(nodes.find(n => n.id === edge.target)?.type || "");

                  const sw = nodeWidth;
                  const sh = isSourceDiamond ? 75 : nodeHeight;
                  const tw = nodeWidth;
                  const th = isTargetDiamond ? 75 : nodeHeight;

                  const startX = posS.x + sw / 2;
                  const startY = posS.y;
                  const endX = posT.x - tw / 2;
                  const endY = posT.y;
                  const cp1x = startX + 60;
                  const cp2x = endX - 60;
                  
                  const pathData = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;

                  return (
                    <g key={edge.id}>
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#818CF8"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        markerEnd="url(#arrowhead)"
                        className="transition-all hover:stroke-indigo-600 hover:stroke-[3px]"
                      />
                      {/* Edge label card */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-35"
                          y="-9"
                          width="70"
                          height="18"
                          rx="4"
                          fill="white"
                          stroke="#E2E8F0"
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="text-[8px] font-mono fill-neutral-500 font-bold"
                        >
                          {edge.type}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* 2. Draw Nodes */}
                {filteredNodes.map((node) => {
                  const pos = positions[node.id];
                  if (!pos) return null;

                  const isSelected = selectedNodeName === node.name;
                  const isDiamond = ["DATE", "AMOUNT", "CLAUSE", "DIAGNOSIS"].includes(node.type);

                  // Setup colors
                  let fillGradient = "#F8FAFC";
                  let strokeColor = "#CBD5E1";
                  let textColor = "#1E293B";
                  let typeColor = "#64748B";

                  if (["SUPPLIER", "VENDOR", "COMPANY", "ORGANIZATION", "FACILITY"].includes(node.type)) {
                    fillGradient = isSelected ? "#EEF2FF" : "#F0F9FF";
                    strokeColor = isSelected ? "#4F46E5" : "#BAE6FD";
                    textColor = isSelected ? "#3730A3" : "#0369A1";
                    typeColor = "#0284C7";
                  } else if (["INVOICE", "PURCHASEORDER", "CONTRACT", "PUBLICATION"].includes(node.type)) {
                    fillGradient = isSelected ? "#FAF5FF" : "#F5F3FF";
                    strokeColor = isSelected ? "#7C3AED" : "#DDD6FE";
                    textColor = isSelected ? "#5B21B6" : "#6D28D9";
                    typeColor = "#7C3AED";
                  } else if (["DATE", "AMOUNT", "REVENUE"].includes(node.type)) {
                    fillGradient = isSelected ? "#ECFDF5" : "#F0FDF4";
                    strokeColor = isSelected ? "#059669" : "#BBF7D0";
                    textColor = isSelected ? "#065F46" : "#15803D";
                    typeColor = "#16A34A";
                  }

                  const displayLabel = node.name.length > 20 ? node.name.substring(0, 18) + "..." : node.name;

                  return (
                    <g
                      key={node.id}
                      onClick={() => {
                        if (onSelectNode) onSelectNode(node.name);
                      }}
                      onDoubleClick={() => setInspectNode(node)}
                      className="cursor-pointer group"
                    >
                      {isDiamond ? (
                        <>
                          <polygon
                            points={`${pos.x},${pos.y - 35} ${pos.x + 85},${pos.y} ${pos.x},${pos.y + 35} ${pos.x - 85},${pos.y}`}
                            fill={fillGradient}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            className="transition-all group-hover:filter group-hover:drop-shadow-md"
                          />
                          <text
                            x={pos.x}
                            y={pos.y - 6}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="text-[10px] font-bold pointer-events-none select-none"
                            style={{ fill: textColor }}
                          >
                            {displayLabel}
                          </text>
                          <text
                            x={pos.x}
                            y={pos.y + 12}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="text-[8px] font-mono font-bold pointer-events-none select-none"
                            style={{ fill: typeColor }}
                          >
                            {node.type}
                          </text>
                        </>
                      ) : (
                        <>
                          <rect
                            x={pos.x - nodeWidth / 2}
                            y={pos.y - nodeHeight / 2}
                            width={nodeWidth}
                            height={nodeHeight}
                            rx="12"
                            fill={fillGradient}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            className="transition-all group-hover:filter group-hover:drop-shadow-md"
                          />
                          <text
                            x={pos.x}
                            y={pos.y - 7}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="text-[10.5px] font-bold pointer-events-none select-none"
                            style={{ fill: textColor }}
                          >
                            {displayLabel}
                          </text>
                          <rect
                            x={pos.x - 35}
                            y={pos.y + 8}
                            width="70"
                            height="12"
                            rx="4"
                            fill="white"
                            stroke={strokeColor}
                            strokeWidth="0.5"
                            className="pointer-events-none"
                          />
                          <text
                            x={pos.x}
                            y={pos.y + 14}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="text-[7.5px] font-mono font-bold pointer-events-none select-none"
                            style={{ fill: typeColor }}
                          >
                            {node.type}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* Node Inspector Modal */}
      {inspectNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-neutral-900 text-sm font-sans">{inspectNode.name}</h4>
              </div>
              <button
                onClick={() => setInspectNode(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-[11px] font-mono">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-400">Entity Type:</span>
                <Badge variant="purple" className="px-2 py-0.5 select-none">{inspectNode.type}</Badge>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-400">Source Document ID:</span>
                <span className="text-neutral-700">{(inspectNode.document_id || "UNKNOWN").substring(0, 16)}...</span>
              </div>
            </div>

            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-[10.5px] font-mono text-indigo-700 overflow-x-auto shadow-inner max-h-60">
              <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-2">
                Node Properties Payload
              </div>
              <pre className="leading-relaxed">{JSON.stringify(inspectNode.properties || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
