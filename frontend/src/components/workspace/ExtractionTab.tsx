import React, { useState } from "react";
import { Cpu, ShieldCheck, Sparkles, Eye, Loader2, AlertCircle, Download } from "lucide-react";
import { DocumentItem, ExtractionSchemaItem, ExtractionResult } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ProvenanceModal } from "./ProvenanceModal";

interface ExtractionTabProps {
  documents?: DocumentItem[];
  schemas?: ExtractionSchemaItem[];
  onRunExtraction: (documentId: string, schemaId?: string) => Promise<ExtractionResult | null>;
  isExtracting: boolean;
  extractionResult?: ExtractionResult | null;
  error?: string | null;
}

export function ExtractionTab({
  documents = [],
  schemas = [],
  onRunExtraction,
  isExtracting,
  extractionResult,
  error,
}: ExtractionTabProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const docList = Array.isArray(documents) ? documents : [];
  const schemaList = Array.isArray(schemas) ? schemas : [];

  const handleRun = async () => {
    if (!selectedDocId) return;
    await onRunExtraction(selectedDocId, selectedSchemaId || undefined);
  };

  const citations = Array.isArray(extractionResult?.provenance?.citations)
    ? extractionResult!.provenance!.citations
    : [];

  const exportExtractionJSON = () => {
    if (!extractionResult?.structured_data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(extractionResult.structured_data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `docflow_extraction_${extractionResult.document_id}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Run Trigger Form */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center">
          <Cpu className="w-5 h-5 mr-2 text-indigo-600" /> Execute AI Structured Extraction
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 uppercase font-mono">
              Select Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full bg-white border border-neutral-200 text-neutral-800 text-xs rounded-xl p-3 focus:border-indigo-500 focus:outline-none font-mono shadow-sm"
            >
              <option value="">-- Choose Document --</option>
              {docList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} ({d.category || "GENERAL"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 uppercase font-mono">
              Target Schema Template
            </label>
            <select
              value={selectedSchemaId}
              onChange={(e) => setSelectedSchemaId(e.target.value)}
              className="w-full bg-white border border-neutral-200 text-neutral-800 text-xs rounded-xl p-3 focus:border-indigo-500 focus:outline-none font-mono shadow-sm"
            >
              <option value="">Auto-Detect / General Extraction</option>
              {schemaList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleRun}
              disabled={!selectedDocId || isExtracting}
              isLoading={isExtracting}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Run AI Extractor
            </Button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isExtracting && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-neutral-700">Executing LLM extraction & schema validation...</p>
        </div>
      )}

      {/* Error state */}
      {!isExtracting && error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">Extraction Error:</span> {error}
          </div>
        </div>
      )}

      {/* Extraction Output & Citation Inspector */}
      {!isExtracting && extractionResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* JSON Structured Data */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
              <h4 className="font-bold text-neutral-900 text-xs flex items-center">
                <Cpu className="w-4 h-4 mr-2 text-indigo-600" /> Extracted Structured Data
              </h4>
              <div className="flex items-center space-x-2">
                {extractionResult.structured_data && (
                  <button
                    onClick={exportExtractionJSON}
                    className="px-2.5 py-1 bg-white hover:bg-neutral-50 text-[10px] text-neutral-700 rounded border border-neutral-200 flex items-center transition-colors font-bold cursor-pointer"
                    title="Export extracted JSON data"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Export JSON
                  </button>
                )}
                <Badge variant={extractionResult.status === "SUCCESS" ? "success" : "danger"}>
                  {extractionResult.status || "UNKNOWN"}
                </Badge>
              </div>
            </div>

            <pre className="bg-[#f8f9fa] p-4 rounded-xl font-mono text-xs text-indigo-600 overflow-x-auto border border-neutral-200/60 max-h-96">
              {JSON.stringify(extractionResult.structured_data || {}, null, 2)}
            </pre>
          </div>

          {/* Citation Provenance Panel */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
              <h4 className="font-bold text-neutral-900 text-xs flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-indigo-600" /> Citation & Evidence Provenance
              </h4>

              {extractionResult.provenance && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1 bg-white hover:bg-indigo-50/30 border border-neutral-200 hover:border-indigo-500 rounded-lg text-[10px] font-bold text-neutral-700 hover:text-indigo-600 transition-all flex items-center cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Inspect Reasoning Trail
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {citations.length === 0 ? (
                <div className="text-xs text-neutral-400 p-4 bg-[#f8f9fa] rounded-lg text-center border border-neutral-200/60 font-mono">
                  No explicit citation snippets returned.
                </div>
              ) : (
                citations.map((cit, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f8f9fa] rounded-lg border border-neutral-200/60 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-600">
                        Citation #{idx + 1}
                      </span>
                      <span className="text-emerald-600 font-bold font-mono">
                        {((cit?.confidence_score ?? 1.0) * 100).toFixed(1)}% Score
                      </span>
                    </div>
                    <p className="text-neutral-700 font-mono italic bg-white border border-neutral-200/40 p-2 rounded leading-relaxed">
                      {"\""}{cit?.snippet || ""}{"\""}
                    </p>
                    <div className="text-[10px] text-neutral-400 flex justify-between font-mono">
                      <span>Strategy: {cit?.retrieval_strategy || "SEMANTIC"}</span>
                      <span>Page: {cit?.page_number || 1}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provenance & Reasoning Modal */}
      {extractionResult?.provenance && (
        <ProvenanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          provenance={extractionResult.provenance}
        />
      )}
    </div>
  );
}
