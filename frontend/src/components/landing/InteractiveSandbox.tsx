/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  GitBranch,
  Calendar,
  Cpu,
  Play,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { Badge } from "../ui/Badge";

type SandboxTab = "pipeline" | "graph" | "timeline";

export function InteractiveSandbox() {
  const [activeTab, setActiveTab] = useState<SandboxTab>("pipeline");

  // Ingestion Pipeline Simulation State
  const [pipelineState, setPipelineState] = useState<"idle" | "parsing" | "embedding" | "extracting" | "done">("idle");
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const pipelineTimerRef = useRef<any>(null);

  // Graph Simulation State
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Timeline Simulation State
  const [timelineStep, setTimelineStep] = useState(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const timelineTimerRef = useRef<any>(null);

  // Trigger Pipeline Simulation
  const startPipelineSimulation = () => {
    if (pipelineTimerRef.current) clearInterval(pipelineTimerRef.current);
    setPipelineState("parsing");
    setPipelineProgress(15);
    
    let currentProgress = 15;
    pipelineTimerRef.current = setInterval(() => {
      currentProgress += 5;
      if (currentProgress < 40) {
        setPipelineState("parsing");
        setPipelineProgress(currentProgress);
      } else if (currentProgress >= 40 && currentProgress < 75) {
        setPipelineState("embedding");
        setPipelineProgress(currentProgress);
      } else if (currentProgress >= 75 && currentProgress < 100) {
        setPipelineState("extracting");
        setPipelineProgress(currentProgress);
      } else {
        setPipelineState("done");
        setPipelineProgress(100);
        clearInterval(pipelineTimerRef.current);
      }
    }, 120);
  };

  // Timeline Auto Player
  useEffect(() => {
    if (isPlayingTimeline) {
      setTimelineStep(0);
      let currentStep = 0;
      timelineTimerRef.current = setInterval(() => {
        currentStep += 1;
        if (currentStep <= 3) {
          setTimelineStep(currentStep);
        } else {
          setIsPlayingTimeline(false);
          clearInterval(timelineTimerRef.current);
        }
      }, 1000);
    }
    return () => {
      if (timelineTimerRef.current) clearInterval(timelineTimerRef.current);
    };
  }, [isPlayingTimeline]);

  return (
    <div className="w-full bg-white rounded-3xl overflow-hidden border border-neutral-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
      {/* Sandbox Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-neutral-200/60 bg-neutral-50/50 gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold">
            Interactive System Sandbox
          </span>
        </div>

        {/* Floating tabs selector */}
        <div className="flex space-x-1 bg-neutral-100 p-1 rounded-xl">
          {[
            { id: "pipeline", label: "Ingestion Pipeline", icon: Cpu },
            { id: "graph", label: "Knowledge Graph", icon: GitBranch },
            { id: "timeline", label: "Chronology Timeline", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SandboxTab)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/40"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8 bg-white">
        
        {/* TAB 1: INGESTION PIPELINE */}
        {activeTab === "pipeline" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Left Controller Panel */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <Badge variant="info" className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border border-indigo-200 bg-indigo-50 text-indigo-700">
                  PILLAR 1: LAYOUT-AWARE RAG PIPELINE
                </Badge>
                <h4 className="text-xl font-bold tracking-tight text-neutral-900 leading-tight">
                  Dual-Pass Parser & Dynamic Chunking
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Trigger the live pipeline simulation to watch unstructured text parse, embed, and map parameters through layout-aware OCR into a structured schema.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-neutral-100">
                {/* Progress bar */}
                {pipelineState !== "idle" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-neutral-500">
                        {pipelineState === "parsing" && "⚙️ Parsing Document Layout..."}
                        {pipelineState === "embedding" && "📡 Creating 384d FastEmbed..."}
                        {pipelineState === "extracting" && "🧠 LLM Schema Structuring..."}
                        {pipelineState === "done" && "🚀 Ingestion Completed!"}
                      </span>
                      <span className="text-indigo-600 font-bold font-mono">{pipelineProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden border border-neutral-200/50">
                      <div
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-100"
                        style={{ width: `${pipelineProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={startPipelineSimulation}
                  disabled={pipelineState !== "idle" && pipelineState !== "done"}
                  className="w-full py-3 px-4 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-all duration-200 shadow-md flex items-center justify-center space-x-2 disabled:opacity-40 cursor-pointer"
                >
                  {pipelineState === "idle" || pipelineState === "done" ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Trigger Simulation Ingestion</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Mockup Console Screen */}
            <div className="md:col-span-7 bg-[#f8f9fa] border border-neutral-200/60 rounded-2xl p-5 flex flex-col justify-between font-mono text-[11px] min-h-[280px] relative overflow-hidden shadow-inner">
              <div className="space-y-4 relative z-10 flex-grow">
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-200/60 pb-3">
                  <span>SYSTEM_STREAM: ingestion_sim</span>
                  <span>status: 200 OK</span>
                </div>

                <div className="space-y-2.5 text-neutral-600 font-mono text-[10.5px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-400">&gt;</span>
                    <span>hashlib.sha256(file).hexdigest()</span>
                    {pipelineState !== "idle" && (
                      <span className="text-indigo-600 font-bold">
                        ➔ 3f8a9...e28d
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-400">&gt;</span>
                    <span>PyMuPDF parsing layout coordinates...</span>
                    {pipelineState !== "idle" && pipelineState !== "parsing" && (
                      <span className="text-emerald-600 font-bold">SUCCESS</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-neutral-400">&gt;</span>
                    <span>VectorRepository: fastembed_384d</span>
                    {pipelineState === "extracting" || pipelineState === "done" ? (
                      <span className="text-indigo-600 font-bold">12 chunks inserted</span>
                    ) : pipelineState === "embedding" ? (
                      <span className="text-amber-600 animate-pulse">embedding...</span>
                    ) : null}
                  </div>
                </div>

                {/* Final Pydantic Schema Model Output Card */}
                {pipelineState === "done" && (
                  <div className="mt-4 p-3 bg-white rounded-xl border border-neutral-200 shadow-sm space-y-2.5 animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-neutral-800 font-semibold text-xs font-sans">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Pydantic Model Validated</span>
                      </div>
                      <Badge variant="success" className="text-[8px] font-mono px-2 py-0.5 border border-emerald-200 bg-emerald-50 text-emerald-700">COMPLIANT</Badge>
                    </div>
                    <pre className="text-indigo-600 text-[10px] bg-[#f8f9fa] p-3 rounded-lg border border-neutral-200 max-h-28 overflow-y-auto">
{`{
  "document_type": "INVOICE",
  "invoice_number": "INV-9900",
  "issuer": "Nexus AI Inc",
  "total_amount": 13500.00,
  "currency": "USD",
  "confidence_score": 0.985
}`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROWING GRAPH */}
        {activeTab === "graph" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Left Controller Panel */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <Badge variant="purple" className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700">
                  PILLAR 2: MULTI-DOCUMENT KNOWLEDGE CLOUD
                </Badge>
                <h4 className="text-xl font-bold tracking-tight text-neutral-900 leading-tight">
                  Interconnected Entity Mapping
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Hover over the nodes on the canvas. See how DocuFlow AI connects isolated documents across supply chains into unified entity linkages.
                </p>
              </div>

              {/* Inspector details on hover */}
              <div className="p-4 bg-[#f8f9fa] border border-neutral-200 rounded-xl space-y-2 min-h-[100px] flex flex-col justify-center shadow-inner">
                {hoveredNode ? (
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase tracking-widest block font-mono font-bold">Entity Inspector</span>
                    <span className="text-[11px] font-semibold text-neutral-700 font-mono block mt-1">
                      Type: {hoveredNode.split(":")[0]}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 font-mono block mt-0.5">
                      Name: {hoveredNode.split(":")[1]}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-neutral-400 text-center font-mono leading-relaxed">
                    Hover over nodes to inspect structural entity relationships.
                  </div>
                )}
              </div>
            </div>

            {/* Right Canvas Area */}
            <div className="md:col-span-7 bg-[#f8f9fa] border border-neutral-200/60 rounded-2xl p-6 flex items-center justify-center min-h-[280px] relative overflow-hidden shadow-inner bg-grid-dots">
              {/* Glowing SVG connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <line
                  x1="50%"
                  y1="25%"
                  x2="25%"
                  y2="55%"
                  className={`stroke-[1.5] transition-all duration-300 ${
                    hoveredNode?.includes("Supplier") || hoveredNode?.includes("Invoice")
                      ? "stroke-indigo-500 animate-flow"
                      : "stroke-neutral-200"
                  }`}
                  strokeDasharray="4"
                />
                <line
                  x1="50%"
                  y1="25%"
                  x2="75%"
                  y2="55%"
                  className={`stroke-[1.5] transition-all duration-300 ${
                    hoveredNode?.includes("Supplier") || hoveredNode?.includes("PO")
                      ? "stroke-purple-500 animate-flow"
                      : "stroke-neutral-200"
                  }`}
                  strokeDasharray="4"
                />
                <line
                  x1="25%"
                  y1="55%"
                  x2="50%"
                  y2="85%"
                  className={`stroke-[1.5] transition-all duration-300 ${
                    hoveredNode?.includes("Invoice") || hoveredNode?.includes("Amount")
                      ? "stroke-indigo-500 animate-flow"
                      : "stroke-neutral-200"
                  }`}
                  strokeDasharray="4"
                />
                <line
                  x1="75%"
                  y1="55%"
                  x2="50%"
                  y2="85%"
                  className={`stroke-[1.5] transition-all duration-300 ${
                    hoveredNode?.includes("PO") || hoveredNode?.includes("Amount")
                      ? "stroke-purple-500 animate-flow"
                      : "stroke-neutral-200"
                  }`}
                  strokeDasharray="4"
                />
              </svg>

              <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-4 font-mono text-[10px]">
                {/* Node 1: Top (Supplier) */}
                <div
                  onMouseEnter={() => setHoveredNode("Supplier:Nexus AI Inc")}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`px-4 py-2 rounded-xl border bg-white cursor-pointer transition-all duration-300 flex items-center space-x-2 ${
                    hoveredNode === "Supplier:Nexus AI Inc"
                      ? "border-indigo-500 text-indigo-600 scale-105 shadow-md"
                      : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  🏢 Supplier: Nexus AI
                </div>

                {/* Nodes 2 & 3: Middle Left / Middle Right */}
                <div className="flex justify-between w-full px-6 sm:px-16 my-10">
                  <div
                    onMouseEnter={() => setHoveredNode("Invoice:INV-9900")}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`px-4 py-2 rounded-xl border bg-white cursor-pointer transition-all duration-300 flex items-center space-x-2 ${
                      hoveredNode === "Invoice:INV-9900"
                        ? "border-indigo-500 text-indigo-600 scale-105 shadow-md"
                        : "border-neutral-200 text-neutral-600"
                    }`}
                  >
                    📄 Invoice: INV-9900
                  </div>

                  <div
                    onMouseEnter={() => setHoveredNode("PO:PO-8877")}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`px-4 py-2 rounded-xl border bg-white cursor-pointer transition-all duration-300 flex items-center space-x-2 ${
                      hoveredNode === "PO:PO-8877"
                        ? "border-purple-500 text-purple-600 scale-105 shadow-md"
                        : "border-neutral-200 text-neutral-600"
                    }`}
                  >
                    📝 PO: PO-8877
                  </div>
                </div>

                {/* Node 4: Bottom (Amount value) */}
                <div
                  onMouseEnter={() => setHoveredNode("Amount:13,500.00 USD")}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`px-4 py-2 rounded-xl border bg-white cursor-pointer transition-all duration-300 flex items-center space-x-2 ${
                    hoveredNode === "Amount:13,500.00 USD"
                      ? "border-indigo-500 text-indigo-600 scale-105 shadow-md"
                      : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  💰 Amount: $13,500
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIMELINE ANIMATION */}
        {activeTab === "timeline" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Left Controller Panel */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <Badge variant="warning" className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border border-amber-200 bg-amber-50 text-amber-700">
                  PILLAR 3: SEQUENCE LIFECYCLE RECONSTRUCTION
                </Badge>
                <h4 className="text-xl font-bold tracking-tight text-neutral-900 leading-tight">
                  Chronological Transaction Sequencing
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Click {"'Play Sequencing'"} to watch milestone events dynamically align, showing document relationships along a timeline scale.
                </p>
              </div>

              <div>
                <button
                  onClick={() => {
                    setTimelineStep(0);
                    setIsPlayingTimeline(true);
                  }}
                  disabled={isPlayingTimeline}
                  className="w-full py-3 px-4 bg-neutral-950 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-all duration-200 shadow-md flex items-center justify-center space-x-2 disabled:opacity-40 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPlayingTimeline ? "Sequencing Timeline..." : "Play Sequencing"}</span>
                </button>
              </div>
            </div>

            {/* Right Horizontal Timeline Slider */}
            <div className="md:col-span-7 bg-[#f8f9fa] border border-neutral-200/60 rounded-2xl p-6 flex flex-col justify-center min-h-[280px] relative overflow-hidden shadow-inner">
              <div className="relative border-l border-neutral-200 pl-6 space-y-5">
                {[
                  { date: "Jan 10, 2026", event: "Master Agreement signed", type: "MSA-2026-90", status: "success" },
                  { date: "Jan 12, 2026", event: "Mutual NDA Authorized", type: "NDA-2026-11", status: "success" },
                  { date: "Mar 01, 2026", event: "Amendment #1 limit upgrades", type: "AMEND-2026-01", status: "success" },
                  { date: "Jun 15, 2026", event: "SOC 2 compliance validation", type: "AUDIT-2026-L", status: "info" },
                ].map((step, idx) => {
                  const isPassed = timelineStep >= idx;
                  const isCurrent = timelineStep === idx && isPlayingTimeline;
                  return (
                    <div
                      key={idx}
                      className={`relative transition-all duration-500 ${
                        isPassed ? "opacity-100 translate-x-0" : "opacity-30 translate-x-1"
                      }`}
                    >
                      {/* Node Bullet */}
                      <div
                        className={`absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                          isCurrent
                            ? "bg-indigo-500 ring-pulse"
                            : isPassed
                            ? "bg-indigo-500"
                            : "bg-neutral-300"
                        }`}
                      />
                      <div className="flex justify-between items-start font-mono text-[10px]">
                        <div>
                          <span className="text-[9px] text-neutral-400 font-bold block">{step.date}</span>
                          <span className="text-neutral-800 block mt-0.5 font-sans text-xs">{step.event}</span>
                        </div>
                        <Badge variant={isPassed ? (step.status as any) : "default"} className="text-[8px] font-mono px-2 py-0.5">
                          {step.type}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
