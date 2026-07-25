import datetime
import uuid
from unittest.mock import MagicMock

import pytest
from httpx import AsyncClient

from app.models.document import Document, Extraction
from app.services.timeline.timeline_service import TimelineEvent, TimelineService


def test_normalize_date():
    """
    Tests _normalize_date correctly formats dates.
    """
    service = TimelineService()
    assert service._normalize_date("2026-07-21") == "2026-07-21"
    assert service._normalize_date("21/07/2026") == "2026-07-21"
    assert service._normalize_date("July 21, 2026") == "2026-07-21"
    # Fallback checks
    assert service._normalize_date("unknown_date") == "unknown_date"


def test_detect_missing_links():
    """
    Tests _detect_missing_links detects missing stages in procurement.
    """
    service = TimelineService()

    # Standard sequence:
    # QUOTATION -> PURCHASE_ORDER -> DELIVERY_NOTE -> INVOICE -> PAYMENT_RECEIPT
    # Test: Only PURCHASE_ORDER and PAYMENT_RECEIPT are present
    events = [
        TimelineEvent(
            id="1",
            document_id="1",
            document_title="po.pdf",
            event_type="PURCHASE_ORDER",
            event_date="2026-07-01",
            description="PO description",
            confidence=0.9,
        ),
        TimelineEvent(
            id="2",
            document_id="2",
            document_title="receipt.pdf",
            event_type="PAYMENT_RECEIPT",
            event_date="2026-07-15",
            description="Receipt description",
            confidence=0.9,
        ),
    ]

    service._detect_missing_links(events)

    # Event 1 is PURCHASE_ORDER. Preceding stages: QUOTATION.
    assert events[0].metadata.get("missing_lifecycle_links") == ["QUOTATION"]

    # Event 2 is PAYMENT_RECEIPT.
    # Preceding stages: QUOTATION, PURCHASE_ORDER, DELIVERY_NOTE, INVOICE.
    # Since PURCHASE_ORDER is present, only others should be missing.
    assert events[1].metadata.get("missing_lifecycle_links") == [
        "QUOTATION",
        "DELIVERY_NOTE",
        "INVOICE",
    ]


@pytest.mark.asyncio
async def test_reconstruct_timeline_with_data(mock_db_session):
    """
    Tests full reconstruct_timeline execution with mocked query outcomes.
    """
    doc_id = uuid.uuid4()
    mock_doc = Document(
        id=doc_id,
        filename="invoice.pdf",
        file_path="uploads/invoice.pdf",
        mime_type="application/pdf",
        size_bytes=1024,
        category="INVOICE",
        created_at=datetime.datetime(2026, 7, 21),
    )
    mock_ext = Extraction(
        id=uuid.uuid4(),
        document_id=doc_id,
        structured_data={"invoice_date": "2026-07-21", "amount": 150.00},
    )

    mock_execute_docs = MagicMock()
    mock_execute_docs.scalars.return_value.all.return_value = [mock_doc]

    mock_execute_ext = MagicMock()
    mock_execute_ext.scalars.return_value.first.return_value = mock_ext

    mock_execute_ge = MagicMock()
    mock_execute_ge.scalars.return_value.all.return_value = []

    # Mock DB execution sequence:
    # 1 for documents, 1 for extraction, 1 for graph entities
    mock_db_session.execute.side_effect = [
        mock_execute_docs,
        mock_execute_ext,
        mock_execute_ge,
    ]

    service = TimelineService()
    res = await service.reconstruct_timeline(mock_db_session)

    assert len(res.timeline) == 1
    assert res.timeline[0].event_date == "2026-07-21"
    assert "150.0" in res.timeline[0].description
    # Preceding stages for INVOICE should be missing since it's the only doc
    assert res.timeline[0].metadata.get("missing_lifecycle_links") == [
        "QUOTATION",
        "PURCHASE_ORDER",
        "DELIVERY_NOTE",
    ]


@pytest.mark.asyncio
async def test_api_get_timeline(client: AsyncClient, mock_db_session):
    """
    Tests GET /api/v1/timeline api response mapping.
    """
    mock_execute_res = MagicMock()
    mock_execute_res.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_execute_res

    response = await client.get("/api/v1/timeline")
    assert response.status_code == 200
    assert response.json() == {"timeline": []}
