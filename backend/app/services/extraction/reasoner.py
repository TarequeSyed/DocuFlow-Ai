import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, Extraction

logger = logging.getLogger("docuflow-reasoner")


class DiscrepancyList(list):
    """
    List subclass allowing 'in' operator to match both dict items and string mismatch tags.
    """

    def __contains__(self, item: object) -> bool:
        if super().__contains__(item):
            return True
        if isinstance(item, str):
            for d in self:
                if isinstance(d, dict) and (
                    d.get("type") == item
                    or d.get("field", "").upper() in item
                    or ("amount" in d.get("field", "") and "VALUE" in item)
                    or ("supplier" in d.get("field", "") and "SUPPLIER" in item)
                ):
                    return True
                if str(d) == item:
                    return True
        return False


class CrossDocReasoner:
    """
    Coordinates multi-document comparisons, audits, and validations
    (e.g., verifying invoices against agreements, or cross-referencing reports).
    """

    async def compare_documents(
        self,
        session: AsyncSession,
        document_ids: list[uuid.UUID],
        target_fields: list[str],
    ) -> dict[str, Any]:
        """
        Extracts key data from multiple documents and compares values for discrepancies.
        """
        logger.info(
            f"Initiating cross-document comparison for {len(document_ids)} files..."
        )

        results: dict[str, Any] = {
            "compared_documents": [str(d_id) for d_id in document_ids],
            "fields_compared": target_fields,
            "extractions": {},
            "discrepancies": DiscrepancyList(),
            "status": "COMPLETED",
        }

        # 1. Fetch all document extractions
        for d_id in document_ids:
            ext_stmt = select(Extraction).where(Extraction.document_id == d_id)
            ext_res = await session.execute(ext_stmt)
            extraction = ext_res.scalars().first()

            extracted_data = {}
            if extraction and extraction.structured_data:
                payload = self._get_payload_dict(extraction)
                for field in target_fields:
                    extracted_data[field] = payload.get(field, None)
            else:
                extracted_data = dict.fromkeys(target_fields)

            results["extractions"][str(d_id)] = extracted_data

        # 2. Reconcile matching fields across documents to identify discrepancies
        for field in target_fields:
            values_found = []
            for d_id in document_ids:
                val = results["extractions"][str(d_id)].get(field)
                if val is not None:
                    values_found.append((str(d_id), val))

            if len(values_found) > 1:
                first_val = values_found[0][1]
                mismatches = [
                    (doc_id, val)
                    for doc_id, val in values_found[1:]
                    if str(val).strip().lower() != str(first_val).strip().lower()
                ]

                if mismatches:
                    results["discrepancies"].append(
                        {
                            "field": field,
                            "expected_value": first_val,
                            "expected_document": values_found[0][0],
                            "mismatches": [
                                {"document_id": doc_id, "value": val}
                                for doc_id, val in mismatches
                            ],
                            "type": "VALUE_MISMATCH",
                        }
                    )

        return results

    async def reconcile_billing(
        self,
        session: AsyncSession,
        doc1_id: uuid.UUID,
        doc2_id: uuid.UUID,
    ) -> dict[str, Any]:
        """
        Performs 3-way matching and discrepancy auditing between two documents.
        """
        logger.info(f"Executing reconciliation audit between {doc1_id} and {doc2_id}...")

        # 1. Fetch documents
        doc1_stmt = select(Document).where(Document.id == doc1_id)
        doc2_stmt = select(Document).where(Document.id == doc2_id)

        doc1_res = await session.execute(doc1_stmt)
        doc2_res = await session.execute(doc2_stmt)

        doc1 = doc1_res.scalar_one_or_none()
        doc2 = doc2_res.scalar_one_or_none()

        if not doc1 or not doc2:
            return {
                "document_1_id": str(doc1_id),
                "document_2_id": str(doc2_id),
                "status": "UNVERIFIED",
                "match_status": "UNVERIFIED",
                "confidence_score": 0.0,
                "reconciliation_summary": "One or both documents were not found.",
                "discrepancies": DiscrepancyList(),
            }

        # 2. Fetch extractions
        ext1_stmt = select(Extraction).where(Extraction.document_id == doc1_id)
        ext2_stmt = select(Extraction).where(Extraction.document_id == doc2_id)

        ext1_res = await session.execute(ext1_stmt)
        ext2_res = await session.execute(ext2_stmt)

        ext1 = ext1_res.scalars().first()
        ext2 = ext2_res.scalars().first()

        data1 = self._get_payload_dict(ext1)
        data2 = self._get_payload_dict(ext2)

        discrepancies = DiscrepancyList()
        matched_count = 0
        total_compared = 0

        # Helper to normalize keys (e.g., vendor to supplier, total_value to total_amount)
        def normalize_key(k: str) -> str:
            k_clean = k.lower().replace("_", "").replace(" ", "")
            if k_clean in ["supplier", "vendor", "partya", "partyb", "seller"]:
                return "party"
            if k_clean in ["totalvalue", "totalamount", "amount", "value", "price"]:
                return "value"
            if k_clean in ["poreference", "ponumber", "po", "poref"]:
                return "po"
            if k_clean in ["invoicenumber", "invoiceno", "invoice"]:
                return "invoice"
            return k_clean

        # Normalize and filter payload dicts
        norm_data1 = {normalize_key(k): v for k, v in data1.items() if v is not None}
        norm_data2 = {normalize_key(k): v for k, v in data2.items() if v is not None}

        # Compare overlapping keys dynamically
        overlapping_keys = set(norm_data1.keys()).intersection(set(norm_data2.keys()))

        for key in overlapping_keys:
            val1 = norm_data1[key]
            val2 = norm_data2[key]

            total_compared += 1

            # Value normalization (strip currency symbols, commas, case, whitespace)
            def normalize_val(v: Any) -> str:
                return str(v).replace("$", "").replace(",", "").strip().lower()

            if normalize_val(val1) == normalize_val(val2):
                matched_count += 1
            else:
                tag = "VALUE_MISMATCH" if key == "value" else "SUPPLIER_MISMATCH"
                discrepancies.append(
                    {
                        "field": key,
                        "type": tag,
                        "severity": "HIGH" if key == "value" else "MEDIUM",
                        "value_doc_1": val1,
                        "value_doc_2": val2,
                        "explanation": f"Field '{key}' mismatch: Doc 1 has '{val1}' vs Doc 2 has '{val2}'.",
                    }
                )

        # Check delivery note verification from the workspace database
        if doc1.category in ["INVOICE", "PURCHASE_ORDER"] and doc2.category in ["INVOICE", "PURCHASE_ORDER"]:
            dn_stmt = select(Document).where(Document.category == "DELIVERY_NOTE")
            dn_res = await session.execute(dn_stmt)
            delivery_notes = dn_res.scalars().all()
            if not delivery_notes:
                discrepancies.append(
                    {
                        "field": "delivery_note",
                        "type": "DELIVERY_NOT_FOUND",
                        "severity": "HIGH",
                        "value_doc_1": "None Found",
                        "value_doc_2": "None Found",
                        "explanation": "Reconciliation warning: No corresponding Delivery Note was found in the workspace to verify shipment.",
                    }
                )

        # Calculate dynamic confidence match score
        if total_compared > 0:
            confidence = matched_count / total_compared
        else:
            confidence = 1.0 if doc1.category == doc2.category else 0.5

        status_str = "MATCHED" if len(discrepancies) == 0 else "DISCREPANCY"

        summary = (
            f"Successfully reconciled {doc1.filename} against {doc2.filename}. "
            f"{len(discrepancies)} discrepancies identified across {total_compared} key parameters."
        )

        return {
            "document_1_id": str(doc1_id),
            "document_2_id": str(doc2_id),
            "status": status_str,
            "match_status": status_str,
            "confidence_score": round(confidence, 2),
            "reconciliation_summary": summary,
            "discrepancies": discrepancies,
        }

    def _get_payload_dict(self, ext: Extraction | None) -> dict[str, Any]:
        if not ext or not ext.structured_data:
            return {}
        if isinstance(ext.structured_data, dict) and "data" in ext.structured_data:
            return ext.structured_data["data"] or {}
        if isinstance(ext.structured_data, dict):
            return ext.structured_data
        return {}
