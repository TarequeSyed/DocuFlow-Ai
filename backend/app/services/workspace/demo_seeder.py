import os
import fitz
import hashlib
import logging
from typing import Any

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import (
    Document,
    DocumentChunk,
    Extraction,
    ExtractionSchema,
    GraphEntity,
    GraphRelationship,
)
from app.providers.embeddings.factory import EmbeddingProviderFactory
from app.repositories.vector import VectorRepository
from app.services.extraction.extractor import StructuredExtractor
from app.services.graph.graph_service import GraphService
from app.services.parsing.parser import IntelligentParserOrchestrator
from app.services.retrieval.chunker import IntelligentChunker

logger = logging.getLogger("docuflow-demo-seeder")


async def run_demo_seed(
    session: AsyncSession, domain: str = "procurement"
) -> dict[str, Any]:
    """Seeds domain documents into the database and triggers processing.

    Supported domains: 'customer_a', 'customer_b', 'procurement', 'legal', 'medical', 'financial', 'research'
    """
    dom_key = domain.lower().strip()
    logger.info(f"Starting 1-Click Demo Seeder for domain: '{dom_key}'...")

    # 1. Clean existing workspace data to ensure clean state
    await session.execute(delete(GraphRelationship))
    await session.execute(delete(GraphEntity))
    await session.execute(delete(Extraction))
    await session.execute(delete(DocumentChunk))
    await session.execute(delete(Document))
    await session.execute(delete(ExtractionSchema))
    await session.commit()

    # 2. Select domain datasets
    documents_data, schema_data = _get_domain_dataset(dom_key)

    # 3. Create target Extraction Schema
    target_schema = ExtractionSchema(
        name=schema_data["name"],
        description=schema_data["description"],
        schema_definition=schema_data["schema_definition"],
    )
    session.add(target_schema)
    await session.commit()
    await session.refresh(target_schema)

    # 4. Instantiate pipeline orchestrators
    parser_orchestrator = IntelligentParserOrchestrator()
    graph_service = GraphService()
    extractor = StructuredExtractor()
    chunker = IntelligentChunker()
    vector_repository = VectorRepository()

    created_docs: list[Document] = []

    for doc_item in documents_data:
        # Programmatically compile a professional, styled PDF with standard layout
        pdf_doc = fitz.open()
        pdf_page = pdf_doc.new_page(width=595, height=842) # A4 Size

        # Styled page header banner box
        pdf_page.draw_rect(fitz.Rect(35, 35, 560, 95), color=(0.15, 0.25, 0.45), fill=(0.15, 0.25, 0.45), width=0)
        # Title inside banner
        pdf_page.insert_textbox(
            fitz.Rect(45, 45, 550, 85),
            f"DOCUFLOW INTELLIGENCE: {doc_item['category'].replace('_', ' ').upper()}",
            fontsize=12,
            fontname="Helvetica-Bold",
            color=(1, 1, 1),
            align=1
        )
        # Subtitle inside banner
        pdf_page.insert_textbox(
            fitz.Rect(45, 70, 550, 90),
            f"File: {doc_item['filename'].replace('.txt', '.pdf')} | Process: {dom_key.replace('_', ' ').upper()}",
            fontsize=8,
            fontname="Helvetica",
            color=(0.9, 0.9, 0.9),
            align=1
        )
        # Body text inside margin box
        pdf_page.insert_textbox(
            fitz.Rect(55, 120, 540, 780),
            doc_item["content"],
            fontsize=10,
            fontname="Helvetica",
            lineheight=1.45
        )

        pdf_bytes = pdf_doc.write()
        pdf_doc.close()

        file_hash = hashlib.sha256(pdf_bytes).hexdigest()
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{file_hash}.pdf"
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        db_doc = Document(
            filename=doc_item["filename"].replace(".txt", ".pdf"),
            mime_type="application/pdf",
            size_bytes=len(pdf_bytes),
            file_path=file_path,
            file_hash=file_hash,
            category=doc_item["category"],
            status="PARSING",
            full_text=doc_item["content"],
        )
        session.add(db_doc)
        await session.commit()
        await session.refresh(db_doc)

        # Parse page structures
        pages = await parser_orchestrator.parse_document_pages(
            pdf_bytes, "application/pdf"
        )

        # Build chunks & vector embeddings
        full_text = "\n\n".join(pages) if pages else doc_item["content"]
        db_doc.full_text = full_text
        db_doc.status = "PARSED"
        await session.commit()

        # Segment Text into Chunks page-by-page
        chunks_data = []
        global_chunk_idx = 0
        for page_idx, page_text in enumerate(pages):
            page_number = page_idx + 1
            if not page_text.strip():
                continue

            page_metadata = {
                "document_id": str(db_doc.id),
                "page_number": page_number,
            }
            page_chunks = chunker.split_text(page_text, page_metadata)

            for chunk in page_chunks:
                chunk["global_chunk_index"] = global_chunk_idx
                chunk["page_number"] = page_number
                global_chunk_idx += 1
                chunks_data.append(chunk)

        # Generate Vector Embeddings
        if chunks_data:
            provider = EmbeddingProviderFactory.get_provider()
            texts = [c["content"] for c in chunks_data]
            embeddings = await provider.embed_documents(texts)

            # Build SQLAlchemy chunk model instances
            db_chunks = []
            for chunk, emb in zip(chunks_data, embeddings, strict=False):
                db_chunks.append(
                    DocumentChunk(
                        document_id=db_doc.id,
                        chunk_index=chunk["global_chunk_index"],
                        content=chunk["content"],
                        embedding=emb,
                        page_number=chunk["page_number"],
                    )
                )

            # Bulk insert chunks to vector store database
            await vector_repository.bulk_insert_chunks(session, db_chunks)

        # Build Knowledge Graph Entities
        await graph_service.extract_and_persist_graph(
            session, db_doc.id, full_text, doc_item["category"]
        )

        # Perform Structured Extractions
        try:
            extracted_json = await extractor.extract_structured_data(
                full_text, schema_data["schema_definition"]
            )
            extraction_record = Extraction(
                document_id=db_doc.id,
                schema_id=target_schema.id,
                structured_data={"data": extracted_json},
                status="SUCCESS",
            )
            session.add(extraction_record)
            await session.commit()
        except Exception as ve:
            logger.warning(f"Demo extraction failed for {doc_item['filename']}: {ve}")

        created_docs.append(db_doc)

    return {
        "status": "success",
        "domain": dom_key,
        "message": (
            f"Successfully seeded {len(created_docs)} "
            f"demo files for domain '{dom_key}'."
        ),
        "documents_count": len(created_docs),
        "schema_id": str(target_schema.id),
        "document_ids": [str(d.id) for d in created_docs],
    }


