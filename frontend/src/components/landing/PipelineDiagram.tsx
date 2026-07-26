import React, { useState } from "react";
import { Upload, FileCode, Database, Brain, GitMerge, ShieldCheck, ArrowRight, Terminal } from "lucide-react";
import { Badge } from "../ui/Badge";

export function PipelineDiagram() {
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const steps = [
    {
      num: "01",
      icon: <Upload className="w-4 h-4 text-indigo-600" />,
      title: "Document Ingestion",
      tech: "FastAPI / Async Workers",
      desc: "Asynchronous file uploading with SHA-256 content deduplication, MIME type validation, and direct storage pathing.",
      inputs: "Binary Files (PDF, TXT, PNG, JPG, DOCX)",
      outputs: "Document DB Record & Storage Metadata",
      pipelineCode: `file_bytes = await file.read()
file_hash = hashlib.sha256(file_bytes).hexdigest()
# Check for existing hash to prevent deduplication
if await check_exists(file_hash):
    raise HTTPException(status_code=409)`,
    },
    {
      num: "02",
      icon: <FileCode className="w-4 h-4 text-indigo-600" />,
      title: "Parsing & Preserving Layout",
      tech: "PyMuPDF + Tesseract OCR",
      desc: "Dual-pass text extractor attempting PyMuPDF stream parsing. Automatically runs Tesseract OCR fallback on scanned inputs.",
      inputs: "Raw File Payload & MIME Type",
      outputs: "Structured Page Text Array (Reading Order Preserved)",
      pipelineCode: `pages = await native_parser.parse_pages(content, mime)
if not any(pages):
    pages = await ocr_parser.parse_pages(content, mime)
# Preserves absolute coordinate offsets for bounding boxes`,
    },
    {
      num: "03",
      icon: <Database className="w-4 h-4 text-indigo-600" />,
      title: "Vector Embedding & HNSW Storage",
      tech: "FastEmbed (bge-small-en) + pgvector",
      desc: "RecursiveCharacterTextSplitter segments text into overlapping chunks. FastEmbed creates 384d vectors saved in PostgreSQL.",
      inputs: "Normalized Page Text Strings",
      outputs: "document_chunks Records with 384d Vectors",
      pipelineCode: `chunks = splitter.split_text(full_text)
embeddings = provider.embed_documents(chunks)
# Persisted into pgvector with custom HNSW index
# CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops)`,
    },
    {
      num: "04",
      icon: <Brain className="w-4 h-4 text-indigo-600" />,
      title: "Schema-Enforced Extraction",
      tech: "Pydantic v2 + GPT-4o-mini",
      desc: "Dynamically compiles runtime Pydantic validation models matching target parameters schema and executes schema-enforcement.",
      inputs: "Vector Search Context & Target JSON Schema",
      outputs: "Validated Structured JSON Object",
      pipelineCode: `validator = create_model("DynamicModel", **fields)
response = await llm.generate_structured(context, schema)
# Auto-retry with self-correcting error traceback
validated = validator.model_validate_json(response)`,
    },
    {
      num: "05",
      icon: <GitMerge className="w-4 h-4 text-indigo-600" />,
      title: "Knowledge Graph & Chronology",
      tech: "GraphEntity & Timeline Engine",
      desc: "Resolves entities across documents (Suppliers, POs, Invoices), links semantic nodes, and parses transaction dates.",
      inputs: "Document Data & Extracted Parameters",
      outputs: "graph_entities, graph_relationships & Chronological events",
      pipelineCode: `entities = graph_engine.extract_nodes(doc_id, data)
edges = graph_engine.link_relationships(entities)
# Normalizes timestamps and sequences chronological event chains`,
    },
    {
      num: "06",
      icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
      title: "Explainable Citations & Provenance",
      tech: "ProvenanceService & ReasoningTrace",
      desc: "Maps LLM findings back to absolute document source bounding boxes, calculating cosine similarity confidence score.",
      inputs: "Retrieved Chunks & Execution Steps",
      outputs: "Auditable ProvenanceReport with ReasoningTrace",
      pipelineCode: `trace = ReasoningTraceBuilder()
trace.add_step(title="Vector Search", score=0.95)
# Bind final schema coordinates back to source text
return ProvenanceReport(citations=citations, trace=trace.build())`,
    },
  ];

  const currentStep = steps[activeStepIdx];

  return (
    <section id="pipeline" className="py-24 bg-[#fcfcfd] border-b border-neutral-200/60 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-end">
          <div className="lg:col-span-8 text-left">
            <Badge variant="purple" className="text-[9px] uppercase tracking-wider font-mono mb-4 px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700">
              System Pipeline Architecture
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
              AI Ingestion & Reasoning Flow
            </h2>
          </div>
          <div className="lg:col-span-4 text-left lg:text-right">
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-sm">
              Click any processing stage to inspect underlying tech stacks, active data parameters, and direct code execution.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Tracker */}
          <div className="lg:col-span-4 space-y-3">
            {steps.map((step, idx) => {
              const isActive = activeStepIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 relative group flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "bg-white border-neutral-300 text-neutral-900 shadow-md"
                      : "bg-transparent border-transparent hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isActive ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-neutral-100 text-neutral-400 group-hover:text-neutral-600"
                    }`}>
                      {step.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400 font-mono tracking-wider">STAGE {step.num}</div>
                      <div className="text-xs font-semibold mt-0.5">{step.title}</div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-indigo-600 transition-transform duration-300 ${
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-50"
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Right Stage Detail Board */}
          <div className="lg:col-span-8 p-6 sm:p-8 bg-white border border-neutral-200/50 rounded-[2rem] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  {currentStep.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    {currentStep.title}
                  </h3>
                  <span className="text-xs font-mono text-indigo-600">{currentStep.tech}</span>
                </div>
              </div>
              <Badge variant="purple" className="text-[9px] font-mono uppercase px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700">
                PIPELINE STAGE {currentStep.num}
              </Badge>
            </div>

            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">{currentStep.desc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10.5px] font-mono">
              <div className="p-4 bg-[#f8f9fa] rounded-xl border border-neutral-200/40">
                <span className="text-neutral-400 font-semibold block mb-1">Inputs:</span>
                <span className="text-neutral-700">{currentStep.inputs}</span>
              </div>
              <div className="p-4 bg-[#f8f9fa] rounded-xl border border-neutral-200/40">
                <span className="text-neutral-400 font-semibold block mb-1">Outputs:</span>
                <span className="text-indigo-600 font-bold">{currentStep.outputs}</span>
              </div>
            </div>

            {/* Code Logic Container with Terminal header */}
            <div className="bg-[#f8f9fa] rounded-xl border border-neutral-200 overflow-hidden">
              <div className="flex items-center space-x-1.5 px-4 py-2.5 bg-neutral-100 border-b border-neutral-200">
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[9px] text-neutral-400 font-mono tracking-wider uppercase">
                  engine_runtime_preview.py
                </span>
              </div>
              <pre className="p-4 font-mono text-[10.5px] text-indigo-600 overflow-x-auto leading-relaxed">
                <code>{currentStep.pipelineCode}</code>
              </pre>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
