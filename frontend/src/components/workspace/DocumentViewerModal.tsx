import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  ShieldCheck,
  GitBranch,
  Cpu,
  Send,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { DocumentItem, ExtractionResult, GraphData, ChatMessage } from "../../types";
import { api } from "../../lib/api";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  allDocuments?: DocumentItem[];
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  allDocuments = [],
}: DocumentViewerModalProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "extractions" | "graph" | "chat">("preview");
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (document && isOpen) {
      setIsLoadingDetails(true);
      Promise.all([
        api.getGraph(document.id).catch(() => ({ nodes: [], edges: [] })),
      ]).then(([gRes]) => {
        setGraphData(gRes);
        setIsLoadingDetails(false);
      });

      // Initial chat welcome
      setChatMessages([
        {
          id: "welcome",
          sender: "ai",
          text: `Hello! I am your AI assistant for **${document.filename}**. Ask me any question regarding this document's text, extracted entities, or financial terms.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const query = chatInput;
    setChatInput("");
    setIsSendingChat(true);

    try {
      // Execute document-scoped vector search LLM RAG
      const chatRes = await api.chatDocument(document.id, query);

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "ai",
        text: chatRes.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: chatRes.sources.slice(0, 2).map((s: any) => ({
          document_id: document.id,
          chunk_id: s.chunk_id,
          snippet: s.content,
          confidence_score: s.score,
          page_number: s.page_number || 1,
        })),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: `Sorry, I encountered an error searching the document: ${(err as Error).message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const relatedDocs = allDocuments.filter((d) => d.id !== document.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-950 border border-blue-800/60">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">{document.filename}</h3>
                <Badge variant="purple">{document.category}</Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {document.id} | Hash: {(document.hash || "UNKNOWN").substring(0, 16)}...
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewer Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/30 flex space-x-4">
          {[
            { id: "preview", label: "Document Preview", icon: <FileText className="w-4 h-4 mr-1.5" /> },
            { id: "graph", label: "Entities & Links", icon: <GitBranch className="w-4 h-4 mr-1.5" /> },
            { id: "chat", label: "Scoped AI Chat", icon: <Sparkles className="w-4 h-4 mr-1.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "preview" | "extractions" | "graph" | "chat")}
              className={`py-3 px-2 text-xs font-semibold flex items-center border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Main Body */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* TAB 1: Preview */}
          {activeTab === "preview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              <div className="lg:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-y-auto max-h-[55vh] leading-relaxed">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3 border-b border-slate-800/80 pb-2">
                  Full Document Text Stream
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {document.full_text || "No parsed text available."}
                </pre>
              </div>

              {/* Metadata & Related Docs */}
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-200 text-sm mb-2 border-b border-slate-800 pb-2">
                    Metadata Specification
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">MIME Type:</span>
                    <span className="text-slate-300 font-mono">{document.content_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">File Size:</span>
                    <span className="text-slate-300 font-mono">{((document.size_bytes || 0) / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <Badge variant="success">{document.status}</Badge>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-200 text-sm mb-2 border-b border-slate-800 pb-2">
                    Workspace Context Documents ({relatedDocs.length})
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {relatedDocs.map((rd) => (
                      <div key={rd.id} className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs">
                        <span className="truncate text-slate-300 font-medium">{rd.filename}</span>
                        <Badge variant="info">{rd.category}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Entities & Links */}
          {activeTab === "graph" && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-200 text-sm">
                Extracted Entities & Relationships for {document.filename}
              </h4>

              {graphData?.nodes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-950 rounded-xl">
                  No entities extracted for this document.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {graphData?.nodes.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{n.name}</span>
                        <Badge variant="purple">{n.type}</Badge>
                      </div>
                      {n.properties && Object.keys(n.properties).length > 0 && (
                        <div className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded">
                          {JSON.stringify(n.properties)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Scoped AI Chat */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-[55vh]">
              {/* Chat Messages Log */}
              <div className="flex-grow overflow-y-auto space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800 mb-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-xl p-3.5 rounded-xl text-xs sm:text-sm font-sans leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                            Retrieved Document Citation:
                          </span>
                          {msg.sources.map((s, sIdx) => (
                            <div key={sIdx} className="text-[11px] font-mono text-slate-400 italic">
                              {"\""}{s.snippet}{"\""} (Score: {((s.confidence_score ?? 1.0) * 100).toFixed(0)}%)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">{msg.timestamp}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input Box */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask a question about ${document.filename}...`}
                  className="flex-grow bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl p-3 focus:border-blue-500 focus:outline-none"
                />
                <Button type="submit" isLoading={isSendingChat} size="md">
                  <Send className="w-4 h-4 mr-1" /> Ask AI
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
