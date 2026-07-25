import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.models.document import Document, Extraction, ExtractionSchema
from app.schemas.extraction import (
    CitationItem,
    ExtractionRequest,
    ExtractionResponse,
    ProvenanceDTO,
)
from app.services.explainability.provenance import ProvenanceService
from app.services.extraction.extractor import StructuredExtractor
from app.services.retrieval.orchestrator import AdaptiveRetrievalOrchestrator

router = APIRouter(prefix="/extractions", tags=["Extractions"])

orchestrator = AdaptiveRetrievalOrchestrator()
extractor = StructuredExtractor()
provenance_service = ProvenanceService()


@router.post("", response_model=ExtractionResponse, status_code=status.HTTP_201_CREATED)
async def trigger_extraction(
    payload: ExtractionRequest,
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Retrieves document chunks, performs schema-based structured LLM extraction,
    assembles provenance citation traces, and saves results.
    """
    # 1. Fetch document and schema details
    doc_stmt = select(Document).where(Document.id == payload.document_id)
    doc_res = await session.execute(doc_stmt)
    db_doc = doc_res.scalar_one_or_none()

    if not db_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document ID {payload.document_id} not found.",
        )

    schema_stmt = select(ExtractionSchema).where(
        ExtractionSchema.id == payload.schema_id
    )
    schema_res = await session.execute(schema_stmt)
    db_schema = schema_res.scalar_one_or_none()

    if not db_schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schema ID {payload.schema_id} not found.",
        )

    try:
        # 2. Retrieve relevant chunks using query intent
        logger_name = "docuflow-api"
        import logging

        logger = logging.getLogger(logger_name)

        props_def = (
            db_schema.schema_definition.get("properties", db_schema.schema_definition)
            if isinstance(db_schema.schema_definition, dict)
            else {}
        )
        field_keys = list(props_def.keys())
        query = f"fields matching: {', '.join(field_keys)}"
        logger.info(f"Retrieving chunks for extraction query: '{query}'")
        chunks = await orchestrator.retrieve(
            session, query, document_id=payload.document_id, limit=5
        )

        # Fallback to full text if chunks are not indexed
        context_text = ""
        if chunks:
            context_text = "\n\n".join([c["content"] for c in chunks])
        else:
            logger.warning("No chunks found. Falling back to raw full text layer.")
            context_text = db_doc.full_text or ""

        # 3. Extract JSON conforming to schema definitions
        extracted_data = await extractor.extract_structured_data(
            context_text, db_schema.schema_definition
        )

        # 4. Compile provenance audit trails
        provenance_report = provenance_service.compile_provenance(chunks)

        # Save provenance reports in structured JSON records
        result_payload = {
            "data": extracted_data,
            "provenance": provenance_report.model_dump(),
        }

        # 5. Commit record
        new_extraction = Extraction(
            document_id=payload.document_id,
            schema_id=payload.schema_id,
            structured_data=result_payload,
            status="SUCCESS",
        )
        session.add(new_extraction)
        await session.commit()
        await session.refresh(new_extraction)

        return _build_response_dto(new_extraction)

    except Exception as e:
        logger.error(f"Extraction execution failed: {e}", exc_info=True)
        # Create failed extraction run log
        failed_extraction = Extraction(
            document_id=payload.document_id,
            schema_id=payload.schema_id,
            status="FAILED",
            error_message=str(e),
        )
        session.add(failed_extraction)
        await session.commit()
        await session.refresh(failed_extraction)
        return failed_extraction


@router.get("/{extraction_id}", response_model=ExtractionResponse)
async def get_extraction(
    extraction_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Retrieves extraction results and citations by ID.
    """
    stmt = select(Extraction).where(Extraction.id == extraction_id)
    res = await session.execute(stmt)
    db_ext = res.scalar_one_or_none()

    if not db_ext:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Extraction ID {extraction_id} not found.",
        )

    return _build_response_dto(db_ext)


def _build_response_dto(db_ext: Extraction) -> ExtractionResponse:
    """
    Helper function extracting stored payload data and formatting the Response DTO.
    """
    structured_data = None
    provenance = None

    if db_ext.structured_data and "data" in db_ext.structured_data:
        structured_data = db_ext.structured_data["data"]

    if db_ext.structured_data and "provenance" in db_ext.structured_data:
        prov_raw = db_ext.structured_data["provenance"]
        citations = []
        for cite in prov_raw.get("citations", []):
            citations.append(
                CitationItem(
                    document_id=cite.get("document_id"),
                    chunk_id=cite.get("chunk_id"),
                    snippet=cite.get("snippet"),
                    page_number=cite.get("page_number"),
                    confidence_score=cite.get("confidence_score"),
                    retrieval_strategy=cite.get("retrieval_strategy"),
                )
            )
        provenance = ProvenanceDTO(
            citations=citations,
            overall_confidence=prov_raw.get("overall_confidence", 0.0),
        )

    return ExtractionResponse(
        id=db_ext.id,
        document_id=db_ext.document_id,
        schema_id=db_ext.schema_id,
        structured_data=structured_data,
        status=db_ext.status,
        error_message=db_ext.error_message,
        provenance=provenance,
        created_at=db_ext.created_at,
        updated_at=db_ext.updated_at,
    )
