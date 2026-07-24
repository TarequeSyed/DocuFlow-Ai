/* eslint-disable @typescript-eslint/no-explicit-any */
export type ViewMode = "landing" | "workspace";

export type WorkspaceTab =
  | "documents"
  | "schemas"
  | "extraction"
  | "search"
  | "graph"
  | "timeline"
  | "reconciliation";

export interface DocumentItem {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
  hash: string;
  category: string;
  status: "PENDING" | "PARSING" | "PARSED" | "FAILED";
  full_text?: string;
  created_at: string;
}

export interface ExtractionSchemaItem {
  id: string;
  name: string;
  description?: string;
  schema_definition: Record<string, any>;
  created_at: string;
}

export interface CitationItem {
  document_id: string;
  chunk_id: string;
  snippet: string;
  page_number?: number;
  confidence_score?: number;
  retrieval_strategy?: string;
}

export interface ReasoningStep {
  step_number: number;
  title: string;
  description: string;
  input_summary?: string | null;
  output_summary?: string | null;
  confidence: number;
  timestamp: string;
}

export interface ReasoningTrace {
  trace_id: string;
  total_execution_ms?: number;
  model_name?: string;
  steps: ReasoningStep[];
}

export interface ProvenanceReport {
  citations: CitationItem[];
  overall_confidence: number;
  reasoning_trace?: ReasoningTrace;
}

export interface ExtractionResult {
  id: string;
  document_id: string;
  schema_id: string;
  structured_data: Record<string, any> | null;
  status: string;
  error_message?: string | null;
  provenance?: ProvenanceReport | null;
  created_at: string;
}

export interface SearchResultItem {
  chunk_id: string;
  document_id: string;
  content: string;
  score: number;
  page_number?: number;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  document_id?: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  document_id?: string;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineEventItem {
  id: string;
  document_id: string;
  document_title: string;
  title?: string;
  category?: string;
  event_type: string;
  event_date: string;
  date?: string;
  sequence_index?: number;
  summary?: string;
  description?: string;
  confidence?: number;
  filename?: string;
  metadata?: Record<string, any>;
}

export interface TimelineData {
  timeline: TimelineEventItem[];
}

export interface DiscrepancyItem {
  field: string;
  severity: string;
  value_doc_1: any;
  value_doc_2: any;
  explanation: string;
}

export interface ReconciliationResult {
  document_1_id: string;
  document_2_id: string;
  status: "MATCHED" | "DISCREPANCY" | "UNVERIFIED";
  confidence_score: number;
  reconciliation_summary: string;
  discrepancies: DiscrepancyItem[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  sources?: CitationItem[];
}
