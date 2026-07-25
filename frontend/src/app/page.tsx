/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Boxes,
  Cpu,
  Search,
  GitBranch,
  BarChart3,
  Zap,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Calendar,
  Layers,
  ArrowRight,
  Database,
  Eye,
} from "lucide-react";
import { api } from "../lib/api";
import {
  DocumentItem,
  ExtractionSchemaItem,
  ExtractionResult,
  GraphData,
  TimelineData,
  ReconciliationResult,
} from "../types";

import { Badge } from "../components/ui/Badge";

// Landing Page Components
import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { PipelineDiagram } from "../components/landing/PipelineDiagram";
import { UseCases } from "../components/landing/UseCases";
import { TechStack } from "../components/landing/TechStack";
import { FAQ } from "../components/landing/FAQ";
import { Footer } from "../components/landing/Footer";

// Workspace Components
import { DocumentsTab } from "../components/workspace/DocumentsTab";
import { SchemasTab } from "../components/workspace/SchemasTab";
import { ExtractionTab } from "../components/workspace/ExtractionTab";
import { SearchTab } from "../components/workspace/SearchTab";
import { KnowledgeGraphTab } from "../components/workspace/KnowledgeGraphTab";
import { TimelineTab } from "../components/workspace/TimelineTab";
import { ReconciliationTab } from "../components/workspace/ReconciliationTab";
import { DocumentViewerModal } from "../components/workspace/DocumentViewerModal";
import { DemoSelectorDropdown } from "../components/workspace/DemoSelectorDropdown";
import { DashboardTab } from "../components/workspace/DashboardTab";

