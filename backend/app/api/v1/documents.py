import hashlib
import os
import uuid
from typing import Any

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.models.document import Document
from app.schemas.document import DocumentListResponse, DocumentResponse
from app.services.workspace.processor import DocumentProcessor

router = APIRouter(prefix="/documents", tags=["Documents"])
processor = DocumentProcessor()

UPLOAD_DIR = "uploads"


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: str = Form("UNKNOWN"),
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Uploads a document. Checks file hash to prevent duplicate uploads,
    persists payload to disk, creates DB records, and triggers background processing.
    """
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Calculate SHA256 of the content to enforce indexing integrity
    file_hash = hashlib.sha256(content).hexdigest()

    # Query existing file records
    stmt = select(Document).where(Document.file_hash == file_hash)
    result = await session.execute(stmt)
    existing_doc = result.scalar_one_or_none()

    if existing_doc:
        logger_name = "docuflow-api"
        import logging

        logging.getLogger(logger_name).info(
            f"File already uploaded. Returning existing document ID: {existing_doc.id}"
        )
        return existing_doc

    # Persist file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_extension = os.path.splitext(file.filename or "")[1]
    saved_filename = f"{file_hash}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Save initial database record (Status: PENDING)
    new_doc = Document(
        filename=file.filename or "unknown",
        file_path=file_path,
        file_hash=file_hash,
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        status="PENDING",
        category=category,
    )
    session.add(new_doc)
    await session.commit()
    await session.refresh(new_doc)

    # Execute text extraction asynchronously
    background_tasks.add_task(processor.process_document, new_doc.id)

    return new_doc


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Retrieves status and metadata for a specific document.
    """
    stmt = select(Document).where(Document.id == document_id)
    result = await session.execute(stmt)
    db_doc = result.scalar_one_or_none()

    if not db_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found.",
        )

    return db_doc


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    skip: int = 0,
    limit: int = 10,
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Lists paginated uploaded documents records.
    """
    stmt = (
        select(Document).order_by(Document.created_at.desc()).offset(skip).limit(limit)
    )
    result = await session.execute(stmt)
    documents = result.scalars().all()

    count_stmt = select(func.count()).select_from(Document)
    count_result = await session.execute(count_stmt)
    total = count_result.scalar() or 0

    return {"items": documents, "total": total}


from app.services.retrieval.orchestrator import AdaptiveRetrievalOrchestrator
from app.core.config import settings
from pydantic import BaseModel

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str
    sources: list[dict[str, Any]]

orchestrator = AdaptiveRetrievalOrchestrator()

@router.post("/{document_id}/chat", response_model=ChatResponse)
async def chat_with_document(
    document_id: uuid.UUID,
    payload: ChatRequest,
    session: AsyncSession = Depends(get_db_session),
) -> Any:
    """
    Document-scoped dynamic QA chat. Performs semantic search over chunks and
    queries LLM for a natural context-specific answer.
    """
    chunks = await orchestrator.retrieve(
        session,
        query=payload.query,
        document_id=document_id,
        limit=4,
    )
    
    context = "\n\n".join([f"--- Chunk {i+1} ---\n{c['content']}" for i, c in enumerate(chunks)])
    
    api_key = settings.OPENAI_API_KEY
    if api_key and api_key.strip():
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import SystemMessage, HumanMessage
            
            system_prompt = (
                "You are a helpful, extremely concise document question-answering assistant.\n"
                "Answer the user's question based ONLY on the provided document chunks.\n"
                "Be direct, specific, and format key details nicely. Do not start with generic pleasantries.\n"
                "If the context does not contain the answer, state that you cannot find it in the document."
            )
            
            llm = ChatOpenAI(openai_api_key=api_key, model="gpt-4o-mini", temperature=0.0, max_tokens=1000)
            user_prompt = f"Document Context Chunks:\n{context}\n\nQuestion: {payload.query}"
            
            response = await llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            answer = response.content.strip()
        except Exception as e:
            answer = f"Error querying LLM: {str(e)}. Context match:\n\n{chunks[0]['content'] if chunks else ''}"
    else:
        if chunks:
            answer = f"Here is the relevant excerpt from the document:\n\n\"{chunks[0]['content']}\""
        else:
            answer = "I could not find any relevant information in the document context."

    return {
        "response": answer,
        "sources": [
            {
                "chunk_id": c["chunk_id"],
                "document_id": str(c["document_id"]),
                "content": c["content"],
                "score": c["score"],
                "page_number": c.get("page_number") or 1,
            }
            for c in chunks
        ]
    }
