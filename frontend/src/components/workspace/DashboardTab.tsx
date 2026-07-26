/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  FileText,
  Boxes,
  Cpu,
  GitBranch,
  Calendar,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FolderOpen,
  Eye,
  FileDown,
} from "lucide-react";
import {
  DocumentItem,
  ExtractionSchemaItem,
  GraphData,
  TimelineData,
  ReconciliationResult,
} from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface DashboardTabProps {
  documents?: DocumentItem[];
  schemas?: ExtractionSchemaItem[];
  graphData?: GraphData | null;
  timelineData?: TimelineData | null;
  reconciliationResult?: ReconciliationResult | null;
  onOpenViewer: (doc: DocumentItem) => void;
  onSelectTab: (tab: any) => void;
  onSelectDemo: (domain: string) => Promise<void>;
  isSeeding: boolean;
}

export function DashboardTab({
  documents = [],
  schemas = [],
  graphData = null,
  timelineData = null,
  reconciliationResult = null,
  onOpenViewer,
  onSelectTab,
  onSelectDemo,
  isSeeding,
}: DashboardTabProps) {
  const docList = Array.isArray(documents) ? documents : [];
  const schemaList = Array.isArray(schemas) ? schemas : [];
  const timelineEvents = Array.isArray(timelineData?.timeline) ? timelineData.timeline : [];
  const graphNodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
  const graphEdges = Array.isArray(graphData?.edges) ? graphData.edges : [];

  // Calculate stats
  const totalDocs = docList.length;
  const processedDocs = docList.filter((d) => d.status === "PARSED").length;
  const failedDocs = docList.filter((d) => d.status === "FAILED").length;
  const totalSchemas = schemaList.length;
  const totalNodes = graphNodes.length;
  const totalEvents = timelineEvents.length;

  const totalBytes = docList.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0);
  const formattedSize =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalBytes / 1024).toFixed(1)} KB`;

  // Get active domain name if seeded
  let activeDomain = "Empty Workspace";
  let domainStatus = "Pending Ingestion";
  if (totalDocs > 0) {
    domainStatus = "Active";
    const firstDoc = docList[0];
    if (firstDoc.filename.includes("acme") || firstDoc.filename.includes("quotation")) {
      activeDomain = "Procurement Lifecycle";
    } else if (firstDoc.filename.includes("master_services") || firstDoc.filename.includes("agreement")) {
      activeDomain = "Legal Case & Contracts";
    } else if (firstDoc.filename.includes("patient") || firstDoc.filename.includes("admission")) {
      activeDomain = "Medical EHR Records";
    } else if (firstDoc.filename.includes("balance_sheet") || firstDoc.filename.includes("tax")) {
      activeDomain = "Financial Audit";
    } else if (firstDoc.filename.includes("arxiv") || firstDoc.filename.includes("hnsw")) {
      activeDomain = "Research Literature";
    } else {
      activeDomain = "Custom Ingestion Session";
    }
  }

  // Count discrepancy summary
  const totalDiscrepancies = reconciliationResult?.discrepancies?.length || 0;
  const matchStatus = reconciliationResult?.status || "UNVERIFIED";

  // Dynamic Greeting based on time of day
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Overview Greeting Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/50 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            {getGreeting()}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 leading-relaxed">
            Here{"'s"} what{"'s"} happening in your document intelligence workspace.
          </p>
        </div>

        {/* Floating status pill matching top right badge layout */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-sm">
            <Cpu className="w-3.5 h-3.5" />
            <span>{activeDomain}</span>
          </div>
          <Badge
            variant={totalDocs > 0 ? "success" : "warning"}
            className="px-3 py-1.5 border font-bold"
          >
            {domainStatus}
          </Badge>
        </div>
      </div>

      {/* KPI Cards Row (Mockup Style: rounded, top colored bar, large bold text) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Purple top border - Documents */}
        <div className="bg-white border border-neutral-200/60 rounded-[1.25rem] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.015)] border-t-[3px] border-t-indigo-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono tracking-tight">
            {totalDocs}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2 font-mono">
            Total Documents
          </div>
        </div>

        {/* Card 2: Blue top border - Schemas */}
        <div className="bg-white border border-neutral-200/60 rounded-[1.25rem] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.015)] border-t-[3px] border-t-cyan-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className="text-2xl sm:text-3xl font-black text-cyan-600 font-mono tracking-tight">
            {totalSchemas}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2 font-mono">
            AI Schemas
          </div>
        </div>

        {/* Card 3: Emerald Green top border - Entities */}
        <div className="bg-white border border-neutral-200/60 rounded-[1.25rem] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.015)] border-t-[3px] border-t-emerald-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
            {totalNodes}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2 font-mono">
            Graph Entities
          </div>
        </div>

        {/* Card 4: Orange top border - Audit */}
        <div className="bg-white border border-neutral-200/60 rounded-[1.25rem] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.015)] border-t-[3px] border-t-amber-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className={`text-sm sm:text-base font-black truncate font-sans uppercase ${
            matchStatus === "MATCHED" ? "text-emerald-600" : matchStatus === "DISCREPANCY" ? "text-rose-600" : "text-amber-500"
          }`}>
            {matchStatus === "MATCHED" ? "Cleared" : matchStatus === "DISCREPANCY" ? "Mismatches" : "Pending"}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2 font-mono">
            Audit Status
          </div>
        </div>

        {/* Card 5: Violet/Purple top border - Events */}
        <div className="bg-white border border-neutral-200/60 rounded-[1.25rem] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.015)] border-t-[3px] border-t-purple-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[120px]">
          <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono tracking-tight">
            {totalEvents}
          </div>
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2 font-mono">
            Timeline Events
          </div>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Recent Ingestions table container */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick-starter (If Empty Workspace) */}
          {totalDocs === 0 && (
            <div className="bg-white border border-neutral-200/60 rounded-[1.5rem] p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-neutral-900">Load Industry Demo Datasets</h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Your workspace is empty. Load one of the following industry datasets to experience the parsing, timeline, and graph synchronization modules immediately:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  { id: "procurement", label: "Procurement Lifecycle", desc: "Quotation, PO, Delivery Note, Invoices" },
                  { id: "legal", label: "Legal Case & NDA", desc: "MSAs, Amendments, Non-disclosure, SOC 2" },
                  { id: "medical", label: "Medical Records (EHR)", desc: "Admissions, Diagnoses, Clinical Labs" },
                  { id: "financial", label: "Financial Audit", desc: "Balance sheets, Tax returns, Remittances" },
                ].map((demo) => (
                  <button
                    key={demo.id}
                    disabled={isSeeding}
                    onClick={() => onSelectDemo(demo.id)}
                    className="p-3.5 bg-[#f8f9fa] border border-neutral-200/60 hover:border-neutral-300 hover:bg-neutral-50 rounded-xl text-left transition-all hover:translate-y-[-1px] group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 group-hover:text-indigo-600">
                        {demo.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">{demo.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Ingestions Container matching Table layout */}
          <div className="bg-white border border-neutral-200/60 rounded-[1.5rem] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Recent Ingestions</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Latest document uploads and parsing statuses.</p>
              </div>
              <button
                onClick={() => onSelectTab("documents")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4.5 rounded-full shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none"
              >
                View All
              </button>
            </div>

            {totalDocs === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                No documents loaded in workspace. Click {"'Load Demo Workspace'"} or navigate to Documents tab to upload files.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[10px] font-bold text-neutral-400 tracking-wider">
                      <th className="pb-3 font-mono">DOC ID</th>
                      <th className="pb-3">FILENAME</th>
                      <th className="pb-3">CATEGORY</th>
                      <th className="pb-3">STATUS</th>
                      <th className="pb-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs text-neutral-600">
                    {docList.slice(0, 4).map((doc, idx) => (
                      <tr key={doc.id} className="group hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3.5 font-mono text-indigo-600 font-semibold">
                          #{String(idx + 1).padStart(3, "0")}
                        </td>
                        <td className="py-3.5 font-bold text-neutral-900 truncate max-w-[180px]">
                          {doc.filename}
                        </td>
                        <td className="py-3.5">
                          <span className="text-neutral-500 font-medium">{doc.category}</span>
                        </td>
                        <td className="py-3.5">
                          {doc.status === "PARSED" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono">
                              A • 100%
                            </span>
                          ) : doc.status === "FAILED" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                              D • 40%
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 font-mono">
                              B • 75%
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => onOpenViewer(doc)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-neutral-200 hover:border-indigo-500 hover:bg-indigo-50/30 text-[10px] text-neutral-700 hover:text-indigo-600 font-bold transition-all cursor-pointer bg-white"
                          >
                            <Eye className="w-3 h-3" />
                            <span>VIEW</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reconciliation & Integrity Audit details */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200/60 rounded-[1.5rem] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Integrity Audit</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">Cross-document verification summary.</p>
              </div>
              <button
                onClick={() => onSelectTab("reconcile")}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer border-none bg-transparent"
              >
                Run Audit &rarr;
              </button>
            </div>

            {totalDocs === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                No active audit data available. Load a demo workspace to run checks.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Reconciliation Summary Pill */}
                <div className="p-4 bg-[#f8f9fa] border border-neutral-200/60 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Audit Results</span>
                    <span className="text-xs font-bold text-neutral-800 block">
                      {matchStatus === "MATCHED"
                        ? "✅ Ledger Reconciled"
                        : matchStatus === "DISCREPANCY"
                        ? "⚠️ Discrepancies Found"
                        : "⏳ Pending Verification"}
                    </span>
                  </div>
                  <Badge variant={matchStatus === "MATCHED" ? "success" : matchStatus === "DISCREPANCY" ? "danger" : "warning"}>
                    {matchStatus}
                  </Badge>
                </div>

                {/* Discrepancies Details */}
                {totalDiscrepancies > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                      FLAGGED DISCREPANCIES ({totalDiscrepancies})
                    </div>
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {reconciliationResult?.discrepancies?.map((disc, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start space-x-2 text-[11px] text-rose-700"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold uppercase tracking-wider text-[9px] font-mono text-rose-800">
                              {disc.field} mismatch
                            </div>
                            <p className="text-rose-600 mt-0.5 leading-normal">{disc.explanation}</p>
                            <div className="mt-1 font-mono text-[9px] text-rose-400">
                              Doc 1: {String(disc.value_doc_1)} | Doc 2: {String(disc.value_doc_2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : matchStatus === "MATCHED" ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start space-x-2.5 text-[11px] text-emerald-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-800">All Reconciliations Cleared</div>
                      <p className="text-emerald-600/90 mt-0.5 leading-normal">
                        Supplier billing invoices match purchase orders and delivery receipts with 100% precision.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-neutral-400 text-xs">
                    No discrepancies detected. To perform reconciliation audits, open the Reconciliation tab.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