type ViewMode = "landing" | "workspace";
type TabType =
  | "dashboard"
  | "documents"
  | "schemas"
  | "extract"
  | "search"
  | "graph"
  | "timeline"
  | "reconcile";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // State Management
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [schemas, setSchemas] = useState<ExtractionSchemaItem[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);

  // Synchronization Selection States
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Document Viewer Modal State
  const [viewerDocument, setViewerDocument] = useState<DocumentItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Loading & State Indicators
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isCreatingSchema, setIsCreatingSchema] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showNotification = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Data Fetchers
  const loadDocuments = useCallback(async () => {
    try {
      const res = await api.getDocuments();
      setDocuments(res);
    } catch (err: any) {
      console.error("Failed loading documents", err);
    }
  }, []);

  const loadSchemas = useCallback(async () => {
    try {
      const res = await api.getSchemas();
      setSchemas(res);
    } catch (err: any) {
      console.error("Failed loading schemas", err);
    }
  }, []);

  const loadGraph = useCallback(async () => {
    setIsGraphLoading(true);
    try {
      const res = await api.getGraph();
      setGraphData(res);
    } catch (err: any) {
      console.error("Failed loading graph", err);
    } finally {
      setIsGraphLoading(false);
    }
  }, []);

  const loadTimeline = useCallback(async () => {
    setIsTimelineLoading(true);
    try {
      const res = await api.getTimeline();
      setTimelineData(res);
    } catch (err: any) {
      console.error("Failed loading timeline", err);
    } finally {
      setIsTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadSchemas();
  }, [loadDocuments, loadSchemas]);

  // Action Handlers
  const handleUpload = async (files: File[], category: string) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      await Promise.all(files.map(file => api.uploadDocument(file, category)));
      setUploadSuccess(true);
      showNotification(`Successfully uploaded ${files.length} file(s) to repository!`);
      await loadDocuments();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document batch");
      showNotification(err.message || "Failed to upload documents", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await api.deleteDocument(id);
      showNotification("Document deleted from workspace.");
      if (selectedDocumentId === id) setSelectedDocumentId(null);
      await loadDocuments();
      await loadGraph();
      await loadTimeline();
    } catch (err: any) {
      showNotification(err.message, "error");
    }
  };

  const handleCreateSchema = async (
    name: string,
    description: string,
    fields: Array<{ name: string; type: string }>
  ) => {
    setIsCreatingSchema(true);
    try {
      const properties: Record<string, any> = {};
      fields.forEach((f) => {
        properties[f.name] = { type: f.type };
      });

      await api.createSchema({
        name,
        description,
        schema_definition: { type: "object", properties },
      });
      showNotification(`Schema "${name}" created.`);
      await loadSchemas();
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsCreatingSchema(false);
    }
  };

  const handleDeleteSchema = async (id: string) => {
    try {
      await api.deleteSchema(id);
      showNotification("Schema template deleted.");
      await loadSchemas();
    } catch (err: any) {
      showNotification(err.message, "error");
    }
  };

  const handleRunExtraction = async (docId: string, schemaId?: string) => {
    setIsExtracting(true);
    try {
      const res = await api.runExtraction(docId, schemaId);
      setExtractionResult(res);
      showNotification("AI Extraction executed successfully!");
      return res;
    } catch (err: any) {
      showNotification(err.message, "error");
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSearch = async (query: string, docId?: string) => {
    setIsSearching(true);
    try {
      return await api.search(query, docId);
    } catch (err: any) {
      showNotification(err.message, "error");
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleReconcile = async (doc1Id: string, doc2Id: string) => {
    setIsReconciling(true);
    try {
      const res = await api.reconcile(doc1Id, doc2Id);
      setReconciliationResult(res);
      showNotification("Reconciliation analysis complete.");
      return res;
    } catch (err: any) {
      showNotification(err.message, "error");
      return null;
    } finally {
      setIsReconciling(false);
    }
  };

  const handleSelectDemoDomain = async (domain: string = "procurement") => {
    setIsSeedingDemo(true);
    try {
      const res = await api.seedDemoWorkspace(domain);
      showNotification(res.message || `Demo dataset seeded for ${domain}!`);
      await loadDocuments();
      await loadSchemas();
      await loadGraph();
      await loadTimeline();
      setViewMode("workspace");
      setActiveTab("dashboard");
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === "hero") {
      setViewMode("landing");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (viewMode !== "landing") {
      setViewMode("landing");
    }

    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Cross-component state actions
  const handleSelectGraphNode = (nodeName: string) => {
    setSelectedNodeName(nodeName);
    setActiveTab("timeline");
    showNotification(`Filtering timeline by entity: ${nodeName}`);
  };

  const handleSelectTimelineEvent = (event: any) => {
    const targetDoc = documents.find(
      (d) => d.filename.toLowerCase() === (event.filename || "").toLowerCase()
    );
    if (targetDoc) {
      setSelectedDocumentId(targetDoc.id);
      setViewerDocument(targetDoc);
      setIsViewerOpen(true);
      showNotification(`Opening Document Source: ${targetDoc.filename}`);
    } else {
      showNotification(`Source document not loaded in workspace.`, "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-neutral-800 flex flex-col font-sans selection:bg-indigo-500/10 selection:text-indigo-600">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-mono flex items-center space-x-2.5 animate-in slide-in-from-bottom duration-300 ${
            notification.type === "success"
              ? "bg-white text-emerald-700 border-emerald-200/80 shadow-emerald-500/5"
              : "bg-white text-rose-700 border-rose-200/80 shadow-rose-500/5"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${notification.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Global Header */}
      {viewMode === "landing" && (
        <Header
          onLaunchWorkspace={() => setViewMode("workspace")}
          onSelectDemoDomain={handleSelectDemoDomain}
          isSeedingDemo={isSeedingDemo}
          onNavigateSection={handleNavigateSection}
        />
      )}

      {/* VIEW SWITCHER: LANDING WEBSITE */}
      {viewMode === "landing" ? (
        <main className="flex-grow">
          <Hero
            onLaunchWorkspace={() => setViewMode("workspace")}
            onLoadDemo={() => handleSelectDemoDomain("procurement")}
            isSeedingDemo={isSeedingDemo}
          />
          <Features />
          <PipelineDiagram />
          <UseCases />
          <TechStack />
          <FAQ />
          <Footer />
        </main>
      ) : (
        /* VIEW SWITCHER: AI COCKPIT WORKSPACE (Light Theme Overhaul) */
        <main className="flex-grow flex h-screen overflow-hidden bg-[#fcfcfd] text-neutral-800 font-sans">
          
          {/* LEFT SIDEBAR PANEL */}
          <aside className="w-80 border-r border-neutral-200/60 bg-[#f8f9fa] flex flex-col justify-between shrink-0 h-full">
            {/* Header branding */}
            <div className="p-5 border-b border-neutral-200/60 space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setViewMode("landing")}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 rounded-full transition-all flex items-center text-[10px] font-bold border border-neutral-200 shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" /> Landing Page
                </button>

                <Badge variant="purple" className="text-[8px] font-mono uppercase px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700">
                  COCKPIT WORKSPACE
                </Badge>
              </div>

              <div className="space-y-1">
                <h1 className="text-base font-bold text-neutral-900 tracking-tight flex items-center">
                  DocuFlow Workspace
                  <span className="w-2 h-2 rounded-full bg-indigo-500 ml-2 animate-pulse" />
                </h1>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-sans font-medium">
                  Unified transaction reasoning canvas.
                </p>
              </div>

              {/* Demo selector dropdown */}
              <div className="pt-1">
                <DemoSelectorDropdown
                  onSelectDomain={handleSelectDemoDomain}
                  isLoading={isSeedingDemo}
                />
              </div>
            </div>

            {/* Sidebar View Navigation Tabs */}
            <div className="flex-grow overflow-y-auto px-3 py-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-neutral-400 tracking-wider px-3 uppercase font-bold">VIEWS</span>
                {[
                  { id: "dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
                  { id: "documents", label: "Document Registry", icon: FileText, count: documents.length },
                  { id: "schemas", label: "Extraction Schemas", icon: Boxes, count: schemas.length },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as TabType)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
                          : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/40"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 shrink-0 text-neutral-500" />
                        <span>{t.label}</span>
                      </div>
                      {t.count !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                          isActive ? "bg-indigo-600 text-white font-bold" : "bg-neutral-200/50 text-neutral-500"
                        }`}>
                          {t.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-mono text-neutral-400 tracking-wider px-3 uppercase font-bold">INTELLIGENCE ENGINES</span>
                {[
                  { id: "extract", label: "Schema Extraction", icon: Cpu },
                  { id: "search", label: "Semantic Search", icon: Search },
                  { id: "graph", label: "Knowledge Graph", icon: GitBranch },
                  { id: "timeline", label: "Timeline Sequence", icon: Calendar },
                  { id: "reconcile", label: "Audit Reconciliation", icon: Zap },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id as TabType);
                        if (t.id === "graph") loadGraph();
                        if (t.id === "timeline") loadTimeline();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-neutral-900 shadow-sm border border-neutral-200"
                          : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/40"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 shrink-0 text-neutral-500" />
                        <span>{t.label}</span>
                      </div>
                      {selectedNodeName && t.id === "timeline" && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-neutral-200/60 bg-neutral-100/50 flex items-center justify-between font-mono text-[9px] text-neutral-400 font-bold">
              <span>LEDGER: ONLINE</span>
              <span>VER: 2.0.1</span>
            </div>
          </aside>

          {/* MAIN COCKPIT WORKSPACE WINDOW */}
          <section className="flex-grow flex flex-col h-full bg-[#fcfcfd] overflow-hidden">
            {/* Top status bar */}
            <header className="h-14 border-b border-neutral-200/60 px-6 flex items-center justify-between shrink-0 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-neutral-400 font-bold uppercase font-mono">WORKSPACE STATE:</span>
                <span className="text-indigo-600 font-bold font-mono">ACTIVE_SESSION</span>
                {selectedNodeName && (
                  <>
                    <span className="text-neutral-300 font-mono">/</span>
                    <span className="text-neutral-500 font-mono flex items-center">
                      Entity Focus: <Badge variant="purple" className="ml-1.5 text-[9px] border-purple-200 bg-purple-50 text-purple-700">{selectedNodeName}</Badge>
                      <button
                        onClick={() => setSelectedNodeName(null)}
                        className="ml-1.5 text-neutral-400 hover:text-neutral-800"
                        title="Clear Entity Filter"
                      >
                        ×
                      </button>
                    </span>
                  </>
                )}
                {selectedDocumentId && (
                  <>
                    <span className="text-neutral-300 font-mono">/</span>
                    <span className="text-neutral-500 font-mono flex items-center">
                      Doc Focus: <span className="text-indigo-600 font-bold ml-1">{documents.find(d => d.id === selectedDocumentId)?.filename}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Statistics */}
              <div className="hidden sm:flex items-center space-x-4 text-[10px] text-neutral-400 font-bold font-mono">
                <span>DOCS: {documents.length}</span>
                <span>SCHEMAS: {schemas.length}</span>
              </div>
            </header>

            {/* Scrollable Work Canvas */}
            <div className="flex-grow overflow-y-auto p-6 sm:p-8 bg-[#fcfcfd]">
              <div className="max-w-6xl mx-auto h-full">
                
                {activeTab === "dashboard" && (
                  <DashboardTab
                    documents={documents}
                    schemas={schemas}
                    graphData={graphData}
                    timelineData={timelineData}
                    reconciliationResult={reconciliationResult}
                    onOpenViewer={(doc) => {
                      setSelectedDocumentId(doc.id);
                      setViewerDocument(doc);
                      setIsViewerOpen(true);
                    }}
                    onSelectTab={(tab) => setActiveTab(tab)}
                    onSelectDemo={handleSelectDemoDomain}
                    isSeeding={isSeedingDemo}
                  />
                )}

                {activeTab === "documents" && (
                  <DocumentsTab
                    documents={documents}
                    onUpload={handleUpload}
                    onDelete={handleDeleteDoc}
                    onOpenViewer={(doc) => {
                      setSelectedDocumentId(doc.id);
                      setViewerDocument(doc);
                      setIsViewerOpen(true);
                    }}
                    isUploading={isUploading}
                    uploadError={uploadError}
                    uploadSuccess={uploadSuccess}
                  />
                )}

                {activeTab === "schemas" && (
                  <SchemasTab
                    schemas={schemas}
                    onCreateSchema={handleCreateSchema}
                    onDeleteSchema={handleDeleteSchema}
                    isCreating={isCreatingSchema}
                  />
                )}

                {activeTab === "extract" && (
                  <ExtractionTab
                    documents={documents}
                    schemas={schemas}
                    onRunExtraction={handleRunExtraction}
                    isExtracting={isExtracting}
                    extractionResult={extractionResult}
                  />
                )}

                {activeTab === "search" && (
                  <SearchTab
                    documents={documents}
                    onSearch={handleSearch}
                    isSearching={isSearching}
                  />
                )}

                {activeTab === "graph" && (
                  <KnowledgeGraphTab
                    graphData={graphData}
                    onRefresh={loadGraph}
                    isLoading={isGraphLoading}
                    onSelectNode={handleSelectGraphNode}
                    selectedNodeName={selectedNodeName}
                  />
                )}

                {activeTab === "timeline" && (
                  <TimelineTab
                    timelineData={timelineData}
                    onRefresh={loadTimeline}
                    isLoading={isTimelineLoading}
                    selectedNodeName={selectedNodeName}
                    onClearNodeFilter={() => setSelectedNodeName(null)}
                    onSelectEvent={handleSelectTimelineEvent}
                  />
                )}

                {activeTab === "reconcile" && (
                  <ReconciliationTab
                    documents={documents}
                    onReconcile={handleReconcile}
                    isReconciling={isReconciling}
                    result={reconciliationResult}
                  />
                )}

              </div>
            </div>
          </section>

        </main>
      )}

      {/* Document Viewer Modal with Scoped AI Chat */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={viewerDocument}
        allDocuments={documents}
      />
    </div>
  );
}
