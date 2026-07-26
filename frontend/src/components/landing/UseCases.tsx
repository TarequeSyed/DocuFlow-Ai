import React, { useState } from "react";
import { ShoppingBag, Scale, FileSpreadsheet, BookOpen, Stethoscope, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Badge } from "../ui/Badge";

export function UseCases() {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  const cases = [
    {
      id: "procurement",
      icon: <ShoppingBag className="w-5 h-5 text-indigo-600" />,
      title: "Procurement & B2B Supply Chain",
      category: "Procurement",
      badge: "3-Way Billing Audit",
      shortDesc: "Automated 3-way matching between Quotations, Purchase Orders, Delivery Notes, Invoices, and Payment Receipts.",
      problem: "Procurement teams manually compare line items, taxes, and totals across disparate PDFs to catch overbilling.",
      solution: "DocuFlow AI automatically builds document timeline lifecycles, links supplier entities, and flags line item discrepancies.",
      metrics: ["100% Automated 3-Way Match", "Instant Discrepancy Flagging", "Supplier Entity Linkage"],
    },
    {
      id: "legal",
      icon: <Scale className="w-5 h-5 text-indigo-600" />,
      title: "Legal Contract Analysis",
      category: "Legal Tech",
      badge: "Timeline & Clause Provenance",
      shortDesc: "Reconstruct multi-document timelines across contract drafts, amendments, non-disclosure agreements, and warranties.",
      problem: "Lawyers spend hours tracing clause evolution and effective dates across multiple contract addendums.",
      solution: "Chronological timeline engine orders contract revisions sequentially and highlights clause changes with page snippet citations.",
      metrics: ["Contract Version Sequencing", "Clause Citation Provenance", "Effective Date Tracking"],
    },
    {
      id: "finance",
      icon: <FileSpreadsheet className="w-5 h-5 text-indigo-600" />,
      title: "Financial Auditing & Compliance",
      category: "Finance",
      badge: "Schema Extraction",
      shortDesc: "Extract key financial parameters, tax breakdowns, due dates, and bank remittance details with 100% citation evidence.",
      problem: "Financial auditors require verifiable evidence for extracted numbers before submitting regulatory filings.",
      solution: "Dynamic Pydantic schema validation ensures 100% type accuracy, while the explainability engine attaches exact source text snippets.",
      metrics: ["Zero Hallucination Tax Extracts", "Remittance Verification", "Full Audit Provenance"],
    },
    {
      id: "research",
      icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
      title: "Technical Research & Literature Review",
      category: "Research",
      badge: "pgvector Semantic Search",
      shortDesc: "Perform high-recall vector semantic search across hundreds of academic papers and technical specs.",
      problem: "Researchers struggle to find specific methodology details across vast collections of PDF research literature.",
      solution: "SentenceTransformers BGE-small embeddings and pgvector HNSW indexing retrieve high-relevance paper sections in < 10ms.",
      metrics: ["< 10ms HNSW Vector Queries", "Academic Citation Links", "Context-Aware Retrieval"],
    },
    {
      id: "healthcare",
      icon: <Stethoscope className="w-5 h-5 text-indigo-600" />,
      title: "Healthcare Medical Records",
      category: "Healthcare",
      badge: "Entity Linking",
      shortDesc: "Synthesize patient histories across discharge summaries, lab test reports, prescriptions, and clinical notes.",
      problem: "Clinical records are fragmented across unstructured physician notes, diagnostic lab outputs, and referral slips.",
      solution: "Knowledge graph engine links patient symptoms, diagnoses, medications, and clinical dates into a unified history.",
      metrics: ["Patient History Graph", "Lab Test Reconciliation", "Clinical Date Normalization"],
    },
    {
      id: "insurance",
      icon: <ShieldAlert className="w-5 h-5 text-indigo-600" />,
      title: "Insurance Claims Validation",
      category: "Insurance",
      badge: "Cross-Doc Audit",
      shortDesc: "Cross-reference claim applications against accident reports, police receipts, and repair bills.",
      problem: "Insurance adjusters manually audit claim amounts against third-party repair estimates and police incident logs.",
      solution: "Cross-document reconciliation engine cross-examines claim items against repair invoices to detect fraudulent mismatches.",
      metrics: ["Fraud Discrepancy Detection", "Claim Value Verification", "Multi-Document Validation"],
    },
  ];

  const currentCase = cases[selectedCaseIdx];

  return (
    <section id="use-cases" className="py-20 relative bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="success" className="text-[9px] uppercase tracking-widest font-mono mb-4 px-2 py-0.5">
            Real-World Applications
          </Badge>
          <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl mt-4 tracking-tight leading-tight">
            Domain-Specific Document Intelligence Use Cases
          </h2>
          <p className="mt-4 text-neutral-500 text-sm max-w-xl mx-auto leading-relaxed">
            Designed for high-stakes enterprise workflows where accuracy, explainability, and validation are mandatory.
          </p>
        </div>

        {/* Use Case Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 justify-start sm:justify-center">
          {cases.map((c, idx) => {
            const isActive = selectedCaseIdx === idx;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCaseIdx(idx)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-950 shadow-sm"
                    : "bg-white text-neutral-500 border-neutral-200 hover:text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                {c.icon}
                <span>{c.category}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Use Case Detail Inspector Card */}
        <div className="bg-white border border-neutral-200/60 rounded-[1.5rem] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 text-indigo-600">{currentCase.icon}</div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">{currentCase.title}</h3>
                <span className="text-[10px] font-mono text-indigo-600 font-semibold">{currentCase.category} Use Case</span>
              </div>
            </div>
            <Badge variant="success" className="font-bold">{currentCase.badge}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-100/60 space-y-2">
              <span className="text-rose-700 font-bold uppercase tracking-wider text-[10px]">
                Industry Challenge
              </span>
              <p className="text-neutral-700 font-sans text-xs leading-relaxed">{currentCase.problem}</p>
            </div>

            <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/60 space-y-2">
              <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">
                DocuFlow AI Solution
              </span>
              <p className="text-neutral-700 font-sans text-xs leading-relaxed">{currentCase.solution}</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {currentCase.metrics.map((m, mIdx) => (
              <div
                key={mIdx}
                className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/60 text-center text-xs font-bold text-neutral-700 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
