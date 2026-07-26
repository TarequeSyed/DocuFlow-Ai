import React, { useState } from "react";
import { Cpu, Server, Database, ShieldCheck, CheckCircle2, Layout } from "lucide-react";
import { Badge } from "../ui/Badge";

export function TechStack() {
  const [activeLayerIdx, setActiveLayerIdx] = useState(0);

  const layers = [
    {
      id: "presentation",
      name: "01. Presentation Interface",
      icon: <Layout className="w-4 h-4 text-indigo-600" />,
      tech: "Next.js 16 (App Router) + React 19 + TailwindCSS v4",
      desc: "An asymmetric editorial landing page linked directly to a responsive multi-panel cockpit workspace. Features inline citation inspection modal triggers and real-time visualization overlays.",
      components: [
        "Editorial Landing Pages (Hero, Storytelling Features, System Blueprint)",
        "Workspace Cockpit View Tabs (Dashboard, Documents, Extraction, Search, Graph, Timeline, Reconciliation)",
        "Frosted-Glass Citation & Provenance Audit modal",
      ],
    },
    {
      id: "api",
      name: "02. API & Routing Core",
      icon: <Server className="w-4 h-4 text-indigo-600" />,
      tech: "FastAPI + Pydantic v2 + Asynchronous Uvicorn",
      desc: "REST endpoint layer built for complete separation of concerns. Orchestrates CORS policies, validates schema requests, and delegates heavy parsing to asynchronous background workers.",
      components: [
        "POST /api/v1/documents - Deduplicating document parser triggers",
        "POST /api/v1/extractions - Schema-enforced validator core",
        "POST /api/v1/search - Semantic vector index queries",
        "POST /api/v1/demo/seed - Automated domain dataset seeding",
      ],
    },
    {
      id: "engines",
      name: "03. Intelligence Processing Engines",
      icon: <Cpu className="w-4 h-4 text-indigo-600" />,
      tech: "Python Async Modular Services",
      desc: "Isolated domain services performing layout-aware OCR, vector formatting, knowledge graph linking, chronological timeline structuring, and cross-document audits.",
      components: [
        "Parsing Engine (PyMuPDF Text Extractor + OCR fallback)",
        "Retrieval Engine (RecursiveTextSplitter + Adaptive retriever)",
        "Extraction Engine (Dynamic Pydantic model runtime compiler)",
        "Explainability Engine (Provenance citations & reasoning traces)",
      ],
    },
    {
      id: "storage",
      name: "04. Persistent Ledger & Vector Store",
      icon: <Database className="w-4 h-4 text-indigo-600" />,
      tech: "PostgreSQL 16 + pgvector HNSW Indexing",
      desc: "Deploys a relational and vector storage model in PostgreSQL, matching text chunks directly with HNSW indexed cosine similarity embeddings.",
      components: [
        "documents Table (Filename, SHA-256 deduplication, Parse Status)",
        "document_chunks Table (Overlapping segments + VECTOR(384))",
        "extraction_schemas & extractions JSONB tables",
        "graph_entities & graph_relationships edge tables",
      ],
    },
    {
      id: "devops",
      name: "05. Containerization & Pipelines",
      icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
      tech: "Docker Compose + Pytest Suite + Turbopack Static Building",
      desc: "Fully containerized services orchestration with isolated volume mapping, strict static ESLint controls, and fully automated Pytest coverage checking.",
      components: [
        "Multi-stage Dockerfiles for frontend static serving",
        "Asynchronous backend workers docker integration",
        "Comprehensive Pytest coverage (18/18 passing tests)",
      ],
    },
  ];

  const currentLayer = layers[activeLayerIdx];

  return (
    <section id="tech-stack" className="py-24 bg-white border-b border-neutral-200/60 relative bg-grid-dots">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 items-end">
          <div className="lg:col-span-8 text-left">
            <Badge variant="info" className="text-[9px] uppercase tracking-widest font-mono mb-4 px-2 py-0.5 border border-indigo-200 bg-indigo-50 text-indigo-700">
              System Architecture
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
              Layered Production Design
            </h2>
          </div>
          <div className="lg:col-span-4 text-left lg:text-right">
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-sm">
              Built with clean modular architecture. Each layer remains decoupled, communicating strictly through type-safe boundaries.
            </p>
          </div>
        </div>

        {/* Blueprint Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Vertical Stack Blueprint Selector */}
          <div className="lg:col-span-4 flex flex-col space-y-2 relative border-l border-neutral-200 pl-4">
            <div className="absolute left-0 top-0 w-[1px] h-full bg-gradient-to-b from-indigo-500 to-transparent" />
            
            {layers.map((layer, idx) => {
              const isActive = activeLayerIdx === idx;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayerIdx(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center space-x-3 cursor-pointer ${
                    isActive
                      ? "bg-[#f8f9fa] border-neutral-300 text-neutral-900 shadow-sm"
                      : "bg-transparent border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                    isActive ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-neutral-100 border-neutral-200 text-neutral-400"
                  }`}>
                    {layer.icon}
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-mono block">LAYER 0{idx + 1}</span>
                    <span className="text-xs font-semibold mt-0.5">{layer.name.split(". ")[1]}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Blueprint Detail Console Card */}
          <div className="lg:col-span-8 p-6 sm:p-8 bg-white border border-neutral-200 rounded-[2rem] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  {currentLayer.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{currentLayer.name}</h3>
                  <span className="text-xs font-mono text-indigo-600">{currentLayer.tech}</span>
                </div>
              </div>
              <Badge variant="purple" className="text-[9px] font-mono uppercase px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700">
                Active Architecture Spec
              </Badge>
            </div>

            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">{currentLayer.desc}</p>

            {/* Components list as Blueprint modules */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                System Modules & Specifications ({currentLayer.components.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLayer.components.map((comp, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-3.5 bg-[#f8f9fa] rounded-xl border border-neutral-200/50 font-mono text-[10.5px] text-neutral-700 flex items-start space-x-2.5 transition-all duration-300 hover:border-neutral-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
