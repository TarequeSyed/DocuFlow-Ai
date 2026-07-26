import React, { useState } from "react";
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertTriangle, Loader2, Eye } from "lucide-react";
import { DocumentItem } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface DocumentsTabProps {
  documents?: DocumentItem[];
  onUpload: (files: File[], category: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenViewer?: (doc: DocumentItem) => void;
  isUploading: boolean;
  uploadError: string | null;
  uploadSuccess: boolean;
}

export function DocumentsTab({
  documents = [],
  onUpload,
  onDelete,
  onOpenViewer,
  isUploading,
  uploadError,
  uploadSuccess,
}: DocumentsTabProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("INVOICE");
  const [isDragOver, setIsDragOver] = useState(false);

  const docList = Array.isArray(documents) ? documents : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesList = Array.from(e.target.files).slice(0, 10);
      setSelectedFiles(filesList);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files).slice(0, 10);
      setSelectedFiles(droppedFiles);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    await onUpload(selectedFiles, category);
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Drag & Drop Zone */}
        <div className="lg:col-span-8">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-50/50 shadow-[0_0_20px_rgba(79,70,229,0.05)]"
                  : selectedFiles.length > 0
                  ? "border-indigo-400 bg-indigo-50/20"
                  : "border-neutral-200 bg-[#f8f9fa] hover:border-neutral-300 hover:bg-neutral-100/50"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.png,.jpg,.jpeg,.docx"
              />

              <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center mb-4 text-neutral-500 shadow-sm">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>

              {selectedFiles.length > 0 ? (
                <div className="space-y-2.5 max-w-md w-full">
                  <div className="text-xs font-bold text-neutral-900 font-mono">
                    Queue: {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected (max 10)
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white border border-neutral-200/60 rounded-lg text-left">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex justify-between items-center text-[10px] font-mono text-neutral-600 bg-neutral-50 px-2.5 py-1 rounded border border-neutral-200/40">
                        <span className="truncate max-w-[200px] font-semibold">{file.name}</span>
                        <span>{((file.size) / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-[10px] text-neutral-500 hover:text-neutral-800 underline font-mono cursor-pointer border-none bg-transparent"
                  >
                    Clear Queue
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <label htmlFor="file-upload" className="text-xs font-bold text-neutral-800 hover:text-indigo-600 cursor-pointer block">
                    Click to select files or drag & drop here
                  </label>
                  <p className="text-[10px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
                    Supports PDF, TXT, PNG, JPG up to 10MB per file. Select up to 10 files simultaneously.
                  </p>
                </div>
              )}

              {/* Ingestion triggers */}
              {selectedFiles.length > 0 && (
                <div className="absolute bottom-4 right-4 animate-in fade-in zoom-in duration-200">
                  <Button
                    type="submit"
                    disabled={isUploading}
                    isLoading={isUploading}
                    size="sm"
                  >
                    Start Batch Ingestion
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Configuration Options */}
        <div className="lg:col-span-4 p-5 bg-white border border-neutral-200/60 rounded-2xl space-y-4 shadow-sm">
          <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
            Ingestion Settings
          </h4>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 mb-1.5 uppercase font-mono">
              Document Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-neutral-200 text-neutral-800 text-xs rounded-xl p-3 focus:border-indigo-500 focus:outline-none font-mono shadow-sm"
            >
              <option value="INVOICE">INVOICE</option>
              <option value="PURCHASE_ORDER">PURCHASE_ORDER</option>
              <option value="QUOTATION">QUOTATION</option>
              <option value="DELIVERY_NOTE">DELIVERY_NOTE</option>
              <option value="PAYMENT_RECEIPT">PAYMENT_RECEIPT</option>
              <option value="WARRANTY">WARRANTY</option>
              <option value="CONTRACT">CONTRACT</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </div>

          <div className="pt-2">
            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] rounded-xl flex items-center space-x-2 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Uploaded and added to workspace!</span>
              </div>
            )}
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200/60 text-rose-700 text-[10px] rounded-xl flex items-center space-x-2 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Error: {uploadError}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Documents Folder Grid Library */}
      <div className="p-6 bg-white border border-neutral-200/60 rounded-[1.5rem] shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-neutral-900">
            Document Repository ({docList.length})
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Select items to inspect extraction schemas, citations, and run dynamic RAG operations.
          </p>
        </div>

        {docList.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl">
            <FileText className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-500 text-xs font-semibold font-mono">WORKSPACE EMPTY</p>
            <p className="text-[10px] text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Seed a dataset using "Load Demo Workspace" or upload files above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docList.map((doc) => (
              <div
                key={doc.id}
                className="group relative p-4 bg-white border border-neutral-200/60 hover:border-neutral-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 min-h-[140px]"
              >
                {/* Header detail */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-neutral-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-neutral-800 truncate group-hover:text-indigo-600 transition-colors">
                        {doc.filename}
                      </h4>
                      <span className="text-[9px] text-neutral-500 font-mono block mt-0.5">
                        {((doc.size_bytes || 0) / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  <Badge variant="purple" className="text-[8px] font-mono px-2 py-0.5 shrink-0">
                    {doc.category || "UNKNOWN"}
                  </Badge>
                </div>

                {/* Middle details */}
                <div className="flex items-center justify-between text-[9px] font-mono border-t border-neutral-100 pt-3">
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      doc.status === "PARSED" ? "bg-emerald-500" : doc.status === "FAILED" ? "bg-rose-500" : "bg-amber-500 animate-pulse"
                    }`} />
                    <span className="text-neutral-500 uppercase">{doc.status}</span>
                  </div>
                  <span className="text-neutral-500">
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "Recent"}
                  </span>
                </div>

                {/* Actions footer */}
                <div className="flex items-center justify-between space-x-2 border-t border-neutral-100 pt-3 mt-auto">
                  <button
                    onClick={() => onOpenViewer?.(doc)}
                    className="px-3 py-1 bg-white hover:bg-indigo-50/30 border border-neutral-200 hover:border-indigo-500 rounded-lg text-[10px] font-bold text-neutral-700 hover:text-indigo-600 transition-all flex items-center cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-neutral-400 group-hover:text-indigo-600" />
                    Inspect
                  </button>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="p-1.5 hover:bg-rose-50 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
