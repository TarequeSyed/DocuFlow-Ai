import logging
import uuid
from typing import Any, cast

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.document import GraphEntity, GraphRelationship

logger = logging.getLogger("docuflow-graph-service")


class EntityExtracted(BaseModel):
    name: str = Field(
        description="Name or value of the entity (e.g., 'Acme Corp', 'INV-2026-90')"
    )
    type: str = Field(description="Entity type category (e.g. 'Supplier', 'Invoice')")
    properties: dict[str, Any] = Field(
        default_factory=dict, description="Additional key-value fields"
    )


class RelationshipExtracted(BaseModel):
    source_name: str = Field(description="Name of the source entity")
    target_name: str = Field(description="Name of the target entity")
    type: str = Field(
        description="Type: 'ISSUED', 'CONTAINS', 'REFERENCES', 'PAID', 'SIGNED_BY', 'FULFILLS'"
    )
    properties: dict[str, Any] = Field(
        default_factory=dict, description="Additional edge properties"
    )


class GraphExtractionResult(BaseModel):
    entities: list[EntityExtracted]
    relationships: list[RelationshipExtracted]


class GraphService:
    """
    Service running structured LLM entity extraction and building
    semantic nodes and relationship edges inside PostgreSQL tables.
    """

    async def extract_and_persist_graph(
        self,
        session: AsyncSession,
        document_id: uuid.UUID,
        text: str,
        category: str,
    ) -> None:
        """
        Parses document text, extracts entities/relationships, and persists to db.
        """
        logger.info(f"Extracting knowledge graph for document {document_id}...")

        # 1. Clean existing records if any
        ent_del_stmt = select(GraphEntity).where(GraphEntity.document_id == document_id)
        ent_res = await session.execute(ent_del_stmt)
        for ent in ent_res.scalars().all():
            await session.delete(ent)

        rel_del_stmt = select(GraphRelationship).where(
            GraphRelationship.document_id == document_id
        )
        rel_res = await session.execute(rel_del_stmt)
        for rel in rel_res.scalars().all():
            await session.delete(rel)

        await session.commit()

        # 2. Run extraction
        api_key = settings.OPENAI_API_KEY
        if api_key and api_key.strip():
            logger.info("Extracting graph elements via OpenAI structured output...")
            try:
                graph_data = await self._extract_via_openai(text, category, api_key)
            except Exception as err:
                logger.warning(f"OpenAI graph extraction failed: {err}. Using mock rules.")
                graph_data = self._extract_via_mock(text, category)
        else:
            logger.warning(
                "OPENAI_API_KEY not configured. Falling back to mock graph builder."
            )
            graph_data = self._extract_via_mock(text, category)

        # 3. Persist entities and map names to DB IDs
        entity_map: dict[str, GraphEntity] = {}
        for ent_extracted in graph_data.entities:
            ent_name = ent_extracted.name.strip().lower()
            ent_type = ent_extracted.type.strip().upper()
            key = f"{ent_name}:{ent_type}"
            if key in entity_map:
                continue

            db_entity = GraphEntity(
                document_id=document_id,
                name=ent_extracted.name.strip(),
                type=ent_extracted.type.strip().upper(),
                properties=ent_extracted.properties,
            )
            session.add(db_entity)
            entity_map[key] = db_entity

        await session.flush()  # Generate entity IDs

        # 4. Persist relationships mapping source/target names to DB IDs
        for rel_extracted in graph_data.relationships:
            src_key = f"{rel_extracted.source_name.strip().lower()}:"
            tgt_key = f"{rel_extracted.target_name.strip().lower()}:"

            src_entity = None
            tgt_entity = None

            for key, entity in entity_map.items():
                if key.startswith(src_key):
                    src_entity = entity
                if key.startswith(tgt_key):
                    tgt_entity = entity

            if src_entity and tgt_entity:
                db_rel = GraphRelationship(
                    document_id=document_id,
                    source_id=src_entity.id,
                    target_id=tgt_entity.id,
                    type=rel_extracted.type.strip().upper(),
                    properties=rel_extracted.properties,
                )
                session.add(db_rel)

        await session.commit()
        logger.info(
            f"Knowledge Graph updated for document {document_id}. "
            f"Nodes: {len(entity_map)}, Edges: {len(graph_data.relationships)}"
        )

    async def get_graph(
        self, session: AsyncSession, document_id: uuid.UUID | None = None
    ) -> dict[str, Any]:
        """
        Retrieves graph nodes and edges in standard Cytoscape JSON-friendly format.
        """
        logger.info("Fetching knowledge graph representation...")

        ent_stmt = select(GraphEntity)
        if document_id:
            ent_stmt = ent_stmt.where(GraphEntity.document_id == document_id)
        ent_res = await session.execute(ent_stmt)
        db_entities = ent_res.scalars().all()

        rel_stmt = select(GraphRelationship)
        if document_id:
            rel_stmt = rel_stmt.where(GraphRelationship.document_id == document_id)
        rel_res = await session.execute(rel_stmt)
        db_relationships = rel_res.scalars().all()

        nodes = []
        for ent in db_entities:
            nodes.append(
                {
                    "id": str(ent.id),
                    "name": ent.name,
                    "label": ent.name,
                    "type": ent.type,
                    "document_id": str(ent.document_id),
                    "properties": ent.properties,
                }
            )

        edges = []
        for rel in db_relationships:
            edges.append(
                {
                    "id": str(rel.id),
                    "source": str(rel.source_id),
                    "target": str(rel.target_id),
                    "type": rel.type,
                    "document_id": str(rel.document_id),
                    "properties": rel.properties,
                }
            )

        return {"nodes": nodes, "edges": edges}

    async def _extract_via_openai(
        self, text: str, category: str, api_key: str
    ) -> GraphExtractionResult:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_openai import ChatOpenAI

        system_prompt = (
            "You are an expert knowledge graph extraction agent.\n"
            "Analyze the document text and extract entities "
            "(Supplier, Customer, Invoices, Amounts, Dates, Legal Terms, Patient, Diagnosis, Research Concept) "
            "and their semantic relationships (ISSUED, PAID, REFERENCES, SIGNED_BY, DIAGNOSED, CITING).\n"
            "Return ONLY a valid JSON object matching the requested schema.\n"
            "Do NOT wrap output in markdown."
        )

        llm = ChatOpenAI(openai_api_key=api_key, model="gpt-4o-mini", temperature=0.0, max_tokens=5000)
        structured_llm = llm.with_structured_output(GraphExtractionResult)
        result = await structured_llm.ainvoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(
                    content=f"Category: {category}\nDocument Context:\n{text[:6000]}"
                ),
            ]
        )
        return cast(GraphExtractionResult, result)

    def _extract_via_mock(self, text: str, category: str) -> GraphExtractionResult:
        cat_upper = category.upper()
        entities: list[EntityExtracted] = []
        relationships: list[RelationshipExtracted] = []

        if cat_upper in ["INVOICE", "PURCHASE_ORDER", "QUOTATION", "DELIVERY_NOTE", "PAYMENT_RECEIPT", "WARRANTY"]:
            vendor = "Acme Energy Corp"
            inv_no = "INV-2026-90"
            po_no = "PO-8877"

            entities.append(EntityExtracted(name=vendor, type="Supplier", properties={"role": "Vendor"}))
            entities.append(EntityExtracted(name=inv_no, type="Invoice", properties={"number": inv_no}))
            entities.append(EntityExtracted(name=po_no, type="PurchaseOrder", properties={"number": po_no}))
            entities.append(EntityExtracted(name="$13,500.00", type="Amount", properties={"currency": "USD"}))
            entities.append(EntityExtracted(name="2026-07-11", type="Date", properties={"date": "2026-07-11"}))

            relationships.append(RelationshipExtracted(source_name=vendor, target_name=inv_no, type="ISSUED"))
            relationships.append(RelationshipExtracted(source_name=inv_no, target_name=po_no, type="FULFILLS"))
            relationships.append(RelationshipExtracted(source_name=inv_no, target_name="$13,500.00", type="CONTAINS"))
            relationships.append(RelationshipExtracted(source_name=inv_no, target_name="2026-07-11", type="REFERENCES"))

        elif cat_upper in ["CONTRACT", "NDA", "AMENDMENT", "COMPLIANCE"]:
            contract_name = "Master Services Agreement"
            party_a = "Nexus AI Inc"
            party_b = "Global Logistics LLC"

            entities.append(EntityExtracted(name=contract_name, type="Contract", properties={"status": "Active"}))
            entities.append(EntityExtracted(name=party_a, type="Company", properties={"role": "Provider"}))
            entities.append(EntityExtracted(name=party_b, type="Company", properties={"role": "Client"}))
            entities.append(EntityExtracted(name="Indemnification Clause", type="Clause", properties={"section": "8.2"}))

            relationships.append(RelationshipExtracted(source_name=contract_name, target_name=party_a, type="SIGNED_BY"))
            relationships.append(RelationshipExtracted(source_name=contract_name, target_name=party_b, type="SIGNED_BY"))
            relationships.append(RelationshipExtracted(source_name=contract_name, target_name="Indemnification Clause", type="CONTAINS"))

        elif cat_upper in ["ADMISSION", "LAB_REPORT", "DIAGNOSIS", "DISCHARGE"]:
            patient = "John Doe (ID #8892)"
            facility = "Metro General Hospital"
            diag = "Acute Bronchitis"

            entities.append(EntityExtracted(name=patient, type="Patient", properties={"age": 45}))
            entities.append(EntityExtracted(name=facility, type="Facility", properties={"city": "Chicago"}))
            entities.append(EntityExtracted(name=diag, type="Diagnosis", properties={"icd10": "J20.9"}))

            relationships.append(RelationshipExtracted(source_name=facility, target_name=patient, type="ADMITTED"))
            relationships.append(RelationshipExtracted(source_name=patient, target_name=diag, type="DIAGNOSED_WITH"))

        elif cat_upper in ["BALANCE_SHEET", "AUDIT_REPORT", "TAX_FILING", "REMITTANCE"]:
            entity_name = "Apex Capital LLC"
            audit_firm = "PwC Advisory"
            revenue = "$4,250,000.00"

            entities.append(EntityExtracted(name=entity_name, type="Organization", properties={"type": "Corporation"}))
            entities.append(EntityExtracted(name=audit_firm, type="Auditor", properties={"status": "Unqualified Opinion"}))
            entities.append(EntityExtracted(name=revenue, type="Revenue", properties={"year": "2025"}))

            relationships.append(RelationshipExtracted(source_name=audit_firm, target_name=entity_name, type="AUDITED"))
            relationships.append(RelationshipExtracted(source_name=entity_name, target_name=revenue, type="REPORTED"))

        else:
            paper_title = "Hierarchical Navigable Small World Indexing"
            concept_a = "Vector Embeddings"
            concept_b = "HNSW Cosine Ops"

            entities.append(EntityExtracted(name=paper_title, type="Publication", properties={"year": "2026"}))
            entities.append(EntityExtracted(name=concept_a, type="Concept", properties={}))
            entities.append(EntityExtracted(name=concept_b, type="Algorithm", properties={}))

            relationships.append(RelationshipExtracted(source_name=paper_title, target_name=concept_a, type="UTILIZES"))
            relationships.append(RelationshipExtracted(source_name=paper_title, target_name=concept_b, type="EVALUATES"))

        return GraphExtractionResult(entities=entities, relationships=relationships)
