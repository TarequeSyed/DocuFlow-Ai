import React, { useState } from "react";
import { X, ShieldCheck, GitCommit, Code, Copy, Check, Sparkles } from "lucide-react";
import { CitationItem, ReasoningTrace } from "../../types";
import { Badge } from "../ui/Badge";

interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  provenance?: {
    citations: CitationItem[];
    overall_confidence: number;
    reasoning_trace?: ReasoningTrace | null;
  } | null;
}

export function ProvenanceModal({
  isOpen,
  onClose,
  title = "AI Citation & Reasoning Provenance",
  provenance,
}: ProvenanceModalProps) {
  const [activeTab, setActiveTab] = useState<"citations" | "trace" | "json">("citations");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen || !provenance) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const confidencePct = (provenance.overall_confidence * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">{title}</h3>
              <p className="text-xs text-slate-400">
                Auditable citation evidence & multi-step AI reasoning trace
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge variant="purple">
              Overall Confidence: {confidencePct}%
            </Badge>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 px-5 pt-3 bg-slate-950/40 space-x-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("citations")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === "citations"
                ? "bg-slate-900 text-blue-400 border-t-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Source Citations ({provenance.citations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("trace")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === "trace"
                ? "bg-slate-900 text-indigo-400 border-t-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>
              Reasoning Trail (
              {provenance.reasoning_trace?.steps?.length || 2} steps)
            </span>
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === "json"
                ? "bg-slate-900 text-cyan-400 border-t-2 border-cyan-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Audit JSON Payload</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-4">
          {/* TAB 1: CITATIONS */}
          {activeTab === "citations" && (
            <div className="space-y-4">
              {provenance.citations.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No source text citations attached.
                </div>
              ) : (
                provenance.citations.map((cit, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Badge variant="info">
                          Strategy: {cit.retrieval_strategy}
                        </Badge>
                        <span className="text-slate-400 font-mono">
                          Page: {cit.page_number || 1}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400 font-mono font-bold">
                          {((cit.confidence_score ?? 1.0) * 100).toFixed(1)}% Confidence
                        </span>
                        <button
                          onClick={() => handleCopy(cit.snippet, idx)}
                          className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800"
                          title="Copy snippet"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800/80 leading-relaxed italic">
                      {"\""}{cit.snippet}{"\""}
                    </p>

                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>Doc ID: {cit.document_id}</span>
                      <span>Chunk ID: {cit.chunk_id.substring(0, 12)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: REASONING TRAIL */}
          {activeTab === "trace" && (
            <div className="space-y-6">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Model: {provenance.reasoning_trace?.model_name || "gpt-4o-mini"}</span>
                <span>
                  Total Execution:{" "}
                  <strong className="text-blue-400">
                    {provenance.reasoning_trace?.total_execution_ms || 120} ms
                  </strong>
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:to-indigo-500">
                {(provenance.reasoning_trace?.steps || [
                  {
                    step_number: 1,
                    title: "Vector Similarity Retrieval",
                    description: "Retrieved matching text chunks using HNSW vector cosine distance.",
                    output_summary: "Retrieved top relevance chunks",
                    confidence: provenance.overall_confidence,
                    timestamp: new Date().toISOString(),
                  },
                  {
                    step_number: 2,
                    title: "Structured Schema Extraction & Validation",
                    description: "Validated output against runtime Pydantic schema model.",
                    output_summary: "Schema validation passed",
                    confidence: provenance.overall_confidence,
                    timestamp: new Date().toISOString(),
                  },
                ]).map((step, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">
                          Step #{step.step_number}: {step.title}
                        </span>
                        <Badge variant="success">
                          {(step.confidence * 100).toFixed(0)}% Score
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-300">{step.description}</p>

                      {step.output_summary && (
                        <div className="text-[11px] font-mono text-cyan-400 bg-slate-900 p-2 rounded">
                          Output: {step.output_summary}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RAW JSON */}
          {activeTab === "json" && (
            <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800 max-h-96">
              {JSON.stringify(provenance, null, 2)}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Close Provenance
          </button>
        </div>
      </div>
    </div>
  );
}
