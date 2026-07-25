import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.services.extraction.reasoner import CrossDocReasoner

router = APIRouter(prefix="/reconciliation", tags=["Reconciliation"])
reasoner = CrossDocReasoner()


class ReconcileRequest(BaseModel):
    document_1_id: uuid.UUID | None = Field(
        default=None, description="Primary document ID (or invoice_id)"
    )
    document_2_id: uuid.UUID | None = Field(
        default=None, description="Target document ID (or purchase_order_id)"
    )
    invoice_id: uuid.UUID | None = Field(default=None)
    purchase_order_id: uuid.UUID | None = Field(default=None)


@router.post("")
async def run_billing_reconciliation(
    req: ReconcileRequest,
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Executes cross-document discrepancy reconciliation matching metadata, entities,
    amounts, and line item references between two documents.
    """
    doc1_id = req.document_1_id or req.invoice_id
    doc2_id = req.document_2_id or req.purchase_order_id

    if not doc1_id or not doc2_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two valid document IDs (document_1_id and document_2_id) are required for reconciliation.",
        )

    try:
        return await reasoner.reconcile_billing(session, doc1_id, doc2_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reconciliation audit execution failed: {e}",
        ) from e
