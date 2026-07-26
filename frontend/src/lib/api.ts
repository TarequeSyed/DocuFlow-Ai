/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DocumentItem,
  ExtractionSchemaItem,
  ExtractionResult,
  SearchResultItem,
  GraphData,
  TimelineData,
  ReconciliationResult,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: "API Error" }));
    throw new Error(errorBody.detail || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Demo Workspace
  seedDemoWorkspace: (domain: string = "procurement") =>
    fetchApi<{ message: string; domain: string; documents_count: number }>(
      `/demo/seed?domain=${encodeURIComponent(domain)}`,
      { method: "POST" }
    ),

  resetDemoWorkspace: () =>
    fetchApi<{ message: string }>(`/demo/reset`, { method: "DELETE" }),

  // Documents
  getDocuments: () =>
    fetchApi<{ items: DocumentItem[]; total: number }>("/documents?limit=100").then((r) => r.items),

  getDocument: (id: string) => fetchApi<DocumentItem>(`/documents/${id}`),

  uploadDocument: async (file: File, category: string): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const res = await fetch(`${API_BASE}/documents`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload error");
    }

    return res.json();
  },

  deleteDocument: (id: string) =>
    fetchApi<{ message: string }>(`/documents/${id}`, { method: "DELETE" }),

  chatDocument: (id: string, query: string) =>
    fetchApi<{ response: string; sources: any[] }>(`/documents/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ query }),
    }),

  // Schemas
  getSchemas: () =>
    fetchApi<{ items: ExtractionSchemaItem[]; total: number }>("/schemas?limit=100").then((r) => r.items),

  createSchema: (data: {
    name: string;
    description?: string;
    schema_definition: Record<string, any>;
  }) =>
    fetchApi<ExtractionSchemaItem>("/schemas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSchema: (
    id: string,
    data: {
      name: string;
      description?: string;
      schema_definition: Record<string, any>;
    }
  ) =>
    fetchApi<ExtractionSchemaItem>(`/schemas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteSchema: (id: string) =>
    fetchApi<void>(`/schemas/${id}`, { method: "DELETE" }),

  // Extractions
  runExtraction: (document_id: string, schema_id?: string) =>
    fetchApi<ExtractionResult>("/extractions", {
      method: "POST",
      body: JSON.stringify({ document_id, schema_id }),
    }),

  // Vector Search
  search: (query: string, document_id?: string) =>
    fetchApi<{ results: SearchResultItem[] }>("/search", {
      method: "POST",
      body: JSON.stringify({ query, document_id }),
    }).then((r) => r.results),

  // Knowledge Graph
  getGraph: (document_id?: string) =>
    fetchApi<GraphData>(
      `/graph${document_id ? `?document_id=${document_id}` : ""}`
    ),

  // Timeline
  getTimeline: (document_id?: string) =>
    fetchApi<TimelineData>(
      `/timeline${document_id ? `?document_id=${document_id}` : ""}`
    ),

  // Reconciliation
  reconcile: (doc1Id: string, doc2Id: string) =>
    fetchApi<ReconciliationResult>("/reconciliation", {
      method: "POST",
      body: JSON.stringify({ document_1_id: doc1Id, document_2_id: doc2Id }),
    }),
};
