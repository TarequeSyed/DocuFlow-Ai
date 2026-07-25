from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.core.logging import get_logger
from app.models.document import (
    Document,
    DocumentChunk,
    Extraction,
    ExtractionSchema,
    GraphEntity,
    GraphRelationship,
)
from app.services.workspace.demo_seeder import run_demo_seed

logger = get_logger("demo-api")

router = APIRouter(prefix="/demo", tags=["Demo Workspace"])


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_demo_workspace(
    domain: str = Query(
        default="procurement",
        description="Demo workspace domain: 'procurement', 'legal', 'medical', 'financial', 'research'",
    ),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Seeds domain-specific demo workspace dataset and executes parsing,
    vector embedding, graph creation, timeline building, and structured extractions.
    """
    logger.info(f"Received request to seed demo workspace for domain: {domain}")
    result = await run_demo_seed(db, domain=domain)
    return result


@router.delete("/reset", status_code=status.HTTP_200_OK)
async def reset_demo_workspace(
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Clears all documents, chunks, graph entities, extractions, and schemas from database.
    """
    logger.info("Received request to reset demo workspace.")
    await db.execute(delete(GraphRelationship))
    await db.execute(delete(GraphEntity))
    await db.execute(delete(Extraction))
    await db.execute(delete(DocumentChunk))
    await db.execute(delete(Document))
    await db.execute(delete(ExtractionSchema))
    await db.commit()

    return {
        "status": "success",
        "message": "Demo workspace database successfully reset.",
    }
