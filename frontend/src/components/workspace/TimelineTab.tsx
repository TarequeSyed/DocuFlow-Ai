import React from "react";
import { BarChart3, Calendar, Loader2, AlertCircle, FileText, XCircle } from "lucide-react";
import { TimelineData } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface TimelineTabProps {
  timelineData?: TimelineData | null;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
  selectedNodeName?: string | null;
  onClearNodeFilter?: () => void;
  onSelectEvent?: (event: any) => void;
}

export function TimelineTab({
  timelineData,
  onRefresh,
  isLoading,
  error,
  selectedNodeName,
  onClearNodeFilter,
  onSelectEvent,
}: TimelineTabProps) {
  const rawEvents = Array.isArray(timelineData?.timeline) ? timelineData.timeline : [];

  // Filter events if an entity node name is selected in graph
  const events = selectedNodeName
    ? rawEvents.filter(
        (e) =>
          (e.title || e.document_title || "").toLowerCase().includes(selectedNodeName.toLowerCase()) ||
          (e.summary || e.description || "").toLowerCase().includes(selectedNodeName.toLowerCase()) ||
          (e.event_type || "").toLowerCase().includes(selectedNodeName.toLowerCase()) ||
          (e.category || e.metadata?.category || "").toLowerCase().includes(selectedNodeName.toLowerCase()) ||
          (e.metadata?.entities || []).some((ent: string) => ent.toLowerCase().includes(selectedNodeName.toLowerCase())) ||
          Object.values(e.metadata?.references || {}).some((ref: any) => String(ref).toLowerCase().includes(selectedNodeName.toLowerCase()))
      )
    : rawEvents;

  const exportTimelineCSV = () => {
    if (events.length === 0) return;
    const headers = ["Sequence Index", "Event Date", "Title", "Category", "Event Type", "Confidence", "Document Source"];
    const rows = events.map((e, idx) => [
      (e.sequence_index ?? idx) + 1,
      e.event_date || e.date || "Unspecified",
      e.title || e.document_title || "Untitled Document Event",
      e.category || e.metadata?.category || e.event_type || "DOCUMENT",
      e.event_type,
      e.confidence,
      e.document_title || e.filename || "Unknown File",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `docflow_timeline_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTimelineJSON = () => {
    if (events.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `docflow_timeline_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/50 pb-5">
        <div>
          <h3 className="text-base font-bold text-neutral-900 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" /> Chronological Timeline Reconstruction
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Reconstructed business lifecycles and milestone event tracks. Click a timeline card to open its source document.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {events.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={exportTimelineCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportTimelineJSON}
              >
                Export JSON
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
          >
            Re-index Timeline
          </Button>
        </div>
      </div>

      {/* Filter Info banner */}
      {selectedNodeName && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>
              Timeline filtered by Entity: <strong className="text-indigo-800">{selectedNodeName}</strong> ({events.length} match{events.length !== 1 ? "es" : ""})
            </span>
          </div>
          <button
            onClick={onClearNodeFilter}
            className="text-neutral-500 hover:text-indigo-700 flex items-center space-x-1 transition-colors cursor-pointer border-none bg-transparent"
          >
            <XCircle className="w-4 h-4" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 space-y-4 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-neutral-700">
            Reconstructing chronologies...
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-700 text-xs font-mono flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">TIMELINE EXCEPTION:</span> {error}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && events.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400 space-y-4 shadow-sm">
          <Calendar className="w-10 h-10 text-neutral-400 mx-auto" />
          <p className="text-xs font-bold text-neutral-700 uppercase tracking-widest font-mono">
            No events found
          </p>
          <p className="text-[10px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
            Seeding document repository or uploading files triggers automated chronology mapping.
          </p>
        </div>
      )}

      {/* Timeline List */}
      {!isLoading && !error && events.length > 0 && (
        <div className="relative pl-6 space-y-6 before:absolute before:left-[10px] before:top-4 before:bottom-4 before:w-[1px] before:bg-neutral-200">
          {events.map((evt, idx) => {
            const confidencePct = ((evt?.confidence ?? 1.0) * 100).toFixed(0);
            const sequenceIndex = (evt?.sequence_index ?? idx) + 1;

            return (
              <div
                key={idx}
                onClick={() => onSelectEvent?.(evt)}
                className="relative group cursor-pointer"
              >
                {/* Event Bullet Node marker */}
                <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-white border-2 border-neutral-300 group-hover:border-indigo-600 group-hover:bg-indigo-600 transition-colors flex items-center justify-center z-10" />

                <div className="p-5 bg-white border border-neutral-200/60 rounded-2xl hover:border-neutral-300 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <Badge variant="purple" className="text-[8px] font-mono px-2 py-0.5">
                        {evt?.category || evt?.metadata?.category || evt?.event_type || "DOCUMENT"}
                      </Badge>
                      <span className="text-xs font-bold text-neutral-800 group-hover:text-indigo-600 transition-colors">
                        {evt?.title || evt?.document_title || "Untitled Document Event"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] text-neutral-400 font-mono">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {evt?.date || evt?.event_date || "Unspecified"}
                      </span>
                      <Badge variant="info" className="text-[8px] px-1.5 py-0.2">Seq #{sequenceIndex}</Badge>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    {evt?.summary || evt?.description || "No summary description generated."}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-3 border-t border-neutral-100">
                    <span className="flex items-center hover:text-neutral-700 transition-colors">
                      <FileText className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                      Source: {evt?.filename || evt?.document_title || "Unknown File"}
                    </span>
                    <span>Confidence: {confidencePct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
