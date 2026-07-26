import logging
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, Extraction, GraphEntity

logger = logging.getLogger("docuflow-timeline-service")


class TimelineEvent(BaseModel):
    id: str
    document_id: str
    document_title: str
    event_type: str
    event_date: str
    description: str
    confidence: float
    metadata: dict[str, Any] = Field(default_factory=dict)


class TimelineResponse(BaseModel):
    timeline: list[TimelineEvent]


class TimelineService:
    """
    Timeline Intelligence Engine.
    Reconstructs chronological lifecycles of business processes
    across interconnected documents (Quotation -> PO -> Invoice -> Payment -> Delivery).
    """

    async def reconstruct_timeline(
        self, session: AsyncSession, document_id: uuid.UUID | None = None
    ) -> TimelineResponse:
        """
        Gathers documents, extracts key dates, resolves references,
        detects missing steps, and orders everything chronologically.
        """
        logger.info("Reconstructing chronological lifecycle timeline...")

        # 1. Fetch relevant documents
        doc_stmt = select(Document)
        if document_id:
            # Find documents related to target. In KG context,
            # this resolves linked docs via shared entities.
            # Otherwise we rebuild the workspace timeline.
            pass

        doc_res = await session.execute(doc_stmt)
        documents = doc_res.scalars().all()

        events_list: list[TimelineEvent] = []

        # 2. Iterate and extract timeline events
        for doc in documents:
            # Fetch structured extraction details if any
            ext_stmt = select(Extraction).where(Extraction.document_id == doc.id)
            ext_res = await session.execute(ext_stmt)
            extraction = ext_res.scalars().first()

            # Fetch graph entities for reference resolution
            ge_stmt = select(GraphEntity).where(GraphEntity.document_id == doc.id)
            ge_res = await session.execute(ge_stmt)
            entities = ge_res.scalars().all()

            # Strategy A: Explicit Date Matching inside extracted properties
            event_date_str = None
            properties = {}
            if extraction and extraction.structured_data:
                if isinstance(extraction.structured_data, dict) and "data" in extraction.structured_data:
                    properties = extraction.structured_data["data"] or {}
                elif isinstance(extraction.structured_data, dict):
                    properties = extraction.structured_data
                # Try common date keys
                for date_key in [
                    "invoice_date",
                    "billing_date",
                    "date",
                    "issue_date",
                    "payment_date",
                    "delivery_date",
                    "po_date",
                ]:
                    if properties.get(date_key):
                        event_date_str = str(properties[date_key])
                        break

            # Strategy B: Entity Date matching (Fallback)
            if not event_date_str:
                for ent in entities:
                    if ent.type == "DATE" and ent.name:
                        event_date_str = ent.name
                        break

            # Strategy C: Default fallback to document creation date
            if not event_date_str:
                event_date_str = doc.created_at.strftime("%Y-%m-%d")

            # Try parsing date to standardize the format
            norm_date = self._normalize_date(event_date_str)

            # Resolve references (Invoice number, Supplier name, PO references)
            references = {}
            for ent in entities:
                if ent.type in ["INVOICE", "PURCHASEORDER", "SUPPLIER"]:
                    references[ent.type.lower()] = ent.name

            # Generate description based on category
            description = f"Processed {doc.category.lower()} document: {doc.filename}."
            if doc.category == "INVOICE" and "amount" in properties:
                supp = references.get("supplier", "supplier")
                inv_no = references.get("invoice", "")
                description = (
                    f"Invoice {inv_no} billing " f"${properties['amount']} from {supp}."
                )

            events_list.append(
                TimelineEvent(
                    id=str(doc.id),
                    document_id=str(doc.id),
                    document_title=doc.filename,
                    event_type=doc.category,
                    event_date=norm_date,
                    description=description,
                    confidence=0.95 if extraction else 0.60,
                    metadata={
                        "category": doc.category,
                        "references": references,
                        "size_bytes": doc.size_bytes,
                        "entities": [ent.name for ent in entities],
                    },
                )
            )

        # 3. Sort chronologically
        events_list.sort(key=lambda ev: ev.event_date)

        # 4. Detect missing steps in lifecycle (e.g. missing receipt)
        self._detect_missing_links(events_list)

        return TimelineResponse(timeline=events_list)

    def _normalize_date(self, raw_date: str) -> str:
        """
        Parses various date format representations to standard YYYY-MM-DD.
        """
        for fmt in (
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%B %d, %Y",
            "%Y/%m/%d",
        ):
            try:
                return datetime.strptime(raw_date.strip(), fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        # Fallback to standard check/default if failed
        return raw_date

    def _detect_missing_links(self, events: list[TimelineEvent]) -> None:
        """
        Iterates over the sorted event sequence and populates missing links.
        """
        categories = [ev.event_type for ev in events]

        # Standard Procurement Lifecycle Flow:
        # QUOTATION -> PURCHASE_ORDER -> DELIVERY_NOTE -> INVOICE -> PAYMENT_RECEIPT
        lifecycle_flow = [
            "QUOTATION",
            "PURCHASE_ORDER",
            "DELIVERY_NOTE",
            "INVOICE",
            "PAYMENT_RECEIPT",
        ]

        for ev in events:
            missing = []
            current_idx = -1
            if ev.event_type in lifecycle_flow:
                current_idx = lifecycle_flow.index(ev.event_type)

            if current_idx != -1:
                # For later stages, verify if previous stages exist
                for prev_stage in lifecycle_flow[:current_idx]:
                    if prev_stage not in categories:
                        missing.append(prev_stage)

            if missing:
                ev.metadata["missing_lifecycle_links"] = missing
