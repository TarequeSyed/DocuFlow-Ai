import logging
import uuid

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.document import Document, DocumentChunk
from app.providers.embeddings.factory import EmbeddingProviderFactory
from app.repositories.vector import VectorRepository
from app.services.graph.graph_service import GraphService
from app.services.parsing.parser import IntelligentParserOrchestrator
from app.services.retrieval.chunker import IntelligentChunker
from app.services.workspace.classifier import IntelligentDocumentClassifier

logger = logging.getLogger("docuflow-processor")


class DocumentProcessor:
    """
    Background executor running text parsing, classification, chunking,
    embedding generation, and pgvector database indexing.
    """

    def __init__(self) -> None:
        self.parser_orchestrator = IntelligentParserOrchestrator()
        self.classifier = IntelligentDocumentClassifier()
        self.chunker = IntelligentChunker()
        self.vector_repository = VectorRepository()
        self.graph_service = GraphService()

    async def process_document(self, document_id: uuid.UUID) -> None:
        """
        Loads document record, parses storage bytes, runs category classification,
        creates overlapping text chunks, embeds chunks, and saves to vector store.
        """
        logger.info(f"Background task triggered for document ID: {document_id}")

        async with AsyncSessionLocal() as session:
            # 1. Retrieve the document record
            stmt = select(Document).where(Document.id == document_id)
            result = await session.execute(stmt)
            db_doc = result.scalar_one_or_none()

            if not db_doc:
                logger.error(f"Document ID {document_id} not found in database.")
                return

            # Update status to PARSING
            db_doc.status = "PARSING"
            await session.commit()

            try:
                # 2. Read stored file content
                logger.info(f"Reading file from local storage: {db_doc.file_path}")
                with open(db_doc.file_path, "rb") as f:
                    file_content = f.read()

                # 3. Parse Document Content
                pages = await self.parser_orchestrator.parse_document_pages(
                    file_content, db_doc.mime_type
                )
                extracted_text = "\n".join(pages).strip()

                # 4. Classify Document Type
                if db_doc.category == "UNKNOWN" or not db_doc.category:
                    file_metadata = {
                        "filename": db_doc.filename,
                        "mime_type": db_doc.mime_type,
                        "size_bytes": db_doc.size_bytes,
                    }
                    category = await self.classifier.classify(extracted_text, file_metadata)
                else:
                    category = db_doc.category

                # 5. Segment Text into Chunks page-by-page
                logger.info("Splitting text layer into chunks page-by-page...")
                chunks_data = []
                global_chunk_idx = 0
                for page_idx, page_text in enumerate(pages):
                    page_number = page_idx + 1
                    if not page_text.strip():
                        continue

                    page_metadata = {
                        "document_id": str(document_id),
                        "page_number": page_number,
                    }
                    page_chunks = self.chunker.split_text(page_text, page_metadata)

                    for chunk in page_chunks:
                        chunk["global_chunk_index"] = global_chunk_idx
                        chunk["page_number"] = page_number
                        global_chunk_idx += 1
                        chunks_data.append(chunk)

                # 6. Generate Vector Embeddings (GPU/CPU Threadpool offloaded)
                if chunks_data:
                    logger.info(
                        f"Generating embeddings for {len(chunks_data)} chunks..."
                    )
                    provider = EmbeddingProviderFactory.get_provider()
                    texts = [c["content"] for c in chunks_data]
                    embeddings = await provider.embed_documents(texts)

                    # Build SQLAlchemy chunk model instances
                    db_chunks = []
                    for chunk, emb in zip(chunks_data, embeddings, strict=False):
                        db_chunks.append(
                            DocumentChunk(
                                document_id=document_id,
                                chunk_index=chunk["global_chunk_index"],
                                content=chunk["content"],
                                embedding=emb,
                                page_number=chunk["page_number"],
                            )
                        )

                    # Bulk insert chunks + vectors to PostgreSQL pgvector tables
                    logger.info("Bulk-saving vector chunks to database...")
                    await self.vector_repository.bulk_insert_chunks(session, db_chunks)

                # 7. Extract Knowledge Graph Entities & Relationships
                try:
                    await self.graph_service.extract_and_persist_graph(
                        session, document_id, extracted_text, category
                    )
                except Exception as graph_err:
                    logger.error(
                        f"Graph extraction failed for {document_id}: {graph_err}",
                        exc_info=True,
                    )

                # 8. Update parent document state
                db_doc.full_text = extracted_text
                db_doc.category = category
                db_doc.status = "PARSED"
                db_doc.error_message = None

                logger.info(
                    f"Document processing completed for {document_id}. "
                    f"Classified as: {category}. Indexed {len(chunks_data)} chunks."
                )

            except Exception as e:
                logger.error(
                    f"Document processing failed for {document_id}: {e}",
                    exc_info=True,
                )
                db_doc.status = "FAILED"
                db_doc.error_message = str(e)

            # Commit updates
            await session.commit()
