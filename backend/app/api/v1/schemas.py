import uuid
from typing import Any

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.models.document import ExtractionSchema
from app.schemas.extraction import (
    SchemaCreateRequest,
    SchemaListResponse,
    SchemaResponse,
)

router = APIRouter(prefix="/schemas", tags=["Schemas"])


@router.post("", response_model=SchemaResponse, status_code=status.HTTP_201_CREATED)
async def create_schema(
    payload: SchemaCreateRequest,
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Registers a new target JSON validation schema template.
    """
    new_schema = ExtractionSchema(
        name=payload.name,
        description=payload.description,
        schema_definition=payload.schema_definition,
    )
    session.add(new_schema)
    await session.commit()
    await session.refresh(new_schema)
    return new_schema


@router.get("", response_model=SchemaListResponse)
async def list_schemas(
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Lists all available extraction schema templates.
    """
    stmt = select(ExtractionSchema).order_by(ExtractionSchema.name.asc())
    result = await session.execute(stmt)
    schemas = result.scalars().all()
    return {"items": schemas, "total": len(schemas)}


@router.put("/{schema_id}", response_model=SchemaResponse)
async def update_schema(
    schema_id: uuid.UUID,
    payload: SchemaCreateRequest,
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Updates an existing extraction schema template.
    """
    stmt = select(ExtractionSchema).where(ExtractionSchema.id == schema_id)
    result = await session.execute(stmt)
    schema = result.scalar_one_or_none()
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extraction schema template not found.",
        )
    schema.name = payload.name
    schema.description = payload.description
    schema.schema_definition = payload.schema_definition
    await session.commit()
    await session.refresh(schema)
    return schema


@router.delete("/{schema_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schema(
    schema_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> None:
    """
    Deletes an existing extraction schema template.
    """
    stmt = select(ExtractionSchema).where(ExtractionSchema.id == schema_id)
    result = await session.execute(stmt)
    schema = result.scalar_one_or_none()
    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extraction schema template not found.",
        )
    await session.delete(schema)
    await session.commit()
    return None
