import pytest
import os
from os import path
from app.services.explainability.provenance import ProvenanceService
from app.services.explainability.reasoning_trace import ReasoningTraceBuilder


def test_reasoning_trace_builder():
    """
    Tests ReasoningTraceBuilder accumulates steps and calculates execution timing.
    """
    builder = ReasoningTraceBuilder(model_name="gpt-4o-mini")
    builder.add_step(
        title="Vector Search",
        description="Retrieved 3 chunks from vector store.",
        confidence=0.92,
    )
    builder.add_step(
        title="Schema Validation",
        description="Validated Pydantic model.",
        confidence=0.98,
    )

    trace = builder.build()
    assert trace.trace_id is not None
    assert len(trace.steps) == 2
    assert trace.steps[0].step_number == 1
    assert trace.steps[0].title == "Vector Search"
    assert trace.steps[1].step_number == 2
    assert trace.steps[1].title == "Schema Validation"
    assert trace.total_execution_ms >= 0.0
    assert trace.model_name == "gpt-4o-mini"


def test_provenance_service():
    """
    Tests ProvenanceService compiles report with citations and reasoning trace.
    """
    service = ProvenanceService()
    chunks = [
        {
            "document_id": "doc-1",
            "chunk_id": "chunk-1",
            "content": "Invoice #1024 total amount is $13,500.00.",
            "score": 0.95,
            "metadata": {"page_number": 1},
        }
    ]

    report = service.compile_provenance(chunks)
    assert report.overall_confidence == 0.95
    assert len(report.citations) == 1
    assert report.citations[0].document_id == "doc-1"
    assert report.citations[0].page_number == 1
    assert report.reasoning_trace is not None
    assert len(report.reasoning_trace.steps) == 2
