import React from "react";
import {
  FileText,
  Boxes,
  GitBranch,
  Search,
  Zap,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Badge } from "../ui/Badge";

export function Features() {
  const capabilities = [
    {
      num: "01",
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      title: "Layout-Aware Parsing Engine",
      desc: "Our dual-pass text parser preserves reading flows, column grids, and complex table matrices. Scanned items route automatically to OCR fallbacks with coordinate metadata preserved.",
      tag: "Ingestion Engine",
      mockWidget: (
        <div className="w-full bg-[#f8f9fa] rounded-2xl border border-neutral-200/50 p-4 font-mono text-[9px] text-neutral-600 space-y-2">
          <div className="flex justify-between text-[8px] text-neutral-400 border-b border-neutral-200 pb-1.5 font-sans">
            <span>parsing_log_feed</span>
            <span>Page 1 of 4</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-neutral-400">&gt;</span>
            <span className="text-neutral-800">Preserving 2-Column Table Grid structure...</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-neutral-200/40 text-[8.5px] text-neutral-800 space-y-1">
            <div className="font-bold border-b border-neutral-100 pb-1 flex justify-between">
              <span>Item Description</span>
              <span>Total</span>
            </div>
            <div className="flex justify-between">
              <span>Nexus AI API Seed Rate</span>
              <span className="text-indigo-600">$13,500.00</span>
            </div>
          </div>
          <div className="text-emerald-600 font-semibold flex items-center">
            ✓ Reading flow coordinate map succeeded
          </div>
        </div>
      ),
    },
    {
      num: "02",
      icon: <Search className="w-5 h-5 text-indigo-600" />,
      title: "HNSW Semantic Vector Retrieval",
      desc: "Powered by pgvector. Text chunks map to 384d vector coordinates using FastEmbed models. Real-time nearest-neighbor calculations locate citation fragments under 10ms.",
      tag: "Vector Index",
      mockWidget: (
        <div className="w-full bg-[#f8f9fa] rounded-2xl border border-neutral-200/50 p-4 font-mono text-[9px] text-neutral-600 space-y-2.5">
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg px-2 py-1 font-sans">
            <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
            <input type="text" readOnly value="Show Nexus AI total rate" className="w-full bg-transparent text-[10px] text-neutral-800 focus:outline-none" />
          </div>
          <div className="space-y-1">
            <div className="text-neutral-400 text-[8px]">TOP COVERS CORES RETRIEVED:</div>
            <div className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-neutral-800 text-[8.5px]">
              <span className="font-bold text-indigo-600">Chunk #12 (Score: 0.94)</span>: "...Nexus AI total invoice is $13,500..."
            </div>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      icon: <Boxes className="w-5 h-5 text-indigo-600" />,
      title: "Pydantic Schema-Enforcer",
      desc: "Guarantees database structures. Converts arbitrary user JSON into runtime Pydantic validation models, forcing schema compliance with auto-corrective LLM loops.",
      tag: "Validation Engine",
      mockWidget: (
        <div className="w-full bg-[#f8f9fa] rounded-2xl border border-neutral-200/50 p-4 font-mono text-[9px] text-neutral-600 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-neutral-800">DynamicValidatorModel</span>
            <Badge variant="success" className="text-[8px] font-mono border border-emerald-200 bg-emerald-50 text-emerald-700">COMPLIANT</Badge>
          </div>
          <pre className="text-indigo-600 bg-white border border-neutral-200/60 p-2.5 rounded-lg text-[8.5px] max-h-24 overflow-y-auto leading-relaxed">
{`class InvoiceSchema(BaseModel):
    invoice_number: str
    total_amount: float
    currency: str`}
          </pre>
        </div>
      ),
    },
    {
      num: "04",
      icon: <Zap className="w-5 h-5 text-indigo-600" />,
      title: "3-Way Billing Reconciliation",
      desc: "Cross-references purchase orders, delivery notes, and invoices automatically. Spotlights item discrepancy, tax differences, and supplier mismatches with severity scoring.",
      tag: "Audit Auditor",
      mockWidget: (
        <div className="w-full bg-[#f8f9fa] rounded-2xl border border-neutral-200/50 p-4 font-mono text-[9px] text-neutral-600 space-y-2">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
            <span className="font-bold text-neutral-800">3-Way Reconciliation Audit</span>
            <span className="text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-full px-2 py-0.2 text-[8px]">WARNING</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-neutral-400">PO #8877 total:</span>
              <span className="text-neutral-800 font-bold font-sans">$13,200.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Invoice #INV-9900 total:</span>
              <span className="text-rose-600 font-bold font-sans">$13,500.00</span>
            </div>
            <div className="text-[8px] text-rose-500 font-bold">
              ✕ Total mismatch: $300 (Exceeds tolerance limit of 2%)
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-28 bg-[#fcfcfd] border-b border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Editorial Section Header */}
        <div className="max-w-3xl text-left mb-20">
          <Badge variant="info" className="text-[9px] uppercase tracking-widest font-mono mb-4 px-2 py-0.5">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
            Engineered for production <br />
            document intelligence.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-6 leading-relaxed max-w-xl">
            DocuFlow AI provides robust technical abstractions designed for complete transparency, data validation, and multi-document reasoning.
          </p>
        </div>

        {/* Storytelling Grid Showcase (Lumen style: rounded cards, white background, grey mockups) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="group p-8 sm:p-10 bg-white border border-neutral-200/50 rounded-[2rem] shadow-[0_4px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.03)] hover:border-neutral-300 transition-all duration-500 flex flex-col justify-between min-h-[380px]"
            >
              {/* Top part */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    {cap.icon}
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono tracking-wider font-bold">
                    STAGE {cap.num}
                  </span>
                </div>

                <div className="space-y-2">
                  <Badge variant="purple" className="text-[8px] font-mono uppercase px-2 py-0.5">
                    {cap.tag}
                  </Badge>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 font-sans group-hover:text-indigo-600 transition-colors">
                    {cap.title}
                  </h3>
                </div>

                <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                  {cap.desc}
                </p>
              </div>

              {/* Mockup visual block in the card */}
              <div className="mt-8 flex-grow flex items-end">
                {cap.mockWidget}
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
