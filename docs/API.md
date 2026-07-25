# 🔌 API Specification - DocuFlow AI

This document specifies the REST API endpoints, payload contracts, status codes, and error formats for **DocuFlow AI**.

---

## 1. Global API Standards

- **Base URL Prefix**: `/api/v1`
- **Request/Response Content-Type**: `application/json` (except `/documents` upload, which is `multipart/form-data`)
- **Query Standard**: Pagination via `limit` (default: 20, max: 100) and `offset` (default: 0).
- **Error Response Standard**: Every client-side or server-side error returns a standardized envelope.

### Error Envelope Example (400 Bad Request)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed for target properties.",
    "details": [
      {
        "loc": ["body", "schema_definition", "properties"],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
}
```

---

## 2. API Endpoints List

### A. System Health
#### `GET /api/v1/health`
Checks backend and database connectivity status.

- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "services": {
      "database": "connected",
      "vector_store": "available"
    },
    "timestamp": "2026-07-11T08:46:00Z"
  }
  ```

---

### B. Document Management

#### `POST /api/v1/documents`
Uploads a new document file. Resolves native text or pushes to OCR.

- **Request**: `multipart/form-data`
  - `file`: Binary file (PDF, PNG, JPG, DOCX).
- **Response (201 Created)**:
  ```json
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "filename": "invoice_2026.pdf",
    "mime_type": "application/pdf",
    "size_bytes": 1048576,
    "status": "PENDING",
    "created_at": "2026-07-11T08:46:00Z"
  }
  ```

#### `GET /api/v1/documents`
Lists uploaded documents. Supports status filters.

- **Query Parameters**:
  - `status`: String (Optional. E.g., `PENDING`, `PARSING`, `PARSED`, `FAILED`)
  - `limit`: Integer (Default: 20)
  - `offset`: Integer (Default: 0)
- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "filename": "invoice_2026.pdf",
        "status": "PARSED",
        "created_at": "2026-07-11T08:46:00Z"
      }
    ],
    "total": 1
  }
  ```

#### `GET /api/v1/documents/{id}`
Retrieves single document metadata and full extracted text.

- **Response (200 OK)**:
  ```json
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "filename": "invoice_2026.pdf",
    "mime_type": "application/pdf",
    "size_bytes": 1048576,
    "status": "PARSED",
    "full_text": "INVOICE #1024 ... Total: $450.00",
    "error_message": null,
    "created_at": "2026-07-11T08:46:00Z",
    "updated_at": "2026-07-11T08:47:00Z"
  }
  ```

#### `DELETE /api/v1/documents/{id}`
Deletes document, text, vector chunks, and extractions.

- **Response (204 No Content)**: Empty body.

---

### C. Extraction Schemas

#### `POST /api/v1/schemas`
Defines target schema properties for structured data extraction.

- **Request Body**:
  ```json
  {
    "name": "Invoice Schema",
    "description": "Standard fields to extract from supplier invoices.",
    "schema_definition": {
      "type": "object",
      "properties": {
        "invoice_number": { "type": "string", "description": "Unique invoice identifier" },
        "vendor": { "type": "string", "description": "Name of the supplier vendor" },
        "total_amount": { "type": "number", "description": "Total cost including tax" }
      },
      "required": ["invoice_number", "vendor", "total_amount"]
    }
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
    "name": "Invoice Schema",
    "description": "Standard fields to extract from supplier invoices.",
    "schema_definition": { ... },
    "created_at": "2026-07-11T08:46:00Z"
  }
  ```

#### `GET /api/v1/schemas`
Lists defined extraction schemas.

- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
        "name": "Invoice Schema",
        "created_at": "2026-07-11T08:46:00Z"
      }
    ],
    "total": 1
  }
  ```

---

### D. Document AI Extraction

#### `POST /api/v1/extractions`
Executes structured AI extraction on a parsed document.

- **Request Body**:
  ```json
  {
    "document_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "schema_id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4"
  }
  ```
- **Response (200 OK or 202 Accepted)**:
  ```json
  {
    "id": "8f7e6d5c-4b3a-2f1e-0d9c-8b7a6f5e4d3c",
    "document_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "schema_id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
    "status": "EXTRACTING",
    "structured_data": null,
    "created_at": "2026-07-11T08:46:00Z"
  }
  ```

#### `GET /api/v1/extractions/{id}`
Retrieves extracted structured values.

- **Response (200 OK)**:
  ```json
  {
    "id": "8f7e6d5c-4b3a-2f1e-0d9c-8b7a6f5e4d3c",
    "document_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "schema_id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
    "status": "SUCCESS",
    "structured_data": {
      "invoice_number": "INV-2026-098",
      "vendor": "Acme Clean Energy Corp",
      "total_amount": 450.00
    },
    "error_message": null,
    "created_at": "2026-07-11T08:46:00Z",
    "updated_at": "2026-07-11T08:46:15Z"
  }
  ```

---

### E. Semantic Search

#### `POST /api/v1/search`
Queries document chunks using semantic similarity (vector space).

- **Request Body**:
  ```json
  {
    "query": "What is the total energy consumption value?",
    "document_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "limit": 3
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "results": [
      {
        "chunk_id": "0c9b8a7f-6e5d-4c3b-2a1f-0e9d8c7b6a5f",
        "document_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "content": "Our total energy consumption for fiscal year 2026 was calculated at 4,250 MWh.",
        "score": 0.892
      }
    ]
  }
  ```

---

### F. Demo Workspace

#### `POST /api/v1/demo/seed`
Seeds standard demo workspace dataset (6 interconnected procurement documents) and executes parsing, vector embedding, graph creation, and structured extractions automatically.

- **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Successfully seeded 6 demo documents.",
    "documents": [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "filename": "01_quotation_acme_software.txt",
        "status": "PARSED",
        "category": "QUOTATION"
      }
    ],
    "schema_id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4"
  }
  ```

#### `DELETE /api/v1/demo/reset`
Clears all workspace documents, chunks, graph entities, extractions, and schemas.

- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Demo workspace database successfully reset."
  }
  ```