def _get_domain_dataset(domain: str) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    if domain == "customer_a":
        docs = [
            {
                "filename": "01_rfq_alpha_2026_004.txt",
                "category": "QUOTATION",
                "content": """REQUEST FOR QUOTATION (RFQ)
RFQ ID: RFQ-ALPHA-2026-004
Date: July 01, 2026

Customer: Alpha Robotics Corp
Address: 12 Tech Park, Bangalore, Karnataka - 560066
GSTIN: 29AAAAA1111A1Z1
Contact: Dr. Rajesh Kumar (Head of Hardware Procurement)
Email: rajesh.k@alpharobotics.in

Supplier Reference: Lumina Sensors India
Address: 55 Laser Street, Pune, Maharashtra - 411013
GSTIN: 27BBBBB2222B1Z2
Contact: Ms. Priya Sen (Enterprise Sales Manager)

Alpha Robotics Corp is requesting pricing and availability details for the following precision navigation modules:
1. LIDAR Rangefinder L-04 (Product ID: LIDAR-L04) - Quantity: 15 units
2. Guidance Module G-88 (Product ID: GUIDE-G88) - Quantity: 15 units

Delivery requirements: DDP Bangalore, shipment required by July 15, 2026.
Payment Terms: Net 30 days upon invoice receipt.""",
            },
            {
                "filename": "02_quotation_lumina_904.txt",
                "category": "QUOTATION",
                "content": """COMMERCIAL QUOTATION (QUO-LUM-2026-904)
Date: July 03, 2026
RFQ Reference: RFQ-ALPHA-2026-004

Supplier: Lumina Sensors India
Address: 55 Laser Street, Pune, Maharashtra - 411013
GSTIN: 27BBBBB2222B1Z2
Contact: Ms. Priya Sen

Customer: Alpha Robotics Corp
Address: 12 Tech Park, Bangalore, Karnataka - 560066
GSTIN: 29AAAAA1111A1Z1
Contact: Dr. Rajesh Kumar

We are pleased to submit our quotation based on RFQ-ALPHA-2026-004:

Line Items:
1. LIDAR Rangefinder L-04 (LIDAR-L04)
   Qty: 15 units | Unit Price: $800.00 | Total: $12,000.00
2. Guidance Module G-88 (GUIDE-G88)
   Qty: 15 units | Unit Price: $600.00 | Total: $9,000.00

Subtotal: $21,000.00
Special Volume Discount (5%): -$1,050.00
Discounted Subtotal: $19,950.00
Integrated GST (IGST @ 18%): $3,591.00
Grand Total (inclusive of taxes): $23,541.00

Validity: Valid until July 31, 2026.
Lead Time: 5 business days from Purchase Order confirmation.
Payment Terms: Net 30 days.""",
            },
            {
                "filename": "03_purchase_order_alpha_8822.txt",
                "category": "PURCHASE_ORDER",
                "content": """PURCHASE ORDER (PO-ALPHA-8822)
Date: July 05, 2026
Quotation Reference: QUO-LUM-2026-904

Customer: Alpha Robotics Corp
Address: 12 Tech Park, Bangalore, Karnataka - 560066
GSTIN: 29AAAAA1111A1Z1
Contact: Dr. Rajesh Kumar

Supplier: Lumina Sensors India
Address: 55 Laser Street, Pune, Maharashtra - 411013
GSTIN: 27BBBBB2222B1Z2
Contact: Ms. Priya Sen

Please supply the following items in accordance with quotation QUO-LUM-2026-904:

Line Items:
1. LIDAR Rangefinder L-04 (LIDAR-L04)
   Qty: 15 units | Unit Price: $800.00 | Total: $12,000.00
2. Guidance Module G-88 (GUIDE-G88)
   Qty: 15 units | Unit Price: $600.00 | Total: $9,000.00

Gross Amount: $21,000.00
Contract Discount (5%): -$1,050.00
Net Taxable Amount: $19,950.00
IGST (18%): $3,591.00
Total Purchase Order Value: $23,541.00

Billing: Net 30 days. Bill to Alpha Robotics Corp.""",
            },
            {
                "filename": "04_delivery_note_lumina_0923.txt",
                "category": "DELIVERY_NOTE",
                "content": """DELIVERY CHALLAN & NOTE (DN-LUM-0923)
Date: July 12, 2026
Purchase Order Ref: PO-ALPHA-8822

Supplier / Dispatcher: Lumina Sensors India
Address: 55 Laser Street, Pune, Maharashtra - 411013
GSTIN: 27BBBBB2222B1Z2

Ship To: Alpha Robotics Corp
Address: 12 Tech Park, Bangalore, Karnataka - 560066
GSTIN: 29AAAAA1111A1Z1

Logistics Carrier: Apex Precision Delivery
Airway Bill / tracking ID: TRK-LUM-991

Delivered Goods Summary:
1. LIDAR Rangefinder L-04 (LIDAR-L04) - Quantity Dispatched: 15 units
2. Guidance Module G-88 (GUIDE-G88) - Quantity Dispatched: 15 units

Package count: 3 heavy crates.
Receiver Confirmation: Received all 30 units in good working condition.
Signed by: Dr. Rajesh Kumar (Head of Hardware Procurement, Alpha Robotics Corp).""",
            },
            {
                "filename": "05_invoice_lumina_402.txt",
                "category": "INVOICE",
                "content": """TAX INVOICE (INV-LUM-2026-402)
Invoice Date: July 14, 2026
Due Date: August 14, 2026
PO Reference: PO-ALPHA-8822

Supplier: Lumina Sensors India
Address: 55 Laser Street, Pune, Maharashtra - 411013
GSTIN: 27BBBBB2222B1Z2
Bank Details: State Bank of India, Account #SB-902234, Pune Branch (IFSC: SBIN000102)

Bill To: Alpha Robotics Corp
Address: 12 Tech Park, Bangalore, Karnataka - 560066
GSTIN: 29AAAAA1111A1Z1

Billing Description:
1. LIDAR Rangefinder L-04 (LIDAR-L04)
   Qty: 15 units | Unit Price: $800.00 | Total: $12,000.00
2. Guidance Module G-88 (GUIDE-G88)
   Qty: 15 units | Unit Price: $600.00 | Total: $9,000.00

Subtotal: $21,000.00
5% Contract Discount: -$1,050.00
Taxable Value: $19,950.00
IGST (18%): $3,591.00
Total Amount Due: $23,541.00

Please execute payment to SBI Bank Ref SB-902234 before August 14, 2026.""",
            },
            {
                "filename": "06_receipt_lumina_8022.txt",
                "category": "PAYMENT_RECEIPT",
                "content": """PAYMENT RECEIPT (REC-LUM-8022)
Date: July 18, 2026
Invoice Reference: INV-LUM-2026-402
Purchase Order Ref: PO-ALPHA-8822

Supplier: Lumina Sensors India
Address: 55 Laser Street, Pune, Maharashtra - 411013
GSTIN: 27BBBBB2222B1Z2

Received From: Alpha Robotics Corp
Address: 12 Tech Park, Bangalore, Karnataka - 560066
GSTIN: 29AAAAA1111A1Z1

Payment Transactions Details:
Invoice Number: INV-LUM-2026-402
Paid Amount: $23,541.00
Payment Date: July 17, 2026
Payment Channel: Wire Transfer / NEFT (Bank Transaction Ref: FT-HDFC-902213)
Outstanding Balance Due: $0.00 (Fully Settled)""",
            },
        ]
        schema = {
            "name": "Procurement 3-Way Billing Schema",
            "description": "Standard B2B invoice and purchase order fields",
            "schema_definition": {
                "type": "object",
                "properties": {
                    "invoice_number": {"type": "string"},
                    "po_reference": {"type": "string"},
                    "supplier": {"type": "string"},
                    "total_value": {"type": "number"},
                },
            },
        }
        return docs, schema

    elif domain == "customer_b":
        docs = [
            {
                "filename": "01_rfq_beta_2026_11.txt",
                "category": "QUOTATION",
                "content": """REQUEST FOR QUOTATION (RFQ)
RFQ ID: RFQ-BETA-2026-11
Date: August 01, 2026

Customer: Beta Pharma Solutions
Address: 40 Bio Valley, Hyderabad, Telangana - 500090
GSTIN: 36AAAAA3333A1Z3
Contact: Dr. Anjali Rao (Director of Laboratory Operations)
Email: anjali.rao@betapharma.com

Supplier: Apex Lab Equipment Ltd
Address: 88 Science Way, Mumbai, Maharashtra - 400011
GSTIN: 27CCCCC4444C1Z4
Contact: Mr. David Carter (Senior Account Manager)

Beta Pharma Solutions requests pricing and lead time details for:
1. Centrifuge Model C-10 (Product ID: CENT-C10) - Quantity: 5 units
2. Chillers Model R-50 (Product ID: CHIL-R50) - Quantity: 5 units

Delivery requirements: DDP Hyderabad Laboratory, required by August 20, 2026.
Payment Terms: Net 30 days.""",
            },
            {
                "filename": "02_quotation_apex_88.txt",
                "category": "QUOTATION",
                "content": """OFFICIAL QUOTATION (QUO-APEX-2026-88)
Date: August 03, 2026
RFQ Reference: RFQ-BETA-2026-11

Supplier: Apex Lab Equipment Ltd
Address: 88 Science Way, Mumbai, Maharashtra - 400011
GSTIN: 27CCCCC4444C1Z4
Contact: Mr. David Carter

Customer: Beta Pharma Solutions
Address: 40 Bio Valley, Hyderabad, Telangana - 500090
GSTIN: 36AAAAA3333A1Z3
Contact: Dr. Anjali Rao

Pricing Proposal details:
1. Centrifuge C-10 (CENT-C10)
   Qty: 5 units | Unit Price: $3,000.00 | Total: $15,000.00
2. Chiller R-50 (CHIL-R50)
   Qty: 5 units | Unit Price: $2,000.00 | Total: $10,000.00

Subtotal: $25,000.00
Integrated GST (IGST @ 18%): $4,500.00
Grand Total (inclusive of IGST): $29,500.00

Validity: Valid until August 31, 2026.
Lead Time: 7 calendar days.""",
            },
            {
                "filename": "03_purchase_order_beta_7733.txt",
                "category": "PURCHASE_ORDER",
                "content": """PURCHASE ORDER (PO-BETA-7733)
Date: August 05, 2026
Quotation Reference: QUO-APEX-2026-88

Customer: Beta Pharma Solutions
Address: 40 Bio Valley, Hyderabad, Telangana - 500090
GSTIN: 36AAAAA3333A1Z3
Contact: Dr. Anjali Rao

Supplier: Apex Lab Equipment Ltd
Address: 88 Science Way, Mumbai, Maharashtra - 400011
GSTIN: 27CCCCC4444C1Z4
Contact: Mr. David Carter

Please ship the following items per quotation QUO-APEX-2026-88:

Line Items:
1. Centrifuge C-10 (CENT-C10)
   Qty: 5 units | Unit Price: $3,000.00 | Total: $15,000.00
2. Chiller R-50 (CHIL-R50)
   Qty: 5 units | Unit Price: $2,000.00 | Total: $10,000.00

Taxable Subtotal: $25,000.00
IGST (18%): $4,500.00
Total Value: $29,500.00

Billing instructions: Net 30 days. Bill to Beta Pharma Solutions.""",
            },
            {
                "filename": "04_delivery_note_apex_0022.txt",
                "category": "DELIVERY_NOTE",
                "content": """DELIVERY CHALLAN & NOTE (DN-APEX-0022)
Date: August 10, 2026
Purchase Order Ref: PO-BETA-7733

Supplier: Apex Lab Equipment Ltd
Address: 88 Science Way, Mumbai, Maharashtra - 400011
GSTIN: 27CCCCC4444C1Z4

Ship To: Beta Pharma Solutions
Address: 40 Bio Valley, Hyderabad, Telangana - 500090
GSTIN: 36AAAAA3333A1Z3

Carrier: Quick Cold Chain Logistics
Tracking Number: TRK-APEX-882

Delivered Items:
1. Centrifuge C-10 (CENT-C10) - Quantity: 5 units
2. Chiller R-50 (CHIL-R50) - Quantity: 5 units

Verified: All units delivered undamaged.
Received By: Dr. Anjali Rao (Director of Laboratory Operations).""",
            },
            {
                "filename": "05_invoice_apex_78.txt",
                "category": "INVOICE",
                "content": """TAX INVOICE (INV-APEX-2026-78)
Invoice Date: August 12, 2026
Due Date: September 11, 2026
PO Reference: PO-BETA-7733

Supplier: Apex Lab Equipment Ltd
Address: 88 Science Way, Mumbai, Maharashtra - 400011
GSTIN: 27CCCCC4444C1Z4
Bank Details: ICICI Bank, Account #ICICI-992233, Mumbai Branch (IFSC: ICIC0000104)

Bill To: Beta Pharma Solutions
Address: 40 Bio Valley, Hyderabad, Telangana - 500090
GSTIN: 36AAAAA3333A1Z3

Billing Description:
1. Centrifuge C-10 (CENT-C10)
   Qty: 5 units | Unit Price: $3,000.00 | Total: $15,000.00
2. Chiller R-50 (CHIL-R50)
   Qty: 5 units | Unit Price: $2,000.00 | Total: $10,000.00

Taxable Subtotal: $25,000.00
IGST (18%): $4,500.00
Total Invoice Value Due: $29,500.00

Please pay to ICICI Account #ICICI-992233 within 30 days.""",
            },
            {
                "filename": "06_receipt_apex_9922.txt",
                "category": "PAYMENT_RECEIPT",
                "content": """PAYMENT RECEIPT (REC-APEX-9922)
Date: August 15, 2026
Invoice Reference: INV-APEX-2026-78
Purchase Order Ref: PO-BETA-7733

Supplier: Apex Lab Equipment Ltd
Address: 88 Science Way, Mumbai, Maharashtra - 400011
GSTIN: 27CCCCC4444C1Z4

Received From: Beta Pharma Solutions
Address: 40 Bio Valley, Hyderabad, Telangana - 500090
GSTIN: 36AAAAA3333A1Z3

Payment transaction confirmation:
Amount Received: $29,500.00
Invoice: INV-APEX-2026-78
Payment Date: August 14, 2026
Reference: Wire Transfer / NEFT (Transaction Ref: FT-ICICI-110293)
Balance Due: $0.00 (Fully Settled)""",
            },
        ]
        schema = {
            "name": "Procurement 3-Way Billing Schema",
            "description": "Standard B2B invoice and purchase order fields",
            "schema_definition": {
                "type": "object",
                "properties": {
                    "invoice_number": {"type": "string"},
                    "po_reference": {"type": "string"},
                    "supplier": {"type": "string"},
                    "total_value": {"type": "number"},
                },
            },
        }
        return docs, schema

    elif domain == "legal":
        docs = [
            {
                "filename": "01_master_services_agreement.txt",
                "category": "CONTRACT",
                "content": """MASTER SERVICES AGREEMENT (MSA-2026-90)
This Master Services Agreement is entered into on January 10, 2026,
between Nexus AI Inc ("Provider") and Global Logistics LLC ("Client").
Scope of Services: Provider shall deliver AI Document Intelligence SaaS infrastructure.
Term: 24 months ending January 10, 2028.
Contract Value: $120,000.00 annual subscription.
Section 8.2 Indemnification: Provider agrees to indemnify Client
up to $1,000,000 for IP claims.
Signatures: CEO Nexus AI, VP Procurement Global Logistics.""",
            },
            {
                "filename": "02_non_disclosure_agreement.txt",
                "category": "CONTRACT",
                "content": """MUTUAL NON-DISCLOSURE AGREEMENT (NDA-2026-11)
Date: January 12, 2026.
Parties: Nexus AI Inc and Global Logistics LLC.
Purpose: Confidential evaluation of AI extraction algorithms and
customer telemetry data.
Confidentiality Period: 5 years from disclosure date.""",
            },
            {
                "filename": "03_amendment_01.txt",
                "category": "CONTRACT",
                "content": """AMENDMENT #1 TO MASTER SERVICES AGREEMENT (AMEND-2026-01)
Reference MSA: MSA-2026-90 dated January 10, 2026.
Effective Date: March 01, 2026.
Modification: Expands API rate limits to 50,000 requests/min and
adds HNSW vector search SLA.
Additional Value: +$15,000.00 annual addon.""",
            },
            {
                "filename": "04_compliance_audit.txt",
                "category": "CONTRACT",
                "content": """LEGAL COMPLIANCE AUDIT REPORT (AUDIT-2026-L)
Date: June 15, 2026.
Audit Target: MSA-2026-90 and AMEND-2026-01 between Nexus AI and Global Logistics.
Finding: Full compliance verified. Indemnification insurance cert active.
SOC 2 Type II compliance passed.""",
            },
        ]
        schema = {
            "name": "Legal Contract & NDA Schema",
            "description": "Target fields for legal contracts and amendments",
            "schema_definition": {
                "type": "object",
                "properties": {
                    "contract_id": {"type": "string"},
                    "provider": {"type": "string"},
                    "client": {"type": "string"},
                    "effective_date": {"type": "string"},
                    "contract_value": {"type": "number"},
                },
            },
        }
        return docs, schema

    elif domain == "medical":
        docs = [
            {
                "filename": "01_patient_admission.txt",
                "category": "UNKNOWN",
                "content": """PATIENT ADMISSION FORM (ADM-8892)
Date: July 01, 2026.
Facility: Metro General Hospital.
Patient Name: John Doe (DOB: 1981-04-12, Sex: Male).
Attending Physician: Dr. Sarah Jenkins, MD.
Primary Complaint: Severe shortness of breath and chest tightness.""",
            },
            {
                "filename": "02_lab_results.txt",
                "category": "UNKNOWN",
                "content": """DIAGNOSTIC LAB RESULTS (LAB-2026-88)
Patient: John Doe (ID: ADM-8892). Date: July 02, 2026.
WBC Count: 12.4 x10^3/uL (Elevated).
CRP Level: 45 mg/L (High Inflammation).
Blood Oxygen Saturation (SpO2): 92% on room air.""",
            },
            {
                "filename": "03_clinical_diagnosis.txt",
                "category": "UNKNOWN",
                "content": """CLINICAL DIAGNOSIS & ASSESSMENT (DX-2026-99)
Patient: John Doe (ID: ADM-8892). Date: July 03, 2026.
Diagnosis: Acute Bacterial Bronchitis (ICD-10 J20.9).
Prescribed Treatment: Azithromycin 500mg daily for 5 days, Supplemental O2.""",
            },
            {
                "filename": "04_discharge_summary.txt",
                "category": "UNKNOWN",
                "content": """PATIENT DISCHARGE SUMMARY (DIS-2026-104)
Patient: John Doe (ID: ADM-8892). Discharge Date: July 07, 2026.
Condition at Discharge: Improved, SpO2 98% room air.
Follow-up: Outpatient pulmonology appointment in 14 days.""",
            },
        ]
        schema = {
            "name": "Medical EHR Record Schema",
            "description": "Patient clinical fields and diagnostic outputs",
            "schema_definition": {
                "type": "object",
                "properties": {
                    "patient_name": {"type": "string"},
                    "admission_date": {"type": "string"},
                    "diagnosis": {"type": "string"},
                    "attending_physician": {"type": "string"},
                },
            },
        }
        return docs, schema

    elif domain == "financial":
        docs = [
            {
                "filename": "01_balance_sheet.txt",
                "category": "UNKNOWN",
                "content": """CONSOLIDATED BALANCE SHEET (FIN-2025-Q4)
Entity: Apex Capital Corp. Reporting Period: FY 2025.
Total Assets: $45,200,000.00.
Total Liabilities: $12,800,000.00.
Stockholder Equity: $32,400,000.00.""",
            },
            {
                "filename": "02_audit_report.txt",
                "category": "UNKNOWN",
                "content": """INDEPENDENT AUDITOR'S REPORT (AUD-2026-PWC)
Auditor: PwC Advisory LLP. Client: Apex Capital Corp.
Opinion: Unqualified Clean Audit Opinion for FY 2025.
Material Weaknesses: None detected.""",
            },
            {
                "filename": "03_tax_filing.txt",
                "category": "UNKNOWN",
                "content": """CORPORATE TAX RETURN STATEMENT (FORM-1120-2025)
Entity: Apex Capital Corp (EIN: 99-8877112).
Taxable Income: $6,450,000.00.
Federal Tax Liability: $1,354,500.00.""",
            },
            {
                "filename": "04_wire_remittance.txt",
                "category": "UNKNOWN",
                "content": """FEDWIRE REMITTANCE CONFIRMATION (WIRE-2026-778)
Sender: Apex Capital Corp. Recipient: US Internal Revenue Service.
Date: April 15, 2026.
Amount Paid: $1,354,500.00.""",
            },
        ]
        schema = {
            "name": "Financial Audit Schema",
            "description": "Balance sheet metrics and audit confirmation parameters",
            "schema_definition": {
                "type": "object",
                "properties": {
                    "entity_name": {"type": "string"},
                    "total_assets": {"type": "number"},
                    "tax_liability": {"type": "number"},
                    "auditor": {"type": "string"},
                },
            },
        }
        return docs, schema

    elif domain == "research":
        docs = [
            {
                "filename": "01_arxiv_rag_survey.txt",
                "category": "UNKNOWN",
                "content": """ARXIV PREPRINT: ADVANCES IN EXPLAINABLE RAG PARADIGMS
Authors: Dr. Antigravity & AI Research Team. Date: June 2026.
Abstract: We present an end-to-end evaluation of Retrieval-Augmented
Generation systems using HNSW vector indexing and
dynamic Pydantic schema extractions.""",
            },
            {
                "filename": "02_hnsw_indexing_paper.txt",
                "category": "UNKNOWN",
                "content": """RESEARCH PAPER: EFFICIENT NEAREST NEIGHBOR SEARCH VIA HNSW
Authors: Malkov & Yashunin. Published: 2020.
Abstract: Hierarchical Navigable Small World graphs achieve logarithmic
scaling and high recall for vector cosine distance operations.""",
            },
            {
                "filename": "03_matryoshka_embeddings.txt",
                "category": "UNKNOWN",
                "content": """RESEARCH PAPER: MATRYOSHKA REPRESENTATION LEARNING
Authors: Kusupati et al. Published: 2022.
Abstract: Matryoshka embeddings compress vector representations across
dimensions while preserving semantic retrieval accuracy.""",
            },
        ]
        schema = {
            "name": "Research Literature Schema",
            "description": "Academic paper metadata and methodology concepts",
            "schema_definition": {
                "type": "object",
                "properties": {
                    "paper_title": {"type": "string"},
                    "authors": {"type": "string"},
                    "publication_year": {"type": "number"},
                },
            },
        }
        return docs, schema

    else:
        # Default: Procurement Lifecycle (6 files)
        docs = [
            {
                "filename": "01_quotation.txt",
                "category": "QUOTATION",
                "content": """QUOTATION (QUO-2026-104)
Date: July 01, 2026.
Supplier: Acme Energy Corp (GST: 22AAAAA0000A1Z5).
Customer: Global Logistics LLC.
Item: Industrial Solar Inverter Unit X500 (Qty: 10). Total Price: $13,500.00.
Valid Until: July 31, 2026.""",
            },
            {
                "filename": "02_purchase_order.txt",
                "category": "PURCHASE_ORDER",
                "content": """PURCHASE ORDER (PO-8877)
Date: July 03, 2026.
Supplier: Acme Energy Corp.
Customer: Global Logistics LLC.
Reference: QUO-2026-104.
Ordered Items: Solar Inverter Unit X500 (Qty: 10 @ $1,350/unit = $13,500.00).
Payment Terms: Net 30.""",
            },
            {
                "filename": "03_delivery_note.txt",
                "category": "DELIVERY_NOTE",
                "content": """DELIVERY NOTE (DN-0092)
Date: July 08, 2026.
PO Reference: PO-8877.
Carrier: Apex Express Freight.
Delivered Goods: 10x Solar Inverter Units X500.
Received In Good Condition: Signed by Logistics Manager.""",
            },
            {
                "filename": "04_invoice.txt",
                "category": "INVOICE",
                "content": """COMMERCIAL INVOICE (INV-2026-90)
Date: July 11, 2026.
Supplier: Acme Energy Corp.
Bill To: Global Logistics LLC.
PO Reference: PO-8877.
Total Amount Due: $13,500.00.
Due Date: August 10, 2026.""",
            },
            {
                "filename": "05_receipt.txt",
                "category": "PAYMENT_RECEIPT",
                "content": """PAYMENT RECEIPT (REC-2026-44)
Date: July 15, 2026.
Received From: Global Logistics LLC.
Payment Method: Wire Transfer (Ref #TX-99001).
Paid Amount: $13,500.00 against Invoice INV-2026-90.
Balance Due: $0.00.""",
            },
            {
                "filename": "06_warranty.txt",
                "category": "WARRANTY",
                "content": """COMMERCIAL WARRANTY CERTIFICATE (WAR-2026-99)
Issue Date: July 16, 2026.
Product: Solar Inverter Units X500 (Serial #X500-01 to #X500-10).
Coverage: 5-Year Full Replacement Warranty under PO-8877.""",
            },
        ]
        schema = {
            "name": "Procurement 3-Way Billing Schema",
            "description": "Standard B2B invoice and purchase order fields",
            "schema_definition": {
                "type": "object",
                "properties": {
                    "invoice_number": {"type": "string"},
                    "po_reference": {"type": "string"},
                    "supplier": {"type": "string"},
                    "total_value": {"type": "number"},
                },
            },
        }
        return docs, schema
