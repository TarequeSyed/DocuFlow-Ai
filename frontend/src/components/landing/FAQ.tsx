import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Badge } from "../ui/Badge";

export function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "architecture", label: "Architecture & DB" },
    { id: "ai", label: "AI & Retrieval" },
    { id: "explainability", label: "Explainability & Validation" },
    { id: "deployment", label: "Deployment & DevOps" },
  ];

  const faqs = [
    {
      cat: "architecture",
      q: "Why use PostgreSQL + pgvector instead of a standalone vector database like Pinecone?",
      a: "Using pgvector inside PostgreSQL maintains ACID transactional consistency between document metadata, extracted schemas, graph entities, and vector embeddings within a single database. It eliminates cross-database synchronization overhead, simplifies Docker deployment, and supports relational JOIN queries combining metadata filters with vector cosine distance search.",
    },
    {
      cat: "architecture",
      q: "Why select HNSW indexing over IVFFlat for pgvector?",
      a: "HNSW (Hierarchical Navigable Small World) indexing provides superior recall accuracy and query speed (< 10ms) without requiring index rebuilds when new document embeddings are inserted. IVFFlat requires periodic retraining as dataset sizes grow.",
    },
    {
      cat: "ai",
      q: "How does DocuFlow AI handle scanned PDFs or images?",
      a: "The IntelligentParserOrchestrator uses a dual-pass parsing strategy. It first attempts native text extraction via PyMuPDF. If native text yield is empty or malformed (scanned image PDF), it routes the binary stream to Tesseract OCR to extract text layers with layout preservation.",
    },
    {
      cat: "ai",
      q: "Which embedding model is used and can it run locally?",
      a: "DocuFlow AI defaults to local FastEmbed (BAAI/bge-small-en-v1.5) generating 384-dimensional vector embeddings without external API calls or cost. It can be toggled via environment variables to use OpenAI text-embedding-3-small.",
    },
    {
      cat: "explainability",
      q: "How does DocuFlow AI prevent LLM hallucinations during extraction?",
      a: "DocuFlow AI implements a 3-layer defense: (1) Context Grounding passes only relevant chunks retrieved via vector search; (2) Runtime Pydantic Enforcer validates extracted JSON against dynamic type definitions; (3) Explainability Engine attaches snippet citations, page references, and confidence scores for 100% auditability.",
    },
    {
      cat: "explainability",
      q: "What is contained within the Reasoning Trace?",
      a: "The ReasoningTrace records step-by-step pipeline execution milestones (Vector Similarity Retrieval score, Dynamic Schema Validation, Entity Linking, 3-Way Reconciliation Audit) with input/output summaries, step confidence scores, execution times in milliseconds, and model metadata.",
    },
    {
      cat: "deployment",
      q: "How is 1-Click Demo Workspace Seeding implemented?",
      a: "Clicking 'Load Demo Dataset' sends a REST request to POST /api/v1/demo/seed. The backend demo_seeder service saves 6 realistic procurement files to disk and executes document processing (parsing, chunking, embedding generation, knowledge graph linking, timeline ordering, and schema extractions) in sequence.",
    },
    {
      cat: "deployment",
      q: "Can DocuFlow AI be deployed via Docker Compose?",
      a: "Yes! The repository includes production-ready docker-compose.yml and docker-compose.prod.yml configurations containing PostgreSQL 16 (pgvector), FastAPI backend, and Next.js 16 frontend containers with shared volume persistent storage.",
    },
  ];

  const filteredFaqs =
    selectedCategory === "all"
      ? faqs
      : faqs.filter((f) => f.cat === selectedCategory);

  return (
    <section id="faq" className="py-20 relative bg-[#fcfcfd]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="purple" className="text-[9px] uppercase tracking-widest font-mono mb-4 px-2 py-0.5">
            Technical Knowledge Base
          </Badge>
          <h2 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl mt-4 tracking-tight leading-tight">
            Frequently Asked Technical Questions
          </h2>
          <p className="mt-4 text-neutral-500 text-sm max-w-xl mx-auto leading-relaxed">
            Architectural decisions, vector retrieval design, AI workflows, and deployment options.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 justify-start sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-neutral-900 text-white border-neutral-950 shadow-sm"
                  : "bg-white text-neutral-500 border-neutral-200 hover:text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-neutral-200/60 overflow-hidden transition-all duration-200 hover:border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.005)]"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between font-bold text-neutral-900 hover:text-indigo-600 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <span className="text-sm sm:text-base pr-4 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2.5 text-indigo-600 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pt-4 bg-neutral-50/30 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
